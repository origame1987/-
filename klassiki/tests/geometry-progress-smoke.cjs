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
 if(!nodes.has(id))nodes.set(id,{innerHTML:'',focus(){}});return nodes.get(id)}
};
const localStorage={
 getItem(k){return saved.has(k)?saved.get(k):null},
 setItem(k,v){saved.set(k,String(v))}
};
class FormDataStub{constructor(form){this.form=form}get(k){return this.form.answers[k]}}
const ctx={window:{scrollTo(){}},document,localStorage,FormData:FormDataStub,
 structuredClone,Map,app,page:'home',render(){},navHtml(){},geometryQuarterHome(){},
 console,progress:{},subject:0,quarter:1,save(){},go(page){ctx.page=page;ctx.render()}};
ctx.esc=value=>String(value);
vm.createContext(ctx);
for(const name of ['lesson-readings.js','year-lesson-explanations.js','geometry-textbook-registry.js','geometry-textbook-lesson00.js','geometry-foundations-guide.js','geometry-textbook-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const chapter=ctx.window.KlassikiTextbook.get(0);
assert.ok(chapter&&chapter.quiz.length>=8,'Fixture chapter absent');
function assertLessonLink(){
 assert.match(app.innerHTML,/href="https:\/\//, 'Lesson should link to further explanations');
}

ctx.window.geometryTextbookOpen(0);
assertLessonLink();
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

ctx.save=()=>localStorage.setItem('main-progress-fixture',JSON.stringify(ctx.progress));
for(const name of ['geometry-year-data.js','geometry-year-videos.js','geometry-quarter1-explanations.js','geometry-quarter2-explanations.js','geometry-quarter3-explanations.js','geometry-quarter4-explanations.js','geometry-year-view.js']){
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
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<details class="question"><summary>Открыть разбор<\/summary>/);
  assert.match(app.innerHTML,/Цель урока.*Как это работает.*Разобранный пример.*Самостоятельная практика/);
  assert.equal((app.innerHTML.match(/<summary>Проверить решение<\/summary>/g)||[]).length,2);
  assert.match(app.innerHTML,/<details class="question"><summary>Разбор по шагам<\/summary><ol><li>.+?<\/li><li>.+?<\/li><\/ol>/);
  if((term===0&&[1,6,7,16].includes(i))||(term===1&&([0,5].includes(i)||i>=14))||(term===2&&[0,1,8,9,11,12,15].includes(i))||(term===3&&[0,1,4,5].includes(i)))assert.match(app.innerHTML,/<svg[^>]+role="img" aria-label="[^"]+"/);
  if((term===0&&i===11)||(term===1&&i===12)||(term===2&&i===6)||(term===3&&[7,15].includes(i)))assert.ok(app.innerHTML.indexOf('<h3>Задание</h3>')<app.innerHTML.indexOf('<h3>Разобранный пример</h3>'));
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
assert.match(app.innerHTML,/2x \+ 3x = 180/);
ctx.window.geometryYearOpen(34);
assert.match(app.innerHTML,/<details class="question"><summary>Почему это верно<\/summary>/);
assert.ok(app.innerHTML.indexOf('Задание')<app.innerHTML.indexOf('Почему это верно'));
assert.match(app.innerHTML,/84 \+ 3x \+ 6 = 180/);
ctx.window.geometryYearStart();
assert.match(app.innerHTML,/<ol start="35">/);
assert.match(app.innerHTML,/Продолжить занятие 35/);

const videos=ctx.window.KlassikiGeometryVideos;
const noVideo=new Set([12,30,41,59,67]);
assert.equal(Object.keys(videos).length,68-noVideo.size);
for(let number=1;number<=68;number++){
 ctx.window.geometryYearOpen(number-1);
 const video=videos[number];
 if(noVideo.has(number)){
  assert.equal(video,undefined);
  assert.ok(!app.innerHTML.includes('youtube.com/watch'));
  continue;
 }
 const [id,seconds]=video;
 assert.match(id,/^[A-Za-z0-9_-]{11}$/);
 assert.ok(seconds===undefined||(Number.isInteger(seconds)&&seconds>0));
 const url='https://www.youtube.com/watch?v='+id+(seconds?'&amp;t='+seconds+'s':'');
 assert.ok(app.innerHTML.includes('href="'+url+'" target="_blank" rel="noopener noreferrer"'));
}
console.log('PASS: 63 lesson video links and five independent tests');

for(const name of ['algebra-year-data.js','year-course-view.js','algebra-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const algebra=ctx.window.KlassikiAlgebraYear;
const algebraTitles=new Set();
assert.equal(algebra.length,4);
algebra.forEach((quarter,term)=>{
 assert.equal(quarter.length,17);
 ctx.window.algebraYearTerm(term);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(term*17+1)+'">'));
 quarter.forEach(([title,rule,task,solution,chapter],i)=>{
  assert.ok(!algebraTitles.has(title));
  algebraTitles.add(title);
  assert.ok([title,rule,task,solution].every(s=>typeof s==='string'&&s.trim()));
  const id=17*term+i;
  ctx.window.algebraYearOpen(id);
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<summary>Открыть разбор<\/summary>/);
  if(chapter!==undefined)assert.ok(app.innerHTML.includes('lesson(0,'+chapter+')'));
  const video=ctx.window.KlassikiAlgebraVideos[id+1];
  if(video)assert.ok(app.innerHTML.includes('https://www.youtube.com/watch?v='+video));
 });
});
assert.doesNotMatch(app.innerHTML,/Следующее занятие/);
ctx.window.algebraYearToggle({setAttribute(){}});
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.algebraYearStart();
assert.match(app.innerHTML,/Выполнено 1 из 17/);
assert.match(app.innerHTML,/Продолжить занятие 68/);
assert.equal(ctx.window.algebraYearSummary().done,1);
assert.equal(ctx.window.algebraYearSummary().total,68);
assert.equal(ctx.progress['geometry-year-current'],67);
assert.equal(ctx.progress['geometry-year-done-67'],true);
console.log('PASS: 68 algebra activities, four quarters, video and chapter links, and separate resume and completion');

for(const name of ['russian-year-data.js','russian-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const russian=ctx.window.KlassikiRussianYear;
assert.equal(russian.length,4);
const russianTitles=new Set();
for(const [term,lessons] of russian.entries()){
 assert.equal(lessons.length,12);
 ctx.window.russianYearTerm(term);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(term*12+1)+'">'));
 for(const [offset,[title,rule,task,solution,chapter]] of lessons.entries()){
  assert.ok(title&&rule&&task&&solution);
  assert.ok(!russianTitles.has(title));
  russianTitles.add(title);
  const id=term*12+offset;
  ctx.window.russianYearOpen(id);
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<summary>Открыть разбор<\/summary>/);
  if(chapter!==undefined)assert.ok(app.innerHTML.includes('lesson(2,'+chapter+')'));
  const video=ctx.window.KlassikiRussianVideos[id+1];
  if(video)assert.ok(app.innerHTML.includes('https://www.youtube.com/watch?v='+video));
 }
}
assert.doesNotMatch(app.innerHTML,/Следующее занятие/);
ctx.window.russianYearToggle({setAttribute(){}});
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.russianYearStart();
assert.match(app.innerHTML,/Выполнено 1 из 12/);
assert.match(app.innerHTML,/Продолжить занятие 48/);
assert.equal(ctx.window.russianYearSummary().done,1);
assert.equal(ctx.window.algebraYearSummary().done,1);
console.log('PASS: Russian course, all 48 lessons, four quarters and independent progress');

for(const name of ['literature-year-data.js','literature-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const literature=ctx.window.KlassikiLiteratureYear;
const literatureTitles=new Set();
assert.equal(literature.length,4);
for(const [term,lessons] of literature.entries()){
 assert.equal(lessons.length,12);
 ctx.window.literatureYearTerm(term);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(term*12+1)+'">'));
 for(const [offset,[title,assignment,question,answer]] of lessons.entries()){
  assert.ok([title,assignment,question,answer].every(text=>typeof text==='string'&&text.trim()));
  assert.ok(!literatureTitles.has(title));
  literatureTitles.add(title);
  const id=term*12+offset;
  ctx.window.literatureYearOpen(id);
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<summary>Открыть разбор<\/summary>/);
  for(const [label,url] of ctx.window.KlassikiLiteratureReadings[id+1]??[]){
   assert.ok(label.trim());
   assert.ok(['ru.wikisource.org','www.culture.ru','ilibrary.ru','www.ilibrary.ru','rusneb.ru'].includes(new URL(url).hostname));
   assert.ok(app.innerHTML.includes('href="'+url+'" target="_blank" rel="noopener noreferrer"'));
  }
 }
}
ctx.window.literatureYearToggle({setAttribute(){}});
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.literatureYearStart();
assert.match(app.innerHTML,/Выполнено 1 из 12/);
assert.match(app.innerHTML,/Продолжить занятие 48/);
assert.equal(ctx.window.literatureYearSummary().done,1);
assert.equal(ctx.window.russianYearSummary().done,1);
console.log('PASS: literature course, all 48 lessons, reading links and independent progress');

for(const name of ['physics-year-data.js','physics-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const physics=ctx.window.KlassikiPhysicsYear;
const physicsTitles=new Set();
assert.equal(physics.length,4);
for(const [term,lessons] of physics.entries()){
 assert.equal(lessons.length,12);
 ctx.window.physicsYearTerm(term);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(term*12+1)+'">'));
 for(const [offset,[title,rule,task,solution,chapter]] of lessons.entries()){
  assert.ok([title,rule,task,solution].every(text=>typeof text==='string'&&text.trim()));
  assert.ok(!physicsTitles.has(title));
  physicsTitles.add(title);
  const id=term*12+offset;
  ctx.window.physicsYearOpen(id);
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<summary>Открыть разбор<\/summary>/);
  if(chapter!==undefined)assert.ok(app.innerHTML.includes('lesson(8,'+chapter+')'));
  const video=ctx.window.KlassikiPhysicsVideos[id+1];
  if(video)assert.ok(app.innerHTML.includes('https://www.youtube.com/watch?v='+video));
 }
}
assert.doesNotMatch(app.innerHTML,/Следующее занятие/);
ctx.window.physicsYearToggle({setAttribute(){}});
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.physicsYearStart();
assert.match(app.innerHTML,/Выполнено 1 из 12/);
assert.match(app.innerHTML,/Продолжить занятие 48/);
assert.equal(ctx.window.physicsYearSummary().done,1);
assert.equal(ctx.window.literatureYearSummary().done,1);
console.log('PASS: physics course, all 48 lessons, videos, chapter links and independent progress');

for(const name of ['biology-year-data.js','biology-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const biology=ctx.window.KlassikiBiologyYear;
const biologyTitles=new Set();
assert.equal(biology.length,4);
for(const [term,lessons] of biology.entries()){
 assert.equal(lessons.length,8);
 ctx.window.biologyYearTerm(term);
 assert.match(app.innerHTML,/32 занятия<\/h2>/);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(term*8+1)+'">'));
 for(const [offset,[title,rule,task,solution]] of lessons.entries()){
  assert.ok([title,rule,task,solution].every(value=>typeof value==='string'&&value.trim()));
  assert.ok(!biologyTitles.has(title));
  biologyTitles.add(title);
  const id=term*8+offset;
  ctx.window.biologyYearOpen(id);
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<summary>Открыть разбор<\/summary>/);
  for(const [label,link] of ctx.window.KlassikiBiologyReadings[id+1]||[]){
   const url=new URL(link);
   assert.equal(url.origin,'https://www.youtube.com');
   assert.match(url.searchParams.get('v'),/^[A-Za-z0-9_-]{11}$/);
   assert.match(url.searchParams.get('t'),/^\d+s$/);
   assert.ok(app.innerHTML.includes(label));
  }
 }
}
assert.doesNotMatch(app.innerHTML,/Следующее занятие/);
ctx.window.biologyYearToggle({setAttribute(){}});
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.biologyYearStart();
assert.match(app.innerHTML,/Выполнено 1 из 8/);
assert.match(app.innerHTML,/Продолжить занятие 32/);
assert.equal(ctx.window.biologyYearSummary().done,1);
assert.equal(ctx.window.physicsYearSummary().done,1);
console.log('PASS: biology course, all 32 lessons, video links and independent progress');

for(const name of ['geography-year-data.js','geography-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const geography=ctx.window.KlassikiGeographyYear;
const geographyTitles=new Set();
assert.equal(geography.length,4);
for(const [term,lessons] of geography.entries()){
 assert.equal(lessons.length,12);
 ctx.window.geographyYearTerm(term);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(term*12+1)+'">'));
 for(const [offset,[title,rule,task,solution]] of lessons.entries()){
  assert.ok([title,rule,task,solution].every(value=>typeof value==='string'&&value.trim()));
  assert.ok(!geographyTitles.has(title));
  geographyTitles.add(title);
  const id=term*12+offset;
  ctx.window.geographyYearOpen(id);
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<summary>Открыть разбор<\/summary>/);
  const video=ctx.window.KlassikiGeographyVideos[id+1];
  if(video){
   assert.match(video,/^[A-Za-z0-9_-]{11}$/);
   assert.ok(app.innerHTML.includes('https://www.youtube.com/watch?v='+video));
  }
  const figure=ctx.window.KlassikiGeographyFigures[id+1];
  if(figure){
   const [file,alt,caption]=figure;
   const svg=fs.readFileSync(path.join(base,file),'utf8');
   assert.match(svg,/<svg[^>]+viewBox=/);
   assert.ok(app.innerHTML.includes('src="./'+file+'"'));
   assert.ok(app.innerHTML.includes('href="./'+file+'"'));
   assert.ok(app.innerHTML.includes(alt));
   assert.ok(app.innerHTML.includes(caption));
  }else assert.doesNotMatch(app.innerHTML,/<figure/);
 }
}
assert.doesNotMatch(app.innerHTML,/Следующее занятие/);
ctx.window.geographyYearToggle({setAttribute(){}});
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.geographyYearStart();
assert.match(app.innerHTML,/Выполнено 1 из 12/);
assert.match(app.innerHTML,/Продолжить занятие 48/);
assert.equal(ctx.window.geographyYearSummary().done,1);
assert.equal(ctx.window.biologyYearSummary().done,1);
console.log('PASS: geography course, all 48 lessons, map and graph, videos and independent progress');

for(const name of ['english-year-data.js','english-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const english=ctx.window.KlassikiEnglishYear;
const englishTitles=new Set();
const audioFiles=new Set();
assert.equal(english.length,4);
for(const [term,lessons] of english.entries()){
 assert.equal(lessons.length,12);
 ctx.window.englishYearTerm(term);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(term*12+1)+'">'));
 let listeningCount=0;
 for(const [offset,[title,rule,task,solution]] of lessons.entries()){
  assert.ok([title,rule,task,solution].every(value=>typeof value==='string'&&value.trim()));
  assert.ok(!englishTitles.has(title));
  englishTitles.add(title);
  const id=term*12+offset;
  ctx.window.englishYearOpen(id);
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<summary>Открыть разбор<\/summary>/);
  const recording=ctx.window.KlassikiEnglishListening[id+1];
  if(recording){
   listeningCount++;
   const [file,transcript]=recording;
   assert.ok(!audioFiles.has(file));
   audioFiles.add(file);
   assert.ok(fs.statSync(path.join(base,file)).size>1000);
   assert.match(app.innerHTML,/<audio controls preload="none"/);
   assert.ok(app.innerHTML.includes('src="./'+file+'"'));
   assert.ok(app.innerHTML.includes('lang="en">'+transcript));
   assert.match(app.innerHTML,/<summary>Показать текст записи<\/summary>/);
  }else assert.doesNotMatch(app.innerHTML,/<audio/);
 }
 assert.equal(listeningCount,2);
}
assert.doesNotMatch(app.innerHTML,/Следующее занятие/);
ctx.window.englishYearToggle({setAttribute(){}});
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.englishYearStart();
assert.match(app.innerHTML,/Выполнено 1 из 12/);
assert.match(app.innerHTML,/Продолжить занятие 48/);
assert.equal(ctx.window.englishYearSummary().done,1);
assert.equal(ctx.window.geographyYearSummary().done,1);
console.log('PASS: English course, 48 lessons, eight recordings and independent progress');

for(const name of ['informatics-year-data.js','informatics-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const informatics=ctx.window.KlassikiInformaticsYear;
const informaticsTitles=new Set();
assert.equal(informatics.length,4);
for(const [term,lessons] of informatics.entries()){
 assert.equal(lessons.length,8);
 ctx.window.informaticsYearTerm(term);
 assert.match(app.innerHTML,new RegExp('<ol start="'+(term*8+1)+'">'));
 for(const [offset,[title,rule,task,solution]] of lessons.entries()){
  assert.ok([title,rule,task,solution].every(value=>typeof value==='string'&&value.trim()));
  assert.ok(!informaticsTitles.has(title));
  informaticsTitles.add(title);
  const id=term*8+offset;
  ctx.window.informaticsYearOpen(id);
  assertLessonLink();
  assert.ok(app.innerHTML.includes(title));
  assert.match(app.innerHTML,/<summary>Открыть разбор<\/summary>/);
  const video=ctx.window.KlassikiInformaticsVideos[id+1];
  if(video)assert.ok(app.innerHTML.includes('https://www.youtube.com/watch?v='+video));
  const questions=ctx.window.KlassikiInformaticsChecks[id+1];
  if(offset!==7){
   assert.equal(questions,undefined);
   assert.doesNotMatch(app.innerHTML,/Проверить ответы/);
   continue;
  }
  assert.equal(questions.length,4);
  const answers=Object.fromEntries(questions.map(([prompt,options,correct,why],i)=>{
   assert.ok(prompt.trim()&&why.trim());
   assert.equal(new Set(options).size,3);
   assert.ok(Number.isInteger(correct)&&options[correct]);
   assert.ok(app.innerHTML.includes(prompt));
   return ['q'+i,String(correct)];
  }));
  const wrong=Object.fromEntries(Object.entries(answers).map(([key,value])=>[key,String((Number(value)+1)%3)]));
  const event={preventDefault(){}};
  const stateKey='informatics-year-check-'+id;
  assert.equal(ctx.window.informaticsYearCheck(event,{answers:{...answers,q0:null}}),false);
  assert.equal(ctx.progress[stateKey],undefined);
  ctx.window.informaticsYearCheck(event,{answers});
  assert.match(nodes.get('informatics-year-check-result').innerHTML,/Результат: 4 из 4/);
  ctx.window.informaticsYearCheck(event,{answers:wrong});
  assert.match(nodes.get('informatics-year-check-result').innerHTML,/Результат: 0 из 4/);
  assert.match(nodes.get('informatics-year-check-result').innerHTML,/Верный ответ:/);
  assert.equal(ctx.progress[stateKey].attempts,2);
  assert.equal(ctx.progress[stateKey].best,4);
 }
}
assert.doesNotMatch(app.innerHTML,/Следующее занятие/);
ctx.window.informaticsYearToggle({setAttribute(){}});
ctx.progress=JSON.parse(localStorage.getItem('main-progress-fixture'));
ctx.window.informaticsYearStart();
assert.match(app.innerHTML,/Выполнено 1 из 8/);
assert.match(app.innerHTML,/Продолжить занятие 32/);
ctx.window.informaticsYearOpen(31);
assert.match(app.innerHTML,/Попыток: 2. Лучший результат: 4 из 4./);
assert.equal(ctx.window.informaticsYearSummary().done,1);
assert.equal(ctx.window.englishYearSummary().done,1);
console.log('PASS: informatics course, 32 lessons, four auto-graded quizzes, retries and independent progress');

ctx.SUBJECTS={4:['История России',[]],5:['Всеобщая история',[]]};
for(const name of ['history-year-data.js','history-year-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
for(const subject of [4,5]){
 ctx.window.historyYearStart(subject);
 const lessons=ctx.window.KlassikiHistoryYear[subject].quarters.flat();
 assert.equal(lessons.length,34);
 for(const [id,[title]] of lessons.entries()){
  ctx.window.historyYearOpen(id);
  assert.ok(app.innerHTML.includes(title));
  assertLessonLink();
 }
}
const romanovs=ctx.window.klassikiLessonReadings(4,'Михаил Фёдорович',23);
for(const [subjectId,namespace] of ['algebra',null,'russian','literature','history','history','biology','geography','physics','english','informatics'].entries()){
 if(!namespace)continue;
 if(namespace==='history')ctx.window.historyYearStart(subjectId);
 for(const number of [1,2,3,4]){
  ctx.window[namespace+'YearOpen'](number-1);
  const [goal,theory,[prompt,...steps],exercises]=ctx.window.KlassikiYearExplanations[subjectId][number];
  for(const text of [goal,theory,prompt,...steps,...exercises.flat()])assert.ok(app.innerHTML.includes(text),namespace+': '+text);
  assert.equal((app.innerHTML.match(/<summary>Проверить решение<\/summary>/g)||[]).length,2);
 }
 ctx.window[namespace+'YearOpen'](4);
 assert.doesNotMatch(app.innerHTML,/Разбор по шагам/);
}
console.log('PASS: expanded lessons render for all eleven subjects');
assert.match(romanovs,/interneturok\.ru/);
const fallback=ctx.window.klassikiLessonReadings(1,'Контрольная работа № 2',30);
const fallbackQuery=new URL(fallback.match(/href="([^"]+)"/)[1]).searchParams.get('search_query');
assert.match(fallbackQuery,/три признака равенства треугольников/);
assert.match(fallback,/Найти видеообъяснение/);
assert.equal(ctx.window.klassikiLessonReadings(1,'Урок с видео',undefined,{hasSource:true}),'');
console.log('PASS: links on all 508 annual lessons and on the detailed geometry chapter');

const planIndex=fs.readFileSync(path.join(base,'index.html'),'utf8');
assert.ok(planIndex.indexOf('informatics-year-view.js')<planIndex.indexOf('study-plan.js'));
vm.runInContext(planIndex.slice(planIndex.indexOf('const SUBJECTS='),planIndex.indexOf('const KEY=')),ctx);
vm.runInContext(planIndex.slice(planIndex.indexOf('function validatedProgress'),planIndex.indexOf('async function importData')),ctx);
ctx.progress={};
let planClock='2026-11-22T21:05:00Z';
ctx.Date=class extends Date{constructor(...args){super(...(args.length?args:[planClock]));}};
ctx.window.location={hash:'#plan'};
ctx.window.addEventListener=()=>{};
new vm.Script(fs.readFileSync(path.join(base,'study-plan.js'),'utf8'),{filename:'study-plan.js'}).runInContext(ctx);
assert.equal(ctx.page,'studyPlan');
assert.match(app.innerHTML,/Сегодня · понедельник, 23 ноября 2026/);
assert.match(app.innerHTML,/value="2026-11-23"/);

const planIds=()=>Array.from(app.innerHTML.matchAll(/studyPlanOpen\('(study-plan-task-\d+-\d+)'\)/g),m=>m[1]);
const calendar=new Set();
const nextBySubject=new Map();
let teachingDays=0;
let worldHistoryCompleted=false;
for(const day=new Date('2026-11-23T00:00:00Z');day<=new Date('2027-05-31T00:00:00Z');day.setUTCDate(day.getUTCDate()+1)){
 const iso=day.toISOString().slice(0,10);
 ctx.window.studyPlanSelect(iso);
 assert.ok(app.innerHTML.includes('value="'+iso+'"'));
 const ids=planIds();
 const rests=[0,6].includes(day.getUTCDay())||(iso>='2026-12-28'&&iso<='2027-01-10');
 if(rests){assert.equal(ids.length,0,iso);continue}
 teachingDays++;
 assert.ok(ids.length===4||ids.length===5,iso+': '+ids.length);
 assert.equal(new Set(ids.map(id=>id.split('-')[3])).size,ids.length,'Repeated subject that day '+iso);
 for(const id of ids){
  assert.ok(!calendar.has(id),id+' scheduled twice');
  calendar.add(id);
  const [subjectId,index]=id.split('-').slice(3).map(Number);
  assert.equal(index,nextBySubject.get(subjectId)||0,id+' is out of course order');
  nextBySubject.set(subjectId,index+1);
  if(subjectId===5&&index===33)worldHistoryCompleted=true;
  if(subjectId===4)assert.ok(worldHistoryCompleted,'Russian history must follow world history');
 }
}
assert.equal(teachingDays,126);
assert.equal(calendar.size,508);
assert.equal(nextBySubject.size,11);
ctx.window.studyPlanSelect('2027-02-30');
assert.match(app.innerHTML,/value="2027-05-31"/);
ctx.window.studyPlanToday();
assert.match(app.innerHTML,/value="2026-11-23"/);
assert.ok(planIds().includes('study-plan-task-0-0'));
const lessonMark={checked:true},taskMark={checked:true};
ctx.window.studyPlanToggle(lessonMark,'study-plan-task-0-0',false);
assert.equal(ctx.window.algebraYearSummary().done,1);
assert.match(nodes.get('study-plan-day').textContent,/Готово 0 из 4/);
ctx.window.studyPlanToggle(taskMark,'study-plan-task-0-0',true);
assert.match(nodes.get('study-plan-day').textContent,/Готово 1 из 4/);
ctx.progress=ctx.validatedProgress(JSON.parse(saved.get('main-progress-fixture')));
assert.equal(ctx.progress['study-plan-task-0-0'],true);
assert.equal(ctx.progress['algebra-year-done-0'],true);
assert.equal(ctx.validatedProgress({'study-plan-task-0-68':true})['study-plan-task-0-68'],undefined);
ctx.window.studyPlanOpen('study-plan-task-0-0');
assert.equal(ctx.page,'algebraYearLesson');
assert.match(app.innerHTML,/Рациональные числа/);
ctx.go('studyPlan');
assert.equal((app.innerHTML.match(/ checked>/g)||[]).length,2);
ctx.window.studyPlanOpen('study-plan-task-4-0');
assert.equal(ctx.subject,4);
assert.equal(ctx.page,'historyYearLesson');
assert.match(app.innerHTML,/Россия в начале XVI века/);
ctx.window.studyPlanToday();
planClock='2026-11-25T21:05:00Z';
ctx.window.studyPlanToday();
assert.match(app.innerHTML,/value="2026-11-26"/);
assert.match(app.innerHTML,/К первому незавершённому дню/);
const originalSave=ctx.save;
ctx.save=()=>{throw Error('Quota exceeded');};
const failed={checked:false};
ctx.window.studyPlanToggle(failed,'study-plan-task-0-0',true);
assert.equal(failed.checked,true);
assert.equal(ctx.progress['study-plan-task-0-0'],true);
assert.match(nodes.get('study-plan-status').textContent,/Браузер не сохранил/);
ctx.save=originalSave;
console.log('PASS: 508 calendar entries, 126 school days, Moscow dates, lesson routing, progress restore and failed-save rollback');
