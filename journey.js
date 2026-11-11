"use strict";
// This is a session-only, illustrative design prototype, not native Decision Layer.
const steps=["Question","Options","Priorities","Sources","Compare","Choose","Follow-through"];
const img={
bali:"https://images.unsplash.com/photo-1672128557444-da9340a253f0?auto=format&fit=crop&w=750&q=80",
sea:"https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=750&q=80",
sun:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=750&q=80",
margherita:"https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=750&q=80",
pepperoni:"https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=750&q=80"
};
const presets={
travel:{category:"Travel",question:"Where should I travel next?",reason:"Find a trip that fits what matters to me.",options:[
{name:"Bali",img:img.bali,note:"Illustrative destination",ratings:{comfort:8,value:8,discovery:9}},
{name:"Phuket",img:img.sea,note:"Illustrative destination",ratings:{comfort:7,value:7,discovery:8}},
{name:"Da Nang",img:img.sun,note:"Another possible destination",ratings:{comfort:8,value:9,discovery:7}},
{name:"Lombok",img:img.sea,note:"Another possible destination",ratings:{comfort:9,value:7,discovery:8}}],
criteria:[{id:"comfort",name:"Comfort",weight:8,required:true},{id:"value",name:"Personal value",weight:6,required:false},{id:"discovery",name:"Discovery",weight:7,required:false}]},
pizza:{category:"Food",question:"What pizza should I order?",reason:"Find something I will actually enjoy.",options:[
{name:"Margherita",img:img.margherita,note:"Example photo",ratings:{taste:9,value:8,ease:7}},
{name:"Pepperoni",img:img.pepperoni,note:"Example photo",ratings:{taste:8,value:7,ease:8}},
{name:"Mushroom",img:img.margherita,note:"Example photo",ratings:{taste:7,value:8,ease:7}}],
criteria:[{id:"taste",name:"Taste",weight:9,required:true},{id:"value",name:"Personal value",weight:6,required:false},{id:"ease",name:"Convenience",weight:7,required:false}]},
beaches:{category:"Beaches",question:"Which beach should I visit?",reason:"Find the kind of day I need.",options:[
{name:"Sanur",img:img.sea,note:"Example photo",ratings:{calm:9,facilities:7,access:8}},
{name:"Kuta",img:img.sun,note:"Example photo",ratings:{calm:5,facilities:9,access:8}},
{name:"Nusa Dua",img:img.sea,note:"Example photo",ratings:{calm:8,facilities:8,access:7}},
{name:"Balangan",img:img.bali,note:"Example photo",ratings:{calm:8,facilities:6,access:6}}],
criteria:[{id:"calm",name:"Calm",weight:9,required:true},{id:"facilities",name:"Facilities",weight:6,required:false},{id:"access",name:"Accessibility",weight:7,required:false}]},
custom:{category:"Custom",question:"Should I send this message or wait?",reason:"Make a thoughtful, deliberate choice.",options:[
{name:"Send now",img:null,note:"Take the next step",ratings:{clarity:8,timing:6}},
{name:"Wait",img:null,note:"Give it time",ratings:{clarity:7,timing:9}}],
criteria:[{id:"clarity",name:"Clarity",weight:8,required:true},{id:"timing",name:"Timing",weight:7,required:false}]}
};
const mem={};let key="travel",s=null,step=0,seq=0,toastTimer;
const $=x=>document.querySelector(x);
const esc=x=>String(x??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function setup(id){
 if(s)mem[key]=s;
 key=presets[id]?id:"travel";
 if(!mem[key]){
  const o=structuredClone(presets[key]);
  o.options=o.options.map(v=>Object.assign(v,{id:"opt"+(++seq),source:"",fileName:"",fileURL:null}));
  o.chosen=null;o.chosenConfirmed=false;o.nextAction="";o.outcome="";o.outcomeConfirmed=false;
  mem[key]=o;
 }
 s=mem[key];step=0;render();history.replaceState(null,"","#"+key);
}
function toast(msg){
 const x=$("#toast");x.textContent=msg;x.classList.add("show");clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>x.classList.remove("show"),2600);
}
function opt(id){return s.options.find(o=>o.id===id)}
function criterion(id){return s.criteria.find(c=>c.id===id)}
function allScores(){
 return s.options.map(o=>{
 let total=0,denom=0,missing=[];
 s.criteria.forEach(c=>{
  if(c.weight===0)return;
  let v=o.ratings[c.id];
  if(v==null||v===""){missing.push(c.name);return}
  total+=c.weight*Number(v);denom+=c.weight;
 });
 return {option:o,score:denom?total/denom:null,complete:!missing.length,missing};
 });
}
function photo(o){
 if(o.fileURL)return '<img src="'+esc(o.fileURL)+'" alt="Local preview">';
 if(o.img)return '<img src="'+esc(o.img)+'" alt="Illustrative image">';
 return '<span class="thumb">◈</span>';
}
function inputOption(o){
 return '<div class="option"><div class="option-head">'+photo(o)+
 '<span style="flex:1"><b>'+esc(o.name||"New option")+'</b><small>'+esc(o.note||"")+'</small></span></div>'+
 '<div class="option-row"><input data-option-name="'+o.id+'" value="'+esc(o.name)+'" placeholder="Option name" aria-label="Option name"><button class="plain" data-remove-option="'+o.id+'">Remove</button></div>'+
 '<div class="option-description"><textarea data-option-note="'+o.id+'" placeholder="Add a useful note">'+esc(o.note||"")+'</textarea></div>'+
 '<div class="mini">Sample image is illustrative. A chosen local photo is not verified evidence.</div></div>';
}
function stageContent(){
 let h=[];
 const open=(num,title,desc)=>{h.push('<span class="eyebrow">'+num+'</span><h2>'+title+'</h2><p>'+desc+'</p>')};
 if(step===0){
  open("01 · START WITH YOUR QUESTION","A question worth<br><em>getting right.</em>","No forced category. The same workflow can handle almost any niche.");
  h.push('<div class="field"><label>Your question</label><textarea id="question" placeholder="What are you deciding?">'+esc(s.question)+'</textarea></div>');
  h.push('<div class="field"><label>Why does this matter? (optional)</label><textarea id="reason">'+esc(s.reason)+'</textarea></div>');
  h.push('<div class="field"><label>Context (optional)</label><input id="category" value="'+esc(s.category)+'"></div>');
  h.push('<div class="surface"><span class="eyebrow">THE REAL PRODUCT</span><p>The question can lead to exploring ideas, comparing multiple options, gathering evidence, choosing, and reflecting.</p></div>');
 }
 if(step===1){
  open("02 · COLLECT POSSIBILITIES","Two, three, five<br><em>or fifty options.</em>","Add, name, annotate, or remove options. No fixed head-to-head limit.");
  h.push(s.options.map(inputOption).join(""));
  h.push('<button id="addOption" class="primary" style="width:100%">＋ Add another option</button>');
 }
 if(step===2){
  open("03 · OWNER-DEFINED FACTORS","Decide what<br><em>matters to you.</em>","Any criterion can be renamed, weighted, required, or removed.");
  s.criteria.forEach(c=>{
   h.push('<div class="factor"><div class="factor-header"><input data-cname="'+c.id+'" value="'+esc(c.name)+'" aria-label="Criterion name"><button class="plain" data-remove-criterion="'+c.id+'">Remove</button></div>');
   h.push('<div class="factor-range"><span class="muted">Importance</span><input type="range" min="0" max="10" data-cweight="'+c.id+'" value="'+c.weight+'" aria-label="Importance of '+esc(c.name)+'"><output id="weight-'+c.id+'">'+c.weight+'</output></div>');
   h.push('<div class="factor-footer"><label><input type="checkbox" style="width:auto" data-crequired="'+c.id+'" '+(c.required?"checked":"")+'> Required for this decision</label><span>0–10</span></div></div>');
  });
  h.push('<div class="addline"><input id="newCriterion" placeholder="A new factor"><button class="primary" id="addCriterion">Add</button></div>');
  h.push('<p>New factors begin unrated, rather than assuming what you think.</p>');
 }
 if(step===3){
  open("04 · SOURCES & KNOWLEDGE","Know what is real.<br><em>Keep the original.</em>","Add research notes and optional local reference files. Nothing here is uploaded or verified.");
  s.options.forEach(o=>{
   h.push('<div class="surface"><b>'+esc(o.name)+'</b><div class="muted">Unverified in this design preview</div>');
   h.push('<label class="field"><span class="muted">Evidence notes, links, uncertainties</span><textarea data-source="'+o.id+'" placeholder="What do I know? What needs checking?">'+esc(o.source||"")+'</textarea></label>');
   h.push('<label class="source-file">Optional local photo<input type="file" accept="image/*" data-file="'+o.id+'"></label>');
   if(o.fileName)h.push('<div class="muted" style="padding-top:8px">Selected locally: '+esc(o.fileName)+'</div>');
   h.push('</div>');
  });
  h.push('<div class="surface"><b>Real Vault integration comes later.</b><p>Only the actual app can connect a canonical original, verify provenance, and manage permissions. This standalone demo makes no such claim.</p></div>');
 }
 if(step===4){
  open("05 · COMPARE N OPTIONS","Understand the<br><em>real tradeoffs.</em>","Rate every option against the same factors. Missing values stay unknown.");
  h.push('<div class="matrix-wrap"><table class="matrix"><thead><tr><th>Criteria</th>');
  s.options.forEach(o=>h.push('<th>'+esc(o.name)+'</th>'));
  h.push('</tr></thead><tbody>');
  s.criteria.forEach(c=>{
   h.push('<tr><td>'+esc(c.name)+'<div class="muted">× '+c.weight+(c.required?" · required":"")+'</div></td>');
   s.options.forEach(o=>h.push('<td><input type="number" min="0" max="10" step="1" data-rating-option="'+o.id+'" data-rating-criterion="'+c.id+'" aria-label="'+esc(o.name+" "+c.name)+'" value="'+(o.ratings[c.id]??"")+'" placeholder="—"></td>'));
   h.push('</tr>');
  });
  h.push('</tbody></table></div><div class="section-title"><strong>Example weighted fit</strong><span class="muted">Not AI confidence</span></div><div id="scores">'+scoreList()+'</div>');
  h.push('<p>Do not interpret incomplete ratings as a winner. The actual native ranking engine retains its own source and constraint rules.</p>');
 }
 if(step===5){
  open("06 · EXPLICIT OWNER CHOICE","You are still<br><em>in control.</em>","Choose the option you prefer, regardless of the example weighted ordering.");
  s.options.forEach(o=>h.push('<label class="choice"><input type="radio" name="chosen" data-choice="'+o.id+'" '+(s.chosen===o.id?"checked":"")+'><span><b>'+esc(o.name)+'</b><small>'+(allScores().find(x=>x.option.id===o.id).complete?"Complete example ratings":"Some ratings are unknown")+'</small></span></label>'));
  h.push('<button class="save-preview" id="confirm">Confirm in this preview</button>');
  if(s.chosenConfirmed)h.push('<div class="goodnote">Your choice is confirmed here, but not saved or acted on in the real Decision Layer.</div>');
 }
 if(step===6){
  open("07 · FOLLOW-THROUGH","Make progress.<br><em>Learn over time.</em>","Connect an action, write an outcome, and revisit the decision when circumstances change.");
  const chosen=s.options.find(o=>o.id===s.chosen);
  h.push('<div class="surface"><span class="muted">Selected option</span><h3>'+esc(chosen?.name||"Not selected yet")+'</h3><span class="muted">'+(s.chosenConfirmed?"Confirmed in preview":"Not confirmed")+'</span></div>');
  h.push('<div class="field"><label>One practical next step</label><textarea id="nextAction" placeholder="What would I actually do?">'+esc(s.nextAction)+'</textarea></div>');
  h.push('<div class="field"><label>What happened? (when known)</label><textarea id="outcome" placeholder="Your own reflection">'+esc(s.outcome)+'</textarea></div>');
  h.push('<label class="factor-footer" style="justify-content:flex-start;gap:9px"><input id="outcomeConfirmed" type="checkbox" style="width:20px" '+(s.outcomeConfirmed?"checked":"")+'> I personally confirm this outcome</label>');
  h.push('<button class="outline" id="reconsider" style="width:100%;margin-top:15px">Revisit the comparison ↗</button>');
  h.push('<div class="surface"><b>One source of truth</b><p>The production app can link this record to real Vault, Goals, reviews and rankings, without duplicating them. This demo saves none of those records.</p></div>');
 }
 return h.join("");
}
function scoreList(){
 const entries=allScores();const complete=entries.every(x=>x.complete&&x.score!=null);
 const high=complete?Math.max(...entries.map(x=>x.score)):null;
 return entries.map(x=>{
  const mark=x.complete&&x.score!=null?x.score.toFixed(1)+"/10":"Unknown";
  const note=x.complete?(complete&&x.score===high?"Highest example fit":"Fully rated"):"Missing "+x.missing.length+" rating(s)";
  return '<div class="option-score"><span class="thumb">◈</span><b>'+esc(x.option.name)+'</b><div style="text-align:right"><strong>'+mark+'</strong><div class="muted">'+note+'</div></div></div>';
 }).join("");
}
function render(){
 document.querySelectorAll("[data-case]").forEach(el=>el.classList.toggle("on",el.dataset.case===key));
 $("#journey-counter").textContent="STEP "+(step+1)+" / "+steps.length;
 $("#stages").innerHTML=steps.map((name,i)=>'<button class="'+(i===step?"active":i<step?"done":"")+'" data-stage="'+i+'">'+name+'</button>').join("");
 $("#stage").innerHTML=stageContent();
 $("#back").disabled=step===0;$("#back").style.opacity=step===0?".4":"1";
 $("#next").textContent=step===6?"Back to question ↺":"Continue →";
 $("#stages").querySelectorAll("button").forEach(b=>b.onclick=()=>{step=Number(b.dataset.stage);render()});
 attach();
}
function attach(){
 const root=$("#stage");
 root.oninput=e=>{
  const el=e.target,d=el.dataset;
  if(el.id==="question")s.question=el.value;
  if(el.id==="reason")s.reason=el.value;
  if(el.id==="category")s.category=el.value;
  if(d.optionName)opt(d.optionName).name=el.value;
  if(d.optionNote)opt(d.optionNote).note=el.value;
  if(d.cname)criterion(d.cname).name=el.value;
  if(d.cweight){criterion(d.cweight).weight=Number(el.value);document.getElementById("weight-"+d.cweight).textContent=el.value}
  if(d.source)opt(d.source).source=el.value;
  if(d.ratingOption){
   const o=opt(d.ratingOption),value=el.value.trim();
   if(value===""||Number(value)<0||Number(value)>10)delete o.ratings[d.ratingCriterion];
   else o.ratings[d.ratingCriterion]=Number(value);
   $("#scores").innerHTML=scoreList();
  }
  if(el.id==="nextAction")s.nextAction=el.value;
  if(el.id==="outcome")s.outcome=el.value;
 };
 root.onchange=e=>{
  const el=e.target,d=el.dataset;
  if(d.crequired)criterion(d.crequired).required=el.checked;
  if(d.file&&el.files?.[0]){
   const o=opt(d.file),file=el.files[0];
   if(o.fileURL)URL.revokeObjectURL(o.fileURL);
   o.fileName=file.name;
   o.fileURL=file.type.startsWith("image/")?URL.createObjectURL(file):null;
   render();toast("File kept locally for this session. Not uploaded.");
  }
  if(d.choice){s.chosen=d.choice;s.chosenConfirmed=false}
  if(el.id==="outcomeConfirmed"){
   if(el.checked&&!s.outcome.trim()){el.checked=false;toast("Describe the outcome before confirming.");return}
   s.outcomeConfirmed=el.checked;
  }
 };
 root.onclick=e=>{
  const b=e.target.closest("button");if(!b)return;const d=b.dataset;
  if(b.id==="addOption"){s.options.push({id:"opt"+(++seq),name:"",img:null,note:"",ratings:{},source:"",fileName:"",fileURL:null});render();toast("Added an option. Give it a name.");}
  if(d.removeOption){
   if(s.options.length<=1){toast("Keep at least one option.");return}
   s.options=s.options.filter(o=>o.id!==d.removeOption);
   if(s.chosen===d.removeOption){s.chosen=null;s.chosenConfirmed=false}
   render();
  }
  if(d.removeCriterion){s.criteria=s.criteria.filter(c=>c.id!==d.removeCriterion);render()}
  if(b.id==="addCriterion"){
   const name=$("#newCriterion").value.trim();if(!name){toast("Enter a factor name.");return}
   s.criteria.push({id:"crit"+(++seq),name,weight:5,required:false});render();toast("New factor added. Ratings are unknown.");
  }
  if(b.id==="confirm"){
   if(!s.chosen){toast("Choose an option first.");return}
   s.chosenConfirmed=true;render();toast("Demo choice confirmed, not saved to the app.");
  }
  if(b.id==="reconsider"){step=4;render()}
 };
}
document.querySelectorAll("[data-case]").forEach(b=>b.onclick=()=>setup(b.dataset.case));
$("#back").onclick=()=>{if(step>0){step--;render()}};
$("#next").onclick=()=>{
 if(step===0&&!s.question.trim()){toast("Write your question first.");return}
 if(step===1&&s.options.some(o=>!o.name.trim())){toast("Name the new option first.");return}
 step=step===steps.length-1?0:step+1;render();
};
setup(location.hash.slice(1)||"travel");
