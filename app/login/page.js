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
        <div style={{ fontSize: 44 }}>💸</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: "10px 0 4px" }}>
          Le mie spese
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
