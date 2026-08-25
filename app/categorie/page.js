"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { getCache, setCache, clearCache } from "../../lib/cache";

const PALETTE = [
  "#22c55e", "#f97316", "#eab308", "#3b82f6", "#ec4899",
  "#a855f7", "#14b8a6", "#8b5cf6", "#6366f1", "#06b6d4",
  "#ef4444", "#94a3b8", "#64748b", "#16a34a", "#f43f5e",
];

const EMPTY = {
  name: "",
  icon: "🏷️",
  color: "#6366f1",
  is_income: false,
  bucket: "wants",
};

const BUCKETS = [
  { value: "needs", label: "Bisogni", hint: "essenziali · obiettivo ≈50%" },
  { value: "wants", label: "Desideri", hint: "stile di vita · obiettivo ≈30%" },
  { value: "savings", label: "Risparmio", hint: "accantonamenti · obiettivo ≈20%" },
  { value: "utility", label: "Utility", hint: "prelievi, commissioni, altro" },
  { value: "transfer", label: "Trasferimenti", hint: "giroconti · esclusi dai conteggi" },
];

export default function CategoriePage() {
  const [cats, setCats] = useState(() => getCache("/api/categories") || []);
  const [loading, setLoading] = useState(() => getCache("/api/categories") === undefined);
  const [editing, setEditing] = useState(null); // oggetto in modifica o EMPTY

  function load() {
    const cached = getCache("/api/categories");
    if (cached !== undefined) {
      setCats(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    api
      .get("/api/categories")
      .then((d) => {
        setCache("/api/categories", d || []);
        setCats(d || []);
      })
      .catch(() => {
        if (cached === undefined) setCats([]);
      })
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save(cat) {
    try {
      if (cat.id) await api.patch(`/api/categories/${cat.id}`, cat);
      else await api.post("/api/categories", cat);
      clearCache("/api/categories");
      clearCache("/api/transactions");
      setEditing(null);
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  async function remove(id) {
    if (!confirm("Eliminare la categoria? Le transazioni resteranno senza categoria."))
      return;
    try {
      await api.del(`/api/categories/${id}`);
      clearCache("/api/categories");
      clearCache("/api/transactions");
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  const byBucket = (b) => cats.filter((c) => !c.is_income && (c.bucket || "wants") === b);
  const income = cats.filter((c) => c.is_income);

  return (
    <div className="wrap">
      <header className="pagehead">
        <div>
          <div className="pagetitle">Categorie</div>
          <div className="pagesub">Come classifichi le spese</div>
        </div>
        <button className="btn" onClick={() => setEditing({ ...EMPTY })}>
          + Nuova
        </button>
      </header>

      {loading && cats.length === 0 ? (
        <div className="spinner">Caricamento…</div>
      ) : (
        <>
          {BUCKETS.map((b) => (
            <Section
              key={b.value}
              title={b.label}
              hint={b.hint}
              items={byBucket(b.value)}
              onEdit={setEditing}
              onDelete={remove}
            />
          ))}
          <Section
            title="Entrate"
            items={income}
            onEdit={setEditing}
            onDelete={remove}
          />
        </>
      )}

      {editing && (
        <CategoryForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function Section({ title, hint, items, onEdit, onDelete }) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div className="dayhead">
        <span>{title}</span>
        {hint && (
          <span style={{ textTransform: "none", fontWeight: 500 }}>{hint}</span>
        )}
      </div>
      {items.map((c) => (
        <div className="txrow" style={{ borderLeftColor: c.color }} key={c.id}>
          <span className="txicon" style={{ background: `${c.color}22`, color: c.color }}>
            {c.icon}
          </span>
          <span className="txbody">
            <span className="txname">{c.name}</span>
          </span>
          <button
            className="btn secondary"
            style={{ padding: "6px 10px", fontSize: 13 }}
            onClick={() => onEdit(c)}
          >
            Modifica
          </button>
          <button
            className="btn danger"
            style={{ padding: "6px 10px", fontSize: 13 }}
            onClick={() => onDelete(c.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function CategoryForm({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{form.id ? "Modifica categoria" : "Nuova categoria"}</h3>

        <div className="field">
          <label>Nome</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Es. Alimentari"
          />
        </div>

        <div className="field">
          <label>Emoji / icona</label>
          <input
            className="input"
            value={form.icon}
            onChange={(e) => set("icon", e.target.value)}
            maxLength={4}
          />
        </div>

        <div className="field">
          <label>Colore</label>
          <div className="chiprow">
            {PALETTE.map((col) => (
              <button
                key={col}
                onClick={() => set("color", col)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: col,
                  border:
                    form.color === col ? "3px solid #fff" : "1px solid var(--border)",
                }}
                aria-label={col}
              />
            ))}
          </div>
        </div>

        <div className="field">
          <label>Tipo</label>
          <div className="chiprow">
            <button
              className={`chip ${!form.is_income ? "active" : ""}`}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  is_income: false,
                  bucket: f.bucket === "income" ? "wants" : f.bucket,
                }))
              }
            >
              Uscita
            </button>
            <button
              className={`chip ${form.is_income ? "active" : ""}`}
              onClick={() =>
                setForm((f) => ({ ...f, is_income: true, bucket: "income" }))
              }
            >
              Entrata
            </button>
          </div>
        </div>

        {!form.is_income && (
          <div className="field">
            <label>Macro-area (50/30/20)</label>
            <div className="chiprow">
              {BUCKETS.map((b) => (
                <button
                  key={b.value}
                  className={`chip ${form.bucket === b.value ? "active" : ""}`}
                  onClick={() => set("bucket", b.value)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn block"
          disabled={!form.name.trim()}
          onClick={() => onSave(form)}
        >
          Salva
        </button>
      </div>
    </div>
  );
}
