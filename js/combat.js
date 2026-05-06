// MESH v0.2 — combat.js
// =====================

function runInst(){
  const inst=S.running?S.runSnapshot.installed:S.installed;
  // Filter out Guardian-disabled programs
  const disabled=S._disabledProgs||[];
  return inst.filter(iid=>!disabled.includes(iid));
}
function runInv(){return S.running?S.runSnapshot.inventory:S.inventory;}
function getByEffect(effect){
  return runInst().map(iid=>{const it=runInv().find(x=>x.instId===iid);const d=it?pdef(it.defId):null;return d&&d.effect===effect?{it,d,iid}:null;}).filter(Boolean);
}
function getBreaker(iceType){
  let best=null,bestStr=-1;
  runInst().forEach(iid=>{const it=runInv().find(x=>x.instId===iid);const d=it?pdef(it.defId):null;if(!d||d.cat!=='breaker')return;if(d.iceTypes&&d.iceTypes.includes(iceType)&&d.str>bestStr){best=iid;bestStr=d.str;}});
  return best;
}
// All programs passive always-on — no charges mid-run

// COMBAT
function startCombat(cell){
  if(S._inCombatInit) return; // re-entrancy guard
  S._inCombatInit=true;
  const iceType=cell.ice;const tier=curTier();
  let str=cell._overrideStr||iceStr(iceType,tier);
  // Zap: passive ICE STR reduction before combat (always-on, smaller values)
  getByEffect('zap').forEach(({d})=>{
    const dmg=d.power||1;
    str=Math.max(1,str-dmg); // never reduces to 0 — just weakens
    addLog(`⚡ Zap: ICE STR -${dmg} → ${str}`,'lw');
  });
  // Overclock: passive STR bonus every combat (always-on)
  let overBonus=0;
  getByEffect('overclock').forEach(({d})=>{ overBonus+=d.power||2; });
  if(iceType==='BARRIER'||iceType==='GUARDIAN'){
    // Cloak: guaranteed sneak on first combat this run
    let hp=attachEffect('stealth')+(S._mfrPerk?.stealthBonus||0);getByEffect('stealth').forEach(({d})=>hp+=d.power||1);
    const cloakEffect=getByEffect('cloak');
    const cloakGuaranteed=cloakEffect.length&&!S._cloakUsed;
    if(cloakGuaranteed){S._cloakUsed=true;addLog('◌ Cloak: guaranteed sneak','lg');}
    if((cloakGuaranteed||hp>0)&&(cloakGuaranteed||Math.random()<Math.min(0.85,hp*0.3))){addLog(`◌ Sneak past ${iceType}`,'lg');cell.ice=null;S._inCombatInit=false;if(cell.r!==undefined)handleNodeArrival(cell);return;}
  }
  // Switchblade: override breaker selection with absolute best
  let bIid=getBreaker(iceType);
  if(getByEffect('switchblade').length&&!bIid){
    // Switchblade finds any breaker even if wrong type
    const anyBreaker=runInst().find(iid=>{
      const it=runInv().find(x=>x.instId===iid);
      const d=it?pdef(it.defId):null;
      return d?.cat==='breaker';
    });
    if(anyBreaker)bIid=anyBreaker;
  }
  if(!bIid){
    const dmg=BASE_ICE[iceType]?.retaliation||1;S.integrity=Math.max(0,S.integrity-dmg);raiseAlert(1);
    if(!S.stats)S.stats={};
    S.stats.iceUnbreached=(S.stats.iceUnbreached||0)+1;
    S.stats.totalDamageReceived=(S.stats.totalDamageReceived||0)+dmg;
    addLog(`✗ No breaker for ${iceType} — -${dmg} INT`,'lb');
    if(typeof checkNoBreaker==='function')checkNoBreaker();
    S._inCombatInit=false;
    if(S.integrity<=0){boot();return;}
    if(cell.r!==undefined){cell.ice=null;handleNodeArrival(cell);}return;
  }
  const bd=pdef(S.inventory.find(x=>x.instId===bIid)?.defId);
  const cpuBonus=S._cpuBoost||0;
  const attachBonus=S._attachBreakerBonus||0;
  const leechPenalty=S._leechDrain||0;
  const daemonBonus=getByEffect('daemon').reduce((a,{d})=>a+(d.power||1),0);
  const overclock2Bonus=getByEffect('overclock2').reduce((a,{d})=>a+(d.power||6),0);
  const charBreaker=(typeof charBreakerBonus==='function'?charBreakerBonus():0);
  const effStr=Math.max(1,bd.str+overBonus+cpuBonus+attachBonus+daemonBonus+overclock2Bonus-leechPenalty+charBreaker);
  if(charBreaker>0)addLog(`◈ Intrusion: +${charBreaker} STR`,'li');
  if(daemonBonus>0)addLog(`◈ Daemon: +${daemonBonus} STR`,'li');
  if(overclock2Bonus>0)addLog(`⚙ Overclock v2: +${overclock2Bonus} STR`,'li');
  if(leechPenalty>0)addLog(`⊗ Leech drain: -${leechPenalty} STR`,'lw');
  if(overBonus>0)addLog(`⚙ Overclock +${overBonus} STR`,'li');
  if(cpuBonus>0)addLog(`◈ CPU boost +${cpuBonus} STR`,'li');
  let armor=0;getByEffect('armor').forEach(({d})=>{armor+=d.power||1;});
  if(S._mfrPerk?.firstHitAbsorb&&!S._mfrPerk._firstHitUsed){armor++;S._mfrPerk._firstHitUsed=true;}
  if(armor>0)addLog(`◫ Armor: ${armor} hits`,'li');
  S._inCombatInit=false;
  S.combat={iceType,iceStr:str,iceStrMax:str,breakerInstId:bIid,breakerStr:effStr,round:0,cellR:cell.r,cellC:cell.c,armor,
    hunterType:cell.hunterType||null};
  S.combatTick=0;
  S.player.stalled=true; // combat stalls movement
  document.getElementById('combat-panel').classList.add('active');
  const huntLabel=cell.hunterType&&cell.hunterType!=='standard'?` [${HUNTER_TYPES[cell.hunterType]?.name||cell.hunterType}]`:'';
  addLog(`⚔ [${cell.r},${cell.c}] ${bd.name} STR${effStr} vs ${iceType}${huntLabel} STR${str}`,'lx');updateCombatUI();
}
function resolveCombatRound(){
  if(!S.combat)return;const c=S.combat;c.round++;
  const overload=S._overloadActive?1:0;
  const _traitDmg=typeof traitCombatDamageBonus==='function'?traitCombatDamageBonus():0;
  const _craftStr=typeof getDeckCraftStat==='function'?getDeckCraftStat('breakerStr'):0;
  const dmg=Math.min(c.iceStr,c.breakerStr+overload+_traitDmg+_craftStr);c.iceStr=Math.max(0,c.iceStr-dmg);
  c._totalDmgDealt=(c._totalDmgDealt||0)+dmg;
  // Only log round detail in first 2 rounds or when ICE is about to fall
  if(c.round<=2||c.iceStr<=c.breakerStr){
    addLog(`  Rnd ${c.round}: -${dmg}${overload?' (OL)':''} → ICE ${c.iceStr}`,'lx');
  }
  if(c.iceStr<=0){
    const cell=S.grid[c.cellR]?.[c.cellC];
    if(!S.stats)S.stats={};
    S.stats.iceBreached=(S.stats.iceBreached||0)+1;
    S._iceBreachedRun=(S._iceBreachedRun||0)+1;
    if(c.iceType==='HUNTER'){S._huntersKilledThisRun=(S._huntersKilledThisRun||0)+1;S.stats.huntersKilled=(S.stats.huntersKilled||0)+1;}
    if(typeof checkAfterCombat==='function')checkAfterCombat();
    // CASCADE: spawn a fresh Barrier on defeat
    if(c.iceType==='CASCADE'&&cell&&!cell._cascadedAlready){
      cell._cascadedAlready=true;
      cell.ice='BARRIER';
      addLog(`✓ CASCADE defeated — Barrier spawned!`,'lw');
      if(typeof checkCascadeChain==='function')checkCascadeChain();
    }else{
      addLog(`✓ ${c.iceType} defeated`,'lg');
      if(cell)cell.ice=null;
    }
    const dmgSummary=c._totalDmgDealt?` (dealt ${c._totalDmgDealt})`:'';
    S._iceEncountered=S._iceEncountered||new Set();S._iceEncountered.add(c.iceType);
    S._iceBreachedTypes=S._iceBreachedTypes||new Set();S._iceBreachedTypes.add(c.iceType);
    if(S._iceBreachedTypes.size>=3&&typeof unlockAch==='function') unlockAch('triple_kill');
    S.combat=null;S.player.stalled=false;document.getElementById('combat-panel').classList.remove('active');
    if(cell)handleNodeArrival(cell);return;
  }
  const ret=BASE_ICE[c.iceType]?.retaliation||1;
  if(c.armor>0){c.armor--;addLog('  Armor absorbed','li');}
  else{
    const dmgRed=S._mfrPerk?.combatDmgReduction||0;
    const finalDmg=Math.max(1,ret-dmgRed);
    S.integrity=Math.max(0,S.integrity-finalDmg);
    if(!S.stats)S.stats={};
    S.stats.totalDamageReceived=(S.stats.totalDamageReceived||0)+finalDmg;
    addLog(`  ICE: -${finalDmg} INT → ${S.integrity}`,'lb');
  }
  // Per-ICE retaliation side effects
  switch(c.iceType){
    case 'GATEKEEPER': raiseAlert(1); break;
    case 'BARRIER':    { const _tr=typeof charTraceResist==='function'?charTraceResist():0; const _ta=Math.max(1,Math.round(15*(1-_tr/100))); S.trace=Math.min(100,S.trace+_ta);addLog(`  Barrier: +${_ta}% trace`+((_tr>0)?` (resist -${15-_ta})`:''),'lw'); break; }
    case 'GUARDIAN':
      // Disable a random program for this run
      if(S.runSnapshot.installed.length>0){
        if(!S._disabledProgs)S._disabledProgs=[];
        const avail=S.runSnapshot.installed.filter(iid=>!S._disabledProgs.includes(iid));
        if(avail.length>0){
          const target=avail[Math.floor(Math.random()*avail.length)];
          S._disabledProgs.push(target);
          const d=pdef(S.runSnapshot.inventory.find(x=>x.instId===target)?.defId);
          addLog(`  Guardian disabled: ${d?.name||'program'}`,'lx');
        }
      }
      break;
    case 'TRACER':
      // Add pressure instead of raw trace
      addPressure(10);
      addLog('  Tracer: +10 pressure','lw');
      if(S.alertPressure>=PRESSURE_MAX){addLog('  Pressure maxed — Hunter incoming!','lb');spawnHunter();}
      break;
    case 'KRAKEN':
      // Each hit spawns a Hunter
      addLog('  Kraken: Hunter spawned from damage!','lb');
      spawnHunter();
      break;
    case 'LEECH':
      // Drain 1 STR from active breaker permanently for this run
      if(!S._leechDrain)S._leechDrain=0;
      S._leechDrain++;
      addLog(`  Leech: breaker STR -${S._leechDrain} cumulative this run`,'lb');
      break;
    case 'CASCADE':
      // On defeat, spawn a Barrier in same cell (handled in combat end)
      break;
    case 'OMEGA':
      // All effects: pressure, trace, INT loss
      addPressure(20);
      { const _tr=typeof charTraceResist==='function'?charTraceResist():0; S.trace=Math.min(100,S.trace+Math.max(1,Math.round(5*(1-_tr/100)))); }
      addLog('  Omega: +20 pressure, +5% trace','lb');
      if(!c._omegaIntHit){c._omegaIntHit=true;S.permIntLoss=(S.permIntLoss||0)+1;addLog('  Omega: max INT permanently -1','lb');}
      if(S.alertPressure>=PRESSURE_MAX){spawnHunter();addLog('  Omega: Hunter spawned!','lb');}
      break;
    case 'MIMIC':
      // Reveal true nature on retaliation — sync to cell for render
      if(!c._mimicRevealed){
        c._mimicRevealed=true;
        const _mc=S.grid?.[c.cellR]?.[c.cellC];
        if(_mc){ _mc.mimicRevealed=true; }
        addLog('  MIMIC revealed — true ICE exposed!','lw');
        if(typeof renderGrid==='function') renderGrid();
      }
      raiseAlert(1);
      break;
    case 'ARCHITECT':
      // Raises pressure significantly
      addPressure(15);
      addLog('  Architect: +15 pressure','lw');
      break;
    case 'BLACK_ICE':
      // Black ICE: always retaliates once AND permanently reduces max integrity
      if(!c._blackIcePermaHit){
        c._blackIcePermaHit=true;
        S.permIntLoss=(S.permIntLoss||0)+1;
        addLog(`  Black ICE: max INT permanently -1 (use Integrity Patch to restore)`,'lb');
      }
      if(c.iceStr<=0&&!c._blackIceRetaliated){
        c._blackIceRetaliated=true;
        const extra=BASE_ICE.BLACK_ICE.retaliation;
        S.integrity=Math.max(0,S.integrity-extra);
        addLog(`  Black ICE final strike: -${extra} INT`,'lb');
      }
      break;
    case 'PROBE':
      // Probe scans and disables a random installed program
      if(Math.random()<0.6){
        const avail=(S.runSnapshot?.installed||[]).filter(iid=>!(S._disabledProgs||[]).includes(iid));
        if(avail.length){
          if(!S._disabledProgs)S._disabledProgs=[];
          const target=avail[Math.floor(Math.random()*avail.length)];
          S._disabledProgs.push(target);
          const it=S.runSnapshot?.inventory?.find(x=>x.instId===target);
          const d=pdef(it?.defId);
          addLog(`  Probe: disabled ${d?.name||'program'} — defrag to restore`,'lb');
          addPressure(8);
        }else{
          addLog('  Probe: no programs to disable','lx');
        }
      }
      break;
    case 'TAR_PIT':
      S._tarPitStacks=(S._tarPitStacks||0)+1;
      addLog(`  Tar Pit: movement slowed (×${S._tarPitStacks})`,'lw');
      break;
  }
  updateCombatUI();if(S.integrity<=0)boot();
}
function updateCombatUI(){
  const c=S.combat;if(!c){document.getElementById('combat-panel').classList.remove('active');return;}
  const bd=pdef(S.inventory.find(x=>x.instId===c.breakerInstId)?.defId);const iMax=maxInt();
  document.getElementById('comb-title').textContent=`COMBAT — RND ${c.round}`;
  document.getElementById('comb-p-icon').textContent=bd?.icon||'▶';
  document.getElementById('comb-i-icon').textContent=BASE_ICE[c.iceType]?.icon||'◈';
  document.getElementById('comb-i-name').textContent=c.iceType;
  document.getElementById('comb-p-str').textContent=c.breakerStr;
  document.getElementById('comb-i-str').textContent=c.iceStr;
  document.getElementById('comb-i-bar').style.width=`${(c.iceStr/c.iceStrMax)*100}%`;
  document.getElementById('comb-p-bar').style.width=`${(S.integrity/iMax)*100}%`;
  document.getElementById('comb-status').textContent=c.armor>0?`◫ ${c.armor} armor`:'';
}

// TRAVERSAL
// Tick costs now via moveTicks()/combatTicks() in state.js
