const CACHE = 'domgestao-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
    // Delete old caches so stale index.html / assets don't linger
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Pass API calls through without caching
    const isApi = url.pathname.startsWith('/auth') || url.pathname.startsWith('/turmas') ||
                  url.pathname.startsWith('/materias') || url.pathname.startsWith('/vinculos') ||
                  url.pathname.startsWith('/usuarios') || url.pathname.startsWith('/notas') ||
                  url.pathname.startsWith('/presencas') || url.pathname.startsWith('/horarios') ||
                  url.pathname.startsWith('/atrasos');
    if (isApi) return;

    // Network-first for index.html: always fetch the latest so new bundle hashes load correctly
    const isHtml = url.pathname === '/' || url.pathname.endsWith('.html') ||
               url.pathname === '/aluno' || url.pathname === '/direcao' || url.pathname === '/professor';
    if (isHtml) {
        event.respondWith(
            fetch(event.request)
                .then(resp => {
                    if (resp.ok) {
                        const clone = resp.clone();
                        caches.open(CACHE).then(c => c.put(event.request, clone));
                    }
                    return resp;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Cache-first for hashed static assets (JS/CSS — content-hash guarantees freshness)
    event.respondWith(
        caches.open(CACHE).then(cache =>
            cache.match(event.request).then(cached => {
                const fresh = fetch(event.request).then(resp => {
                    if (resp.ok) cache.put(event.request, resp.clone());
                    return resp;
                });
                return cached || fresh;
            })
        )
    );
});
