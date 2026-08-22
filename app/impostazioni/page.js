"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { createClient } from "../../lib/supabase/client";
import { PERIODS, PERIOD_LABELS } from "../../lib/periods";

export default function ImpostazioniPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [connections, setConnections] = useState([]);
  const [msg, setMsg] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [picker, setPicker] = useState(null); // lista istituzioni
  const [pickerLoading, setPickerLoading] = useState(false);

  function loadConnections() {
    api
      .get("/api/enablebanking/connections")
      .then((d) => setConnections(d || []))
      .catch(() => setConnections([]));
  }

  useEffect(() => {
    api.get("/api/settings").then(setSettings).catch(() => {});
    loadConnections();
    // messaggi dal redirect di consenso bancario
    const p = new URLSearchParams(window.location.search);
    if (p.get("connected")) setMsg({ type: "ok", text: "Banca collegata con successo!" });
    if (p.get("error"))
      setMsg({ type: "err", text: `Collegamento non riuscito: ${p.get("error")}` });
  }, []);

  async function patchSettings(patch) {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await api.put("/api/settings", patch);
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    }
  }

  async function openPicker() {
    setPickerLoading(true);
    setMsg(null);
    try {
      const list = await api.get("/api/enablebanking/aspsps?country=IT");
      setPicker(list);
    } catch (e) {
      setMsg({ type: "err", text: `Impossibile caricare le banche: ${e.message}` });
    } finally {
      setPickerLoading(false);
    }
  }

  async function connect(inst) {
    try {
      const { url } = await api.post("/api/enablebanking/connect", {
        aspspName: inst.name,
        country: inst.country || "IT",
        institutionName: inst.name,
      });
      window.location.href = url; // vai alla pagina di consenso della banca
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    }
  }

  async function sync() {
    setSyncing(true);
    setMsg(null);
    try {
      const r = await api.post("/api/sync");
      setMsg({
        type: "ok",
        text: `Sincronizzazione completata: ${r.inserted} nuove transazioni.`,
      });
      loadConnections();
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setSyncing(false);
    }
  }

  async function unlink(id) {
    if (!confirm("Scollegare il conto? Verranno rimosse le sue transazioni."))
      return;
    await api.del(`/api/enablebanking/connections/${id}`);
    loadConnections();
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!settings) return <div className="wrap"><div className="spinner">Caricamento…</div></div>;

  const isSalary = settings.month_start_mode === "salary";

  return (
    <div className="wrap">
      <header className="pagehead">
        <div>
          <div className="pagetitle">Impostazioni</div>
          <div className="pagesub">Preferenze e banche collegate</div>
        </div>
      </header>

      {msg && <div className={`banner ${msg.type}`}>{msg.text}</div>}

      {/* ---- Banche ---- */}
      <div className="card">
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🏦 Banche collegate</div>
        {connections.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13.5, marginBottom: 12 }}>
            Nessun conto collegato.
          </div>
        ) : (
          connections.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{c.institution_name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  {c.iban_masked || c.gc_account_id?.slice(0, 8)} ·{" "}
                  {c.status === "linked" ? "attivo" : c.status}
                  {c.consent_expires_at &&
                    ` · scade ${new Date(c.consent_expires_at).toLocaleDateString("it-IT")}`}
                </div>
              </div>
              <button
                className="btn danger"
                style={{ padding: "6px 10px", fontSize: 13 }}
                onClick={() => unlink(c.id)}
              >
                Scollega
              </button>
            </div>
          ))
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <button className="btn secondary" onClick={openPicker} disabled={pickerLoading}>
            {pickerLoading ? "…" : "+ Collega banca"}
          </button>
          {connections.length > 0 && (
            <button className="btn" onClick={sync} disabled={syncing}>
              {syncing ? "Sincronizzo…" : "↻ Sync ora"}
            </button>
          )}
        </div>
      </div>

      {/* ---- Soglia mese ---- */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>📅 Inizio del mese</div>
        <div className="chiprow" style={{ marginBottom: 14 }}>
          <button
            className={`chip ${isSalary ? "active" : ""}`}
            onClick={() => patchSettings({ month_start_mode: "salary", month_start_day: 23 })}
          >
            Cadenza stipendio (23)
          </button>
          <button
            className={`chip ${!isSalary ? "active" : ""}`}
            onClick={() => patchSettings({ month_start_mode: "fixed" })}
          >
            Giorno fisso
          </button>
        </div>
        {!isSalary && (
          <div className="field">
            <label>Giorno di inizio (1–31)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={31}
              value={settings.month_start_day}
              onChange={(e) =>
                patchSettings({ month_start_day: Number(e.target.value) })
              }
            />
          </div>
        )}
      </div>

      {/* ---- Periodo predefinito ---- */}
      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🔭 Periodo predefinito</div>
        <div className="chiprow">
          {PERIODS.map((p) => (
            <button
              key={p}
              className={`chip ${settings.default_period === p ? "active" : ""}`}
              onClick={() => patchSettings({ default_period: p })}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <button className="btn secondary block" style={{ marginTop: 20 }} onClick={logout}>
        Esci
      </button>

      {picker && (
        <div className="modal-backdrop" onClick={() => setPicker(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Scegli la banca</h3>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 12 }}>
              Verrai reindirizzato alla pagina sicura della banca per autorizzare
              l'accesso in sola lettura.
            </div>
            {picker.map((inst, i) => (
              <button
                key={`${inst.name}-${i}`}
                className="btn secondary block"
                style={{
                  marginBottom: 8,
                  justifyContent: "flex-start",
                  gap: 10,
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={() => connect(inst)}
              >
                {inst.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={inst.logo} alt="" width={22} height={22} style={{ borderRadius: 5 }} />
                )}
                {inst.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
