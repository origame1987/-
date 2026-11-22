/* Календарь по годовым курсам. Задания и отметки привязаны к урокам, а не к датам. */
(function(){
'use strict';
const firstDate='2026-11-23';
const lastDate='2027-05-31';
const winterBreak=['2026-12-28','2027-01-10'];
const currentDate=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'});
const displayDate=new Intl.DateTimeFormat('ru-RU',{timeZone:'UTC',weekday:'long',day:'numeric',month:'long',year:'numeric'});
const today=()=>currentDate.format(new Date());
const clamp=date=>date<firstDate?firstDate:date>lastDate?lastDate:date;

function shiftDate(date,days){
 const utc=new Date(date+'T00:00:00Z');
 utc.setUTCDate(utc.getUTCDate()+days);
 return utc.toISOString().slice(0,10);
}
const dateLabel=date=>displayDate.format(new Date(date+'T00:00:00Z'));

function course(subjectId,terms,storagePrefix,open,taskIndex=2){
 return terms.flat().map((lesson,index)=>({
  subjectId,index,title:lesson[0],task:lesson[taskIndex],solution:lesson[taskIndex+1],open,
  lessonKey:storagePrefix+'-done-'+index,
  taskKey:'study-plan-task-'+subjectId+'-'+index
 }));
}
const historyCourse=id=>course(id,window.KlassikiHistoryYear[id].quarters,'history-year-'+id,index=>{
 subject=id;
 window.historyYearOpen(index);
},3);
const streams=[
 course(0,window.KlassikiAlgebraYear,'algebra-year',window.algebraYearOpen),
 course(1,window.KlassikiGeometryYear,'geometry-year',window.geometryYearOpen),
 course(2,window.KlassikiRussianYear,'russian-year',window.russianYearOpen),
 course(9,window.KlassikiEnglishYear,'english-year',window.englishYearOpen),
 course(8,window.KlassikiPhysicsYear,'physics-year',window.physicsYearOpen),
 course(3,window.KlassikiLiteratureYear,'literature-year',window.literatureYearOpen),
 [...historyCourse(5),...historyCourse(4)],
 course(7,window.KlassikiGeographyYear,'geography-year',window.geographyYearOpen),
 course(6,window.KlassikiBiologyYear,'biology-year',window.biologyYearOpen),
 course(10,window.KlassikiInformaticsYear,'informatics-year',window.informaticsYearOpen)
];
const all=streams.flat();
const entries=new Map(all.map(entry=>[entry.taskKey,entry]));
const schoolDays=[];
for(let date=firstDate;date<=lastDate;date=shiftDate(date,1)){
 const day=new Date(date+'T00:00:00Z').getUTCDay();
 if(day===0||day===6||(winterBreak[0]<=date&&date<=winterBreak[1]))continue;
 schoolDays.push(date);
}

function buildSchedule(){
 const positions=streams.map(()=>0);
 return new Map(schoolDays.map((date,dayIndex)=>{
  // Round the cumulative share so heavier days are spread across the calendar.
  const count=Math.round((dayIndex+1)*all.length/schoolDays.length)-Math.round(dayIndex*all.length/schoolDays.length);
  const day=[];
  const used=new Set();
  while(day.length<count){
   const available=streams.map((stream,index)=>({index,length:stream.length,position:positions[index]}))
    .filter(({position,length})=>position<length)
    .sort((a,b)=>((a.position+.5)/a.length)-((b.position+.5)/b.length)||a.index-b.index);
   const {index}=available.find(item=>!used.has(item.index))||available[0];
   day.push(streams[index][positions[index]++]);
   used.add(index);
  }
  return [date,day];
 }));
}
const schedule=buildSchedule();
const prior=render;
let selectedDate='';
let lessonOpenedFromPlan=false;
const checked=key=>progress[key]===true;
const complete=entry=>checked(entry.lessonKey)&&checked(entry.taskKey);
const dayEntries=()=>schedule.get(selectedDate)||[];
const firstUnfinishedBefore=date=>schoolDays.find(day=>day<date&&schedule.get(day).some(entry=>!complete(entry)));
const checkedAttr=key=>checked(key)?' checked':'';
const button=(label,action,disabled=false)=>'<button type="button" onclick="'+action+'"'+(disabled?' disabled':'')+'>'+label+'</button>';

function renderEntry(entry){
 const id=entry.taskKey;
 return '<article class="question plan-entry"><p class="muted">'+esc(SUBJECTS[entry.subjectId][0])+'</p><h3>'+esc(entry.title)+'</h3>'+
  button('Открыть урок','studyPlanOpen(\''+id+'\')')+
  '<details><summary>Задание к уроку</summary><p>'+esc(entry.task)+'</p>'+
  '<details><summary>Сверить решение</summary><p>'+esc(entry.solution)+'</p></details></details>'+
  '<div class="plan-checks">'+
  '<label><input type="checkbox" aria-label="Урок пройден: '+esc(entry.title)+'" onchange="studyPlanToggle(this,\''+id+'\',false)"'+checkedAttr(entry.lessonKey)+'> Урок пройден</label>'+
  '<label><input type="checkbox" aria-label="Задание выполнено: '+esc(entry.title)+'" onchange="studyPlanToggle(this,\''+id+'\',true)"'+checkedAttr(entry.taskKey)+'> Задание выполнено</label>'+
  '</div></article>';
}
function daySummary(){
 const day=dayEntries();
 return day.length?'Готово '+day.filter(complete).length+' из '+day.length+' на этот день.':'';
}
function yearSummary(){
 return 'За год: уроки '+all.filter(e=>checked(e.lessonKey)).length+' из '+all.length+
  ', задания '+all.filter(e=>checked(e.taskKey)).length+' из '+all.length+'.';
}
function missedButton(date){
 const missed=firstUnfinishedBefore(date<today()?date:today());
 return missed?button('К первому незавершённому дню','studyPlanSelect(\''+missed+'\')'):'';
}
function showPlan(){
 navHtml();
 const now=today();
 const day=dayEntries();
 const label=selectedDate===now?'Сегодня · ':selectedDate===firstDate&&now<firstDate?'Первый учебный день · ':'';
 const next=schoolDays.find(date=>date>selectedDate);
 const rest=day.length?'':'<p>На этот день уроков по плану нет.'+
  (next?' Следующий учебный день — '+esc(dateLabel(next))+'.':'')+'</p>'+
  (next?button('К следующему учебному дню','studyPlanSelect(\''+next+'\')'):'');
 app.innerHTML='<section class="panel study-plan"><h2>Учебный план</h2>'+
  '<div class="toolbar plan-controls">'+button('← День','studyPlanStep(-1)',selectedDate===firstDate)+
  '<label>Дата <input type="date" min="'+firstDate+'" max="'+lastDate+'" value="'+selectedDate+'" onchange="studyPlanSelect(this.value)"></label>'+
  button('День →','studyPlanStep(1)',selectedDate===lastDate)+button('Сегодня','studyPlanToday()')+'</div>'+
  '<h3 tabindex="-1" id="study-plan-date">'+label+esc(dateLabel(selectedDate))+'</h3>'+
  '<p id="study-plan-day">'+esc(daySummary())+'</p><p id="study-plan-year" class="muted">'+esc(yearSummary())+'</p>'+
  '<div id="study-plan-missed">'+missedButton(selectedDate)+'</div>'+
  '<p id="study-plan-status" role="status"></p>'+rest+day.map(renderEntry).join('')+
  '<details><summary>Как устроен план</summary><p>С 23 ноября 2026 по 31 мая 2027 года. Занятия по будням, зимняя пауза с 28 декабря по 10 января. '+
  'Даты по московскому времени. В плане '+all.length+' уроков 7 класса и по одному заданию к каждому. '+
  'Отметки хранятся в этом браузере и входят в резервную копию прогресса.</p></details></section>';
}
window.studyPlanTaskKey=key=>entries.has(key);
window.studyPlanToday=function(){
 selectedDate=clamp(today());
 go('studyPlan');
};
window.studyPlanSelect=function(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<firstDate||date>lastDate)return;
 const parsed=new Date(date+'T00:00:00Z');
 if(!Number.isFinite(parsed.valueOf())||parsed.toISOString().slice(0,10)!==date)return;
 selectedDate=date;
 go('studyPlan');
 document.getElementById('study-plan-date')?.focus();
};
window.studyPlanStep=days=>window.studyPlanSelect(shiftDate(selectedDate,days));
window.studyPlanOpen=function(id){
 const entry=entries.get(id);
 if(!entry)return;
 lessonOpenedFromPlan=true;
 entry.open(entry.index);
};
window.studyPlanToggle=function(input,id,practice){
 const entry=entries.get(id);
 if(!entry)return;
 const key=practice?entry.taskKey:entry.lessonKey;
 const old=progress[key];
 progress[key]=input.checked;
 const status=document.getElementById('study-plan-status');
 try{save()}catch{
  if(old===undefined)delete progress[key];else progress[key]=old;
  input.checked=checked(key);
  status.textContent='Браузер не сохранил отметку.';
  return;
 }
 document.getElementById('study-plan-day').textContent=daySummary();
 document.getElementById('study-plan-year').textContent=yearSummary();
 const missed=document.getElementById('study-plan-missed');
 const updatedMissed=missedButton(selectedDate);
 if(missed.innerHTML!==updatedMissed)missed.innerHTML=updatedMissed;
 status.textContent='Отметка сохранена.';
};
render=function(){
 if(page==='studyPlan'){
  selectedDate||=clamp(today());
  lessonOpenedFromPlan=false;
  showPlan();
  return;
 }
 prior();
 if(lessonOpenedFromPlan&&(/YearLesson$/.test(page)||page==='lesson'||page==='geometryTextbook')){
  const back=document.createElement('button');
  back.type='button';
  back.textContent='← К учебному плану';
  back.onclick=()=>go('studyPlan');
  app.prepend(back);
 }else{
  lessonOpenedFromPlan=false;
 }
};
function handlePlanHash(){
 if(window.location.hash==='#plan'&&page!=='studyPlan')go('studyPlan');
}
window.addEventListener('hashchange',handlePlanHash);
handlePlanHash();
})();
