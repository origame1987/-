'use strict';
const cacheName='klassiki-offline-v1';
const base=new URL(self.registration.scope);
const home=new URL('index.html',base).href;
const recordings=['family','school-club','directions','train','nature-reserve','museum','podcast','change-of-plan'];
const extras=['manifest.webmanifest','app-192.png','app-512.png','geography-world-map.svg','geography-climatogram.svg',
 ...recordings.map(name=>'english-audio/'+name+'.mp3')].map(name=>new URL(name,base).href);

async function storeEdition(response,cache){
 if(!response.ok)throw Error('Учебник недоступен');
 const html=await response.clone().text();
 const previous=await cache.match(home);
 const changed=!previous||await previous.text()!==html;
 const dependencies=[...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="(\.\/[^"]+)"/g)]
  .map(([,url])=>new URL(url,base).href);
 for(const [,url] of html.matchAll(/<use\b[^>]*\bhref="(\.\/[^"#]+)#[^"]+"/g))dependencies.push(new URL(url,base).href);
 dependencies.push(...extras);
 const missing=(await Promise.all([...new Set(dependencies)].map(async url=>changed||!(await cache.match(url))?url:null))).filter(Boolean);
 if(missing.length)await cache.addAll(missing.map(url=>new Request(url,{cache:'reload'})));
 // Keep the previous usable HTML until every dependency of the new HTML is cached.
 await cache.put(home,response);
}

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(cacheName);
  await storeEdition(await fetch(home,{cache:'reload'}),cache);
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

async function servePage(cache){
 try{
  const fresh=await fetch(home,{cache:'no-cache',signal:AbortSignal.timeout(5000)});
  await storeEdition(fresh.clone(),cache);
  return fresh;
 }catch{
  return await cache.match(home)||new Response('Подключись к интернету, чтобы загрузить учебник.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 }
}

async function rangeResponse(response,header){
 const match=/^bytes=(\d*)-(\d*)$/.exec(header);
 if(!match||(!match[1]&&!match[2]))return response;
 const blob=await response.blob();
 const size=blob.size;
 const start=match[1]?Number(match[1]):Math.max(0,size-Number(match[2]));
 const end=match[1]&&match[2]?Math.min(Number(match[2]),size-1):size-1;
 if(start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
 return new Response(blob.slice(start,end+1),{status:206,headers:{
  'Content-Range':'bytes '+start+'-'+end+'/'+size,'Accept-Ranges':'bytes',
  'Content-Length':String(end-start+1),'Content-Type':response.headers.get('Content-Type')||'audio/mpeg'
 }});
}

self.addEventListener('fetch',event=>{
 const {request}=event;
 const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
 if(request.destination==='serviceworker')return;
 if(request.mode==='navigate'){
  if(url.pathname===base.pathname||url.pathname===new URL(home).pathname)
   event.respondWith(caches.open(cacheName).then(servePage));
  return;
 }
 event.respondWith((async()=>{
  const cache=await caches.open(cacheName);
  const response=await cache.match(request.url);
  const range=request.headers.get('Range');
  if(response)return range?rangeResponse(response,range):response;
  return fetch(request);
 })());
});
