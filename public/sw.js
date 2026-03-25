// Service Worker — TalentMoney PWA
const CACHE_NAME = "talentmoney-v4"

// Assets estáticos para pré-cachear na instalação
const STATIC_CACHE = [
  "/",
  "/manifest.json",
  "/icon-192.jpg",
  "/icon-512.jpg",
  "/apple-icon.jpg",
]

// Instalação: pré-cacheia assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE))
  )
  self.skipWaiting()
})

// Ativação: remove caches de versões antigas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: Network First para API (dados sempre frescos com fallback offline),
//        Cache First para assets estáticos (imagens, fontes, JS, CSS)
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar requests não-GET e extensões do browser
  if (request.method !== "GET") return
  if (url.protocol === "chrome-extension:") return

  // API — Network First com fallback para cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Assets e páginas — Cache First com fallback para rede
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.ok && response.type !== "opaque") {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
