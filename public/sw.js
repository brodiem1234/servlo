const CACHE_NAME = 'servlo-v1';
const SHELL_URLS = [
  '/',
  '/offline',
  '/auth/login',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Skip Supabase and API calls
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Network failed
        if (event.request.mode === 'navigate') {
          return caches.match('/offline') || new Response('Offline', { status: 503 });
        }
        return caches.match(event.request);
      })
  );
});
