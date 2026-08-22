import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { createAdminClient } from "../../../lib/supabase/admin";
import {
  getAccountTransactions,
  normalizeTransaction,
} from "../../../lib/enablebanking";
import { categorize } from "../../../lib/categorize";

export const maxDuration = 60;

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
