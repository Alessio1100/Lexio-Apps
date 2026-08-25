# CLAUDE.md — App Spese (Lexio-Apps)

Guida per Claude Code per lavorare su questo progetto senza contesto pregresso.
Leggere tutto prima di iniziare.

---

## 1. Cos'è

App **personale** di monitoraggio spese con **open banking**. Aggrega i conti dell'utente
(**BuddyBank** e **Revolut**), classifica automaticamente le transazioni e mostra dashboard con KPI.
Utente unico (Alessio). Lingua UI: **italiano**. Valuta: **EUR**.

- Produzione: **https://lexio-apps.vercel.app**
- Repo GitHub: **github.com/Alessio1100/Lexio-Apps**, branch **main**
- L'app è mono-utente ma con auth reale (Supabase) e RLS per sicurezza.

## 2. Stack

- **Next.js 14** (App Router, JS non TS) — UI + API routes (serverless su Vercel)
- **Supabase** (Postgres + Auth) — DB e login; accesso via `@supabase/ssr` (cookie) e service role
- **Enable Banking** — aggregatore open banking (AISP). NON GoCardless (le loro registrazioni erano chiuse)
- **Gemini** (Google AI Studio) — classificazione AI, modello **`gemini-3.6-flash`**
- **Recharts** — grafico a torta
- **Vercel** — hosting + cron giornaliero di sync

## 3. Struttura

```
app/
  page.js                 Dashboard (KPI, torta, 50/30/20, spese fisse)
  transazioni/page.js     Lista spese, filtri, modale categoria, "+ Aggiungi" (cash)
  categorie/page.js       CRUD categorie (raggruppate per bucket)
  regole/page.js          CRUD regole + "Riapplica"
  impostazioni/page.js    Banche, Sync, Classifica AI (overview live), soglia mese, periodo, logout
  login/page.js           Auth email/password
  privacy/page.js, termini/page.js   Pagine legali pubbliche (richieste da Enable Banking)
  api/
    settings/            GET/PUT impostazioni (singleton per utente)
    categories/          CRUD (+ [id])
    rules/               CRUD (+ [id]) + reapply/
    transactions/        GET (con display_name calcolato, raw rimosso) + POST (spesa manuale) + [id] PATCH
    enablebanking/       aspsps, connect, callback, connections(+[id])
    sync/                POST/GET (manuale + cron): scarica, dedup, categorizza, transfer, fixed, memoria
    classify/            pending (elenco), batch (lotto), one (singola)  ← classificazione AI
lib/
  supabase/  client.js (browser), server.js, admin.js (service role), middleware.js
  enablebanking.js  API EB + JWT RS256 + normalizeTransaction + deriveMerchant (parser nomi)
  gemini.js         classifyWithGemini + summarizeRules
  categorize.js     motore regole (campi: description, merchant, bank, amount, foreign, direction)
  transfers.js      rilevamento giroconti + ensureTransferCategory
  fixed.js          spese fisse (propagazione per controparte) + normMerchant
  learn.js          memoria per esercente (impara dalle correzioni manuali)
  periods.js        periodi (mese/trim/sem/anno) con soglia inizio mese
  format.js, api.js, auth.js
supabase/schema.sql  schema completo + RLS + trigger seed (idempotente, "if not exists")
middleware.js        protegge le pagine (redirect a /login), lascia pubbliche /privacy /termini /api
```

## 4. Servizi esterni e identificativi (NON sono segreti; le chiavi sono in env)

- **Vercel**: team `alessiotorroni00-4048s-projects`, progetto `lexio-apps` (auto-deploy su push a `main`).
- **Supabase**: project ref `uviynusezmykpbeohqsc` (region Francoforte). Auth: conferma email **disattivata**.
- **Enable Banking**: app **Production** `65cbefb6-c7fa-45a0-91f4-57e625ce0676`. Stato "Restricted/attiva"
  (attivata collegando i conti propri dell'utente). Redirect: `https://lexio-apps.vercel.app/api/enablebanking/callback`.
- **Gemini**: modello `gemini-3.6-flash` (2.5-flash è bloccato per i nuovi utenti). Chiave AI Studio (formato `AQ.…`).

### Variabili d'ambiente (in `.env.local` locale + Env di Vercel; MAI committate)
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`ENABLE_BANKING_APP_ID`, `ENABLE_BANKING_PRIVATE_KEY` (base64 del PEM RSA), `GEMINI_API_KEY`,
`GEMINI_MODEL` (opz.), `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`. Vedi `.env.example`.
La chiave privata EB è anche in `scratchpad/eb_private.pem` (cert pubblico caricato su EB).

## 5. Modello dati (Supabase, RLS per user_id)

- **categories**: name, color, icon, `bucket` (needs|wants|savings|utility|income|**transfer**), is_income, sort
- **rules**: name, priority (crescente = vince prima), enabled, `conditions` jsonb {logic, clauses[{field,op,value}]}, category_id
- **bank_connections**: institution_id/name, requisition_id (=session EB), reference (=state), gc_account_id (=uid conto), iban_masked, currency, status, consent_expires_at
- **transactions**: connection_id (null = manuale/contanti), gc_transaction_id (unique per utente; manuali = `manual_<uuid>`),
  booking_date, amount (segno: <0 spesa, >0 entrata), currency, description (grezza), merchant_name (controparte, semplificata),
  `is_foreign`, `is_fixed`, category_id, **category_source** (none|rule|manual|memory|ai|transfer), rule_id, raw jsonb
- **settings** (singleton): month_start_mode (fixed|salary), month_start_day (default 23), default_period, currency

Migrazioni: eseguire `supabase/schema.sql` nel SQL Editor Supabase (via browser), oppure singole `ALTER … add column if not exists`.

## 6. Logica di dominio (concetti importanti)

- **Periodi & soglia mese** (`lib/periods.js`): il "mese" può iniziare a un giorno fisso o alla cadenza stipendio (23).
- **Categorie 50/30/20** via `bucket`; dashboard mostra la card Bisogni/Desideri/Risparmio.
- **Contabilità netta**: le spese si contano **per categoria in netto** → un rimborso (importo positivo in una
  categoria di spesa) **riduce** la spesa invece di contare come entrata. I **trasferimenti** (bucket `transfer`)
  sono **esclusi** da entrate e uscite.
- **Giroconti** (`lib/transfers.js`): uscita/entrata di pari importo tra conti diversi entro pochi giorni → "Trasferimenti".
- **Rimborsi Silvia**: regola "controparte contiene gialloreto + entrata → Ristoranti/Bar" (dimezza la spesa del pasto).
- **Spese fisse** (`lib/fixed.js`): flag per transazione, propagato a tutte le transazioni della **stessa controparte** (anche future). KPI dedicata.
- **Nome mostrato**: `display_name` calcolato al volo in `/api/transactions` con `deriveMerchant` (estrae negozio/persona da
  descrizioni BuddyBank: Google Pay, PayPal, bonifici). La semplificazione è SOLO per il front-end; a Gemini va il **testo originale**.
- **Classificazione a cascata**: regole → **memoria per esercente** (impara da category_source='manual') → **Gemini**.
  "Riapplica" rielabora solo `none`/`rule` (preserva manual/memory/ai/transfer).
- **Estero → Viaggi**: sia regola statica (foreign) sia istruzione a Gemini (supermercato all'estero → Viaggi, non Alimentari).
- **Classificazione AI a lotti** (`/api/classify/batch`): ~20 tx per richiesta, pausa 4s tra lotti, **retry sul 429**
  (aspetta il retryDelay). Necessario per i limiti Gemini free (RPM/TPM/RPD). UI mostra overview live.
- **Spese cash** (`POST /api/transactions`): connection_id null, badge "💵 Contanti".

## 7. Deploy

Push su `main` → **Vercel builda e deploya in automatico**. Env server (es. GEMINI_API_KEY) lette a runtime;
le `NEXT_PUBLIC_*` sono inlined al build. Dopo aver aggiunto/cambiato env su Vercel serve un nuovo deploy.
Cron in `vercel.json`: `GET /api/sync` giornaliero (autenticato con `CRON_SECRET`).

## 8. ⭐ Modo di lavorare in questa chat (accordo operativo con l'utente)

**Questo è il flusso che l'utente si aspetta. Rispettalo.**

1. **L'utente chiede una modifica → tu la esegui davvero**, end-to-end:
   - implementi il codice,
   - **`npm run build`** in locale per verificare che compili,
   - **commit** (messaggio in italiano + riga `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`),
   - **push su `main`**,
   - **controlli il deploy** su Vercel (pagina Deployments del progetto) finché è **Ready**, e se utile verifichi
     che il sito risponda (es. `curl` o navigazione).
2. **Se serve accedere a un servizio** (Supabase, Enable Banking, Vercel, Google AI Studio):
   **apri la pagina nel browser integrato in chat** (`mcp__Claude_Browser__*`), l'utente fa login/registrazione,
   e **tu estrai le chiavi / compili i form / crei le risorse**. L'estensione Claude-in-Chrome NON è connessa:
   usa sempre il browser integrato (`preview_start` / `navigate` / `computer` / `read_page` / `form_input`).
3. **Anti-bot**: se un'azione automatica viene bloccata come "suspicious" (successo con la creazione chiave Google),
   **falla cliccare all'utente** e poi leggi il risultato. **Non aggirare i controlli anti-bot.**
4. **Dopo ogni modifica verifichi che funzioni**: build, e per le API esterne (Gemini, Enable Banking) usa **script
   Node di test nello scratchpad** (es. verificare una chiave, un modello, l'output JSON) prima di cablare tutto.
5. **Segreti**: solo in `.env.local` (gitignored) e nelle Env di Vercel. Mai nel repo. Quando l'utente incolla una
   chiave in chat, verificala e configurala (locale + Vercel), poi redeploy.
6. **Modifiche al DB**: via SQL Editor di Supabase (browser) o `supabase/schema.sql`. Per una migrazione una-tantum
   sui dati esistenti si possono usare script Node con `@supabase/supabase-js` (service role) nello scratchpad
   (leggi le env da `.env.local`), lanciati con `NODE_PATH` puntato ai `node_modules` del progetto.
7. **Comunica in italiano**, conciso, e a fine modifica spiega cosa cambia e cosa deve fare l'utente.

L'utente NON vuole solo il codice: vuole che la modifica sia **implementata, deployata e verificata**.

## 9. Sviluppo locale

```bash
npm install
npm run dev        # http://localhost:3000
```
Serve `.env.local` compilato. Nota: il **collegamento banche funziona solo in produzione** (Enable Banking
Production accetta solo redirect https, non localhost). In locale funziona tutto il resto.

## 10. Vincoli / gotchas noti

- **Enable Banking**: consenso ~90 giorni (poi ri-collegare); app "Restricted" attivata coi conti propri;
  redirect solo https. `merchant_name` di BuddyBank arriva vuoto → lo ricaviamo dalla descrizione.
- **Gemini**: `gemini-2.5-flash` dà 404 "not available to new users" → usare **`gemini-3.6-flash`**; è un modello
  "thinking" (la risposta può avere più `parts`: concatenare i `.text`). Limiti free → classificare a **lotti**.
- **Bottoni**: in `globals.css` i `button` hanno `color: inherit` (senza, il testo era nero sul blu scuro delle card).
- **/api/transactions** restituisce `display_name` e **NON** `raw` (payload più leggero); il nome pulito vale anche
  sulle spese passate perché calcolato in visualizzazione.
- **reapply** tocca solo `category_source in (none, rule)`: preserva manuali, memoria, AI, trasferimenti.
- **Windows/PowerShell**: ambiente Windows; usare la Bash tool per script POSIX. Commit git già consentiti in questo flusso.
- **Memoria di Claude**: contesto e attività aperte anche in
  `~/.claude/projects/.../memory/app-spese-attivita-aperte.md`.

## 11. Convenzioni

- Commit: messaggio in italiano + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- File temporanei/script di test: nello **scratchpad** della sessione, mai nel repo.
- Codice: JS, stile e commenti in italiano coerenti col resto.
