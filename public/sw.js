// Lexon Team service worker: makes the app installable and loads fast. It caches ONLY the app's own static build files.
// Data, auth and API calls are never cached, so nothing private is stored on the device by this worker.
const CACHE = 'lexon-team-static-v5'
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil((async () => { for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); await self.clients.claim() })()))
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url)
  if (e.request.method !== 'GET' || u.origin !== location.origin) return
  if (u.pathname.includes('/assets/')) { e.respondWith(caches.open(CACHE).then(async c => { const hit = await c.match(e.request); if (hit) return hit; const res = await fetch(e.request); if (res.ok) c.put(e.request, res.clone()); return res })); return }
  if (e.request.mode === 'navigate') e.respondWith(fetch(e.request).catch(() => caches.match('./index.html').then(r => r || new Response('You are offline. Reconnect to use Lexon Team.', { status: 503 }))))
})
// Notification click -> focus the app
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window' }).then(l => l.length ? l[0].focus() : self.clients.openWindow('./'))) })
