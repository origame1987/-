/* Run: node klassiki/geometry-quarter1-audit.cjs
   Read-only regression checks. No packages, network or browser required. */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=__dirname;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ctx={window:{},structuredClone:globalThis.structuredClone};
vm.createContext(ctx);
function load(name){
 const content=fs.readFileSync(path.join(root,name),'utf8');
 new vm.Script(content,{filename:name}).runInContext(ctx,{timeout:1500});
 return content;
}
load('geometry-textbook-registry.js');
const found=new Set();
let sections=0,examples=0,exercises=0,questions=0;
for(let id=0;id<16;id++){
 const file='geometry-textbook-lesson'+String(id).padStart(2,'0')+'.js';
 assert.match(html,new RegExp('<script src="\\./'+file.replace('.','\\.')+'\\?v='));
 assert(!found.has(file),'Duplicate file: '+file);found.add(file);
 load(file);
 const c=ctx.window.KlassikiTextbook.get(id);
 assert(c,'Missing chapter '+id);
 assert.equal(c.id,id);
 assert.equal(typeof c.title,'string');
 assert(c.title.trim().length>=12,'Short title: '+id);
 assert(c.sections.length>=7,'Too few sections: '+id);
 assert(c.examples.length>=5,'Too few examples: '+id);
 assert(c.exercises.length>=20,'Too few exercises: '+id);
 assert(c.quiz.length>=10,'Too few quiz questions: '+id);
 assert.match(c.diagram,/^<svg\b/i,'Missing SVG: '+id);
 assert.match(c.diagram,/<\/svg>\s*$/i,'Unclosed SVG: '+id);
 for(const s of c.sections){assert(s.heading?.trim()&&s.text?.length>=70,'Short section in '+id)}
 for(const e of c.examples){assert(e.prompt?.trim()&&e.solution?.length>=15,'Unsolved example in '+id)}
 for(const e of c.exercises){assert(e.level?.trim()&&e.prompt?.trim()&&e.solution?.trim(),'Unsolved exercise in '+id)}
 for(const q of c.quiz){
  assert(q.prompt?.trim()&&q.explanation?.trim(),'Unexplained quiz in '+id);
  assert(q.options.length>=3&&new Set(q.options).size===q.options.length,'Duplicate answers in '+id);
  assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length,'Wrong answer index in '+id);
 }
 sections+=c.sections.length;examples+=c.examples.length;exercises+=c.exercises.length;questions+=c.quiz.length;
}
assert.equal(ctx.window.KlassikiTextbook.list().length,16,'Duplicate/missing registered IDs');

// Проверяем реальный порядок подключения: реестр должен загружаться до глав,
// а отображение — после всех глав. Повторные script-теги могут перезаписать данные.
const scripts=[...html.matchAll(/<script\\b[^>]*\\bsrc=["']([^"']+)["'][^>]*><\\/script>/gi)]
 .map(m=>m[1].split('?')[0].replace(/^\\.\\//,''));
const registryAt=scripts.indexOf('geometry-textbook-registry.js');
const viewAt=scripts.indexOf('geometry-textbook-view.js');
assert(registryAt>=0&&viewAt>registryAt,'Invalid textbook script order');
for(let id=0;id<16;id++){
 const f='geometry-textbook-lesson'+String(id).padStart(2,'0')+'.js';
 assert.equal(scripts.filter(x=>x===f).length,1,'Chapter script must be included once: '+f);
 const at=scripts.indexOf(f);
 assert(at>registryAt&&at<viewAt,'Chapter loaded outside registry/view boundaries: '+f);
}
// Регрессии на структуру: не допускаем молчаливого принятия некорректного теста.
const validate=ctx.window.KlassikiTextbook.validate;
const valid=ctx.window.KlassikiTextbook.get(0);
const malformed=structuredClone(valid);
malformed.quiz[0].correct=malformed.quiz[0].options.length;
assert.throws(()=>validate(malformed),'Invalid answer index must be rejected');
const malformed2=structuredClone(valid);
malformed2.sections=null;
assert.throws(()=>validate(malformed2),'Invalid sections must be rejected');

for(const f of ['geometry-textbook-view.js','geometry-quarter1-course.js','geometry-quarter1-assessments.js','geometry-triangles-assessment.js','geometry-reference-quarter1.js']){
 assert(html.includes('./'+f+'?v='),'Missing HTML include: '+f);
 new vm.Script(fs.readFileSync(path.join(root,f),'utf8'),{filename:f});
}
assert(fs.readFileSync(path.join(root,'geometry-textbook-view.js'),'utf8').includes("const key='klassiki-textbook-quiz-v1'"),'Existing quiz progress key missing');
assert(fs.readFileSync(path.join(root,'geometry-quarter1-course.js'),'utf8').includes('geometry7-q1-v1'),'Existing lesson progress key missing');
console.log('PASS: 16 chapters; '+sections+' sections; '+examples+' examples; '+exercises+' solved exercises; '+questions+' quizzes; SVG in each; progress keys retained.');
console.log('NOTE: structural checks do not prove mathematical correctness or live GitHub Pages availability.');
