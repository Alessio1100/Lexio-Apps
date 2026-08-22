"use client";

import { useEffect, useMemo, useState } from "react";
import PeriodBar from "../../components/PeriodBar";
import { api } from "../../lib/api";
import { getPeriodRange, toDateStr } from "../../lib/periods";
import { formatMoney, formatDateLong } from "../../lib/format";

export default function TransazioniPage() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [connections, setConnections] = useState([]);
  const [period, setPeriod] = useState("month");
  const [refDate, setRefDate] = useState(new Date());
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fCat, setFCat] = useState("");
  const [fConn, setFConn] = useState("");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/settings").catch(() => ({ month_start_day: 1, currency: "EUR" })),
      api.get("/api/categories").catch(() => []),
      api.get("/api/gocardless/connections").catch(() => []),
    ]).then(([s, c, conn]) => {
      setSettings(s);
      if (s?.default_period) setPeriod(s.default_period);
      setCategories(c || []);
      setConnections(conn || []);
    });
  }, []);

  const day = settings?.month_start_day ?? 1;
  const currency = settings?.currency ?? "EUR";
  const range = useMemo(() => getPeriodRange(period, refDate, day), [period, refDate, day]);

  function reload() {
    if (!settings) return;
    setLoading(true);
    const params = new URLSearchParams({
      from: toDateStr(range.start),
      to: toDateStr(range.end),
    });
    if (fCat) params.set("category", fCat);
    if (fConn) params.set("connection", fConn);
    if (q) params.set("q", q);
    api
      .get(`/api/transactions?${params}`)
      .then((d) => setTxs(d || []))
      .catch(() => setTxs([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, period, refDate, day, fCat, fConn]);

  const groups = useMemo(() => groupByDay(txs), [txs]);

  async function assign(catId, reset) {
    try {
      const updated = await api.patch(`/api/transactions/${editing.id}`, {
        category_id: reset ? null : catId,
        reset: !!reset,
      });
      setTxs((prev) =>
        prev.map((t) =>
          t.id === editing.id
            ? { ...t, ...updated, categories: updated.categories }
            : t
        )
      );
      setEditing(null);
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="wrap">
      <header className="pagehead">
        <div>
          <div className="pagetitle">Spese</div>
          <div className="pagesub">Tutte le transazioni</div>
        </div>
      </header>

      <PeriodBar
        period={period}
        setPeriod={setPeriod}
        refDate={refDate}
        setRefDate={setRefDate}
        day={day}
      />

      {/* filtri */}
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <input
          className="input"
          placeholder="Cerca…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && reload()}
        />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        <select
          className="select"
          value={fCat}
          onChange={(e) => setFCat(e.target.value)}
        >
          <option value="">Tutte le categorie</option>
          <option value="none">Non categorizzate</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={fConn}
          onChange={(e) => setFConn(e.target.value)}
        >
          <option value="">Tutte le banche</option>
          {connections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.institution_name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="spinner">Caricamento…</div>
      ) : groups.length === 0 ? (
        <div className="empty">
          Nessuna transazione nel periodo.
          <br />
          Collega una banca e sincronizza dalle Impostazioni.
        </div>
      ) : (
        groups.map((g) => (
          <div className="daygroup" key={g.date}>
            <div className="dayhead">
              <span>{formatDateLong(g.date)}</span>
              <span>{formatMoney(-g.spent, currency)}</span>
            </div>
            {g.items.map((t) => (
              <TxRow
                key={t.id}
                tx={t}
                currency={currency}
                onClick={() => setEditing(t)}
              />
            ))}
          </div>
        ))
      )}

      {editing && (
        <CategoryModal
          tx={editing}
          categories={categories}
          currency={currency}
          onClose={() => setEditing(null)}
          onAssign={assign}
        />
      )}
    </div>
  );
}

function TxRow({ tx, currency, onClick }) {
  const cat = tx.categories;
  const color = cat?.color || "#71717a";
  const amount = Number(tx.amount);
  const bank = tx.bank_connections?.institution_name || "";
  return (
    <button
      className="txrow"
      style={{ borderLeftColor: color }}
      onClick={onClick}
    >
      <span
        className="txicon"
        style={{ background: `${color}22`, color }}
      >
        {cat?.icon || "❓"}
      </span>
      <span className="txbody">
        <span className="txname">
          {tx.merchant_name || tx.description || "Transazione"}
        </span>
        <span className="txmeta">
          <span>{cat?.name || "Non categorizzata"}</span>
          {bank && (
            <span className="bankdot" style={{ color: "var(--muted)" }}>
              {shortBank(bank)}
            </span>
          )}
        </span>
      </span>
      <span className={`txamount ${amount >= 0 ? "pos" : ""}`}>
        {formatMoney(amount, currency)}
      </span>
    </button>
  );
}

function CategoryModal({ tx, categories, currency, onClose, onAssign }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Categorizza</h3>
        <div style={{ marginBottom: 14, color: "var(--muted)", fontSize: 13 }}>
          {tx.merchant_name || tx.description}
          <div style={{ color: "var(--text)", fontWeight: 700, marginTop: 4 }}>
            {formatMoney(Number(tx.amount), currency)}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {categories.map((c) => (
            <button
              key={c.id}
              className="btn secondary"
              style={{
                justifyContent: "flex-start",
                borderColor:
                  tx.category_id === c.id ? c.color : "var(--border)",
              }}
              onClick={() => onAssign(c.id, false)}
            >
              <span style={{ marginRight: 6 }}>{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>
        <button
          className="btn secondary block"
          style={{ marginTop: 12 }}
          onClick={() => onAssign(null, true)}
        >
          ↺ Categorizzazione automatica (regole)
        </button>
      </div>
    </div>
  );
}

function shortBank(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("revolut")) return "Revolut";
  if (n.includes("buddy")) return "BuddyBank";
  return name.length > 12 ? name.slice(0, 12) + "…" : name;
}

function groupByDay(txs) {
  const map = new Map();
  for (const t of txs) {
    const d = t.booking_date || "—";
    if (!map.has(d)) map.set(d, { date: d, items: [], spent: 0 });
    const g = map.get(d);
    g.items.push(t);
    if (Number(t.amount) < 0) g.spent += Math.abs(Number(t.amount));
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
