const CACHE = 'dragons-v4'
const STATIC = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/styles/main.css',
  '/src/app.js',
  '/src/store.js',
  '/src/rng.js',
  '/src/generate.js',
  '/src/screens/TitleScreen.js',
  '/src/screens/CardEntryScreen.js',
  '/src/screens/GameScreen.js',
  '/src/screens/WinScreen.js',
  '/src/components/Room.js',
  '/src/components/Player.js',
  '/src/components/Paper.js',
  '/src/components/Box.js',
  '/src/components/Door.js',
  '/src/components/HUD.js',
  '/src/components/CardForm.js',
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
