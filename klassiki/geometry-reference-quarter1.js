/* Справочник геометрии 7 класса — I четверть. Не меняет существующий прогресс. */
(function(){
'use strict';
const terms=[
["Точка","Основной объект геометрии без размеров; обозначается заглавной латинской буквой."],
["Прямая","Бесконечна в обе стороны. Через любые две различные точки проходит ровно одна прямая."],
["Луч","Часть прямой с началом, бесконечная в одном направлении. Луч AB начинается в A."],
["Отрезок","Часть прямой между двумя точками вместе с концами. Если C между A и B, AB = AC + CB."],
["Середина отрезка","M лежит на AB и AM = MB. Тогда AM = MB = AB/2."],
["Угол","Фигура из двух лучей с общим началом. Измеряется в градусах."],
["Биссектриса угла","Луч из вершины, делящий угол на два равных угла."],
["Смежные углы","Два угла с общей стороной, две другие стороны которых — противоположные лучи. Их сумма 180°."],
["Вертикальные углы","Противолежащие углы при пересечении двух прямых. Они равны."],
["Перпендикулярные прямые","Прямые, образующие при пересечении четыре прямых угла по 90°."],
["Треугольник","Три неколлинеарные точки и три соединяющих их отрезка. Сумма внутренних углов равна 180° (доказательство требует теории параллельных прямых)."],
["Равные треугольники","Треугольники, у которых соответствующие стороны и углы равны."],
["Первый признак равенства (СУС)","Если две стороны и угол между ними одного треугольника равны соответствующим двум сторонам и углу между ними другого, треугольники равны."],
["Второй признак равенства (УСУ)","Если сторона и два прилежащих к ней угла одного треугольника равны соответствующим элементам другого, треугольники равны."],
["Третий признак равенства (ССС)","Если три стороны одного треугольника соответственно равны трём сторонам другого, треугольники равны."],
["Медиана","Отрезок, соединяющий вершину треугольника с серединой противоположной стороны."],
["Биссектриса треугольника","Отрезок биссектрисы угла треугольника от вершины до противоположной стороны."],
["Высота треугольника","Перпендикуляр из вершины к прямой, содержащей противоположную сторону; основание может быть на продолжении стороны."],
["Равнобедренный треугольник","Треугольник с двумя равными сторонами. Углы при основании равны."],
["Равносторонний треугольник","Треугольник с тремя равными сторонами; каждый угол равен 60°."],
["Аксиома","Исходное утверждение, принимаемое без доказательства в данной системе."],
["Теорема","Утверждение, истинность которого установлена доказательством."],
["Доказательство","Логическая цепочка из условия, определений, аксиом и ранее доказанных теорем."]
];
const diagrams=[
'<svg viewBox="0 0 320 105" role="img" aria-label="Точки A, M, B на отрезке; M середина" xmlns="http://www.w3.org/2000/svg"><path d="M30 55H290" stroke="currentColor" stroke-width="2"/><g fill="currentColor"><circle cx="30" cy="55" r="4"/><circle cx="160" cy="55" r="4"/><circle cx="290" cy="55" r="4"/></g><g fill="currentColor" font-size="16"><text x="25" y="40">A</text><text x="155" y="40">M</text><text x="285" y="40">B</text><text x="90" y="80">AM = MB</text></g></svg>',
'<svg viewBox="0 0 320 140" role="img" aria-label="Смежные углы AOC и COB на прямой AB" xmlns="http://www.w3.org/2000/svg"><path d="M25 110H295M160 110L218 18" stroke="currentColor" stroke-width="2" fill="none"/><g fill="currentColor" font-size="16"><text x="12" y="107">A</text><text x="155" y="130">O</text><text x="298" y="107">B</text><text x="224" y="22">C</text><text x="45" y="35">∠AOC + ∠COB = 180°</text></g></svg>',
'<svg viewBox="0 0 320 170" role="img" aria-label="Треугольник ABC и медиана AM к середине BC" xmlns="http://www.w3.org/2000/svg"><path d="M160 18L35 140H285Z M160 18V140" stroke="currentColor" stroke-width="2" fill="none"/><g fill="currentColor" font-size="16"><text x="158" y="14">A</text><text x="20" y="156">B</text><text x="292" y="156">C</text><text x="155" y="158">M</text><text x="115" y="130">|</text><text x="204" y="130">|</text></g></svg>'
];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const previous=render;
window.geometryReferenceOpen=function(){page='geometryReference';render();window.scrollTo(0,0)};
render=function(){if(page!=='geometryReference'){previous();if(page==='geometryQuarter'){const p=document.createElement('section');p.className='panel';p.innerHTML='<h3>Справочник первой четверти</h3><p>23 определения и свойства, три наглядные SVG-схемы.</p><button class="primary" onclick="geometryReferenceOpen()">Открыть справочник</button>';app.append(p)}return}
navHtml();app.innerHTML='<article class="panel"><button onclick="geometryQuarterHome()">← К занятиям</button><h2>Справочник геометрии · 7 класс</h2><p>Определения, свойства и признаки. Для доказательства всегда указывай, какое именно правило применяешь.</p><label for="geometryRefSearch">Поиск по терминам</label><input id="geometryRefSearch" type="search" placeholder="Например, медиана или угол" style="width:100%;padding:12px;margin:8px 0 18px"><div id="geometryRefList">'+terms.map(([term,definition],i)=>'<section class="question" data-ref-entry><h3>'+esc(term)+'</h3><p>'+esc(definition)+'</p></section>').join('')+'</div><h3>Чертежи для повторения</h3>'+diagrams.map(x=>'<figure class="question" style="max-width:440px">'+x+'</figure>').join('')+'<p>Чертежи схематические: размеры и углы не следует измерять по изображению.</p></article>';
document.getElementById('geometryRefSearch').addEventListener('input',e=>{const q=e.target.value.trim().toLocaleLowerCase('ru');document.querySelectorAll('[data-ref-entry]').forEach((el,i)=>{el.hidden=!(terms[i][0]+' '+terms[i][1]).toLocaleLowerCase('ru').includes(q)})});
};
})();
