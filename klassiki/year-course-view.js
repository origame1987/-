/* Общая навигация коротких курсов с четырьмя четвертями. */
'use strict';
window.installKlassikiYearCourse=function({subjectId,title,terms,videos={},readings={},namespace,storagePrefix}){
 const lessons=terms.flat();
 const lessonsPerTerm=terms[0].length;
 const lastKey=storagePrefix+'-current';
 const doneKey=i=>storagePrefix+'-done-'+i;
 const completed=i=>progress[doneKey(i)]===true;
 const termFor=i=>Math.floor(i/lessonsPerTerm);
 const prior=render;
 let term=0;
 let current=0;
 let message='';

 function showLesson(){
  const [lessonTitle,rule,task,solution,chapter]=lessons[current];
  const explanation=Number.isInteger(chapter)?'<p><button onclick="lesson('+subjectId+','+chapter+')">Подробная глава</button></p>':'';
  const video=videos[current+1];
  const watch=video?'<p><a href="https://www.youtube.com/watch?v='+video+'" target="_blank" rel="noopener noreferrer">Посмотреть на YouTube</a></p>':'';
  const sources=readings[current+1]||[];
  const read=sources.length?'<div class="toolbar">'+sources.map(([label,url])=>
   '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>').join('')+'</div>':'';
  const next=current+1<lessons.length?'<button class="primary" onclick="'+namespace+'Open('+(current+1)+')">Следующее занятие</button>':'';
  app.innerHTML='<article class="panel"><button onclick="'+namespace+'Term('+term+')">К занятиям четверти</button>'+
   '<p>Занятие '+(current+1)+' из '+lessons.length+'</p><h2>'+esc(lessonTitle)+'</h2><p>'+esc(rule)+'</p>'+
   watch+read+'<h3>Задание</h3><p>'+esc(task)+'</p><details class="question"><summary>Открыть разбор</summary><p>'+esc(solution)+'</p></details>'+
   explanation+'<div class="toolbar"><button onclick="'+namespace+'Toggle(this)" aria-pressed="'+completed(current)+'">'+
   (completed(current)?'Выполнено':'Отметить выполненным')+'</button>'+next+'</div><p id="'+storagePrefix+'-status" role="status">'+esc(message)+'</p></article>';
 }
 function showTerm(){
  const first=term*lessonsPerTerm;
  const done=terms[term].filter((_,i)=>completed(first+i)).length;
  const last=progress[lastKey];
  app.innerHTML='<section class="panel"><h2>'+esc(title)+' · '+lessons.length+' занятий</h2>'+
   '<div class="toolbar" aria-label="Четверти">'+terms.map((_,i)=>'<button aria-pressed="'+(term===i)+'" onclick="'+namespace+'Term('+i+')">'+(i+1)+' четверть</button>').join('')+'</div>'+
   '<p>Выполнено '+done+' из '+terms[term].length+' в этой четверти.</p>'+
   (lessons[last]?'<p><button class="primary" onclick="'+namespace+'Open('+last+')">Продолжить занятие '+(last+1)+'</button></p>':'')+
   '<ol start="'+(first+1)+'">'+terms[term].map(([title],i)=>'<li style="margin-bottom:8px"><button onclick="'+namespace+'Open('+(first+i)+')">'+
   (completed(first+i)?'✓ ':'')+esc(title)+'</button></li>').join('')+'</ol></section>';
 }
 window[namespace+'Summary']=()=>({total:lessons.length,done:lessons.filter((_,i)=>completed(i)).length});
 window[namespace+'Start']=function(){
  const last=progress[lastKey];
  window[namespace+'Term'](lessons[last]?termFor(last):0);
 };
 window[namespace+'Term']=function(i){
  if(!Number.isInteger(i)||!terms[i])return;
  term=i;
  subject=subjectId;
  go(namespace);
 };
 window[namespace+'Open']=function(i){
  if(!Number.isInteger(i)||!lessons[i])return;
  current=i;
  term=termFor(i);
  subject=subjectId;
  const old=progress[lastKey];
  progress[lastKey]=i;
  message='';
  try{save()}catch{progress[lastKey]=old;message='Браузер не сохранил текущее занятие.'}
  go(namespace+'Lesson');
 };
 window[namespace+'Toggle']=function(button){
  const key=doneKey(current);
  const old=progress[key];
  const value=!completed(current);
  const status=document.getElementById(storagePrefix+'-status');
  progress[key]=value;
  try{save()}catch{progress[key]=old;status.textContent='Браузер не сохранил отметку.';return}
  button.setAttribute('aria-pressed',String(value));
  button.textContent=value?'Выполнено':'Отметить выполненным';
  status.textContent='Отметка сохранена.';
 };
 render=function(){
  if(page===namespace||page===namespace+'Lesson'||(page==='subject'&&subject===subjectId)){
   navHtml();
   if(page===namespace+'Lesson')showLesson();else showTerm();
   return;
  }
  prior();
 };
 render();
};
