// Kazetopia – kleiner Service Worker, damit man die Seite als App auf den Homescreen legen kann.
// Seite immer zuerst frisch aus dem Netz laden; nur ohne Netz die zuletzt gespeicherte Kopie zeigen.
// Daten (daten.json, Supabase, Bilder von GitHub) werden NICHT zwischengespeichert – sie sind immer aktuell.
var CACHE = 'kazetopia-v1';
var SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;   // fremde Adressen (Daten, Login) nie anfassen
  var shell = e.request.mode === 'navigate' || SHELL.some(function (p) { return u.pathname.endsWith(p.replace('./', '/')); });
  if (!shell) return;
  e.respondWith(fetch(e.request).then(function (r) {
    if (r && r.ok) { var kopie = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request.mode === 'navigate' ? './index.html' : e.request, kopie); }); }
    return r;
  }).catch(function () { return caches.match(e.request.mode === 'navigate' ? './index.html' : e.request).then(function (r) { return r || caches.match('./'); }); }));
});
