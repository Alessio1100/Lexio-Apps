// Logica dei periodi di riferimento con soglia di inizio mese configurabile.
// Un "mese finanziario" inizia al giorno `day` (es. 23 = cadenza stipendio).
// I blocchi (trimestre/semestre/anno) sono allineati al calendario e ancorati
// allo stesso giorno `day`.

export const PERIODS = ["month", "quarter", "semester", "year"];

export const PERIOD_LABELS = {
  month: "Mensile",
  quarter: "Trimestrale",
  semester: "Semestrale",
  year: "Annuale",
};

const BLOCK_MONTHS = { month: 1, quarter: 3, semester: 6, year: 12 };

function anchoredMonthStart(year, monthIndex0, day) {
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  const d = Math.min(day, daysInMonth);
  return new Date(year, monthIndex0, d, 0, 0, 0, 0);
}

// Numero di mesi assoluti (da anno 0) del blocco che contiene refDate.
function financialMonthsAbs(refDate, day) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const thisStart = anchoredMonthStart(y, m, day);
  let monthsAbs = y * 12 + m;
  if (refDate < thisStart) monthsAbs -= 1;
  return monthsAbs;
}

// Ritorna { start, end } (end esclusivo) del periodo che contiene refDate.
export function getPeriodRange(period, refDate, day = 1) {
  const blockMonths = BLOCK_MONTHS[period] || 1;
  const monthsAbs = financialMonthsAbs(refDate, day);
  const startAbs = Math.floor(monthsAbs / blockMonths) * blockMonths;
  const endAbs = startAbs + blockMonths;
  const start = anchoredMonthStart(Math.floor(startAbs / 12), startAbs % 12, day);
  const end = anchoredMonthStart(Math.floor(endAbs / 12), endAbs % 12, day);
  return { start, end };
}

// Sposta il periodo di un blocco avanti/indietro; ritorna una data interna al nuovo blocco.
export function shiftPeriod(period, refDate, day, dir) {
  const { start, end } = getPeriodRange(period, refDate, day);
  if (dir < 0) return new Date(start.getTime() - 24 * 3600 * 1000); // giorno prima dell'inizio
  return new Date(end.getTime() + 24 * 3600 * 1000); // giorno dopo la fine
}

const MONTHS_IT = [
  "gen", "feb", "mar", "apr", "mag", "giu",
  "lug", "ago", "set", "ott", "nov", "dic",
];

function fmt(d) {
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`;
}

// Etichetta leggibile del periodo (l'end passato è esclusivo).
export function periodLabel(period, range) {
  const start = range.start;
  const lastDay = new Date(range.end.getTime() - 24 * 3600 * 1000);
  if (period === "year") {
    if (start.getMonth() === 0 && start.getDate() === 1)
      return `${start.getFullYear()}`;
    return `${fmt(start)} → ${fmt(lastDay)}`;
  }
  return `${fmt(start)} → ${fmt(lastDay)}`;
}

// Numero di giorni nel periodo e giorni trascorsi (per medie / proiezioni).
export function periodProgress(range, now = new Date()) {
  const total = Math.round((range.end - range.start) / (24 * 3600 * 1000));
  const elapsedRaw = Math.round((now - range.start) / (24 * 3600 * 1000)) + 1;
  const elapsed = Math.max(1, Math.min(total, elapsedRaw));
  return { total, elapsed, isCurrent: now >= range.start && now < range.end };
}

// Converte una Date in stringa YYYY-MM-DD (per query su colonne date).
export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
