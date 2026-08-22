// Utilità di formattazione (valute, date).

export function formatMoney(amount, currency = "EUR") {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

// Versione compatta senza decimali per le KPI grandi.
export function formatMoneyShort(amount, currency = "EUR") {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPct(value) {
  const n = Number(value) || 0;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

const MONTHS_IT = [
  "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre",
];
const DAYS_IT = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];

export function formatDateLong(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr || "";
  return `${DAYS_IT[d.getDay()]} ${d.getDate()} ${MONTHS_IT[d.getMonth()]}`;
}

export function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr || "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}`;
}
