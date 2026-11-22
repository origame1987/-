/* Короткий курс с отдельными отметками. Подробные главы используют прежний прогресс. */
(function(){
'use strict';
const terms=window.KlassikiAlgebraYear;
const lessons=terms.flat();
const lessonsPerTerm=terms[0].length;
const lastKey='algebra-year-current';
const doneKey=i=>'algebra-year-done-'+i;
const completed=i=>progress[doneKey(i)]===true;
const termFor=i=>Math.floor(i/lessonsPerTerm);
const prior=render;
let term=0;
let current=0;
let message='';

function showLesson(){
 const [title,rule,task,solution,chapter]=lessons[current];
 const explanation=Number.isInteger(chapter)?'<p><button onclick="lesson(0,'+chapter+')">Подробная глава</button></p>':'';
 const video=window.KlassikiAlgebraVideos[current+1];
 const watch=video?'<p><a href="https://www.youtube.com/watch?v='+video+'" target="_blank" rel="noopener noreferrer">Посмотреть на YouTube</a></p>':'';
 const next=current+1<lessons.length?'<button class="primary" onclick="algebraYearOpen('+(current+1)+')">Следующее занятие</button>':'';
 app.innerHTML='<article class="panel"><button onclick="algebraYearTerm('+term+')">К занятиям четверти</button>'+
  '<p>Занятие '+(current+1)+' из '+lessons.length+'</p><h2>'+esc(title)+'</h2><p>'+esc(rule)+'</p>'+
  watch+'<h3>Задание</h3><p>'+esc(task)+'</p><details class="question"><summary>Открыть разбор</summary><p>'+esc(solution)+'</p></details>'+
  explanation+'<div class="toolbar"><button onclick="algebraYearToggle(this)" aria-pressed="'+completed(current)+'">'+
  (completed(current)?'Выполнено':'Отметить выполненным')+'</button>'+next+'</div><p id="algebra-year-status" role="status">'+esc(message)+'</p></article>';
}
function showTerm(){
 const first=term*lessonsPerTerm;
 const done=terms[term].filter((_,i)=>completed(first+i)).length;
 const last=progress[lastKey];
 app.innerHTML='<section class="panel"><h2>Алгебра 7 класса · '+lessons.length+' занятий</h2>'+
  '<div class="toolbar" aria-label="Четверти">'+terms.map((_,i)=>'<button aria-pressed="'+(term===i)+'" onclick="algebraYearTerm('+i+')">'+(i+1)+' четверть</button>').join('')+'</div>'+
  '<p>Выполнено '+done+' из '+terms[term].length+' в этой четверти.</p>'+
  (lessons[last]?'<p><button class="primary" onclick="algebraYearOpen('+last+')">Продолжить занятие '+(last+1)+'</button></p>':'')+
  '<ol start="'+(first+1)+'">'+terms[term].map(([title],i)=>'<li style="margin-bottom:8px"><button onclick="algebraYearOpen('+(first+i)+')">'+
  (completed(first+i)?'✓ ':'')+esc(title)+'</button></li>').join('')+'</ol></section>';
}
window.algebraYearSummary=()=>({total:lessons.length,done:lessons.filter((_,i)=>completed(i)).length});
window.algebraYearStart=function(){
 const last=progress[lastKey];
 window.algebraYearTerm(lessons[last]?termFor(last):0);
};
window.algebraYearTerm=function(i){
 if(!Number.isInteger(i)||!terms[i])return;
 term=i;
 subject=0;
 go('algebraYear');
};
window.algebraYearOpen=function(i){
 if(!Number.isInteger(i)||!lessons[i])return;
 current=i;
 term=termFor(i);
 subject=0;
 const old=progress[lastKey];
 progress[lastKey]=i;
 message='';
 try{save()}catch{progress[lastKey]=old;message='Браузер не сохранил текущее занятие.'}
 go('algebraYearLesson');
};
window.algebraYearToggle=function(button){
 const key=doneKey(current);
 const old=progress[key];
 const value=!completed(current);
 const status=document.getElementById('algebra-year-status');
 progress[key]=value;
 try{save()}catch{progress[key]=old;status.textContent='Браузер не сохранил отметку.';return}
 button.setAttribute('aria-pressed',String(value));
 button.textContent=value?'Выполнено':'Отметить выполненным';
 status.textContent='Отметка сохранена.';
};
render=function(){
 if(page==='algebraYear'||page==='algebraYearLesson'||(page==='subject'&&subject===0)){
  navHtml();
  if(page==='algebraYearLesson')showLesson();else showTerm();
  return;
 }
 prior();
};
render();
})();
