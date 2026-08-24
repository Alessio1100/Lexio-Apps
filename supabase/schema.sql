-- ============================================================
--  App Spese — schema Supabase (Postgres)
--  Esegui in: Supabase Dashboard → SQL Editor → New query
--  Rieseguibile: usa "if not exists" / "add column if not exists".
-- ============================================================

-- ---------- CATEGORIE ----------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',
  icon        text default '',
  bucket      text not null default 'wants', -- needs | wants | savings | utility | income
  parent_id   uuid references public.categories(id) on delete set null,
  is_income   boolean not null default false,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.categories add column if not exists bucket text not null default 'wants';

-- ---------- REGOLE ----------
create table if not exists public.rules (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  priority    int not null default 100,
  enabled     boolean not null default true,
  conditions  jsonb not null default '{"logic":"and","clauses":[]}'::jsonb,
  category_id uuid references public.categories(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ---------- CONNESSIONI BANCARIE ----------
create table if not exists public.bank_connections (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  provider           text not null default 'gocardless',
  institution_id     text,
  institution_name   text,
  requisition_id     text,
  reference          text,
  gc_account_id      text unique,
  iban_masked        text,
  currency           text default 'EUR',
  status             text default 'pending', -- pending | linked | expired | error
  consent_expires_at timestamptz,
  last_synced_at     timestamptz,
  created_at         timestamptz not null default now()
);

-- ---------- TRANSAZIONI ----------
create table if not exists public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  connection_id     uuid references public.bank_connections(id) on delete cascade,
  gc_transaction_id text not null,
  booking_date      date,
  value_date        date,
  amount            numeric(14,2) not null,
  currency          text default 'EUR',
  description       text,
  merchant_name     text,
  creditor_name     text,
  is_foreign        boolean not null default false,
  is_fixed          boolean not null default false,
  category_id       uuid references public.categories(id) on delete set null,
  category_source   text not null default 'none', -- none | rule | manual
  rule_id           uuid references public.rules(id) on delete set null,
  raw               jsonb,
  created_at        timestamptz not null default now(),
  unique (user_id, gc_transaction_id)
);
alter table public.transactions add column if not exists is_foreign boolean not null default false;
alter table public.transactions add column if not exists is_fixed boolean not null default false;

create index if not exists tx_user_date_idx on public.transactions (user_id, booking_date desc);
create index if not exists tx_category_idx  on public.transactions (category_id);

-- ---------- IMPOSTAZIONI (singleton per utente) ----------
create table if not exists public.settings (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  month_start_mode text not null default 'salary',   -- fixed | salary
  month_start_day  int  not null default 23,         -- 1..31
  default_period   text not null default 'month',    -- month | quarter | semester | year
  currency         text not null default 'EUR',
  updated_at       timestamptz not null default now()
);

-- ============================================================
--  Row Level Security: ogni utente vede solo i propri dati
-- ============================================================
alter table public.categories       enable row level security;
alter table public.rules            enable row level security;
alter table public.bank_connections enable row level security;
alter table public.transactions     enable row level security;
alter table public.settings         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['categories','rules','bank_connections','transactions','settings']
  loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format(
      'create policy own_rows on public.%I for all
         using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- ============================================================
--  Seed automatico al primo accesso di un nuovo utente
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  -- Bisogni
  c_casa uuid; c_bollette uuid; c_alimentari uuid; c_trasporti uuid; c_salute uuid; c_assic uuid;
  -- Desideri
  c_risto uuid; c_shopping uuid; c_svago uuid; c_abbon uuid; c_viaggi uuid; c_regali uuid; c_cura uuid;
  -- Risparmio
  c_risparmio uuid; c_investimenti uuid;
  -- Utility
  c_prelievi uuid; c_commissioni uuid; c_altro uuid;
  -- Entrate
  c_stipendio uuid; c_rimborsi uuid; c_extra uuid;
begin
  insert into public.settings(user_id) values (new.id);

  -- ---- BISOGNI (needs) ----
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Casa / Affitto','#f97316','🏠','needs',false,10) returning id into c_casa;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Bollette / Utenze','#eab308','💡','needs',false,20) returning id into c_bollette;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Alimentari','#22c55e','🛒','needs',false,30) returning id into c_alimentari;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Trasporti','#3b82f6','🚗','needs',false,40) returning id into c_trasporti;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Salute','#14b8a6','⚕️','needs',false,50) returning id into c_salute;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Assicurazioni / Tasse','#94a3b8','🛡️','needs',false,60) returning id into c_assic;

  -- ---- DESIDERI (wants) ----
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Ristoranti / Bar','#ec4899','🍽️','wants',false,70) returning id into c_risto;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Shopping','#a855f7','🛍️','wants',false,80) returning id into c_shopping;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Svago / Tempo libero','#8b5cf6','🎮','wants',false,90) returning id into c_svago;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Abbonamenti','#6366f1','📺','wants',false,100) returning id into c_abbon;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Viaggi / Vacanze','#06b6d4','✈️','wants',false,110) returning id into c_viaggi;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Regali / Donazioni','#f43f5e','🎁','wants',false,120) returning id into c_regali;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Cura personale','#d946ef','💇','wants',false,130) returning id into c_cura;

  -- ---- RISPARMIO (savings) ----
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Risparmio / Fondo emergenza','#16a34a','💰','savings',false,140) returning id into c_risparmio;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Investimenti','#10b981','📈','savings',false,150) returning id into c_investimenti;

  -- ---- UTILITY ----
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Prelievi contanti','#64748b','💵','utility',false,160) returning id into c_prelievi;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Commissioni','#78716c','🏦','utility',false,170) returning id into c_commissioni;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Altro / Da rivedere','#71717a','❓','utility',false,180) returning id into c_altro;

  -- ---- ENTRATE (income) ----
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Stipendio','#16a34a','💰','income',true,0) returning id into c_stipendio;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Rimborsi','#4ade80','↩️','income',true,1) returning id into c_rimborsi;
  insert into public.categories(user_id,name,color,icon,bucket,is_income,sort) values
    (new.id,'Entrate extra','#34d399','➕','income',true,2) returning id into c_extra;

  -- ============================================================
  --  Regole (priority crescente = vince la prima che matcha).
  --  Basate sul nome azienda (merchant/descrizione) + estero.
  -- ============================================================
  insert into public.rules(user_id,name,priority,category_id,conditions) values

    (new.id,'Stipendio',1,c_stipendio,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"stipendio"},{"field":"description","op":"contains","value":"accredito stipendio"},{"field":"description","op":"contains","value":"salary"},{"field":"description","op":"contains","value":"emolumenti"}]}'::jsonb),

    (new.id,'Rimborsi',3,c_rimborsi,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"rimborso"},{"field":"description","op":"contains","value":"refund"},{"field":"description","op":"contains","value":"reversal"}]}'::jsonb),

    -- ESTERO → Viaggi (spese in valuta straniera = viaggio all'estero)
    (new.id,'Spese all''estero → Viaggi',8,c_viaggi,
      '{"logic":"and","clauses":[{"field":"foreign","op":"equals","value":true}]}'::jsonb),

    (new.id,'Supermercati',20,c_alimentari,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"esselunga"},{"field":"description","op":"contains","value":"conad"},{"field":"description","op":"contains","value":"coop"},{"field":"description","op":"contains","value":"carrefour"},{"field":"description","op":"contains","value":"lidl"},{"field":"description","op":"contains","value":"eurospin"},{"field":"description","op":"contains","value":"pam"},{"field":"description","op":"contains","value":"penny"},{"field":"description","op":"contains","value":"bennet"},{"field":"description","op":"contains","value":"famila"},{"field":"description","op":"contains","value":"aldi"},{"field":"description","op":"contains","value":"md spa"},{"field":"description","op":"contains","value":"crai"}]}'::jsonb),

    (new.id,'Utenze',24,c_bollette,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"enel"},{"field":"description","op":"contains","value":"eni"},{"field":"description","op":"contains","value":"a2a"},{"field":"description","op":"contains","value":"hera"},{"field":"description","op":"contains","value":"iren"},{"field":"description","op":"contains","value":"acea"},{"field":"description","op":"contains","value":"sorgenia"},{"field":"description","op":"contains","value":"tim "},{"field":"description","op":"contains","value":"vodafone"},{"field":"description","op":"contains","value":"windtre"},{"field":"description","op":"contains","value":"iliad"},{"field":"description","op":"contains","value":"fastweb"}]}'::jsonb),

    (new.id,'Salute',28,c_salute,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"farmacia"},{"field":"description","op":"contains","value":"pharmacy"},{"field":"description","op":"contains","value":"parafarmacia"},{"field":"description","op":"contains","value":"laboratorio anali"},{"field":"description","op":"contains","value":"poliambulatorio"},{"field":"description","op":"contains","value":"dentista"}]}'::jsonb),

    (new.id,'Assicurazioni / Tasse',32,c_assic,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"assicura"},{"field":"description","op":"contains","value":"generali"},{"field":"description","op":"contains","value":"unipol"},{"field":"description","op":"contains","value":"allianz"},{"field":"description","op":"contains","value":"axa"},{"field":"description","op":"contains","value":"f24"},{"field":"description","op":"contains","value":"agenzia entrate"},{"field":"description","op":"contains","value":"bollo auto"}]}'::jsonb),

    (new.id,'Abbonamenti digitali',36,c_abbon,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"netflix"},{"field":"description","op":"contains","value":"spotify"},{"field":"description","op":"contains","value":"disney"},{"field":"description","op":"contains","value":"prime video"},{"field":"description","op":"contains","value":"amazon prime"},{"field":"description","op":"contains","value":"youtube"},{"field":"description","op":"contains","value":"icloud"},{"field":"description","op":"contains","value":"google one"},{"field":"description","op":"contains","value":"dropbox"},{"field":"description","op":"contains","value":"openai"},{"field":"description","op":"contains","value":"chatgpt"},{"field":"description","op":"contains","value":"microsoft 365"},{"field":"description","op":"contains","value":"dazn"},{"field":"description","op":"contains","value":"audible"}]}'::jsonb),

    (new.id,'Viaggi',40,c_viaggi,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"ryanair"},{"field":"description","op":"contains","value":"easyjet"},{"field":"description","op":"contains","value":"wizz air"},{"field":"description","op":"contains","value":"ita airways"},{"field":"description","op":"contains","value":"vueling"},{"field":"description","op":"contains","value":"lufthansa"},{"field":"description","op":"contains","value":"booking.com"},{"field":"description","op":"contains","value":"airbnb"},{"field":"description","op":"contains","value":"hotel"},{"field":"description","op":"contains","value":"expedia"},{"field":"description","op":"contains","value":"trainline"}]}'::jsonb),

    (new.id,'Trasporti',44,c_trasporti,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"trenitalia"},{"field":"description","op":"contains","value":"italo"},{"field":"description","op":"contains","value":"trenord"},{"field":"description","op":"contains","value":"uber"},{"field":"description","op":"contains","value":"free now"},{"field":"description","op":"contains","value":"bolt"},{"field":"description","op":"contains","value":"q8"},{"field":"description","op":"contains","value":"ip "},{"field":"description","op":"contains","value":"esso"},{"field":"description","op":"contains","value":"tamoil"},{"field":"description","op":"contains","value":"benzina"},{"field":"description","op":"contains","value":"carburante"},{"field":"description","op":"contains","value":"telepass"},{"field":"description","op":"contains","value":"autostrade"},{"field":"description","op":"contains","value":"atac"},{"field":"description","op":"contains","value":"flixbus"}]}'::jsonb),

    (new.id,'Ristoranti / Bar',48,c_risto,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"glovo"},{"field":"description","op":"contains","value":"deliveroo"},{"field":"description","op":"contains","value":"just eat"},{"field":"description","op":"contains","value":"mcdonald"},{"field":"description","op":"contains","value":"burger king"},{"field":"description","op":"contains","value":"starbucks"},{"field":"description","op":"contains","value":"ristorante"},{"field":"description","op":"contains","value":"pizzeria"},{"field":"description","op":"contains","value":"trattoria"},{"field":"description","op":"contains","value":"osteria"}]}'::jsonb),

    (new.id,'Shopping',52,c_shopping,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"amazon"},{"field":"description","op":"contains","value":"zalando"},{"field":"description","op":"contains","value":"aliexpress"},{"field":"description","op":"contains","value":"zara"},{"field":"description","op":"contains","value":"h&m"},{"field":"description","op":"contains","value":"decathlon"},{"field":"description","op":"contains","value":"ikea"},{"field":"description","op":"contains","value":"mediaworld"},{"field":"description","op":"contains","value":"unieuro"},{"field":"description","op":"contains","value":"apple store"},{"field":"description","op":"contains","value":"shein"},{"field":"description","op":"contains","value":"temu"}]}'::jsonb),

    (new.id,'Svago',56,c_svago,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"steam"},{"field":"description","op":"contains","value":"nintendo"},{"field":"description","op":"contains","value":"playstation"},{"field":"description","op":"contains","value":"xbox"},{"field":"description","op":"contains","value":"epic games"},{"field":"description","op":"contains","value":"cinema"},{"field":"description","op":"contains","value":"uci"},{"field":"description","op":"contains","value":"the space"},{"field":"description","op":"contains","value":"ticketone"},{"field":"description","op":"contains","value":"palestra"},{"field":"description","op":"contains","value":"mcfit"},{"field":"description","op":"contains","value":"virgin active"}]}'::jsonb),

    (new.id,'Cura personale',60,c_cura,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"parrucchier"},{"field":"description","op":"contains","value":"barber"},{"field":"description","op":"contains","value":"estetic"},{"field":"description","op":"contains","value":"profumeria"},{"field":"description","op":"contains","value":"douglas"},{"field":"description","op":"contains","value":"sephora"},{"field":"description","op":"contains","value":"notino"}]}'::jsonb),

    (new.id,'Investimenti',64,c_investimenti,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"directa"},{"field":"description","op":"contains","value":"degiro"},{"field":"description","op":"contains","value":"trade republic"},{"field":"description","op":"contains","value":"scalable"},{"field":"description","op":"contains","value":"moneyfarm"},{"field":"description","op":"contains","value":"binance"},{"field":"description","op":"contains","value":"coinbase"},{"field":"description","op":"contains","value":"crypto"}]}'::jsonb),

    (new.id,'Commissioni',68,c_commissioni,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"commission"},{"field":"description","op":"contains","value":"canone"},{"field":"description","op":"contains","value":"imposta di bollo"},{"field":"description","op":"contains","value":"fee"}]}'::jsonb),

    (new.id,'Prelievi',72,c_prelievi,
      '{"logic":"or","clauses":[{"field":"description","op":"contains","value":"prelievo"},{"field":"description","op":"contains","value":"atm"},{"field":"description","op":"contains","value":"withdrawal"},{"field":"description","op":"contains","value":"cash"}]}'::jsonb);

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
