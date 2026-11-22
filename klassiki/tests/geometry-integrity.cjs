/* Run: node klassiki/tests/geometry-integrity.cjs
   No third-party dependencies. Tests actual shipped lesson modules. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const ctx={window:{},structuredClone,Map};
vm.createContext(ctx);
function load(name){const file=path.join(base,name);assert.ok(fs.existsSync(file),'Missing '+name);new vm.Script(fs.readFileSync(file,'utf8'),{filename:file}).runInContext(ctx)}
load('geometry-textbook-registry.js');
const errors=[];
for(let id=0;id<16;id++){
 const name='geometry-textbook-lesson'+String(id).padStart(2,'0')+'.js';
 try{load(name)}catch(e){errors.push(name+': '+e.message)}
}
const chapters=ctx.window.KlassikiTextbook.list();
assert.equal(chapters.length,16,'Expected 16 unique chapters');
for(let id=0;id<16;id++){
 const ch=ctx.window.KlassikiTextbook.get(id);
 if(!ch){errors.push('Missing chapter '+id);continue}
 const check=(condition,msg)=>{if(!condition)errors.push('Chapter '+id+': '+msg)};
 check(ch.sections.length>=8,'fewer than 8 theory sections');
 check(ch.examples.length===5,'expected 5 worked examples');
 check(ch.exercises.length>=16&&ch.exercises.length<=20,'expected 16–20 exercises');
 check(ch.quiz.length>=8&&ch.quiz.length<=10,'expected 8–10 quiz questions');
 check(typeof ch.diagram==='string'&&/<svg\b/.test(ch.diagram)&&/<\/svg>/.test(ch.diagram),'missing SVG diagram');
 for(const [i,s] of ch.sections.entries())check(typeof s.heading==='string'&&s.heading.length>3&&typeof s.text==='string'&&s.text.length>=80,'thin theory section '+i);
 for(const [i,x] of ch.examples.entries())check(typeof x.prompt==='string'&&x.prompt.length>5&&typeof x.solution==='string'&&x.solution.length>15,'incomplete worked example '+i);
 for(const [i,x] of ch.exercises.entries())check(typeof x.prompt==='string'&&x.prompt.length>5&&typeof x.solution==='string'&&x.solution.length>8,'incomplete exercise '+i);
 for(const [i,q] of ch.quiz.entries()){
  check(typeof q.prompt==='string'&&q.prompt.length>5,'invalid question '+i);
  check(Array.isArray(q.options)&&q.options.length>=2&&new Set(q.options).size===q.options.length,'duplicate/invalid options '+i);
  check(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.options.length,'invalid correct index '+i);
  check(typeof q.explanation==='string'&&q.explanation.length>5,'missing explanation '+i);
 }
}
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const src=[...html.matchAll(/<script\s+src="\.\/([^"?]+)(?:\?[^"]*)?"/g)].map(x=>x[1]);
for(let id=0;id<16;id++)assert.equal(src.filter(x=>x==='geometry-textbook-lesson'+String(id).padStart(2,'0')+'.js').length,1,'Lesson script absent or duplicated '+id);
assert.ok(src.indexOf('geometry-textbook-registry.js')<src.indexOf('geometry-textbook-lesson00.js'),'Registry must load first');
assert.ok(src.indexOf('geometry-textbook-view.js')>src.indexOf('geometry-textbook-lesson15.js'),'View must load after lessons');
const view=fs.readFileSync(path.join(base,'geometry-textbook-view.js'),'utf8');
assert.ok(view.includes('klassiki-textbook-quiz-v1'),'Quiz storage key changed unexpectedly');
assert.ok(view.includes('localStorage.setItem(key'),'Quiz persistence call missing');
if(errors.length){console.error('FAILED: '+errors.length+' issue(s)\n'+errors.join('\n'));process.exitCode=1}
else console.log('PASS: 16 chapters, structure, quiz answers, SVG presence, script order and storage-key invariants');
