// Memoria per esercente: impara dalle categorizzazioni MANUALI dell'utente.
// "esercente (controparte) → categoria scelta a mano" e la applica alle
// transazioni non ancora categorizzate della stessa controparte.
import { normMerchant } from "./fixed";

// Mappa controparte-normalizzata → category_id (dalle scelte manuali).
export function learnedMap(txs) {
  const m = new Map();
  for (const t of txs || []) {
    if (t.category_id && t.category_source === "manual") {
      const k = normMerchant(t);
      if (k) m.set(k, t.category_id);
    }
  }
  return m;
}

// Assegnazioni { id, category_id } per le transazioni senza categoria la cui
// controparte è già nota dalla memoria.
export function learnedAssignments(txs) {
  const map = learnedMap(txs);
  const out = [];
  for (const t of txs || []) {
    if (!t.category_id) {
      const k = normMerchant(t);
      if (k && map.has(k)) out.push({ id: t.id, category_id: map.get(k) });
    }
  }
  return out;
}
