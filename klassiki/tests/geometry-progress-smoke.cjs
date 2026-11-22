/* Run: node klassiki/tests/geometry-progress-smoke.cjs
   Functional smoke test of the shipped textbook viewer with a minimal DOM stub.
   No dependencies or changes to actual browser storage. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const saved=new Map(),nodes=new Map(),handlers=new Map();
const app={innerHTML:'',prepend(){}};
const document={
 createElement(){return {}},
 getElementById(id){if(id==='textbookQuiz')return {addEventListener(type,fn){handlers.set(type,fn)}};
 if(!nodes.has(id))nodes.set(id,{innerHTML:''});return nodes.get(id)}
};
const localStorage={
 getItem(k){return saved.has(k)?saved.get(k):null},
 setItem(k,v){saved.set(k,String(v))}
};
class FormDataStub{constructor(form){this.form=form}get(k){return this.form.answers[k]}}
const ctx={window:{scrollTo(){}},document,localStorage,FormData:FormDataStub,
 structuredClone,Map,app,page:'home',render(){},navHtml(){},geometryQuarterHome(){},
 console,progress:{},subject:0,quarter:1,save(){},go(page){ctx.page=page;ctx.render()}};
vm.createContext(ctx);
for(const name of ['geometry-textbook-registry.js','geometry-textbook-lesson00.js','geometry-foundations-guide.js','geometry-textbook-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const chapter=ctx.window.KlassikiTextbook.get(0);
assert.ok(chapter&&chapter.quiz.length>=8,'Fixture chapter absent');
ctx.window.geometryTextbookOpen(0);
assert.match(app.innerHTML,/Что ты освоишь/);
assert.match(app.innerHTML,/<details><summary>Подсказка<\/summary>.*?<details><summary>Решение<\/summary>/);
assert.match(app.innerHTML,/textbookQuiz/,'Quiz form not rendered');
assert.equal(typeof handlers.get('submit'),'function','Quiz handler missing');
function submit(correct){
 const answers=Object.fromEntries(chapter.quiz.map((q,i)=>['q'+i,String(correct?q.correct:(q.correct+1)%q.options.length)]));
 handlers.get('submit')({preventDefault(){},target:{answers}});
}
const key='klassiki-textbook-quiz-v1';
submit(true);
let state=JSON.parse(saved.get(key));
assert.equal(state[0].length,1,'First attempt not saved');
assert.equal(state[0][0].score,chapter.quiz.length,'Correct answers not scored');
assert.match(nodes.get('textbookResult').innerHTML,/Результат/,'Feedback not rendered');
submit(false);
state=JSON.parse(saved.get(key));
assert.equal(state[0].length,2,'Previous attempt overwritten');
assert.equal(state[0][1].score,0,'Wrong answers scored incorrectly');
assert.equal(state[0][0].score,chapter.quiz.length,'Previous attempt mutated');
ctx.window.geometryTextbookOpen(0);
assert.match(app.innerHTML,/Мои предыдущие попытки/,'History panel missing');
assert.match(app.innerHTML,new RegExp(chapter.quiz.length+' из '+chapter.quiz.length),'Saved score not shown on reopening');
assert.match(app.innerHTML,/0 из /,'Second attempt not shown on reopening');

saved.set(key,'{invalid json');
submit(true);
state=JSON.parse(saved.get(key));
assert.equal(state[0].length,1,'Malformed storage not recovered');
saved.set(key,'null');
submit(true);
state=JSON.parse(saved.get(key));
assert.equal(state[0].length,1,'Null storage did not recover');
saved.set(key,'[]');
submit(true);
state=JSON.parse(saved.get(key));
assert.equal(state[0].length,1,'Array storage did not recover');
saved.set(key,JSON.stringify({'0':[null,{score:99,total:10,date:'bad'}, {score:2,total:10,date:'2026-01-01'}]}));
submit(true);
state=JSON.parse(saved.get(key));
assert.equal(state[0].length,2,'Invalid attempts not filtered');
assert.equal(state[0][0].score,2,'Valid attempt lost');
for(let i=0;i<35;i++)submit(true);
state=JSON.parse(saved.get(key));
assert.equal(state[0].length,30,'Attempt history not bounded');
assert.ok(state[0].every(a=>typeof a.date==='string'&&a.total===chapter.quiz.length),'Malformed saved attempt');
console.log('PASS: textbook rendering, quiz scoring, retry history, corrupted storage recovery, 30-attempt limit');

ctx.esc=value=>String(value);
ctx.save=()=>localStorage.setItem('main-progress-fixture',JSON.stringify(ctx.progress));
for(const name of ['geometry-year-data.js','geometry-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const year=ctx.window.KlassikiGeometryYear;
assert.equal(year.length,4);
const titles=new Set();
year.forEach((lessons,term)=>{
 assert.equal(lessons.length,17);
 ctx.window.geometryYearTerm(term);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(17*term+1)+'">'));
 lessons.forEach(([title,rule,task,solution,chapterId],i)=>{
  assert.ok(!titles.has(title),'Repeated title: '+title);
  titles.add(title);
  assert.ok([title,rule,task,solution].every(s=>typeof s==='string'&&s.trim().length>0));
  assert.ok(chapterId===undefined||(Number.isInteger(chapterId)&&chapterId>=0&&chapterId<=15));
  ctx.window.geometryYearOpen(17*term+i);
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<details class="question"><summary>Открыть разбор<\/summary>/);
 });
});
assert.doesNotMatch(app.innerHTML,/Следующее занятие/);
ctx.window.geometryYearToggle();
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.geometryYearTerm(3);
assert.match(app.innerHTML,/Выполнено 1 из 17/);
assert.match(app.innerHTML,/Продолжить занятие 68/);
ctx.window.geometryYearOpen(0);
assert.match(app.innerHTML,/geometryYearChapter\(0\)/);
assert.match(app.innerHTML,/geometryYearOpen\(1\)/);
console.log('PASS: four quarters with 68 unique activities, worked solutions, resume, completion and textbook link');

ctx.window.geometryYearOpen(6);
assert.match(app.innerHTML,/180° − 65° = 115°/);
ctx.window.geometryYearOpen(34);
assert.match(app.innerHTML,/<details class="question"><summary>Подробнее о правиле<\/summary>/);
assert.ok(app.innerHTML.indexOf('Задание')<app.innerHTML.indexOf('Подробнее о правиле'));
assert.match(app.innerHTML,/<p>Прямые параллельны, если накрест лежащие/);
ctx.window.geometryYearStart();
assert.match(app.innerHTML,/<ol start="35">/);
assert.match(app.innerHTML,/Продолжить занятие 35/);
