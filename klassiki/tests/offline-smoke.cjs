'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const vm=require('node:vm');
const base='https://example.org/-/klassiki/';
const root=path.resolve(__dirname,'..');
const events={};
const stored=new Map();
const cache={
 async match(url){return stored.get(url)?.clone()},
 async put(url,response){stored.set(url,response.clone())},
 async addAll(requests){
  const responses=await Promise.all(requests.map(async request=>{
   const response=await fetchAsset(request);
   assert.ok(response.ok);
   return [request.url,response];
  }));
  for(const [url,response] of responses)await this.put(url,response);
 }
};
let online=true;
let newHtml;
let claimed=false;
let waiting=false;
async function fetchAsset(input){
 if(!online)throw Error('Offline');
 const url=new URL(typeof input==='string'?input:input.url);
 assert.ok(url.href.startsWith(base));
 const file=url.pathname.slice(new URL(base).pathname.length);
 if(file==='index.html'&&newHtml)return new Response(newHtml);
 try{
  return new Response(await fs.readFile(path.join(root,file)),{headers:{'Content-Type':file.endsWith('.mp3')?'audio/mpeg':'text/plain'}});
 }catch{
  return new Response('',{status:404});
 }
}
const navigate=()=>request({url:base,method:'GET',mode:'navigate'});
function request(fields,headers){
 let outcome;
 events.fetch({request:{...fields,headers:new Headers(headers)},respondWith(result){outcome=result}});
 return outcome;
}
async function lifecycle(name){
 let outcome;
 events[name]({waitUntil(result){outcome=result}});
 return outcome;
}
async function main(){
 const source=await fs.readFile(path.join(root,'sw.js'),'utf8');
 vm.runInNewContext(source,{
  self:{registration:{scope:base},addEventListener(name,handler){events[name]=handler;},skipWaiting(){waiting=true;},clients:{claim(){claimed=true;}}},
  caches:{async open(){return cache}},
  fetch:fetchAsset,URL,Request,Response,AbortSignal
 });
 const html=await fs.readFile(path.join(root,'index.html'),'utf8');
 await lifecycle('install');
 await lifecycle('activate');
 assert.ok(waiting&&claimed);
 assert.ok(stored.size>70);
 online=false;
 assert.equal(await (await navigate()).text(),html);
 const audio=await request({url:base+'english-audio/family.mp3',method:'GET'},{Range:'bytes=10-19'});
 assert.equal(audio.status,206);
 assert.equal((await audio.arrayBuffer()).byteLength,10);
 assert.equal(request({url:'https://example.org/elsewhere',method:'GET'}),undefined);
 online=true;
 newHtml=html.replace('</body>','<script src="./missing.js"></script></body>');
 assert.equal(await (await navigate()).text(),html,'Incomplete updates must keep the old edition');
 newHtml=html.replace('Учебный план','Новый учебный план').replace('year-lesson-explanations.js?v=5','year-lesson-explanations.js?v=test');
 assert.notEqual(newHtml,html);
 assert.equal(await (await navigate()).text(),newHtml);
 online=false;
 assert.equal(await (await navigate()).text(),newHtml);
 assert.equal((await request({url:base+'year-lesson-explanations.js?v=test',method:'GET'})).status,200);
 console.log('PASS: initial offline cache, audio ranges, scoped requests, update and fallback on partial deployment');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
