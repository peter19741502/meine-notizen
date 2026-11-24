
const CACHE = "meinenotizen-v2";

const ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon.svg"
];

// Installation: neue Dateien zwischenspeichern
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(ASSETS))
    );

    self.skipWaiting();
});

// Aktivierung: alte Cache-Versionen entfernen
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE)
                    .map(key => caches.delete(key))
            );
        })
    );

    self.clients.claim();
});

// Neue Seitenversion bevorzugt vom Server laden
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);

    // Nur eigene Dateien behandeln
    if (url.origin !== self.location.origin) return;

    // HTML: zuerst Netzwerk, bei Offline Cache verwenden
    if (
        event.request.mode === "navigate" ||
        url.pathname.endsWith("/index.html") ||
        url.pathname.endsWith("/")
    ) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE).then(cache => {
                            cache.put(event.request, copy);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(event.request)
                    .then(cached => cached || caches.match("./index.html")))
        );
        return;
    }

    // Andere Dateien aus Cache laden, sonst vom Server
    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE).then(cache => {
                        cache.put(event.request, copy);
                    });
                }
                return response;
            });
        })
    );
});
