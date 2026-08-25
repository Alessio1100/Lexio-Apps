"use client";

import { useEffect } from "react";

// Registra il service worker (PWA). Nessun caching di dati dinamici.
export default function SWRegister() {
  useEffect(() => {
    // Solo in produzione: in sviluppo il SW farebbe cache-first sui chunk e
    // servirebbe versioni vecchie a ogni modifica.
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
