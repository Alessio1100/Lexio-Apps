import { normMerchant } from "./fixed";
import { classifyWithGemini, summarizeRules } from "./gemini";

// Classifica automaticamente con Gemini fino a `max` transazioni ancora senza
// categoria (category_source='none'). Le assegna con category_source='ai', cioè
// "in attesa di approvazione": l'utente le vede già classificate nelle Spese, ma
// restano elencate sotto il pulsante Gemini in Impostazioni per revisione/approvazione.
// Non lancia mai: in caso di errore o quota Gemini lascia le transazioni non toccate.
// La memoria per esercente è già applicata prima (markLearned nel sync), qui si fa solo Gemini.
export async function autoClassify(db, userId, { max = 25 } = {}) {
  if (!process.env.GEMINI_API_KEY) return { classified: 0, skipped: "no_key" };

  const [{ data: categories }, { data: rules }, { data: manual }, { data: txs }] =
    await Promise.all([
      db.from("categories").select("id,name,is_income,bucket").eq("user_id", userId),
      db.from("rules").select("*").eq("user_id", userId),
      db
        .from("transactions")
        .select("merchant_name,category_id,category_source")
        .eq("user_id", userId)
        .eq("category_source", "manual"),
      db
        .from("transactions")
        .select(
          "id,merchant_name,description,amount,currency,is_foreign,category_id,value_date,raw,bank_connections(institution_name)"
        )
        .eq("user_id", userId)
        .eq("category_source", "none")
        .is("category_id", null)
        .order("value_date", { ascending: false })
        .limit(max),
    ]);

  const pending = (txs || []).filter((t) => !t.category_id);
  if (!pending.length) return { classified: 0 };

  const nameById = Object.fromEntries((categories || []).map((c) => [c.id, c.name]));
  const catByName = new Map((categories || []).map((c) => [c.name.toLowerCase().trim(), c.id]));

  // esempi dagli esercenti già corretti a mano (aiutano Gemini)
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

  let classified = 0;
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
      if (!catId) continue; // incerta: la lascia non categorizzata
      await db
        .from("transactions")
        .update({ category_id: catId, category_source: "ai", rule_id: null })
        .eq("id", t.id)
        .eq("user_id", userId);
      classified++;
    }
  } catch (e) {
    return { classified, error: e.message, status: e.status || null };
  }
  return { classified };
}
