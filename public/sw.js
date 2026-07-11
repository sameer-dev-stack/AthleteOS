const CACHE_NAME = "athleteos-v2";
const OFFLINE_URL = "/offline";
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/discover",
  "/brands",
  "/teams",
  "/auth/sign-in",
  "/auth/sign-up",
  "/icon.svg",
  "/apple-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/dashboard")) return;
  if (url.pathname.startsWith("/admin")) return;
  if (url.pathname.startsWith("/onboarding")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", { status: 503, statusText: "Offline" });
        });

      return cached || networkFetch;
    })
  );
});
