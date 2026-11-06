const V='rss-v2.6';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const url=new URL(e.request.url);
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
