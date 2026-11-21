/* Классики — реестр самостоятельных учебных глав. Данные отделены от интерфейса. */
(function(){
'use strict';
const chapters=new Map();
function validate(ch){
 if(!ch||!Number.isInteger(ch.id)||ch.id<0||ch.id>15||!ch.title||!Array.isArray(ch.sections)||!Array.isArray(ch.examples)||!Array.isArray(ch.exercises)||!Array.isArray(ch.quiz))throw Error('Некорректная структура главы');
 if(ch.quiz.some(q=>!q.prompt||!Array.isArray(q.options)||q.options.length<2||!Number.isInteger(q.correct)||q.correct<0||q.correct>=q.options.length))throw Error('Ошибка теста');
 return ch;
}
window.KlassikiTextbook={
 register(ch){validate(ch);chapters.set(ch.id,structuredClone(ch))},
 get(id){return chapters.get(id)||null},
 list(){return [...chapters.values()].map(({id,title,sections,examples,exercises,quiz})=>({id,title,sections:sections.length,examples:examples.length,exercises:exercises.length,quiz:quiz.length}))},
 validate
};
})();