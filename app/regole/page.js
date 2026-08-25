"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getCache, setCache, clearCache } from "../../lib/cache";

const FIELDS = [
  { value: "description", label: "Descrizione" },
  { value: "merchant", label: "Controparte" },
  { value: "bank", label: "Banca" },
  { value: "amount", label: "Importo" },
  { value: "foreign", label: "Estero" },
  { value: "direction", label: "Direzione" },
];
const TEXT_OPS = [
  { value: "contains", label: "contiene" },
  { value: "equals", label: "uguale a" },
  { value: "startsWith", label: "inizia con" },
  { value: "regex", label: "regex" },
];
const AMOUNT_OPS = [
  { value: "gt", label: "maggiore di" },
  { value: "lt", label: "minore di" },
  { value: "equals", label: "uguale a" },
];
const FOREIGN_OPS = [{ value: "equals", label: "è" }];
const DIRECTION_OPS = [{ value: "equals", label: "è" }];

function opsFor(field) {
  if (field === "amount") return AMOUNT_OPS;
  if (field === "foreign") return FOREIGN_OPS;
  if (field === "direction") return DIRECTION_OPS;
  return TEXT_OPS;
}

function defaultClauseFor(field) {
  if (field === "amount") return { field, op: "gt", value: "" };
  if (field === "foreign") return { field, op: "equals", value: true };
  if (field === "direction") return { field, op: "equals", value: "in" };
  return { field, op: "contains", value: "" };
}

const emptyRule = () => ({
  name: "",
  priority: 100,
  enabled: true,
  category_id: null,
  conditions: { logic: "and", clauses: [{ field: "description", op: "contains", value: "" }] },
});

export default function RegolePage() {
  const [rules, setRules] = useState(() => getCache("/api/rules") || []);
  const [cats, setCats] = useState(() => getCache("/api/categories") || []);
  const [loading, setLoading] = useState(() => getCache("/api/rules") === undefined);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState(null);

  function load() {
    const cr = getCache("/api/rules");
    if (cr !== undefined) {
      setRules(cr);
      const cc = getCache("/api/categories");
      if (cc !== undefined) setCats(cc);
      setLoading(false);
    } else {
      setLoading(true);
    }
    Promise.all([
      api.get("/api/rules").catch(() => []),
      api.get("/api/categories").catch(() => []),
    ]).then(([r, c]) => {
      setCache("/api/rules", r || []);
      setCache("/api/categories", c || []);
      setRules(r || []);
      setCats(c || []);
      setLoading(false);
    });
  }
  useEffect(load, []);

  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));

  async function save(rule) {
    try {
      if (rule.id) await api.patch(`/api/rules/${rule.id}`, rule);
      else await api.post("/api/rules", rule);
      clearCache("/api/rules");
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    if (!confirm("Eliminare la regola?")) return;
    await api.del(`/api/rules/${id}`);
    clearCache("/api/rules");
    load();
  }

  async function reapply() {
    setMsg(null);
    try {
      const r = await api.post("/api/rules/reapply");
      clearCache("/api/transactions"); // le categorie delle transazioni sono cambiate
      window.dispatchEvent(new CustomEvent("tx-synced", { detail: r }));
      setMsg({ type: "ok", text: `Ricategorizzate ${r.updated} transazioni.` });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    }
  }

  return (
    <div className="wrap">
      <header className="pagehead">
        <div>
          <div className="pagetitle">Regole</div>
          <div className="pagesub">Categorizzazione automatica</div>
        </div>
        <button className="btn" onClick={() => setEditing(emptyRule())}>
          + Nuova
        </button>
      </header>

      {msg && <div className={`banner ${msg.type}`}>{msg.text}</div>}

      <button className="btn secondary block" onClick={reapply}>
        ↻ Riapplica le regole a tutte le transazioni
      </button>
      <div style={{ fontSize: 12, color: "var(--muted)", margin: "8px 2px 0" }}>
        Le regole si applicano dall'alto verso il basso (priorità crescente): vince la
        prima che corrisponde. Le categorie assegnate a mano non vengono toccate.
      </div>

      {loading && rules.length === 0 ? (
        <div className="spinner">Caricamento…</div>
      ) : rules.length === 0 ? (
        <div className="empty">Nessuna regola. Creane una per categorizzare in automatico.</div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {rules.map((r) => {
            const cat = catById[r.category_id];
            return (
              <div
                className="txrow"
                style={{ borderLeftColor: cat?.color || "var(--border)" }}
                key={r.id}
              >
                <span
                  className="txicon"
                  style={{
                    background: `${cat?.color || "#71717a"}22`,
                    color: cat?.color || "#71717a",
                  }}
                >
                  {cat?.icon || "⚙️"}
                </span>
                <span className="txbody">
                  <span className="txname">
                    {r.name} {!r.enabled && "(disattivata)"}
                  </span>
                  <span className="txmeta">
                    → {cat?.name || "nessuna"} · prio {r.priority} ·{" "}
                    {describeConditions(r.conditions)}
                  </span>
                </span>
                <button
                  className="btn secondary"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  onClick={() => setEditing(r)}
                >
                  Modifica
                </button>
                <button
                  className="btn danger"
                  style={{ padding: "6px 10px", fontSize: 13 }}
                  onClick={() => remove(r.id)}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <RuleForm
          initial={editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function describeConditions(cond) {
  const clauses = cond?.clauses || [];
  if (!clauses.length) return "nessuna condizione";
  const logic = cond.logic === "or" ? " o " : " e ";
  return clauses
    .map((c) => `${c.field} ${c.op} "${c.value}"`)
    .join(logic)
    .slice(0, 60);
}

function RuleForm({ initial, cats, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setCond = (patch) =>
    setForm((f) => ({ ...f, conditions: { ...f.conditions, ...patch } }));

  function setClause(i, patch) {
    const clauses = form.conditions.clauses.map((c, idx) =>
      idx === i ? { ...c, ...patch } : c
    );
    setCond({ clauses });
  }
  function addClause() {
    setCond({
      clauses: [
        ...form.conditions.clauses,
        { field: "description", op: "contains", value: "" },
      ],
    });
  }
  function removeClause(i) {
    setCond({ clauses: form.conditions.clauses.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{form.id ? "Modifica regola" : "Nuova regola"}</h3>

        <div className="field">
          <label>Nome</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Es. Supermercati"
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Categoria</label>
            <select
              className="select"
              value={form.category_id || ""}
              onChange={(e) => set("category_id", e.target.value || null)}
            >
              <option value="">— scegli —</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ width: 90 }}>
            <label>Priorità</label>
            <input
              className="input"
              type="number"
              value={form.priority}
              onChange={(e) => set("priority", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="field">
          <label>Combina le condizioni con</label>
          <div className="chiprow">
            <button
              className={`chip ${form.conditions.logic === "and" ? "active" : ""}`}
              onClick={() => setCond({ logic: "and" })}
            >
              Tutte (E)
            </button>
            <button
              className={`chip ${form.conditions.logic === "or" ? "active" : ""}`}
              onClick={() => setCond({ logic: "or" })}
            >
              Almeno una (O)
            </button>
          </div>
        </div>

        <label style={{ fontSize: 12.5, color: "var(--muted)" }}>Condizioni</label>
        {form.conditions.clauses.map((c, i) => {
          const ops = opsFor(c.field);
          return (
            <div key={i} style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <select
                className="select"
                style={{ flex: 1 }}
                value={c.field}
                onChange={(e) => setClause(i, defaultClauseFor(e.target.value))}
              >
                {FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                className="select"
                style={{ flex: 1 }}
                value={c.op}
                onChange={(e) => setClause(i, { op: e.target.value })}
              >
                {ops.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {c.field === "foreign" ? (
                <select
                  className="select"
                  style={{ flex: 1 }}
                  value={c.value === true || c.value === "true" ? "true" : "false"}
                  onChange={(e) => setClause(i, { value: e.target.value === "true" })}
                >
                  <option value="true">Sì</option>
                  <option value="false">No</option>
                </select>
              ) : c.field === "direction" ? (
                <select
                  className="select"
                  style={{ flex: 1 }}
                  value={c.value === "out" ? "out" : "in"}
                  onChange={(e) => setClause(i, { value: e.target.value })}
                >
                  <option value="in">Entrata</option>
                  <option value="out">Uscita</option>
                </select>
              ) : (
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={c.value}
                  onChange={(e) => setClause(i, { value: e.target.value })}
                  placeholder={c.field === "amount" ? "€" : "testo"}
                />
              )}
              {form.conditions.clauses.length > 1 && (
                <button
                  className="btn danger"
                  style={{ padding: "0 12px" }}
                  onClick={() => removeClause(i)}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
        <button
          className="btn secondary"
          style={{ marginTop: 10, fontSize: 13, padding: "8px 12px" }}
          onClick={addClause}
        >
          + Aggiungi condizione
        </button>

        <div className="field" style={{ marginTop: 16 }}>
          <div className="chiprow">
            <button
              className={`chip ${form.enabled ? "active" : ""}`}
              onClick={() => set("enabled", !form.enabled)}
            >
              {form.enabled ? "✓ Attiva" : "Disattivata"}
            </button>
          </div>
        </div>

        <button
          className="btn block"
          disabled={!form.name.trim() || !form.category_id}
          onClick={() => onSave(form)}
        >
          Salva
        </button>
      </div>
    </div>
  );
}
