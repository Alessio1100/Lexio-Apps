import { NextResponse } from "next/server";
import { getUser } from "../../../../lib/auth";
import { learnedMap } from "../../../../lib/learn";
import { normMerchant } from "../../../../lib/fixed";
import { classifyWithGemini, summarizeRules } from "../../../../lib/gemini";
import { deriveMerchant } from "../../../../lib/enablebanking";

export const maxDuration = 30;

// Classifica UNA transazione: prima memoria per esercente, poi Gemini.
// Ritorna esito e (in caso di problema con Gemini) il messaggio d'errore.
export async function POST(request) {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id mancante" }, { status: 400 });

  const { data: tx } = await supabase
    .from("transactions")
    .select(
      "id,merchant_name,description,amount,currency,is_foreign,category_id,category_source,booking_date,raw,bank_connections(institution_name)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!tx) return NextResponse.json({ error: "transazione non trovata" }, { status: 404 });

  const name =
    deriveMerchant(tx.raw, tx.description) || tx.merchant_name || (tx.description || "").slice(0, 40);
  const base = { id: tx.id, name, amount: tx.amount, date: tx.booking_date };

  if (tx.category_id) return NextResponse.json({ ...base, skipped: true });

  const [{ data: categories }, { data: rules }, { data: manual }] = await Promise.all([
    supabase.from("categories").select("id,name,is_income,bucket").eq("user_id", user.id),
    supabase.from("rules").select("*").eq("user_id", user.id),
    supabase
      .from("transactions")
      .select("merchant_name,category_id,category_source")
      .eq("user_id", user.id)
      .eq("category_source", "manual"),
  ]);

  const nameById = Object.fromEntries((categories || []).map((c) => [c.id, c.name]));

  // 1) memoria per esercente
  const map = learnedMap(manual || []);
  const k = normMerchant(tx);
  if (k && map.has(k)) {
    const catId = map.get(k);
    await supabase
      .from("transactions")
      .update({ category_id: catId, category_source: "memory", rule_id: null })
      .eq("id", tx.id)
      .eq("user_id", user.id);
    return NextResponse.json({ ...base, category: nameById[catId], source: "memory" });
  }

  // 2) Gemini
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ ...base, error: "GEMINI_API_KEY non configurata" });
  }
  try {
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
    const res = await classifyWithGemini({
      transactions: [
        {
          id: tx.id,
          merchant: tx.merchant_name,
          description: tx.description,
          amount: tx.amount,
          currency: tx.currency,
          foreign: tx.is_foreign,
          bank: tx.bank_connections?.institution_name || "",
        },
      ],
      categories: categories || [],
      examples,
      rulesText: summarizeRules(rules, nameById),
    });
    const catName = res[0]?.category || "";
    const catId = catByName.get(catName.toLowerCase().trim());
    if (!catId) return NextResponse.json({ ...base, source: "ai", category: "" }); // incerta
    await supabase
      .from("transactions")
      .update({ category_id: catId, category_source: "ai", rule_id: null })
      .eq("id", tx.id)
      .eq("user_id", user.id);
    return NextResponse.json({ ...base, category: nameById[catId], source: "ai" });
  } catch (e) {
    return NextResponse.json({ ...base, error: e.message });
  }
}
