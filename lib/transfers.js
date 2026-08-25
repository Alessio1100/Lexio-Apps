// Rilevamento dei giroconti tra conti propri (es. BuddyBank ↔ Revolut).
// Accoppia un'uscita su un conto con un'entrata di pari importo su un ALTRO
// conto entro pochi giorni: entrambe sono trasferimenti interni, quindi non
// vanno contate né come spesa né come entrata.

// Trova (o crea) la categoria "Trasferimenti" (bucket 'transfer') per un utente.
export async function ensureTransferCategory(supabase, userId) {
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", userId)
    .eq("bucket", "transfer")
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: "Trasferimenti",
      color: "#64748b",
      icon: "🔁",
      bucket: "transfer",
      is_income: false,
      sort: 200,
    })
    .select("id")
    .single();
  return created?.id || null;
}

const cents = (a) => Math.round(Math.abs(Number(a)) * 100);
const dayDiff = (d1, d2) =>
  Math.abs((new Date(d1) - new Date(d2)) / (24 * 3600 * 1000));
// data OPERAZIONE (value_date) con fallback a quella contabile
const opDate = (t) => t.value_date || t.booking_date;

// Ritorna un Set di id di transazioni che risultano essere trasferimenti interni.
// Considera solo transazioni non categorizzate a mano (category_source !== 'manual').
export function detectTransferIds(transactions, { windowDays = 4 } = {}) {
  const eligible = (transactions || []).filter(
    (t) => t.category_source !== "manual" && opDate(t)
  );
  const outs = eligible
    .filter((t) => Number(t.amount) < 0)
    .sort((a, b) => new Date(opDate(a)) - new Date(opDate(b)));
  const ins = eligible
    .filter((t) => Number(t.amount) > 0)
    .sort((a, b) => new Date(opDate(a)) - new Date(opDate(b)));

  const matched = new Set();
  const usedIn = new Set();

  for (const o of outs) {
    const partner = ins.find(
      (i) =>
        !usedIn.has(i.id) &&
        i.connection_id !== o.connection_id &&
        cents(i.amount) === cents(o.amount) &&
        dayDiff(opDate(i), opDate(o)) <= windowDays
    );
    if (partner) {
      matched.add(o.id);
      matched.add(partner.id);
      usedIn.add(partner.id);
    }
  }
  return matched;
}
