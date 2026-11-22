/* Движок отображения отдельных глав: не изменяет старые ключи прогресса. */
(function(){
'use strict';
let current=1;
const key='klassiki-textbook-quiz-v1';
const escText=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const oldRender=render;
// IDs are permanent. The route defines the teaching order independently.
const route=[[0,1,2,3,4,5,6,7,11,10],[8,9,12,14,15],[13],[]];
const doneKey=id=>'geometry-textbook-done-'+id;
const completed=id=>progress[doneKey(id)]===true;
const chapterButton=(id,label)=>'<button onclick="geometryTextbookOpen('+id+')">'+escText(label)+'</button>';
function coursePanel(q){
 const ids=route[q-1].filter(id=>window.KlassikiTextbook.get(id));
 const panel=document.createElement('section');
 panel.className='panel';
 panel.innerHTML='<h2>Учебник геометрии · '+q+' четверть</h2><div class="toolbar" aria-label="Четверти">'+
 route.map((_,i)=>'<button aria-pressed="'+(q===i+1)+'" onclick="setQuarter('+(i+1)+')">'+(i+1)+' четверть</button>').join('')+'</div>'+
 (ids.length?'<p>Изучено '+ids.filter(completed).length+' из '+ids.length+'</p><div class="list">'+
 ids.map(id=>chapterButton(id,(completed(id)?'✓ ':'')+window.KlassikiTextbook.get(id).title)).join('')+'</div>':
 '<p>Главы этой четверти готовятся.</p>');
 return panel;
}
function overallPanel(){
 const ids=route.flat().filter(id=>window.KlassikiTextbook.get(id));
 const next=progress['geometry-textbook-current'];
 const current=window.KlassikiTextbook.get(next);
 const panel=document.createElement('section');
 panel.className='panel';
 panel.innerHTML='<h3>Учебник геометрии · 7 класс</h3><p>Изучено '+ids.filter(completed).length+' из '+ids.length+' доступных глав.</p>'+
 (current?chapterButton(next,'Продолжить: '+current.title):chapterButton(0,'Начать геометрию'));
 return panel;
}
function view(){
const ch=window.KlassikiTextbook?.get(current);navHtml();
if(!ch){app.innerHTML='<p>Глава пока готовится.</p><button onclick="geometryQuarterHome()">Вернуться</button>';return}
const h=escText;
const guide=window.KlassikiGeometryGuide?.[current];
const intro=guide?'<section><p>'+h(guide.introduction)+'</p><h3>Что ты освоишь</h3><ul>'+
 guide.goals.map(goal=>'<li>'+h(goal)+'</li>').join('')+'</ul></section>':'';
const recap=guide?'<section><h3>Что запомнить</h3><p>'+h(guide.recap)+'</p><h3>Проверь себя</h3><p>'+
 h(guide.check)+'</p><p>Ориентир для мини-теста: не менее 8 верных ответов из 10.</p></section>':'';
const practice=ch.exercises.map((x,i)=>{
 const prompt=h(x.level)+' · '+(i+1)+'. '+h(x.prompt);
 const solution='<p>'+h(x.solution)+'</p>';
 const hint=guide?.hints[i];
 if(!hint)return '<details class="question"><summary>'+prompt+'</summary>'+solution+'</details>';
 return '<section class="question"><p>'+prompt+'</p><details><summary>Подсказка</summary><p>'+h(hint)+
 '</p></details><details><summary>Решение</summary>'+solution+'</details></section>';
}).join('');
const ids=route.find(ids=>ids.includes(current))||[];
const next=ids.slice(ids.indexOf(current)+1).find(id=>window.KlassikiTextbook.get(id));
let history=[];
try{const stored=JSON.parse(localStorage.getItem(key)||'{}');const records=stored&&typeof stored==='object'&&!Array.isArray(stored)?stored[current]:null;if(Array.isArray(records))history=records.filter(a=>a&&typeof a==='object'&&Number.isInteger(a.score)&&Number.isInteger(a.total)&&a.total>0&&a.score>=0&&a.score<=a.total&&typeof a.date==='string'&&!Number.isNaN(Date.parse(a.date))).slice(-30)}catch{}
const historyHtml='<section class="question" aria-label="История результатов"><h3>Мои предыдущие попытки</h3>'+(history.length?'<p>Сохранённые попытки: '+history.length+'</p><ol>'+history.slice(-5).reverse().map(a=>'<li>'+h(new Date(a.date).toLocaleDateString('ru-RU'))+' — '+a.score+' из '+a.total+'</li>').join('')+'</ol>':'<p>Пока нет сохранённых результатов по этой главе.</p>')+'</section>';
app.innerHTML='<article class="panel"><button onclick="geometryQuarterHome()">К четверти</button><h2>'+h(ch.title)+'</h2>'+intro+(ch.diagram?'<figure class="question" style="max-width:480px;margin:16px auto">'+ch.diagram+'</figure>':'')+'<p>'+ch.sections.length+' разделов · '+ch.examples.length+' примеров · '+ch.exercises.length+' упражнений · '+ch.quiz.length+' вопросов</p>'+ch.sections.map((s,i)=>'<section><h3>'+(i+1)+'. '+h(s.heading)+'</h3><p style="line-height:1.8">'+h(s.text)+'</p></section>').join('')+(current===15&&Array.isArray(window.KlassikiGeometryWorkshop)?'<h3>Практикум доказательств и построений · 10 задач</h3><p>Сначала реши самостоятельно в тетради. Открой подробное доказательство для самопроверки.</p>'+window.KlassikiGeometryWorkshop.map((p,i)=>'<details class="question"><summary><strong>Задача '+(i+1)+'. '+h(p.title)+'</strong> '+h(p.given)+' '+h(p.ask)+'</summary><ol>'+p.steps.map(step=>'<li>'+h(step)+'</li>').join('')+'</ol></details>').join(''):'')+'<h3>Разобранные примеры</h3>'+ch.examples.map((x,i)=>'<section class="question"><strong>Пример '+(i+1)+': '+h(x.prompt)+'</strong><p>'+h(x.solution)+'</p></section>').join('')+'<h3>Практика с решениями</h3>'+practice+recap+(ch.extraExercises.length||ch.extraQuestions.length?'<details class="question"><summary>Дополнительные задания</summary>'+ch.extraExercises.map(x=>'<details class="question"><summary>'+h(x.level)+' · '+h(x.prompt)+'</summary><p>'+h(x.solution)+'</p></details>').join('')+ch.extraQuestions.map(q=>'<details class="question"><summary>'+h(q.prompt)+'</summary><p>'+h(q.options[q.correct])+'. '+h(q.explanation)+'</p></details>').join('')+'</details>':'')+historyHtml+'<h3>Мини-тест · '+ch.quiz.length+' вопросов</h3><form id="textbookQuiz">'+ch.quiz.map((q,i)=>'<fieldset class="question"><legend>'+(i+1)+'. '+h(q.prompt)+'</legend>'+q.options.map((a,j)=>'<label class="answer"><input type="radio" name="q'+i+'" value="'+j+'" required> '+h(a)+'</label>').join('')+'</fieldset>').join('')+'<button type="submit" class="primary">Проверить тест</button></form><div id="textbookResult" aria-live="polite"></div><p><button type="button" aria-pressed="'+completed(current)+'" onclick="geometryTextbookToggle()" id="textbookDone">'+(completed(current)?'Изучено':'Отметить как изученное')+'</button></p><p id="textbookDoneStatus" role="status"></p>'+(next===undefined?'<button onclick="geometryQuarterHome()">К оглавлению</button>':chapterButton(next,'Следующий урок'))+'</article>';
document.getElementById('textbookQuiz').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);if(ch.quiz.some((_,i)=>f.get('q'+i)==null))return;const details=ch.quiz.map((q,i)=>({ok:Number(f.get('q'+i))===q.correct,answer:q.options[q.correct],explanation:q.explanation})),score=details.filter(x=>x.ok).length;let state={};try{const saved=JSON.parse(localStorage.getItem(key)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))state=saved}catch{};const attempts=Array.isArray(state[current])?state[current].filter(a=>a&&typeof a==='object'&&Number.isInteger(a.score)&&Number.isInteger(a.total)&&a.total>0&&a.score>=0&&a.score<=a.total&&typeof a.date==='string').slice(-29):[];attempts.push({date:new Date().toISOString(),score,total:details.length});state[current]=attempts;let savedOK=true;try{localStorage.setItem(key,JSON.stringify(state))}catch{savedOK=false};document.getElementById('textbookResult').innerHTML='<h3>Результат: '+score+' из '+details.length+'</h3>'+details.map((d,i)=>'<p>'+(i+1)+'. '+(d.ok?'✓ Верно':'✗ Ошибка')+'. Ответ: '+h(d.answer)+'. '+h(d.explanation)+'</p>').join('')+'<p>'+(savedOK?'Попытка сохранена. Можно пройти тест повторно.':'Результат показан, но сохранить его не удалось. Проверьте доступность памяти браузера.')+'</p>';});
}
window.geometryTextbookToggle=function(){
 const id=doneKey(current);
 progress[id]=!completed(current);
 const button=document.getElementById('textbookDone');
 button.setAttribute('aria-pressed',String(completed(current)));
 button.textContent=completed(current)?'Изучено':'Отметить как изученное';
 try{save();document.getElementById('textbookDoneStatus').textContent='Отметка сохранена.'}
 catch{document.getElementById('textbookDoneStatus').textContent='Не удалось сохранить отметку в браузере.'}
};
window.geometryTextbookOpen=function(id){
 const q=route.findIndex(ids=>ids.includes(id));
 if(q<0||!window.KlassikiTextbook.get(id))return;
 current=id;
 quarter=q+1;
 subject=1;
 progress['geometry-textbook-current']=id;
 try{save()}catch{}
 go('geometryTextbook');
};
render=function(){
 if(page==='geometryTextbook'){view();return}
 oldRender();
 if(page==='geometryQuarter')app.prepend(coursePanel(quarter));
 if(page==='home'||page==='progress')app.prepend(overallPanel());
};
render();
})();
