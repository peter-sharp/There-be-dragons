const CACHE = 'dragons-v3'
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles/main.css',
  '/src/app.js',
  '/src/store.js',
  '/src/data/puzzles.js',
  '/src/components/HUD.js',
  '/src/components/WordOrderPuzzle.js',
  '/src/components/NumberFillPuzzle.js',
  '/src/components/MatchPuzzle.js',
  '/src/screens/NameScreen.js',
  '/src/screens/HubScreen.js',
  '/src/screens/RoomScreen.js',
  '/src/screens/GameScreens.js',
]

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  )
})
