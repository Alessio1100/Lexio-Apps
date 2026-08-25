// Cache in-memory delle risposte API, persistente tra le navigazioni client
// (il modulo non viene scaricato durante la sessione SPA). Serve a mostrare
// SUBITO i dati già visti invece di uno spinner, aggiornando in background
// (pattern stale-while-revalidate). Si svuota al refresh completo della pagina.
const store = new Map();

export function getCache(key) {
  return store.get(key); // undefined se assente
}
export function setCache(key, val) {
  store.set(key, val);
}
// Invalida tutte le chiavi che iniziano con `prefix` (o tutto se assente).
export function clearCache(prefix) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
}
