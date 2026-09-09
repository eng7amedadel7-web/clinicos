// MERUNA Service Worker - Offline fallback & asset caching
// v2: hashed /assets/ files are immutable, so they are served CACHE-FIRST —
// repeat visits load JS/CSS/fonts instantly instead of waiting on the network.
const CACHE_NAME = "meruna-v2";
const STATIC_ASSETS = [
  "/",
  "/meruna-logo.svg",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

function isImmutableAsset(url) {
  return (
    url.includes("/assets/") ||
    url.endsWith(".woff2") ||
    url.endsWith(".woff") ||
    url.endsWith(".svg") ||
    url.endsWith(".png") ||
    url.endsWith(".ico")
  );
}

self.addEventListener("fetch", (event) => {
  // Only cache GET requests, bypass API calls to ensure live data
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  // Immutable hashed assets: serve from cache when present, else fetch once
  // and keep. The filename hash changes on every deploy, so a cached entry
  // can never shadow a fresh build.
  if (isImmutableAsset(event.request.url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else (navigation HTML, fonts CSS): network-first with the
  // cache as offline fallback.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return caches.match("/");
      })
  );
});
