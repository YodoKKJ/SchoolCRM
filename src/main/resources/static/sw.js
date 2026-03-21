const CACHE = 'domgestao-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', event => {
    // Only cache GET requests for static assets; pass API calls through
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    const isApi = url.pathname.startsWith('/auth') || url.pathname.startsWith('/turmas') ||
                  url.pathname.startsWith('/materias') || url.pathname.startsWith('/vinculos') ||
                  url.pathname.startsWith('/usuarios') || url.pathname.startsWith('/notas') ||
                  url.pathname.startsWith('/presencas') || url.pathname.startsWith('/horarios') ||
                  url.pathname.startsWith('/atrasos');
    if (isApi) return; // let API calls go through normally

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
