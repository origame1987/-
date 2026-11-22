/* Классики: аудит всех 16 глав без изменения данных и прогресса.
   Запуск из корня репозитория: node klassiki/tests/geometry-all-chapters-audit.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const scripts=[...html.matchAll(/<script\s+src="\.\/([^"?]+)(?:\?[^"]*)?"\s*>\s*<\/script>/g)].map(m=>m[1]);
const registry='geometry-textbook-registry.js';
assert.equal(scripts.filter(s=>s===registry).length,1,'Registry must be loaded exactly once');
const ctx={window:{},structuredClone,Map,console};
vm.createContext(ctx);
new vm.Script(fs.readFileSync(path.join(base,registry),'utf8'),{filename:registry}).runInContext(ctx);
const problems=[];
for(let id=0;id<16;id++){
 const name='geometry-textbook-lesson'+String(id).padStart(2,'0')+'.js';
 const count=scripts.filter(s=>s===name).length;
 if(count!==1){problems.push(name+': referenced '+count+' times');continue}
 if(scripts.indexOf(name)<scripts.indexOf(registry))problems.push(name+': loaded before registry');
 try{new vm.Script(fs.readFileSync(path.join(base,name),'utf8'),{filename:name}).runInContext(ctx)}
 catch(e){problems.push(name+': '+e.message)}
}
const book=ctx.window.KlassikiTextbook;
assert.ok(book,'Textbook registry not initialized');
for(let id=0;id<16;id++){
 const ch=book.get(id);
 if(!ch){problems.push('Missing chapter ID '+id);continue}
 if(ch.id!==id)problems.push('Unexpected chapter ID '+id);
 if(ch.sections.length<8)problems.push('Chapter '+id+': fewer than 8 theory sections');
 if(ch.examples.length<5)problems.push('Chapter '+id+': fewer than 5 examples');
 if(ch.exercises.length<20)problems.push('Chapter '+id+': fewer than 20 exercises');
 if(ch.quiz.length<10)problems.push('Chapter '+id+': fewer than 10 quiz questions');
 if(!ch.diagram||!/<svg\b/i.test(ch.diagram))problems.push('Chapter '+id+': missing SVG diagram');
 for(const [i,s] of ch.sections.entries())if(!s.heading||!s.text||s.text.length<100)problems.push('Chapter '+id+' theory '+(i+1)+': too short');
 for(const [i,x] of ch.examples.entries())if(!x.prompt||!x.solution)problems.push('Chapter '+id+' example '+(i+1)+': missing solution');
 for(const [i,x] of ch.exercises.entries())if(!x.prompt||!x.solution)problems.push('Chapter '+id+' exercise '+(i+1)+': missing solution');
 for(const [i,q] of ch.quiz.entries()){
  if(!q.prompt||!q.explanation||!Array.isArray(q.options)||q.options.length<2||!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length)problems.push('Chapter '+id+' quiz '+(i+1)+': malformed');
  if(new Set(q.options.map(x=>String(x).trim().toLowerCase())).size!==q.options.length)problems.push('Chapter '+id+' quiz '+(i+1)+': duplicate choices');
 }
}
const guideFile='geometry-foundations-guide.js';
assert.equal(scripts.filter(s=>s===guideFile).length,1,'Guide must be loaded exactly once');
assert.ok(scripts.indexOf(guideFile)<scripts.indexOf('geometry-textbook-view.js'));
new vm.Script(fs.readFileSync(path.join(base,guideFile),'utf8'),{filename:guideFile}).runInContext(ctx);
const guide=ctx.window.KlassikiGeometryGuide;
assert.equal(guide.length,6);
for(const [id,lesson] of guide.entries()){
 assert.equal(lesson.hints.length,book.get(id)?.exercises.length,'Hint and exercise counts differ for chapter '+id);
 assert.ok(lesson.goals.length>=2);
 assert.ok([lesson.introduction,lesson.recap,lesson.check,...lesson.goals,...lesson.hints]
  .every(value=>typeof value==='string'&&value.trim().length>0),'Empty guidance for chapter '+id);
}
if(problems.length){console.error('FAIL: '+problems.length+' issues\n'+problems.join('\n'));process.exitCode=1}
else console.log('PASS: 16 registered chapters, script order, diagrams, structure, examples, solutions and quiz integrity. This does NOT establish mathematical correctness.');
