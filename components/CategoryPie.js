"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatMoney } from "../lib/format";

export default function CategoryPie({ data, currency, total }) {
  if (!data || !data.length) {
    return <div className="empty">Nessuna spesa nel periodo selezionato.</div>;
  }

  return (
    <div>
      <div style={{ position: "relative", width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
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
          }}
        >
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Totale spese</div>
          <div style={{ fontSize: 22, fontWeight: 750 }}>
            {formatMoney(total, currency)}
          </div>
        </div>
      </div>

      <div className="legend">
        {data.map((d, i) => {
          const pct = total ? (d.value / total) * 100 : 0;
          return (
            <div className="legrow" key={i}>
              <span className="legdot" style={{ background: d.color }} />
              <span className="legname">
                {d.icon ? `${d.icon} ` : ""}
                {d.name}
              </span>
              <span className="legval">{formatMoney(d.value, currency)}</span>
              <span className="legpct">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
