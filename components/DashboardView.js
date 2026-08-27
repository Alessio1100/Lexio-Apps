"use client";

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  TrendingDown, TrendingUp, PiggyBank, Lightbulb, PieChart as PieIcon,
  Activity, Trophy, Scale, Landmark, Pin, ArrowUp, ArrowDown, Minus, BarChart3,
} from "lucide-react";
import CategoryPie from "./CategoryPie";
import { formatMoney, formatMoneyShort, formatPct, formatDateShort } from "../lib/format";
import { catColor } from "../lib/colors";
import { CatIcon } from "../lib/icons";

// Vista presentazionale della dashboard: riceve stats/daily/insights già calcolati.
export default function DashboardView({ stats, daily, monthly, insights, currency, period, refDate }) {
  return (
    <div className="dash">
      {/* ---- KPI: Uscite / Entrate ---- */}
      <div className="kpirow">
        <div className="kpi">
          <div className="khead">
            <span className="ic-chip tint-rose"><TrendingDown size={17} /></span> Uscite
          </div>
          <div className="value neg money">{formatMoney(stats.expenses, currency)}</div>
          <div className="sub">
            {stats.prevTotal > 0 ? (
              <><DeltaPill pct={stats.deltaPct} invert /> vs periodo prec.</>
            ) : (
              `${stats.count} transazioni`
            )}
          </div>
        </div>
        <div className="kpi">
          <div className="khead">
            <span className="ic-chip tint-brand"><TrendingUp size={17} /></span> Entrate
          </div>
          <div className="value pos money">{formatMoney(stats.income, currency)}</div>
          <div className="sub money">Saldo netto {formatMoney(stats.net, currency)}</div>
        </div>
      </div>

      {/* ---- Torta categorie (mobile: tra le due coppie di KPI; desktop: sotto i 4) ---- */}
      <div className="card span-5 pos-pie">
        <div className="card-title"><PieIcon size={15} /> Uscite per categoria</div>
        <CategoryPie data={stats.pie} currency={currency} total={stats.expenses} period={period} refDate={refDate} />
      </div>

      {/* ---- KPI: Tasso di risparmio / Proiezione ---- */}
      <div className="kpirow">
        <div className="kpi">
          <div className="khead">
            <span className="ic-chip tint-sky"><PiggyBank size={17} /></span> Tasso di risparmio
          </div>
          <div className={`value money ${stats.savingsRate >= 0 ? "pos" : "neg"}`}>
            {stats.income > 0 ? `${Math.round(stats.savingsRate)}%` : "—"}
          </div>
          <div className="sub money">
            {stats.income > 0
              ? `${formatMoney(stats.net, currency)} messi da parte`
              : "nessuna entrata nel periodo"}
          </div>
        </div>
        <div className="kpi">
          <div className="khead">
            <span className="ic-chip tint-amber"><Pin size={17} /></span> Spese fisse
          </div>
          <div className="value money">{formatMoney(stats.fixed, currency)}</div>
          <div className="sub">
            {stats.expenses ? Math.round((stats.fixed / stats.expenses) * 100) : 0}% delle uscite · variabili {formatMoney(Math.max(0, stats.expenses - stats.fixed), currency)}
          </div>
        </div>
      </div>

      {/* ---- Grafici affiancati alla torta (desktop): spesa giornaliera + spese per mese.
             Su desktop la colonna si allunga fino all'altezza della torta e i due
             grafici si dividono l'altezza a metà dinamicamente. ---- */}
      <div className="chartstack pos-charts span-7">
        <div className="card chartcard pos-trend">
          <div className="card-title"><Activity size={15} /> Spesa giornaliera</div>
          <div className="chartbox"><SpendTrend daily={daily} currency={currency} /></div>
        </div>
        {monthly && monthly.length > 0 && (
          <div className="card chartcard pos-months">
            <div className="card-title"><BarChart3 size={15} /> Spese per mese · anno in corso</div>
            <div className="chartbox chartbox-tall"><MonthlyBars data={monthly} currency={currency} /></div>
          </div>
        )}
      </div>

      {/* ---- Insight ---- */}
      {insights.length > 0 && (
        <div className="card span-12 pos-insights">
          <div className="card-title"><Lightbulb size={15} /> Cosa dicono i dati</div>
          <div className="insights">
            {insights.map((it, i) => (
              <div className={`insight ${it.tone}`} key={i}>
                <span className="ic-chip"><it.Icon size={16} /></span>
                <span dangerouslySetInnerHTML={{ __html: it.text }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Top categorie ---- */}
      {stats.pie.length > 0 && (
        <div className="card span-6 pos-spend">
          <div className="card-title"><Trophy size={15} /> Dove vanno i soldi</div>
          <TopCategories pie={stats.pie} total={stats.expenses} currency={currency} />
        </div>
      )}

      {/* ---- 50/30/20 ---- */}
      {stats.expenses > 0 && (
        <div className="card span-6 pos-5030">
          <div className="card-title"><Scale size={15} /> Regola 50/30/20</div>
          {[
            { k: "needs", label: "Bisogni", target: 50, color: "#f43f5e" },
            { k: "wants", label: "Desideri", target: 30, color: "#f59e0b" },
            { k: "savings", label: "Risparmio", target: 20, color: "#22c55e" },
          ].map((row) => {
            const val = stats.buckets[row.k] || 0;
            const pct = stats.expenses ? (val / stats.expenses) * 100 : 0;
            return (
              <div key={row.k} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span>{row.label}</span>
                  <span>
                    <strong>{pct.toFixed(0)}%</strong>
                    <span style={{ color: "var(--muted)" }}> / {row.target}% · {formatMoney(val, currency)}</span>
                  </span>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: `${Math.min(100, pct)}%`, background: row.color }} />
                </div>
              </div>
            );
          })}
          {stats.buckets.utility > 0 && (
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
              Utility / non categorizzate: {formatMoney(stats.buckets.utility, currency)}
            </div>
          )}
        </div>
      )}

      {/* ---- Per banca (a tutta larghezza in fondo) ---- */}
      {stats.byBank.length > 0 && (
        <div className="card span-12 pos-bank">
          <div className="card-title"><Landmark size={15} /> Uscite per banca</div>
          <div className="legend">
            {stats.byBank.map((b, i) => {
              const pct = stats.expenses ? (b.value / stats.expenses) * 100 : 0;
              return (
                <div className="legrow" key={i}>
                  <span className="leg-ic" style={{ background: "var(--surface-2)", color: "var(--sky)" }}>
                    <Landmark size={15} />
                  </span>
                  <span className="legname">{b.name}</span>
                  <span className="legval money">{formatMoney(b.value, currency)}</span>
                  <span className="legpct">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

function DeltaPill({ pct, invert }) {
  const rounded = Math.round(pct);
  const cls = rounded > 1 ? (invert ? "up" : "down") : rounded < -1 ? (invert ? "down" : "up") : "flat";
  const Arrow = rounded > 1 ? ArrowUp : rounded < -1 ? ArrowDown : Minus;
  return (<span className={`delta ${cls}`}><Arrow /> {formatPct(pct)}</span>);
}

function TrendTip({ active, payload, currency }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="t-label">{formatDateShort(p.date)}</div>
      <div className="t-val">{formatMoney(p.spent, currency)}</div>
    </div>
  );
}

// Spesa giornaliera (non cumulata): una barra per ogni giorno del periodo.
function SpendTrend({ daily, currency }) {
  if (!daily || daily.length < 2) {
    return <div className="empty" style={{ padding: "30px 10px" }}>Dati insufficienti per l'andamento.</div>;
  }
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={daily} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fill: "var(--muted-2)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={28} />
          <YAxis tickFormatter={(v) => formatMoneyShort(v, currency)} tick={{ fill: "var(--muted-2)", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<TrendTip currency={currency} />} cursor={{ stroke: "var(--border)" }} />
          <Area type="monotone" dataKey="spent" stroke="#34d399" strokeWidth={2.5} fill="url(#spendGrad)" isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MonthlyTip({ active, payload, currency }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="chart-tip">
      <div className="t-label">{p.month}</div>
      <div className="t-val">{formatMoney(p.value, currency)}</div>
    </div>
  );
}

// Istogramma: una "torre" per ogni mese dell'anno in corso con la spesa totale del mese.
function MonthlyBars({ data, currency }) {
  const hasData = data.some((d) => d.value > 0.005);
  if (!hasData) {
    return <div className="empty" style={{ padding: "30px 10px" }}>Nessuna spesa registrata quest'anno.</div>;
  }
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fill: "var(--muted-2)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatMoneyShort(v, currency)} tick={{ fill: "var(--muted-2)", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
          <Tooltip content={<MonthlyTip currency={currency} />} cursor={{ fill: "var(--surface-2)", opacity: 0.4 }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive>
            {data.map((d, i) => (
              <Cell key={i} fill={i === data.length - 1 ? "#34d399" : "#0e9f6e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopCategories({ pie, total, currency }) {
  const top = pie.slice(0, 6);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
      {top.map((c, i) => {
        const pct = total ? (c.value / total) * 100 : 0;
        const color = catColor(c);
        return (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <CatIcon name={c.name} icon={c.icon} size={15} color={color} />
                {c.name}
              </span>
              <span className="money" style={{ fontWeight: 700 }}>
                {formatMoney(c.value, currency)}
                <span style={{ color: "var(--muted)", fontWeight: 500 }}> · {pct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="catbar-track">
              <div className="catbar-fill" style={{ width: `${Math.max(3, pct)}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
