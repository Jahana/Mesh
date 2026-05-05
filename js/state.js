// MESH v0.2 — state.js
// ====================

// AUTORUN
let _autoRunTimer=null;
let _autoRunCountdown=0;
let _runLocked=false;
let _autoRunEnabled=true; // toggle persisted separately
let _lastRunSummary=null;

// ── DYNAMIC TICK COST FUNCTIONS ───────────────────────────────────────────
// All costs in ticks at 10 ticks/second (BASE_TICK_MS = 100ms)

function moveTicks(){
  const deckBonus=DECK_MOVE_BONUS[S.hardware]||0;
  const tarPit=(S._tarPitStacks||0)*4;
  return Math.max(4, BASE_MOVE_TICKS - deckBonus + tarPit);
}

function combatTicks(){
  const attachBonus=attachEffect('breaker_str')>0?2:0;
  return Math.max(4, BASE_COMBAT_TICKS - attachBonus);
}

function scanTicks(){
  // Scanner v1: -3 ticks, Scanner v2: -7 ticks
  const hasScan2=runInst().some(iid=>{const it=runInv().find(x=>x.instId===iid);return pdef(it?.defId)?.id==='scan_2';});
  const hasScan1=runInst().some(iid=>{const it=runInv().find(x=>x.instId===iid);return pdef(it?.defId)?.id==='scan_1';});
  const reduction=hasScan2?7:hasScan1?3:0;
  return Math.max(3, BASE_SCAN_TICKS - reduction);
}
function downloadTicks(){
  return Math.max(3, BASE_DOWNLOAD_TICKS);
}
function decryptTicks(){
  // Decrypt v2 (passive) is faster
  const hasDec2=runInst().some(iid=>{const it=runInv().find(x=>x.instId===iid);return pdef(it?.defId)?.id==='decrypt_2';});
  return Math.max(3, BASE_DECRYPT_TICKS - (hasDec2?5:0));
}

// ── AUTO LOADOUT ──────────────────────────────────────────────────────────
function bestOwned(effect){
  // Return the highest-tier uninstalled program with the given effect
  return S.inventory
    .filter(it=>{const d=pdef(it.defId);return d&&d.effect===effect&&!it.installed;})
    .sort((a,b)=>(pdef(b.defId)?.tier||0)-(pdef(a.defId)?.tier||0))[0]||null;
}
function bestBreakerOwned(iceType){
  return S.inventory
    .filter(it=>{const d=pdef(it.defId);return d&&d.cat==='breaker'&&d.iceTypes?.includes(iceType)&&!it.installed;})
    .sort((a,b)=>(pdef(b.defId)?.str||0)-(pdef(a.defId)?.str||0))[0]||null;
}
function tryInstall(item){
  if(!item||item.installed)return false;
  const d=pdef(item.defId);if(!d)return false;
  if(ramUsed()+d.mem>ramMax())return false;
  item.installed=true;S.installed.push(item.instId);
  return true;
}

function autoLoadout(contract){
  // Eject everything first for a clean slate
  S.installed.forEach(iid=>{const it=S.inventory.find(x=>x.instId===iid);if(it)it.installed=false;});
  S.installed=[];

  const actions=contract?contract.objectives.map(o=>o.action):[];
  const isStealthy=contract?.condition==='stealth';
  const tier=curTier();

  // ── REQUIRED programs (contract-driven) ──────────────────────────────
  // Decrypt: needed if any contract files are encrypted, or upload/modify actions
  if(actions.some(a=>['upload','modify','collect','collect_delete'].includes(a))||
     contract?.objectives.some(o=>o.file?.encrypted||o.targetFile?.encrypted)){
    tryInstall(bestOwned('decrypt'));
  }
  // Intercept: needed for display/GPU contracts
  if(actions.includes('display'))tryInstall(bestOwned('intercept'));
  // Scanner: always useful (trap reveal + datastore ID); always install if owned
  tryInstall(bestOwned('scan'));

  // ── BREAKERS (by danger priority) ────────────────────────────────────
  // Killer handles Guardian + Hunter (most dangerous) — install first
  tryInstall(bestBreakerOwned('GUARDIAN'));
  // Fracter for Barrier
  tryInstall(bestBreakerOwned('BARRIER'));
  // Decoder for Gatekeeper (always present)
  tryInstall(bestBreakerOwned('GATEKEEPER'));

  // ── UTILITY fill (priority order) ────────────────────────────────────
  const utilOrder=isStealthy
    ?['stealth','soothe','deceive','zap','armor','overclock','ghost','spoof']
    :['soothe','zap','deceive','stealth','armor','overclock','ghost','spoof'];

  for(const effect of utilOrder){
    if(ramUsed()>=ramMax())break;
    tryInstall(bestOwned(effect));
  }

  renderDeck();renderTopBar();
  addLog(`◈ Loadout: ${S.installed.length} programs, ${ramUsed()}/${ramMax()} RAM`,'li');
}

function autoSelectContracts(){
  // Clear current selection
  S.board.forEach(ct=>{
    if(ct.taken){ct.taken=false;ct.objectives.forEach(o=>{if(o.file)S.deckRAM=S.deckRAM.filter(f=>f.id!==o.file.id);});}
  });
  S.active=[];S.deckRAM=[];
  // Pick exactly ONE contract — highest reward that fits in RAM
  const sorted=[...S.board].sort((a,b)=>b.reward.cred-a.reward.cred);
  const picked=sorted.find(ct=>{
    const need=ct.objectives.filter(o=>o.file).length;
    if(need>S.deckRAMMax)return false;
    if(ct.repReq>0){
      const facKey=typeof flavorToRepKey==='function'?flavorToRepKey(ct.flavor):null;
      const sfRep=ct.subfac?S.subrep?.[ct.subfac]||0:0;
      const parentRep=facKey?S.rep[facKey]||0:0;
      if(Math.max(sfRep,parentRep)<ct.repReq)return false;
    }
    return true;
  });
  if(picked){
    picked.taken=true;S.active=[picked];
    picked.objectives.forEach(o=>{if(o.file){o.file.preloaded=true;S.deckRAM.push(o.file);}});
    autoLoadout(picked);
  }else{
    autoLoadout(null);
  }
  renderBoard();renderSelPanel();renderPrepRAM();
  // Switch to run tab and show setup panel so player sees the new contract
  if(typeof showTab==='function')showTab('run');
  showRunSetup(S.active.length>0);
}

function toggleAutoRun(){
  _autoRunEnabled=!_autoRunEnabled;
  try{localStorage.setItem('mesh_autorun',_autoRunEnabled?'1':'0');}catch(e){}
  const btn=document.getElementById('autorun-toggle-btn');
  if(btn){btn.textContent=_autoRunEnabled?'AUTO ●':'AUTO ○';btn.style.color=_autoRunEnabled?'#40ff80':'#4a4a4a';}
  if(!_autoRunEnabled)cancelAutoRun();
  addLog(`Auto-run ${_autoRunEnabled?'enabled':'disabled'}`,'li');
}
function loadAutoRunPref(){
  try{const v=localStorage.getItem('mesh_autorun');if(v!==null)_autoRunEnabled=v==='1';}catch(e){}
  const btn=document.getElementById('autorun-toggle-btn');
  if(btn){btn.textContent=_autoRunEnabled?'AUTO ●':'AUTO ○';btn.style.color=_autoRunEnabled?'#40ff80':'#4a4a4a';}
}

function startAutoRunCountdown(){
  // Clear any existing timer first to avoid double-firing
  if(_autoRunTimer){clearInterval(_autoRunTimer);_autoRunTimer=null;}
  if(!_autoRunEnabled){
    // Auto-run off — just show READY state
    const cdEl=document.getElementById('autorun-countdown');
    const mlBtn=document.getElementById('manual-launch-btn');
    if(cdEl){cdEl.style.display='';cdEl.textContent='READY';}
    if(mlBtn)mlBtn.style.display='';
    autoSelectContracts();
    return;
  }
  _autoRunCountdown=5;
  const cdEl=document.getElementById('autorun-countdown');
  const mlBtn=document.getElementById('manual-launch-btn');
  if(cdEl)cdEl.style.display='';
  if(mlBtn)mlBtn.style.display='';
  autoSelectContracts();
  _autoRunTimer=setInterval(()=>{
    _autoRunCountdown--;
    if(cdEl)cdEl.textContent=`AUTO-RUN IN ${_autoRunCountdown}s`;
    // Update summary countdown if visible
    const sumCd=document.getElementById('sum-cd');
    if(sumCd&&sumCd.closest('#run-summary')?.style.display!=='none'){
      sumCd.textContent=`Next run in ${_autoRunCountdown}s...`;
    }
    if(_autoRunCountdown<=0){
      clearInterval(_autoRunTimer);_autoRunTimer=null;
      if(cdEl)cdEl.style.display='none';
      if(mlBtn)mlBtn.style.display='none';
      hideRunSummary();
      if(_autoRunEnabled&&S.active.length>0){
        autoMaintenance();
        if(typeof pendingAutoMaint==='function'&&pendingAutoMaint()){
          // Defrag in progress — show prominent delay indicator
          const cdEl2=document.getElementById('autorun-countdown');
          const mlBtn2=document.getElementById('manual-launch-btn');
          if(cdEl2){cdEl2.style.display='';cdEl2.style.color='#ff8040';cdEl2.textContent='⛔ DEFRAG — launch delayed';}
          if(mlBtn2){mlBtn2.style.display='';mlBtn2.textContent='⏳ Waiting for Defrag...';}
          // Also log it
          if(typeof addLog==='function')addLog('⚡ Auto-maint: Defrag running — run launch delayed','lw');
          // Show progress in OPS tab if visible
          const waitForMaint=setInterval(()=>{
            // Estimate defrag time remaining from ops state
            const defragOp=(S.ops?.activeOps||[]).find(a=>a.opId==='prog_defrag'&&!a.done);
            const remSec=defragOp?Math.max(0,Math.ceil((defragOp.duration-(Date.now()-defragOp.startTime))/1000)):0;
            const cdEl3=document.getElementById('autorun-countdown');
            const mlBtn3=document.getElementById('manual-launch-btn');
            if(!pendingAutoMaint()){
              clearInterval(waitForMaint);
              if(cdEl3){cdEl3.style.color='#ffaa20';cdEl3.style.display='none';}
              if(mlBtn3){mlBtn3.textContent='▶ Launch Now';}
              if(_autoRunEnabled&&S.active.length>0)launchRun();
            }else{
              if(cdEl3)cdEl3.textContent=`⛔ DEFRAG${remSec>0?' — '+remSec+'s':' running'}`;
              if(mlBtn3)mlBtn3.textContent='⏳ Defrag in progress...';
            }
          },500);
        }else{
          launchRun();
        }
      }
      else if(!_autoRunEnabled){
        // Auto-run disabled — show ready state
        if(cdEl){cdEl.style.display='';cdEl.textContent='READY';}
        if(mlBtn)mlBtn.style.display='';
      }
    }
  },1000);
  if(cdEl)cdEl.textContent=`AUTO-RUN IN ${_autoRunCountdown}s`;
}

function manualLaunch(){
  if(_autoRunTimer){clearInterval(_autoRunTimer);_autoRunTimer=null;}
  const cdEl=document.getElementById('autorun-countdown');
  const mlBtn=document.getElementById('manual-launch-btn');
  if(cdEl)cdEl.style.display='none';
  if(mlBtn)mlBtn.style.display='none';
  if(S.active.length>0)launchRun();
}

function cancelAutoRun(){
  if(_autoRunTimer){clearInterval(_autoRunTimer);_autoRunTimer=null;}
  _autoRunCountdown=0;
  const cdEl=document.getElementById('autorun-countdown');
  const mlBtn=document.getElementById('manual-launch-btn');
  if(cdEl)cdEl.style.display='none';
  if(mlBtn)mlBtn.style.display='none';
}

function updateLockedBanner(){
  ['deck','market','craft','inv'].forEach(name=>{
    const panel=document.getElementById('tab-'+name+'-content');if(!panel)return;
    let banner=panel.querySelector('.run-locked-banner');
    if(_runLocked){
      if(!banner){
        banner=document.createElement('div');
        banner.className='run-locked-banner';
        banner.textContent='◈ RUN ACTIVE — Deck changes apply to next run';
        panel.prepend(banner);
      }
    }else{if(banner)banner.remove();}
  });
}

const mkState=()=>({
  cred:500,level:1,xp:0,prestige:0,
  rep:{corp:0,crim:0,anarch:0},
  hardware:'haas_common',ownedHW:['haas_common'], // Hexfield Common starter deck
  inventory:[],installed:[],
  crafting:[],
  craftedBps:[], // blueprint IDs already crafted (consumed)
  earnedBps:[], // blueprint IDs discovered (available to craft)
  attachments:[], // installed attachment IDs [{slotIdx, attachId}]
  board:[],active:[],
  deckRAM:[],deckRAMMax:8,
  running:false,tier:1,rows:3,cols:3,
  grid:[],patrols:[],hunters:[],
  player:{r:0,c:0,stalled:false,waitTicks:0},
  backdoorCell:null,
  alert:0,alertPressure:0, // 0-200 continuous; alert is derived
  integrity:10,trace:0,
  tick:0,speed:1,paused:false,
  combat:null,combatTick:0,
  contractTimers:{},_sootheCd:{},
  log:[],runHistory:[],totalRuns:0,totalCred:0,
  activeMkt:'gen',selectedBlueprint:null,
  shop:{gen:[],corp:[],crim:[],anarch:[]},
  shopNextRotate:{gen:0,corp:0,crim:0,anarch:0},
  runSnapshot:{installed:[],inventory:[]}, // frozen copy used during active run
  _cpuVisits:0, _actionTickMod:0, _overloadActive:false,
  _intelBought:false, _mfrPerk:{},
  achievements:{},
  stats:{
    runsStarted:0, runsCompleted:0, runsFailed:0,
    contractsCompleted:0, contractsFailed:0,
    iceBreached:0, iceUnbreached:0, // combat wins/losses
    trapsTriggered:0, trapsAvoided:0,
    huntersKilled:0, huntersEscaped:0,
    filesDownloaded:0, credFromFiles:0,
    totalDamageReceived:0, totalAlertRaises:0,
    nodesVisited:0,
    bestRunCred:0, longestRun:0, // ms
    currentRunStart:0,
  },
  // Run-tracking for achievements
  _yellowAlertHit:false, _huntersKilledThisRun:0, _krakenMet:false, _krakenSlain:false,
  _vaultOpened:false, _hunterTypesEncountered:new Set(), _iceEncountered:new Set(),
  // OPS state — effects queued for next run
  ops:{
    activeOps:[],      // [{id, opId, startTime, duration, done}]
    nextRun:{          // effects active on next run
      intelNodes:false, intelIce:false, intelTraps:false,
      copBribed:false, traceBonus:0, alertSuppress:false, backdoorPlant:false,
    },
  },
  // Persistent damage state
  permIntLoss:0,     // permanent integrity reduction from Black ICE
  traceCarry:0,      // trace carried over from last run
  actionQueue:[], // [{ticksLeft, ticksTotal, type, data}] — pending cell actions
  processingSlots:1, // number of parallel actions (increases with CPU nodes)
  cellActionTicks:0, // ticks remaining before current cell's action fires
});
let S=mkState();

// SAVE/LOAD
