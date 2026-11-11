"use strict";
const cases=[
{id:"travel",title:"Travel without a separate travel UI.",detail:"Bali and Phuket use the exact same options, criteria editor, photo treatment, transparent comparison, and owner-choice boundary as every other decision."},
{id:"pizza",title:"The same app now decides between pizzas.",detail:"No restaurant-specific UI, prices, menu API, or independent scoring system. Different sample ratings and factors, identical screen and interactions."},
{id:"beaches",title:"Two beaches. Same design. Same rules.",detail:"Calm and accessibility replace Taste or Portability. No live beach conditions or route data are invented. Source images are merely illustrative."},
{id:"custom",title:"No category? It still works.",detail:"A personal question with no photos is just as valid. Symbols act as placeholders; the identical criteria and comparison components remain functional."}
];
const iframe=document.getElementById('device');
let current=0;
function set(id){
 const i=cases.findIndex(x=>x.id===id);if(i<0)return;current=i;
 const c=cases[i];iframe.src='screen.html?case='+id;
 document.getElementById('caseName').textContent=c.title;
 document.getElementById('caseDetail').textContent=c.detail;
 document.getElementById('phoneLink').href='screen.html?case='+id;
 document.getElementById('count').textContent=String(i+1).padStart(2,'0')+' / 04';
 document.querySelectorAll('[data-case]').forEach(x=>x.classList.toggle('selected',x.dataset.case===id));
 history.replaceState(null,'','#'+id);
}
document.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>set(b.dataset.case)));
window.addEventListener('message',event=>{
 if(event.data?.type==='universal-case'&&cases.some(x=>x.id===event.data.name)){
  const id=event.data.name,i=cases.findIndex(x=>x.id===id);current=i;
  document.getElementById('caseName').textContent=cases[i].title;
  document.getElementById('caseDetail').textContent=cases[i].detail;
  document.getElementById('phoneLink').href='screen.html?case='+id;
  document.getElementById('count').textContent=String(i+1).padStart(2,'0')+' / 04';
  document.querySelectorAll('[data-case]').forEach(x=>x.classList.toggle('selected',x.dataset.case===id));
 }
});
set(location.hash.slice(1)||'travel');
