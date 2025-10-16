const CACHE='booth360-v1';
const ASSETS=['/','/index.html','/manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k)))))});
self.addEventListener('fetch',e=>{
  const {request}=e;
  const isVideo=request.destination==='video'||request.url.endsWith('.webm')||request.url.endsWith('.mp4');
  if(isVideo) return;
  e.respondWith(caches.match(request).then(r=>r||fetch(request)));
});