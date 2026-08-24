// "Spese fisse": una spesa marcata come fissa dall'utente definisce la sua
// controparte come ricorrente. Ogni transazione (anche futura) con la stessa
// controparte viene marcata automaticamente come fissa.

export function normMerchant(t) {
  return (t.merchant_name || "").toLowerCase().trim();
}

// Insieme delle controparti considerate "fisse" (hanno almeno una transazione fissa).
export function fixedMerchantSet(txs) {
  const s = new Set();
  for (const t of txs || []) {
    if (t.is_fixed) {
      const k = normMerchant(t);
      if (k) s.add(k);
    }
  }
  return s;
}

// Id delle transazioni che vanno marcate fisse per propagazione (stessa controparte
// di una spesa già marcata fissa), ma che non lo sono ancora.
export function idsToMarkFixed(txs) {
  const set = fixedMerchantSet(txs);
  const ids = [];
  for (const t of txs || []) {
    if (!t.is_fixed) {
      const k = normMerchant(t);
      if (k && set.has(k)) ids.push(t.id);
    }
  }
  return ids;
}
