// MERUNA Service Worker - Offline fallback & asset caching
const CACHE_NAME = "meruna-v1";
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

self.addEventListener("fetch", (event) => {
  // Only cache GET requests, bypass API calls to ensure live data
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache static JS/CSS/Fonts/Images
        if (
          response.status === 200 &&
          (event.request.url.includes("/assets/") ||
            event.request.url.endsWith(".svg") ||
            event.request.url.endsWith(".css") ||
            event.request.url.endsWith(".js"))
        ) {
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
