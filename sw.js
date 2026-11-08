const V='rss-v3.0';
const ART='./assets/sprites-v3.webp';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.add(ART)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
 // Only immutable versioned art is cache-first; HTML stays network-first.
 if(url.origin===self.location.origin&&url.pathname.endsWith('/assets/sprites-v3.webp')){
  e.respondWith(caches.open(V).then(async c=>{
   const hit=await c.match(e.request);if(hit)return hit;
   const fresh=await fetch(e.request);if(fresh.ok)await c.put(e.request,fresh.clone());return fresh;
  }));return;
 }
 const isShell=url.origin===self.location.origin && (
  url.pathname.endsWith('/') ||
  url.pathname.endsWith('/index.html') ||
  url.pathname.endsWith('/sw.js') ||
  url.pathname.endsWith('/manifest.json')
 );
 // Network-first for app shell; never prefer stale HTML
 e.respondWith((async()=>{
  try{
   const fresh=await fetch(e.request,{cache:'no-store'});
   if(isShell && fresh && fresh.ok){
    const c=await caches.open(V); try{await c.put(e.request,fresh.clone())}catch(_){}}
   return fresh;
  }catch(_){
   const hit=await caches.match(e.request);
   if(hit)return hit;
   if(isShell)return caches.match('./index.html');
   throw _;
  }
 })());
});

self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
