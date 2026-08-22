"use client";

import { useEffect } from "react";

// Registra il service worker (PWA). Nessun caching di dati dinamici.
export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
