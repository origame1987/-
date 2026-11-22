/* Две части годового курса в общей навигации и с общим экспортом прогресса. */
(function(){
'use strict';
const courses=window.KlassikiHistoryYear;
const prior=render;
const controlNumbers=new Set([34,68]);
let selected=0;
let term=0;
let message='';
const lessonList=s=>courses[s].quarters.flat();
const lastKey=s=>'history-year-'+s+'-current';
const doneKey=(s,i)=>'history-year-'+s+'-done-'+i;
const completed=(s,i)=>progress[doneKey(s,i)]===true;
const number=(s,i)=>(s===4?34:0)+i+1;
const firstIndex=(s,q)=>courses[s].quarters.slice(0,q).reduce((sum,lessons)=>sum+lessons.length,0);

function showLesson(){
 const [title,period,story,task,solution,chapter]=lessonList(subject)[selected];
 const n=number(subject,selected);
 const video=window.KlassikiHistoryVideos?.[subject]?.[selected+1];
 const watch=video?'<p><a href="https://www.youtube.com/watch?v='+video+'" target="_blank" rel="noopener noreferrer">Посмотреть на YouTube</a></p>':'';
 const materials=window.klassikiLessonReadings(subject,title,selected+1,{hasSource:Boolean(video)});
 const detail=Number.isInteger(chapter)?'<p><button onclick="lesson('+subject+','+chapter+')">Подробная глава</button></p>':'';
 const next=lessonList(subject)[selected+1]?'<button class="primary" onclick="historyYearOpen('+(selected+1)+')">Следующее занятие</button>':
  subject===5?'<button class="primary" onclick="historyYearStart(4)">Перейти к истории России</button>':'';
 app.innerHTML='<article class="panel"><button onclick="historyYearTerm('+subject+','+term+')">К занятиям четверти</button>'+
  '<p>Занятие '+n+' из 68 · '+esc(SUBJECTS[subject][0])+'</p><h2>'+esc(title)+'</h2>'+
  '<p><strong>'+esc(period)+'</strong></p><p>'+esc(story)+'</p>'+watch+materials+
  '<h3>'+(controlNumbers.has(n)?'Контрольные вопросы':'Проверь себя')+'</h3><p>'+esc(task)+'</p>'+
  '<details class="question"><summary>Открыть разбор</summary><p>'+esc(solution)+'</p></details>'+detail+
  '<div class="toolbar"><button onclick="historyYearToggle(this)" aria-pressed="'+completed(subject,selected)+'">'+
  (completed(subject,selected)?'Выполнено':'Отметить выполненным')+'</button>'+next+
  '</div><p id="history-year-status" role="status">'+esc(message)+'</p></article>';
}
function showTerm(){
 const course=courses[subject];
 const current=course.quarters[term];
 const start=firstIndex(subject,term);
 const done=current.filter((_,i)=>completed(subject,start+i)).length;
 const last=progress[lastKey(subject)];
 const extra=subject===5?'<details class="question"><summary>Дополнительные главы</summary><div class="toolbar">'+[6,7].map(i=>
  '<button onclick="lesson(5,'+i+')">'+esc(SUBJECTS[5][1][i])+'</button>').join('')+'</div></details>':'';
 app.innerHTML='<section class="panel"><h2>'+esc(SUBJECTS[subject][0])+' · 7 класс</h2>'+
  '<div class="toolbar" aria-label="Разделы истории">'+[5,4].map(s=>'<button aria-pressed="'+(s===subject)+'" onclick="historyYearStart('+s+')">'+esc(SUBJECTS[s][0])+'</button>').join('')+'</div>'+
  '<div class="toolbar" aria-label="Четверти">'+course.quarters.map((_,i)=>'<button aria-pressed="'+(i===term)+
  '" onclick="historyYearTerm('+subject+','+i+')">'+(course.firstQuarter+i+1)+' четверть</button>').join('')+'</div>'+
  '<p>Выполнено '+done+' из '+current.length+' в этой четверти.</p>'+
  (lessonList(subject)[last]?'<p><button class="primary" onclick="historyYearOpen('+last+')">Продолжить занятие '+number(subject,last)+'</button></p>':'')+
  '<ol start="'+number(subject,start)+'">'+current.map(([title],i)=>'<li style="margin-bottom:8px"><button onclick="historyYearOpen('+(start+i)+')">'+
  (completed(subject,start+i)?'✓ ':'')+esc(title)+'</button></li>').join('')+'</ol>'+extra+'</section>';
}
window.historyYearSummary=s=>{
 const lessons=lessonList(s);
 return {total:lessons.length,done:lessons.filter((_,i)=>completed(s,i)).length};
};
window.historyYearStart=function(s){
 if(!Object.hasOwn(courses,s))return;
 const last=progress[lastKey(s)];
 let q=0;
 if(lessonList(s)[last]&&last>=firstIndex(s,1))q=1;
 window.historyYearTerm(s,q);
};
window.historyYearTerm=function(s,q){
 if(!Object.hasOwn(courses,s)||!Number.isInteger(q)||!courses[s].quarters[q])return;
 subject=s;
 term=q;
 go('historyYear');
};
window.historyYearOpen=function(i){
 if(!Object.hasOwn(courses,subject)||!Number.isInteger(i)||!lessonList(subject)[i])return;
 selected=i;
 term=i>=firstIndex(subject,1)?1:0;
 const key=lastKey(subject);
 const old=progress[key];
 progress[key]=i;
 message='';
 try{save()}catch{progress[key]=old;message='Браузер не сохранил текущее занятие.'}
 go('historyYearLesson');
};
window.historyYearToggle=function(button){
 const key=doneKey(subject,selected);
 const old=progress[key];
 const value=!completed(subject,selected);
 const status=document.getElementById('history-year-status');
 progress[key]=value;
 try{save()}catch{progress[key]=old;status.textContent='Браузер не сохранил отметку.';return}
 button.setAttribute('aria-pressed',String(value));
 button.textContent=value?'Выполнено':'Отметить выполненным';
 status.textContent='Отметка сохранена.';
};
render=function(){
 if(page==='historyYear'||page==='historyYearLesson'||(page==='subject'&&Object.hasOwn(courses,subject))){
  navHtml();
  if(page==='historyYearLesson')showLesson();else showTerm();
  return;
 }
 prior();
};
render();
})();
