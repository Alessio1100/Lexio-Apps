"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp, PiggyBank, Telescope, Trophy, Pin, Minus, PartyPopper,
  TriangleAlert, Target,
} from "lucide-react";
import PeriodBar from "../components/PeriodBar";
import DashboardView from "../components/DashboardView";
import { api } from "../lib/api";
import { getCache, setCache } from "../lib/cache";
import { getPeriodRange, toDateStr, periodProgress, shiftPeriod } from "../lib/periods";
import { formatMoney } from "../lib/format";

// Stato iniziale da cache: se sono già stato qui (cache calda) mostro subito i
// dati, senza spinner né flash. Al primo caricamento la cache è vuota (SSR e
// client concordano), quindi nessun problema di hydration.
function readInitial() {
  const s = getCache("/api/settings");
  const period = s?.default_period || "month";
  let txs;
  if (s) {
    const range = getPeriodRange(period, new Date(), s.month_start_day ?? 1, s.salary_anchors || null);
    txs = getCache(`/api/transactions?from=${toDateStr(range.start)}&to=${toDateStr(range.end)}`);
  }
  return { s: s || null, period, txs };
}

export default function Dashboard() {
  const init = useRef(null);
  if (!init.current) init.current = readInitial();
  const [settings, setSettings] = useState(init.current.s);
  const [period, setPeriod] = useState(init.current.period);
  const [refDate, setRefDate] = useState(() => new Date());
  const [txs, setTxs] = useState(init.current.txs ?? []);
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(init.current.txs === undefined);
  const [syncTick, setSyncTick] = useState(0);

  // quando il sync di sessione porta nuove transazioni, ricarica in silenzio
  useEffect(() => {
    const h = () => setSyncTick((t) => t + 1);
    window.addEventListener("tx-synced", h);
    return () => window.removeEventListener("tx-synced", h);
  }, []);

  useEffect(() => {
    const cached = getCache("/api/settings");
    if (cached) {
      setSettings(cached);
      if (cached.default_period) setPeriod(cached.default_period);
    }
    api
      .get("/api/settings")
      .then((s) => {
        setCache("/api/settings", s);
        setSettings(s);
        if (!cached && s?.default_period) setPeriod(s.default_period);
      })
      .catch(() => {
        if (!cached) setSettings({ month_start_day: 1, currency: "EUR" });
      });
  }, []);

  const day = settings?.month_start_day ?? 1;
  const currency = settings?.currency ?? "EUR";
  const anchors = settings?.salary_anchors || null;
  const range = useMemo(
    () => getPeriodRange(period, refDate, day, anchors),
    [period, refDate, day, anchors]
  );

  useEffect(() => {
    if (!settings) return;
    const from = toDateStr(range.start);
    const to = toDateStr(range.end);
    const curUrl = `/api/transactions?from=${from}&to=${to}`;
    const prevRef = shiftPeriod(period, refDate, day, -1, anchors);
    const prevRange = getPeriodRange(period, prevRef, day, anchors);
    const prevUrl = `/api/transactions?from=${toDateStr(prevRange.start)}&to=${toDateStr(prevRange.end)}`;

    // stale-while-revalidate: se ho già i dati in cache li mostro subito (niente spinner)
    const cCur = getCache(curUrl);
    const cPrev = getCache(prevUrl);
    if (cCur !== undefined) {
      setTxs(cCur);
      if (cPrev !== undefined) setPrevTotal(netExpenses(cPrev));
      setLoading(false);
    } else {
      setLoading(true);
    }

    Promise.all([api.get(curUrl), api.get(prevUrl)])
      .then(([cur, prev]) => {
        setCache(curUrl, cur || []);
        setCache(prevUrl, prev || []);
        setTxs(cur || []);
        setPrevTotal(netExpenses(prev || []));
      })
      .catch(() => {
        if (cCur === undefined) {
          setTxs([]);
          setPrevTotal(0);
        }
      })
      .finally(() => setLoading(false));
  }, [settings, period, refDate, day, range.start, range.end, syncTick]);

  const stats = useMemo(() => computeStats(txs, range, prevTotal), [txs, range, prevTotal]);
  const daily = useMemo(() => buildDaily(txs, range), [txs, range]);
  const insights = useMemo(() => buildInsights(stats, currency, period), [stats, currency, period]);

  return (
    <div className="wrap">
      <header className="pagehead">
        <div>
          <div className="pagetitle">Panoramica</div>
          <div className="pagesub">Le tue finanze in sintesi</div>
        </div>
      </header>

      <PeriodBar
        period={period}
        setPeriod={setPeriod}
        refDate={refDate}
        setRefDate={setRefDate}
        day={day}
        anchors={anchors}
      />

      {loading && txs.length === 0 ? (
        <div className="spinner">Caricamento…</div>
      ) : (
        <DashboardView stats={stats} daily={daily} insights={insights} currency={currency} period={period} refDate={refDate} />
      )}
    </div>
  );
}

/* ===================== Calcoli ===================== */

const EXPENSE_BUCKETS = new Set(["needs", "wants", "savings", "utility"]);

function bucketOf(t) {
  const b = t.categories?.bucket;
  if (b) return b;
  return Number(t.amount) < 0 ? "utility" : "income";
}

function netExpenses(txs) {
  const perCat = new Map();
  for (const t of txs) {
    const b = bucketOf(t);
    if (b === "transfer" || b === "income") continue;
    const key = t.categories?.id || "none";
    perCat.set(key, (perCat.get(key) || 0) + Number(t.amount));
  }
  let total = 0;
  for (const net of perCat.values()) total += Math.max(0, -net);
  return total;
}

// Serie giornaliera cumulata delle uscite nel periodo (fino a oggi se corrente).
function buildDaily(txs, range) {
  const start = new Date(range.start);
  const now = new Date();
  const end = new Date(Math.min(range.end.getTime(), now.getTime() + 24 * 3600 * 1000));
  if (end <= start) return [];
  const perDay = new Map();
  for (const t of txs) {
    const b = bucketOf(t);
    if (b === "transfer" || b === "income") continue;
    if (Number(t.amount) >= 0) continue;
    const d = t.value_date || t.booking_date;
    if (!d) continue;
    perDay.set(d, (perDay.get(d) || 0) + Math.abs(Number(t.amount)));
  }
  const out = [];
  let cum = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    const key = toDateStr(d);
    const spent = perDay.get(key) || 0;
    cum += spent;
    out.push({ date: key, spent, cum });
  }
  return out;
}

function computeStats(txs, range, prevTotal) {
  const catMap = new Map();
  const bucketNet = { needs: 0, wants: 0, savings: 0, utility: 0 };
  const bankMap = new Map();
  let income = 0;
  let count = 0;
  let fixed = 0;

  for (const t of txs) {
    const b = bucketOf(t);
    if (b === "transfer") continue;
    count++;
    if (b === "income") {
      if (Number(t.amount) > 0) income += Number(t.amount);
      continue;
    }
    if (t.is_fixed && Number(t.amount) < 0) fixed += Math.abs(Number(t.amount));
    const cat = t.categories;
    const key = cat?.id || "none";
    const cur =
      catMap.get(key) || {
        id: cat?.id || null,
        name: cat?.name || "Non categorizzata",
        color: cat?.color || "#71717a",
        icon: cat?.icon || "",
        net: 0,
      };
    cur.net += Number(t.amount);
    catMap.set(key, cur);
    const bk = EXPENSE_BUCKETS.has(b) ? b : "utility";
    bucketNet[bk] += Number(t.amount);
    const bank = t.bank_connections?.institution_name || "Contanti";
    bankMap.set(bank, (bankMap.get(bank) || 0) + Number(t.amount));
  }

  const pie = [...catMap.values()]
    .map((c) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon, value: Math.max(0, -c.net) }))
    .filter((c) => c.value > 0.005)
    .sort((a, b) => b.value - a.value);
  const expenses = pie.reduce((a, c) => a + c.value, 0);
  const topCategory = pie[0] || null;

  const byBank = [...bankMap.entries()]
    .map(([name, net]) => ({ name, value: Math.max(0, -net) }))
    .filter((b) => b.value > 0.005)
    .sort((a, b) => b.value - a.value);

  const buckets = {
    needs: Math.max(0, -bucketNet.needs),
    wants: Math.max(0, -bucketNet.wants),
    savings: Math.max(0, -bucketNet.savings),
    utility: Math.max(0, -bucketNet.utility),
  };

  const progress = periodProgress(range);
  const perDay = expenses / progress.elapsed;
  const projection = progress.isCurrent ? perDay * progress.total : 0;
  const deltaPct = prevTotal > 0 ? ((expenses - prevTotal) / prevTotal) * 100 : 0;
  const net = income - expenses;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  return {
    expenses, income, net, savingsRate, fixed, pie, topCategory, byBank,
    buckets, count, progress, perDay, projection, deltaPct, prevTotal,
  };
}

// Commenti sintetici sui dati (icone Lucide).
function buildInsights(s, currency, period) {
  const out = [];
  const m = (v) => formatMoney(v, currency);
  const periodWord = period === "month" ? "mese" : period === "quarter" ? "trimestre" : period === "semester" ? "semestre" : "anno";

  if (s.prevTotal > 0) {
    const d = Math.round(s.deltaPct);
    if (d <= -5) out.push({ tone: "good", Icon: PartyPopper, text: `Stai spendendo il <b>${Math.abs(d)}% in meno</b> rispetto al ${periodWord} precedente (${m(s.expenses)} vs ${m(s.prevTotal)}).` });
    else if (d >= 5) out.push({ tone: "warn", Icon: TrendingUp, text: `Stai spendendo il <b>${d}% in più</b> rispetto al ${periodWord} precedente (${m(s.expenses)} vs ${m(s.prevTotal)}).` });
    else out.push({ tone: "neutral", Icon: Minus, text: `Spesa <b>in linea</b> col ${periodWord} precedente (${m(s.expenses)}).` });
  }

  if (s.progress.isCurrent && s.projection > 0) {
    const daysLeft = s.progress.total - s.progress.elapsed;
    if (s.prevTotal > 0 && s.projection > s.prevTotal * 1.1)
      out.push({ tone: "bad", Icon: Telescope, text: `A questo ritmo chiuderai il ${periodWord} a <b>~${m(s.projection)}</b>, oltre il periodo scorso. Restano ${daysLeft} giorni.` });
    else
      out.push({ tone: "neutral", Icon: Telescope, text: `A questo ritmo chiuderai il ${periodWord} intorno a <b>${m(s.projection)}</b> (${daysLeft} giorni alla fine).` });
  }

  if (s.income > 0) {
    const r = Math.round(s.savingsRate);
    if (r >= 20) out.push({ tone: "good", Icon: PiggyBank, text: `Ottimo: stai risparmiando il <b>${r}%</b> delle entrate (${m(s.net)}).` });
    else if (r >= 0) out.push({ tone: "warn", Icon: Target, text: `Stai risparmiando il <b>${r}%</b> delle entrate: sotto la soglia consigliata del 20%.` });
    else out.push({ tone: "bad", Icon: TriangleAlert, text: `Stai spendendo <b>più di quanto entra</b> (${m(-s.net)} in rosso nel ${periodWord}).` });
  }

  if (s.topCategory && s.expenses > 0) {
    const pct = Math.round((s.topCategory.value / s.expenses) * 100);
    out.push({ tone: "neutral", Icon: Trophy, text: `<b>${s.topCategory.name}</b> è la voce più pesante: ${m(s.topCategory.value)} (${pct}% delle uscite).` });
  }

  if (s.fixed > 0 && s.expenses > 0) {
    const pct = Math.round((s.fixed / s.expenses) * 100);
    out.push({ tone: "neutral", Icon: Pin, text: `Le spese fisse pesano <b>${pct}%</b> delle uscite (${m(s.fixed)}): la parte su cui hai meno margine.` });
  }

  return out.slice(0, 5);
}
