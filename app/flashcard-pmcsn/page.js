"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CARDS, DECKS } from "../../lib/cards";
import {
  initState,
  pickNext,
  applyRating,
  remaining,
  masteredCount,
  RATING,
} from "../../lib/scheduler";

const STORAGE_KEY = "pmcsn_progress_v1";

function loadState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export default function Page() {
  const [state, setState] = useState(null);
  const [currentId, setCurrentId] = useState(null);
  const [flipped, setFlipped] = useState(false);
  const [ready, setReady] = useState(false);
  const [justAnswered, setJustAnswered] = useState(null); // feedback flash
  const containerRef = useRef(null);

  // bootstrap: carica progressi o inizializza
  useEffect(() => {
    const saved = loadState();
    let s;
    if (saved && saved.byId && Object.keys(saved.byId).length === CARDS.length) {
      s = saved;
    } else {
      s = initState(CARDS);
    }
    const next = pickNext(s);
    setState(s);
    setCurrentId(next);
    setReady(true);
  }, []);

  // registra service worker (PWA)
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // persisti ad ogni cambiamento
  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  const card = useMemo(
    () => CARDS.find((c) => c.id === currentId) || null,
    [currentId]
  );

  const total = CARDS.length;
  const mastered = state ? masteredCount(state) : 0;
  const left = state ? remaining(state) : total;
  const cardState = state && currentId ? state.byId[currentId] : null;

  function handleRate(rating) {
    if (!state || currentId == null) return;
    const newState = { ...state };
    applyRating(newState, currentId, rating);
    const next = pickNext(newState);
    setState(newState);
    setJustAnswered(rating);
    setTimeout(() => setJustAnswered(null), 350);
    setFlipped(false);
    // piccola pausa per far percepire il cambio carta
    setTimeout(() => {
      setCurrentId(next);
    }, 120);
  }

  function reset() {
    if (!confirm("Ricominciare da capo? Tutti i progressi verranno azzerati.")) return;
    const s = initState(CARDS);
    const next = pickNext(s);
    setState(s);
    setCurrentId(next);
    setFlipped(false);
  }

  if (!ready) {
    return (
      <div className="wrap" style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: "var(--muted)" }}>Caricamento…</div>
      </div>
    );
  }

  const finished = currentId == null;
  const pct = total ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="wrap" ref={containerRef}>
      <header style={{ marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" className="iconbtn" title="Torna a Lexio Apps">
              ‹
            </Link>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.3 }}>
                Flashcard PMCSN
              </div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                Performance Modeling — apprendimento spaziato
              </div>
            </div>
          </div>
          <button onClick={reset} className="iconbtn" title="Ricomincia">
            ↺
          </button>
        </div>

        {/* progress */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12.5,
              color: "var(--muted)",
              marginBottom: 6,
            }}
          >
            <span>
              <strong style={{ color: "var(--green)" }}>{mastered}</strong> padroneggiate
            </span>
            <span>
              <strong style={{ color: "var(--text)" }}>{left}</strong> da imparare
            </span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </header>

      {finished ? (
        <Done onReset={reset} total={total} />
      ) : (
        <>
          <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="deckchip">
              {String(card.deck + 1).padStart(2, "0")} · {DECKS[card.deck]}
            </div>

            <div
              className={`flashcard ${flipped ? "is-flipped" : ""}`}
              onClick={() => setFlipped((f) => !f)}
            >
              <div className="flashcard-inner">
                <div className="face front">
                  <div className="facetag">DOMANDA</div>
                  <div className="qtext">{card.q}</div>
                  <div className="hint">tocca per vedere la risposta</div>
                  {cardState && cardState.level === 1 && (
                    <div className="badge partial">la sai parzialmente</div>
                  )}
                  {cardState && cardState.seen > 0 && cardState.level === 0 && (
                    <div className="badge dont">da rivedere</div>
                  )}
                </div>
                <div className="face back">
                  <div className="facetag">RISPOSTA</div>
                  <div className="atext">{card.a}</div>
                </div>
              </div>
            </div>
          </main>

          <footer style={{ marginTop: 18 }}>
            {!flipped ? (
              <button className="reveal" onClick={() => setFlipped(true)}>
                Mostra risposta
              </button>
            ) : (
              <div className="rate">
                <button
                  className={`rbtn dont ${justAnswered === RATING.DONT_KNOW ? "flash" : ""}`}
                  onClick={() => handleRate(RATING.DONT_KNOW)}
                >
                  <span className="emoji">✕</span>
                  Non la so
                </button>
                <button
                  className={`rbtn partial ${justAnswered === RATING.PARTIAL ? "flash" : ""}`}
                  onClick={() => handleRate(RATING.PARTIAL)}
                >
                  <span className="emoji">◑</span>
                  In parte
                </button>
                <button
                  className={`rbtn know ${justAnswered === RATING.KNOW ? "flash" : ""}`}
                  onClick={() => handleRate(RATING.KNOW)}
                >
                  <span className="emoji">✓</span>
                  La so
                </button>
              </div>
            )}
          </footer>
        </>
      )}

      <Styles />
    </div>
  );
}

function Done({ onReset, total }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        gap: 14,
      }}
    >
      <div style={{ fontSize: 56 }}>🎓</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Tutte padroneggiate!</div>
      <div style={{ color: "var(--muted)", maxWidth: 360, lineHeight: 1.5 }}>
        Hai marcato come «la so» tutte le {total} flashcard. Bel lavoro — puoi
        ricominciare quando vuoi per consolidare.
      </div>
      <button className="reveal" style={{ maxWidth: 280, marginTop: 8 }} onClick={onReset}>
        Ricomincia da capo
      </button>
    </div>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .iconbtn {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: var(--card);
        border: 1px solid var(--border);
        color: var(--muted);
        font-size: 18px;
        display: grid;
        place-items: center;
        transition: 0.15s;
      }
      .iconbtn:active {
        transform: scale(0.92);
      }

      .track {
        height: 8px;
        background: var(--card);
        border-radius: 999px;
        overflow: hidden;
        border: 1px solid var(--border);
      }
      .fill {
        height: 100%;
        background: linear-gradient(90deg, var(--indigo), var(--green));
        border-radius: 999px;
        transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .deckchip {
        align-self: flex-start;
        font-size: 11.5px;
        font-weight: 600;
        letter-spacing: 0.3px;
        color: var(--indigo-soft);
        background: rgba(99, 102, 241, 0.12);
        border: 1px solid rgba(99, 102, 241, 0.25);
        padding: 6px 12px;
        border-radius: 999px;
        margin: 6px 0 16px;
        max-width: 100%;
      }

      .flashcard {
        flex: 1;
        min-height: 340px;
        perspective: 1600px;
        cursor: pointer;
      }
      .flashcard-inner {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 340px;
        transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        transform-style: preserve-3d;
      }
      .flashcard.is-flipped .flashcard-inner {
        transform: rotateY(180deg);
      }
      .face {
        position: absolute;
        inset: 0;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        border-radius: 22px;
        padding: 26px 24px;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        overflow-y: auto;
      }
      .front {
        background: linear-gradient(160deg, var(--card-2), var(--card));
        justify-content: center;
        align-items: center;
        text-align: center;
      }
      .back {
        background: linear-gradient(160deg, #1e2435, #181c29);
        transform: rotateY(180deg);
      }
      .facetag {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 1.5px;
        color: var(--muted);
        margin-bottom: 14px;
      }
      .qtext {
        font-size: 20px;
        font-weight: 650;
        line-height: 1.4;
        letter-spacing: -0.2px;
      }
      .atext {
        font-size: 16px;
        line-height: 1.62;
        color: #d7dbe8;
        white-space: pre-wrap;
      }
      .hint {
        margin-top: 20px;
        font-size: 12px;
        color: var(--muted);
        opacity: 0.8;
      }
      .badge {
        margin-top: 16px;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 12px;
        border-radius: 999px;
      }
      .badge.partial {
        color: var(--amber);
        background: rgba(245, 158, 11, 0.12);
        border: 1px solid rgba(245, 158, 11, 0.3);
      }
      .badge.dont {
        color: var(--red);
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.28);
      }

      .reveal {
        width: 100%;
        padding: 17px;
        border-radius: 16px;
        background: var(--indigo);
        color: white;
        font-size: 16px;
        font-weight: 650;
        transition: 0.15s;
      }
      .reveal:active {
        transform: scale(0.98);
        background: var(--indigo-soft);
      }

      .rate {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
      }
      .rbtn {
        padding: 16px 8px;
        border-radius: 16px;
        font-size: 14px;
        font-weight: 650;
        color: var(--text);
        background: var(--card);
        border: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 7px;
        transition: 0.13s;
      }
      .rbtn .emoji {
        font-size: 20px;
        line-height: 1;
      }
      .rbtn:active {
        transform: scale(0.95);
      }
      .rbtn.dont {
        border-color: rgba(239, 68, 68, 0.4);
      }
      .rbtn.dont .emoji {
        color: var(--red);
      }
      .rbtn.partial {
        border-color: rgba(245, 158, 11, 0.4);
      }
      .rbtn.partial .emoji {
        color: var(--amber);
      }
      .rbtn.know {
        border-color: rgba(34, 197, 94, 0.4);
      }
      .rbtn.know .emoji {
        color: var(--green);
      }
      .rbtn.flash {
        background: var(--card-2);
        transform: scale(0.95);
      }
    `}</style>
  );
}
