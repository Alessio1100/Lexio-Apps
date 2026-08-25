"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { formatMoney } from "../lib/format";
import { catColor, OTHER_COLOR } from "../lib/colors";
import { CatIcon } from "../lib/icons";

const MAX_SLICES = 7;

// Aggrega la coda in "Altro" così la torta resta leggibile (poche fette),
// e assegna a ogni fetta un colore distinto e stabile.
function prepare(data) {
  const withColor = (data || []).map((d) => ({
    ...d,
    color: catColor(d),
  }));
  if (withColor.length <= MAX_SLICES + 1) return withColor;
  const top = withColor.slice(0, MAX_SLICES);
  const rest = withColor.slice(MAX_SLICES);
  const restVal = rest.reduce((a, c) => a + c.value, 0);
  return [
    ...top,
    { name: `Altro (${rest.length})`, icon: "•", value: restVal, color: OTHER_COLOR, isOther: true },
  ];
}

function ActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={4}
    />
  );
}

export default function CategoryPie({ data, currency, total }) {
  const slices = prepare(data);
  const [active, setActive] = useState(-1);

  if (!slices.length) {
    return <div className="empty">Nessuna spesa nel periodo selezionato.</div>;
  }

  const focus = active >= 0 ? slices[active] : null;

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: 236 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={72}
              outerRadius={104}
              paddingAngle={2.5}
              cornerRadius={4}
              stroke="none"
              activeIndex={active}
              activeShape={ActiveShape}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(-1)}
              isAnimationActive
            >
              {slices.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.color}
                  opacity={active === -1 || active === i ? 1 : 0.4}
                  style={{ transition: "opacity 0.2s" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            textAlign: "center",
            padding: "0 60px",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
            {focus ? (
              <>
                <CatIcon name={focus.name} size={13} color={focus.color} />
                {focus.name}
              </>
            ) : (
              "Totale spese"
            )}
          </div>
          <div className="money" style={{ fontFamily: "var(--font-display)", fontSize: 25, fontWeight: 800, letterSpacing: "-0.7px", marginTop: 3 }}>
            {formatMoney(focus ? focus.value : total, currency)}
          </div>
          {focus && total > 0 && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {((focus.value / total) * 100).toFixed(0)}% delle uscite
            </div>
          )}
        </div>
      </div>

      <div className="legend">
        {slices.map((d, i) => {
          const pct = total ? (d.value / total) * 100 : 0;
          return (
            <div
              className="legrow"
              key={i}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(-1)}
              style={{ opacity: active === -1 || active === i ? 1 : 0.5 }}
            >
              <span className="leg-ic" style={{ background: `${d.color}22`, color: d.color }}>
                <CatIcon name={d.name} size={15} />
              </span>
              <span className="legname">{d.name}</span>
              <span className="legval money">{formatMoney(d.value, currency)}</span>
              <span className="legpct">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
