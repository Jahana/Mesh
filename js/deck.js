
// ── FACTION INVESTMENTS ───────────────────────────────────────────────────
function buyInvestment(invId){
  const def=typeof INVESTMENTS!=='undefined'?INVESTMENTS.find(x=>x.id===invId):null;
  if(!def){ addLog('Investment not found','lw'); return; }
  if(!S.investments) S.investments=[];
  if(S.investments.find(x=>x.id===invId)){ addLog('Already active','lw'); return; }
  const facRep=S.rep?.[def.faction]||0;
  if(facRep<def.minRep){ addLog(`Need ${def.minRep} ${def.faction} rep`,'lw'); return; }
  if(def.minDist){
    const d=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
    if(d<def.minDist){ addLog(`Need dist ${def.minDist}+`,'lw'); return; }
  }
  if((S.cred||0)<def.cost){ addLog(`Need ${def.cost}₵`,'lw'); return; }
  S.cred-=def.cost;
  S.investments.push({id:invId,active:true,lastPaid:Date.now(),totalEarned:0});
  addLog(`◈ Investment active: ${def.name} (+${def.income}₵/${def.interval}s)`,'lp');
  renderTopBar();
  if(typeof renderHome==='function') renderHome();
}

// MESH v0.2 — deck.js
// ===================

function addInv(defId){S.inventory.push({instId:uid(),defId,installed:false});}
function instProg(instId){
  // Always allowed — changes apply to next run's snapshot, not current run
  const it=S.inventory.find(x=>x.instId===instId);if(!it||it.installed)return;
  const d=pdef(it.defId);if(!d)return;
  if(ramUsed()+d.mem>ramMax()){addLog('Insufficient RAM','lw');return;}
  it.installed=true;S.installed.push(instId);
  if(_runLocked)addLog(`Installed ${d.name} — active next run`,'li');
  renderTopBar();renderDeck();renderInventory();autoSave();
}
function ejectProg(instId){
  // Always allowed — changes apply to next run's snapshot, not current run
  const it=S.inventory.find(x=>x.instId===instId);if(!it)return;
  const ejName=pdef(it.defId)?.name||it.defId;
  it.installed=false;S.installed=S.installed.filter(x=>x!==instId);
  if(_runLocked)addLog(`Ejected ${ejName} — active next run`,'li');
  renderTopBar();renderDeck();renderInventory();autoSave();
}
function initBMRotation(){
  // Pick 4 random black market items, rotate every 10 min
  if(!S._bmRotation||!S._bmRotation.length){
    S._bmRotation=[];
    const pool=[...BLACK_MARKET_POOL];
    for(let i=0;i<Math.min(4,pool.length);i++){
      const idx=Math.floor(Math.random()*pool.length);
      S._bmRotation.push(pool.splice(idx,1)[0]);
    }
    S._bmNextRotate=Date.now()+10*60*1000;
  }
}
function tickBM(){
  if(!S._bmNextRotate||Date.now()<S._bmNextRotate)return;
  // Rotate one item out
  if(!S._bmRotation)S._bmRotation=[];
  const pool=BLACK_MARKET_POOL.filter(x=>!S._bmRotation.some(b=>b.id===x.id));
  if(pool.length){
    S._bmRotation.shift();
    S._bmRotation.push(pool[Math.floor(Math.random()*pool.length)]);
  }
  S._bmNextRotate=Date.now()+10*60*1000;
}
function buyBMItem(bmId){
  initBMRotation();
  const item=S._bmRotation.find(x=>x.id===bmId);if(!item)return;
  const _bmTrait=typeof traitBmCostMult==='function'?traitBmCostMult():1;
  const discountMult=(S._neutralLegend?0.8:1.0)*_bmTrait;
  const price=Math.floor((item.baseCost||5000)*discountMult);
  if(S.cred<price){addLog(`Need ${price.toLocaleString()}₵`,'lw');return;}
  S.cred-=price;
  if(item.type==='program'){addInv(item.defId);addLog(`⚠ Black market: ${item.name} acquired`,'lc');}
  else if(item.type==='attach'){
    if(canInstallAttach(item.attachId)){installAttach(item.attachId,0);addLog(`⚠ Black market: ${item.name} installed`,'lc');}
    else addLog('No attachment slot available','lw');
  }else if(item.type==='deck'){
    const dk=HARDWARE.find(h=>h.id===item.deckId);
    if(dk){S.ownedHW.push(dk.id);addLog(`⚠ Black market: ${item.name} acquired`,'lc');}
  }
  renderTopBar();renderDeck();autoSave();
}

function buyHW(id){
  const h=HARDWARE.find(x=>x.id===id);if(!h)return;
  if(S.level<h.lvl){addLog(`Requires level ${h.lvl}`,'lw');return;}
  if(S.cred<h.cost){addLog('Insufficient cred','lw');return;}
  S.cred-=h.cost;S.ownedHW.push(id);S.hardware=id;S.integrity=maxInt();
  addLog(`Purchased ${h.name}`,'lg');renderTopBar();renderDeck();autoSave();
}
function equipHW(id){
  if(!S.ownedHW.includes(id))return;
  // Unequip crafted deck if one is active
  if(S.craftedDeck?.activeStats && Object.values(S.craftedDeck.activeStats).some(v=>v)){
    S.craftedDeck.activeStats={};
    addLog('◈ Crafted deck deactivated — hardware deck equipped','lw');
  }
  S.hardware=id;S.integrity=Math.min(S.integrity,maxInt());
  while(ramUsed()>ramMax()){const l=S.installed[S.installed.length-1];if(l)ejectProg(l);else break;}
  renderTopBar();renderDeck();autoSave();
}
function buyAttach(attachId,faction){
  const a=ATTACHMENTS[attachId];if(!a)return;
  const isCred=faction==='gen';
  const cost=isCred?a.cost:Math.floor(a.cost*0.5);
  if(S.cred<cost){addLog('Insufficient cred','lw');return;}
  if(!isCred){const rk={corp:'corp',crim:'crim',anarch:'anarch'}[faction];if(rk&&(S.rep[rk]||0)<50){addLog('Insufficient rep','lw');return;}}
  if(!canInstallAttach(attachId)){addLog('No attachment slots available or already installed','lw');return;}
  S.cred-=cost;
  // Install into first free slot
  const usedSlots=(S.attachments||[]).map(a=>a.slotIdx);
  let slot=0;while(usedSlots.includes(slot))slot++;
  installAttach(attachId,slot);
  addLog(`Installed ${a.name}`,'lg');
  renderTopBar();renderDeck();renderMarket();autoSave();
}

function buyProg(defId,faction){
  const d=pdef(defId);if(!d)return;
  const isCred=faction==='gen';const cost=isCred?d.cost:Math.floor(d.cost*0.5);
  if(S.cred<cost){addLog('Insufficient cred','lw');return;}
  if(!isCred){const rk={corp:'corp',crim:'crim',anarch:'anarch'}[faction];if(rk&&(S.rep[rk]||0)<50){addLog('Insufficient rep','lw');return;}}
  S.cred-=cost;addInv(defId);addLog(`Purchased ${d.name}`,'lg');renderTopBar();renderMarket();renderInventory();autoSave();
}
// ── SHOP ROTATION ENGINE ──────────────────────────────────────────────────

function eligibleItems(faction){
  const meshDist=(typeof meshDistanceCurrent==='function')?meshDistanceCurrent():0;
  return (MKT_POOL[faction]||[]).filter(id=>{
    const d=pdef(id);
    if(!d)return false;
    const _shopDist=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
    if(d.prestigeReq&&_shopDist<d.prestigeReq*8)return false;
    if(d.minMeshDist&&meshDist<d.minMeshDist)return false;
    return true;
  });
}

function initShop(faction){
  const eligible=eligibleItems(faction);
  const max=MKT_MAX[faction]||4;
  // Pick random subset up to max, no duplicates
  const shuffled=[...eligible].sort(()=>Math.random()-0.5);
  const now=Date.now();
  // Stagger initial listing times so they don't all rotate at once
  S.shop[faction]=shuffled.slice(0,max).map((defId,i)=>({
    defId,
    listedAt:now - Math.floor(Math.random()*MKT_INTERVAL[faction])
  }));
  S.shopNextRotate[faction]=now+MKT_INTERVAL[faction];
}

function rotateShop(faction){
  const eligible=eligibleItems(faction);
  const current=S.shop[faction]||[];
  const max=MKT_MAX[faction]||4;
  const interval=MKT_INTERVAL[faction];
  const now=Date.now();

  // Count how many slots to rotate (1-2, oldest first)
  const rotateCount=Math.min(2, Math.max(1, Math.floor(max/3)));

  // Sort by listedAt ascending — oldest first
  const sorted=[...current].sort((a,b)=>a.listedAt-b.listedAt);
  const dropping=sorted.slice(0,rotateCount).map(x=>x.defId);
  const keeping=current.filter(x=>!dropping.includes(x.defId));

  // Pick new items not currently listed
  const currentIds=current.map(x=>x.defId);
  const pool=eligible.filter(id=>!currentIds.includes(id));
  const shuffled=[...pool].sort(()=>Math.random()-0.5);
  const incoming=shuffled.slice(0,rotateCount).map(defId=>({defId,listedAt:now}));

  S.shop[faction]=[...keeping,...incoming];
  S.shopNextRotate[faction]=now+interval;

  // Log rotation
  const droppingNames=dropping.map(id=>pdef(id)?.name||id).join(', ');
  const incomingNames=incoming.map(x=>pdef(x.defId)?.name||x.defId).join(', ');
  if(incoming.length>0){
    addLog(`${faction.toUpperCase()} shop: ${incomingNames} listed`,'li');
  }
  autoSave();
}

function tickShops(){
  const now=Date.now();
  ['gen','corp','crim','anarch'].forEach(faction=>{
    if(!S.shop[faction]||S.shop[faction].length===0) initShop(faction);
    if(now>=S.shopNextRotate[faction]) rotateShop(faction);
  });
}

function timeToRotate(faction){
  const ms=Math.max(0,S.shopNextRotate[faction]-Date.now());
  const s=Math.floor(ms/1000);
  const m=Math.floor(s/60);
  return m>0?`${m}m${s%60}s`:`${s}s`;
}

function showMkt(f){
  S.activeMkt=f;
  document.querySelectorAll('.mtab').forEach((t,i)=>t.classList.toggle('active',['gen','corp','crim','anarch'][i]===f));
  if(!S.shop[f]||S.shop[f].length===0)initShop(f);
  renderMarket();
}

// CRAFTING
// ── BLUEPRINT DISCOVERY ───────────────────────────────────────────────────
const STARTER_BPS=['bp_f3','bp_d3','bp_k3','bp_h2','bp_d2','bp_z2','bp_oc','bp_int','bp_dc1','bp_dc2','bp_sl3','bp_hm3','bp_anc3'];

function blueprintsEligibleToDrop(){
  // Non-starter blueprints the player is eligible for but hasn't earned yet
  return BLUEPRINTS.filter(bp=>{
    if(STARTER_BPS.includes(bp.id))return false;          // starter = always available
    if(S.earnedBps.includes(bp.id))return false;          // already earned
    if(S.craftedBps.includes(bp.id))return false;         // already crafted
    // Gate by mesh distance instead of prestige
    const _bpDist=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
    const _prog=bp.result?pdef(bp.result):null;
    const _minDist=_prog?.minMeshDist||0;
    const _pReq=bp.prestigeReq||0;
    // Convert old prestige req to dist req: P1=dist8, P2=dist16, P3=dist32, P4=dist48, P5=dist64
    const _distReq=Math.max(_minDist, _pReq*8);
    if(_bpDist<_distReq)return false;
    if(bp.isDeck&&(typeof meshDistanceCurrent!=='function'||meshDistanceCurrent()<32))return false; // mythic deck gate (dist 32+)
    // Must own previous tier
    const result=pdef(bp.result);
    if(result&&result.tier&&result.tier>1){
      const prevId=bp.result.replace(/_(\d+)$/,(_,n)=>'_'+(+n-1));
      const hasPrev=S.inventory.some(x=>x.defId===prevId)
                 || S.craftedBps.some(cbp=>{const b=BLUEPRINTS.find(x=>x.id===cbp);return b&&b.result===prevId;});
      if(!hasPrev)return false;
    }
    return true;
  });
}

function earnBlueprint(bpId, source){
  if(!bpId)return;
  if(S.earnedBps.includes(bpId)||S.craftedBps.includes(bpId))return;
  S.earnedBps.push(bpId);
  const bp=BLUEPRINTS.find(x=>x.id===bpId);
  const name=bp?bp.name:'Blueprint';
  addLog(`★ BLUEPRINT: ${name} (from ${source})`,'lp');
  autoSave();
}

function tryDropBlueprint(source){
  const eligible=blueprintsEligibleToDrop();
  if(!eligible.length)return;
  earnBlueprint(pick(eligible).id, source);
}

function startCraft(bpId){
  const bp=BLUEPRINTS.find(x=>x.id===bpId);if(!bp)return;
  if(S.craftedBps.includes(bpId)){addLog('Already crafted — check inventory','lw');return;}
  const _cd=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
  // Dist check only applies if blueprint is NOT earned (starter BPs) or has explicit bp.minDist
  const _bpEarned=STARTER_BPS.includes(bpId)||S.earnedBps.includes(bpId);
  const _dr=_bpEarned?0:Math.max(pdef(bp.result)?.minMeshDist||0,(bp.prestigeReq||0)*8);
  if(_cd<_dr){addLog(`Requires mesh dist ${_dr} (you: ${_cd.toFixed(1)})`,'lw');return;}
  // Non-starter blueprints must be earned (dropped/rewarded) first
  if(!STARTER_BPS.includes(bpId)&&!S.earnedBps.includes(bpId)){addLog('Blueprint not yet discovered','lw');return;}
  if(S.crafting.some(x=>x.blueprintId===bpId&&!x.done)){addLog('Already crafting this','lw');return;}
  if(S.cred<bp.credCost){addLog(`Need ${bp.credCost}₵ to craft`,'lw');return;}
  S.cred-=bp.credCost;
  S.crafting.push({id:uid(),blueprintId:bpId,startTime:Date.now(),craftTime:bp.craftTime*1000,done:false});
  addLog(`Crafting ${bp.name} — ${bp.credCost}₵ paid, ${bp.craftTime}s`,'li');
  renderTopBar();renderCraft();autoSave();
}
function collectCraft(craftId){
  const c=S.crafting.find(x=>x.id===craftId);if(!c||!c.done)return;
  const bp=BLUEPRINTS.find(x=>x.id===c.blueprintId);
  if(bp){
    if(bp.isDeck){
      // Mythic deck craft — add to owned hardware
      const deck=HARDWARE.find(h=>h.id===bp.result);
      if(deck){S.ownedHW.push(deck.id);S.hardware=deck.id;addLog(`★ Crafted: ${deck.name}`,'lg');}
    }else{
      addInv(bp.result);
      addLog(`✓ Crafted: ${pdef(bp.result)?.name||bp.name}`,'lg');
    }
    S.craftedBps.push(bp.id);
  }
  S.crafting=S.crafting.filter(x=>x.id!==craftId);
  // Clear selection if this was the selected blueprint (it's now gone from the list)
  if(S.selectedBlueprint===bp?.id)S.selectedBlueprint=null;
  renderCraft();renderInventory();autoSave();
}

// PRESTIGE
function triggerPrestige(){
  if(S.level<20){addLog('Requires Level 20','lw');return;}
  const pt=PRESTIGE_TREE[S.prestige];
  showModal('⚠ CONFIRM PRESTIGE',
    `<span style="color:#ff6040">EVERYTHING resets.</span> Cred, programs, hardware, level, rep — all wiped.<br><br><span style="color:#40c060">Unlocks: <b>${pt?.iceName||'?'} ICE</b> + <b>${pt?.progName||'?'}</b></span><br><br>This cannot be undone.`,
    [{label:'PRESTIGE NOW',cls:'modal-danger',fn:()=>{doPrestige();closeModal();}},{label:'Cancel',cls:'modal-cancel',fn:closeModal}]
  );
}
function doPrestige(){
  const newP=S.prestige+1;const pt=PRESTIGE_TREE[S.prestige];
  const log=[...S.log];const hist=[...S.runHistory];const tr=S.totalRuns;const tc=S.totalCred;
  S=mkState();S.prestige=newP;S.log=log;S.runHistory=hist;S.totalRuns=tr;S.totalCred=tc;
  // Reset all run-level flags
  _runLocked=false;
  S._anarchBonus=0;S._cpuBoost=0;S._tarPitStacks=0;S._disabledProgs=[];S._redAlertHit=false;
  ['gen','corp','crim','anarch'].forEach(f=>initShop(f));
  updateLockedBanner();
  ['fracter_1','decoder_1','killer_1','hide_1','soothe_1','scan_1','deceive_1'].forEach(id=>addInv(id));
  S.integrity=maxInt();addLog(`★ PRESTIGE ${newP}`,'lp');if(pt)addLog(`Unlocked: ${pt.iceName} ICE · ${pt.progName}`,'lp');
  generateBoard();renderAll();showTab('run');autoSave();
  startAutoRunCountdown();
}

// XP / LEVEL
function gainXP(amount){
  S.xp+=amount;
  if(!S.xpPool) S.xpPool=0;
  S.xpPool+=amount;
  // Update char tab if it's active
  if(document.getElementById('tab-char-content')?.classList.contains('active')&&typeof renderCharacterTab==='function') renderCharacterTab(); // spendable pool accumulates separately, never reduced by levelling
  while(S.xp>=xpToLvl(S.level)){
    S.xp-=xpToLvl(S.level);S.level++;addLog(`▲ LEVEL UP → ${S.level}`,'li');
    if(typeof checkProgressionAchievements==='function')checkProgressionAchievements();
    if(S.level===5)addLog('Unlock: Pro Rig available','li');
    if(S.level===12)addLog('Unlock: Mil-Spec available','li');
    if(S.level===16)addLog('Unlock: Ghost Frame available','li');
    if(S.level===20){addLog('◈ Level 20 reached — character stats cost curve increases past this point','li');}
  }
  renderTopBar();
}

// PROGRAM HELPERS
