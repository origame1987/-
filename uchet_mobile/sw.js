const CACHE='uchet-doski-mobile-v2-20261117';
const FILES=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('uchet-doski-mobile-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location.href).pathname))return;
 e.respondWith((async()=>{const c=await caches.open(CACHE);try{const response=await fetch(e.request);if(response.ok)await c.put(e.request,response.clone());return response}catch(error){const cached=await c.match(e.request,{ignoreSearch:true});if(cached)return cached;if(e.request.mode==='navigate')return c.match('./index.html');throw error}})());
});
