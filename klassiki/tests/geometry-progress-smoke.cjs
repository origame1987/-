/* Run: node klassiki/tests/geometry-progress-smoke.cjs
   Functional smoke test of the shipped textbook viewer with a minimal DOM stub.
   No dependencies or changes to actual browser storage. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const saved=new Map(),nodes=new Map(),handlers=new Map();
const app={innerHTML:'',prepend(){}};
const document={
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
 console};
vm.createContext(ctx);
for(const name of ['geometry-textbook-registry.js','geometry-textbook-lesson00.js','geometry-textbook-view.js']){
 const source=fs.readFileSync(path.join(base,name),'utf8');
 new vm.Script(source,{filename:name}).runInContext(ctx);
}
const chapter=ctx.window.KlassikiTextbook.get(0);
assert.ok(chapter&&chapter.quiz.length>=8,'Fixture chapter absent');
ctx.window.geometryTextbookOpen(0);
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
saved.set(key,'{invalid json');
submit(true);
state=JSON.parse(saved.get(key));
assert.equal(state[0].length,1,'Malformed storage not recovered');
for(let i=0;i<35;i++)submit(true);
state=JSON.parse(saved.get(key));
assert.equal(state[0].length,30,'Attempt history not bounded');
assert.ok(state[0].every(a=>typeof a.date==='string'&&a.total===chapter.quiz.length),'Malformed saved attempt');
console.log('PASS: textbook rendering, quiz scoring, retry history, corrupted storage recovery, 30-attempt limit');
