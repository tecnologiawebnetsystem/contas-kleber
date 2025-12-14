// Service Worker para cachear arquivos e funcionar offline

const CACHE_NAME = "contas-kleber-v1"
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
    caches.match(event.request).then((response) => {
      // Retornar do cache se existir
      if (response) {
        return response
      }

      // Tentar buscar da rede
      return fetch(event.request)
        .then((response) => {
          // Cache apenas GET requests
          if (event.request.method === "GET" && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // Se falhar, retornar página offline para navegação
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL)
          }
        })
    }),
  )
})
