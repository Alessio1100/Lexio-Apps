import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { learnedMap } from "../../../../lib/learn";
import { normMerchant } from "../../../../lib/fixed";
import { classifyWithGemini, summarizeRules } from "../../../../lib/gemini";
import { deriveMerchant } from "../../../../lib/enablebanking";

export const maxDuration = 60;

const displayName = (t) =>
  deriveMerchant(t.raw, t.description) || t.merchant_name || (t.description || "").slice(0, 40);

// Classifica un LOTTO di transazioni (per id): memoria per esercente + una
// singola chiamata Gemini per tutto il lotto. Ritorna gli esiti e, in caso di
// errore Gemini (es. 429), lo stato e il tempo di attesa suggerito.
export async function POST(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { ids } = await request.json();
  if (!Array.isArray(ids) || !ids.length)
    return NextResponse.json({ error: "ids mancanti" }, { status: 400 });

  const [{ data: categories }, { data: rules }, { data: manual }, { data: txs }] =
    await Promise.all([
      supabase.from("categories").select("id,name,is_income,bucket").eq("user_id", user.id),
      supabase.from("rules").select("*").eq("user_id", user.id),
      supabase
        .from("transactions")
        .select("merchant_name,category_id,category_source")
        .eq("user_id", user.id)
        .eq("category_source", "manual"),
      supabase
        .from("transactions")
        .select(
          "id,merchant_name,description,amount,currency,is_foreign,category_id,booking_date,raw,bank_connections(institution_name)"
        )
        .eq("user_id", user.id)
        .in("id", ids),
    ]);

  const nameById = Object.fromEntries((categories || []).map((c) => [c.id, c.name]));
  const results = [];

  // 1) memoria per esercente
  const map = learnedMap(manual || []);
  const pending = [];
  for (const t of txs || []) {
    if (t.category_id) continue; // già categorizzata
    const k = normMerchant(t);
    if (k && map.has(k)) {
      const catId = map.get(k);
      await supabase
        .from("transactions")
        .update({ category_id: catId, category_source: "memory", rule_id: null })
        .eq("id", t.id)
        .eq("user_id", user.id);
      results.push({ id: t.id, name: displayName(t), amount: t.amount, date: t.booking_date, category: nameById[catId], source: "memory" });
    } else {
      pending.push(t);
    }
  }

  // 2) Gemini per il resto del lotto (una sola richiesta)
  if (pending.length && process.env.GEMINI_API_KEY) {
    const catByName = new Map((categories || []).map((c) => [c.name.toLowerCase().trim(), c.id]));
    const seen = new Set();
    const examples = [];
    for (const m of manual || []) {
      const mk = normMerchant(m);
      if (mk && !seen.has(mk)) {
        seen.add(mk);
        examples.push({ merchant: m.merchant_name || "", category: nameById[m.category_id] || "" });
      }
      if (examples.length >= 40) break;
    }
    try {
      const ai = await classifyWithGemini({
        transactions: pending.map((t) => ({
          id: t.id,
          merchant: t.merchant_name,
          description: t.description,
          amount: t.amount,
          currency: t.currency,
          foreign: t.is_foreign,
          bank: t.bank_connections?.institution_name || "",
        })),
        categories: categories || [],
        examples,
        rulesText: summarizeRules(rules, nameById),
      });
      const aiById = new Map(ai.map((r) => [r.id, r.category]));
      for (const t of pending) {
        const catName = aiById.get(t.id) || "";
        const catId = catByName.get(catName.toLowerCase().trim());
        const row = { id: t.id, name: displayName(t), amount: t.amount, date: t.booking_date };
        if (catId) {
          await supabase
            .from("transactions")
            .update({ category_id: catId, category_source: "ai", rule_id: null })
            .eq("id", t.id)
            .eq("user_id", user.id);
          results.push({ ...row, category: nameById[catId], source: "ai" });
        } else {
          results.push({ ...row, source: "ai", category: "" }); // incerta
        }
      }
    } catch (e) {
      // ritorna comunque i risultati da memoria + i pendenti come non risolti
      return NextResponse.json({
        results,
        pendingIds: pending.map((t) => t.id),
        error: e.message,
        status: e.status || null,
        retryDelay: e.retryDelay || null,
      });
    }
  } else if (pending.length) {
    return NextResponse.json({
      results,
      pendingIds: pending.map((t) => t.id),
      error: "GEMINI_API_KEY non configurata",
    });
  }

  return NextResponse.json({ results });
}
