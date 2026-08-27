"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "../lib/api";
import { clearCache } from "../lib/cache";

// All'apertura del sito (nuova sessione) lancia UNA volta un sync in background
// delle transazioni bancarie. Non blocca la UI; se arrivano nuove transazioni
// invalida la cache e avvisa le pagine (evento "tx-synced") di aggiornarsi.
let started = false;
const PUBLIC = ["/login", "/auth", "/privacy", "/termini"];

export default function SessionSync() {
  const pathname = usePathname();
  useEffect(() => {
    if (started) return;
    if (!pathname || PUBLIC.some((p) => pathname.startsWith(p))) return;
    started = true;
    api
      .post("/api/sync", { background: true })
      .then((r) => {
        if (r && r.inserted > 0) {
          clearCache("/api/transactions");
          window.dispatchEvent(new CustomEvent("tx-synced", { detail: r }));
        }
      })
      .catch(() => {}); // non autenticato o errore: silenzioso
  }, [pathname]);
  return null;
}
