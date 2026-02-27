// Service Worker para cachear arquivos e funcionar offline

const CACHE_NAME = "talent-money-v3"
const OFFLINE_URL = "/offline"

// Arquivos para cachear durante a instalação
const STATIC_CACHE = ["/", "/offline", "/manifest.json", "/icon-192.jpg", "/icon-512.jpg"]

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando Service Worker...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cache aberto")
      return cache.addAll(STATIC_CACHE)
    }),
  )
  self.skipWaiting()
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando Service Worker...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[SW] Removendo cache antigo:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  // Ignorar requisições de API (elas são tratadas pelo IndexedDB)
  if (event.request.url.includes("/api/")) {
    return
  }

  event.respondWith(
    // Network-first: tenta a rede primeiro, usa cache como fallback
    fetch(event.request)
      .then((response) => {
        // Cache apenas GET requests bem sucedidas
        if (event.request.method === "GET" && response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return response
      })
      .catch(() => {
        // Se a rede falhar, tentar retornar do cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response
          }
          // Se nao tiver no cache e for navegacao, retornar pagina offline
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL)
          }
        })
      }),
  )
})
