/* Классики — реестр самостоятельных учебных глав. Данные отделены от интерфейса. */
(function(){
'use strict';
const chapters=new Map();
const nonempty=s=>typeof s==='string'&&s.trim().length>0;
function validate(ch){
 if(!ch||typeof ch!=='object'||!Number.isInteger(ch.id)||ch.id<0||ch.id>15||!nonempty(ch.title))throw Error('Некорректная структура главы');
 for(const field of ['sections','examples','exercises','quiz']){
  if(!Array.isArray(ch[field])||ch[field].length===0)throw Error('Отсутствует раздел '+field);
 }
 if(!nonempty(ch.diagram)||!/^<svg\b/i.test(ch.diagram.trim())||!/<\/svg>\s*$/i.test(ch.diagram))throw Error('Отсутствует SVG-чертёж');
 for(const s of ch.sections)if(!s||!nonempty(s.heading)||!nonempty(s.text))throw Error('Некорректная теория');
 for(const e of ch.examples)if(!e||!nonempty(e.prompt)||!nonempty(e.solution))throw Error('Некорректный разобранный пример');
 for(const e of ch.exercises)if(!e||!nonempty(e.level)||!nonempty(e.prompt)||!nonempty(e.solution))throw Error('Упражнение без решения');
 for(const q of ch.quiz){
  if(!q||!nonempty(q.prompt)||!nonempty(q.explanation)||!Array.isArray(q.options)||q.options.length<2||q.options.some(x=>!nonempty(x))||new Set(q.options.map(x=>x.trim())).size!==q.options.length||!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length)throw Error('Ошибка теста');
 }
 return ch;
}
window.KlassikiTextbook={
 register(ch){validate(ch);if(chapters.has(ch.id))throw Error('Повторная регистрация главы '+ch.id);chapters.set(ch.id,structuredClone(ch))},
 get(id){return chapters.get(id)||null},
 list(){return [...chapters.values()].map(({id,title,sections,examples,exercises,quiz})=>({id,title,sections:sections.length,examples:examples.length,exercises:exercises.length,quiz:quiz.length}))},
 validate
};
})();