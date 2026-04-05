const CACHE_NAME = "sonarrock-cache-v3";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/style.css",
  "/player.js",
  "/manifest.json",
  "/offline.html",
  "/attached_assets/logo_1749601460841.jpeg"
];

// =========================
// INSTALL
// =========================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// =========================
// ACTIVATE
// =========================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// =========================
// FETCH
// =========================
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // No cachear el stream en vivo
  if (
    url.href.includes("giss.tv:667/sonarrock.mp3") ||
    url.href.includes("status-json.xsl") ||
    url.href.includes("playing.php") ||
    url.href.includes("itunes.apple.com")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // Navegación HTML: network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // CSS / JS / IMG: cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response;
            }

            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
