// Palette categoriale: un colore DISTINTO e STABILE per ogni categoria (chiave =
// nome). Serve a rendere la torta della dashboard leggibile — prima molte
// categorie condividevano lo stesso colore. Per categorie personalizzate non in
// elenco ricade sul colore salvato in DB.
const CATEGORY_COLORS = {
  // entrate
  Stipendio: "#16a34a",
  Rimborsi: "#34d399",
  "Entrate extra": "#2dd4bf",
  // uscite — tinte ben separate sulla ruota dei colori
  "Casa / Affitto": "#3b82f6",
  "Bollette / Utenze": "#eab308",
  Alimentari: "#22c55e",
  Auto: "#ef4444",
  "Sport e Salute": "#ec4899",
  "Tasse e Istruzione": "#14b8a6",
  Ristoranti: "#f97316",
  Shopping: "#8b5cf6",
  "Svago / Tempo libero": "#a855f7",
  Abbonamenti: "#06b6d4",
  Bar: "#f59e0b",
  "Sigarette e Vizi": "#84cc16",
  "Viaggi / Vacanze": "#0ea5e9",
  "Regali / Donazioni": "#f43f5e",
  "Prelievi contanti": "#d946ef",
  Commissioni: "#94a3b8",
  "Altro / Da rivedere": "#64748b",
  "Carta di Credito": "#fb7185",
  "Risparmio / Fondo emergenza": "#10b981",
  Investimenti: "#22d3ee",
  // trasferimenti
  Trasferimenti: "#64748b",
};

// Colore di una categoria (accetta l'oggetto categoria o il nome).
export function catColor(cat, fallback = "#8b90a3") {
  if (!cat) return fallback;
  const name = typeof cat === "string" ? cat : cat.name;
  return (
    CATEGORY_COLORS[name] ||
    (typeof cat === "object" && cat && cat.color) ||
    fallback
  );
}

// Fetta "Altro" (aggregato coda) della torta: neutro, non compete con le tinte.
export const OTHER_COLOR = "#5b6478";
