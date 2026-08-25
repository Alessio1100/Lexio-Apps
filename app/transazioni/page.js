"use client";

import { useEffect, useMemo, useState } from "react";
import PeriodBar from "../../components/PeriodBar";
import { api } from "../../lib/api";
import { getPeriodRange, toDateStr } from "../../lib/periods";
import { formatMoney, formatDateLong } from "../../lib/format";
import { catColor } from "../../lib/colors";
import { CatIcon } from "../../lib/icons";
import { Plus, Pin } from "lucide-react";

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
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/api/settings").catch(() => ({ month_start_day: 1, currency: "EUR" })),
      api.get("/api/categories").catch(() => []),
      api.get("/api/enablebanking/connections").catch(() => []),
    ]).then(([s, c, conn]) => {
      setSettings(s);
      if (s?.default_period) setPeriod(s.default_period);
      setCategories(c || []);
      setConnections(conn || []);
    });
  }, []);

  const day = settings?.month_start_day ?? 1;
  const currency = settings?.currency ?? "EUR";
  const anchors = settings?.salary_anchors || null;
  const range = useMemo(
    () => getPeriodRange(period, refDate, day, anchors),
    [period, refDate, day, anchors]
  );

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

  async function toggleFixed() {
    if (!editing) return;
    const next = !editing.is_fixed;
    try {
      await api.patch(`/api/transactions/${editing.id}`, { is_fixed: next });
      const merchant = (editing.merchant_name || "").toLowerCase().trim();
      setTxs((prev) =>
        prev.map((t) => {
          const same = merchant
            ? (t.merchant_name || "").toLowerCase().trim() === merchant
            : t.id === editing.id;
          return same ? { ...t, is_fixed: next } : t;
        })
      );
      setEditing((e) => (e ? { ...e, is_fixed: next } : e));
    } catch (e) {
      alert(e.message);
    }
  }

  async function addExpense(form) {
    try {
      await api.post("/api/transactions", {
        amount: form.amount,
        is_expense: form.is_expense,
        name: form.name,
        category_id: form.category_id || null,
        date: form.date,
        currency,
      });
      setAdding(false);
      // salta al periodo che contiene la nuova spesa, così è subito visibile
      // (anche se la data cade in un mese diverso da quello che stai guardando);
      // il cambio di refDate fa ripartire il caricamento tramite l'effect.
      if (fCat) setFCat(""); // togli un eventuale filtro categoria che la nasconderebbe
      if (form.date) setRefDate(new Date(`${form.date}T12:00:00`));
      else reload();
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
        <button className="btn" onClick={() => setAdding(true)}>
          <Plus size={17} /> Aggiungi
        </button>
      </header>

      <PeriodBar
        period={period}
        setPeriod={setPeriod}
        refDate={refDate}
        setRefDate={setRefDate}
        day={day}
        anchors={anchors}
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
          onToggleFixed={toggleFixed}
        />
      )}

      {adding && (
        <AddExpenseModal
          categories={categories}
          onClose={() => setAdding(false)}
          onSave={addExpense}
        />
      )}
    </div>
  );
}

function AddExpenseModal({ categories, onClose, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    amount: "",
    is_expense: true,
    name: "",
    category_id: "",
    date: today,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const cats = categories.filter((c) => (form.is_expense ? !c.is_income : c.is_income));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Aggiungi spesa (contanti)</h3>

        <div className="field">
          <label>Tipo</label>
          <div className="chiprow">
            <button
              className={`chip ${form.is_expense ? "active" : ""}`}
              onClick={() => set("is_expense", true)}
            >
              Uscita
            </button>
            <button
              className={`chip ${!form.is_expense ? "active" : ""}`}
              onClick={() => set("is_expense", false)}
            >
              Entrata
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Importo (€)</label>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Data</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Descrizione</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Es. Caffè al bar"
          />
        </div>

        <div className="field">
          <label>Categoria</label>
          <select
            className="select"
            value={form.category_id}
            onChange={(e) => set("category_id", e.target.value)}
          >
            <option value="">— nessuna —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn block"
          disabled={!Number(form.amount)}
          onClick={() => onSave(form)}
        >
          Aggiungi
        </button>
      </div>
    </div>
  );
}

function TxRow({ tx, currency, onClick }) {
  const cat = tx.categories;
  const color = cat ? catColor(cat) : "#71717a";
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
        <CatIcon name={cat?.name} size={19} />
      </span>
      <span className="txbody">
        <span className="txname" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {tx.is_fixed && <Pin size={12} style={{ color: "var(--amber)", flexShrink: 0 }} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            {tx.display_name || tx.merchant_name || tx.description || "Transazione"}
          </span>
        </span>
        <span className="txmeta">
          <span>{cat?.name || "Non categorizzata"}</span>
          {bank ? (
            <span className="bankdot" style={{ color: "var(--muted)" }}>
              {shortBank(bank)}
            </span>
          ) : (
            <span className="bankdot" style={{ color: "var(--muted)" }}>
              💵 Contanti
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

function CategoryModal({ tx, categories, currency, onClose, onAssign, onToggleFixed }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Categorizza</h3>
        <div style={{ marginBottom: 14, color: "var(--muted)", fontSize: 13 }}>
          {tx.description || tx.merchant_name || tx.display_name}
          <div style={{ color: "var(--text)", fontWeight: 700, marginTop: 4 }}>
            {formatMoney(Number(tx.amount), currency)}
          </div>
        </div>

        <button
          className={`btn ${tx.is_fixed ? "" : "secondary"} block`}
          style={{ marginBottom: 14 }}
          onClick={onToggleFixed}
        >
          📌 {tx.is_fixed ? "Spesa fissa attiva — tocca per togliere" : "Segna come spesa fissa"}
        </button>
        {tx.is_fixed && (
          <div style={{ fontSize: 11.5, color: "var(--muted)", margin: "-8px 0 12px" }}>
            Tutte le transazioni di «{tx.merchant_name || "questa controparte"}» sono trattate come
            spese fisse, anche quelle future.
          </div>
        )}
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
              <CatIcon name={c.name} size={16} color={catColor(c)} style={{ marginRight: 8, flexShrink: 0 }} />
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
    // raggruppa per data OPERAZIONE (value_date), non contabile
    const d = t.value_date || t.booking_date || "—";
    if (!map.has(d)) map.set(d, { date: d, items: [], spent: 0 });
    const g = map.get(d);
    g.items.push(t);
    // i giroconti interni non contano nel totale speso del giorno
    if (t.categories?.bucket !== "transfer" && Number(t.amount) < 0)
      g.spent += Math.abs(Number(t.amount));
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
