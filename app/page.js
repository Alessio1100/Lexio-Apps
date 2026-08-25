"use client";

import { useEffect, useMemo, useState } from "react";
import PeriodBar from "../components/PeriodBar";
import CategoryPie from "../components/CategoryPie";
import { api } from "../lib/api";
import { getPeriodRange, toDateStr, periodProgress, shiftPeriod } from "../lib/periods";
import { formatMoney, formatPct } from "../lib/format";

export default function Dashboard() {
  const [settings, setSettings] = useState(null);
  const [period, setPeriod] = useState("month");
  const [refDate, setRefDate] = useState(new Date());
  const [txs, setTxs] = useState([]);
  const [prevTotal, setPrevTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // carica impostazioni all'avvio
  useEffect(() => {
    api
      .get("/api/settings")
      .then((s) => {
        setSettings(s);
        if (s?.default_period) setPeriod(s.default_period);
      })
      .catch(() => setSettings({ month_start_day: 1, currency: "EUR" }));
  }, []);

  const day = settings?.month_start_day ?? 1;
  const currency = settings?.currency ?? "EUR";
  const anchors = settings?.salary_anchors || null;
  const range = useMemo(
    () => getPeriodRange(period, refDate, day, anchors),
    [period, refDate, day, anchors]
  );

  // carica transazioni del periodo (+ periodo precedente per confronto)
  useEffect(() => {
    if (!settings) return;
    setLoading(true);
    const from = toDateStr(range.start);
    const to = toDateStr(range.end);
    const prevRef = shiftPeriod(period, refDate, day, -1, anchors);
    const prevRange = getPeriodRange(period, prevRef, day, anchors);

    Promise.all([
      api.get(`/api/transactions?from=${from}&to=${to}`),
      api.get(
        `/api/transactions?from=${toDateStr(prevRange.start)}&to=${toDateStr(
          prevRange.end
        )}`
      ),
    ])
      .then(([cur, prev]) => {
        setTxs(cur || []);
        setPrevTotal(netExpenses(prev || []));
      })
      .catch(() => {
        setTxs([]);
        setPrevTotal(0);
      })
      .finally(() => setLoading(false));
  }, [settings, period, refDate, day, range.start, range.end]);

  const stats = useMemo(() => computeStats(txs, range, prevTotal), [txs, range, prevTotal]);

  return (
    <div className="wrap">
      <header className="pagehead">
        <div>
          <div className="pagetitle">Panoramica</div>
          <div className="pagesub">Le tue spese in sintesi</div>
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

      {loading ? (
        <div className="spinner">Caricamento…</div>
      ) : (
        <>
          {/* KPI principale + torta */}
          <div className="card" style={{ marginTop: 6 }}>
            <CategoryPie
              data={stats.pie}
              currency={currency}
              total={stats.expenses}
            />
          </div>

          {/* KPI fintech */}
          <div className="kpigrid" style={{ marginTop: 14 }}>
            <div className="kpi">
              <div className="label">📉 Uscite</div>
              <div className="value neg">{formatMoney(stats.expenses, currency)}</div>
              {prevTotal > 0 && (
                <div className="sub">
                  <span className={stats.deltaPct <= 0 ? "pos" : "neg"}>
                    {formatPct(stats.deltaPct)}
                  </span>{" "}
                  vs precedente
                </div>
              )}
            </div>
            <div className="kpi">
              <div className="label">📈 Entrate</div>
              <div className="value pos">{formatMoney(stats.income, currency)}</div>
            </div>
            <div className="kpi">
              <div className="label">💰 Saldo netto</div>
              <div className={`value ${stats.net >= 0 ? "pos" : "neg"}`}>
                {formatMoney(stats.net, currency)}
              </div>
            </div>
            <div className="kpi">
              <div className="label">📅 Media / giorno</div>
              <div className="value">{formatMoney(stats.perDay, currency)}</div>
              <div className="sub">
                {stats.progress.elapsed}/{stats.progress.total} giorni
              </div>
            </div>
            {stats.topCategory && (
              <div className="kpi">
                <div className="label">🏆 Categoria top</div>
                <div className="value" style={{ fontSize: 18 }}>
                  {stats.topCategory.icon} {stats.topCategory.name}
                </div>
                <div className="sub">
                  {formatMoney(stats.topCategory.value, currency)}
                </div>
              </div>
            )}
            <div className="kpi">
              <div className="label">🔢 Transazioni</div>
              <div className="value">{stats.count}</div>
            </div>
            <div className="kpi">
              <div className="label">📌 Spese fisse</div>
              <div className="value">{formatMoney(stats.fixed, currency)}</div>
              <div className="sub">
                {stats.expenses ? Math.round((stats.fixed / stats.expenses) * 100) : 0}% delle
                uscite
              </div>
            </div>
            {stats.progress.isCurrent && stats.projection > 0 && (
              <div className="kpi big">
                <div className="label">🔮 Proiezione fine periodo</div>
                <div className="value">{formatMoney(stats.projection, currency)}</div>
                <div className="sub">
                  stima basata sulla media giornaliera attuale
                </div>
              </div>
            )}
          </div>

          {/* Regola 50/30/20 */}
          {stats.expenses > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <div
                className="label"
                style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}
              >
                Regola 50/30/20
              </div>
              {[
                { k: "needs", label: "Bisogni", target: 50, color: "#ef4444" },
                { k: "wants", label: "Desideri", target: 30, color: "#f59e0b" },
                { k: "savings", label: "Risparmio", target: 20, color: "#22c55e" },
              ].map((row) => {
                const val = stats.buckets[row.k] || 0;
                const pct = stats.expenses ? (val / stats.expenses) * 100 : 0;
                return (
                  <div key={row.k} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        marginBottom: 5,
                      }}
                    >
                      <span>{row.label}</span>
                      <span>
                        <strong>{pct.toFixed(0)}%</strong>
                        <span style={{ color: "var(--muted)" }}>
                          {" "}
                          / {row.target}% · {formatMoney(val, currency)}
                        </span>
                      </span>
                    </div>
                    <div className="track">
                      <div
                        className="fill"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          background: row.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {stats.buckets.utility > 0 && (
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                  Utility / non categorizzate:{" "}
                  {formatMoney(stats.buckets.utility, currency)}
                </div>
              )}
            </div>
          )}

          {/* Ripartizione per banca */}
          {stats.byBank.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="label" style={{ fontSize: 13, color: "var(--muted)" }}>
                Uscite per banca
              </div>
              <div className="legend">
                {stats.byBank.map((b, i) => (
                  <div className="legrow" key={i}>
                    <span className="legname">🏦 {b.name}</span>
                    <span className="legval">{formatMoney(b.value, currency)}</span>
                    <span className="legpct">
                      {stats.expenses ? Math.round((b.value / stats.expenses) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const EXPENSE_BUCKETS = new Set(["needs", "wants", "savings", "utility"]);

// Bucket di una transazione; se non categorizzata: uscita→utility, entrata→income.
function bucketOf(t) {
  const b = t.categories?.bucket;
  if (b) return b;
  return Number(t.amount) < 0 ? "utility" : "income";
}

// Spesa NETTA: per ogni categoria di spesa somma gli importi con segno
// (i rimborsi positivi riducono la spesa) e azzera i negativi; esclude i
// trasferimenti interni e le entrate.
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

function computeStats(txs, range, prevTotal) {
  const catMap = new Map(); // id -> { name, color, icon, net }
  const bucketNet = { needs: 0, wants: 0, savings: 0, utility: 0 };
  const bankMap = new Map(); // banca -> net
  let income = 0;
  let count = 0;
  let fixed = 0; // spese fisse (uscite marcate come ricorrenti)

  for (const t of txs) {
    const b = bucketOf(t);
    if (b === "transfer") continue; // giroconti interni: esclusi
    count++;
    if (b === "income") {
      if (Number(t.amount) > 0) income += Number(t.amount);
      continue;
    }
    if (t.is_fixed && Number(t.amount) < 0) fixed += Math.abs(Number(t.amount));
    // categoria di spesa: accumula il netto (i rimborsi positivi scalano la spesa)
    const cat = t.categories;
    const key = cat?.id || "none";
    const cur =
      catMap.get(key) || {
        name: cat?.name || "Non categorizzata",
        color: cat?.color || "#71717a",
        icon: cat?.icon || "",
        net: 0,
      };
    cur.net += Number(t.amount);
    catMap.set(key, cur);
    const bk = EXPENSE_BUCKETS.has(b) ? b : "utility";
    bucketNet[bk] += Number(t.amount);
    const bank = t.bank_connections?.institution_name || "Altro";
    bankMap.set(bank, (bankMap.get(bank) || 0) + Number(t.amount));
  }

  const pie = [...catMap.values()]
    .map((c) => ({ name: c.name, color: c.color, icon: c.icon, value: Math.max(0, -c.net) }))
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

  return {
    expenses,
    income,
    net,
    fixed,
    pie,
    topCategory,
    byBank,
    buckets,
    count,
    progress,
    perDay,
    projection,
    deltaPct,
  };
}
