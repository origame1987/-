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
const quarterDiagrams={
 2:()=>diagram('Точки P, A, M, B на одной прямой. Цветом выделен отрезок AB.',
  '<path d="M15 85H305" stroke="currentColor" stroke-width="2"/><path d="M105 85H260" stroke="#235bb4" stroke-width="5"/>'+
  '<g fill="currentColor"><circle cx="48" cy="85" r="4"/><circle cx="105" cy="85" r="4"/><circle cx="180" cy="85" r="4"/><circle cx="260" cy="85" r="4"/>'+
  '<g font-size="17" text-anchor="middle"><text x="48" y="115">P</text><text x="105" y="115">A</text><text x="180" y="115">M</text><text x="260" y="115">B</text></g></g>'),
 7:()=>diagram('Луч OC разделяет развёрнутый угол AOB на два смежных угла.',
  '<path d="M23 113H296 M160 113L230 24" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M128 113A32 32 0 0 1 180 88 M186 80A42 42 0 0 1 202 113" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="17"><text x="24" y="137">A</text><text x="286" y="137">B</text><text x="238" y="29">C</text><text x="154" y="137">O</text></g>'),
 8:()=>diagram('Прямые AB и CD пересекаются в O. Дугами отмечены вертикальные углы AOC и BOD.',
  '<path d="M25 78H295 M255 18L65 138" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M120 78A40 40 0 0 1 194 57 M200 78A40 40 0 0 1 126 99" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="17"><text x="25" y="70">A</text><text x="283" y="70">B</text><text x="264" y="26">C</text><text x="49" y="141">D</text><text x="151" y="102">O</text></g>'),
 17:()=>diagram('В треугольнике ABC отрезок AH — высота. H лежит на продолжении стороны BC за B.',
  '<path d="M72 22L138 122H273Z M28 122H138" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M72 22V122 M72 106H88V122" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="17" text-anchor="middle"><text x="72" y="17">A</text><text x="138" y="145">B</text><text x="273" y="145">C</text><text x="72" y="145">H</text></g>'),
 18:()=>diagram('Равнобедренный треугольник ABC. Отрезок AD делит основание BC пополам под прямым углом.',
  '<path d="M160 24L82 124H238Z M114 69l14 10 M192 79l14-10" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M160 24V124 M160 110H174V124" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="17" text-anchor="middle"><text x="160" y="18">A</text><text x="82" y="146">B</text><text x="238" y="146">C</text><text x="160" y="146">D</text></g>'),
 23:()=>diagram('Окружность с центром O. Отрезок AB — диаметр, OA — радиус.',
  '<circle cx="160" cy="78" r="53" fill="none" stroke="currentColor" stroke-width="2"/><path d="M107 78H213" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor"><circle cx="107" cy="78" r="3"/><circle cx="160" cy="78" r="3"/><circle cx="213" cy="78" r="3"/>'+
  '<g font-size="17" text-anchor="middle"><text x="95" y="83">A</text><text x="160" y="103">O</text><text x="225" y="83">B</text></g></g>'),
 36:()=>diagram('Вертикальные прямые OA и RB перпендикулярны горизонтальной секущей PQ.',
  '<path d="M20 108H300 M105 26V137 M215 26V137" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M105 94H119V108 M215 94H229V108" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16"><text x="20" y="129">P</text><text x="287" y="129">Q</text><text x="83" y="40">A</text><text x="193" y="40">B</text><text x="81" y="130">O</text><text x="193" y="130">R</text></g>'),
 43:()=>diagram('Через вершину A треугольника ABC проведена прямая, параллельная основанию BC.',
  '<path d="M65 122L155 39L255 122Z" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M25 39H295" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<path d="M212 34l6 5-6 5 M212 117l6 5-6 5" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16" text-anchor="middle"><text x="155" y="29">A</text><text x="65" y="144">B</text><text x="255" y="144">C</text></g>'),
 46:()=>diagram('Треугольник ABC. Точка D лежит на AC, причём AD равно AB. Отрезок BD используется в доказательстве.',
  '<path d="M44 122L93 37L270 122Z" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M44 122L181.5 79.5" stroke="#235bb4" stroke-width="2"/>'+
  '<path d="M62 75l13 8 M133 64l8-12" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16" text-anchor="middle"><text x="93" y="29">A</text><text x="44" y="144">B</text><text x="270" y="144">C</text><text x="190" y="73">D</text></g>'),
 47:()=>diagram('Треугольник ABC. Отрезок AB продолжен за B до D, причём BD равно BC.',
  '<path d="M42 121H244.65L158 45Z M158 45L168 121" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M168 121H244.65 M159 82l13-2 M205 114v14" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16" text-anchor="middle"><text x="42" y="143">A</text><text x="168" y="143">B</text><text x="158" y="37">C</text><text x="244.65" y="143">D</text></g>'),
 50:()=>diagram('Прямоугольный треугольник ABC с углом 30° при A. На продолжении BC отмечена точка D, причём BC равно CD.',
  '<path d="M41 80L142 21.7V138.3Z M41 80H142 M129 80V67H142" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M137 51H147 M137 109H147" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16"><text x="21" y="86">A</text><text x="151" y="26">B</text><text x="151" y="85">C</text><text x="151" y="143">D</text></g>'),
 52:()=>diagram('Из P проведены перпендикуляр PH и наклонная PX к прямой a.',
  '<path d="M23 112H294 M95 29V112L224 112Z" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M95 29V112 M95 99H108V112" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16"><text x="82" y="25">P</text><text x="89" y="134">H</text><text x="219" y="134">X</text><text x="283" y="103">a</text></g>'),
 53:()=>diagram('Точки A и B на верхней прямой, H и K на нижней. Показаны равные перпендикуляры AH и BK и общая диагональ AK.',
  '<path d="M25 38H295 M25 122H295 M89 38V122 M221 38V122" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M89 38L221 122 M89 110H101V122 M209 122V110H221" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16" text-anchor="middle"><text x="89" y="29">A</text><text x="221" y="29">B</text><text x="89" y="144">H</text><text x="221" y="144">K</text></g>'),
 56:()=>diagram('Окружность с центром B пересекает луч с началом A в точках C₁ и C₂. Перпендикуляр BH расположен между ними.',
  '<path d="M32 113H292 M32 113L162 38 M162 38V113 M162 102H173V113" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<path d="M112.25 113A90 90 0 0 0 211.75 113 M162 38L112.25 113 M162 38L211.75 113" fill="none" stroke="#235bb4" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16" text-anchor="middle"><text x="32" y="135">A</text><text x="162" y="30">B</text><text x="112" y="135">C₁</text><text x="162" y="146">H</text><text x="212" y="135">C₂</text></g>'),
 57:()=>diagram('При основании AB длиной 6 см окружности радиусов 4 и 5 см пересекаются в точках C и C′.',
  '<circle cx="70" cy="80" r="70" fill="none" stroke="#235bb4" stroke-width="1.4"/><circle cx="175" cy="80" r="87.5" fill="none" stroke="#235bb4" stroke-width="1.4"/>'+
  '<path d="M70 80L109.375 22.13L175 80H70 M70 80L109.375 137.87L175 80" fill="none" stroke="currentColor" stroke-width="2"/>'+
  '<g fill="currentColor" font-size="16" text-anchor="middle"><text x="65" y="102">A</text><text x="180" y="102">B</text><text x="109" y="17">C</text><text x="109" y="154">C′</text></g>')
};
const proofLessons=new Set([35,38,46,47,51]);
function renderPractice({example,practice,check}){
 const [prompt,steps]=example;
 return '<h3>Разобранный пример</h3><p>'+esc(prompt)+'</p>'+
  '<details class="question"><summary>Разбор по шагам</summary><ol>'+steps.map(step=>'<li>'+esc(step)+'</li>').join('')+'</ol></details>'+
  '<h3>Самостоятельная практика</h3><ol>'+practice.map(([task,solution])=>'<li><p>'+esc(task)+'</p>'+
   '<details class="question"><summary>Проверить решение</summary><p>'+esc(solution)+'</p></details></li>').join('')+'</ol>'+
  '<p><strong>Проверь себя.</strong> '+esc(check)+'</p>';
}
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
  const expanded=window.KlassikiGeometryQuarter1Explanations?.[current+1];
  const extra=window.klassikiRenderYearExplanation?.(1,current+1)||'';
  const enriched=expanded||extra;
  const control=[12,30,41,59,67].includes(current+1);
  const visual=quarterDiagrams[current+1]?.()||(current>=31&&current<=41?parallel():current===43?triangle():'');
  const explanation=extra&&proofLessons.has(current+1)?
   '<details class="question"><summary>Почему это верно</summary><p>'+esc(rule)+'</p></details>':
   core&&!enriched?'<details class="question"><summary>Подробнее о правиле</summary><p>'+esc(rule)+'</p></details>':'';
  const theory=expanded?'<p><strong>Цель урока.</strong> '+esc(expanded.goal)+'</p><h3>Как это работает</h3>'+
    expanded.theory.map(paragraph=>'<p>'+esc(paragraph)+'</p>').join(''):extra?'':'<p>'+esc(core||rule)+'</p>';
  const practice=expanded?renderPractice(expanded):extra;
  const textbook=chapter===undefined?'':'<p><button onclick="geometryYearChapter('+chapter+')">Подробная глава</button></p>';
  const sources=videoLink+materials+textbook;
  app.innerHTML='<article class="panel'+(enriched?' lesson':'')+'"><button onclick="geometryYearTerm('+term+')">К занятиям четверти</button>'+
   '<p>Занятие '+(current+1)+' из '+lessons.length+'</p><h2>'+esc(title)+'</h2>'+
   theory+visual+
   (enriched?'':videoLink+materials)+
   (!enriched&&example?'<h3>Пример</h3><p>'+esc(example)+'</p>':'')+
   (control?'':practice)+
   '<h3>Задание</h3><p>'+esc(task)+'</p><details class="question"><summary>Открыть разбор</summary><p>'+esc(solution)+'</p></details>'+
   (control?practice:'')+explanation+
   (enriched&&sources?'<h3>Если хочешь разобраться подробнее</h3>'+sources:textbook)+
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
 if(page==='geometryQuarter'){
  const section=document.createElement('section');
  section.className='panel';
  const action=page==='geometryQuarter'?'geometryYearTerm('+(quarter-1)+')':'geometryYearStart()';
  section.innerHTML='<button class="primary" onclick="'+action+'">Короткий курс геометрии</button>';
  app.prepend(section);
 }
};
render();
})();
