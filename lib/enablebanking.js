// Wrapper sull'API Enable Banking (aggregatore open banking, AISP regolato FIN-FSA).
// Solo lato server: usa la chiave privata RSA per firmare il JWT di autenticazione.
// Docs: https://enablebanking.com/docs/api/reference/
import crypto from "crypto";

const BASE = "https://api.enablebanking.com";

// La chiave privata è in env come PEM (con \n) oppure come base64 del PEM.
function privateKeyPem() {
  const raw = process.env.ENABLE_BANKING_PRIVATE_KEY || "";
  if (raw.includes("BEGIN")) return raw.replace(/\\n/g, "\n");
  return Buffer.from(raw, "base64").toString("utf8");
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");

// JWT RS256: header {typ,alg,kid=app_id}, payload {iss,aud,iat,exp}. TTL max 24h.
export function makeJwt() {
  const header = { typ: "JWT", alg: "RS256", kid: process.env.ENABLE_BANKING_APP_ID };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "enablebanking.com",
    aud: "api.enablebanking.com",
    iat: now,
    exp: now + 3600,
  };
  const input = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = crypto.sign("RSA-SHA256", Buffer.from(input), privateKeyPem());
  return `${input}.${b64url(sig)}`;
}

async function ebFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${makeJwt()}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = data?.message || data?.error || data?.detail || res.statusText;
    const err = new Error(`EnableBanking ${res.status}: ${msg}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Elenco banche (ASPSP) per paese.
export async function listAspsps(country = "IT") {
  const data = await ebFetch(`/aspsps?country=${country}`);
  return data.aspsps || [];
}

// Avvia l'autorizzazione → { url, authorization_id, psu_id_hash }.
export async function startAuth({ aspspName, country, redirectUrl, state, validUntil }) {
  return ebFetch("/auth", {
    method: "POST",
    body: {
      access: { valid_until: validUntil },
      aspsp: { name: aspspName, country },
      redirect_url: redirectUrl,
      state,
      psu_type: "personal",
    },
  });
}

// Scambia il code del callback per una sessione → { session_id, accounts:[...] }.
export async function createSession(code) {
  return ebFetch("/sessions", { method: "POST", body: { code } });
}

export async function getAccountDetails(uid) {
  return ebFetch(`/accounts/${uid}/details`);
}

// Transazioni di un conto (con paginazione via continuation_key).
export async function getAccountTransactions(uid, { dateFrom, continuationKey } = {}) {
  const qs = new URLSearchParams();
  if (dateFrom) qs.set("date_from", dateFrom);
  if (continuationKey) qs.set("continuation_key", continuationKey);
  const s = qs.toString();
  return ebFetch(`/accounts/${uid}/transactions${s ? `?${s}` : ""}`);
}

// Normalizza una transazione Enable Banking nel nostro formato DB.
export function normalizeTransaction(raw, { connectionId, userId, currency }) {
  const amt = Math.abs(Number(raw.transaction_amount?.amount ?? 0));
  const signed = raw.credit_debit_indicator === "DBIT" || raw.credit_debit_indicator === "DBDT"
    ? -amt
    : amt;
  const txCurrency = raw.transaction_amount?.currency || currency || "EUR";
  const description = Array.isArray(raw.remittance_information)
    ? raw.remittance_information.join(" ").trim()
    : (raw.remittance_information || "").toString().trim();
  const merchant = raw.creditor?.name || raw.debtor?.name || "";
  const bookingDate = raw.booking_date || raw.value_date || raw.transaction_date || null;
  const id =
    raw.entry_reference ||
    raw.reference_number ||
    `${bookingDate || ""}_${signed}_${description.slice(0, 40)}`;
  const isForeign = !!txCurrency && !!currency && txCurrency !== currency;

  return {
    user_id: userId,
    connection_id: connectionId,
    gc_transaction_id: id,
    booking_date: bookingDate,
    value_date: raw.value_date || bookingDate || null,
    amount: signed,
    currency: txCurrency,
    description,
    merchant_name: merchant || null,
    creditor_name: raw.creditor?.name || null,
    is_foreign: isForeign,
    raw,
  };
}
