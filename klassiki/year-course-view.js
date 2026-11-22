/* Общая навигация коротких курсов с четырьмя четвертями. */
'use strict';
window.installKlassikiYearCourse=function({subjectId,title,terms,videos={},readings={},figures={},listening={},checks={},namespace,storagePrefix}){
 const lessons=terms.flat();
 const lessonCountWord={one:'занятие',few:'занятия',many:'занятий'}[new Intl.PluralRules('ru').select(lessons.length)];
 const lessonsPerTerm=terms[0].length;
 const lastKey=storagePrefix+'-current';
 const doneKey=i=>storagePrefix+'-done-'+i;
 const checkKey=i=>storagePrefix+'-check-'+i;
 const completed=i=>progress[doneKey(i)]===true;
 const termFor=i=>Math.floor(i/lessonsPerTerm);
 const prior=render;
 let term=0;
 let current=0;
 let message='';

 function checkRecord(record,total){
  return record?'Попыток: '+record.attempts+'. Лучший результат: '+record.best+' из '+total+'.':'';
 }

 function showCheck(questions){
  return '<section><h3>Проверь себя за четверть</h3>'+
   '<form onsubmit="return '+namespace+'Check(event,this)">'+questions.map(([prompt,options],i)=>
    '<fieldset class="question"><legend>'+esc(prompt)+'</legend>'+options.map((option,j)=>
     '<label style="display:block;padding:.35em 0"><input type="radio" name="q'+i+'" value="'+j+'" required> '+esc(option)+'</label>').join('')+
    '</fieldset>').join('')+
   '<button type="submit">Проверить ответы</button>'+
   '<p id="'+storagePrefix+'-check-record">'+esc(checkRecord(progress[checkKey(current)],questions.length))+'</p>'+
   '<div id="'+storagePrefix+'-check-result" role="status"></div></form></section>';
 }

 function showLesson(){
  const [lessonTitle,rule,task,solution,chapter]=lessons[current];
  const expanded=window.klassikiRenderYearExplanation?.(subjectId,current+1)||'';
  const explanation=Number.isInteger(chapter)?'<p><button onclick="lesson('+subjectId+','+chapter+')">Подробная глава</button></p>':'';
  const video=videos[current+1];
  const watch=video?'<p><a href="https://www.youtube.com/watch?v='+video+'" target="_blank" rel="noopener noreferrer">Посмотреть на YouTube</a></p>':'';
  const sources=readings[current+1]||[];
  const read=sources.length?'<div class="toolbar">'+sources.map(([label,url])=>
   '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>').join('')+'</div>':'';
  const materials=window.klassikiLessonReadings(subjectId,lessonTitle,current+1,{hasSource:Boolean(video||sources.length)});
  const figure=figures[current+1];
  const illustration=figure?'<figure style="margin:1rem 0;max-width:720px"><img style="display:block;width:100%;height:auto" src="./'+
   esc(figure[0])+'" alt="'+esc(figure[1])+'"><figcaption class="muted">'+esc(figure[2])+
   ' <a href="./'+esc(figure[0])+'" target="_blank" rel="noopener noreferrer">Открыть крупнее</a></figcaption></figure>':'';
  const recording=listening[current+1];
  const listen=recording?'<p class="muted">Учебная озвучка</p>'+
   '<audio controls preload="none" style="width:100%;max-width:420px" aria-label="Аудиозапись к заданию">'+
   '<source src="./'+esc(recording[0])+'" type="audio/mpeg">'+
   '<a href="./'+esc(recording[0])+'">Открыть аудиозапись</a></audio>'+
   '<details class="question"><summary>Показать текст записи</summary><p lang="en">'+esc(recording[1])+'</p></details>':'';
  const questions=checks[current+1];
  const next=current+1<lessons.length?'<button class="primary" onclick="'+namespace+'Open('+(current+1)+')">Следующее занятие</button>':'';
  app.innerHTML='<article class="panel'+(expanded?' lesson':'')+'"><button onclick="'+namespace+'Term('+term+')">К занятиям четверти</button>'+
   '<p>Занятие '+(current+1)+' из '+lessons.length+'</p><h2>'+esc(lessonTitle)+'</h2><p>'+esc(rule)+'</p>'+
   expanded+watch+read+materials+'<h3>Задание</h3><p>'+esc(task)+'</p>'+illustration+listen+'<details class="question"><summary>Открыть разбор</summary><p>'+esc(solution)+'</p></details>'+
   explanation+(questions?showCheck(questions):'')+'<div class="toolbar"><button onclick="'+namespace+'Toggle(this)" aria-pressed="'+completed(current)+'">'+
   (completed(current)?'Выполнено':'Отметить выполненным')+'</button>'+next+'</div><p id="'+storagePrefix+'-status" role="status">'+esc(message)+'</p></article>';
 }
 function showTerm(){
  const first=term*lessonsPerTerm;
  const done=terms[term].filter((_,i)=>completed(first+i)).length;
  const last=progress[lastKey];
  app.innerHTML='<section class="panel"><h2>'+esc(title)+' · '+lessons.length+' '+lessonCountWord+'</h2>'+
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
 if(Object.keys(checks).length)window[namespace+'Check']=function(event,form){
  event.preventDefault();
  const questions=checks[current+1];
  const answers=new FormData(form);
  const choices=questions.map((_,i)=>answers.get('q'+i));
  if(choices.includes(null))return false;
  const correct=questions.map((q,i)=>choices[i]===String(q[2]));
  const score=correct.filter(Boolean).length;
  const key=checkKey(current);
  const old=progress[key];
  const record={
   attempts:Math.min(Number.MAX_SAFE_INTEGER,(old?.attempts??0)+1),
   best:Math.max(old?.best??0,score)
  };
  const result=document.getElementById(storagePrefix+'-check-result');
  const feedback=questions.map((q,i)=>'<li>'+(correct[i]?'Верно. ':'Верный ответ: '+esc(q[1][q[2]])+'. ')+esc(q[3])+'</li>').join('');
  result.innerHTML='<p>Результат: '+score+' из '+questions.length+'.</p><ol>'+feedback+'</ol>';
  progress[key]=record;
  try{save()}catch{
   if(old)progress[key]=old;else delete progress[key];
   result.innerHTML+='<p>Браузер не сохранил результат.</p>';
   return false;
  }
  document.getElementById(storagePrefix+'-check-record').textContent=checkRecord(record,questions.length);
  return false;
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
