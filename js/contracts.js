
// ── STATIC LAYER ENCOUNTER ────────────────────────────────────────────────
function maybeStaticEncounter(){
  const dist=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
  if(dist<64) return;
  if(Math.random()>0.4) return;
  if(S._staticEncounterThisNet) return;
  S._staticEncounterThisNet=true;

  const tier=dist<128?'remnant':dist<192?'sentinel':'deep';
  if(tier==='remnant'){
    // Abandoned corp cache — bonus cred + chance of blueprint
    const cache=Math.floor(300+dist*8);
    S.cred=(S.cred||0)+cache;
    addLog(`◈ STATIC: Abandoned corp cache at dist ${dist.toFixed(0)} — +${cache}₵`,'lp');
    if(Math.random()<0.3&&typeof tryDropBlueprint==='function') tryDropBlueprint('static_cache');
  } else if(tier==='sentinel'){
    // AI sentinel ping — optional confrontation for rep
    const penalty=Math.floor(dist*2);
    addLog(`⚠ STATIC: AI Sentinel detected — mesh node at ${dist.toFixed(0)}`,'lw');
    addLog(`  ▸ Trace +${penalty}%. Lore fragment recovered.`,'lw');
    S.trace=Math.min(100,(S.trace||0)+penalty);
    if(typeof checkStoryUnlocks==='function') checkStoryUnlocks();
  } else {
    // Deep static — pre-Blackout data structure, massive lore/cred
    const deepCred=Math.floor(1000+dist*15);
    S.cred=(S.cred||0)+deepCred;
    addLog(`◈ DEEP STATIC: Pre-Blackout architecture — +${deepCred}₵ archive recovered`,'lp');
    if(Math.random()<0.5&&typeof tryDropBlueprint==='function') tryDropBlueprint('deep_static');
    if(typeof checkStoryUnlocks==='function') checkStoryUnlocks();
  }
}


// ── GLITCH ZONE ENCOUNTER EVENTS ─────────────────────────────────────────
// Fire occasionally on FF completion in glitch zone. One per net max.

function maybeGlitchEncounter(){
  const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  if(dist < 16 || dist >= 64) return;
  if(Math.random() > 0.35 + (dist-16)*0.008) return; // ~35-52% chance scaling with depth
  if(S._glitchEncounterThisNet) return;
  S._glitchEncounterThisNet = true;

  const roll = Math.random();
  if(roll < 0.33){
    // Government checkpoint — pass/bribe/flee
    const govIdxs = typeof getDistGovernments==='function' ? getDistGovernments(Math.floor(dist)) : [];
    const govName = govIdxs.length&&typeof getGovernmentName==='function' ? getGovernmentName(govIdxs[0]) : 'Government';
    const bribeCost = Math.floor(200 + dist * 40);
    addLog(`⚠ CHECKPOINT: ${govName} patrol has flagged your signature.`,'lw');
    addLog(`  ▸ Pay ${bribeCost}₵ to clear: type payCheckpoint()`, 'lw');
    addLog(`  ▸ Or accept +15% trace carry into next run`, 'lw');
    S._pendingCheckpoint = { govIdxs, bribeCost };
    setTimeout(()=>{
      if(S._pendingCheckpoint){
        // Auto-resolve: take the trace penalty
        S.traceCarry = Math.min(80, (S.traceCarry||0) + 15);
        addLog(`⚠ Checkpoint not cleared — +15% trace carry`,'lb');
        S._pendingCheckpoint = null;
      }
    }, 30000); // 30s to manually pay
  } else if(roll < 0.66){
    // Signal anomaly — lore fragment + small cred
    const anomCred = Math.floor(100 + dist * 20);
    S.cred = (S.cred||0) + anomCred;
    addLog(`◈ SIGNAL ANOMALY: Residual mesh packet intercepted. +${anomCred}₵ from the noise.`,'lp');
    // Chance to drop a lore datastore fragment
    if(Math.random() < 0.4 && typeof tryDropLoreFragment === 'function') tryDropLoreFragment();
    if(typeof checkStoryUnlocks==='function') checkStoryUnlocks();
  } else {
    // Rival runner contact — trade info for rep
    const factions = ['corp','crim','anarch','neutral'];
    const fac = factions[Math.floor(Math.random()*factions.length)];
    const repGain = Math.floor(30 + dist * 3);
    if(S.rep) S.rep[fac] = Math.min(5000, (S.rep[fac]||0) + repGain);
    const facName = {corp:'Corporate',crim:'Criminal',anarch:'Anarchist',neutral:'Neutral'}[fac];
    addLog(`◌ RUNNER CONTACT: Shadow exchange. +${repGain} ${facName} rep — they owe you one.`,'lg');
  }
}

function payCheckpoint(){
  if(!S._pendingCheckpoint){ addLog('No active checkpoint','lw'); return; }
  const { govIdxs, bribeCost } = S._pendingCheckpoint;
  if((S.cred||0) < bribeCost){ addLog(`Need ${bribeCost}₵ to pay checkpoint`,'lw'); return; }
  S.cred -= bribeCost;
  govIdxs.forEach(idx=>{ if(typeof addGovRep==='function') addGovRep(idx, 25); });
  addLog(`◎ Checkpoint cleared (-${bribeCost}₵, +25 gov rep)`,'lg');
  S._pendingCheckpoint = null;
  if(typeof renderTopBar==='function') renderTopBar();
}

function applyMfrPerk(){
  S._mfrPerk={};
  const hw=hwdef(); if(!hw)return;
  const mfr=hw.mfr;
  const ri=['common','uncommon','rare','legendary','mythic'].indexOf(hw.rarity||'common');
  if(ri>=2){ // rare+
    if(mfr==='haas')   {S._mfrPerk.ramBonus=2;addLog('★ Hexfield: RAM +2 this run','lg');}
    if(mfr==='weyland'){S._mfrPerk.firstHitAbsorb=true;addLog('★ Ironwall: first hit absorbed','lg');}
    if(mfr==='jinteki'){S._mfrPerk.stealthBonus=1;addLog('★ Silk Corp: +1 stealth power','lg');}
    if(mfr==='nbn')    {S._mfrPerk.traceDecay=3;addLog('★ Vantage: trace decays 3%/tick','lg');}
    if(mfr==='novatek'){S._mfrPerk.attachPowerBonus=1;addLog('★ Novatek: attachment power +1','lg');}
  }
  if(ri>=3){ // legendary+
    if(mfr==='weyland'){S._mfrPerk.combatDmgReduction=1;addLog('★ Ironwall: combat -1 damage','lg');}
    if(mfr==='jinteki'){S._mfrPerk.sneakBonus=20;addLog('★ Silk Corp: sneak +20%','lg');}
    if(mfr==='nbn')    {S._mfrPerk.alertResist=20;addLog('★ Vantage: 20% alert resist','lg');}
  }
  if(ri>=4){ // mythic
    if(mfr==='jinteki'){S._mfrPerk.trapImmune=true;addLog('★ Silk Corp: trap immune','lg');}
    if(mfr==='nbn')    {S._mfrPerk.autoSoothe=true;addLog('★ Vantage: auto-soothe every 5t','lg');}
  }
}


function flavorToRepKey(flavor){
  const map={CORPORATE:'corp',CRIMINAL:'crim',ANARCHIST:'anarch',NEUTRAL:'neutral'};
  return map[flavor?.toUpperCase()]||null;
}

function tickContractTimers(){
  if(!S.running||S.paused)return;
  Object.values(S.contractTimers).forEach(t=>{
    if(t.ticksLeft>0)t.ticksLeft=Math.max(0,t.ticksLeft-1);
  });
}

function generateBoard(){
  const tier=curTier();
  const bt=document.getElementById('board-tier');if(bt)bt.textContent=tier;
  const count=Math.min(10,rnd(4,6)+Math.ceil(S.level/3));
  S.board=[];

  // Contracts now come from net nodes — board is legacy path for non-net runs
  const _dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  for(let i=0;i<count;i++){
    if(_dist >= 32 && typeof getDistGovernments==='function'){
      // Deep glitch: gov-only contracts on the home board
      const govIdxs = getDistGovernments(Math.floor(_dist));
      const govIdx  = govIdxs[Math.floor(Math.random()*govIdxs.length)];
      const govCo   = typeof getGovernment==='function' ? {
        name: getGovernmentName(govIdx), faction:'gov', govIndex:govIdx,
        key:'gov_'+govIdx, color: getGovernment(govIdx).color,
      } : null;
      S.board.push(govCo ? genContract(S.level,tier,'GOVERNMENT',null,govCo) : genContract(S.level,tier));
    } else if(_dist >= 16 && typeof factionSlotCount==='function'){
      // Glitch zone: weighted toward gov, fewer other factions
      const roll = Math.random();
      const govWeight = (_dist-16)/16; // 0 at dist16, 1 at dist32
      if(roll < govWeight*0.6 && typeof getDistGovernments==='function'){
        const govIdxs = getDistGovernments(Math.floor(_dist));
        const govIdx  = govIdxs[Math.floor(Math.random()*govIdxs.length)];
        const govCo   = {name:getGovernmentName(govIdx),faction:'gov',govIndex:govIdx,key:'gov_'+govIdx};
        S.board.push(genContract(S.level,tier,'GOVERNMENT',null,govCo));
      } else {
        S.board.push(genContract(S.level,tier));
      }
    } else {
      S.board.push(genContract(S.level,tier));
    }
  }

  S.active=[];S.storage=[];
  renderBoard();renderSelPanel();renderPrepRAM();
}

// ── CREDIT SINK ACTIONS ──────────────────────────────────────────────────
function buyIntel(){
  const cost=CREDIT_SINKS.intel.cost;
  if(S.cred<cost){addLog(`Intel costs ${cost}₵`,'lw');return;}
  S.cred-=cost;S._intelBought=true;
  addLog(`⊙ Intel purchased: ICE positions revealed on next run (-${cost}₵)`,'li');
  if(typeof unlockAch==='function') unlockAch('intel_op');
  renderTopBar();autoSave();
}
function buyTraceScrub(){
  const cost=CREDIT_SINKS.trace_scrub.cost;
  if(S.cred<cost){addLog(`Trace scrub costs ${cost}₵`,'lw');return;}
  S.cred-=cost;S.trace=Math.max(0,(S.trace||0)-20);
  addLog(`◎ Trace scrubbed -20% (-${cost}₵)`,'li');
  renderTopBar();autoSave();
}

function buildDesc(action,nt,f,tf){
  if(action==='access')return`Access ${nt} vault`;
  if(action==='terminal')return`Activate ${nt} terminal`;
  if(action==='archive')return`Retrieve from ${nt}`;
  if(action==='upload')return`Upload ${f?fLabel(f):'FILE'} → ${nt}`;
  if(action==='activate')return`Activate ${nt} port`;
  if(action==='display')return`Intercept ${nt} feed`;
  if(action==='backdoor')return`Backdoor via ${nt}`;
  if(action==='destroy')return`Destroy ${nt}`;
  if(action==='collect_delete')return`Exfil+purge from ${nt}`;
  if(action==='delete')return`Delete from ${nt}`;
  if(action==='modify')return`Modify file in ${nt}`;
  return`Collect from ${nt}`;
}

function genName(){
  return`${pick(['Systemic','Arclight','Orbital','Nexagen','Armalight','Gridwatch','Bioflex'])} ${pick(['Extraction','Protocol','Breach','Override','Harvest','Erasure','Intercept','Blackout','Operation','Directive'])}`;
}

function pickSubfaction(){
  const sfKeys=Object.keys(SUBFACTIONS);
  const weights=sfKeys.map(k=>{
    const sf=SUBFACTIONS[k];
    const sr=S.subrep?.[k]||0;
    const pr=S.rep[sf.parent]||0;
    const base=sf.parent==='neutral'?3:Math.max(1,1+Math.floor(pr/100));
    return base+Math.floor(sr/80);
  });
  const total=weights.reduce((a,b)=>a+b,0);
  let roll=Math.random()*total;
  for(let i=0;i<sfKeys.length;i++){roll-=weights[i];if(roll<=0)return sfKeys[i];}
  return 'freelance';
}

function pickFlavor(){
  const sf=SUBFACTIONS[pickSubfaction()]||SUBFACTIONS.freelance;
  return sf.flavor||'NEUTRAL';
}

function genContract(level,tier,forceFlavor,forceSubfac,forceCompany){
  // forceCompany: {key,name,faction} from a net's company list — overrides SUBFACTIONS lookup
  let sfKey, sf, flavor;
  if(forceCompany){
    sfKey = forceCompany.key;
    const flavorMap={corp:'CORPORATE',crim:'CRIMINAL',anarch:'ANARCHIST',neutral:'NEUTRAL',gov:'GOVERNMENT',ai:'AI_CONTACT'};
    flavor = forceFlavor || flavorMap[forceCompany.faction] || 'NEUTRAL';
    // Try to use a real subfaction definition if one matches
    const _realSf=SUBFACTIONS[sfKey];
    if(_realSf&&_realSf.parent===forceCompany.faction){
      sf=_realSf; flavor=_realSf.flavor||flavor;
    } else {
    // Build a minimal sf-compatible object from faction defaults
    const verbsByFac={
      corp:   {basic:['obtain','access','delete'],advanced:['exfil','access','modify'],elite:['exfil','backdoor','modify'],conditions:['stealth'],credMult:1.1,repMult:0.8},
      crim:   {basic:['obtain','delete','exfil'],advanced:['exfil','collect_delete','backdoor'],elite:['collect_delete','exfil','backdoor'],conditions:[],credMult:1.2,repMult:0.6},
      anarch: {basic:['delete','destroy','activate'],advanced:['destroy','backdoor','delete'],elite:['backdoor','destroy','exfil'],conditions:['speed'],credMult:0.9,repMult:1.1},
      neutral:{basic:['obtain','activate','archive'],advanced:['obtain','exfil','archive'],elite:['exfil','access','archive'],conditions:[],credMult:1.0,repMult:0.7},
      gov:    {basic:['obtain','access','surveil'],advanced:['exfil','trace_back','route'],elite:['backdoor','trace_back','surveil'],conditions:['stealth'],credMult:1.8,repMult:0.9},
      ai:     {basic:['obtain','harvest','clone'],advanced:['harvest','exfil','route'],elite:['burn','clone','harvest'],conditions:[],credMult:2.2,repMult:0.6},
    };
    const fv = verbsByFac[forceCompany.faction] || verbsByFac.neutral;
    sf = {key:sfKey, name:forceCompany.name, parent:forceCompany.faction,
      flavor, ...fv,
      govIndex: forceCompany.govIndex ?? null, // for gov rep routing
      names:[forceCompany.name+' Contract', forceCompany.name+' Op', forceCompany.name+' Job',
             'From '+forceCompany.name, forceCompany.name+' Request'],
    };
    } // end else (no real subfaction)
  } else {
    sfKey = forceSubfac || pickSubfaction();
    sf = SUBFACTIONS[sfKey] || SUBFACTIONS.freelance;
    flavor = forceFlavor || sf.flavor || 'NEUTRAL';
  }
  const fd=sf;

  // Diff scales with level and rep
  const maxDiff=Math.min(4,Math.ceil(level/5)+1);
  const parentRep=S.rep[sf.parent]||0;
  // Use per-net rep if in a net, else global parent rep
  const ns=typeof currentNetState==='function'?currentNetState():null;
  const subRep=ns?.rep?.[sfKey]||0;
  const effectiveRep=Math.max(parentRep,subRep);
  const repAllowedDiff=effectiveRep>=1500?4:effectiveRep>=500?3:effectiveRep>=100?2:1;
  const diff=sf.parent==='neutral'?rnd(1,Math.min(maxDiff,2)):Math.min(maxDiff,rnd(1,repAllowedDiff));

  // Pick verbs
  const verbPool=diff>=4&&fd.elite?.length?fd.elite:diff>=3&&fd.advanced?.length?fd.advanced:fd.basic||['obtain'];
  const vk=pick(verbPool);
  const verb=CV[vk];if(!verb)return genContract(level,tier,'NEUTRAL','freelance');

  const duration=rnd(120,300)*1000;
  const count=rnd(1,Math.min(3,diff));
  const objs=[];
  for(let i=0;i<count;i++){
    const nt=pick(verb.nodeTypes);
    const needsFile=verb.action==='upload'||verb.action==='modify';
    const file=needsFile?mkFile(true,Math.random()<0.2):null;
    const targetFile=['collect','collect_delete','delete','modify'].includes(verb.action)?mkFile(false,Math.random()<0.15*diff):null;
    objs.push({id:uid(),verbKey:vk,nodeType:nt,action:verb.action,file,targetFile,targetNodeId:null,done:false,failed:false,desc:buildDesc(verb.action,nt,file,targetFile)});
  }

  const _dist = (S.mesh?.currentNet && typeof meshDistanceCurrent==='function') ? meshDistanceCurrent() : 0;
  const credMult = fd.credMult || 1.0;
  const repScale = fd.repMult || 1.0;

  // Cred: flat floor * diff + dist-scaled bonus — no double-dip
  // Floor grows linearly with dist so minimum is always meaningful
  const _credFloor = Math.floor(diff * 30 * (1 + _dist * 0.06)) * count;
  const _credRoll  = Math.floor(diff * rnd(20,60) * (1 + tier * 0.25)) * count;
  const baseCred   = Math.floor((_credFloor + _credRoll) * credMult);

  // Rep: grows with dist — runners deeper in earn faster faction trust
  const baseXP = Math.floor(diff * 25 * (1 + Math.floor(tier/3) + _dist * 0.04) * repScale);

  // Conditions
  let condition=null;
  const condPool=fd.conditions||[];
  if(condPool.length&&diff>=2&&Math.random()<0.35){
    condition=pick(condPool);
  }else if(diff>=3&&Math.random()<0.2){
    condition='speed';
  }else if(diff>=3&&['CRIMINAL','ANARCHIST'].includes(flavor)&&Math.random()<0.15){
    condition='witness'; // no Hunter spawned
  }

  // Punch-above-weight bonus
  const facRepTier=repTier(sf.parent||'neutral').min||0;
  const punchBonus=diff*50>facRepTier?Math.floor(baseCred*0.25):0;

  // Rep requirement — based on effective rep
  const repReq=sf.parent==='neutral'?0:(diff>=4?500:diff>=3?100:0);

  const namePool=[...(sf.names||[])];
  const name=namePool.length?pick(namePool):genName();

  // Contract rarity — drives visual badge and reward multiplier
  // Rare: diff 4 + condition + high dist · Uncommon: diff 3+ or condition
  const _distZ = _dist || 0;
  const _rarity = (diff>=4 && condition && _distZ>=16) ? 'elite'
    : (diff>=4 || (diff>=3 && condition)) ? 'rare'
    : (diff>=3 || condition) ? 'uncommon'
    : 'common';
  const _rarityMult = {common:1.0, uncommon:1.15, rare:1.4, elite:1.8}[_rarity];
  const finalCred = Math.floor(baseCred * _rarityMult);
  const finalBonusCred = condition ? Math.floor(finalCred*0.6) : 0;

  // Risk contract: diff 4 + elite subfac = all-or-nothing, 2× payout
  const _isRisk = _rarity==='elite' && Math.random()<0.3;

  return{id:uid(),name,flavor,subfac:sfKey,diff,verbKey:vk,objectives:objs,duration,
    condition,repReq,rarity:_rarity,isRisk:_isRisk,govIndex:sf.govIndex??null,
    reward:{cred:finalCred,xp:baseXP,
      bonusCred:finalBonusCred,
      bonusRep:condition?Math.floor(baseXP*2.5):0,
      punchBonus,
    },
    taken:false,conditionMet:false,
  };
}

function toggleContract(cid){
  cancelAutoRun(); // player is manually selecting
  const ct=S.board.find(x=>x.id===cid);if(!ct)return;
  if(ct.taken){
    // Deselect this contract
    ct.taken=false;S.active=[];
    ct.objectives.forEach(o=>{if(o.file&&S.storage)S.storage=S.storage.filter(f=>f.id!==o.file.id);});
  }else{
    // Drop any existing selection first — one contract per run
    S.board.forEach(other=>{
      if(other.taken){other.taken=false;other.objectives.forEach(o=>{if(o.file&&S.storage)S.storage=S.storage.filter(f=>f.id!==o.file.id);});}
    });
    S.active=[];S.storage=[];
    const need=ct.objectives.filter(o=>o.file).length;
    if(need>storageMax()){addLog('Contract requires more RAM than available','lw');return;}
    // Rep requirement check
    if(ct.repReq>0){
      const fac=ct.flavor?.toLowerCase();
      const facKey=flavorToRepKey(ct.flavor);
      const sfRep=ct.subfac?S.subrep?.[ct.subfac]||0:0;
      const parentRep=facKey?S.rep[facKey]||0:0;
      const effectiveRep=Math.max(sfRep,parentRep);
      if(ct.repReq>0&&effectiveRep<ct.repReq){
        addLog(`${ct.name}: requires ${ct.repReq} rep (you have ${effectiveRep})`,'lw');
        return;
      }
    }
    ct.taken=true;S.active=[ct];
    ct.objectives.forEach(o=>{if(o.file){o.file.preloaded=true;S.storage.push(o.file);}});
    autoLoadout(ct);
  }
  renderBoard();renderSelPanel();renderPrepRAM();
  showRunSetup(S.active.length>0);
}

// LAUNCH / FINISH
function launchRun(){
  if(S.active.length===0)return;
  const tier=curTier();const[nr,nc]=gridForLevel(S.level);
  S.rows=nr;S.cols=nc;S.tier=tier;
  if(!S.stats)S.stats={};
  S.stats.runsStarted=(S.stats.runsStarted||0)+1;
  S.stats.currentRunStart=Date.now();
  S.alert=0;S.alertPressure=0;S._yellowAlertHit=false;S._huntersKilledThisRun=0;
  S._peakPressure=0;S._nodesVisitedRun=0;S._iceBreachedRun=0;
  S.stats.currentRunStart=Date.now();
  S._krakenMet=false;S._krakenSlain=false;S._vaultOpened=false;
  S._hunterTypesEncountered=new Set();S._iceEncountered=new Set();
  S.integrity=maxInt();
  S.trace=S.traceCarry||0;
  if(S.trace>0)addLog(`◎ Trace carry: ${S.trace}% from last run`,'lw');
  S.mapped=false;S.combat=null;
  S.tick=0;S.paused=false;S.contractTimers={};S._sootheCd={};
  S._runStartTime=Date.now();
  // Keep player speed preference — only reset if it was paused
  if(S.speed===0)S.speed=1;
  // Clear any backdoors from previous run (only OPS backdoor_plant sets a new one below)
  S.backdoorCell=null;
  if(S.grid.length){for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){if(S.grid[r]?.[c])S.grid[r][c].backdoor=false;}}
  S.active.forEach(ct=>{
    ct.objectives.forEach(o=>{o.done=false;o.failed=false;});
    const totalTicks=Math.floor(ct.duration/100); // 100ms per base tick
    S.contractTimers[ct.id]={ticksLeft:totalTicks,totalTicks};
  });
  if(S.backdoorCell){S.player={r:S.backdoorCell.r,c:S.backdoorCell.c,stalled:false,waitTicks:0};addLog(`⤵ Backdoor [${S.backdoorCell.r},${S.backdoorCell.c}]`,'li');S.backdoorCell=null;}
  else S.player={r:0,c:0,stalled:false,waitTicks:0};
  // Freeze a deep copy of deck state for this run
  S.runSnapshot={
    installed:[...S.installed],
    inventory:S.inventory.map(x=>({...x})),
  };
  // Guardian-disabled programs persist until defragged
  S._tarPitStacks=0;
  S._cpuBoost=0;
  S._redAlertHit=false;
  // Anarch elite perk: all ICE STR -1
  // Elite perks
  S._anarchBonus=isElite('anarch')?1:0;
  if(isLegend('anarch'))S._anarchBonus=2;
  if(S._anarchBonus)addLog(`◈ Anarch rep: ICE STR -${S._anarchBonus} this run`,'lg');
  // Corp Legend: start with 0 trace
  if(isLegend('corp')){S.trace=0;addLog('◉ Corp Legend: trace cleared at run start','lg');}
  // Crim Legend: hunters move 25% slower (applied via hunterMoveTicks)
  S._crimLegend=isLegend('crim');
  // Anarch Legend: traps never trigger
  S._anarchLegend=isLegend('anarch');
  // Neutral Legend: shop prices -20% (applied in market render)
  S._neutralLegend=isLegend('neutral');

  // Manufacturer signature perks
  const deck=hwdef();
  S._mfrPerk={};
  if(deck){
    const ri=deck.ri||0;
    const mfr=deck.mfr;
    if(ri>=2){ // rare+
      if(mfr==='weyland'){S._mfrPerk.firstHitAbsorb=true;addLog('★ Ironwall: first hit absorbed','lg');}
      if(mfr==='jinteki'){S._mfrPerk.stealthBonus=1;addLog('★ Silk Corp: +1 stealth power','lg');}
      if(mfr==='nbn')    {S._mfrPerk.traceDecay=3;addLog('★ Vantage: trace decays 3%/tick','lg');}
      if(mfr==='novatek'){S._mfrPerk.attachPowerBonus=1;addLog('★ Novatek: attachment power +1','lg');}
    }
    if(ri>=3){ // legendary+
      if(mfr==='weyland'){S._mfrPerk.combatDmgReduction=1;addLog('★ Ironwall: combat -1 damage','lg');}
      if(mfr==='jinteki'){S._mfrPerk.sneakBonus=20;addLog('★ Silk Corp: sneak +20%','lg');}
      if(mfr==='nbn')    {S._mfrPerk.alertResist=20;addLog('★ Vantage: 20% alert resist','lg');}
      if(mfr==='novatek'){S.processingSlots++;addLog('★ Novatek: extra CPU slot','lg');}
    }
    if(ri>=4){ // mythic
      if(mfr==='jinteki'){S._mfrPerk.trapImmune=true;addLog('★ Silk Corp: trap immune','lg');}
      if(mfr==='nbn')    {S._mfrPerk.autoSoothe=true;addLog('★ Vantage: auto-soothe every 5t','lg');}
      if(mfr==='novatek'){S._mfrPerk.attachDouble=true;addLog('★ Novatek: attachment effects doubled','lg');}
    }
  }

  // Apply attachment effects at run start
  const attaches=installedAttachments();
  // RAM is applied via ramMax() dynamically
  // Breaker STR boost stored in run state
  S._attachBreakerBonus=attachEffect('breaker_str');
  if(S._attachBreakerBonus)addLog(`◈ Co-Processor: breaker STR +${S._attachBreakerBonus}`,'li');
  // Trace filter
  const traceCut=attachEffect('trace_start');
  if(traceCut){S.trace=Math.max(0,S.trace-traceCut);addLog(`◎ Trace Filter: -${traceCut}% trace`,'li');}
  // Neural buffer applied via maxInt() dynamically
  // Cooling applied via soothe cooldown dynamically
  S._scanningCells=[]; // list of {r,c} with active datastore scans
  hideRunSummary();
  showRunSetup(false);
  buildGrid();
  // Convert HUNTER ICE cells to moving hunters
  if(typeof activateMobileICE==='function') activateMobileICE();
  // Apply pre-purchased intel
  // Apply queued off-grid operations (may reposition player via backdoor)
  applyNextRunOps();
  // Reassign any contract objectives that ended up before the player's start position
  if(S.player.r>0||S.player.c>0){
    if(typeof reassignObjectivesAhead==='function')
      reassignObjectivesAhead(S.player.r, S.player.c);
    renderGrid();
  }
  if(S._intelBought){
    S._intelBought=false;
    for(let r=0;r<S.rows;r++) for(let c=0;c<S.cols;c++){
      const cell=S.grid[r]?.[c]; if(cell?.ice) cell.iceRevealed=true;
    }
    addLog('⊙ Intel: all ICE positions revealed','lg');
  }
  S.running=true;_runLocked=true;
  document.getElementById('alert-badge').style.display='';
  const jb=document.getElementById('jackout-btn');if(jb)jb.style.display='';
  const gl=document.getElementById('grid-section-label');
  if(gl){
    const nk=S.mesh?.currentNet?(typeof netKey==='function'?netKey(S.mesh.currentNet.x,S.mesh.currentNet.y):'?'):'LOCAL';
    const nodeAddr_=S.mesh?.lastNodeAddr||'??';
    gl.textContent=`${nk}  ·  NODE ${nodeAddr_}`;
  }
  addLog(`▶ RUN T${tier} · ${nr}×${nc} · INT ${S.integrity}`,'li');
  // Disable install/eject on locked screens
  updateLockedBanner();
  // Switch to run tab and render everything
  if(typeof showTab==='function')showTab('run');
  renderGrid();renderRunContracts();renderPrograms();renderRunRAM();renderRunner();
  // Keep player's speed preference — only ensure not paused
  if(S.paused||S.speed===0)setSpeed(1);
  // Start at [0,0] — onArrive queues the Gatekeeper action
  onArrive(S.player.r, S.player.c);
}

function boot(){addLog('⚠ INTEGRITY ZERO — BOOTED','lb');finishRun(false,'boot');}
function jackOut(){addLog('⏏ Jack out','lw');finishRun(false,'jackout');}

function finishRun(success,reason='complete'){
  S.running=false;S.combat=null;S.player.stalled=false;
  S._freqMaskActive=false;S._glitchTraceMask=false;
  if(typeof updateGlitchOverlay==='function') updateGlitchOverlay();
  if(typeof stopGlitchCellTick==='function') stopGlitchCellTick();
  document.getElementById('combat-panel').classList.remove('active');
  // SENSOR trace spike — active sensors add trace at exit
  if((S._activeSensors||0)>0&&success){
    const spike=S._activeSensors*20;
    S.trace=Math.min(100,S.trace+spike);
    addLog(`◉ ${S._activeSensors} sensor${S._activeSensors>1?'s':''} active — +${spike} trace`,'lw');
  }
  // SERVER exit bonus — clean exit grants pending bonus
  if((S._serverBonus||0)>0&&success&&S.alert===0){
    S.cred+=S._serverBonus;
    addLog(`▣ SERVER exit bonus: +${S._serverBonus}₵ (clean exit)`,'lg');
  }
  let bdPos=null;
  for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){if(S.grid[r]?.[c]?.backdoor)bdPos={r,c};}
  S.backdoorCell=bdPos;
  let runCred=0,runCts=0;
  const now=Date.now(); // kept for run duration stats only
  S._repChanges=[];
  S.active.forEach(ct=>{
    const allDone=ct.objectives.every(o=>o.done);
    const doneCount=ct.objectives.filter(o=>o.done).length;
    const totalCount=ct.objectives.length;
    const fac=ct.flavor?.toLowerCase();
    const facKey=flavorToRepKey(ct.flavor);

    if(allDone){
      const _riskMult = ct.isRisk ? 2.0 : 1.0;
      runCred+=Math.floor(ct.reward.cred*_riskMult);runCts++;
      let repGain=ct.reward.xp;
      let bonusLog='';
      // Quest progress tracking
      if(typeof onQuestContractComplete==='function'){
        const _qDist=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
        onQuestContractComplete(facKey,_qDist,ct.companyKey);
      }

      // Evaluate condition
      if(ct.condition==='stealth'){
        if(!S._redAlertHit){
          runCred+=ct.reward.bonusCred;repGain+=ct.reward.bonusRep;
          bonusLog=` +${ct.reward.bonusCred}₵ stealth bonus`;
          ct.conditionMet=true;
        }else{
          bonusLog=' (stealth failed — Red alert hit)';
        }
      }else if(ct.condition==='speed'){
        // Speed: scale limit by grid size — larger grids get more time
        const _elapsed = Date.now() - (S._runStartTime || Date.now());
        const _gridCells = (S.rows||4) * (S.cols||4);
        const _speedLimit = Math.max(45000, Math.min(180000, _gridCells * 1200)); // 1.2s/cell, 45-180s
        if(_elapsed < _speedLimit){
          runCred+=ct.reward.bonusCred;repGain+=ct.reward.bonusRep;
          bonusLog=` +${ct.reward.bonusCred}₵ speed bonus (${Math.round(_elapsed/1000)}s)`;
          ct.conditionMet=true;
        }else{
          bonusLog=` (speed bonus missed — ${Math.round(_elapsed/1000)}s, need <60s)`;
        }
      } else if(ct.condition==='witness'){
        // Witness: complete without spawning any Hunter
        if(!(S._huntersKilledThisRun>0||(S.hunters&&S.hunters.length>0))){
          runCred+=ct.reward.bonusCred;repGain+=ct.reward.bonusRep;
          bonusLog=` +${ct.reward.bonusCred}₵ no-witness bonus`;
          ct.conditionMet=true;
        }else{
          bonusLog=' (witness condition failed — Hunter spawned)';
        }
      }

      // Government: route rep to govRep, not S.rep
      // Gov contract: chance to drop a chassis or component
      if(ct.flavor==='GOVERNMENT'&&ct.diff>=2){
        const _govRoll=Math.random();
        if(_govRoll<(ct.diff>=4?0.25:ct.diff>=3?0.12:0.06)){
          if(typeof tryDropChassis==='function') tryDropChassis('gov');
        } else if(_govRoll<(ct.diff>=4?0.55:ct.diff>=3?0.30:0.18)){
          if(typeof tryDropComponent==='function') tryDropComponent('gov_contract');
        }
      }
      if(ct.flavor==='GOVERNMENT'&&ct.govIndex!=null&&typeof addGovRep==='function'){
        addGovRep(ct.govIndex, repGain);
        const _gt=typeof govRepTier==='function'?govRepTier(ct.govIndex):{name:'Unknown'};
        const _govName=typeof getGovernmentName==='function'?getGovernmentName(ct.govIndex):'Government';
        addLog(`◈ ${ct.name}: +${repGain} gov rep (${getGovRep(ct.govIndex)} total — ${_gt.name})`,'lg');
        // Record gov rep change for run summary
        if(!S._repChanges) S._repChanges=[];
        S._repChanges.push({fac:'gov',govIndex:ct.govIndex,govName:_govName,gain:repGain,subfac:ct.subfac,subfacName:ct.name,subGain:repGain,isGov:true});
      } else if(facKey){
        const prevTier=repTierName(facKey);
        // Company/subfaction rep gain — stored in net state
        const sfKey=ct.subfac||ct.companyKey;
        const sfName=ct.subfacName||ct.companyName||sfKey||'?';
        if(sfKey){
          const ns=typeof currentNetState==='function'?currentNetState():null;
          if(ns){
            if(!ns.rep)ns.rep={};
            ns.rep[sfKey]=(ns.rep[sfKey]||0)+repGain;
            addLog(`◈ ${sfName}: +${repGain} rep (${ns.rep[sfKey]} total)`,'lg');
          } else {
            addLog(`◈ ${sfName}: +${repGain} rep (no net state — rep lost)`,'lw');
          }
        } else {
          addLog(`◈ Rep gain ${repGain} — no company key on contract`,'lw');
        }
        // Parent faction gets 30% aggregated globally across nets
        const parentGain=Math.floor(repGain*0.30)+3;
        S.rep[facKey]=(S.rep[facKey]||0)+parentGain;
        // Rep conflict on parent
        const rival=REP_CONFLICT[facKey];
        if(rival&&S.rep[rival]>0){
          const loss=Math.floor(parentGain*0.3);
          const _rivalFloor=typeof repFloor==='function'?repFloor(rival):0;
          S.rep[rival]=Math.max(_rivalFloor,(S.rep[rival]||0)-loss);
          if(loss>0)bonusLog+=` (${rival} -${loss})`;
        }
        if(facKey&&repTierName(facKey)!==prevTier)addLog(`★ ${(facKey||'').toUpperCase()} rep: ${prevTier} → ${repTierName(facKey)}`,'lp');
        // Record in repChanges for run summary
        if(!S._repChanges)S._repChanges=[];
        S._repChanges.push({fac:facKey,gain:parentGain,subfac:sfKey,subfacName:sfName,subGain:repGain,rival:rival,rivalLoss:rival?Math.floor(parentGain*0.3):0});
      }

      // Booted penalty: lose rep, but never below current tier floor
      if(!success&&facKey){
        const penalty=Math.floor(ct.reward.xp*0.5);
        const _bootFloor=typeof repFloor==='function'?repFloor(facKey):0;
        S.rep[facKey]=Math.max(_bootFloor,(S.rep[facKey]||0)-penalty);
        bonusLog+=` (booted: -${penalty} rep)`;
      }

      // Punch-above-weight bonus
      if(ct.reward.punchBonus>0){
        runCred+=ct.reward.punchBonus;
        bonusLog+=` +${ct.reward.punchBonus}₵ punch bonus`;
      }
      gainXP(ct.reward.xp);
      addLog(`✓ ${ct.name}: +${ct.reward.cred}₵${bonusLog}`,'lc');
      // Rare blueprint drop on contract completion (diff 3+ = 15%, diff 4 = 30%)
      const bpDropChance=ct.diff>=4?0.30:ct.diff>=3?0.15:0.04;
      if(Math.random()<bpDropChance)tryDropBlueprint('contract reward');
    }else{
      // Failed contract — lose rep
      if(facKey&&doneCount===0){
        const penalty=Math.floor(ct.reward.xp*0.5);
        const _failFloor=typeof repFloor==='function'?repFloor(facKey):0;
        S.rep[facKey]=Math.max(_failFloor,(S.rep[facKey]||0)-penalty);
        addLog(`✗ ${ct.name}: failed (-${penalty} ${fac} rep, floor: ${_failFloor})`,'lb');
      }else if(doneCount>0){
        const pc=Math.floor(ct.reward.cred*(doneCount/totalCount)*0.5);
        runCred+=pc;gainXP(Math.floor(ct.reward.xp*0.3));
        addLog(`~ ${ct.name}: partial +${pc}₵`,'lw');
      }
    }
  });
  // Cash out downloaded datastore files
  if(!S.storage)S.storage=[];
  const dsFiles=S.storage.filter(f=>!f.preloaded&&(f.credValue||0)>0);
  const dsCred=dsFiles.reduce((a,f)=>a+(f.credValue||0),0);
  if(dsCred>0){
    runCred+=dsCred;
    S.storage=S.storage.filter(f=>f.preloaded||!(f.credValue>0));
    addLog(`◉ Data sold: +${dsCred}₵ (${dsFiles.length} file${dsFiles.length>1?'s':''})`,'lc');
  }
  // Cash out GPU display feeds
  const gpuFiles=S.storage.filter(f=>f.type==='DISPLAY'&&f.bonusCred);
  const gpuCred=gpuFiles.reduce((a,f)=>a+(f.bonusCred||0),0);
  if(gpuCred>0){
    runCred+=gpuCred;
    S.storage=S.storage.filter(f=>!(f.type==='DISPLAY'&&f.bonusCred));
    addLog(`▣ GPU feeds: +${gpuCred}₵`,'lc');
  }
  S.traceCarry = parseFloat(Math.max(0, (success ? S.trace*0.30 : S.trace*0.70)*0.85).toFixed(2)); // 30/70 carry, 15% decay
  if(!S.stats)S.stats={};
  if(success){S.stats.runsCompleted=(S.stats.runsCompleted||0)+1;}
  else{S.stats.runsFailed=(S.stats.runsFailed||0)+1;}
  if(runCred>0&&runCred>(S.stats.bestRunCred||0))S.stats.bestRunCred=runCred;
  if(S.stats.currentRunStart){
    const dur=Date.now()-S.stats.currentRunStart;
    if(success&&dur>(S.stats.longestRun||0))S.stats.longestRun=dur;
  }
  S.stats.contractsCompleted=(S.stats.contractsCompleted||0)+runCts;
  S.cred+=runCred;S.totalCred+=runCred;S.totalRuns++;
  const activeCt=S.active[0];
  S.runHistory.unshift({tier:curTier(),success,cred:runCred,contracts:runCts,level:S.level,subfac:activeCt?.subfac,subfacName:activeCt?.subfacName||activeCt?.companyName,flavor:activeCt?.flavor,netKey:S.mesh?.currentNet&&typeof netKey==='function'?netKey(S.mesh.currentNet.x,S.mesh.currentNet.y):null,nodeAddr:S.mesh?.lastNodeAddr||null,meshDist:typeof meshDistanceCurrent==='function'?Math.floor(meshDistanceCurrent()):null});
  if(S.runHistory.length>25)S.runHistory.pop();
  document.getElementById('alert-badge').style.display='none';
  const jb=document.getElementById('jackout-btn');if(jb)jb.style.display='none';
  _runLocked=false;updateLockedBanner();
  const gl=document.getElementById('grid-section-label');if(gl)gl.textContent='GRID PREVIEW';

  // Build summary before clearing state
  _lastRunSummary={
    reason, success,
    contract:S.active[0]||null,
    runCred,
    cred:runCred,           // alias for achievement checks
    contractCred:runCred-dsCred-gpuCred,
    dsCred, dsFiles:[...dsFiles],
    gpuCred,
    punchBonus:S.active[0]?.reward?.punchBonus||0,
    integrityLeft:S.integrity, integrityMax:maxInt(),
    traceEnd:S.trace,
    alertReached:S._redAlertHit?'RED':S.alert===1?'YELLOW':'GREEN',
    filesInRAM:[...S.storage],
    repChanges:[...S._repChanges||[]],
    conditionMet:S.active[0]?.conditionMet||false,
    runDuration:S.stats?.currentRunStart?Date.now()-S.stats.currentRunStart:0,
    damageThisRun:S.stats?.totalDamageReceived||0,
    peakPressure:S._peakPressure||0,
    nodesVisitedRun:S._nodesVisitedRun||0,
    iceBreachedRun:S._iceBreachedRun||0,
    realMs:Date.now()-(S._runStartTime||Date.now()),
    cred:runCred,
    contracts:runCts,
    yellowAlertHit:S._yellowAlertHit||false,
    redAlertHit:S._redAlertHit||false,
    copsSilenced:S._copsSilencedThisRun||0,
  };

  // Check run + progression achievements
  if(typeof checkRunAchievements==='function')checkRunAchievements(_lastRunSummary);
  if(typeof checkProgressionAchievements==='function')checkProgressionAchievements();
  S.active=[];S.board=[];
  // Mark node complete on success; always clear activeNodeAddr
  if(S.mesh?.currentNet && S.mesh?.activeNodeAddr){
    if(success){
      const ns = typeof currentNetState==='function'?currentNetState():null;
      if(ns){
          markNodeComplete(S.mesh.activeNodeAddr);
          addLog(`◈ Node ${S.mesh.activeNodeAddr} complete`,'lg');
          if(typeof checkAscensionTrigger==='function') checkAscensionTrigger();
          if(typeof onQuestNodeComplete==='function'){ const qNs=typeof currentNetState==='function'?currentNetState():null; const _qV=parseInt(S.mesh.activeNodeAddr,16);const qNode=qNs?.layout?.[_qV&0xF]?.[_qV>>4]; if(typeof onQuestNodeComplete==='function') onQuestNodeComplete(qNode?.nodeType,typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0,S.mesh.activeNodeAddr); }
          // Check for FF completion — triggers uplift/travel
          if(S.mesh.activeNodeAddr==='FF'){
            const isOriginNet = S.mesh.currentNet.x===0 && S.mesh.currentNet.y===0;
            // First-time uplift (net 0:0 only)
            if(isOriginNet && !S.mesh.traversalUnlocked){
              S.mesh.traversalUnlocked = true;
              addLog('','li');
              addLog('◈ ◈ ◈ UPLIFT GRANTED ◈ ◈ ◈','lp');
              addLog('Mesh traversal unlocked. The coordinate space opens before you.','li');
              addLog('Net 0:0 is behind you. The rest of the Mesh awaits.','li');
              addLog('','li');
              const meshTab = document.getElementById('tab-mesh');
              if(meshTab) meshTab.style.display='';
              try{localStorage.setItem('mesh_autorun_unlocked','1');localStorage.setItem('mesh_autorun','1');}catch(e){}
              if(typeof toggleAutoRun==='function'&&!_autoRunEnabled) toggleAutoRun();
              const autoBtn=document.getElementById('autorun-toggle-btn');
              if(autoBtn) autoBtn.style.display='';
              if(typeof autoSave==='function') autoSave();
            }
            // If autorun is on and traversal is unlocked, auto-travel to next uncompleted net
            if(_autoRunEnabled && S.mesh.traversalUnlocked){
              addLog('◈ NET CLEARED — Uplifting to next net…','lp');
              S._pendingUpliftTravel = true;
              // Show lore briefing for this depth tier
              const curDist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
              S._pendingUpliftBriefing = true;
              if(typeof showUpliftBriefing==='function') setTimeout(()=>{ S._pendingUpliftBriefing=false; showUpliftBriefing(curDist, false); }, 400);
            }
          }
        }
    }
    // Remember last visited node so net map can center on it
    S.mesh.lastNodeAddr = S.mesh.activeNodeAddr;
    S.mesh.activeNodeAddr = null;
  }
  generateBoard();renderTopBar();autoSave();
  if(typeof saveTraitCpuState==='function') saveTraitCpuState();
  if(typeof checkQuestTriggers==='function') checkQuestTriggers();
  if(typeof checkStoryUnlocks==='function') checkStoryUnlocks();
  // Update net tab if active
  if(document.getElementById('tab-net-content')?.classList.contains('active')&&typeof renderNetTab==='function') renderNetTab();
  // Show run summary, then return to net map (or board for non-net runs)
  S.running = false;
  S.combat  = null;
  if(S.mesh?.currentNet){
    const runPanel = document.getElementById('tab-run-content');
    if(runPanel) runPanel.style.removeProperty('display');
    // If uplift briefing will show (FF just completed), skip run summary
    if(!S._pendingUpliftBriefing){
      showRunSummary();
    }
    if(typeof startAutoRunCountdown==='function') startAutoRunCountdown();
  } else {
    showRunSummary();
    if(typeof startAutoRunCountdown==='function') startAutoRunCountdown();
  }
}

// RENDER
