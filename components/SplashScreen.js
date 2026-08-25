"use client";

import { useEffect, useRef, useState } from "react";

// Splash del primo caricamento di sessione: sfondo pieno + logo Q centrato
// mentre carica; quando i dati sono pronti la Q "diventa" la scritta Quadra
// (Q = logo), poi l'overlay sfuma rivelando la Home.
export default function SplashScreen({ ready, onDone }) {
  const [phase, setPhase] = useState("loading"); // loading | reveal | out
  const mountedAt = useRef(Date.now());

  useEffect(() => {
    if (!ready) return;
    // mostra il logo per un minimo, così l'animazione non "lampeggia"
    const wait = Math.max(0, 620 - (Date.now() - mountedAt.current));
    const t = setTimeout(() => setPhase("reveal"), wait);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    if (phase === "reveal") {
      const t = setTimeout(() => setPhase("out"), 900);
      return () => clearTimeout(t);
    }
    if (phase === "out") {
      const t = setTimeout(() => onDone && onDone(), 480);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  return (
    <div className={`splash ${phase === "out" ? "splash-out" : ""}`} aria-hidden="true">
      <div className={`splash-mark ${phase !== "loading" ? "reveal" : ""}`}>
        <span className="splash-q">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <defs>
              <linearGradient id="splashq" gradientUnits="userSpaceOnUse" x1="24" y1="24" x2="80" y2="80">
                <stop offset="0" stopColor="#10b981" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="24" fill="none" stroke="url(#splashq)" strokeWidth="11" />
            <path d="M 26 50 A 24 24 0 0 1 50 26" fill="none" stroke="#fbbf24" strokeWidth="11" />
            <line x1="61" y1="61" x2="73" y2="73" stroke="url(#splashq)" strokeWidth="11" strokeLinecap="round" />
          </svg>
        </span>
        <span className="splash-word">uadra</span>
      </div>
    </div>
  );
}
