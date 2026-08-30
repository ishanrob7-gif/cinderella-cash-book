const CACHE = 'cinderella-cashbook-v2';
const SHELL = ['./manifest.json', './icon-192.png', './icon-512.png', './logo.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var isAppShell = url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if(isAppShell){
    // Network-first for the app itself: always try to get the latest version,
    // only fall back to the cached copy if there's no internet.
    e.respondWith(
      fetch(e.request).then(function(res){
        if(res && res.status === 200){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){ return caches.match(e.request); })
    );
    return;
  }

  // Cache-first for static assets (icons, manifest) that rarely change.
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(res){
        if(res && res.status === 200 && res.type === 'basic'){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        }
        return res;
      }).catch(function(){ return cached; });
    })
  );
});
