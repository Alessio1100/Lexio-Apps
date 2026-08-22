# Le mie spese

App personale per il monitoraggio delle spese con **OpenBanking** (BuddyBank, Revolut e altre banche),
categorizzazione automatica tramite regole, dashboard con KPI e grafico a torta, lista transazioni
cronologica. Next.js 14 (App Router) + Supabase (Postgres/Auth) + GoCardless Bank Account Data.

## Funzionalità

- **Dashboard**: spesa totale del periodo, torta per categoria, KPI (uscite/entrate/saldo, media
  giornaliera, categoria top, n. transazioni, proiezione fine periodo, ripartizione per banca).
- **Transazioni**: elenco cronologico, colore per categoria, badge banca, filtri (periodo, categoria,
  banca, ricerca), ri-categorizzazione manuale.
- **Categorie** e **Regole** definibili dall'utente (la prima regola che corrisponde vince).
- **Periodi**: mensile / trimestrale / semestrale / annuale.
- **Soglia mese**: giorno fisso (1–31) o cadenza stipendio (23).
- **Sync**: manuale ("Sync ora") + automatico giornaliero (Vercel Cron).

## Struttura

```
app/
  page.js                  Dashboard
  transazioni/page.js      Lista spese
  categorie/page.js        CRUD categorie
  regole/page.js           CRUD regole + riapplica
  impostazioni/page.js     Preferenze, banche, sync, logout
  login/page.js            Autenticazione
  api/                     Route handlers (settings, categories, rules, transactions,
                           gocardless/*, sync)
components/                NavBar, PeriodBar, CategoryPie, SWRegister
lib/
  supabase/                client (browser), server, admin, middleware
  gocardless.js            wrapper API GoCardless
  categorize.js            motore regole → categoria
  periods.js               logica periodi + soglia mese
  format.js, api.js, auth.js
supabase/schema.sql        schema DB + RLS + seed categorie/regole
```

## Setup

### 1. Supabase
1. Crea un progetto su [supabase.com](https://supabase.com).
2. SQL Editor → incolla ed esegui `supabase/schema.sql`.
3. Project Settings → API: copia `URL`, `anon key`, `service_role key`.
4. Authentication → Providers → Email: abilita. (Per uso personale puoi disattivare la conferma email.)

### 2. GoCardless Bank Account Data
1. Registrati su [bankaccountdata.gocardless.com](https://bankaccountdata.gocardless.com) (gratuito).
2. Developers → User Secrets → crea `secret_id` e `secret_key`.

### 3. Variabili d'ambiente
Copia `.env.example` in `.env.local` e compila i valori:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GOCARDLESS_SECRET_ID=...
GOCARDLESS_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=<stringa casuale>
```

### 4. Sviluppo locale

```bash
npm install
npm run dev      # http://localhost:3000
```

Registrati con email/password → verrai loggato. Le categorie e le regole di default vengono create
automaticamente. Vai in **Impostazioni → Collega banca** per autorizzare BuddyBank/Revolut, poi **Sync ora**.

## Deploy su Vercel

1. Push del repo su GitHub.
2. Vercel → Add New → Project → importa il repo (Framework: Next.js).
3. Aggiungi tutte le env var (imposta `NEXT_PUBLIC_APP_URL` all'URL di produzione).
4. Deploy. Il cron in `vercel.json` chiama `/api/sync` ogni giorno alle 06:00 UTC
   (autenticato con `CRON_SECRET`).

## Note su OpenBanking

- L'accesso ai conti passa da GoCardless (aggregatore con licenza AISP): non serve una licenza propria.
- Il consenso bancario dura ~90 giorni, poi va rinnovato (ri-collega la banca dalle Impostazioni).
- GoCardless limita le chiamate (~4/conto/giorno per le transazioni): per questo i dati sono salvati nel
  DB e la dashboard legge da lì, non in tempo reale dalla banca.
```
