/* Warungpedia app-shell service worker.
 * Strategy:
 *  - Precache the app shell (home + manifest + icon) on install.
 *  - Network-first for navigations with a cache fallback so the shell loads
 *    offline once visited.
 *  - Cache-first for same-origin static assets (JS/CSS/images) since Next
 *    emits fingerprinted files that never change.
 * Bump VERSION whenever you change assets so old caches are purged.
 */
const VERSION = 'warungpedia-v1'
const PRECACHE = ['/', '/manifest.webmanifest', '/icon.svg', '/offline']
const RUNTIME = `${VERSION}-runtime`

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(RUNTIME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('warungpedia-') && key !== VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only handle same-origin requests; let CDN/external assets pass through.
  if (url.origin !== self.location.origin) return

  // Skip non-runtime URLs (images optimized by Next are same-origin, but
  // opt out analytics/SSE style requests).
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request))
  } else {
    event.respondWith(staleWhileRevalidate(request))
  }
})

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME)
  try {
    const response = await fetch(request)
    if (response && response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) return cached
    const fallback = await cache.match('/')
    if (fallback) return fallback
    throw error
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME)
  const cached = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => undefined)

  return cached || (await network)
}
