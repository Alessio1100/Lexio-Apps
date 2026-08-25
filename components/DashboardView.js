"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  TrendingDown, TrendingUp, PiggyBank, Telescope, Lightbulb, PieChart as PieIcon,
  Activity, Trophy, Scale, Landmark, Pin, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import CategoryPie from "./CategoryPie";
import { formatMoney, formatMoneyShort, formatPct, formatDateShort } from "../lib/format";
import { catColor } from "../lib/colors";
import { CatIcon } from "../lib/icons";

// Vista presentazionale della dashboard: riceve stats/daily/insights già calcolati.
export default function DashboardView({ stats, daily, insights, currency }) {
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
        <CategoryPie data={stats.pie} currency={currency} total={stats.expenses} />
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
            <span className="ic-chip tint-amber"><Telescope size={17} /></span> Proiezione
          </div>
          <div className="value money">
            {stats.progress.isCurrent && stats.projection > 0
              ? formatMoneyShort(stats.projection, currency)
              : formatMoneyShort(stats.expenses, currency)}
          </div>
          <div className="sub">
            {stats.progress.isCurrent
              ? `${stats.progress.total - stats.progress.elapsed} giorni alla fine · media ${formatMoney(stats.perDay, currency)}/g`
              : "periodo concluso"}
          </div>
        </div>
      </div>

      {/* ---- Andamento ---- */}
      <div className="card span-7 pos-trend">
        <div className="card-title"><Activity size={15} /> Andamento spesa cumulata</div>
        <SpendTrend daily={daily} currency={currency} projection={stats.projection} isCurrent={stats.progress.isCurrent} />
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

      {/* ---- Per banca ---- */}
      {stats.byBank.length > 0 && (
        <div className="card span-6 pos-bank">
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

      {/* ---- Spese fisse ---- */}
      <div className="card span-6 pos-fixed">
        <div className="card-title"><Pin size={15} /> Spese fisse</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div className="money" style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.6px" }}>
            {formatMoney(stats.fixed, currency)}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {stats.expenses ? Math.round((stats.fixed / stats.expenses) * 100) : 0}% delle uscite
          </div>
        </div>
        <div className="track" style={{ marginTop: 12 }}>
          <div className="fill" style={{ width: `${stats.expenses ? Math.min(100, (stats.fixed / stats.expenses) * 100) : 0}%` }} />
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10 }}>
          Uscite variabili: {formatMoney(Math.max(0, stats.expenses - stats.fixed), currency)}
        </div>
      </div>
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
      <div className="t-val">{formatMoney(p.cum, currency)}</div>
      {p.spent > 0 && (
        <div style={{ color: "var(--muted)", fontSize: 11 }}>+{formatMoney(p.spent, currency)} nel giorno</div>
      )}
    </div>
  );
}

function SpendTrend({ daily, currency, projection, isCurrent }) {
  if (!daily || daily.length < 2) {
    return <div className="empty" style={{ padding: "30px 10px" }}>Dati insufficienti per l'andamento.</div>;
  }
  const maxCum = daily[daily.length - 1].cum;
  return (
    <div style={{ width: "100%", height: 210 }}>
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
          {isCurrent && projection > maxCum && (
            <ReferenceLine y={projection} stroke="var(--amber)" strokeDasharray="4 4" strokeOpacity={0.7} />
          )}
          <Area type="monotone" dataKey="cum" stroke="#34d399" strokeWidth={2.5} fill="url(#spendGrad)" isAnimationActive />
        </AreaChart>
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
                <CatIcon name={c.name} size={15} color={color} />
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
