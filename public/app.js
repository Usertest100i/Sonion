const $ = id => document.getElementById(id);
const state = {reports: [], teams: [], categories: [], selected: null, filter: 'Active', busy: false};
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icons = {Infrastructure:'ϟ',Supplies:'▧',Access:'↗',Community:'◎'};
let toastTimer;
function toast(message) { $('toast').textContent=message; $('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4000); }
async function api(path, options={}) {
  const response=await fetch(path,{...options,headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(8000)});
  const value=await response.json();
  if(!response.ok)throw new Error(value.error || 'Request failed.');
  return value;
}
async function load({quiet=false}={}) {
  try {
    const value=await api('/api/reports'); Object.assign(state,value);
    if(!state.selected)state.selected=state.reports.find(r=>r.status!=='Resolved')?.id;
    $('connection').textContent='● Connected locally';
    if(!$('form-category').options.length){
      $('form-category').innerHTML=state.categories.map(c=>`<option>${escape(c)}</option>`).join('');
      $('category').insertAdjacentHTML('beforeend',state.categories.map(c=>`<option>${escape(c)}</option>`).join(''));
    }
    render();
  } catch(error) {
    $('connection').textContent='● Offline · retrying';
    if(!quiet) toast('Cannot connect. Your form input is kept; reconnecting automatically.');
  }
}
function filtered(){const query=$('search').value.toLowerCase();return state.reports.filter(r=>(state.filter==='All' || (state.filter==='Active'?r.status!=='Resolved':r.status==='Resolved')) && ($('category').value==='All' || r.category===$('category').value) && `${r.title} ${r.description} ${r.location}`.toLowerCase().includes(query));}
function render() {
  const active=state.reports.filter(r=>r.status!=='Resolved');
  $('stat-active').textContent=active.length; $('nav-count').textContent=active.length;
  $('stat-high').textContent=active.filter(r=>r.priority.value>=80).length;
  $('stat-impact').textContent=active.reduce((n,r)=>n+r.impact,0).toLocaleString();
  $('stat-rate').textContent=`${state.reports.length?Math.round(100*(state.reports.length-active.length)/state.reports.length):0}%`;
  const visible=filtered();$('queue-count').textContent=visible.length;
  $('report-list').innerHTML=visible.length?visible.map(r=>`<article class="report"><span class="category-icon" aria-hidden="true">${icons[r.category]}</span><div class="report-info"><button class="report-title" data-select="${escape(r.id)}">${escape(r.title)}</button><div class="report-meta">${escape(r.location)} · ${r.impact} reported affected</div></div><div class="report-right"><span class="badge ${r.priority.label.toLowerCase()}">${r.priority.label} · ${r.priority.value}</span><span class="status">${escape(r.status)}</span></div></article>`).join(''):'<p class="empty">No matching signals.<br>Try another filter or create a report.</p>';
  $('markers').innerHTML=active.map((r,i)=>`<button class="marker ${r.priority.label.toLowerCase()} ${r.id===state.selected?'selected':''}" data-select="${escape(r.id)}" data-x="${r.x}" data-y="${r.y}" aria-label="${escape(r.title)}; ${r.priority.label} priority" title="${escape(r.title)}">${i+1}</button>`).join('');
  // CSSOM properties keep dynamic values compatible with the strict CSP.
  document.querySelectorAll('.marker').forEach(el=>{el.style.left=`${Number(el.dataset.x)}%`;el.style.top=`${Number(el.dataset.y)}%`;});
  renderFocus();
  $('teams').innerHTML=state.teams.map((team,i)=>{const count=active.filter(r=>r.team===team).length;return `<div class="team-row"><span class="team-avatar">${['NC','SC','ST','AT'][i]}</span><div class="team-info">${escape(team)}<small>${count?'Coordinating assigned work':'Available for assignment'}</small></div><span class="team-load">${count} active</span></div>`;}).join('');
  const events=state.reports.flatMap(r=>r.history.map(h=>({...h,title:r.title}))).sort((a,b)=>b.at.localeCompare(a.at)).slice(0,3);
  $('activity-list').innerHTML=events.map(e=>`<div class="activity-entry">${escape(e.action)}<small>${escape(e.title)}</small></div>`).join('');
  document.querySelectorAll('[data-select]').forEach(button=>button.addEventListener('click',()=>{state.selected=button.dataset.select;render();}));
}
function renderFocus(){
  const r=state.reports.find(r=>r.id===state.selected);
  if(!r){$('focus').innerHTML='<p class="empty">Select a signal to inspect it.</p>';return;}
  $('focus').innerHTML=`<span class="badge ${r.priority.label.toLowerCase()}">${r.priority.label.toUpperCase()} PRIORITY · ${escape(r.status)}</span><h3 class="focus-title">${escape(r.title)}</h3><div class="focus-location">⌖ ${escape(r.location)} · ${escape(r.category)}</div><p class="focus-description">${escape(r.description)}</p><div class="score-box"><div class="score-top"><span>Explainable priority score</span><strong>${r.priority.value}<small>/100</small></strong></div><div class="progress"><span id="score-bar"></span></div><div class="reasons">${r.priority.reasons.map(reason=>`<span>${escape(reason)}</span>`).join('')}</div></div><div class="action-row"><select id="assign-team" aria-label="Assign team">${state.teams.map(team=>`<option ${team===r.team?'selected':''}>${escape(team)}</option>`).join('')}</select><button id="assign" class="button primary" ${r.status==='Resolved' || state.busy?'disabled':''}>Assign ↗</button></div><button id="resolve" class="button resolve" ${state.busy?'disabled':''}>${r.status==='Resolved'?'Reopen signal':'✓ Mark resolved'}</button>`;
  $('score-bar').style.width=`${r.priority.value}%`;
  $('assign').addEventListener('click',()=>update(r.id,'Assigned',$('assign-team').value));
  $('resolve').addEventListener('click',()=>update(r.id,r.status==='Resolved'?'Open':'Resolved'));
}
async function update(id,status,team=null){
  state.busy=true;renderFocus();
  try{await api(`/api/reports/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({status,team})});await load();toast(status==='Assigned'?`Assigned to ${team}`:`Signal ${status.toLowerCase()}`);}catch(error){toast(error.message);}finally{state.busy=false;renderFocus();}
}
$('new-report').addEventListener('click',()=>{$('form-error').textContent='';$('report-dialog').showModal();});
$('close-dialog').addEventListener('click',()=>$('report-dialog').close());
$('demo-tour').addEventListener('click',()=>$('guide-dialog').showModal());
$('close-guide').addEventListener('click',()=>$('guide-dialog').close());
$('report-form').addEventListener('submit',async event=>{
  event.preventDefault();const submit=event.submitter;submit.disabled=true;$('form-error').textContent='';
  const value=Object.fromEntries(new FormData(event.target));value.impact=Number(value.impact);value.urgency=Number(value.urgency);[value.x,value.y]=$('map-area').value.split(',').map(Number);
  try{const result=await api('/api/reports',{method:'POST',body:JSON.stringify(value)});state.selected=result.report.id;state.filter='Active';setFilter('Active');$('search').value='';$('category').value='All';$('report-dialog').close();event.target.reset();await load();toast('New signal created.');}
  catch(error){$('form-error').textContent=`${error.message} Your input has been kept. Check the queue before retrying if a request timed out.`;}
  finally{submit.disabled=false;}
});
function setFilter(value){state.filter=value;document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter===value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});render();}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>setFilter(button.dataset.filter)));
$('search').addEventListener('input',render);$('category').addEventListener('change',render);
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),reports:state.reports},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download='relay-workspace.json';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Workspace exported.');});
load();setInterval(()=>{if(!state.busy && !$('report-dialog').open && !$('focus').contains(document.activeElement))load({quiet:true});},15000);
window.addEventListener('online',()=>load({quiet:true}));
