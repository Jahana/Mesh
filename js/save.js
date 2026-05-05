// MESH v0.5 — save.js
// ===================

const SAVE_VER=1;
const NUM_SLOTS=3;
const saveKey=slot=>`mesh_v1_slot_${slot}`;
let _autoSlot=null;

function buildSave(name){
  return{version:SAVE_VER,slotName:name||'Runner',savedAt:Date.now(),
    cred:S.cred,level:S.level,xp:S.xp,prestige:S.prestige,rep:S.rep,
    hardware:S.hardware,ownedHW:S.ownedHW,
    inventory:S.inventory,installed:S.installed,
    backdoorCell:S.backdoorCell,
    runHistory:S.runHistory,totalRuns:S.totalRuns,totalCred:S.totalCred,craftedBps:S.craftedBps||[],earnedBps:S.earnedBps||[],attachments:S.attachments||[],
    traceCarry:S.traceCarry||0,permIntLoss:S.permIntLoss||0,ops:S.ops||{},
    achievements:S.achievements||{},stats:S.stats||{},
    mesh:S.mesh||null,world:S.world||null,inTutorial:S.inTutorial||false,tutorialNet:S.tutorialNet||null,
    shop:S.shop,shopNextRotate:S.shopNextRotate,
    bmRotation:S._bmRotation||[],bmNextRotate:S._bmNextRotate||0,
    crafting:(S.crafting||[]).filter(c=>!c.done),
    deckRAMMax:S.storageMax||8};
}
function applyLoad(data){
  S=mkState();
  S.cred=data.cred||0;S.level=data.level||1;S.xp=data.xp||0;S.prestige=data.prestige||0;
  S.rep=data.rep||{corp:0,crim:0,anarch:0,neutral:0};
  // Merge saved subrep over fresh defaults to handle new sub-factions added in updates
  // subrep removed
  S.hardware=data.hardware||'haas_common';S.ownedHW=data.ownedHW||['haas_common'];
  S.inventory=data.inventory||[];S.installed=data.installed||[];
  S.backdoorCell=data.backdoorCell||null;
  S.runHistory=data.runHistory||[];
  S.totalRuns=data.totalRuns||0;S.totalCred=data.totalCred||0;
  S.craftedBps=data.craftedBps||[];
  S.earnedBps=data.earnedBps||[];
  S.attachments=data.attachments||[];
  S.traceCarry=data.traceCarry||0;
  S.permIntLoss=data.permIntLoss||0;
  S.ops=data.ops||{activeOps:[],nextRun:{}};
  S.achievements=data.achievements||{};
  S.stats=data.stats||{};
  S.mesh=data.mesh||null;
  // Always wipe cached layouts on load — they regenerate deterministically
  if(S.mesh?.visitedNets){
    S.mesh.visitedNets.forEach(ns=>{
      ns.layout = null;
      ns.layoutVersion = null;
      // Wipe companies if they lack the key field (pre-v0.5 saves)
      const hasKeys = Object.values(ns.companies||{}).flat().every(c=>c.key);
      if(!hasKeys) ns.companies = null;
    });
  }
  S.world=data.world||null;
  S.inTutorial=data.inTutorial||false;
  S.tutorialNet=data.tutorialNet||null;
  S.shop=data.shop||{gen:[],corp:[],crim:[],anarch:[]};
  S.crafting=data.crafting||[];
  S._bmRotation=data.bmRotation||[];
  S._bmNextRotate=data.bmNextRotate||0;
  // Restore craft start times (real-time based)
  S.crafting.forEach(c=>{if(!c.startTime)c.startTime=Date.now();});
  S.storageMax=data.deckRAMMax||8;
  S.shopNextRotate=data.shopNextRotate||{gen:0,corp:0,crim:0,anarch:0};
  S.integrity=maxInt();S.crafting=[];
  // Ensure all shops populated (handles old saves)
  ['gen','corp','crim','anarch'].forEach(f=>{if(!S.shop[f]||S.shop[f].length===0)initShop(f);});
}
function saveToSlot(slot,name){
  try{localStorage.setItem(saveKey(slot),JSON.stringify(buildSave(name)));addLog(`💾 Saved to Slot ${slot}`,'li');renderSaveScreen();return true;}
  catch(e){addLog('Save failed: '+e.message,'lb');return false;}
}
function loadFromSlot(slot){
  try{
    const raw=localStorage.getItem(saveKey(slot));if(!raw)return false;
    applyLoad(JSON.parse(raw));addLog(`📂 Loaded Slot ${slot}`,'li');
    generateBoard();renderAll();
    // Don't show game layout here — home screen will handle navigation
    return true;
  }catch(e){addLog('Load failed: '+e.message,'lb');return false;}
}
function deleteSlot(slot){localStorage.removeItem(saveKey(slot));renderSaveScreen();}
function exportSave(slot){
  const raw=localStorage.getItem(saveKey(slot));if(!raw)return;
  const data=JSON.parse(raw);
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
  a.download=`mesh_${data.slotName.replace(/\s+/g,'_')}_${Date.now()}.json`;
  a.click();URL.revokeObjectURL(a.href);
}
function importSave(e){
  const file=e.target.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const data=JSON.parse(ev.target.result);
      if(!data.version||!data.slotName)throw new Error('Invalid save file');
      let slot=null;for(let i=1;i<=NUM_SLOTS;i++){if(!localStorage.getItem(saveKey(i))){slot=i;break;}}
      if(slot===null)slot=1;
      localStorage.setItem(saveKey(slot),JSON.stringify(data));
      addLog(`📂 Imported to Slot ${slot}: ${data.slotName}`,'li');renderSaveScreen();
    }catch(err){addLog('Import failed: '+err.message,'lb');}
  };
  r.readAsText(file);e.target.value='';
}
function autoSave(){
  if(_autoSlot===null)return;
  try{const raw=localStorage.getItem(saveKey(_autoSlot));const name=raw?JSON.parse(raw).slotName:'Runner';localStorage.setItem(saveKey(_autoSlot),JSON.stringify(buildSave(name)));}catch(e){}
}
function hasAnySave(){for(let i=1;i<=NUM_SLOTS;i++){if(localStorage.getItem(saveKey(i)))return true;}return false;}

// ── TITLE SCREEN ──────────────────────────────────────────────────────────
function showTitle(){
  const el=document.getElementById('title-screen');
  if(el)el.classList.remove('hidden');
  renderTitleMain();
}

function hideTitle(){
  const el=document.getElementById('title-screen');
  if(el){
    el.style.transition='opacity 0.5s';
    el.style.opacity='0';
    setTimeout(()=>{el.classList.add('hidden');el.style.opacity='';el.style.transition='';},500);
  }
}

function renderTitleMain(){
  const el=document.getElementById('ts-content');if(!el)return;
  const hasSave=hasAnySave();
  // Find most recent save
  let best=null,bestTime=0;
  for(let i=1;i<=NUM_SLOTS;i++){
    const raw=localStorage.getItem(saveKey(i));
    if(raw){const d=JSON.parse(raw);if(d.savedAt>bestTime){bestTime=d.savedAt;best={slot:i,data:d};}}
  }
  let html='';
  if(hasSave&&best){
    const d=best.data;
    html+=`<button class="ts-btn ts-primary" onclick="titleContinue(${best.slot})">▶ CONTINUE</button>`;
    html+=`<div style="font-size:8px;color:#1a4a2a;text-align:center;margin-top:-4px;font-family:'Share Tech Mono',monospace">${d.slotName} · Lv${d.level} · P${d.prestige} · ${(d.totalCred||0).toLocaleString()}₵</div>`;
  }
  html+=`<button class="ts-btn ${hasSave?'':'ts-primary'}" onclick="titleNewGame()" style="margin-top:${hasSave?4:0}px">✦ NEW GAME</button>`;
  if(hasSave){
    html+=`<button class="ts-btn ts-secondary" onclick="titleLoad()">◉ LOAD GAME</button>`;
  }
  html+=`<label class="ts-btn ts-secondary" style="cursor:pointer">📂 IMPORT SAVE<input type="file" accept=".json" style="display:none" onchange="titleImport(event)"></label>`;
  el.innerHTML=html;
}

function titleContinue(slot){
  _autoSlot=slot;
  loadFromSlot(slot);
  hideTitle();
  // Show home screen — it hides game-layout and shows home
  setTimeout(()=>{
    const gameEl=document.getElementById('game-layout');
    if(gameEl) gameEl.style.display='none';
    if(typeof showHomeScreen==='function'){ showHomeScreen(); }
    if(typeof renderHomeScreen==='function'){ renderHomeScreen(); }
  }, 650);
}

function titleNewGame(){
  const el=document.getElementById('ts-content');if(!el)return;
  // Find first empty slot or ask to overwrite
  let emptySlot=null;
  for(let i=1;i<=NUM_SLOTS;i++){if(!localStorage.getItem(saveKey(i))){emptySlot=i;break;}}
  if(emptySlot){
    // Straight to name entry
    el.innerHTML=`
      <div class="ts-label">RUNNER DESIGNATION</div>
      <input class="ts-name-input" id="ts-name" maxlength="20" placeholder="Runner" autofocus>
      <button class="ts-btn ts-primary" style="margin-top:8px" onclick="titleStartNew()">▶ JACK IN</button>
      <div class="ts-back" onclick="renderTitleMain()">← Back</div>`;
    setTimeout(()=>document.getElementById('ts-name')?.focus(),50);
  } else {
    // All slots full — show slot picker to overwrite
    titleNewGameSlotPick();
  }
}

function titleNewGameSlotPick(){
  const el=document.getElementById('ts-content');if(!el)return;
  let html='<div class="ts-label" style="margin-bottom:8px">OVERWRITE SAVE SLOT</div><div class="ts-slot-picker">';
  for(let i=1;i<=NUM_SLOTS;i++){
    const raw=localStorage.getItem(saveKey(i));
    const d=raw?JSON.parse(raw):null;
    html+=`<div class="ts-slot" onclick="titleNewGameOverwrite(${i})">
      <div><span style="color:#40c060">SLOT ${i}</span><span style="color:#3a3a3a"> — ${d?d.slotName:'Empty'}</span></div>
      <div class="ts-slot-meta">${d?`Lv${d.level} · ${new Date(d.savedAt).toLocaleDateString()}`:'—'}</div>
    </div>`;
  }
  html+=`</div><div class="ts-back" onclick="renderTitleMain()">← Back</div>`;
  el.innerHTML=html;
}

function titleNewGameOverwrite(slot){
  const el=document.getElementById('ts-content');if(!el)return;
  el.innerHTML=`
    <div class="ts-label">RUNNER DESIGNATION</div>
    <input class="ts-name-input" id="ts-name" maxlength="20" placeholder="Runner" autofocus>
    <div style="font-size:7px;color:#6a2020;margin-top:4px;font-family:'Share Tech Mono',monospace">Slot ${slot} will be overwritten</div>
    <button class="ts-btn ts-primary" style="margin-top:8px" onclick="titleStartNew(${slot})">▶ JACK IN</button>
    <div class="ts-back" onclick="titleNewGameSlotPick()">← Back</div>`;
  setTimeout(()=>document.getElementById('ts-name')?.focus(),50);
}

function titleStartNew(overwriteSlot){
  const name=(document.getElementById('ts-name')?.value||'Runner').trim()||'Runner';
  // Find slot
  let slot=overwriteSlot||null;
  if(!slot){for(let i=1;i<=NUM_SLOTS;i++){if(!localStorage.getItem(saveKey(i))){slot=i;break;}}}
  if(!slot)slot=1;
  S=mkState();
  ['fracter_1','decoder_1','killer_1','hide_1','soothe_1','scan_1','deceive_1'].forEach(id=>addInv(id));
  S.integrity=maxInt();
  ['gen','corp','crim','anarch'].forEach(f=>initShop(f));
  if(typeof initBMRotation==='function')initBMRotation();
  saveToSlot(slot,name);
  _autoSlot=slot;
  if(!S.mesh) S.mesh = (typeof mkMeshState==='function')?mkMeshState():null;
  if(!S.world) S.world = (typeof mkWorldState==='function')?mkWorldState():null;
  addLog('▶ NEW GAME — MESH OS v0.5','li');
  addLog('"All the nets that ever were, are, or will be make up the Mesh"','li');
  generateBoard();renderAll();
  hideTitle();
  setTimeout(()=>{
    const gameEl=document.getElementById('game-layout');
    if(gameEl) gameEl.style.display='none';
    if(typeof showHomeScreen==='function'){ showHomeScreen(); }
    if(typeof renderHomeScreen==='function'){ renderHomeScreen(); }
  }, 650);
}

function titleLoad(){
  const el=document.getElementById('ts-content');if(!el)return;
  let html='<div class="ts-label" style="margin-bottom:8px">SELECT SAVE SLOT</div><div class="ts-slot-picker">';
  for(let i=1;i<=NUM_SLOTS;i++){
    const raw=localStorage.getItem(saveKey(i));
    const d=raw?JSON.parse(raw):null;
    if(d){
      html+=`<div class="ts-slot" onclick="titleContinue(${i})">
        <div><span style="color:#40c060">SLOT ${i}</span> — <span style="color:#60c080">${d.slotName}</span></div>
        <div class="ts-slot-meta">Lv${d.level} · P${d.prestige} · ${(d.totalCred||0).toLocaleString()}₵ · ${new Date(d.savedAt).toLocaleDateString()}</div>
      </div>`;
    }else{
      html+=`<div class="ts-slot empty"><span style="color:#1a3a1a">SLOT ${i} — Empty</span></div>`;
    }
  }
  html+=`</div><div class="ts-back" onclick="renderTitleMain()">← Back</div>`;
  el.innerHTML=html;
}

function titleImport(event){
  const file=event.target.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(!data.version||!data.slotName)throw new Error('Invalid');
      let slot=null;
      for(let i=1;i<=NUM_SLOTS;i++){if(!localStorage.getItem(saveKey(i))){slot=i;break;}}
      if(!slot)slot=1;
      localStorage.setItem(saveKey(slot),JSON.stringify(data));
      _autoSlot=slot;
      loadFromSlot(slot);
      hideTitle();
      addLog(`📂 Imported: ${data.slotName}`,'li');
    }catch(err){
      alert('Import failed: '+err.message);
    }
  };
  reader.readAsText(file);
}

function startNewGame(){
  S=mkState();
  ['fracter_1','decoder_1','killer_1','hide_1','soothe_1','scan_1','deceive_1'].forEach(id=>addInv(id));
  S.integrity=maxInt();
  ['gen','corp','crim','anarch'].forEach(f=>initShop(f));
  S.selectedBlueprint=null;
  addLog('▶ NEW GAME — MESH OS v0.5','li');addLog('Select contracts to begin','li');
  generateBoard();renderAll();showTab('run');
  startAutoRunCountdown();
}
function promptSave(slot){
  const raw=localStorage.getItem(saveKey(slot));const data=raw?JSON.parse(raw):null;const name=data?.slotName||'Runner';
  showModal(data?`Overwrite Slot ${slot}?`:`Save to Slot ${slot}`,
    `${data?`Current: <b>${data.slotName}</b> — Lv${data.level}<br><br>`:''}Runner name:<br><input class="ss-name-input" id="min" value="${name}" maxlength="20" style="margin-top:6px">`,
    [{label:data?'Overwrite':'Save',cls:'modal-confirm',fn:()=>{const n=document.getElementById('min')?.value||'Runner';saveToSlot(slot,n);_autoSlot=slot;closeModal();}},
     {label:'Cancel',cls:'modal-cancel',fn:closeModal}]
  );setTimeout(()=>document.getElementById('min')?.focus(),50);
}
function promptLoad(slot){
  const raw=localStorage.getItem(saveKey(slot));if(!raw)return;const data=JSON.parse(raw);
  showModal(`Load Slot ${slot}`,`Load <b>${data.slotName}</b>?<br>Level ${data.level} · Prestige ${data.prestige} · ${(data.totalCred||0).toLocaleString()}₵<br><br><span style="color:#ff6040">Current unsaved progress will be lost.</span>`,
    [{label:'Load',cls:'modal-confirm',fn:()=>{_autoSlot=slot;loadFromSlot(slot);closeModal();}},
     {label:'Cancel',cls:'modal-cancel',fn:closeModal}]
  );
}
function promptDelete(slot){
  const raw=localStorage.getItem(saveKey(slot));if(!raw)return;const data=JSON.parse(raw);
  showModal(`Delete Slot ${slot}?`,`Delete <b>${data.slotName}</b>? This cannot be undone.`,
    [{label:'Delete',cls:'modal-danger',fn:()=>{deleteSlot(slot);if(_autoSlot===slot)_autoSlot=null;closeModal();}},
     {label:'Cancel',cls:'modal-cancel',fn:closeModal}]
  );
}

// MODAL
function showModal(title,body,btns){
  document.getElementById('modal-title').textContent=title;
  document.getElementById('modal-body').innerHTML=body;
  const el=document.getElementById('modal-btns');el.innerHTML='';
  btns.forEach(b=>{const btn=document.createElement('button');btn.className='modal-btn '+(b.cls||'modal-cancel');btn.textContent=b.label;btn.onclick=b.fn;el.appendChild(btn);});
  document.getElementById('modal').classList.add('show');
}
function closeModal(){document.getElementById('modal').classList.remove('show');}

// INVENTORY / DECK
