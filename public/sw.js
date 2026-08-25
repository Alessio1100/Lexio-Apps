// Service worker: solo asset statici in cache. MAI dati dinamici o API
// (contengono informazioni finanziarie/autenticate).
// NB: il manifest NON è in cache-first (va servito sempre da rete) così nome e
// icona dell'app si aggiornano; il nome cache è versionato per purgare i vecchi.
const CACHE = "quadra-v1";
const ASSETS = ["/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Non intercettare: metodi non-GET, richieste API, auth, cross-origin.
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/auth") ||
    url.pathname === "/login"
  ) {
    return;
  }

  // Asset statici Next → cache-first.
  if (url.pathname.startsWith("/_next/static") || ASSETS.includes(url.pathname)) {
    e.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          })
      )
    );
    return;
  }

  // Navigazioni/pagine → network-first (fallback cache se offline).
  e.respondWith(fetch(request).catch(() => caches.match(request)));
});
