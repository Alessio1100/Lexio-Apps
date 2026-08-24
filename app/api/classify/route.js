import { NextResponse } from "next/server";
import { getUser } from "../../../lib/auth";
import { learnedAssignments } from "../../../lib/learn";
import { normMerchant } from "../../../lib/fixed";
import { classifyWithGemini, summarizeRules } from "../../../lib/gemini";
import { deriveMerchant } from "../../../lib/enablebanking";

export const maxDuration = 60;

const displayName = (t) =>
  deriveMerchant(t.raw, t.description) || t.merchant_name || (t.description || "").slice(0, 40);

// Classifica le transazioni non categorizzate:
// 1) memoria per esercente (dalle correzioni manuali) — gratis, locale
// 2) Gemini per gli esercenti ancora sconosciuti, dalle più recenti,
//    usando regole + tipo categoria + contesto (estero/valuta/banca).
export async function POST() {
  const { supabase, user } = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: categories }, { data: rules }, { data: txs }] = await Promise.all([
    supabase.from("categories").select("id,name,is_income,bucket").eq("user_id", user.id),
    supabase.from("rules").select("*").eq("user_id", user.id),
    supabase
      .from("transactions")
      .select(
        "id,merchant_name,description,amount,currency,is_foreign,category_id,category_source,booking_date,raw,bank_connections(institution_name)"
      )
      .eq("user_id", user.id)
      .order("booking_date", { ascending: false }), // dalla più recente
  ]);

  const all = txs || [];
  const byId = new Map(all.map((t) => [t.id, t]));
  const nameById = Object.fromEntries((categories || []).map((c) => [c.id, c.name]));

  // 1) memoria per esercente
  const assignments = learnedAssignments(all);
  const memoryById = new Map(assignments.map((a) => [a.id, a.category_id]));
  await Promise.all(
    assignments.map((a) =>
      supabase
        .from("transactions")
        .update({ category_id: a.category_id, category_source: "memory", rule_id: null })
        .eq("id", a.id)
        .eq("user_id", user.id)
    )
  );
  const results = assignments.map((a) => {
    const t = byId.get(a.id);
    return {
      name: displayName(t),
      amount: t.amount,
      date: t.booking_date,
      category: nameById[a.category_id] || "?",
      source: "memory",
    };
  });

  // 2) Gemini per il resto ancora senza categoria (già ordinato per data desc)
  const remaining = all.filter((t) => !t.category_id && !memoryById.has(t.id));

  let aiError = null;
  if (remaining.length && process.env.GEMINI_API_KEY) {
    const catByName = new Map((categories || []).map((c) => [c.name.toLowerCase().trim(), c.id]));
    const rulesText = summarizeRules(rules, nameById);

    // esempi = come l'utente ha classificato a mano (dedup per controparte)
    const seen = new Set();
    const examples = [];
    for (const t of all) {
      if (t.category_source === "manual" && t.category_id) {
        const k = normMerchant(t);
        if (k && !seen.has(k)) {
          seen.add(k);
          examples.push({ merchant: t.merchant_name || "", category: nameById[t.category_id] || "" });
        }
      }
      if (examples.length >= 40) break;
    }

    try {
      const batch = remaining.slice(0, 200).map((t) => ({
        id: t.id,
        merchant: t.merchant_name,
        description: t.description, // testo originale grezzo (fonte principale)
        amount: t.amount,
        currency: t.currency,
        foreign: t.is_foreign,
        bank: t.bank_connections?.institution_name || "",
      }));
      const aiResults = await classifyWithGemini({
        transactions: batch,
        categories: categories || [],
        examples,
        rulesText,
      });
      await Promise.all(
        aiResults.map(async (r) => {
          const catId = catByName.get((r.category || "").toLowerCase().trim());
          if (!catId) return;
          await supabase
            .from("transactions")
            .update({ category_id: catId, category_source: "ai", rule_id: null })
            .eq("id", r.id)
            .eq("user_id", user.id);
          const t = byId.get(r.id);
          if (t)
            results.push({
              name: displayName(t),
              amount: t.amount,
              date: t.booking_date,
              category: nameById[catId],
              source: "ai",
            });
        })
      );
    } catch (e) {
      aiError = e.message;
    }
  }

  const aiCount = results.filter((r) => r.source === "ai").length;
  return NextResponse.json({
    ok: true,
    memory: assignments.length,
    ai: aiCount,
    remaining: remaining.length - aiCount,
    aiError,
    results,
  });
}
