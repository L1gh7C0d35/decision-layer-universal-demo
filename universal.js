"use strict";
/* One universal screen. Four fictional datasets. None are a verified source, real
   user record, AI confidence estimate, live provider price or persisted decision.
   All editable ratings are mock owner assessments on a 0..100 scale. */
const CASES={
 travel:{category:"Travel",question:"Bali or Phuket?",small:"Where should I spend my next getaway?",accent:"coastal",options:[
  {id:"a",name:"Bali",sub:"Island of contrasts",image:"assets/cliffs-bali.jpg",symbol:"◈",source:"Illustrative photo"},
  {id:"b",name:"Phuket",sub:"Coast and discovery",image:"assets/beach-tropical.jpg",symbol:"✧",source:"Illustrative photo"}
 ],criteria:[
  {id:"nature",name:"Experience & nature",weight:8,ratings:{a:91,b:88}},
  {id:"budget",name:"Personal value",weight:7,ratings:{a:82,b:77}},
  {id:"ease",name:"Ease of travel",weight:6,ratings:{a:89,b:73}}
 ]},
 pizza:{category:"Food",question:"Margherita or pepperoni?",small:"Which one sounds better tonight?",accent:"terracotta",options:[
  {id:"a",name:"Margherita",sub:"Simple & fresh",image:"assets/pizza-margherita.jpg",symbol:"✧",source:"Illustrative photo"},
  {id:"b",name:"Pepperoni",sub:"Rich & savory",image:"assets/pizza-pepperoni.jpg",symbol:"◈",source:"Illustrative photo"}
 ],criteria:[
  {id:"taste",name:"Taste",weight:9,ratings:{a:93,b:87}},
  {id:"value",name:"Personal value",weight:7,ratings:{a:85,b:84}},
  {id:"ease",name:"Convenience",weight:5,ratings:{a:83,b:91}}
 ]},
 beaches:{category:"Beaches",question:"Sanur or Kuta Beach?",small:"Where should I spend the afternoon?",accent:"water",options:[
  {id:"a",name:"Sanur",sub:"A calmer shoreline",image:"assets/beach-tropical.jpg",symbol:"◈",source:"Illustrative photo"},
  {id:"b",name:"Kuta",sub:"More energy",image:"assets/beach-sunset.jpg",symbol:"✧",source:"Illustrative photo"}
 ],criteria:[
  {id:"calm",name:"Peace & calm",weight:9,ratings:{a:93,b:55}},
  {id:"ease",name:"Getting there",weight:7,ratings:{a:83,b:81}},
  {id:"activity",name:"Things to do",weight:6,ratings:{a:75,b:92}}
 ]},
 custom:{category:"Custom",question:"Send the message or wait?",small:"A decision with no preset category.",accent:"slate",options:[
  {id:"a",name:"Send it",sub:"Take the next step",image:null,symbol:"↗",source:"No image attached"},
  {id:"b",name:"Wait",sub:"Give it some time",image:null,symbol:"◷",source:"No image attached"}
 ],criteria:[
  {id:"clarity",name:"Clarity",weight:9,ratings:{a:89,b:65}},
  {id:"timing",name:"Right timing",weight:8,ratings:{a:65,b:90}},
  {id:"calm",name:"Peace of mind",weight:7,ratings:{a:78,b:79}}
 ]}
};
const params=new URLSearchParams(location.search);
const fixtures={};
let active=CASES[params.get("case")]?params.get("case"):"travel";
let state;
let toastTimer;
const $=s=>document.querySelector(s);
const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const emptySourceLabel="No verified source attached";
function selectFixture(id){
 if(!CASES[id])return;
 if(state)fixtures[active]=state;
 active=id;
 state=fixtures[id]||structuredClone(CASES[id]);
 const path=new URL(location.href);
 path.searchParams.set("case",id);
 history.replaceState(null,"",path.toString());
 build();
 try{window.parent.postMessage({type:"universal-case",name:id},"*")}catch(e){}
}
function score(o){
 let sum=0,total=0,missing=0;
 state.criteria.forEach(c=>{
  const s=c.ratings[o.id];
  if(s===null||s===undefined){missing++;return}
  sum+=Number(c.weight)*Number(s);
  total+=Number(c.weight);
 });
 return {score:total?sum/total:null,missing};
}
function rank(){
 return state.options.map(o=>({...o,derived:score(o)})).sort((a,b)=>{
  const x=a.derived.score,y=b.derived.score;
  return x==null?(y==null?0:1):y==null?-1:y-x;
 });
}
function renderCards(){
 return state.options.slice(0,2).map((o,i)=>{
  const isImg=!!o.image;
  return '<article class="option-card '+(i===0?'focus':'')+'"><div class="option-photo '+(isImg?'':'no-photo')+'" '+(isImg?'style="background-image:url(\''+o.image+'\')"':'')+'>'+
  (isImg?'':'<span class="symbol">'+escapeHTML(o.symbol)+'</span>')+
  '<span class="letter">'+String.fromCharCode(65+i)+'</span><span class="photo-note">'+(isImg?'ILLUSTRATIVE · NOT EVIDENCE':'NO PHOTO REQUIRED')+'</span></div>'+
  '<div class="option-copy"><div class="name">'+escapeHTML(o.name)+'</div><div class="tag">'+escapeHTML(o.sub)+'</div></div></article>';
 }).join("");
}
function renderCriteria(){
 return state.criteria.map((c,i)=>{
  const a=c.ratings.a,b=c.ratings.b;
  const fmt=v=>v===null||v===undefined?'?':String(v);
  return '<div class="criterion"><div class="crit-top"><span class="crit-name">'+escapeHTML(c.name)+'</span><span class="crit-metadata">Importance <b id="importance-'+i+'">'+c.weight+'</b>/10</span></div>'+
  '<div class="crit-row"><button class="crit-rating '+(a==null?'unknown':'')+'" data-rating="'+i+'" data-for="a" aria-label="Edit '+escapeHTML(c.name)+' rating for option A">'+fmt(a)+'</button>'+
  '<input class="crit-slider" type="range" min="0" max="10" step="1" value="'+c.weight+'" data-weight="'+i+'" aria-label="Importance of '+escapeHTML(c.name)+'">'+
  '<button class="crit-rating b '+(b==null?'unknown':'')+'" data-rating="'+i+'" data-for="b" aria-label="Edit '+escapeHTML(c.name)+' rating for option B">'+fmt(b)+'</button></div>'+
  '<div class="crit-range-labels"><span>A · OWNER RATING / 100</span><span>B · OWNER RATING / 100</span></div></div>';
 }).join("");
}
function chooseText(){
 const list=rank(),best=list[0],next=list[1];
 if(best.derived.score==null)return {title:"Ratings needed to compare",metric:"Unknown",body:"Add your assessments to see a meaningful comparison."};
 if(next?.derived.score==null)return {title:"More ratings needed",metric:"Partial result",body:"A missing option score is unknown, not zero."};
 const gap=best.derived.score-next.derived.score;
 return {title:gap<.01?"Your options are tied":best.name+" leads for now",
 metric:best.derived.score.toFixed(1)+"/100 sample fit",
 body:gap<.01?"The current editable assessments produce the same weighted fit.":"Based on your current example ratings and importance weights. "+(best.derived.missing||next.derived.missing?"Some ratings are still unknown.":"No external facts are verified.")};
}
function header(){
 return '<div class="status"><span>9:41</span><span class="indicators">▮▮▮ ᯤ ▰</span></div>'+
 '<header class="topbar"><div class="brand"><div class="brandmark"><span></span><span></span><span></span></div><div class="brand-name">decision layer.<small>ONE UNIVERSAL DECISION</small></div></div><div class="top-actions"><button class="round-btn" data-action="info" title="About this design">ⓘ</button><button class="round-btn highlight" data-action="new" title="Start a different example">＋</button></div></header>';
}
function tabbar(){return '<nav class="tabbar">'+[['Talk','◌'],['Home','⌂'],['Decisions','◈'],['Vault','▤'],['You','◎']].map(x=>'<button '+(x[0]==='Decisions'?'class="active"':'data-action="nonNav"')+'><span class="icon">'+x[1]+'</span>'+x[0]+'</button>').join("")+'</nav><div class="homebar"></div>'}
function build(){
 const r=chooseText();
 $('#root').innerHTML='<div class="app">'+header()+
 '<main class="scroll"><section class="question"><span class="kicker">YOUR DECISION · SAME SYSTEM</span><h1>'+escapeHTML(state.question)+'</h1><div class="meta"><span class="label">'+escapeHTML(state.category)+'</span><span class="sep"></span>'+escapeHTML(state.small)+'</div></section>'+
 '<section class="option-showcase">'+renderCards()+'<span class="middle-marker">VS</span></section>'+
 '<div class="options-foot"><span>Two owner-defined options</span><button data-action="editOptions">Edit options ↗</button></div>'+
 '<div class="section-title matter-head"><strong>What matters to you?</strong><button data-action="criterion">＋ Add factor</button></div>'+
 '<div class="matter-list" id="criteria">'+renderCriteria()+'<button class="crit-add" data-action="criterion">＋ Add another factor</button></div>'+
 '<section class="insight"><div class="insight-top"><span class="kicker">LIVE COMPARISON · SAMPLE DATA</span><span class="score" id="fit">'+escapeHTML(r.metric)+'</span></div><h2 id="leader">'+escapeHTML(r.title)+'</h2><p id="analysis">'+escapeHTML(r.body)+'</p><div class="insight-footer"><button class="details" data-action="explain">Why? ↗</button><button class="primary" data-action="review">Review & choose →</button></div></section>'+
 '<p class="footnote">'+emptySourceLabel+'. Photo art is illustrative only. These are fictional example owner ratings, not saved data or AI confidence.</p></main>'+
 tabbar()+
 '<div class="modal-cover" id="cover"></div><section class="sheet" id="sheet" aria-modal="true"><div class="handle"></div><div id="sheetContent"></div></section>'+
 '<div class="toast" id="toast" aria-live="polite"></div></div>';
 wire();
}
function updateScore(){
 const r=chooseText();
 $('#fit').textContent=r.metric;
 $('#leader').textContent=r.title;
 $('#analysis').textContent=r.body;
}
function notify(text){const el=$('#toast');el.textContent=text;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2400)}
function modal(content){
 $('#sheetContent').innerHTML=content;
 $('#sheet').classList.add("show");$('#cover').classList.add("show");
 $('#cover').addEventListener("click",closeModal,{once:true});
}
function closeModal(){$('#sheet')?.classList.remove('show');$('#cover')?.classList.remove('show')}
function addCriterion(){
 modal('<span class="kicker">OWNER-CONTROLLED</span><h3>What else matters?</h3><p>The same editable factor works for any kind of decision. It is never restricted to a niche.</p>'+
 '<label for="newName">Factor name</label><input id="newName" placeholder="e.g. Sustainability, Joy, Timing">'+
 '<label for="newWeight">Importance (0–10)</label><input id="newWeight" type="number" min="0" max="10" value="5">'+
 '<button class="button" id="newCriterionSave">Add factor to this example</button><button class="button secondary" id="dismiss">Cancel</button>');
 $('#dismiss').onclick=closeModal;
 $('#newCriterionSave').onclick=()=>{
  const name=$('#newName').value.trim(),weight=Number($('#newWeight').value);
  if(!name){notify("Give your factor a name.");return}
  if(!Number.isFinite(weight)||weight<0||weight>10){notify("Importance must be 0–10.");return}
  state.criteria.push({id:"custom-"+state.criteria.length+"-"+active,name,weight,ratings:{a:null,b:null}});
  closeModal();build();notify("Factor added. Its option ratings are unknown until you enter them.");
 };
}
function editRating(i,optionId){
 const c=state.criteria[i],o=state.options.find(o=>o.id===optionId);
 modal('<span class="kicker">YOUR RATING · NOT AI-GENERATED</span><h3>'+escapeHTML(o.name)+'</h3><p>How do <strong>you</strong> rate this option for <strong>'+escapeHTML(c.name)+'</strong>? Blank means unknown, not zero.</p>'+
 '<label for="ratingInput">Your assessment, 0–100</label><input id="ratingInput" type="number" min="0" max="100" placeholder="Unknown" value="'+(c.ratings[optionId]??'')+'">'+
 '<button class="button" id="saveRating">Use this example rating</button><button class="button secondary" id="clearRating">Mark unknown</button>');
 $('#saveRating').onclick=()=>{
  const val=$('#ratingInput').value.trim();
  if(val===''){c.ratings[optionId]=null}else{
   const n=Number(val);if(!Number.isInteger(n)||n<0||n>100){notify("Enter a whole number from 0 to 100.");return}c.ratings[optionId]=n}
  closeModal();build();
 };
 $('#clearRating').onclick=()=>{c.ratings[optionId]=null;closeModal();build()};
}
function editOptions(){
 modal('<span class="kicker">SAME OPTIONS EDITOR · EVERY NICHE</span><h3>Your two paths.</h3><p>These titles are examples. Edit them however you like; the comparison remains unchanged.</p>'+
 '<label for="optionOne">Option A</label><input id="optionOne" maxlength="45" value="'+escapeHTML(state.options[0].name)+'">'+
 '<label for="optionTwo">Option B</label><input id="optionTwo" maxlength="45" value="'+escapeHTML(state.options[1].name)+'">'+
 '<button class="button" id="saveNames">Update these options</button><button class="button secondary" id="dismiss">Cancel</button>');
 $('#dismiss').onclick=closeModal;
 $('#saveNames').onclick=()=>{
  const a=$('#optionOne').value.trim(),b=$('#optionTwo').value.trim();
  if(!a||!b){notify("Both options need a name.");return}
  state.options[0].name=a;state.options[1].name=b;closeModal();build();
 };
}
function explain(){
 const list=rank();
 modal('<span class="kicker">TRANSPARENT MATH · NO FALSE CERTAINTY</span><h3>How this compares.</h3>'+
 '<p>For each option, the editable ratings are multiplied by their importance and divided by the sum of rated importance. Unknown ratings are excluded, not treated as zero. This is a <strong>mockup calculation</strong>, not the app’s native engine.</p>'+
 list.map(o=>'<div class="score-detail"><span>'+escapeHTML(o.name)+(o.derived.missing?' · '+o.derived.missing+' unknown':'')+'</span><b>'+(o.derived.score==null?'Unknown':o.derived.score.toFixed(1)+'/100')+'</b></div>').join("")+
 '<p><b>Sources:</b> No verified owner-original photo or location/product data is attached to this preview.</p>'+
 '<button class="button" id="dismiss">Return to comparison</button>');
 $('#dismiss').onclick=closeModal;
}
function review(){
 const r=chooseText();
 modal('<span class="kicker">YOU MAKE THE CALL</span><h3>Ready to choose?</h3><p>'+escapeHTML(r.title)+'. This is based on sample inputs only. You can choose either option regardless of the calculated order.</p>'+
 state.options.map(o=>'<button class="button" data-preview-choose="'+o.id+'">Choose '+escapeHTML(o.name)+' (preview)</button>').join("")+
 '<button class="button secondary" id="dismiss">Keep comparing</button><p>Preview choice is not saved to Decision Layer. Nothing is booked, purchased, sent, or completed.</p>');
 $('#dismiss').onclick=closeModal;
 document.querySelectorAll('[data-preview-choose]').forEach(b=>b.addEventListener('click',()=>{
  const option=state.options.find(o=>o.id===b.dataset.previewChoose);
  closeModal();notify("Preview choice: "+option.name+". Real Decision Layer remains unchanged.");
 }));
}
function newQuestion(){
 modal('<span class="kicker">ONE SYSTEM, ENDLESS QUESTIONS</span><h3>Pick a different example.</h3><p>Switching changes the sample question, options and factors. This screen uses the same source file for every niche.</p>'+
 Object.entries(CASES).map(([key,c])=>'<button class="button" data-switch="'+key+'">'+escapeHTML(c.question)+' →</button>').join("")+
 '<button class="button secondary" id="dismiss">Cancel</button>');
 $('#dismiss').onclick=closeModal;
 document.querySelectorAll('[data-switch]').forEach(b=>b.addEventListener('click',()=>selectFixture(b.dataset.switch)));
}
function wire(){
 document.querySelectorAll('[data-weight]').forEach(s=>s.addEventListener('input',()=>{
  const i=Number(s.dataset.weight);
  state.criteria[i].weight=Number(s.value);
  $('#importance-'+i).textContent=s.value;
  updateScore();
 }));
 document.querySelectorAll('[data-rating]').forEach(b=>b.addEventListener('click',()=>editRating(Number(b.dataset.rating),b.dataset.for)));
 document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{
  switch(b.dataset.action){
  case 'editOptions':editOptions();break;
  case 'criterion':addCriterion();break;
  case 'explain':explain();break;
  case 'review':review();break;
  case 'new':newQuestion();break;
  case 'info':modal('<span class="kicker">DESIGN STUDY</span><h3>One reusable system.</h3><p>Travel, food, beaches or a custom question all use this exact same UI, scoring function and controls. The dataset changes—not the product.</p><p>No connection to private saved decisions, Vault originals, purchases or real-world data.</p><button class="button" id="dismiss">Got it</button>');$('#dismiss').onclick=closeModal;break;
  case 'nonNav':notify("This study focuses on the shared Decisions screen.");break;
  }
 }));
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
selectFixture(active);
