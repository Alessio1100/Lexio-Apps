"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (mode === "signup" && password !== password2) {
      setMsg({ type: "err", text: "Le password non coincidono." });
      return;
    }
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            },
          },
        });
        if (error) throw error;
        setMsg({
          type: "ok",
          text: "Registrazione ok. Se richiesta, conferma la mail, poi accedi.",
        });
        setMode("signin");
        setPassword2("");
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
    <div
      className="wrap"
      style={{ justifyContent: "center", maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}
    >
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
            <path d="M 26 50 A 24 24 0 0 1 50 26" fill="none" stroke="#fbbf24" strokeWidth="11" />
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
        {mode === "signup" && (
          <>
            <div className="field">
              <label>Nome</label>
              <input
                className="input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="field">
              <label>Cognome</label>
              <input
                className="input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                autoComplete="family-name"
              />
            </div>
          </>
        )}
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
        {mode === "signup" && (
          <div className="field">
            <label>Ripeti password</label>
            <input
              className="input"
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
        )}
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
          setPassword2("");
        }}
      >
        {mode === "signin"
          ? "Non hai un account? Registrati"
          : "Hai già un account? Accedi"}
      </button>
    </div>
  );
}
