const CACHE_NAME = "wortle-unlimited-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./supabase-config.js",
  "./leaderboard.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith("wortle-unlimited-") && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith((async () => {
    let response;
    try {
      response = await fetch(event.request);
    } catch (networkError) {
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) return cachedResponse;
      if (event.request.mode === "navigate") {
        const offlinePage = await caches.match("./index.html");
        if (offlinePage) return offlinePage;
      }
      throw networkError;
    }

    if (response.ok) {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      } catch (cacheError) {
        console.error("Offline-Datei konnte nicht gespeichert werden:", cacheError);
      }
    }
    return response;
  })());
});
