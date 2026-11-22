/* Годовой маршрут использует те же навигацию и сохранение, что учебник. */
(function(){
'use strict';
const terms=window.KlassikiGeometryYear;
const lessons=terms.flat();
const size=terms[0].length;
const lastKey='geometry-year-current';
const doneKey=i=>'geometry-year-done-'+i;
const completed=i=>progress[doneKey(i)]===true;
const prior=render;
let current=0;
let term=0;
let returnFromChapter=null;

const diagram=(label,content)=>'<figure class="question" style="max-width:460px;margin:16px 0"><svg viewBox="0 0 320 160" width="100%" role="img" aria-label="'+label+'">'+content+'</svg></figure>';
const parallel=()=>diagram('Прямые a и b и секущая c. Точки пересечения P и Q.',
 '<path d="M20 54H294 M20 117H294 M103 143L208 19" fill="none" stroke="currentColor" stroke-width="2"/>'+
 '<circle cx="178.4" cy="54" r="3" fill="currentColor"/><circle cx="125" cy="117" r="3" fill="currentColor"/>'+
 '<g fill="currentColor" font-size="16"><text x="299" y="59">a</text><text x="299" y="122">b</text><text x="216" y="23">c</text><text x="161" y="48">P</text><text x="111" y="111">Q</text></g>');
const triangle=()=>diagram('Треугольник ABC. Сторона BC продолжена за C до D.',
 '<path d="M55 124L139 28L229 124ZM229 124H293" fill="none" stroke="currentColor" stroke-width="2"/>'+
 '<g fill="currentColor" font-size="16"><text x="135" y="22">A</text><text x="42" y="144">B</text><text x="225" y="144">C</text><text x="288" y="144">D</text></g>');
function show(message=''){
 navHtml();
 if(page==='geometryYearLesson'){
  const [title, rule, task, solution, chapter]=lessons[current];
  const video=window.KlassikiGeometryVideos?.[current+1];
  const videoLink=video?'<p><a href="https://www.youtube.com/watch?v='+video[0]+
    (video[1]?'&amp;t='+video[1]+'s':'')+'" target="_blank" rel="noopener noreferrer">Посмотреть на YouTube</a></p>':'';
  const materials=window.klassikiLessonReadings(1,title,current+1,{hasSource:Boolean(video)});
  const core=window.KlassikiGeometryEssentials[current+1];
  const example=window.KlassikiGeometryQuickExamples[current+1];
  const visual=current>=31&&current<=41?parallel():current>=42&&current<=47?triangle():'';
  const explanation=core?'<details class="question"><summary>Подробнее о правиле</summary><p>'+esc(rule)+'</p></details>':'';
  const textbook=chapter===undefined?'':'<p><button onclick="geometryYearChapter('+chapter+')">Подробная глава</button></p>';
  app.innerHTML='<article class="panel"><button onclick="geometryYearTerm('+term+')">К занятиям четверти</button>'+
   '<p>Занятие '+(current+1)+' из '+lessons.length+'</p><h2>'+esc(title)+'</h2>'+
   '<p>'+esc(core||rule)+'</p>'+visual+videoLink+materials+
   (example?'<h3>Пример</h3><p>'+esc(example)+'</p>':'')+
   '<h3>Задание</h3><p>'+esc(task)+'</p><details class="question"><summary>Открыть разбор</summary><p>'+esc(solution)+'</p></details>'+
   explanation+textbook+
   '<div class="toolbar"><button onclick="geometryYearToggle()" aria-pressed="'+completed(current)+'">'+(completed(current)?'Выполнено':'Отметить выполненным')+'</button>'+
   (current+1<lessons.length?'<button class="primary" onclick="geometryYearOpen('+(current+1)+')">Следующее занятие</button>':'<button class="primary" onclick="geometryYearTerm('+term+')">К занятиям четверти</button>')+
   '</div><p role="status">'+esc(message)+'</p></article>';
  return;
 }
 const last=progress[lastKey];
 const first=term*size;
 const done=terms[term].filter((_,i)=>completed(first+i)).length;
 app.innerHTML='<section class="panel"><h2>Геометрия 7 класса · 68 занятий</h2>'+
  '<div class="toolbar" aria-label="Четверти">'+terms.map((_,i)=>'<button aria-pressed="'+(term===i)+'" onclick="geometryYearTerm('+i+')">'+(i+1)+' четверть</button>').join('')+'</div>'+
  '<p>Выполнено '+done+' из '+size+' в этой четверти.</p>'+
  (lessons[last]?'<p><button class="primary" onclick="geometryYearOpen('+last+')">Продолжить занятие '+(last+1)+'</button></p>':'')+
  '<ol start="'+(first+1)+'">'+terms[term].map(([title],i)=>'<li style="margin-bottom:8px"><button onclick="geometryYearOpen('+(first+i)+')">'+(completed(first+i)?'✓ ':'')+esc(title)+'</button></li>').join('')+'</ol><p><button onclick="geometryYearTextbook()">Все подробные главы</button></p></section>';
}
window.geometryYearStart=function(){
 subject=1;
 const last=progress[lastKey];
 window.geometryYearTerm(lessons[last]?Math.floor(last/size):0);
};
window.geometryYearTextbook=function(){
 subject=1;
 quarter=term+1;
 go('geometryQuarter');
};
window.geometryYearChapter=function(id){
 returnFromChapter=current;
 window.geometryTextbookOpen(id);
};
window.geometryYearTerm=function(i){
 if(!Number.isInteger(i)||!terms[i])return;
 term=i;
 go('geometryYear');
};
window.geometryYearOpen=function(i){
 if(!Number.isInteger(i)||!lessons[i])return;
 current=i;
 term=Math.floor(i/size);
 progress[lastKey]=i;
 let message='';
 try{save()}catch{message='Браузер не сохранил текущее занятие.'}
 go('geometryYearLesson');
 if(message)show(message);
};
window.geometryYearToggle=function(){
 const key=doneKey(current);
 const previous=progress[key];
 progress[key]=!completed(current);
 try{save()}catch{progress[key]=previous;show('Браузер не сохранил отметку.');return}
 show('Отметка сохранена.');
};
render=function(){
 if(page!=='geometryTextbook')returnFromChapter=null;
 if(page==='geometryYear'||page==='geometryYearLesson'){show();return}
 prior();
 if(page==='geometryTextbook'&&returnFromChapter!==null){
  const lesson=returnFromChapter;
  const back=document.createElement('button');
  back.textContent='К короткому уроку';
  back.onclick=()=>window.geometryYearOpen(lesson);
  app.prepend(back);
 }
 if(page==='home'||page==='geometryQuarter'){
  const section=document.createElement('section');
  section.className='panel';
  const action=page==='geometryQuarter'?'geometryYearTerm('+(quarter-1)+')':'geometryYearStart()';
  section.innerHTML='<button class="primary" onclick="'+action+'">Короткий курс геометрии</button>';
  app.prepend(section);
 }
};
render();
})();
