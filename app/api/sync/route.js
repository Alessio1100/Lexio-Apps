import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { createAdminClient } from "../../../lib/supabase/admin";
import {
  getAccountTransactions,
  normalizeTransaction,
} from "../../../lib/enablebanking";
import { categorize } from "../../../lib/categorize";
import { detectTransferIds, ensureTransferCategory } from "../../../lib/transfers";
import { idsToMarkFixed } from "../../../lib/fixed";
import { learnedAssignments } from "../../../lib/learn";

export const maxDuration = 60;

// Applica la memoria per esercente (categorie imparate dalle correzioni manuali)
// alle transazioni non ancora categorizzate.
async function markLearned(admin, userId) {
  const { data: txs } = await admin
    .from("transactions")
    .select("id,merchant_name,category_id,category_source")
    .eq("user_id", userId);
  const assignments = learnedAssignments(txs || []);
  for (const a of assignments) {
    await admin
      .from("transactions")
      .update({ category_id: a.category_id, category_source: "memory", rule_id: null })
      .eq("id", a.id);
  }
}

// Propaga il flag "spesa fissa" alle transazioni della stessa controparte.
async function markFixed(admin, userId) {
  const { data: txs } = await admin
    .from("transactions")
    .select("id,merchant_name,is_fixed")
    .eq("user_id", userId);
  const ids = idsToMarkFixed(txs || []);
  for (const id of ids) {
    await admin.from("transactions").update({ is_fixed: true }).eq("id", id);
  }
}

// Marca i giroconti interni (uscita/entrata di pari importo tra conti diversi)
// con la categoria "Trasferimenti", così restano esclusi dai conteggi.
async function markTransfers(admin, userId) {
  const transferCatId = await ensureTransferCategory(admin, userId);
  if (!transferCatId) return;
  const { data: txs } = await admin
    .from("transactions")
    .select("id,amount,connection_id,booking_date,value_date,category_source,category_id")
    .eq("user_id", userId);
  const ids = detectTransferIds(txs || []);
  const toUpdate = (txs || []).filter(
    (t) =>
      ids.has(t.id) &&
      t.category_source !== "manual" &&
      t.category_id !== transferCatId
  );
  for (const t of toUpdate) {
    await admin
      .from("transactions")
      .update({ category_id: transferCatId, rule_id: null, category_source: "transfer" })
      .eq("id", t.id);
  }
}

// Sincronizza tutte le connessioni "linked" di un utente.
async function syncUser(admin, userId) {
  const [{ data: connections }, { data: rules }] = await Promise.all([
    admin
      .from("bank_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "linked")
      .not("gc_account_id", "is", null),
    admin.from("rules").select("*").eq("user_id", userId),
  ]);

  let inserted = 0;
  const errors = [];
  // recupera 90 giorni di storico (dedup gestita dall'upsert)
  const dateFrom = new Date(Date.now() - 90 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  for (const conn of connections || []) {
    try {
      let continuationKey = null;
      const rows = [];
      do {
        const resp = await getAccountTransactions(conn.gc_account_id, {
          dateFrom,
          continuationKey,
        });
        for (const raw of resp.transactions || []) {
          const norm = normalizeTransaction(raw, {
            connectionId: conn.id,
            userId,
            currency: conn.currency,
          });
          const cat = categorize(
            { ...norm, institution_name: conn.institution_name },
            rules || []
          );
          rows.push({
            ...norm,
            category_id: cat.category_id,
            rule_id: cat.rule_id,
            category_source: cat.category_id ? "rule" : "none",
          });
        }
        continuationKey = resp.continuation_key || null;
      } while (continuationKey);

      if (rows.length) {
        // ignoreDuplicates: le transazioni già presenti (incl. categorie manuali) non vengono toccate
        const { error, count } = await admin
          .from("transactions")
          .upsert(rows, {
            onConflict: "user_id,gc_transaction_id",
            ignoreDuplicates: true,
            count: "exact",
          });
        if (error) throw error;
        inserted += count || 0;
      }

      await admin
        .from("bank_connections")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", conn.id);
    } catch (e) {
      const expired = e.status === 401 || e.status === 403;
      if (expired) {
        await admin
          .from("bank_connections")
          .update({ status: "expired" })
          .eq("id", conn.id);
      }
      errors.push({ connection: conn.id, message: e.message });
    }
  }

  // dopo aver importato tutte le connessioni, individua i giroconti interni
  try {
    await markTransfers(admin, userId);
  } catch (e) {
    errors.push({ step: "transfers", message: e.message });
  }

  // propaga le spese fisse alle ricorrenze della stessa controparte
  try {
    await markFixed(admin, userId);
  } catch (e) {
    errors.push({ step: "fixed", message: e.message });
  }

  // applica la memoria per esercente (categorie imparate a mano)
  try {
    await markLearned(admin, userId);
  } catch (e) {
    errors.push({ step: "learned", message: e.message });
  }

  return { inserted, errors };
}

export async function POST(request) {
  const admin = createAdminClient();

  const authHeader = request.headers.get("authorization") || "";
  const isCron =
    process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (isCron) {
    const { data: conns } = await admin
      .from("bank_connections")
      .select("user_id")
      .eq("status", "linked");
    const userIds = [...new Set((conns || []).map((c) => c.user_id))];
    let total = 0;
    for (const uid of userIds) {
      const r = await syncUser(admin, uid);
      total += r.inserted;
    }
    return NextResponse.json({ ok: true, users: userIds.length, inserted: total });
  }

  const { user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await syncUser(admin, user.id);
  return NextResponse.json({ ok: true, ...result });
}

// Vercel Cron invoca in GET.
export async function GET(request) {
  return POST(request);
}
