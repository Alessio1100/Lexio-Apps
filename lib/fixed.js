// "Spese fisse": una spesa marcata come fissa dall'utente definisce una RICORRENZA
// specifica = stessa controparte + stesso importo. Ogni transazione (anche futura)
// con la stessa controparte E lo stesso importo viene marcata automaticamente come
// fissa. Serve stesso importo perché lo stesso esercente può avere sia spese fisse
// (es. rata del telefono su Amazon) sia acquisti variabili (altri ordini Amazon).

export function normMerchant(t) {
  return (t.merchant_name || "").toLowerCase().trim();
}

// Chiave di ricorrenza: controparte + importo (in centesimi, con segno).
function fixedKey(t) {
  const m = normMerchant(t);
  if (!m) return null;
  const cents = Math.round(Number(t.amount || 0) * 100);
  return `${m}|${cents}`;
}

// Insieme delle ricorrenze considerate "fisse" (controparte+importo con almeno una
// transazione marcata fissa).
export function fixedKeySet(txs) {
  const s = new Set();
  for (const t of txs || []) {
    if (t.is_fixed) {
      const k = fixedKey(t);
      if (k) s.add(k);
    }
  }
  return s;
}

// Id delle transazioni da marcare fisse per propagazione (stessa controparte E stesso
// importo di una spesa già marcata fissa), ma che non lo sono ancora.
export function idsToMarkFixed(txs) {
  const set = fixedKeySet(txs);
  const ids = [];
  for (const t of txs || []) {
    if (!t.is_fixed) {
      const k = fixedKey(t);
      if (k && set.has(k)) ids.push(t.id);
    }
  }
  return ids;
}
