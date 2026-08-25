"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg({
          type: "ok",
          text: "Registrazione ok. Se richiesta, conferma la mail, poi accedi.",
        });
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap" style={{ justifyContent: "center", maxWidth: 420 }}>
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <div
          style={{
            width: 68,
            height: 68,
            margin: "0 auto",
            borderRadius: 20,
            background: "#10161b",
            border: "1px solid var(--border)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg viewBox="0 0 100 100" width="44" height="44" aria-hidden="true">
            <defs>
              <linearGradient id="loginq" gradientUnits="userSpaceOnUse" x1="24" y1="24" x2="80" y2="80">
                <stop offset="0" stopColor="#10b981" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="24" fill="none" stroke="url(#loginq)" strokeWidth="11" />
            <path d="M 33.03 33.03 A 24 24 0 0 1 66.97 33.03" fill="none" stroke="#fbbf24" strokeWidth="11" />
            <line x1="61" y1="61" x2="73" y2="73" stroke="url(#loginq)" strokeWidth="11" strokeLinecap="round" />
          </svg>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "14px 0 4px", fontFamily: "var(--font-display)" }}>
          Quadra
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
          {mode === "signin" ? "Accedi al tuo account" : "Crea il tuo account"}
        </p>
      </div>

      {msg && <div className={`banner ${msg.type}`}>{msg.text}</div>}

      <form onSubmit={submit} className="card">
        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
          />
        </div>
        <button className="btn block" disabled={busy}>
          {busy ? "Attendere…" : mode === "signin" ? "Accedi" : "Registrati"}
        </button>
      </form>

      <button
        className="btn secondary"
        style={{ marginTop: 12 }}
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setMsg(null);
        }}
      >
        {mode === "signin"
          ? "Non hai un account? Registrati"
          : "Hai già un account? Accedi"}
      </button>
    </div>
  );
}
