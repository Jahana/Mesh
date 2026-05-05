// MESH v0.2 — render.js
// =====================

// ── TOOLTIP ENGINE ───────────────────────────────────────────────────────
const _tt=()=>document.getElementById('tt');

function ttShow(html, e){
  const el=_tt();if(!el)return;
  el.innerHTML=html;
  el.style.display='block';
  ttMove(e);
}
function ttHide(){const el=_tt();if(el)el.style.display='none';}
function ttMove(e){
  const el=_tt();if(!el||el.style.display==='none')return;
  const pad=12;
  const vw=window.innerWidth, vh=window.innerHeight;
  const ew=el.offsetWidth, eh=el.offsetHeight;
  let x=e.clientX+pad, y=e.clientY+pad;
  if(x+ew>vw-pad)x=e.clientX-ew-pad;
  if(y+eh>vh-pad)y=e.clientY-eh-pad;
  el.style.left=x+'px';el.style.top=y+'px';
}
document.addEventListener('mousemove',ttMove);

function ttProgram(d){
  if(!d)return '';
  const tierLabel=['','Mk1','Mk2','Mk3','Mk4','Mk5','Mk6'][d.tier]||'';
  const lines=[
    `<span style="color:#40ff80;font-size:10px">${d.icon} ${d.name}${tierLabel?' · '+tierLabel:''}</span>`,
    `<span style="color:#3a8a3a">${d.cat==='breaker'?'Breaker':'Utility'} · MEM ${d.mem}</span>`,
  ];
  if(d.str)   lines.push(`STR <span style="color:#ffdd40">${d.str}</span>`);
  if(d.power) lines.push(`Power <span style="color:#40aaff">${d.power}</span>`);
  if(d.iceTypes) lines.push(`Breaks: <span style="color:#ff8040">${d.iceTypes.join(', ')}</span>`);
  if(d.passive)  lines.push(`<span style="color:#2a7a2a">Passive — always active</span>`);
  lines.push('');
  lines.push(`<span style="color:#4a8a4a">${d.desc}</span>`);
  if(d.prestigeReq) lines.push(`<span style="color:#aa6020">Requires Prestige ${d.prestigeReq}</span>`);
  return lines.join('<br>');
}

function ttDeck(h){
  if(!h)return '';
  const m=MANUFACTURERS[h.mfr]||{};
  const r=DECK_RARITY[h.rarity]||{};
  const lines=[
    `<span style="color:${h.color};font-size:10px">${h.icon} ${h.name}</span>`,
    `<span style="color:${h.mfrColor}">${m.name||''} · <span style="color:${r.color}">${r.name||''}</span></span>`,
    '',
    `RAM <span style="color:#40aaff">${h.ram}</span>  &nbsp;INT+ <span style="color:#40ff80">${h.integrity}</span>  &nbsp;SPD <span style="color:#ffdd40">${h.spd}</span>  &nbsp;Slots <span style="color:#ff88ff">${h.slots}</span>`,
  ];
  if(h.sigPerk) lines.push('','<span style="color:#ffaa20">★ '+h.sigPerk+'</span>');
  if(h.prestigeReq) lines.push(`<span style="color:#aa6020">Requires Prestige ${h.prestigeReq}</span>`);
  if(h.lvl>1) lines.push(`<span style="color:#6a4a2a">Requires Level ${h.lvl}</span>`);
  lines.push('','<span style="color:#2a5a3a">'+h.desc+'</span>');
  return lines.join('<br>');
}

function ttBlueprint(bp){
  if(!bp)return '';
  const result=pdef(bp.result);
  const deck=bp.isDeck?HARDWARE.find(h=>h.id===bp.result):null;
  const lines=[
    `<span style="color:#a040ff;font-size:10px">★ ${bp.name}</span>`,
    `<span style="color:#3a3a6a">Blueprint</span>`,
    '',
    `Craft time: <span style="color:#40aaff">${bp.craftTime>=3600?Math.floor(bp.craftTime/3600)+'h '+(Math.floor(bp.craftTime%3600/60)||'')+'m':bp.craftTime>=60?Math.floor(bp.craftTime/60)+'m '+bp.craftTime%60+'s':bp.craftTime+'s'}</span>`,
    `Cost: <span style="color:#40ff80">${bp.credCost.toLocaleString()}₵</span>`,
  ];
  if(result){
    lines.push('','<span style="color:#60c060">Produces:</span>');
    lines.push(ttProgram(result));
  }else if(deck){
    lines.push('','<span style="color:#60c060">Produces:</span>');
    lines.push(ttDeck(deck));
  }
  return lines.join('<br>');
}

function ttAttachment(a){
  if(!a)return '';
  const lines=[
    `<span style="color:#40c0c0;font-size:10px">${a.icon} ${a.name}</span>`,
    `<span style="color:#2a5a5a">HW Attachment</span>`,
    '',
    `Effect: <span style="color:#40aaff">${a.effect}</span>  Power: <span style="color:#ffdd40">+${a.power}</span>`,
    '',
    `<span style="color:#4a8a4a">${a.desc}</span>`,
    `Cost: <span style="color:#40ff80">${a.cost.toLocaleString()}₵</span>`,
  ];
  return lines.join('<br>');
}

// ── RUN SETUP PANEL ──────────────────────────────────────────────────────

function showSetupTab(which){
  document.getElementById('setup-view-setup').style.display=which==='setup'?'flex':'none';
  document.getElementById('setup-view-run').style.display=which==='run'?'flex':'none';
  document.getElementById('setup-tab-setup').classList.toggle('active',which==='setup');
  document.getElementById('setup-tab-run').classList.toggle('active',which==='run');
  if(which==='run'){
    // Clone run sidebar content into setup-view-run
    const src=document.getElementById('tab-run-content');
    const dst=document.getElementById('setup-view-run');
    if(src&&dst)dst.innerHTML=src.innerHTML;
  }
}

function computeSuggestedLoadout(ct){
  // Returns {programs:[{defId,reason}], warnings:[str]}
  const programs=[];
  const warnings=[];
  const actions=ct?ct.objectives.map(o=>o.action):[];
  const isStealthy=ct?.condition==='stealth';
  const tier=curTier();

  function bestForEffect(effect){
    return S.inventory
      .filter(it=>{const d=pdef(it.defId);return d&&d.effect===effect;})
      .sort((a,b)=>(pdef(b.defId)?.tier||0)-(pdef(a.defId)?.tier||0))[0]||null;
  }
  function bestBreaker(iceType){
    return S.inventory
      .filter(it=>{const d=pdef(it.defId);return d&&d.cat==='breaker'&&d.iceTypes?.includes(iceType);})
      .sort((a,b)=>(pdef(b.defId)?.str||0)-(pdef(a.defId)?.str||0))[0]||null;
  }
  function addProg(it,reason){
    if(!it||programs.some(p=>p.defId===it.defId))return;
    programs.push({defId:it.defId,instId:it.instId,reason});
  }

  // Required
  if(actions.some(a=>['upload','modify','collect','collect_delete'].includes(a))){
    const dec=bestForEffect('decrypt');
    dec?addProg(dec,'Required: Decrypt (file action)')
       :warnings.push('⚠ No Decrypt — encrypted files cannot be processed');
  }
  if(actions.includes('display')){
    const ic=bestForEffect('intercept');
    ic?addProg(ic,'Required: Intercept (GPU contract)')
      :warnings.push('⚠ No Intercept — GPU display contract will fail');
  }
  const sc=bestForEffect('scan');
  sc?addProg(sc,'Recommended: Scanner (traps + file ID)')
    :warnings.push('No Scanner — traps undetected, files unidentified');

  // Breakers
  const killer=bestBreaker('GUARDIAN');
  killer?addProg(killer,`Breaker: ${pdef(killer.defId)?.name} vs Guardian/Hunter`)
        :warnings.push('⚠ No Killer — Guardian/Hunter retaliation unblocked');
  const fracter=bestBreaker('BARRIER');
  fracter?addProg(fracter,`Breaker: ${pdef(fracter.defId)?.name} vs Barrier`)
         :warnings.push('No Fracter — Barrier ICE unblocked');
  const decoder=bestBreaker('GATEKEEPER');
  decoder?addProg(decoder,`Breaker: ${pdef(decoder.defId)?.name} vs Gatekeeper`)
         :warnings.push('No Decoder — Gatekeeper will deal damage');

  // Utility fill
  const utilOrder=isStealthy
    ?['stealth','soothe','deceive','zap','armor','overclock']
    :['soothe','zap','deceive','stealth','armor','overclock'];
  for(const effect of utilOrder){
    const mem=programs.reduce((a,p)=>{const d=pdef(p.defId);return a+(d?.mem||0);},0);
    if(mem>=ramMax()-1)break;
    const it=bestForEffect(effect);
    if(it)addProg(it,`Utility: ${pdef(it.defId)?.name}`);
  }

  // Datastore warning
  if(!programs.some(p=>pdef(p.defId)?.effect==='scan')&&ct?.objectives.some(o=>o.action==='collect'||o.action==='collect_delete')){
    warnings.push('Scanner missing — datastore contents unidentified');
  }
  // RAM reservation warning for collect/exfil
  const collectCount=ct?.objectives.filter(o=>['collect','collect_delete'].includes(o.action)&&o.targetFile).length||0;
  const programMem=programs.reduce((a,p)=>{const d=pdef(p.defId);return a+(d?.mem||0);},0);
  const freeAfterLoad=ramMax()-programMem-collectCount;
  if(collectCount>0&&freeAfterLoad<0){
    warnings.push(`⚠ RAM tight: ${collectCount} collect slot${collectCount>1?'s':''} needed, ${Math.abs(freeAfterLoad)} over budget`);
  }else if(collectCount>0){
    const hint=`${collectCount} slot${collectCount>1?'s':''} reserved for contract files`;
    warnings.push(hint.startsWith('⚠')?hint:'◎ '+hint);
  }

  return{programs,warnings};
}

function renderSetupPanel(){
  const ct=S.active[0]||null;
  const panel=document.getElementById('run-setup-panel');
  if(!panel)return;

  // Contract detail
  const cdEl=document.getElementById('setup-contract-detail');
  if(cdEl){
    if(!ct){cdEl.innerHTML='<span style="color:#1a3a1a;font-size:9px">No contract selected</span>';}
    else{
      const flavorColors={CORPORATE:'#6080c0',CRIMINAL:'#c08040',ANARCHIST:'#c04040',NEUTRAL:'#60a060'};
      const fc=flavorColors[ct.flavor]||'#60a060';
      const condIcon=ct.condition==='stealth'?'◌ STEALTH':ct.condition==='speed'?'⚡ SPEED':'';
      cdEl.innerHTML=`<div style="color:${fc};font-size:8px;font-family:'Orbitron',monospace">${ct.flavor}</div>
        <div style="color:#80c880;font-size:10px;margin:2px 0">${ct.name}</div>
        <div style="font-size:8px;color:#3a6a3a">${['','◈','◈◈','◈◈◈','☠'][ct.diff]||''} Diff ${ct.diff} · ⏱${fmtTime(ct.duration)}</div>
        ${condIcon?`<div style="font-size:8px;color:#ffaa20;margin-top:2px">${condIcon}</div>`:''}
        <div style="margin-top:5px">${ct.objectives.map(o=>`<div style="font-size:8px;color:#2a5a3a">▸ ${o.desc}</div>`).join('')}</div>
        <div style="font-size:8px;color:#40ff80;margin-top:4px">₵${ct.reward.cred}${ct.reward.bonusCred>0?' +'+ct.reward.bonusCred+'₵ bonus':''}</div>`;
    }
  }

  // Suggested loadout
  const suggestion=ct?computeSuggestedLoadout(ct):{programs:[],warnings:['Select a contract first']};
  const llEl=document.getElementById('setup-loadout-list');
  if(llEl){
    if(!suggestion.programs.length){
      llEl.innerHTML='<span style="color:#1a3a1a;font-size:9px">No programs owned</span>';
    }else{
      const mem=suggestion.programs.reduce((a,p)=>{const d=pdef(p.defId);return a+(d?.mem||0);},0);
      llEl.innerHTML=suggestion.programs.map(p=>{
        const d=pdef(p.defId);
        const tierLabel=['','Mk1','Mk2','Mk3','Mk4','Mk5','Mk6'][d?.tier||0]||'';
        return `<div style="display:flex;gap:4px;align-items:flex-start;padding:2px 0;border-bottom:1px solid #0d1a0d">
          <span style="color:#40aaff;font-size:12px;width:16px">${d?.icon||'?'}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:9px;color:#60c080">${d?.name||p.defId} <span style="color:#3a6a3a">${tierLabel}</span></div>
            <div style="font-size:7px;color:#2a4a2a">${p.reason}</div>
          </div>
          <span style="font-size:7px;color:#2a4a2a">M:${d?.mem||0}</span>
        </div>`;
      }).join('')
      +`<div style="font-size:8px;color:#40aaff;margin-top:5px">RAM: ${mem}/${ramMax()}</div>`;
    }
  }

  // Warnings
  const wEl=document.getElementById('setup-warnings');
  if(wEl){
    wEl.innerHTML=!suggestion.warnings.length
      ?'<span style="color:#1a6a1a;font-size:9px">✓ Loadout looks good</span>'
      :suggestion.warnings.map(w=>`<div style="font-size:8px;color:${w.startsWith('⚠')?'#c04040':'#8a6020'};padding:1px 0">${w}</div>`).join('');
  }

  // RAM bar
  const ramLbl=document.getElementById('setup-ram-lbl');
  const ramBar=document.getElementById('setup-ram-bar');
  const used=ramUsed(),max=ramMax();
  if(ramLbl)ramLbl.textContent=`${used}/${max}`;
  if(ramBar)ramBar.style.width=`${(used/max)*100}%`;

  // Equip button
  const eqBtn=document.getElementById('setup-equip-btn');
  if(eqBtn)eqBtn.disabled=!ct||!suggestion.programs.length;
}

function equipSuggestedLoadout(){
  const ct=S.active[0];if(!ct)return;
  const suggestion=computeSuggestedLoadout(ct);
  // Eject all
  S.installed.forEach(iid=>{const it=S.inventory.find(x=>x.instId===iid);if(it)it.installed=false;});
  S.installed=[];
  // Install suggested
  suggestion.programs.forEach(p=>{
    const it=S.inventory.find(x=>x.instId===p.instId);
    if(!it||it.installed)return;
    const d=pdef(it.defId);if(!d)return;
    if(ramUsed()+d.mem>ramMax())return;
    it.installed=true;S.installed.push(it.instId);
  });
  addLog(`⚡ Loadout equipped: ${S.installed.length} programs, ${ramUsed()}/${ramMax()} RAM`,'li');
  renderSetupPanel();renderDeck();renderTopBar();autoSave();
}

function showRunSetup(show){
  const setupPanel=document.getElementById('run-setup-panel');
  const runPanel=document.getElementById('tab-run-content');
  if(!setupPanel||!runPanel)return;
  if(show){
    setupPanel.style.display='flex';
    runPanel.style.removeProperty('display'); // clear any previous inline style
    renderSetupPanel();
  }else{
    setupPanel.style.display='none';
    runPanel.style.removeProperty('display'); // always clear inline — let CSS class win
  }
}

function ttCell(cell, r, c){
  if(!cell)return '';
  const nt=NODE_DEF[cell.nodeType]||NODE_DEF.EMPTY;
  const vis=S.mapped||cell.visited||(r===0&&c===0);
  if(!vis)return '<span style="color:#2a4a2a">Unmapped</span>';

  const lines=[
    `<span style="color:${nt.color};font-size:11px">${nt.icon} ${nt.label}</span>  <span style="color:#1a3a1a;font-size:8px">[${r},${c}]</span>`,
  ];

  // Node description
  if(nt.desc)lines.push(`<span style="color:#2a5a2a;font-size:7px">${nt.desc}</span>`);

  // State indicators
  if(cell.destroyed)lines.push('<span style="color:#4a1a1a">✗ Destroyed</span>');
  if(cell.copSilenced)lines.push('<span style="color:#404040">⬟ Silenced</span>');
  if(cell.ioBlocked)lines.push('<span style="color:#3a3a3a">⇄ I/O Blocked</span>');
  if(cell.vaultLocked)lines.push('<span style="color:#886600">◆ Vault Locked — needs Decrypt</span>');
  if(cell.proxyActive)lines.push(`<span style="color:#c0a0ff">⬭ Proxy: row ${cell.r}, col ${cell.c} rerouted</span>`);
  if(cell.relayDone)lines.push('<span style="color:#40ffdd">⇢ Relay visited</span>');
  if(cell.terminalUsed)lines.push('<span style="color:#80ff40">⌨ Terminal used</span>');
  if(cell.archiveCollected)lines.push('<span style="color:#ffa040">◎ Archive collected</span>');
  if(cell.cpuDone)lines.push('<span style="color:#ffdd40">◈ CPU accessed</span>');

  // ICE detail
  if(cell.ice){
    const id=BASE_ICE[cell.ice];
    const str=iceStr(cell.ice,curTier());
    const revealed=cell.iceRevealed||attachEffect('ice_reveal')>0;
    lines.push('');
    if(id){
      lines.push(`<span style="color:#ff4040">⬡ ICE: ${id.label}</span>${revealed?` <span style="color:#ffaa20">STR ${str}</span>`:' <span style="color:#3a3a3a">STR ???</span>'}`);
      if(cell.mimicDisguise&&!cell.mimicRevealed)lines.push('<span style="color:#ff8040">⚠ Disguised — true nature unknown</span>');
      if(id.prestigeReq)lines.push(`<span style="color:#6a3020">P${id.prestigeReq}+ ICE</span>`);
    }
  }

  // Trap detail
  if(cell.trap&&!cell.trapTriggered){
    lines.push('');
    if(cell.trapRevealed){
      const t=TRAPS[cell.trap];
      lines.push(`<span style="color:${t?.color||'#ffaa20'}">⚠ Trap: ${t?.label||cell.trap}</span>`);
      if(t?.desc)lines.push(`<span style="color:#6a5020;font-size:7px">${t.desc}</span>`);
    }else{
      lines.push('<span style="color:#ffaa20">⚠ Trap detected — type unknown</span>');
    }
  }

  // Files
  if(cell.files?.length){
    lines.push('');
    const known=cell.files.filter(f=>f.identified);
    const enc=cell.files.filter(f=>f.encrypted);
    lines.push(`<span style="color:#40aaff">Files: ${cell.files.length}</span>${enc.length?` <span style="color:#aa4040">(${enc.length} encrypted)</span>`:''}`);
    known.slice(0,4).forEach(f=>{
      lines.push(`<span style="color:#2a5a4a;font-size:7px">  ${fLabel(f)}${f.credValue>0?' '+f.credValue+'₵':''}</span>`);
    });
    if(cell.files.length>4)lines.push(`<span style="color:#2a4a3a;font-size:7px">  ...+${cell.files.length-4} more</span>`);
  }

  // Contract target
  const isTgt=S.active.some(ct=>ct.objectives.some(o=>o.targetNodeId===cell.id&&!o.done&&!o.failed));
  const isDone=S.active.some(ct=>ct.objectives.some(o=>o.targetNodeId===cell.id&&o.done));
  if(isTgt)lines.push('','<span style="color:#ffdd00">◎ Contract objective</span>');
  if(isDone)lines.push('','<span style="color:#40ff80">✓ Objective complete</span>');

  // Queued action progress
  const queued=S.actionQueue?.find(a=>a.cellR===r&&a.cellC===c);
  if(queued){
    const pct=Math.round((1-queued.ticksLeft/queued.ticksTotal)*100);
    lines.push('',`<span style="color:#40aaff">⏳ Processing: ${pct}%</span>`);
  }

  return lines.join('<br>');
}

function showPatchNotes(){
  const title="MESH v0.4 \u2014 Help & Changes";
  const body=`
    <div style="font-size:8px;line-height:1.8;color:#3a6a3a;max-height:400px;overflow-y:auto;padding-right:8px">
      <div style="color:#40ff80;font-size:10px;margin-bottom:8px">v0.3 \u2014 Current Build</div>
      <div style="color:#2a6a2a;margin-bottom:4px">\u25cf 20 Sub-factions (5 per parent) with unique names and rep</div>
      <div style="color:#2a6a2a;margin-bottom:4px">\u25cf Full prestige tree P1\u201310 with ICE and program unlocks</div>
      <div style="color:#2a6a2a;margin-bottom:4px">\u25cf 15 node types including RELAY, VAULT, PROXY, FIREWALL, TERMINAL</div>
      <div style="color:#2a6a2a;margin-bottom:4px">\u25cf 5 Hunter varieties: Bloodhound, Spike, Ghost, Pack, Standard</div>
      <div style="color:#2a6a2a;margin-bottom:4px">\u25cf Alert pressure system with smooth Soothe curve</div>
      <div style="color:#2a6a2a;margin-bottom:4px">\u25cf Black market, OPS tab, 30 achievements, detailed stats</div>
      <div style="color:#2a6a2a;margin-bottom:4px">\u25cf 5 deck manufacturers x 5 rarities with signature perks</div>
      <div style="color:#2a6a2a;margin-bottom:4px">\u25cf Blueprint discovery via datastores and high-diff contracts</div>
      <div style="color:#40ff80;font-size:10px;margin:10px 0 6px">Keyboard Shortcuts</div>
      <div style="color:#2a6a2a;margin-bottom:3px"><span style="color:#40aaff">1 2 4</span> \u2014 Speed &nbsp; <span style="color:#40aaff">Space/0</span> \u2014 Pause</div>
      <div style="color:#2a6a2a;margin-bottom:3px"><span style="color:#40aaff">R</span> Run &nbsp; <span style="color:#40aaff">D</span> Deck &nbsp; <span style="color:#40aaff">M</span> Market &nbsp; <span style="color:#40aaff">C</span> Craft &nbsp; <span style="color:#40aaff">I</span> Inv</div>
      <div style="color:#2a6a2a;margin-bottom:3px"><span style="color:#40aaff">O</span> Ops &nbsp; <span style="color:#40aaff">P</span> Prog &nbsp; <span style="color:#40aaff">A</span> Ach &nbsp; <span style="color:#40aaff">S</span> Stats</div>
      <div style="color:#2a6a2a;margin-bottom:3px"><span style="color:#40aaff">Enter</span> Launch &nbsp; <span style="color:#40aaff">Esc</span> Jack out</div>
    </div>`;
  showModal(title,body,[{label:"Close",cls:"modal-confirm",fn:closeModal}]);
}

function showTab(name){
  const names=['run','deck','market','craft','inv','progression','prestige','save'];
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',names[i]===name));
  document.querySelectorAll('.rpanel').forEach(p=>p.classList.remove('active'));
  const panel=document.getElementById('tab-'+name+'-content');
  if(panel)panel.classList.add('active');
  if(name==='market')renderMarket();
  if(name==='deck')renderDeck();
  if(name==='inv')renderInventory();
  if(name==='craft')renderCraft();
  if(name==='progression')renderProgressionScreen();
  if(name==='prestige')renderPrestigeScreen();
  if(name==='save')renderSaveScreen();
  if(name==='ops')renderOps();
  if(name==='ach')renderAchievements();
  if(name==='stats')renderStats();
}

function renderSaveScreen(){
  const wrap=document.getElementById('save-slots-list');
  document.getElementById('save-new-game-banner').style.display=hasAnySave()?'none':'block';
  wrap.innerHTML='';
  for(let slot=1;slot<=NUM_SLOTS;slot++){
    const raw=localStorage.getItem(saveKey(slot));
    const data=raw?JSON.parse(raw):null;
    const div=document.createElement('div');
    div.className='save-slot'+(data?' occupied':'');
    const isAuto=_autoSlot===slot;
    let body='';
    if(data){
      body=`<div class="ss-name">${data.slotName}${isAuto?' <span style="font-size:8px;color:#40aaff">[AUTO]</span>':''}</div>
        <div class="ss-meta">
          <span class="ss-m">Level <span>${data.level}</span></span>
          <span class="ss-m">Prestige <span>${data.prestige}</span></span>
          <span class="ss-m">Cred <span>${(data.cred||0).toLocaleString()}₵</span></span>
          <span class="ss-m">Runs <span>${data.totalRuns||0}</span></span>
        </div>
        <div class="ss-time">Saved: ${new Date(data.savedAt).toLocaleString()}</div>
        <div class="ss-actions">
          <button class="action-btn" onclick="promptLoad(${slot})">📂 Load</button>
          <button class="action-btn" onclick="promptSave(${slot})">💾 Save</button>
          <button class="action-btn" onclick="exportSave(${slot})">⬇ Export</button>
          <button class="danger-btn" onclick="promptDelete(${slot})">✗ Delete</button>
        </div>`;
    }else{
      body=`<div class="ss-empty">Empty slot</div>
        <div class="ss-actions" style="margin-top:8px">
          <button class="action-btn" onclick="promptSave(${slot})">💾 Save Here</button>
        </div>`;
    }
    div.innerHTML=`<div class="ss-num ${data?'occ':''}">${slot}</div><div class="ss-body">${body}</div>`;
    wrap.appendChild(div);
  }
}

function renderTopBar(){
  const iMax=maxInt();const tier=curTier();
  document.getElementById('s-cred').textContent=S.cred.toLocaleString();
  document.getElementById('s-lvl').textContent=S.level;
  document.getElementById('s-xp').textContent=`${S.xp}/${xpToLvl(S.level)}`;
  document.getElementById('s-pres').textContent=S.prestige;
  document.getElementById('s-tier').textContent=tier;
  document.getElementById('s-int').textContent=`${S.integrity}/${iMax}`;
  // Program RAM: use snapshot during run so display is stable
  const progUsed=S.running
    ? S.runSnapshot.installed.reduce((a,iid)=>{const it=S.runSnapshot.inventory.find(x=>x.instId===iid);return a+(it?pdef(it.defId)?.mem||0:0);},0)
    : ramUsed();
  document.getElementById('s-ram').textContent=`${progUsed}/${ramMax()}`;
  if(S.running){
    // Run-in-progress indicator on topbar
  const runInd=document.getElementById('run-indicator');
  if(runInd){
    if(S.running){
      const pos=S.player?`[${S.player.r},${S.player.c}]`:'';
      runInd.style.display='';
      runInd.textContent=`▶ RUN ${pos}`;
      runInd.style.color=S.alert===2?'#ff4020':S.alert===1?'#ffd040':'#40c060';
    }else{
      runInd.style.display='none';
    }
  }
  const ab=document.getElementById('alert-badge');
    const l=['GREEN','YELLOW','RED'][S.alert];
    const pressure=S.alertPressure||0;
    const pct=Math.round(pressure/PRESSURE_MAX*100);
    ab.className='a'+l[0].toLowerCase();
    ab.textContent=`● ${l} (${pct}%)`;
    const gm=document.getElementById('grid-section-meta');
    if(gm){
      const cpuStr=S._cpuVisits>0?` ◈${S._cpuVisits}`:'';
      const olStr=S._overloadActive?' OL':'';
      const slotsStr=S.processingSlots>1?` ×${S.processingSlots}`:'';
      gm.textContent=`[${S.player.r},${S.player.c}]→[${S.rows-1},${S.cols-1}]${cpuStr}${olStr}${slotsStr}`;
    }
  }else{
    const gm=document.getElementById('grid-section-meta');if(gm)gm.textContent='';
  }
}

function renderGrid(){
  const el=document.getElementById('grid');if(!el||!S.grid.length)return;
  el.style.gridTemplateColumns=`repeat(${S.cols},54px)`;el.innerHTML='';
  const iceReveal=attachEffect('ice_reveal')>0;
  for(let r=0;r<S.rows;r++) for(let c=0;c<S.cols;c++){
    const cell=S.grid[r][c];
    const mimicActive=cell.ice==='MIMIC'&&!cell.mimicRevealed&&cell.mimicDisguise;
    const nt=mimicActive?(NODE_DEF[cell.mimicDisguise]||NODE_DEF.EMPTY):(NODE_DEF[cell.nodeType]||NODE_DEF.EMPTY);
    const isPlayer=S.player.r===r&&S.player.c===c;
    const isPat=S.patrols.some(p=>p.r===r&&p.c===c);
    const isHunt=S.hunters.some(h=>h.r===r&&h.c===c);
    const vis=S.mapped||cell.visited||(r===0&&c===0);
    const isTgt=S.active.some(ct=>ct.objectives.some(o=>o.targetNodeId===cell.id&&!o.done&&!o.failed));
    const isDone=S.active.some(ct=>ct.objectives.some(o=>o.targetNodeId===cell.id&&o.done));
    const isCombat=S.combat&&S.combat.cellR===r&&S.combat.cellC===c;
    const div=document.createElement('div');
    let cls='cell '+(vis?'':'unmapped');
    if(cell.nodeType==='ENTRY')cls+=' c-entry';
    else if(cell.nodeType==='EXIT')cls+=' c-exit';
    if(isPlayer)cls+=' c-player';
    if(isCombat)cls+=' c-combat';
    else if(isDone)cls+=' c-done';
    else if(isTgt)cls+=' c-target';
    if(cell.backdoor)cls+=' c-backdoor';
    if(cell.nodeType==='COP'&&!cell.destroyed)cls+=cell.copSilenced?' c-cop-silenced':' c-cop-active';
    if(cell.nodeType==='VAULT'&&cell.vaultLocked)cls+=' c-vault-locked';
    if(cell.nodeType==='VAULT'&&cell.scanned)cls+=' c-vault-open';
    if(cell.nodeType==='RELAY'&&cell.relayDone)cls+=' c-relay-visited';
    if(cell.nodeType==='PROXY'&&cell.proxyActive)cls+=' c-proxy-active';
    div.className=cls;

    let html='';
    // ICE badge
    if(cell.ice&&vis&&!mimicActive){
      const id=BASE_ICE[cell.ice];
      if(id){const str=iceStr(cell.ice,curTier());html+=`<span class="ibadge ${id.badge}">${id.label}${(cell.iceRevealed||iceReveal)?' '+str:''}</span>`;}
    }
    // Trap badge
    if(cell.trap&&vis&&!cell.trapTriggered){
      if(cell.trapRevealed){const t=TRAPS[cell.trap];html+=`<span class="ibadge" style="background:#1a0a00;border:1px solid #6a3a00;color:${t?.color||'#ffaa20'}">${t?.label||'TRP'}</span>`;}
      else html+=`<span class="ibadge" style="background:#0d0800;border:1px solid #4a2a00;color:#ffaa20">⚠</span>`;
    }
    // State dots top-right
    let dots='';
    if(cell.nodeType==='COP'&&!cell.destroyed)dots+=`<span class="cs-dot" style="background:${cell.copSilenced?'#404040':'#ff44aa'}"></span>`;
    if(cell.backdoor)dots+=`<span class="cs-dot" style="background:#40aaff"></span>`;
    if(dots)html+=`<div class="cell-state">${dots}</div>`;
    // Icon + label
    const nodeColor=cell.destroyed?'#333':nt.color;
    html+=`<span class="ci" style="color:${nodeColor}">${cell.destroyed?'✗':nt.icon}</span>`;
    html+=`<span class="cl" style="color:${nodeColor}">${nt.label}</span>`;
    // File count
    const fileCount=(cell.files||[]).length;
    if(fileCount>0&&vis&&!cell.scanned)html+=`<span class="file-count">${fileCount}f</span>`;
    // Objective
    if(isTgt&&vis)html+=`<span class="obj-ind" style="color:#ffdd00;font-size:9px">◎</span>`;
    // Player
    if(isPlayer)html+=`<div class="pt"><div class="pt-inner">▶</div></div>`;
    // Patrol
    const patCount=S.patrols.filter(p=>p.r===r&&p.c===c).length;
    if(patCount)html+=`<div class="pat-tok">${patCount>1?patCount:'P'}</div>`;
    // Hunter
    if(isHunt){
      const vh=S.hunters.find(h=>h.r===r&&h.c===c);
      const isGhost=vh?.type==='ghost';
      const htColor={standard:'#ff2200',bloodhound:'#ff6600',spike:'#ff0066',ghost:'#8040ff',pack:'#ff6600'}[vh?.type||'standard']||'#ff2200';
      if(!isGhost||vh?.ghostVisible)html+=`<div class="hun-tok" style="background:${htColor}">${isGhost?'G':'H'}</div>`;
    }
    // Action progress bar on current player cell
    if(isPlayer){
      const queued=S.actionQueue?.find(a=>a.cellR===r&&a.cellC===c);
      if(queued){const pct=Math.round((1-queued.ticksLeft/queued.ticksTotal)*100);html+=`<div class="cell-action-bar"><div class="cell-action-fill" style="width:${pct}%"></div></div>`;}
    }
    // Coords
    html+=`<span style="position:absolute;bottom:1px;left:2px;font-size:5px;color:#1a3a1a">${r},${c}</span>`;
    div.innerHTML=html;
    // Hover tooltip
    div.addEventListener('mouseenter',e=>ttShow(ttCell(cell,r,c),e));
    div.addEventListener('mouseleave',ttHide);
    el.appendChild(div);
  }
}

function renderRunContracts(){
  // During a run, update both the run-contracts (if present) and sel-list
  const el=document.getElementById('run-contracts');
  const selEl=document.getElementById('sel-list');
  if(el)el.innerHTML='';
  if(selEl&&S.running)selEl.innerHTML='';
  S.active.forEach(ct=>{
    const t=S.contractTimers[ct.id];
    const remTicks=t?Math.max(0,t.ticksLeft||0):Math.floor(ct.duration/100);
    const rem=remTicks*100; // ms equivalent for fmtTime
    const pct=t?((t.ticksLeft||0)/t.totalTicks)*100:100;
    const tc=pct>50?'tc-ok':pct>20?'tc-warn':'tc-exp';
    const div=document.createElement('div');div.className='rc';
    const condStatus=ct.condition==='stealth'
      ?(S._redAlertHit?'<span style="color:#ff4040;font-size:8px">◌ STEALTH FAILED</span>':'<span style="color:#6060ff;font-size:8px">◌ STEALTH OK</span>')
      :ct.condition==='speed'
      ?(pct<50?'<span style="color:#ff4040;font-size:8px">⚡ SPEED MISSED</span>':'<span style="color:#ffaa20;font-size:8px">⚡ SPEED BONUS</span>')
      :'';
    div.innerHTML=`<div class="rc-name">${ct.name}</div><div style="display:flex;gap:6px;align-items:center"><div class="rc-timer ${tc}">⏱ ${fmtTime(rem)}</div>${condStatus}</div><div class="rc-obj">${ct.objectives.map(o=>`<div class="${o.done?'obj-done':o.failed?'obj-fail':''}">${o.done?'✓':o.failed?'✗':'▸'} ${o.desc.slice(0,28)}</div>`).join('')}</div>`;
    if(el)el.appendChild(div);
    if(selEl&&S.running){const d2=div.cloneNode(true);selEl.appendChild(d2);}
  });
}

function renderPrograms(){
  const el=document.getElementById('prog-list');if(!el)return;el.innerHTML='';
  const inst=runInst();const inv=runInv();
  inst.forEach(iid=>{
    const it=inv.find(x=>x.instId===iid);const d=it?pdef(it.defId):null;if(!d)return;
    const div=document.createElement('div');div.className='pr-row';
    div.innerHTML=`<span class="pr-icon">${d.icon}</span><div style="flex:1;min-width:0"><span class="pr-name">${d.name}</span><span class="pr-ch" style="color:#2a6a3a;margin-left:auto">on</span></div>`;
    el.appendChild(div);
  });
}

function renderRunRAM(){renderPrepRAM();}

function renderRunner(){
  const iMax=maxInt();
  const hp=document.getElementById('r-hp');if(hp)hp.textContent=`${S.integrity}/${iMax}`;
  const hpb=document.getElementById('r-hp-bar');if(hpb){hpb.style.width=`${(S.integrity/iMax)*100}%`;hpb.style.background=S.integrity<iMax*0.3?'#c04040':S.integrity<iMax*0.6?'#c08020':'#20c040';}
  const tr=document.getElementById('r-trace');if(tr)tr.textContent=`${S.trace}%`;
  const trb=document.getElementById('r-trace-bar');if(trb)trb.style.width=`${S.trace}%`;
  const ra=document.getElementById('r-alert');
  const alertColors=['#40c060','#ffd040','#ff4020'];
  const alertCol=alertColors[S.alert];
  if(ra){
    const pressure=S.alertPressure||0;
    const alertName=['GREEN','YELLOW','RED'][S.alert];
    const levelMin=[0,PRESSURE_YELLOW,PRESSURE_RED][S.alert];
    const levelMax=[PRESSURE_YELLOW,PRESSURE_RED,PRESSURE_MAX][S.alert];
    const withinLevel=Math.round(((pressure-levelMin)/(levelMax-levelMin))*100);
    ra.textContent=`${alertName} ${Math.max(0,Math.min(100,withinLevel))}%`;
    ra.style.color=alertCol;
  }
  // Alert pressure bar — fills 0→100% across ALL pressure (not within-level)
  const rab=document.getElementById('r-alert-bar');
  if(rab){
    const pressure=S.alertPressure||0;
    const pct=Math.round((pressure/PRESSURE_MAX)*100);
    rab.style.width=pct+'%';
    rab.style.background=alertCol;
  }
}

function renderBoard(){
  const el=document.getElementById('contract-board');el.innerHTML='';

  // Sort controls
  if(!window._boardSort)window._boardSort='reward';
  const sortBar=document.createElement('div');
  sortBar.style.cssText='display:flex;gap:4px;margin-bottom:5px;flex-shrink:0;';
  sortBar.innerHTML=['reward','diff','subfac'].map(s=>
    `<button class="spd-btn ${window._boardSort===s?'active':''}" onclick="window._boardSort='${s}';renderBoard()" style="flex:1;font-size:7px">${s==='reward'?'₵ REWARD':s==='diff'?'DIFF':'FACTION'}</button>`
  ).join('');
  el.appendChild(sortBar);

  // Sort board
  let sorted=[...S.board];
  if(window._boardSort==='reward')sorted.sort((a,b)=>b.reward.cred-a.reward.cred);
  else if(window._boardSort==='diff')sorted.sort((a,b)=>b.diff-a.diff);
  else if(window._boardSort==='subfac')sorted.sort((a,b)=>(a.subfac||'').localeCompare(b.subfac||''));
  sorted.forEach(ct=>{
    const div=document.createElement('div');div.className='cc'+(ct.taken?' taken':'');
    const flavorColors={CORPORATE:'#6080c0',CRIMINAL:'#c08040',ANARCHIST:'#c04040',NEUTRAL:'#60a060'};
    const fcol=flavorColors[ct.flavor]||'#60a060';
    const sf=ct.subfac?SUBFACTIONS[ct.subfac]:null;
    const sfColor=sf?.color||fcol;
    const sfName=sf?.name||ct.flavor;
    const sfRep=ct.subfac?(S.subrep?.[ct.subfac]||0):0;
    const parentKey=sf?sf.parent:null;
    const parentRep=parentKey?S.rep[parentKey]||0:0;
    const effectiveRep=Math.max(sfRep,parentRep);
    const repLocked=ct.repReq>0&&effectiveRep<ct.repReq;
    div.style.opacity=repLocked?'0.4':'1';
    div.innerHTML=`<div class="cc-diff" style="color:${['','#60c080','#80a0ff','#ff8040','#ff2040'][ct.diff]||'#60c080'}">${['','◈','◈◈','◈◈◈','☠'][ct.diff]||'◈'}</div>
      <div style="font-size:7px;font-family:'Orbitron',monospace;color:${sfColor};margin-bottom:2px">${sfName}</div>
      <div style="font-size:6px;color:#1a3a1a;margin-bottom:2px">${repLocked?'<span style="color:#c04040">🔒 Needs '+ct.repReq+' rep</span>':sfRep+' rep'}</div>
      <div class="cc-body"><div class="cc-name">${ct.name}</div><div class="cc-objs">${ct.objectives.map(o=>`▸ ${o.desc}`).join('<br>')}</div>
      <div class="cc-meta">
          <span class="ctag tg">₵${ct.reward.cred}${ct.condition?'+':''}${ct.reward.bonusCred>0?ct.reward.bonusCred:''}</span>
          <span class="ctag td" title="At 1x speed">⏱${fmtTime(ct.duration)}</span>
          ${ct.condition==='stealth'?'<span class="ctag" style="background:#0a0a1a;border:1px solid #2a2a5a;color:#6060ff">◌ STEALTH</span>':''}
          ${ct.condition==='speed'?'<span class="ctag" style="background:#1a0a00;border:1px solid #5a3a00;color:#ffaa20">⚡ SPEED</span>':''}
          ${ct.repReq>0?`<span class="ctag tr">REP:${ct.repReq}</span>`:''}
          ${ct.objectives.filter(o=>o.file).length?`<span class="ctag tr">RAM:${ct.objectives.filter(o=>o.file).length}</span>`:''}
        </div></div>
      <button class="take-btn ${ct.taken?'drop':''}" onclick="event.stopPropagation();toggleContract('${ct.id}')">${ct.taken?'◎ DROP':'◉ RUN'}</button>`;
    div.addEventListener('click',()=>toggleContract(ct.id));el.appendChild(div);
  });
}

function renderSelPanel(){
  const el=document.getElementById('sel-list');if(!el)return;
  el.innerHTML=S.active.length===0?'<span style="color:#1a3a1a;font-size:9px">— no contract selected —</span>':S.active.map(ct=>`<div class="sl-row">${ct.name}<div class="sl-rew">₵${ct.reward.cred}</div></div>`).join('');
  const sc=document.getElementById('sel-cred');if(sc)sc.textContent=S.active.reduce((a,c)=>a+c.reward.cred,0)+'₵';
}

function renderPrepRAM(){
  // File RAM (deckRAM) — shown in run sidebar only, NOT the topbar RAM stat
  const used=S.deckRAM.length,max=S.deckRAMMax;
  const rl=document.getElementById('run-ram-lbl');if(rl)rl.textContent=`${used}/${max}`;
  const rb=document.getElementById('run-ram-bar');if(rb)rb.style.width=`${(used/max)*100}%`;
  const rf=document.getElementById('run-files');
  if(rf)rf.innerHTML=S.deckRAM.length===0?'<span style="color:#1a3a1a;font-size:8px">empty</span>':
    S.deckRAM.map(f=>`<div style="font-size:8px;color:#60aaa0">${fLabel(f)}</div>`).join('');
}

function renderDeck(){
  const hwEl=document.getElementById('hw-list');if(!hwEl)return;
  hwEl.innerHTML='';
  // Show only owned decks + filter by rarity gating for upgrade hints
  const ownedDecks=HARDWARE.filter(h=>S.ownedHW.includes(h.id));
  ownedDecks.forEach(h=>{
    const active=S.hardware===h.id;
    const m=MANUFACTURERS[h.mfr]||{};
    const div=document.createElement('div');
    div.className='hw-card'+(active?' active-hw':'');
    div.innerHTML=`<div class="hw-name" style="color:${h.color}">${h.icon} ${h.name}</div>
<div style="font-size:7px;color:${h.mfrColor};margin-bottom:2px">${DECK_RARITY[h.rarity]?.name||''} · ${m.name||''}</div>
<div class="hw-stats">RAM <span class="hw-sv">${h.ram}</span> · INT+<span class="hw-sv">${h.integrity}</span> · SPD <span class="hw-sv">${h.spd}</span> · Slots <span class="hw-sv">${h.slots}</span></div>
<div style="font-size:7px;color:#2a5a2a;margin-top:2px">${h.sigPerk?'★ '+h.sigPerk:h.desc}</div>
${active?'<div style="font-size:8px;color:#40ff80;margin-top:3px">● ACTIVE</div>'
  :`<button class="buy-btn" style="margin-top:3px" onclick="equipHW('${h.id}')">Equip</button>`}`;
    hwEl.appendChild(div);
  });
  // Credit sinks panel
  const sinkDiv=document.createElement('div');
  sinkDiv.style.cssText='margin-top:8px;padding:6px;background:#0a1218;border:1px solid #1a2a1a;border-radius:4px;';
  sinkDiv.innerHTML='<div class="ptitle" style="font-size:8px;margin-bottom:5px">SERVICES</div>'
    +'<div style="display:flex;gap:4px;flex-wrap:wrap">'
    +`<button class="buy-btn" onclick="buyBoardRefresh()" title="Refresh contract board">↺ Refresh (${CREDIT_SINKS.board_refresh.cost}₵)</button>`
    +`<button class="buy-btn" onclick="buyIntel()" title="Reveal ICE on next run">⊙ Intel (${CREDIT_SINKS.intel.cost}₵)</button>`
    +`<button class="buy-btn" onclick="buyTraceScrub()" title="Remove 20% trace">◎ Scrub (${CREDIT_SINKS.trace_scrub.cost}₵)</button>`
    +'</div>';
  hwEl.appendChild(sinkDiv);
  const used=ramUsed(),max=ramMax();
  const rl=document.getElementById('ram-label');if(rl)rl.textContent=`${used}/${max}`;
  const asl=document.getElementById('attach-slots-label');if(asl)asl.textContent=`${(S.attachments||[]).length}/${attachSlots()} used`;
  const vis=document.getElementById('ram-vis');if(vis){vis.innerHTML='';
    for(let i=0;i<max;i++){const s=document.createElement('div');const p=used/max;s.className='rs'+(i<used?(p>0.85?' ov':p>0.65?' uh':' u'):'');s.textContent=i<used?'▪':'';vis.appendChild(s);}}
  // Render attachment slots
  const attEl=document.getElementById('attachment-slots');
  if(attEl){
    const slots=attachSlots();
    const installed=S.attachments||[];
    let attHtml='';
    for(let i=0;i<slots;i++){
      const att=installed.find(a=>a.slotIdx===i);
      const def=att?ATTACHMENTS[att.attachId]:null;
      if(def){
        attHtml+=`<div class="attach-row">
          <span class="attach-icon">${def.icon}</span>
          <div class="attach-body"><div class="attach-name">${def.name}</div><div class="attach-desc">${def.desc}</div></div>
          <button class="eject-btn" onclick="removeAttach('${att.attachId}');renderDeck();autoSave()">✗</button>
        </div>`;
      }else{
        attHtml+=`<div class="attach-row attach-empty"><span style="color:#1a3a1a">Slot ${i+1} — empty</span></div>`;
      }
    }
    attEl.innerHTML=attHtml;
  }

  const instEl=document.getElementById('installed-list');if(!instEl)return;
  instEl.innerHTML='';
  if(S.installed.length===0){instEl.innerHTML='<div style="color:#1a3a1a;font-size:9px;padding:8px 0">No programs installed. Go to INV tab.</div>';return;}
  S.installed.forEach(iid=>{
    const it=S.inventory.find(x=>x.instId===iid);const d=it?pdef(it.defId):null;if(!d)return;
    const row=document.createElement('div');row.className='inst-row';
    row.innerHTML=`<span class="ir-icon">${d.icon}</span>
<div class="ir-body"><div class="ir-name">${d.name} <span class="${['','t1','t2','t3'][d.tier]||'t1'}">${['','Mk1','Mk2','Mk3'][d.tier]||''}</span>${d.passive?'<span style="font-size:7px;margin-left:4px;color:#2a6a2a">P</span>':''}</div>
<div class="ir-meta">${d.desc.slice(0,38)}</div></div>
<span style="font-size:8px;color:#40aaff">M:${d.mem}</span>
${d.str?`<span style="font-size:8px;color:#ffdd40">S:${d.str}</span>`:''}
<button class="eject-btn" onclick="ejectProg('${iid}')">EJECT</button>`;
    instEl.appendChild(row);
  });
}

function renderMarket(){
  const faction=S.activeMkt;
  const el=document.getElementById('mkt-content');if(!el)return;

  // Ensure shop is initialised
  if(!S.shop[faction]||S.shop[faction].length===0) initShop(faction);

  const isCred=faction==='gen';
  const repKey={corp:'corp',crim:'crim',anarch:'anarch'}[faction];
  const repHave=repKey?S.rep[repKey]||0:999;
  const repNeed=100;
  window._mktShowAll=window._mktShowAll||{};
  const showAll=window._mktShowAll[faction]||false;
  const rotStock=(S.shop[faction]||[]).map(x=>x.defId).filter(id=>pdef(id));
  const allStock=typeof eligibleItems==='function'?eligibleItems(faction):rotStock;
  const stock=showAll?allStock:rotStock;

  // Header with rotation countdown
  let html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:8px;color:#2a5a3a;">
    <span>${stock.length} items listed</span>
    <span style="color:#3a6a3a">↺ rotates in <span id="mkt-cd-${faction}">${timeToRotate(faction)}</span></span>
  </div>`;

  if(!isCred&&repHave<repNeed){
    html+=`<div style="padding:8px;color:#6a3a1a;font-size:9px;border:1px solid #3a2a10;border-radius:4px;margin-bottom:8px;background:#0d0a06">
      Requires ${repNeed} ${faction} rep. You have ${repHave}. Complete ${faction.toUpperCase()} contracts to gain access.
    </div>`;
  }

  const br=stock.filter(id=>{const d=pdef(id);return d&&d.cat==='breaker';});
  const ut=stock.filter(id=>{const d=pdef(id);return d&&d.cat==='utility';});
  if(br.length)html+=`<div style="font-size:9px;color:#40c060;margin-bottom:6px;font-family:'Orbitron',monospace">Icebreakers</div><div class="shop-grid" id="sg-br"></div>`;
  if(ut.length)html+=`<div style="font-size:9px;color:#40c060;margin-bottom:6px;margin-top:8px;font-family:'Orbitron',monospace">Utility Programs</div><div class="shop-grid" id="sg-ut"></div>`;
  el.innerHTML=html;

  const mkCards=(ids,gid)=>{
    const g=document.getElementById(gid);if(!g)return;
    ids.forEach(defId=>{
      const d=pdef(defId);if(!d)return;
      if(d.prestigeReq&&S.prestige<d.prestigeReq)return;
      const owned=S.inventory.some(x=>x.defId===defId);
      const cost=isCred?d.cost:Math.floor(d.cost*0.5);
      const canBuy=isCred?S.cred>=cost:(repHave>=repNeed&&S.cred>=cost);
      // Age indicator — how long this item has been listed
      const entry=S.shop[faction].find(x=>x.defId===defId);
      const ageMs=entry?Date.now()-entry.listedAt:0;
      const ageStr=ageMs>60000?`${Math.floor(ageMs/60000)}m`:'new';
      const card=document.createElement('div');card.className='sc';
      card.innerHTML=`<div class="sc-head">
          <span class="sc-icon">${d.icon}</span>
          <div style="flex:1">
            <div class="sc-name">${d.name}</div>
            <span class="${['','t1','t2','t3'][d.tier]||'t1'}">${['','Mk1','Mk2','Mk3'][d.tier]||''}</span>
          </div>
          <span style="font-size:7px;color:#1a4a1a;margin-left:4px">${ageStr==='new'?'<span style="color:#40c060">NEW</span>':ageStr}</span>
        </div>
        <div class="sc-desc">${d.desc}</div>
        <div class="sc-stats">
          <span class="sc-stat">MEM <span>${d.mem}</span></span>
          ${d.str?`<span class="sc-str">STR <span>${d.str}</span></span>`:''}
          ${d.power?`<span class="sc-stat">PWR <span>${d.power}</span></span>`:''}
        </div>
        <div class="sc-foot">
          <span class="sc-cost">${cost}₵</span>
          ${owned
            ?'<span style="font-size:8px;color:#2a6a2a">✓ OWNED</span>'
            :`<button class="buy-btn" ${canBuy?'':'disabled'} onclick="buyProg('${defId}','${faction}')">BUY</button>`
          }
        </div>`;
      card.addEventListener('mouseenter',e=>ttShow(ttProgram(d),e));
      card.addEventListener('mouseleave',ttHide);
      g.appendChild(card);
    });
  };
  mkCards(br,'sg-br');mkCards(ut,'sg-ut');

  // Decks section — show manufacturer-aligned decks
  const deckMfrs=Object.entries(DECK_MFR_FACTION).filter(([m,f])=>f===faction).map(([m])=>m);
  if(deckMfrs.length){
    const deckSection=document.createElement('div');
    deckSection.innerHTML=`<div style="font-size:9px;color:#40c060;margin-bottom:6px;margin-top:10px;font-family:'Orbitron',monospace">Deck Hardware</div>`;
    const deckGrid=document.createElement('div');deckGrid.className='shop-grid';
    const purchasableRarities=['common','uncommon','rare','legendary']; // mythic = craft only
    deckMfrs.forEach(mfr=>{
      purchasableRarities.forEach(rar=>{
        const deck=HARDWARE.find(h=>h.mfr===mfr&&h.rarity===rar);
        if(!deck)return;
        const lvlOk=S.level>=deck.lvl;
        const presOk=(deck.prestigeReq||0)<=S.prestige;
        const repOk=isCred||(repHave>=repNeed);
        const credOk=S.cred>=deck.cost;
        const owned=S.ownedHW.includes(deck.id);
        const canBuy=lvlOk&&presOk&&repOk&&credOk&&!owned;
        const card=document.createElement('div');card.className='sc';
        const blocker=!lvlOk?`Lv${deck.lvl}`:!presOk?`P${deck.prestigeReq}`:!repOk?'Rep':owned?'Owned':'';
        card.innerHTML=`<div class="sc-head">
          <span class="sc-icon" style="color:${deck.mfrColor}">${deck.icon}</span>
          <div><div class="sc-name" style="color:${deck.color}">${deck.name}</div>
          <span style="font-size:7px;color:${deck.mfrColor}">${MANUFACTURERS[deck.mfr]?.name||''}</span></div>
        </div>
        <div style="font-size:8px;color:#2a4a2a;margin:3px 0">RAM:${deck.ram} INT:+${deck.integrity} SPD:${deck.spd} Slots:${deck.slots}</div>
        <div class="sc-desc">${deck.sigPerk||deck.desc}</div>
        <div class="sc-foot"><span class="sc-cost">${deck.cost.toLocaleString()}₵</span>
          ${owned?'<span style="font-size:8px;color:#2a6a2a">✓ OWNED</span>'
            :blocker&&blocker!=='Owned'?`<span style="font-size:8px;color:#6a3a1a">${blocker}</span>`
            :`<button class="buy-btn" ${canBuy?'':'disabled'} onclick="buyHW('${deck.id}')">BUY</button>`}
        </div>`;
        card.addEventListener('mouseenter',e=>ttShow(ttDeck(deck),e));
        card.addEventListener('mouseleave',ttHide);
        deckGrid.appendChild(card);
      });
    });
    deckSection.appendChild(deckGrid);el.appendChild(deckSection);
  }

  // BLACK MARKET section (all factions, rotates slowly)
  if(faction==='gen'){
    const bmSection=document.createElement('div');
    bmSection.innerHTML=`<div style="font-size:9px;color:#c0a000;margin-bottom:6px;margin-top:10px;font-family:'Orbitron',monospace">⚠ Black Market <span style="font-size:7px;color:#6a5a00">(no rep required, premium prices)</span></div>`;
    const bmGrid=document.createElement('div');bmGrid.className='shop-grid';
    const bmItems=S._bmRotation||[];
    bmItems.forEach(item=>{
      const discountMult=S._neutralLegend?0.8:1.0;
      const price=Math.floor((item.baseCost||5000)*discountMult);
      const credOk=S.cred>=price;
      const card=document.createElement('div');card.className='sc';
      let canBuy=credOk,owned=false,label=item.name,detail='',buyFn='';
      if(item.type==='program'){
        const d=pdef(item.defId);
        owned=S.inventory.some(x=>x.defId===item.defId);
        const presOk=!d?.prestigeReq||S.prestige>=(d.prestigeReq||0);
        canBuy=credOk&&!owned&&presOk;
        detail=d?`MEM ${d.mem}${d.str?' STR '+d.str:''}${d.power?' P'+d.power:''}`:item.defId;
        buyFn=`buyBMItem('${item.id}')`;
      }else if(item.type==='attach'){
        const a=ATTACHMENTS[item.attachId];
        owned=(S.attachments||[]).some(x=>x.attachId===item.attachId);
        canBuy=credOk&&!owned;
        detail=a?`${a.effect} +${a.power}`:item.attachId;
        buyFn=`buyBMItem('${item.id}')`;
      }else if(item.type==='deck'){
        const dk=HARDWARE.find(h=>h.id===item.deckId);
        owned=S.ownedHW.includes(item.deckId||'');
        canBuy=credOk&&!owned&&dk;
        detail=dk?`RAM:${dk.ram} INT:+${dk.integrity} Slots:${dk.slots}`:'';
        buyFn=`buyBMItem('${item.id}')`;
      }
      card.innerHTML=`<div class="sc-head"><span class="sc-icon" style="color:#c0a000">⚠</span>
        <div><div class="sc-name" style="color:#c0a000">${label}</div>
        <span style="font-size:7px;color:#6a5000">${item.desc||''}</span></div></div>
        <div style="font-size:8px;color:#4a4a00;margin:2px 0">${detail}</div>
        <div class="sc-foot"><span class="sc-cost" style="color:#c0a000">${price.toLocaleString()}₵</span>
        ${owned?'<span style="font-size:8px;color:#2a4a2a">✓</span>'
          :`<button class="buy-btn" ${canBuy?'':'disabled'} onclick="${buyFn}">BUY</button>`}</div>`;
      card.addEventListener('mouseenter',e=>ttShow(`<div style="color:#c0a000;font-size:10px">⚠ ${label}</div><br><span style="color:#6a5000">${item.desc}</span><br><br>Cost: <span style="color:#c0a000">${price.toLocaleString()}₵</span>${S._neutralLegend?'<br><span style="color:#40ff80">Neutral Legend: -20%</span>':''}`,e));
      card.addEventListener('mouseleave',ttHide);
      bmGrid.appendChild(card);
    });
    bmSection.appendChild(bmGrid);el.appendChild(bmSection);
  }

  // Attachments section
  const attachIds=(ATTACH_MARKET[faction]||[]);
  if(attachIds.length){
    const attSection=document.createElement('div');
    attSection.innerHTML=`<div style="font-size:9px;color:#40c060;margin-bottom:6px;margin-top:10px;font-family:'Orbitron',monospace">Deck Attachments</div>`;
    const attGrid=document.createElement('div');attGrid.className='shop-grid';
    attachIds.forEach(aid=>{
      const a=ATTACHMENTS[aid];if(!a)return;
      const cost=isCred?a.cost:Math.floor(a.cost*0.5);
      const installed=(S.attachments||[]).some(x=>x.attachId===aid);
      const canBuy=isCred?S.cred>=cost:(repHave>=repNeed&&S.cred>=cost);
      const slotsLeft=(S.attachments||[]).length<attachSlots();
      const card=document.createElement('div');card.className='sc';
      card.innerHTML=`<div class="sc-head">
          <span class="sc-icon">${a.icon}</span>
          <div><div class="sc-name">${a.name}</div><span style="font-size:7px;color:#40aaff">HW Mod</span></div>
        </div>
        <div class="sc-desc">${a.desc}</div>
        <div class="sc-foot">
          <span class="sc-cost">${cost}₵</span>
          ${installed?'<span style="font-size:8px;color:#2a6a2a">✓ INSTALLED</span>'
            :!slotsLeft?'<span style="font-size:8px;color:#6a3a1a">No slots</span>'
            :`<button class="buy-btn" ${canBuy?'':'disabled'} onclick="buyAttach('${aid}','${faction}')">BUY</button>`}
        </div>`;
      card.addEventListener('mouseenter',e=>ttShow(ttAttachment(a),e));
      card.addEventListener('mouseleave',ttHide);
      attGrid.appendChild(card);
    });
    attSection.appendChild(attGrid);
    el.appendChild(attSection);
  }
}

function renderCraft(){
  const bpEl=document.getElementById('blueprint-list');
  if(!bpEl)return;
  bpEl.innerHTML='';
  const earnedCount=(S.earnedBps||[]).filter(id=>!S.craftedBps.includes(id)).length;
  const starterAvail=typeof STARTER_BPS!=='undefined'?BLUEPRINTS.filter(bp=>STARTER_BPS.includes(bp.id)&&!S.craftedBps.includes(bp.id)).length:0;
  const totalVisible=starterAvail+earnedCount;
  if(totalVisible===0){
    bpEl.innerHTML='<div style="color:#1a3a1a;font-size:9px">No blueprints available. Find them in datastores and high-diff contracts.</div>';
    // Still render detail + active crafts below
  }

  function canShowBlueprint(bp){
    if(S.craftedBps.includes(bp.id))return false;   // already crafted
    // Starters always visible; all others require discovery
    if(typeof STARTER_BPS!=='undefined'&&!STARTER_BPS.includes(bp.id)){
      if(!S.earnedBps.includes(bp.id))return false;  // not yet discovered
    }
    if((bp.prestigeReq||0)>S.prestige)return false;  // prestige-locked
    if(bp.isDeck&&S.prestige<4)return false;           // mythic deck gate
    return true;
  }

  BLUEPRINTS.filter(canShowBlueprint).forEach(bp=>{
    const result=pdef(bp.result);
    const isCrafting=S.crafting.some(x=>x.blueprintId===bp.id&&!x.done);
    const isDone=S.crafting.some(x=>x.blueprintId===bp.id&&x.done);
    const canAfford=S.cred>=bp.credCost;
    const div=document.createElement('div');
    div.className='blueprint-card'+(S.selectedBlueprint===bp.id?' sel':'');
    div.innerHTML=`<div class="bp-name">${result?.icon||'?'} ${bp.name}</div>
      <div class="bp-result" style="color:#3a6a3a;font-size:8px">${bp.craftTime}s · ${bp.credCost}₵</div>
      <div class="bp-status ${isCrafting?'bp-crafting':isDone?'bp-ready':''}">${isCrafting?'▸ CRAFTING':isDone?'✓ READY TO COLLECT':'● AVAILABLE'}</div>`;
    div.onclick=()=>{S.selectedBlueprint=bp.id;renderCraft();};
    div.addEventListener('mouseenter',e=>ttShow(ttBlueprint(bp),e));
    div.addEventListener('mouseleave',ttHide);
    bpEl.appendChild(div);
  });

  // Detail panel
  const dw=document.getElementById('craft-detail-wrap');
  if(!S.selectedBlueprint){
    if(dw)dw.innerHTML='<div style="color:#1a3a1a;font-size:10px;padding:8px 0">Select a blueprint to craft</div>';
  }else{
    const bp=BLUEPRINTS.find(x=>x.id===S.selectedBlueprint);
    // If selected blueprint is no longer visible (crafted/not earned), clear selection
    if(!bp||!canShowBlueprint(bp)){S.selectedBlueprint=null;if(dw)dw.innerHTML='<div style="color:#1a3a1a;font-size:10px;padding:8px 0">Select a blueprint to craft</div>';return;}
    const result=pdef(bp.result);
    if(!dw){return;}
    const isCrafting=S.crafting.some(x=>x.blueprintId===bp.id&&!x.done);
    const canAfford=S.cred>=bp.credCost;
    dw.innerHTML=`<div class="craft-detail">
      <div class="cd-title">${result?.icon||'?'} ${bp.name}</div>
      <div style="display:flex;gap:12px;font-size:9px;color:#3a6a3a;margin-bottom:10px;">
        <span>⏱ ${bp.craftTime}s</span>
        <span style="color:${canAfford?'#40c060':'#c04040'}">₵ ${bp.credCost}${canAfford?'':' (need '+(bp.credCost-S.cred)+' more)'}</span>
      </div>
      <div style="font-size:9px;color:#2a5a2a;margin-bottom:8px">${result?.desc||''}</div>
      <div style="font-size:8px;color:#1a4a1a;margin-bottom:8px">
        Result: ${result?.name||'?'} · MEM ${result?.mem||'?'}${result?.str?' · STR '+result.str:''}${result?.power?' · PWR '+result.power:''}
      </div>
      <button class="craft-btn" ${canAfford&&!isCrafting?'':'disabled'} onclick="startCraft('${bp.id}')">
        ${isCrafting?'▸ IN PROGRESS':canAfford?'⚙ CRAFT NOW':'✗ INSUFFICIENT CRED'}
      </button>
    </div>`;
  }

  // Active crafts
  const ac=document.getElementById('active-crafts');
  if(!ac)return;
  if(!S.crafting||S.crafting.length===0){
    ac.innerHTML='<div style="color:#1a3a1a;font-size:9px">No active crafts</div>';
    return;
  }
  ac.innerHTML='';
  S.crafting.forEach(c=>{
    const bp=BLUEPRINTS.find(x=>x.id===c.blueprintId);
    const now=Date.now();
    const elapsed=now-c.startTime;
    const pct=Math.min(100,(elapsed/c.craftTime)*100);
    const remaining=Math.max(0,Math.ceil((c.craftTime-elapsed)/1000));
    c.done=elapsed>=c.craftTime;
    const div=document.createElement('div');div.className='active-craft';
    div.innerHTML=`<div class="ac-name">${bp?.name||'Crafting...'}</div>
      <div class="ac-timer">${c.done?'✓ COMPLETE':remaining+'s remaining'}</div>
      <div class="craft-bar"><div class="craft-fill" style="width:${pct}%"></div></div>
      ${c.done?`<button class="collect-btn" onclick="collectCraft('${c.id}')">▸ Collect</button>`:''}`;
    ac.appendChild(div);
  });
}


function renderInventory(){
  const el=document.getElementById('inv-grid');
  if(!el)return;
  document.getElementById('inv-ct').textContent=`(${S.inventory.length})`;
  el.innerHTML='';
  const used=ramUsed(),max=ramMax();

  // RAM usage bar
  const ramDiv=document.createElement('div');
  ramDiv.style.cssText='margin-bottom:8px;';
  ramDiv.innerHTML=`<div style="display:flex;justify-content:space-between;font-size:8px;color:#3a6a3a;margin-bottom:3px">
    <span>RAM</span><span style="color:#40aaff">${used}/${max}</span>
  </div>
  <div style="height:4px;background:#1a2a1a;border-radius:2px;overflow:hidden">
    <div style="height:100%;width:${Math.round(used/max*100)}%;background:#40aaff;border-radius:2px"></div>
  </div>`;
  el.appendChild(ramDiv);

  // Group by category
  const groups={breaker:[],utility:[]};
  const seen={};
  S.inventory.forEach(it=>{
    if(!seen[it.defId])seen[it.defId]={d:pdef(it.defId),items:[]};
    seen[it.defId].items.push(it);
  });
  Object.values(seen).forEach(({d,items})=>{
    if(!d)return;
    if(d.cat==='breaker')groups.breaker.push({d,items});
    else groups.utility.push({d,items});
  });
  // Sort each group by tier desc
  groups.breaker.sort((a,b)=>(b.d.tier||0)-(a.d.tier||0));
  groups.utility.sort((a,b)=>(b.d.tier||0)-(a.d.tier||0));

  ['breaker','utility'].forEach(cat=>{
    if(!groups[cat].length)return;
    const header=document.createElement('div');
    header.style.cssText='font-size:8px;color:#2a6a3a;letter-spacing:1px;text-transform:uppercase;padding:4px 0 3px;border-bottom:1px solid #1a2a1a;margin-bottom:4px;font-family:Orbitron,monospace;';
    header.textContent=cat==='breaker'?'Breakers':'Utility';
    el.appendChild(header);

    groups[cat].forEach(({d,items})=>{
      const uninst=items.filter(x=>!x.installed);
      const inst=items.filter(x=>x.installed);
      const isRunning=S.running;
      const tierLabel=['','Mk1','Mk2','Mk3','Mk4','Mk5','Mk6'][d.tier]||'';
      const disabled=(S._disabledProgs||[]).some(iid=>inst.some(it=>it.instId===iid));

      const card=document.createElement('div');
      card.className='inv-card';
      card.style.cssText=`opacity:${disabled?0.5:1};`;

      const statParts=[];
      if(d.mem)statParts.push(`MEM ${d.mem}`);
      if(d.str)statParts.push(`STR ${d.str}`);
      if(d.power)statParts.push(`PWR ${d.power}`);
      if(d.pressureRate)statParts.push(`SOOTHE ${d.pressureRate}/${d.urgentRate}`);

      card.innerHTML=`
        <div style="display:flex;align-items:flex-start;gap:5px">
          <span style="font-size:16px;color:#40aaff">${d.icon}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:9px;color:#60c080">${d.name} <span style="color:#1a4a2a;font-size:7px">${tierLabel}</span>${disabled?'<span style="color:#884000;font-size:7px"> DISABLED</span>':''}</div>
            <div style="font-size:7px;color:#2a5a3a;margin:1px 0">${statParts.join(' · ')}</div>
            <div style="font-size:7px;color:#1a4a2a;line-height:1.4">${d.desc}</div>
            <div style="font-size:7px;color:#1a3a2a;margin-top:2px">${inst.length} installed · ${uninst.length} available</div>
          </div>
        </div>
        <div class="inv-actions" style="margin-top:4px;display:flex;gap:4px">
          ${uninst.length&&!isRunning?`<button class="inv-btn" onclick="instProg('${uninst[0].instId}')">+ Install</button>`:''}
          ${uninst.length&&isRunning?`<button class="inv-btn" style="opacity:0.3" disabled title="Cannot install mid-run">+ Install</button>`:''}
          ${inst.length?`<button class="inv-btn d" onclick="ejectProg('${inst[0].instId}')" ${isRunning?'disabled style="opacity:0.3"':''}>− Eject</button>`:''}
        </div>`;

      card.addEventListener('mouseenter',e=>ttShow(ttProgram(d),e));
      card.addEventListener('mouseleave',ttHide);
      el.appendChild(card);
    });
  });

  if(!S.inventory.length){
    el.innerHTML+='<div style="color:#1a3a1a;font-size:9px;padding:8px">No programs in inventory.</div>';
  }
}

function renderStats(){
  const el=document.getElementById('stats-inner');if(!el)return;
  const st=S.stats||{};
  const fmtNum=n=>n==null?'0':(n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n||0));
  const fmtMs=ms=>ms?`${Math.floor(ms/60000)}m ${Math.floor((ms%60000)/1000)}s`:'—';
  const row=(label,val,sub)=>`<div style="display:flex;align-items:baseline;padding:3px 0;border-bottom:1px solid #0d1a0d">
    <span style="flex:1;font-size:8px;color:#3a6a3a">${label}</span>
    <span style="font-size:10px;color:#60c080;font-family:'Orbitron',monospace">${val}</span>
    ${sub?`<span style="font-size:7px;color:#2a4a2a;margin-left:6px">${sub}</span>`:''}
  </div>`;
  const winRate=st.runsStarted?Math.round((st.runsCompleted||0)/st.runsStarted*100)+'%':'—';
  const breakRate=(st.iceBreached||0)+(st.iceUnbreached||0)>0
    ?Math.round((st.iceBreached||0)/((st.iceBreached||0)+(st.iceUnbreached||0))*100)+'%':'—';
  el.innerHTML=`
    <div class="ptitle">Runs</div>
    ${row('Started',fmtNum(st.runsStarted))}
    ${row('Completed',fmtNum(st.runsCompleted),winRate+' win rate')}
    ${row('Failed',fmtNum(st.runsFailed))}
    ${row('Best run cred',fmtNum(st.bestRunCred)+'₵')}
    ${row('Longest run',fmtMs(st.longestRun))}
    <div class="ptitle" style="margin-top:8px">Combat</div>
    ${row('ICE breached',fmtNum(st.iceBreached))}
    ${row('ICE unbreached',fmtNum(st.iceUnbreached),breakRate+' break rate')}
    ${row('Hunters destroyed',fmtNum(st.huntersKilled))}
    ${row('Damage received',fmtNum(st.totalDamageReceived)+' INT')}
    ${row('Alert raises',fmtNum(st.totalAlertRaises))}
    <div class="ptitle" style="margin-top:8px">Contracts</div>
    ${row('Completed',fmtNum(st.contractsCompleted))}
    ${row('Failed',fmtNum(st.contractsFailed||0))}
    <div class="ptitle" style="margin-top:8px">Grid</div>
    ${row('Nodes visited',fmtNum(st.nodesVisited))}
    ${row('Files downloaded',fmtNum(st.filesDownloaded))}
    ${row('Data value',fmtNum(st.credFromFiles)+'₵')}
    ${row('Traps triggered',fmtNum(st.trapsTriggered))}
    <div class="ptitle" style="margin-top:8px">Lifetime</div>
    ${row('Total cred earned',fmtNum(S.totalCred)+'₵')}
    ${row('Current level','Lv '+S.level)}
    ${row('Prestige','P'+S.prestige)}
  `;
}

function renderAchievements(){
  const el=document.getElementById('ach-inner');if(!el)return;
  if(typeof initAchievements==='function')initAchievements();
  const cats={run:'Run Feats',prog:'Milestones',disc:'Discoveries'};
  const unlocked=Object.values(ACHIEVEMENTS).filter(a=>hasAch(a.id)).length;
  const total=Object.values(ACHIEVEMENTS).length;
  let html=`<div style="font-size:9px;color:#3a6a3a;margin-bottom:4px">${unlocked}/${total} unlocked</div>`;
  html+=`<div style="height:4px;background:#1a2a1a;border-radius:2px;margin-bottom:10px">
    <div style="height:100%;width:${Math.round(unlocked/total*100)}%;background:#40ff80;border-radius:2px"></div>
  </div>`;
  Object.entries(cats).forEach(([cat,catName])=>{
    const achs=Object.values(ACHIEVEMENTS).filter(a=>a.cat===cat);
    html+=`<div class="ptitle" style="margin-top:6px">${catName}</div>`;
    html+=achs.map(a=>{
      const done=hasAch(a.id);
      const when=done?new Date(S.achievements[a.id].unlockedAt).toLocaleDateString():'';
      return `<div style="display:flex;align-items:center;gap:6px;padding:4px 6px;margin-bottom:2px;
        background:${done?'#0a1a0a':'#080d10'};border:1px solid ${done?'#1a4a1a':'#0d1a0d'};border-radius:3px;opacity:${done?1:0.4}">
        <span style="font-size:13px;width:20px;text-align:center">${a.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:9px;color:${done?'#40ff80':'#3a5a3a'}">${a.name}</div>
          <div style="font-size:7px;color:#2a4a2a">${a.desc}</div>
        </div>
        ${done?`<span style="font-size:7px;color:#1a4a1a;white-space:nowrap">${when}</span>`:''}
      </div>`;
    }).join('');
  });
  el.innerHTML=html;
}

function renderProgressionScreen(){
  const el=document.getElementById('prog-inner');if(!el)return;
  const lvl=S.level,xp=S.xp,nXP=xpToLvl(lvl),pct=Math.round((xp/nXP)*100);
  const tier=curTier(),iMax=maxInt();
  const nextP=prestigeThresholds.find(t=>t>lvl);
  const presReady=canPrestige();
  const deck=hwdef();
  const tg=TIER_GRIDS[Math.min(tier,TIER_GRIDS.length)-1];

  let html='';

  // XP / Level
  html+=`<div class="xp-section">
    <div class="xp-header"><span class="xp-level">LVL ${lvl}</span><span class="xp-next">${xp.toLocaleString()}/${nXP.toLocaleString()} XP</span></div>
    <div class="xp-bar-wrap"><div class="xp-bar" style="width:${pct}%"></div></div>
    <div style="display:flex;justify-content:space-between;font-size:9px;color:#3a6a3a;margin-top:3px"><span>Prestige ${S.prestige}</span><span>T${tier} · ${tg[0]}×${tg[1]}</span></div>
    ${S.permIntLoss>0?`<div style="font-size:8px;color:#c04040;margin-top:3px">⚠ Perm INT loss: -${S.permIntLoss}</div>`:''}
    ${S.traceCarry>0?`<div style="font-size:8px;color:#aa6020;margin-top:2px">◎ Trace carry: ${S.traceCarry}%</div>`:''}
  </div>`;

  // Prestige
  html+=`<div class="prestige-section"><div class="ps-title">PRESTIGE · P${S.prestige}/10</div>`;
  html+=`<div style="font-size:8px;color:#6a5a00;margin-bottom:6px">${presReady?'★ Prestige available now!':'Next at Lv '+(nextP||'—')+' (current: '+lvl+')'}</div>`;
  const pBtns=prestigeThresholds.map((t,i)=>{
    const done=S.prestige>i,active=S.prestige===i&&lvl>=t,locked=!done&&!active;
    const col=done?'#40ff80':active?'#ffdd40':'#1a4a1a';
    const bg=done?'#0a1a0a':active?'#1a1500':'transparent';
    return `<span style="font-size:7px;padding:2px 5px;border-radius:2px;border:1px solid ${col};color:${col};background:${bg}">${done?'★':'○'} P${i+1} Lv${t}</span>`;
  });
  html+=`<div style="display:flex;gap:3px;flex-wrap:wrap;margin-bottom:8px">${pBtns.join('')}</div>`;
  html+=`<button class="prestige-btn" ${presReady?'':'disabled'} onclick="triggerPrestige()">${presReady?'★ PRESTIGE NOW':'Prestige at Lv'+(nextP||'???')}</button></div>`;

  // Stats
  html+=`<div class="stats-grid">
    <div class="stat-card"><div class="sc-label">MAX INT</div><div class="sc-value">${iMax}${S.permIntLoss?` <span style="color:#c04040;font-size:8px">-${S.permIntLoss}</span>`:''}</div><div class="sc-sub">HW+${deck?.integrity||0} P+${S.prestige}</div></div>
    <div class="stat-card"><div class="sc-label">TIER</div><div class="sc-value">T${tier}</div><div class="sc-sub">${tg[0]}×${tg[1]} grid</div></div>
    <div class="stat-card"><div class="sc-label">TOTAL RUNS</div><div class="sc-value">${S.totalRuns}</div><div class="sc-sub">All time</div></div>
    <div class="stat-card"><div class="sc-label">DECK</div><div class="sc-value" style="font-size:8px;color:${deck?.color||'#60c080'};line-height:1.3">${deck?.name||'—'}</div><div class="sc-sub">RAM ${deck?.ram||8}·Slots ${deck?.slots||1}</div></div>
  </div>`;

  // Prestige tree (which ICE/programs have been unlocked)
  html+=`<div style="background:#0a1218;border:1px solid #1a2a1a;border-radius:4px;padding:8px;margin-top:6px">
    <div class="ptitle">Prestige Unlocks</div>`;
  PRESTIGE_TREE.forEach(p=>{
    const unlocked=S.prestige>=p.n;
    const next=!unlocked&&S.prestige===p.n-1;
    html+=`<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #0d1a0d;opacity:${unlocked?1:next?0.7:0.3}">
      <span style="font-size:16px;width:22px;text-align:center">${unlocked?'★':next?'○':'·'}</span>
      <div style="flex:1">
        <div style="font-size:8px;color:${unlocked?'#40ff80':next?'#ffdd40':'#1a3a1a'}">P${p.n} — ${p.iceName} · ${p.progName}</div>
        <div style="font-size:7px;color:#2a4a2a">${p.iceDesc}</div>
        <div style="font-size:7px;color:#2a3a5a">${p.progDesc}</div>
      </div>
    </div>`;
  });
  html+=`</div>`;

  // Rep section
  html+=`<div style="background:#0a1218;border:1px solid #1a2a1a;border-radius:4px;padding:8px;margin-top:6px" id="rep-section-inner"></div>`;

  // Run history
  if(S.runHistory.length>0){
    html+=`<div style="background:#0a1218;border:1px solid #1a2a1a;border-radius:4px;padding:8px;margin-top:6px">
      <div class="ptitle">Recent Runs</div>
      ${S.runHistory.map(r=>{
  const sf=r.subfac?SUBFACTIONS[r.subfac]:null;
  const sfColor=sf?.color||'#3a6a3a';
  const sfName=sf?.name||r.flavor||'';
  return`<div class="run-row">
    <span class="rr-tier">T${r.tier}</span>
    <span class="rr-result ${r.success?'rr-win':'rr-loss'}">${r.success?'DONE':'BOOT'}</span>
    <span style="color:#40c060;width:56px">+${r.cred}₵</span>
    <span style="color:${sfColor};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7px">${sfName}</span>
  </div>`;}).join('')}
    </div>`;
  }

  el.innerHTML=html;

  // Rep section
  const repEl=document.getElementById('rep-section-inner');
  const repEl2=document.getElementById('rep-section-inner');
  if(repEl2){
    // Parent faction rep
    const repHtml=['corp','crim','anarch','neutral'].map(fac=>{
      const r=S.rep[fac]||0;
      const tier=repTier(fac);
      const next=REP_TIERS.find(t=>t.min>r);
      const pct=next?Math.round(((r-tier.min)/(next.min-tier.min))*100):100;
      const elite=isElite(fac);
      const colors={corp:'#6080c0',crim:'#c08040',anarch:'#c04040',neutral:'#60a060'};
      const col=colors[fac]||'#60a060';
      return '<div style="margin-bottom:8px">'
        +'<div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:3px">'
        +'<span style="color:'+col+';text-transform:uppercase;font-family:Orbitron,monospace">'+fac+'</span>'
        +'<span style="color:'+col+'">'+tier.name+'</span>'
        +'<span style="color:#3a6a3a">'+r+(next?' / '+next.min+' → '+next.name:' MAX')+'</span>'
        +'</div>'
        +'<div style="height:4px;background:#1a2a1a;border-radius:2px;overflow:hidden">'
        +'<div style="height:100%;width:'+pct+'%;background:'+col+';border-radius:2px"></div>'
        +'</div>'
        +(elite?'<div style="font-size:8px;color:#2a5a2a;margin-top:3px">★ '+(REP_PERK[fac]||'')+'</div>':'')
        +'</div>';
    }).join('');
    // Sub-faction rep breakdown grouped by parent
    const sfHtml=Object.entries(SUBFAC_BY_PARENT).map(([parentKey,sfKeys])=>{
      const parentDef=PARENT_FACTIONS[parentKey];
      const parentColors={corp:'#6080c0',crim:'#c08040',anarch:'#c04040',neutral:'#60a060'};
      const pcol=parentColors[parentKey]||'#60a060';
      const sfRows=sfKeys.map(sfk=>{
        const sf=SUBFACTIONS[sfk];
        const r=S.subrep?.[sfk]||0;
        if(r===0)return''; // hide uncontacted subfactions
        const sfTier=r>=4000?'Legend':r>=1500?'Elite':r>=500?'Trusted':r>=100?'Known':'Unknown';
        const sfTierCol=r>=4000?'#ffaa00':r>=1500?'#a040ff':r>=500?'#4080ff':r>=100?'#40c060':'#3a6a3a';
        const nextThresh=r<100?100:r<500?500:r<1500?1500:r<4000?4000:null;
        const prevThresh=r>=4000?1500:r>=1500?500:r>=500?100:0;
        const pct=nextThresh?Math.round(((r-prevThresh)/(nextThresh-prevThresh))*100):100;
        return `<div style="padding:4px 0 4px 8px;border-left:2px solid ${sf?.color||pcol}22">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:8px;color:${sf?.color||pcol};flex:1">${sf?.name||sfk}</span>
            <span style="font-size:7px;color:${sfTierCol}">${sfTier}</span>
            <span style="font-size:8px;color:#40c060;min-width:36px;text-align:right">${r}</span>
          </div>
          <div style="height:3px;background:#1a2a1a;border-radius:2px;margin-top:3px">
            <div style="height:100%;width:${pct}%;background:${sf?.color||pcol};border-radius:2px;opacity:0.8"></div>
          </div>
          ${nextThresh?`<div style="font-size:6px;color:#1a3a1a;margin-top:1px">${r}/${nextThresh} → ${r>=1500?'Legend':r>=500?'Elite':r>=100?'Trusted':'Known'}</div>`:''}
        </div>`;
      }).filter(Boolean).join('');
      if(!sfRows)return''; // skip parents with no contacted subfactions
      return `<div style="margin-bottom:10px">
        <div style="font-size:8px;color:${pcol};font-family:'Orbitron',monospace;letter-spacing:1px;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid ${pcol}33">${parentDef?.name||parentKey}</div>
        ${sfRows}
      </div>`;
    }).filter(Boolean).join('');

    repEl2.innerHTML='<div class="ptitle">Faction Reputation</div>'+repHtml
      +(sfHtml?'<div class="ptitle" style="margin-top:10px">Sub-Faction Rep</div>'+sfHtml:'');
  }
}

function renderPrestigeScreen(){
  const el=document.getElementById('pres-inner');if(!el)return;
  el.innerHTML=`<div class="prestige-warn">
    <div class="pw-title">★ PRESTIGE SYSTEM</div>
    <div class="pw-body"><span class="pw-loses">Prestige wipes everything.</span> Cred, programs, hardware, level, rep — all reset to zero.<br><br>
    <span class="pw-keeps">Each prestige permanently unlocks a new ICE type and program type for all future runs.</span></div>
    ${S.level>=20?`<button class="prestige-btn" onclick="triggerPrestige()">★ PRESTIGE NOW</button>`:`<button class="prestige-btn" disabled>Prestige at Lv${prestigeThresholds.find(t=>t>S.level)||"???"} (you: Lv${S.level})</button>`}
  </div>
  <div style="font-size:8px;color:#3a3a6a;margin-bottom:8px">Prestige wipes cred/programs/hardware. Level and rep are kept. Unlocks stack permanently.</div>
  ${PRESTIGE_TREE.map(p=>{
    const done=S.prestige>p.n;const next=S.prestige===p.n-1&&S.level>=20;const cur=S.prestige===p.n;const locked=S.prestige<p.n-1;
    return`<div class="pt-card ${done?'pt-done':next||cur?'pt-next':'pt-locked'}">
      <div class="pt-num ${done?'done':next||cur?'next':'lock'}">${done?'✓':p.n}</div>
      <div class="pt-body">
        <div class="pt-title ${next?'next':''}">${done?'COMPLETE':next?'NEXT UNLOCK':locked?'LOCKED':cur?'CURRENT':''}</div>
        <div class="pt-unlocks">
          <span class="pu-badge pu-ice">ICE: ${p.iceName}${p.iceId?(' STR '+(BASE_ICE[p.iceId]?.baseStr||'?')):''}</span>
          <span class="pu-badge pu-prog">PROG: ${p.progName}</span>
        </div>
        <div class="pt-desc">${p.iceDesc} / ${p.progDesc}</div>
      </div>
    </div>`;
  }).join('')}`;
}

function renderAll(){renderTopBar();renderBoard();renderSelPanel();renderPrepRAM();renderPrograms();renderRunRAM();renderRunner();renderDeck();renderInventory();renderRunContracts();}

function fmtTime(ms){const s=Math.max(0,Math.floor(ms/1000));const m=Math.floor(s/60);return m>0?`${m}m${s%60}s`:`${s}s`;}
function setSpeed(s){
  S.speed=s;S.paused=(s===0);
  ['0','1','2','4'].forEach(id=>{const b=document.getElementById('spd-'+id);if(b)b.classList.remove('active');});
  const b=document.getElementById('spd-'+s);if(b)b.classList.add('active');
}
function addLog(msg,cls=''){
  // Dedup: if last entry is identical, increment a counter instead of adding
  if(S.log.length>0&&S.log[0].msg===msg&&S.log[0].cls===cls){
    S.log[0].count=(S.log[0].count||1)+1;
  } else {
    // Coalesce: replace last entry if it's a "groupable" prefix match
    // e.g. multiple "◉ DATA downloaded" lines -> summarize
    const last=S.log[0];
    const coalesce=last&&last.group&&last.group===cls+'|'+msg.slice(0,12);
    if(coalesce){
      last.count=(last.count||1)+1;
      last.msg=last.baseMsg+` ×${last.count}`;
    } else {
      S.log.unshift({msg,cls,count:1,baseMsg:msg,tick:S.tick||0});
    }
  }
  if(S.log.length>120)S.log.pop();
  renderLog();
}

function renderLog(){
  const el=document.getElementById('log-prep');if(!el)return;
  el.innerHTML='';
  S.log.slice(0,35).forEach((l,i)=>{
    const d=document.createElement('div');
    d.className='ll '+(l.cls||'');
    const countSuffix=l.count>1?' x'+l.count:'';
    const tickPfx=(S.running&&i<3&&l.tick)?'<span style="color:#0d2a0d;font-size:7px">'+l.tick+'t </span>':'';
    d.innerHTML=tickPfx+'<span>'+l.msg+countSuffix+'</span>';
    el.appendChild(d);
  });
}

// GAME LOOP
// ── POLYMORPH UI ─────────────────────────────────────────────────────────
function renderPolymorphUI(){
  const pending=S._polymorphPending;if(!pending)return;
  // Show as a modal overlay so it's always visible regardless of active tab
  const isV2=pending.v2;
  const opts=pending.options.slice(0,isV2?999:3).map(iid=>{
    const it=S.inventory.find(x=>x.instId===iid);
    const d=it?pdef(it.defId):null;if(!d)return'';
    const mem=d.mem||0;const fits=ramUsed()+mem<=ramMax();
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #1a1a2a">
      <span style="font-size:16px;color:#8080ff">${d.icon}</span>
      <div style="flex:1"><div style="font-size:9px;color:#60c080">${d.name}</div>
        <div style="font-size:7px;color:#3a3a6a">MEM ${mem}${d.str?' STR '+d.str:''}${d.power?' PWR '+d.power:''}</div>
        <div style="font-size:7px;color:#2a2a5a">${d.desc}</div></div>
      <button class="buy-btn" style="padding:2px 8px" ${fits?'':'disabled'} onclick="polymorphSwap('${iid}')">SWAP</button>
    </div>`;
  }).join('');
  showModal(
    `⟁ POLYMORPH${isV2?' v2':''}`,
    `<div style="font-size:8px;color:#6060aa;margin-bottom:8px">Select a program to install${isV2?'':' (one swap per cell)'}.<br>Current loadout will have the lowest-tier program ejected if RAM is full.</div>${opts||'<div style="color:#3a3a6a">No uninstalled programs available.</div>'}`,
    [{label:'Skip',cls:'',fn:()=>{polymorphSkip();closeModal();}}]
  );
  // Override modal button area to allow swap without closing via button
  // (swap buttons call polymorphSwap directly and close via closeModal)
}

function polymorphSwap(instId){
  const pending=S._polymorphPending;if(!pending)return;
  // Eject one currently installed program to make room (or just install if space)
  const it=S.inventory.find(x=>x.instId===instId);
  const d=it?pdef(it.defId):null;if(!d)return;
  if(ramUsed()+d.mem>ramMax()){
    // Eject lowest-tier installed program
    const ejectIid=S.runSnapshot.installed
      .map(iid=>({iid,tier:pdef(S.runSnapshot.inventory.find(x=>x.instId===iid)?.defId)?.tier||0}))
      .sort((a,b)=>a.tier-b.tier)[0]?.iid;
    if(ejectIid){
      const ejIt=S.inventory.find(x=>x.instId===ejectIid);if(ejIt)ejIt.installed=false;
      S.installed=S.installed.filter(x=>x!==ejectIid);
      S.runSnapshot.installed=S.runSnapshot.installed.filter(x=>x!==ejectIid);
    }
  }
  it.installed=true;S.installed.push(instId);S.runSnapshot.installed.push(instId);
  addLog(`⟁ Polymorph: installed ${d.name}`,'li');
  if(!pending.v2){
    S._polymorphPending=null;
    closeModal();
  }else{
    // v2: re-render modal with updated options
    renderPolymorphUI();
  }
  renderPrograms();renderDeck();
}

function polymorphSkip(){
  S._polymorphPending=null;
  closeModal();
}

// ── RUN SUMMARY ──────────────────────────────────────────────────────────
function showRunSummary(){
  const el=document.getElementById('run-summary');
  if(!el||!_lastRunSummary)return;
  const s=_lastRunSummary;
  const ct=s.contract;
  const reasonLabel={complete:'RUN COMPLETE',boot:'RUNNER BOOTED',jackout:'JACKED OUT'}[s.reason]||'RUN ENDED';
  const reasonCls={complete:'sum-complete',boot:'sum-booted',jackout:'sum-jackout'}[s.reason]||'';

  let html=`<div class="sum-title ${reasonCls}">${reasonLabel}</div>`;

  // Contract result
  if(ct){
    const allDone=ct.objectives.every(o=>o.done);
    const doneCt=ct.objectives.filter(o=>o.done).length;
    html+=`<div class="sum-section">
      <div class="sum-label">Contract</div>
      <div class="sum-row"><span class="sum-key">${ct.name}</span><span class="sum-val ${allDone?'good':'warn'}">${allDone?'✓ COMPLETE':`${doneCt}/${ct.objectives.length} obj`}</span></div>`;
    ct.objectives.forEach(o=>{
      html+=`<div class="sum-row" style="padding-left:8px"><span class="sum-key">▸ ${o.desc.slice(0,30)}</span><span class="sum-val ${o.done?'good':'bad'}">${o.done?'✓':'✗'}</span></div>`;
    });
    if(ct.condition){
      const condLabel=ct.condition==='stealth'?'◌ Stealth bonus':'⚡ Speed bonus';
      html+=`<div class="sum-row" style="margin-top:4px"><span class="sum-key">${condLabel}</span><span class="${s.conditionMet?'sum-cond-met':'sum-cond-miss'}">${s.conditionMet?'MET':'MISSED'}</span></div>`;
    }
    html+=`</div>`;
  }

  // Earnings — broken down by source
  html+=`<div class="sum-section"><div class="sum-label">Earnings</div>`;
  const contractPay=s.contractCred||s.runCred||0;
  if(contractPay>0)
    html+=`<div class="sum-row"><span class="sum-key">Contract</span><span class="sum-val good">+${contractPay}₵</span></div>`;
  if(s.dsCred>0){
    html+=`<div class="sum-row"><span class="sum-key">Data sold (${(s.dsFiles||[]).length} files)</span><span class="sum-val good">+${s.dsCred}₵</span></div>`;
    (s.dsFiles||[]).forEach(f=>{
      html+=`<div class="sum-row" style="padding-left:12px"><span class="sum-key" style="color:#2a5a3a">${fLabel(f)}</span><span class="sum-val">${f.credValue}₵</span></div>`;
    });
  }
  if(s.gpuCred>0)
    html+=`<div class="sum-row"><span class="sum-key">GPU feeds</span><span class="sum-val good">+${s.gpuCred}₵</span></div>`;
  if((s.punchBonus||0)>0)
    html+=`<div class="sum-row"><span class="sum-key">Punch bonus ★</span><span class="sum-val gold">+${s.punchBonus}₵</span></div>`;
  html+=`</div><div class="sum-total">+${s.runCred}₵</div>`;

  // Rep changes
  if(s.repChanges&&s.repChanges.length>0){
    html+=`<div class="sum-section"><div class="sum-label">Reputation</div>`;
    s.repChanges.forEach(rc=>{
      const sf=rc.subfac?SUBFACTIONS[rc.subfac]:null;
      const sfCol=sf?.color||'#40c060';
      const parentTier=rc.fac?repTierName(rc.fac):'Unknown';
      const newParentRep=rc.fac?S.rep[rc.fac]||0:0;
      if(sf){
        html+=`<div class="sum-row"><span class="sum-key" style="color:${sfCol}">${sf.name}</span><span class="sum-val good">+${rc.subGain||rc.gain}</span></div>`;
      }
      html+=`<div class="sum-row"><span class="sum-key">${(rc.fac||'').toUpperCase()} <span style="color:#2a5a2a;font-size:7px">(${parentTier} · ${newParentRep})</span></span><span class="sum-val good">+${rc.gain}</span></div>`;
      if(rc.rivalLoss&&rc.rival){
        html+=`<div class="sum-row"><span class="sum-key" style="color:#c04040">${rc.rival.toUpperCase()} rival</span><span class="sum-val bad">-${rc.rivalLoss}</span></div>`;
      }
    });
    html+=`</div>`;
  }

  // Run stats
  html+=`<div class="sum-section">
    <div class="sum-label">Run Stats</div>
    <div class="sum-row"><span class="sum-key">Integrity</span><span class="sum-val ${s.integrityLeft<s.integrityMax*0.3?'bad':s.integrityLeft<s.integrityMax*0.6?'warn':'good'}">${s.integrityLeft}/${s.integrityMax}</span></div>
    <div class="sum-row"><span class="sum-key">Alert reached</span><span class="sum-val ${s.alertReached==='RED'?'bad':s.alertReached==='YELLOW'?'warn':'good'}">${s.alertReached}</span></div>
    <div class="sum-row"><span class="sum-key">Trace</span><span class="sum-val ${s.traceEnd>75?'bad':s.traceEnd>40?'warn':'good'}">${s.traceEnd}%</span></div>
  </div>`;

  // Files remaining in RAM
  const keepFiles=s.filesInRAM.filter(f=>f.preloaded);
  if(keepFiles.length>0){
    html+=`<div class="sum-section"><div class="sum-label">Files in RAM</div>`;
    keepFiles.forEach(f=>{html+=`<div class="sum-row"><span class="sum-key">${fLabel(f)}</span><span class="sum-val">${f.credValue?f.credValue+'₵':''}</span></div>`;});
    html+=`</div>`;
  }

  // Buttons + countdown
  html+=`<div class="sum-btns">
    <button class="sum-btn sum-launch" onclick="summaryLaunchNow()">▶ Launch Now</button>
    <button class="sum-btn sum-stay" onclick="summaryStay()">⏸ Stay</button>
  </div>
  <div class="sum-countdown" id="sum-cd"></div>`;

  el.innerHTML=html;
  el.style.display='block';
  // Note: startAutoRunCountdown() is called by finishRun() after showRunSummary()
}

function hideRunSummary(){
  const el=document.getElementById('run-summary');
  if(el)el.style.display='none';
}

function summaryLaunchNow(){
  hideRunSummary();
  manualLaunch();
}

function summaryStay(){
  cancelAutoRun();
  const cd=document.getElementById('sum-cd');
  if(cd)cd.textContent='Auto-run cancelled — press Launch Now when ready';
  // Replace Launch Now to still work after cancel
  const btn=document.querySelector('.sum-launch');
  if(btn)btn.onclick=()=>{hideRunSummary();if(S.active.length>0)launchRun();};
}

// ── TRAP SYSTEM ──────────────────────────────────────────────────────────
function triggerTrap(cell){
  if(!cell.trap||cell.trapTriggered)return;
  cell.trapTriggered=true;
  const revealed=cell.trapRevealed;
  const half=revealed?0.5:1; // revealed traps deal half effect

  switch(cell.trap){
    case 'TRIPWIRE':
      raiseAlert(Math.ceil(1*half));
      addLog(`⚠ TRIPWIRE [${cell.r},${cell.c}]${revealed?' (seen)':''} — alert raised`,'lw');
      break;
    case 'SHOCK':{
      const dmg=Math.ceil(2*half);
      const stun=Math.ceil(3*half);
      S.integrity=Math.max(0,S.integrity-dmg);
      S.player.waitTicks=(S.player.waitTicks||0)+stun*8; // stall movement
      addLog(`⚡ SHOCK [${cell.r},${cell.c}]${revealed?' (seen)':''} — -${dmg} INT, stunned ${stun}t`,'lb');
      if(S.integrity<=0)boot();
      break;
    }
    case 'TRACE':{
      const burst=Math.ceil(30*half);
      S.trace=Math.min(100,S.trace+burst);
      addLog(`◎ TRACE BURST [${cell.r},${cell.c}]${revealed?' (seen)':''} — +${burst}% trace`,'lw');
      if(S.trace>=100){addLog('  TRACE MAXED — Hunter incoming!','lb');spawnHunter();}
      break;
    }
    case 'ICE_SPAWN':
      addLog(`☠ ICE SPAWN [${cell.r},${cell.c}]${revealed?' (seen)':''}${revealed?' — weakened':''}!`,'lb');
      if(!revealed)spawnHunter();
      else raiseAlert(1); // revealed: just raises alert instead
      break;
    case 'DATA_BOMB':{
      const targets=S.deckRAM.filter(f=>!f.preloaded);
      if(targets.length>0&&!revealed){
        const victim=targets[Math.floor(Math.random()*targets.length)];
        S.deckRAM=S.deckRAM.filter(f=>f.id!==victim.id);
        addLog(`◉ DATA BOMB [${cell.r},${cell.c}] — destroyed ${fLabel(victim)}`,'lb');
      }else if(revealed){
        addLog(`◉ DATA BOMB [${cell.r},${cell.c}] (seen) — disarmed`,'lg');
      }else{
        addLog(`◉ DATA BOMB [${cell.r},${cell.c}] — no files to destroy`,'lw');
      }
      raiseAlert(1);
      renderRunRAM();
      break;
    }
    case 'HONEYPOT':
      // Reveal true nature, trigger tripwire+trace
      addLog(`⚠ HONEYPOT [${cell.r},${cell.c}]${revealed?' (seen)':''} — fake datastore!`,'lw');
      raiseAlert(Math.ceil(1*half));
      S.trace=Math.min(100,S.trace+Math.ceil(20*half));
      // Remove fake files
      cell.files=[];
      break;
  }
  renderRunner();
}

function revealTrap(cell){
  if(!cell.trap||cell.trapRevealed||cell.trapTriggered)return;
  cell.trapRevealed=true;
  const t=TRAPS[cell.trap];
  addLog(`⊙ Scanner: trap at [${cell.r},${cell.c}] — ${t?.desc||cell.trap}`,'li');
  if(cell.trap==='HONEYPOT'){
    addLog(`  Honeypot revealed — not a real datastore`,'li');
  }
}

// ── DATASTORE SCANNING ────────────────────────────────────────────────────


