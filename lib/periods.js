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

const ymKey = (year, monthIndex0) =>
  `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;

// Inizio del "mese finanziario" ancorato al giorno `day`.
// In modalità stipendio (anchors != null):
//  - se conosciamo la data REALE dell'accredito per quel mese, usiamo quella;
//  - altrimenti previsione: il giorno statico, anticipato al venerdì se cade
//    nel weekend (lo stipendio arriva prima del 23 se il 23 è sab/dom).
function anchoredMonthStart(year, monthIndex0, day, anchors) {
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  const d = Math.min(day, daysInMonth);
  if (anchors) {
    const real = anchors[ymKey(year, monthIndex0)];
    if (real) {
      const [y, m, dd] = real.split("-").map(Number);
      return new Date(y, m - 1, dd, 0, 0, 0, 0);
    }
    let dt = new Date(year, monthIndex0, d, 0, 0, 0, 0);
    const wd = dt.getDay(); // 0=dom, 6=sab
    if (wd === 0) dt = new Date(year, monthIndex0, d - 2, 0, 0, 0, 0);
    else if (wd === 6) dt = new Date(year, monthIndex0, d - 1, 0, 0, 0, 0);
    return dt;
  }
  return new Date(year, monthIndex0, d, 0, 0, 0, 0);
}

// Numero di mesi assoluti (da anno 0) del blocco che contiene refDate.
function financialMonthsAbs(refDate, day, anchors) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const thisStart = anchoredMonthStart(y, m, day, anchors);
  let monthsAbs = y * 12 + m;
  if (refDate < thisStart) monthsAbs -= 1;
  return monthsAbs;
}

// Ritorna { start, end } (end esclusivo) del periodo che contiene refDate.
// `anchors`: mappa { "YYYY-MM": "YYYY-MM-DD" } con le date reali dello stipendio.
export function getPeriodRange(period, refDate, day = 1, anchors = null) {
  const blockMonths = BLOCK_MONTHS[period] || 1;
  const monthsAbs = financialMonthsAbs(refDate, day, anchors);
  const startAbs = Math.floor(monthsAbs / blockMonths) * blockMonths;
  const endAbs = startAbs + blockMonths;
  const start = anchoredMonthStart(Math.floor(startAbs / 12), startAbs % 12, day, anchors);
  const end = anchoredMonthStart(Math.floor(endAbs / 12), endAbs % 12, day, anchors);
  return { start, end };
}

// Sposta il periodo di un blocco avanti/indietro; ritorna una data interna al nuovo blocco.
export function shiftPeriod(period, refDate, day, dir, anchors = null) {
  const { start, end } = getPeriodRange(period, refDate, day, anchors);
  if (dir < 0) return new Date(start.getTime() - 24 * 3600 * 1000); // giorno prima dell'inizio
  return new Date(end.getTime() + 24 * 3600 * 1000); // giorno dopo la fine
}

// Costruisce la mappa degli anchor dagli accrediti stipendio: per ogni mese
// prende, nella finestra intorno al giorno `day`, la transazione di importo
// maggiore (lo stipendio principale, ignorando eventuali conguagli minori).
export function salaryAnchorsFromTx(txs, day = 23, windowDays = 8) {
  const best = {}; // "YYYY-MM" -> { date, amount }
  for (const t of txs || []) {
    const vd = t.value_date || t.booking_date;
    if (!vd) continue;
    const dom = Number(vd.slice(8, 10));
    if (dom < day - windowDays || dom > day + windowDays) continue;
    const key = vd.slice(0, 7);
    const amt = Math.abs(Number(t.amount) || 0);
    if (!best[key] || amt > best[key].amount) best[key] = { date: vd, amount: amt };
  }
  const anchors = {};
  for (const k in best) anchors[k] = best[k].date;
  return anchors;
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
