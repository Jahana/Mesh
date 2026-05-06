// MESH v0.2 — state.js
// ====================

// AUTORUN
let _autoRunTimer=null;
let _autoRunCountdown=0;
let _runLocked=false;
let _autoRunEnabled=false; // disabled until unlocked in net 0:0
let _lastRunSummary=null;

// ── DYNAMIC TICK COST FUNCTIONS ───────────────────────────────────────────
// All costs in ticks at 10 ticks/second (BASE_TICK_MS = 100ms)

function moveTicks(){
  const deckBonus=DECK_MOVE_BONUS[S.hardware]||0;
  const tarPit=(S._tarPitStacks||0)*4;
  const reflexBonus=typeof charTickReduction==='function'?charTickReduction():0;
  return Math.max(4, BASE_MOVE_TICKS - deckBonus - reflexBonus + tarPit);
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
    if(ct.taken){ct.taken=false;ct.objectives.forEach(o=>{if(o.file)S.storage=S.storage.filter(f=>f.id!==o.file.id);});}
  });
  S.active=[];S.storage=[];
  // Pick exactly ONE contract — highest reward that fits in RAM
  const sorted=[...S.board].sort((a,b)=>b.reward.cred-a.reward.cred);
  const picked=sorted.find(ct=>{
    const need=ct.objectives.filter(o=>o.file).length;
    if(need>storageMax())return false;
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
    picked.objectives.forEach(o=>{if(o.file){o.file.preloaded=true;S.storage.push(o.file);}});
    autoLoadout(picked);
  }else{
    autoLoadout(null);
  }
  renderBoard();renderSelPanel();renderPrepRAM();
  // Switch to run tab and show setup panel so player sees the new contract
  if(typeof showTab==='function')showTab('run');
  showRunSetup(S.active.length>0);
}


// ── NET AUTO-TRAVERSAL ────────────────────────────────────────────────────
// When autorun is enabled and we're in a net, auto-pick the next node:
// 60% chance: move towards FF (maximize col+row hex progress)
// 40% chance: random accessible adjacent node

function autoPickNextNode(){
  if(!S.mesh?.currentNet) return null;
  const ns = typeof currentNetState==='function' ? currentNetState() : null;
  if(!ns || !ns.layout) return null;

  // Find accessible unvisited nodes
  const currentAddr = S.mesh.lastNodeAddr || '00';
  const accessible = [];
  for(let row=0;row<16;row++){
    for(let col=0;col<16;col++){
      const addr = typeof nodeAddr==='function' ? nodeAddr(col,row) : ((col*16+row)&0xFF).toString(16).toUpperCase().padStart(2,'0');
      if(ns.completedNodes.includes(addr)) continue; // already done
      if(typeof isNodeAccessible==='function' && !isNodeAccessible(addr,ns)) continue;
      accessible.push({addr,col,row});
    }
  }
  if(!accessible.length) return null; // all done or blocked

  // Always check if FF itself is accessible — if so, always go there (unless quest blocks it)
  const ffNode = accessible.find(n => n.addr === 'FF');
  // Never take FF if quest blocks it, OR if clear_net step needs us in a different dist zone
  const _ffBlocked = (typeof questAutorunBlockFF==='function'&&questAutorunBlockFF()) || (typeof questClearNetDistOk==='function'&&!questClearNetDistOk());
  if(ffNode && !_ffBlocked) return 'FF';

  // Quest override: prioritize certain node types
  // Also prioritise LAB nodes if player has partial blueprint progress
  const _hasLabProgress = S._labProgress && Object.keys(S._labProgress).length > 0;
  const questNodeType = typeof questAutorunPriorityNodeType==='function'?questAutorunPriorityNodeType():(_hasLabProgress?'LAB':null);
  if(questNodeType){
    const typed = accessible.filter(n=>ns.layout?.[n.row]?.[n.col]?.nodeType===questNodeType);
    if(typed.length) return typed[Math.floor(Math.random()*typed.length)].addr;
  }

  // Quest faction preference: sort nodes by faction match
  const questFac = typeof questAutorunTargetFaction==='function' ? questAutorunTargetFaction() : null;
  if(questFac && ns.companies){
    // Only target quest faction if it actually has companies in this net
    const questFacPresent = ns.companies[questFac]?.length > 0;
    if(questFacPresent){
      const factionNodes = accessible.filter(n => {
        if(ns.completedNodes.includes(n.addr)) return false;
        const companyFac = typeof nodeFaction==='function' ? nodeFaction(n.col, n.row) : null;
        return companyFac === questFac;
      });
      if(factionNodes.length) {
        factionNodes.sort((a,b)=>(b.col+b.row)-(a.col+a.row));
        return factionNodes[0].addr;
      }
    }
  }

  // 60%: pick node that maximises progress toward FF (highest col+row)
  if(Math.random() < 0.6){
    accessible.sort((a,b)=>(b.col+b.row)-(a.col+a.row));
    return accessible[0].addr;
  }
  // 40%: random accessible node
  return accessible[Math.floor(Math.random()*accessible.length)].addr;
}

function autoApplyLoadout(contract){
  // Apply suggested loadout for the auto-picked contract
  if(!contract) return;
  const loadout = typeof computeSuggestedLoadout==='function' ? computeSuggestedLoadout(contract) : null;
  if(!loadout?.programs?.length) return;
  const toEject=[...(S.installed||[])];
  toEject.forEach(id=>{if(typeof ejectProg==='function')ejectProg(id);});
  for(const p of loadout.programs){
    const it=S.inventory.find(x=>x.instId===p.instId||x.defId===p.defId);
    if(!it)continue;
    const d=typeof pdef==='function'?pdef(it.defId):null;
    if(!d)continue;
    if((typeof ramUsed==='function'?ramUsed():0)+(d.mem||0)>(typeof ramMax==='function'?ramMax():8))break;
    if(typeof instProg==='function')instProg(it.instId);
  }
}

function launchAutoNetRun(){
  if(!S.mesh?.currentNet || !_autoRunEnabled) return false;
  const addr = autoPickNextNode();
  if(!addr){
    addLog('AUTO: All accessible nodes complete — jack out or travel to new net','li');
    return false;
  }
  // Generate contract for selected node
  const ns = typeof currentNetState==='function' ? currentNetState() : null;
  const {col,row} = typeof addrToColRow==='function' ? addrToColRow(addr) : {col:parseInt(addr[0],16),row:parseInt(addr[1],16)};
  const node = ns?.layout?.[row]?.[col];
  const contract = typeof genNodeContract==='function' ? genNodeContract(addr, ns, node) : null;
  if(contract){
    S.active = [contract];
    autoApplyLoadout(contract);
    addLog(`AUTO: Entering node ${addr} — ${node?.nodeType||'?'}`,'li');
  }
  // Enter the node
  if(typeof enterNode==='function') enterNode(addr);
  return true;
}


function autoUpliftTravel(){
  if(!S.mesh?.traversalUnlocked || !S.mesh?.currentNet) return;
  const cx = S.mesh.currentNet.x, cy = S.mesh.currentNet.y;
  const curDist = typeof meshDistance==='function' ? meshDistance(cx,cy) : 0;
  const visited = S.mesh.visitedNets || [];

  function isCleared(x,y){
    const ns = visited.find(v=>v.x===x&&v.y===y);
    return !!(ns?.completedNodes?.includes('FF'));
  }

  // BFS outward from current position to find nearest uncleared net
  // Prefer nets deeper in mesh (higher dist from origin)
  const seen = new Set();
  const queue = [{x:cx, y:cy, dist:0}];
  seen.add(cx+':'+cy);
  let best = null;

  while(queue.length > 0){
    // Score candidates: 60% deeper, 30% lateral, 10% toward 0:0
    // If a quest clear_net step is active, score toward the target dist range instead
    const _questTgtDist = typeof questAutorunTargetDist==='function' ? questAutorunTargetDist() : null;
    const _questStep = typeof activeQuestStep==='function' ? activeQuestStep() : null;
    function directionScore(n){
      const nDist = typeof meshDistance==='function' ? meshDistance(n.x,n.y) : 0;
      if(_questTgtDist && _questStep?.type==='clear_net'){
        // Score by closeness to target range midpoint
        const mid = (_questTgtDist.min + _questTgtDist.max) / 2;
        return Math.abs(nDist - mid); // lower = closer to target = preferred
      }
      const roll = Math.random();
      if(roll < 0.60) return -nDist;      // 60%: prefer deeper (higher dist = lower score)
      else if(roll < 0.90) return 0;      // 30%: lateral (neutral)
      else return nDist;                  // 10%: toward origin (lower dist = lower score)
    }
    queue.sort((a,b)=>{
      if(a.dist!==b.dist) return a.dist-b.dist; // BFS hop distance first
      return directionScore(a)-directionScore(b);
    });
    const cur = queue.shift();

    // Skip current net on first iteration
    if(cur.x===cx && cur.y===cy){
      // Enqueue cardinal neighbors
      [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx,dy])=>{
        const nx=cur.x+dx, ny=cur.y+dy;
        if(nx<0||ny<0) return;
        const k=nx+':'+ny;
        if(!seen.has(k)){ seen.add(k); queue.push({x:nx,y:ny,dist:cur.dist+1}); }
      });
      continue;
    }

    if(!isCleared(cur.x, cur.y)){
      best = cur;
      break; // found nearest uncleared
    }

    // Cleared — keep searching but limit BFS depth to 8 hops
    if(cur.dist < 8){
      [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx,dy])=>{
        const nx=cur.x+dx, ny=cur.y+dy;
        if(nx<0||ny<0) return;
        const k=nx+':'+ny;
        if(!seen.has(k)){ seen.add(k); queue.push({x:nx,y:ny,dist:cur.dist+1}); }
      });
    }
  }

  if(!best){
    addLog('AUTO: No uncleared nets within range — jack out and explore','li');
    return;
  }

  const nk = typeof netKey==='function' ? netKey(best.x,best.y) : '?';
  const bestDist = typeof meshDistance==='function' ? meshDistance(best.x,best.y).toFixed(1) : '?';
  const deeper = meshDistance(best.x,best.y) > curDist;
  addLog(`AUTO: Uplifting to net ${nk} (dist ${bestDist}${deeper?' — going deeper':''})…`,'lp');
  S._pendingUpliftTravel = false;
  S._autoTravelCount=(S._autoTravelCount||0)+1;
  if(S._autoTravelCount>=10&&typeof unlockAch==='function') unlockAch('auto_travel');

  // Cleared nets do not auto-enter — just show the net map
  // (travelToNet auto-enters only if FF not cleared, which is guaranteed here)
  if(typeof travelToNet==='function') travelToNet(best.x, best.y);
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
  // Unlocked if: localStorage flag set OR S.mesh.traversalUnlocked is true (from save)
  const lsUnlocked = (()=>{ try{ return localStorage.getItem('mesh_autorun_unlocked')==='1'; }catch(e){return false;} })();
  const saveUnlocked = !!(S.mesh?.traversalUnlocked);
  const unlocked = lsUnlocked || saveUnlocked;

  if(unlocked){
    // Ensure localStorage is in sync
    try{ localStorage.setItem('mesh_autorun_unlocked','1'); }catch(e){}
    const pref = (()=>{ try{ return localStorage.getItem('mesh_autorun'); }catch(e){return null;} })();
    _autoRunEnabled = pref !== '0'; // default on if unlocked
  } else {
    _autoRunEnabled = false;
  }

  const btn = document.getElementById('autorun-toggle-btn');
  if(btn){
    btn.style.display = unlocked ? '' : 'none';
    btn.textContent = _autoRunEnabled ? 'AUTO ●' : 'AUTO ○';
    btn.style.color  = _autoRunEnabled ? '#40ff80' : '#4a4a4a';
  }
}

function startAutoRunCountdown(){
  // Clear any existing timer first to avoid double-firing
  if(_autoRunTimer){clearInterval(_autoRunTimer);_autoRunTimer=null;}
  const inNet = !!S.mesh?.currentNet;
  if(!_autoRunEnabled){
    if(!inNet){
      const cdEl=document.getElementById('autorun-countdown');
      const mlBtn=document.getElementById('manual-launch-btn');
      if(cdEl){cdEl.style.display='';cdEl.textContent='READY';}
      if(mlBtn)mlBtn.style.display='';
      autoSelectContracts();
    }
    return;
  }
  _autoRunCountdown=5;
  const cdEl=document.getElementById('autorun-countdown');
  const mlBtn=document.getElementById('manual-launch-btn');
  if(cdEl)cdEl.style.display='';
  if(mlBtn)mlBtn.style.display='';
  if(!inNet)autoSelectContracts();
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
      if(_autoRunEnabled){
        // Pending uplift travel (FF just completed)
        if(S._pendingUpliftTravel){
          S._pendingUpliftTravel=false;
          autoUpliftTravel();
          return;
        }
        autoMaintenance();
        // Net mode: auto-pick and enter next node
        if(S.mesh?.currentNet){
          launchAutoNetRun();
          return;
        }
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
  cred:500,level:1,xp:0,xpPool:0,prestige:0,
  rep:{corp:0,crim:0,anarch:0,neutral:0,gov:0,ai:0},
  hardware:'haas_common',ownedHW:['haas_common'], // Hexfield Common starter deck
  inventory:[],installed:[],
  crafting:[],
  craftedBps:[], // blueprint IDs already crafted (consumed)
  earnedBps:[], // blueprint IDs discovered (available to craft)
  attachments:[], // installed attachment IDs [{slotIdx, attachId}]
  board:[],active:[],
  storage:[],
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
  loreLog:[], // [{id, title, flavor, mechanics, footer, meshDist, netKey, ts}]
  quests:null, // initialized by initQuests()
  charStats:{neural_buffer:0,reflex:0,stealth:0,integrity:0,trace_resist:0,intrusion:0},
  mesh: null,   // initialized on first jack-in or new game
  world: null,  // real world state
  inTutorial: false,
  tutorialNet: null,
  tutorialNode: null,
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
