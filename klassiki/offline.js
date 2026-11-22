(function(){
'use strict';
const install=document.getElementById('install-klassiki');
const status=document.getElementById('offline-status');
let prompt;
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();
 prompt=event;
 install.hidden=false;
});
install.addEventListener('click',async()=>{
 if(!prompt)return;
 const request=prompt;
 prompt=null;
 install.hidden=true;
 try{await request.prompt()}catch{status.textContent='Установку можно запустить из меню браузера.';}
});
window.addEventListener('appinstalled',()=>{
 install.hidden=true;
});
if(!('serviceWorker' in navigator))return;
navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>{
 status.textContent='Учебник сохранён для работы офлайн. Внешние ссылки требуют интернета.';
}).catch(()=>{
 status.textContent='Офлайн-копия пока недоступна. Обнови страницу при подключении к интернету.';
});
})();
