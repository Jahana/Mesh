// MESH v0.2 — grid.js
// ===================

function nextPos(){
  let{r,c}=S.player;
  c++;
  if(c>=S.cols){c=0;r++;}
  if(r>=S.rows)return null;
  // Kraken row-block: only block if ALL cells in the next row have undefeated Kraken
  // (player traverses left-to-right, so if even one cell is clear they can pass)
  if(r<S.rows&&S.grid[r]){
    const rowKrakens=S.grid[r].filter(cell=>cell?.ice==='KRAKEN'&&!cell?.destroyed);
    if(rowKrakens.length>=S.cols){
      // Entire row blocked
      if(S.tick%60===0)addLog(`⬡⬡ KRAKEN blocks row ${r} — must destroy to pass`,'lb');
      return null;
    }
  }
  return{r,c};
}

// ── ACTION QUEUE ──────────────────────────────────────────────────────────
// Queued action: {ticksLeft, ticksTotal, cellR, cellC, type}
// type: 'cell' = process cell contents after delay

function queueCellAction(r, c){
  const cell=S.grid[r]?.[c]; if(!cell) return;
  let ticks=moveTicks();
  if(cell.ice&&!BASE_ICE[cell.ice]?.mobile) ticks=combatTicks()*2;
  // CPU overload reduces action tick cost
  const mod=S._actionTickMod||0;
  ticks=Math.max(4, ticks+mod);
  S.actionQueue.push({ticksLeft:ticks, ticksTotal:ticks, cellR:r, cellC:c, type:'cell'});
}

function tickActionQueue(){
  if(!S.actionQueue.length) return;
  // Process up to processingSlots actions simultaneously
  const active=S.actionQueue.slice(0, S.processingSlots);
  const completed=[];
  active.forEach(action=>{
    action.ticksLeft--;
    if(action.ticksLeft<=0) completed.push(action);
  });
  completed.forEach(action=>{
    S.actionQueue=S.actionQueue.filter(a=>a!==action);
    if(action.type==='cell') resolveCellAction(action.cellR, action.cellC);
    else if(action.type==='datastore'){
      const cell=S.grid[action.cellR]?.[action.cellC];
      if(cell) resolveDatastoreAction(cell);
    }
  });
}

function onArrive(r,c){
  const cell=S.grid[r][c]; cell.visited=true;
  if(!S.stats)S.stats={};
  S.stats.nodesVisited=(S.stats.nodesVisited||0)+1;
  S._nodesVisitedRun=(S._nodesVisitedRun||0)+1;
  const nt=NODE_DEF[cell.nodeType]||NODE_DEF.EMPTY;
  const hasAnalyzer=attachEffect('ice_reveal')>0;
  const iceTag=cell.ice?` ⚠${BASE_ICE[cell.ice]?.label||cell.ice}${hasAnalyzer?'('+iceStr(cell.ice,curTier())+')':''}`:'';;
  const trapTag=cell.trap&&!cell.trapTriggered?(cell.trapRevealed?` [TRAP:${TRAPS[cell.trap]?.label||cell.trap}]`:' [⚠TRAP]'):'';
  const objTag=S.active.some(ct=>ct.objectives.some(o=>o.targetNodeId===cell.id&&!o.done))?' ◎':'';
  addLog(`[${r},${c}] ${nt.label}${objTag}${iceTag}${trapTag}`,'');
  // Traps fire immediately on entry
  if(cell.trap&&!cell.trapTriggered){
    if(S._mfrPerk?.trapImmune||S._anarchLegend){cell.trapTriggered=true;addLog(`trap [${r},${c}] neutralized`,'lg');}
    else triggerTrap(cell);
  }
  // Queue cell action — fires after tick delay
  queueCellAction(r, c);
  // Stall movement while action pending
  S.player.stalled=true;
}

function tryStoreFile(f, sourceLabel){
  // BLUEPRINT files: convert to blueprint discovery, never store in RAM
  if(f.type==='BLUEPRINT'||f.isBlueprint){
    addLog(`★ Blueprint found at ${sourceLabel}!`,'lp');
    tryDropBlueprint(sourceLabel);
    return true; // don't store in RAM
  }
  // Try to store file in deckRAM. If full, evict least valuable non-preloaded file
  // if the new file is more valuable. Returns true if stored.
  const val=f.credValue||0;
  const available=S.deckRAMMax-S.deckRAM.length-reservedRAM();
  if(available>0){
    S.deckRAM.push(f);
    if(!S.stats)S.stats={};
    S.stats.filesDownloaded=(S.stats.filesDownloaded||0)+1;
    if(val>0)S.stats.credFromFiles=(S.stats.credFromFiles||0)+val;
    addLog(`${sourceLabel}: stored ${fLabel(f)} (${val>0?val+'₵':'no value'})`,'lg');
    renderRunRAM();
    return true;
  }
  // RAM full — check for eviction
  const evictable=S.deckRAM.filter(x=>!x.preloaded&&!x.contractTarget).sort((a,b)=>(a.credValue||0)-(b.credValue||0));
  const weakest=evictable[0];
  if(weakest&&(weakest.credValue||0)<val){
    S.deckRAM=S.deckRAM.filter(x=>x.id!==weakest.id);
    S.deckRAM.push(f);
    addLog(`${sourceLabel}: evicted ${fLabel(weakest)} (${weakest.credValue||0}₵) → ${fLabel(f)} (${val}₵)`,'lg');
    renderRunRAM();
    return true;
  }
  if(val>0)
    addLog(`${sourceLabel}: ${fLabel(f)} (${val}₵) — not worth evicting`,'');
  else
    addLog(`${sourceLabel}: RAM full — file lost`,'lw');
  return false;
}

function reservedRAM(){
  // Count: preloaded files already in RAM + pending collect/exfil objectives not yet collected
  const preloaded=S.deckRAM.filter(f=>f.preloaded).length;
  const pending=(S.active||[]).reduce((n,ct)=>
    n+ct.objectives.filter(o=>!o.done&&!o.failed&&o.targetFile&&
      ['collect','collect_delete'].includes(o.action)&&
      !S.deckRAM.some(f=>f.id===o.targetFile.id)
    ).length, 0);
  return preloaded+pending;
}


function fileIsValuable(f){
  if(!f.identified)return false; // can't judge encrypted files
  if(f.preloaded||f.contractTarget)return false; // contract file — protected
  return (FILE_VALUE[f.type]||0)>0;
}


function resolveDatastoreAction(cell){
  // Process one file phase at a time: scan -> decrypt -> download
  const files=cell.files||[];
  if(cell.dsFileIdx>=files.length){
    // All files processed
    cell.scanned=true;
    cell.scanning=false;
    addLog(`◉ DATA [${cell.r},${cell.c}]: processing complete`,'li');
    S.player.stalled=false;
    return;
  }

  const f=files[cell.dsFileIdx];
  const phase=cell.dsPhase||'scan';

  if(phase==='scan'){
    // Identify the file
    const sc=getByEffect('scan');
    if(sc.length) f.identified=true;
    if(f.encrypted&&!f.identified){
      addLog(`◉ DATA [${cell.r},${cell.c}]: ${fLabel(f)} — encrypted`,'lw');
    } else {
      // Only log file ID if it's encrypted or a special type
    if(f.encrypted||f.type==='BLUEPRINT'||f.credValue>40)addLog(`◉ DATA [${cell.r},${cell.c}]: ${fLabel(f)} identified`,'');
    }
    // Next phase: decrypt if needed, else go to download
    if(f.encrypted&&getByEffect('decrypt').length){
      cell.dsPhase='decrypt';
      S.actionQueue.push({ticksLeft:decryptTicks(),ticksTotal:decryptTicks(),cellR:cell.r,cellC:cell.c,type:'datastore'});
    } else {
      cell.dsPhase='download';
      S.actionQueue.push({ticksLeft:downloadTicks(),ticksTotal:downloadTicks(),cellR:cell.r,cellC:cell.c,type:'datastore'});
    }
    S.player.stalled=true;
    return;
  }

  if(phase==='decrypt'){
    f.encrypted=false; f.identified=true;
    addLog(`⊛ DATA [${cell.r},${cell.c}]: decrypted ${fLabel(f)}`,'li');
    cell.dsPhase='download';
    S.actionQueue.push({ticksLeft:downloadTicks(),ticksTotal:downloadTicks(),cellR:cell.r,cellC:cell.c,type:'datastore'});
    S.player.stalled=true;
    return;
  }

  if(phase==='download'){
    const val=f.credValue||0;
    if((FILE_VALUE[f.type]||0)===0){
      // Worthless files silently skipped — no log clutter
    } else {
      tryStoreFile(f,`◉ DATA [${cell.r},${cell.c}]`);
    }
    // Advance to next file
    cell.dsFileIdx++;
    cell.dsPhase='scan';
    if(cell.dsFileIdx<files.length){
      S.actionQueue.push({ticksLeft:scanTicks(),ticksTotal:scanTicks(),cellR:cell.r,cellC:cell.c,type:'datastore'});
      S.player.stalled=true;
    } else {
      cell.scanned=true;
      addLog(`◉ DATA [${cell.r},${cell.c}]: all files processed`,'li');
      S.player.stalled=false;
    }
    return;
  }
}

function resolveCellAction(r, c){
  const cell=S.grid[r]?.[c]; if(!cell) return;
  S.player.stalled=false;

  if(cell.nodeType==='EXIT'){
    addLog('◎ EXIT — run complete','lg');
    finishRun(true); return;
  }

  if(cell.ice&&!BASE_ICE[cell.ice]?.mobile){
    startCombat(cell); // combat re-stalls player
    return;
  }
  handleNodeArrival(cell);
}
function handleNodeArrival(cell){
  let handled=false;
  // Polymorph — offer swap on cell arrival if not already used this cell
  if(!cell._polymorphOffered&&S.running){
    cell._polymorphOffered=true;
    const hasPoly=getByEffect('polymorph').length||getByEffect('polymorph2').length;
    const isP2=getByEffect('polymorph2').length>0;
    if(hasPoly){
      // Build swap options
      const uninstalled=S.inventory.filter(it=>!it.installed&&it.instId);
      if(uninstalled.length>0){
        // For v1: show up to 1 swap. For v2: unlimited.
        S._polymorphPending={cellId:cell.id,v2:isP2,options:uninstalled.map(it=>it.instId)};
        renderPolymorphUI();
      }
    }
  }
  S.active.forEach(ct=>{ct.objectives.forEach(obj=>{if(obj.targetNodeId===cell.id&&!obj.done&&!obj.failed){autoDoObj(cell,ct,obj);handled=true;}});});
  if(handled)return;
  // RAM — harvest files; auto-decrypt if passive decrypt installed
  if(cell.nodeType==='RAM'&&!cell.harvested&&cell.files?.length){
    cell.harvested=true;
    cell.files.forEach(f=>{
      const ad=getByEffect('decrypt').find(({d})=>d.passive);
      if(f.encrypted&&ad){f.encrypted=false;f.identified=true;addLog(`⊛ Auto-decrypted ${fLabel(f)}`,'li');}
      tryStoreFile(f,'▦ RAM');
    });
    renderRunRAM();
  }

  // SCAN — reveal traps in current cell and adjacent (scan_2)
  if(!cell.scanDone){
    cell.scanDone=true;
    const sc=getByEffect('scan');
    if(sc.length){
      revealTrap(cell);
      // scan_2 also reveals adjacent
      const hasScan2=sc.some(({d})=>d.id==='scan_2');
      if(hasScan2){
        const dirs=[[0,1],[1,0],[0,-1],[-1,0]];
        dirs.forEach(([dr,dc])=>{
          const nc=S.grid[cell.r+dr]?.[cell.c+dc];
          if(nc&&nc.trap&&!nc.trapRevealed)revealTrap(nc);
        });
      }
    }
  }
  // CPU — tiered effects based on how many CPUs visited this run
  if(cell.nodeType==='CPU'){
    S._cpuVisits=(S._cpuVisits||0)+1;
    const visit=S._cpuVisits;

    // Every CPU visit: +2 breaker STR, +1 processing slot, reduce action ticks
    S._cpuBoost=(S._cpuBoost||0)+2;
    S.processingSlots=(S.processingSlots||1)+1;
    S._actionTickMod=(S._actionTickMod||0)-2; // each CPU speeds up action processing

    if(visit===1){
      // First CPU: map grid layout
      S.mapped=true;
      addLog(`◈ CPU #1: grid mapped, breaker +${S._cpuBoost} STR, slots ${S.processingSlots}, actions -2t`,'lg');
      renderGrid();
    }else if(visit===2){
      // Second CPU: reveal ICE on all cells
      for(let r=0;r<S.rows;r++) for(let c=0;c<S.cols;c++){
        const nc=S.grid[r]?.[c];
        if(nc&&nc.ice)nc.iceRevealed=true;
      }
      addLog(`◈ CPU #2: ICE scan complete — all ICE revealed, breaker +${S._cpuBoost} STR, slots ${S.processingSlots}`,'lg');
      renderGrid();
    }else if(visit===3){
      // Third CPU: reveal all traps
      for(let r=0;r<S.rows;r++) for(let c=0;c<S.cols;c++){
        const nc=S.grid[r]?.[c];
        if(nc&&nc.trap&&!nc.trapTriggered)nc.trapRevealed=true;
      }
      addLog(`◈ CPU #3: trap sweep complete — all traps revealed, breaker +${S._cpuBoost} STR, slots ${S.processingSlots}`,'lg');
      renderGrid();
    }else{
      // Additional CPUs: compound bonuses only
      addLog(`◈ CPU #${visit}: breaker +${S._cpuBoost} STR, slots ${S.processingSlots}, actions -${Math.abs(S._actionTickMod)}t total`,'lg');
    }

    // Overload perk: 3+ slots gives +1 damage to ICE each combat round
    if(S.processingSlots>=3&&!S._overloadActive){
      S._overloadActive=true;
      addLog(`◈ CPU OVERLOAD: combat deals +1 ICE damage per round`,'lg');
    }

    cell.cpuDone=true; // mark visited (but allow re-visits on backdoor re-entry)
  }

  // GPU — if no contract: harvest a DISPLAY file for bonus cred at exit
  if(cell.nodeType==='GPU'&&!cell.gpuDone&&!handled){
    cell.gpuDone=true;
    const ic=getByEffect('intercept');
    if(ic.length){
      // Intercept installed — harvest display feed as a file
      const f={id:uid(),type:'DISPLAY',identified:true,encrypted:false,preloaded:false,bonusCred:rnd(20,50)};
      f.credValue=f.bonusCred; tryStoreFile(f,'▣ GPU');
    }else{
      addLog('▣ GPU: Intercept program needed to capture feed','lw');
    }
  }

  // IO — if no contract: activating has network effects based on alert level
  // IO — data conduit: speeds up downloads for rest of run + small cred bonus
  if(cell.nodeType==='IO'&&!cell.activated&&!cell.ioForContract){
    cell.activated=true;
    // IO boosts download speed for this run
    S._ioBoost=(S._ioBoost||0)+1;
    const credBonus=rnd(15,35);
    S.cred+=credBonus;
    addLog(`⇄ IO [${cell.r},${cell.c}]: conduit established — downloads ${S._ioBoost>1?S._ioBoost+'× faster':'+20% faster'}, +${credBonus}₵`,'lg');
    renderTopBar();
  }

  // ARCHIVE — collect historical data, sells at exit
  if(cell.nodeType==='ARCHIVE'&&!cell.archiveCollected){
    cell.archiveCollected=true;
    const archiveVal=Math.floor(rnd(30,80)*(0.5+curTier()*0.3));
    const f={id:uid(),type:'ARCHIVE_DATA',identified:true,encrypted:false,preloaded:false,credValue:archiveVal};
    tryStoreFile(f,`◎ ARCHIVE [${cell.r},${cell.c}]`);
  }

  // COP — active threat node
  if(cell.nodeType==='COP'&&!cell.destroyed){
    if(!cell.ioBlocked){
      // First visit: block I/O, stop trace pings from this node
      cell.ioBlocked=true;
      cell.copSilenced=true;
      addLog(`⬟ COP [${cell.r},${cell.c}]: I/O blocked — pings silenced`,'lg');
      // Hunter may already be en route
      if(Math.random()<0.3){
        addLog('⬟ COP: Hunter already dispatched!','lb');
        spawnHunter();
      }
    }else{
      // Re-visit: already blocked, note it
      addLog(`⬟ COP [${cell.r},${cell.c}]: already silenced`,'');
    }
    renderGrid();
  }
  if(cell.nodeType==='COP'&&cell.destroyed){
    addLog(`⬟ COP [${cell.r},${cell.c}]: destroyed — permanently offline`,'lg');
  }

  // DATASTORE — begin queued per-file processing (player stays until done)
  if(cell.nodeType==='DATASTORE'&&!cell.scanned&&cell.files?.length){
    cell.scanned=false; // will be set true when all files processed
    cell.dsPhase='scan'; // scan -> decrypt -> download per file
    cell.dsFileIdx=0;
    cell.dsPhaseTick=0;
    addLog(`◉ DATA [${cell.r},${cell.c}]: ${cell.files.length} file${cell.files.length>1?'s':''} detected`,'li');
    // Stall player and queue datastore processing
    S.player.stalled=true;
    S.actionQueue.push({
      ticksLeft:scanTicks(), ticksTotal:scanTicks(),
      cellR:cell.r, cellC:cell.c, type:'datastore'
    });
  } else if(cell.nodeType==='DATASTORE'&&cell.scanned){
    addLog(`◉ DATA [${cell.r},${cell.c}]: already scanned`,'li');
  } else if(cell.nodeType==='DATASTORE'&&!cell.files?.length){
    addLog(`◉ DATA [${cell.r},${cell.c}]: empty`,'li');
  }
}

function autoDoObj(cell,ct,obj){
  const a=obj.action;
  // Data bomb triggers on collect
  if((a==='collect'||a==='collect_delete')&&cell.trap==='DATA_BOMB'&&!cell.trapTriggered){
    triggerTrap(cell);
  }
  if(a==='collect'||a==='collect_delete'){
    if(obj.targetFile){
      // Guarantee space — evict lowest-value non-preloaded non-contract file if needed
      if(S.deckRAM.length>=S.deckRAMMax){
        const evictable=S.deckRAM.filter(x=>!x.preloaded&&!x.contractTarget)
          .sort((a,b)=>(a.credValue||0)-(b.credValue||0));
        if(evictable.length){
          S.deckRAM=S.deckRAM.filter(x=>x.id!==evictable[0].id);
          addLog(`◉ Contract collect: evicted ${fLabel(evictable[0])} to make room`,'li');
        }
      }
      if(S.deckRAM.length<S.deckRAMMax){
        obj.targetFile.contractTarget=true; // mark so it's never evicted
        S.deckRAM.push(obj.targetFile);
        if(a==='collect_delete'&&cell.files)cell.files=cell.files.filter(f=>f.id!==obj.targetFile.id);
        completeObj(ct,obj);
      }else addLog('RAM full — cannot complete collect objective','lw');
    }else{completeObj(ct,obj);}
  }else if(a==='delete'){if(cell.files)cell.files=cell.files.filter(f=>f.id!==obj.targetFile?.id);completeObj(ct,obj);}
  else if(a==='upload'){const f=S.deckRAM.find(x=>x.id===obj.file?.id);if(f){S.deckRAM=S.deckRAM.filter(x=>x.id!==f.id);completeObj(ct,obj);}else addLog('Upload file missing','lw');}
  else if(a==='activate'){cell.activated=true;cell.ioForContract=true;completeObj(ct,obj);}
  else if(a==='modify'||a==='backdoor'){
    if(a==='backdoor')cell.backdoor=true;
    // Remove the preloaded file used for modify once complete
    if(a==='modify'&&obj.file)S.deckRAM=S.deckRAM.filter(f=>f.id!==obj.file.id);
    completeObj(ct,obj);
  }
  else if(a==='display'){
    const ic=getByEffect('intercept');
    if(ic.length){
      // Capture a GPU feed as a DISPLAY file with bonus cred
      const f={id:uid(),type:'DISPLAY',identified:true,encrypted:false,preloaded:false,bonusCred:rnd(30,80)};
      f.credValue=f.bonusCred;
      tryStoreFile(f,`▣ GPU contract [${cell.r},${cell.c}]`);
      cell.gpuDone=true;
      completeObj(ct,obj);
    }else addLog('Need Intercept program installed for display contract','lw');
  }
  else if(a==='destroy'){cell.destroyed=true;completeObj(ct,obj);}
  renderRunRAM();renderRunContracts();
}

function completeObj(ct,obj){
  obj.done=true;addLog(`✓ ${obj.desc.slice(0,32)}`,'lc');
  if(ct.objectives.every(o=>o.done))addLog(`★ CONTRACT: ${ct.name}`,'lc');
}

// PATROL / HUNTER
function raiseAlert(n){
  if(n<=0)return;
  if(S._alertSuppressOne){S._alertSuppressOne=false;addLog('⚠ Alert Suppress: raise ignored','lg');return;}
  if(isElite('crim')&&Math.random()<0.25){addLog('≋ Crim rep: alert resisted','lg');return;}
  const nbnResist=(S._mfrPerk?.alertResist||0)/100;
  if(nbnResist>0&&Math.random()<nbnResist){addLog('★ Vantage: alert resisted','lg');return;}
  const prev=pressureToAlert(S.alertPressure);
  S.alertPressure=Math.min(PRESSURE_MAX, S.alertPressure + n*PRESSURE_PER_ALERT);
  S.alert=pressureToAlert(S.alertPressure);
  if(S.alertPressure>(S._peakPressure||0))S._peakPressure=S.alertPressure;
  if(!S.stats)S.stats={};
  S.stats.totalAlertRaises=(S.stats.totalAlertRaises||0)+1;
  if(S.alert!==prev){
    addLog(`⚠ ALERT: ${'GREEN YELLOW RED'.split(' ')[S.alert]}`,'lw');
    if(S.alert>=1)S._yellowAlertHit=true;
    if(S.alert===2)S._redAlertHit=true;
  }
}

function addPressure(amount){
  // Direct pressure addition (for COP pings, traps etc.) without full level jumps
  const prev=pressureToAlert(S.alertPressure);
  S.alertPressure=Math.min(PRESSURE_MAX, S.alertPressure+amount);
  S.alert=pressureToAlert(S.alertPressure);
  if(S.alert!==prev){
    addLog(`⚠ ALERT: ${'GREEN YELLOW RED'.split(' ')[S.alert]}`,'lw');
    if(S.alert>=1)S._yellowAlertHit=true;
    if(S.alert===2)S._redAlertHit=true;
  }
}

function reducePressure(amount){
  const prev=pressureToAlert(S.alertPressure);
  S.alertPressure=Math.max(0, S.alertPressure-amount);
  S.alert=pressureToAlert(S.alertPressure);
  if(S.alert!==prev){
    addLog(`≋ ALERT: ${'GREEN YELLOW RED'.split(' ')[S.alert]}`,'lg');
  }
}

function movePatrols(){
  const{r:pr,c:pc}=S.player;
  const pressure=S.alertPressure||0;

  S.patrols.forEach(pat=>{
    // PROXY avoidance
    if((S._proxyRows||[]).includes(pat.r)||(S._proxyCols||[]).includes(pat.c)) return;

    // ── Alert-driven behaviour ─────────────────────────────────────────
    if(S.alert===2){
      // RED: patrols converge on player — move both axes toward player each step
      if(pat.r!==pr) pat.r+=pat.r<pr?1:-1;
      else {
        // Same row — advance along column toward player
        if(pat.c!==pc) pat.c+=pat.c<pc?1:-1;
        else pat.c+=pat.dir; // same cell — keep sliding
      }
      // Clamp to grid
      pat.r=Math.max(0,Math.min(S.rows-1,pat.r));
      pat.c=Math.max(0,Math.min(S.cols-1,pat.c));
    } else if(S.alert===1){
      // YELLOW: patrols sweep to player's row and cover it aggressively
      if(pat.r!==pr){
        // Drift toward player row one step
        if(Math.random()<0.4) pat.r+=pat.r<pr?1:-1;
        pat.r=Math.max(0,Math.min(S.rows-1,pat.r));
      }
      // Slide along row faster (skip proxy rows)
      pat.c+=pat.dir;
      if(pat.c<=0||pat.c>=S.cols-1) pat.dir*=-1;
    } else {
      // GREEN: spread across grid, prefer different rows from each other
      // Occasionally drift to a new row to cover the grid
      if(Math.random()<0.05){
        const otherRows=S.patrols.filter(p=>p.id!==pat.id).map(p=>p.r);
        const freeRows=[...Array(S.rows).keys()].filter(rr=>!otherRows.includes(rr));
        if(freeRows.length) pat.r=pick(freeRows);
        else pat.r=Math.max(0,Math.min(S.rows-1,pat.r+(Math.random()<0.5?1:-1)));
      }
      // Normal lateral sweep
      pat.c+=pat.dir;
      if(pat.c<=0||pat.c>=S.cols-1) pat.dir*=-1;
    }

    // ── Detection check ───────────────────────────────────────────────
    const dist=Math.abs(pat.r-pr)+Math.abs(pat.c-pc);
    // Detection range scales with alert: green=same cell, yellow=same row ≤3, red=radius 4
    const detectRange=S.alert===2?4:S.alert===1?3:0;
    const sameRow=pat.r===pr;
    const sees=S.alert===2
      ? dist<=detectRange
      : S.alert===1
        ? sameRow&&dist<=detectRange
        : pat.r===pr&&pat.c===pc; // green: exact match only

    if(sees&&!S.player.stalled){
      const g=getByEffect('ghost');
      if(g.length){addLog('◌ Ghost: patrol evaded','lg');return;}
      const dec=getByEffect('deceive');
      const spoof=getByEffect('spoof');
      if(dec.length&&S.tick%30===0){addLog('⊘ Deceive: patrol active','lg');}
      else if(spoof.length&&S.tick%30===0){addLog('⊕ Spoof: patrol active','lg');}
      else{
        raiseAlert(1);
        addLog(`Patrol query [${pat.r},${pat.c}] — no response!`,'lw');
      }
    }
  });
}

function hunterMoveTicks(){
  const tier=curTier();
  const base=Math.max(8, 20 - Math.floor(tier/2));
  return S._crimLegend?Math.floor(base*1.25):base;
}
function moveHunters(){
  const{r:pr,c:pc}=S.player;
  S.hunters.forEach((h,i)=>{
    const ht=HUNTER_TYPES[h.type||'standard']||HUNTER_TYPES.standard;
    // Per-type movement rate
    h.moveTick=(h.moveTick||0)+1;
    const myMoveTicks=ht.moveTicks||20;
    if(h.moveTick<myMoveTicks)return;
    h.moveTick=0;

    // Ghost: invisible until adjacent
    if(ht.invisible){
      const dist=Math.abs(h.r-pr)+Math.abs(h.c-pc);
      if(dist>1&&!h.ghostRevealed)h.ghostVisible=false;
      else{h.ghostVisible=true;h.ghostRevealed=true;}
    }

    // Proxy avoidance applies to patrols not hunters
    if(h.r<pr)h.r++;else if(h.r>pr)h.r--;else if(h.c<pc)h.c++;else if(h.c>pc)h.c--;

    if(h.r===pr&&h.c===pc&&!S.player.stalled){
      const htName=ht.name||'Hunter';
      addLog(`☠ ${htName} engaged!`,'lb');

      // On-contact special effects before combat
      if(ht.onContact==='raiseAlert') raiseAlert(1);
      if(ht.onContact==='disableProg'){
        const avail=(S.runSnapshot?.installed||[]).filter(iid=>!(S._disabledProgs||[]).includes(iid));
        if(avail.length){
          if(!S._disabledProgs)S._disabledProgs=[];
          const target=avail[Math.floor(Math.random()*avail.length)];
          S._disabledProgs.push(target);
          const d=pdef(S.runSnapshot.inventory.find(x=>x.instId===target)?.defId);
          addLog(`  Spike: disabled ${d?.name||'program'}`,'lx');
        }
      }
      if(ht.onContact==='spawn'&&!h._packed){
        h._packed=true;
        S.hunters.push({r:h.r+1<S.rows?h.r+1:h.r-1,c:h.c,id:uid(),type:'pack',moveTick:0});
        addLog('  Pack Hunter spawned!','lb');
      }

      S.hunters.splice(i,1);
      startCombat({r:pr,c:pc,ice:'HUNTER',id:'hc',hunterType:h.type||'standard'});
    }
  });
}

function tickCOPRepair(){
  if(!S.grid.length)return;
  for(let r=0;r<S.rows;r++) for(let c=0;c<S.cols;c++){
    const cell=S.grid[r]?.[c];
    if(cell?.nodeType==='COP'&&cell.copSilenced&&!cell.destroyed&&cell.ice==='ARCHITECT'){
      cell._repairTick=(cell._repairTick||0)+1;
      if(cell._repairTick>=60){
        cell.copSilenced=false;
        cell._repairTick=0;
        addLog(`⬟ ARCHITECT COP [${r},${c}]: auto-repaired — pings resumed`,'lw');
        renderGrid();
      }
    }
  }
}

function tickCOPPings(){
  // Active (unvisited, undestroyed, unsilenced) COPs raise trace each tick cycle
  if(!S.grid.length)return;
  let activeCOPs=0;
  for(let r=0;r<S.rows;r++) for(let c=0;c<S.cols;c++){
    const cell=S.grid[r]?.[c];
    if(cell?.nodeType==='COP'&&!cell.destroyed&&!cell.copSilenced)activeCOPs++;
  }
  if(activeCOPs>0){
    // COP pings add alert pressure (not trace) — compound with multiple COPs
    // Base 4 pressure per COP, scales with alert level
    const pressurePerCOP=S.alert>=1?6:4;
    const pingAmount=activeCOPs*pressurePerCOP;
    addPressure(pingAmount);
    // Also add small trace at Red alert
    if(S.alert>=2){
      const traceAdd=activeCOPs*1;
      S.trace=Math.min(100,S.trace+traceAdd);
    }
    if(activeCOPs>=2||(S.alert>=1&&S.alertPressure%40<6))addLog(`⬟ ${activeCOPs} COP${activeCOPs>1?'s':''}: +${pingAmount} pressure`,'lw');
  }
}

function spawnHunter(forcedType){
  for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){
    const cell=S.grid[r]?.[c];
    if(cell?.nodeType==='COP'&&!cell.destroyed&&!cell.ioBlocked){
      const type=forcedType||pickHunterType();
      const ht=HUNTER_TYPES[type]||HUNTER_TYPES.standard;
      S.hunters.push({r,c,id:uid(),type,moveTick:0});
      addLog(`◉ ${ht.name} spawned from [${r},${c}]`,'lb');
      if(S._hunterTypesEncountered)S._hunterTypesEncountered.add(type);
      return;
    }
  }
}

// GRID BUILD
function buildGrid(){
  const{rows,cols}=S;S.grid=[];
  for(let r=0;r<rows;r++){S.grid.push([]);for(let c=0;c<cols;c++)S.grid[r].push({r,c,nodeType:'EMPTY',ice:null,trap:null,trapRevealed:false,files:[],visited:false,destroyed:false,ioBlocked:false,activated:false,backdoor:false,id:uid()});}
  S.grid[0][0].nodeType='ENTRY';S.grid[0][0].ice='GATEKEEPER';
  S.grid[rows-1][cols-1].nodeType='EXIT';
  const placed=[];
  S.active.forEach(ct=>ct.objectives.forEach(obj=>{
    const cell=findFree(placed);if(!cell)return;
    cell.nodeType=obj.nodeType;obj.targetNodeId=cell.id;placed.push(cell.id);
    if(obj.targetFile)cell.files.push(obj.targetFile);
  }));
  const tier=curTier();
  // Base pool — new node types added as tier increases
  const npool=['RAM','IO','CPU','GPU','DATASTORE','COP','EMPTY','EMPTY','EMPTY'];
  if(tier>=2) npool.push('RELAY');
  if(tier>=3) npool.push('VAULT');
  if(tier>=3) npool.push('PROXY');
  if(tier>=4) npool.push('FIREWALL','FIREWALL');
  if(tier>=5) npool.push('TERMINAL');
  if(tier>=5) npool.push('ARCHIVE');
  // More EMPTY at low tiers, fewer at high
  for(let i=0;i<Math.max(0,4-tier);i++) npool.push('EMPTY');
  const iceChance=Math.min(0.60,0.12+tier*0.05);
  const staticICE=availICE().filter(k=>!BASE_ICE[k]?.mobile&&k!=='GATEKEEPER');
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const cell=S.grid[r][c];
    if(cell.nodeType==='EMPTY'&&!((r===0&&c===0)||(r===rows-1&&c===cols-1))){
      cell.nodeType=pick(npool);
      if(Math.random()<iceChance){
        const chosenIce=pick([...staticICE,null,null,null]);
        cell.ice=chosenIce;
        // Mimic: disguise as a random node type
        if(chosenIce==='MIMIC'){
          const disguisePool=['RAM','IO','CPU','GPU','DATASTORE'];
          cell.mimicDisguise=pick(disguisePool);
        }
      }
      if(cell.nodeType==='RAM')cell.files.push(mkFile());
      if(cell.nodeType==='DATASTORE'){
        const tier=curTier();
        const fileCount=rnd(Math.max(1,tier-1),Math.min(5,tier+1));
        for(let fi=0;fi<fileCount;fi++){
          cell.files.push(mkDatastoreFile(Math.random()<(0.1+tier*0.05)));
        }
        cell.scanIndex=0;
      }
      // Place traps — independent of node/ICE; higher tier/stealth = more traps
      const stealthContract=S.active[0]?.condition==='stealth';
      const trapChance=Math.min(0.50,0.05+tier*0.05+(stealthContract?0.10:0));
      if(Math.random()<trapChance&&!((r===0&&c===0)||(r===rows-1&&c===cols-1))){
        const trapPool=Object.keys(TRAPS);
        // Data bomb only on datastores/RAM; ICE spawn only if COP exists
        const eligible=trapPool.filter(t=>{
          if(t==='DATA_BOMB')return cell.nodeType==='DATASTORE'||cell.nodeType==='RAM';
          if(t==='HONEYPOT')return cell.nodeType==='EMPTY'||cell.nodeType==='DATASTORE';
          return true;
        });
        if(eligible.length>0)cell.trap=pick(eligible);
        // Honeypot disguises as DATASTORE
        if(cell.trap==='HONEYPOT'){
          cell.nodeType='DATASTORE';
          cell.files.push(mkFile(false,true)); // always encrypted bait file
          cell.scanIndex=0;
          cell.isHoneypot=true;
        }
      }
    }
  }
  // Kraken — row-blocking ICE (P5+), placed at tier 5+
  if(S.prestige>=5&&tier>=5&&Math.random()<0.3){
    const kr=rnd(1,rows-2); // not entry/exit rows
    const kc=rnd(1,cols-3); // leave room for 3 cells
    for(let dc=0;dc<3;dc++){
      const cell=S.grid[kr]?.[kc+dc];
      if(cell&&cell.nodeType!=='EXIT'&&cell.nodeType!=='ENTRY'){
        cell.ice='KRAKEN';
        cell.krakenSegment=dc; // 0=head, 1=body, 2=tail
        cell.krakenRow=kr;
      }
    }
    addLog(`⬡⬡ Kraken detected at row ${kr}!`,'lb');
    S._krakenMet=true;
  }

  // P9+: Architect ICE on COP nodes (auto-repairs when silenced)
  if(S.prestige>=9){
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const cell=S.grid[r]?.[c];
      if(cell?.nodeType==='COP'&&!cell.ice&&Math.random()<0.5){
        cell.ice='ARCHITECT';
      }
    }
  }
  S.patrols=[];
  const np=rnd(1,Math.min(2+Math.floor(tier/2),4));
  for(let i=0;i<np;i++){let pr,pc;do{pr=rnd(0,rows-1);pc=rnd(1,cols-2);}while(pr===0&&pc===0);S.patrols.push({r:pr,c:pc,dir:1,id:uid()});}
  S.hunters=[];
}

function findFree(excl){
  const cells=[];
  for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){const cell=S.grid[r][c];if(cell.nodeType==='EMPTY'&&!((r===0&&c===0)||(r===S.rows-1&&c===S.cols-1))&&!excl.includes(cell.id))cells.push(cell);}
  return cells.length?pick(cells):null;
}

function cellTraversalIndex(r,c){
  // Position in left→right, top→bottom traversal order
  return r*S.cols+c;
}

function findFreeAhead(excl, fromR, fromC){
  // Find a free cell at or after [fromR,fromC] in traversal order
  const startIdx=cellTraversalIndex(fromR,fromC);
  const cells=[];
  for(let r=0;r<S.rows;r++) for(let c=0;c<S.cols;c++){
    const cell=S.grid[r][c];
    const idx=cellTraversalIndex(r,c);
    if(idx<startIdx)continue;
    if(cell.nodeType==='EMPTY'&&!((r===S.rows-1&&c===S.cols-1))&&!excl.includes(cell.id))
      cells.push(cell);
  }
  return cells.length?pick(cells):findFree(excl); // fallback to anywhere if no cells ahead
}

function reassignObjectivesAhead(startR, startC){
  // After backdoor placement: move any objective nodes that are before the start position
  const startIdx=cellTraversalIndex(startR,startC);
  const placed=[];
  S.active.forEach(ct=>ct.objectives.forEach(obj=>{
    if(!obj.targetNodeId||obj.done)return;
    // Find the cell with this objective
    let objCell=null;
    for(let r=0;r<S.rows&&!objCell;r++) for(let c=0;c<S.cols&&!objCell;c++){
      if(S.grid[r]?.[c]?.id===obj.targetNodeId) objCell=S.grid[r][c];
    }
    if(!objCell)return;
    const objIdx=cellTraversalIndex(objCell.r,objCell.c);
    if(objIdx>=startIdx){placed.push(objCell.id);return;} // already ahead — keep it

    // Node is behind start — move it to a cell ahead
    // First clear the old cell
    objCell.nodeType='EMPTY';
    if(obj.targetFile)objCell.files=objCell.files.filter(f=>f.id!==obj.targetFile?.id);

    // Find new cell ahead
    const newCell=findFreeAhead(placed, startR, startC);
    if(newCell){
      newCell.nodeType=obj.nodeType;
      obj.targetNodeId=newCell.id;
      if(obj.targetFile)newCell.files.push(obj.targetFile);
      placed.push(newCell.id);
      addLog(`◎ Contract node relocated ahead of entry point [${newCell.r},${newCell.c}]`,'li');
    }else{
      placed.push(objCell.id); // couldn't move, leave it (rare edge case)
    }
  }));
}

function mkFile(preloaded=false,encrypted=false){
  const type=pick(FILE_TYPES);
  const baseVal=FILE_VALUE[type]||0;
  const credValue=baseVal>0?Math.floor(baseVal*(0.6+curTier()*0.3)):0;
  return{id:uid(),type,identified:!encrypted,encrypted,preloaded,credValue};
}
function mkDatastoreFile(encrypted=false){
  // Datastores can rarely contain BLUEPRINT files (~5% chance at tier 1, up to 15% at tier 7)
  const bpChance=Math.min(0.15,0.03+curTier()*0.02);
  const pool=Math.random()<bpChance?DS_FILE_TYPES:FILE_TYPES;
  const type=pick(pool);
  if(type==='BLUEPRINT')return{id:uid(),type:'BLUEPRINT',identified:true,encrypted:false,preloaded:false,credValue:0,isBlueprint:true};
  const baseVal=FILE_VALUE[type]||0;
  const credValue=baseVal>0?Math.floor(baseVal*(0.6+curTier()*0.3)):0;
  return{id:uid(),type,identified:!encrypted,encrypted,preloaded:false,credValue};
}
function fLabel(f){if(f.type==='BLUEPRINT'||f.isBlueprint)return'BLUEPRINT';if(f.type==='ARCHIVE_DATA')return`ARCHIVE(${f.credValue}₵)`;return f.identified?`${f.type}:${f.id.slice(1,5).toUpperCase()}`:`FILE:${f.id.slice(1,7).toUpperCase()}${f.encrypted?'[ENC]':''}`;}

// CONTRACTS
