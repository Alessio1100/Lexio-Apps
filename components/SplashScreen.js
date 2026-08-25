"use client";

import { useEffect, useState } from "react";

// Splash del primo caricamento di sessione: sfondo pieno + logo Q centrato.
// L'animazione (Q -> "Quadra") parte presto, su un suo tempo (di solito PRIMA
// che il caricamento finisca), ed è lenta/naturale. Si sfuma verso la Home solo
// quando l'animazione è completa E i dati sono pronti.
export default function SplashScreen({ ready, onDone }) {
  const [phase, setPhase] = useState("loading"); // loading | reveal | out
  const [revealDone, setRevealDone] = useState(false);

  // avvia l'animazione presto, a prescindere dal caricamento
  useEffect(() => {
    const t = setTimeout(() => setPhase("reveal"), 450);
    return () => clearTimeout(t);
  }, []);

  // durata dell'animazione di reveal (lenta) prima di poter uscire
  useEffect(() => {
    if (phase !== "reveal") return;
    const t = setTimeout(() => setRevealDone(true), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  // esci (rivela la Home) solo quando animazione finita E dati pronti
  useEffect(() => {
    if (phase === "out" || !revealDone || !ready) return;
    const t = setTimeout(() => setPhase("out"), 300); // breve pausa sul wordmark
    return () => clearTimeout(t);
  }, [revealDone, ready, phase]);

  useEffect(() => {
    if (phase !== "out") return;
    const t = setTimeout(() => onDone && onDone(), 620); // fade più lento
    return () => clearTimeout(t);
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
