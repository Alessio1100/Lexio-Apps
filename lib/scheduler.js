// Algoritmo di apprendimento spaziato custom.
//
// Logica richiesta:
//  - 3 risposte: "non la so" (0), "la so parzialmente" (1), "la so" (2)
//  - Una carta marcata "la so" non viene più riproposta (è "padroneggiata").
//  - Si ripropongono solo le carte "non la so" / "la so parzialmente".
//  - Le "non la so" vanno ripetute, ma distanziate: non subito di seguito.
//  - Se a una carta "non la so" rispondo "la so", non diventa subito padroneggiata:
//    sale a "la so parzialmente" (serve una conferma successiva).
//  - Si itera finché tutte le carte sono "la so".
//
// Implementazione: ogni carta ha uno stato { level, due, seen }.
//   level: 0 = non la so, 1 = parzialmente, 2 = padroneggiata (out)
//   due:   "posizione" virtuale (tick) a cui la carta torna proponibile → distanziamento
//   seen:  quante volte è stata mostrata (per statistiche)
//
// Distanziamento (gap) in funzione della risposta:
//   "non la so"        → level 0, gap piccolo ma > 0 (riappare dopo qualche altra carta)
//   "parzialmente"     → level 1, gap medio (più distante)
//   "la so" da level 0 → level 1, gap medio (declassata a parziale, NON esce)
//   "la so" da level 1 → level 2, esce dal giro
//
// Selezione: tra le carte non padroneggiate, prendo quelle con due <= tick corrente;
// se nessuna è "scaduta" avanzo il tick fino alla prossima. Tra le candidate scelgo
// la più "in ritardo" (due minore), spezzando i pari a favore del livello più basso
// (le "non la so" hanno priorità) e con un po' di casualità per non essere prevedibile.

export const RATING = { DONT_KNOW: 0, PARTIAL: 1, KNOW: 2 };

// gap base (in numero di altre carte) per livello dopo una risposta
const GAP = {
  dontKnow: 3,    // "non la so": rivedila presto ma non subito
  partial: 6,     // "parzialmente" o "la so" da non-la-so: più distante
};

export function initState(cards) {
  const byId = {};
  for (const c of cards) {
    byId[c.id] = { id: c.id, level: 0, due: 0, seen: 0, lastTick: -1 };
  }
  return { byId, tick: 0, history: [] };
}

// piccola variazione deterministica-ish per distanziare in modo non rigido
function jitter(base) {
  return base + Math.floor(Math.random() * 3); // +0..+2
}

// quante carte restano da imparare (level < 2)
export function remaining(state) {
  return Object.values(state.byId).filter((s) => s.level < 2).length;
}

export function masteredCount(state) {
  return Object.values(state.byId).filter((s) => s.level === 2).length;
}

// scegli la prossima carta da mostrare; restituisce id oppure null se finito
export function pickNext(state) {
  const active = Object.values(state.byId).filter((s) => s.level < 2);
  if (active.length === 0) return null;

  // candidate "scadute" rispetto al tick corrente
  let candidates = active.filter((s) => s.due <= state.tick);

  // evita di riproporre subito l'ultima carta vista, se ci sono alternative
  const lastId = state.history.length ? state.history[state.history.length - 1] : null;
  if (lastId != null && candidates.length > 1) {
    candidates = candidates.filter((s) => s.id !== lastId);
  }

  // se nessuna è scaduta, avanza il tick fino alla prossima scadenza
  if (candidates.length === 0) {
    const nextDue = Math.min(...active.map((s) => s.due));
    state.tick = nextDue;
    candidates = active.filter((s) => s.due <= state.tick);
    if (lastId != null && candidates.length > 1) {
      candidates = candidates.filter((s) => s.id !== lastId);
    }
  }

  // ordina: prima le più "in ritardo" (due minore), poi livello più basso
  candidates.sort((a, b) => {
    if (a.due !== b.due) return a.due - b.due;
    if (a.level !== b.level) return a.level - b.level;
    return a.seen - b.seen;
  });

  // scegli tra le prime poche con un pizzico di casualità
  const topK = candidates.slice(0, Math.min(3, candidates.length));
  return topK[Math.floor(Math.random() * topK.length)].id;
}

// applica la risposta dell'utente alla carta mostrata
export function applyRating(state, id, rating) {
  const s = state.byId[id];
  if (!s) return state;

  s.seen += 1;
  s.lastTick = state.tick;

  if (rating === RATING.KNOW) {
    if (s.level === 0) {
      // "la so" ma veniva da "non la so": conferma necessaria → parziale
      s.level = 1;
      s.due = state.tick + jitter(GAP.partial);
    } else {
      // era già almeno parziale → padroneggiata, esce
      s.level = 2;
      s.due = Infinity;
    }
  } else if (rating === RATING.PARTIAL) {
    s.level = 1;
    s.due = state.tick + jitter(GAP.partial);
  } else {
    // non la so
    s.level = 0;
    s.due = state.tick + jitter(GAP.dontKnow);
  }

  state.history.push(id);
  state.tick += 1;
  return state;
}
