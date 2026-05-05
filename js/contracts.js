// MESH v0.4 — contracts.js
// ========================

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

  // 75% from highest-rep subfactions, 25% from lowest-rep (new friendships)
  const allSfKeys=Object.keys(SUBFACTIONS);
  const sorted=[...allSfKeys].sort((a,b)=>(S.subrep?.[b]||0)-(S.subrep?.[a]||0));
  const familiar=sorted.slice(0,Math.ceil(sorted.length*0.6));  // top 60% by rep
  const fresh=sorted.slice(Math.ceil(sorted.length*0.6));       // bottom 40%

  for(let i=0;i<count;i++){
    const useFresh=Math.random()<0.25&&fresh.length>0;
    const pool=useFresh?fresh:familiar;
    const sfKey=pool[Math.floor(Math.random()*pool.length)];
    S.board.push(genContract(S.level,tier,null,sfKey));
  }

  S.active=[];S.deckRAM=[];
  renderBoard();renderSelPanel();renderPrepRAM();
}

// ── CREDIT SINK ACTIONS ──────────────────────────────────────────────────
function buyBoardRefresh(){
  const cost=CREDIT_SINKS.board_refresh.cost;
  if(S.cred<cost){addLog(`Board refresh costs ${cost}₵`,'lw');return;}
  S.cred-=cost;addLog(`↺ Board refreshed (-${cost}₵)`,'li');
  generateBoard();renderTopBar();autoSave();
}
function buyIntel(){
  const cost=CREDIT_SINKS.intel.cost;
  if(S.cred<cost){addLog(`Intel costs ${cost}₵`,'lw');return;}
  S.cred-=cost;S._intelBought=true;
  addLog(`⊙ Intel purchased: ICE positions revealed on next run (-${cost}₵)`,'li');
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

function genContract(level,tier,forceFlavor,forceSubfac){
  // Pick subfaction — weighted by subrep
  const sfKey=forceSubfac||pickSubfaction();
  const sf=SUBFACTIONS[sfKey]||SUBFACTIONS.freelance;
  const flavor=forceFlavor||sf.flavor||'NEUTRAL';
  const fd=sf;

  // Diff scales with level and rep
  const maxDiff=Math.min(4,Math.ceil(level/5)+1);
  const parentRep=S.rep[sf.parent]||0;
  const subRep=S.subrep?.[sfKey]||0;
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

  const credScale=(1+tier*0.3)*(fd.credMult||1.0);
  const repScale=fd.repMult||1.0;
  const baseCred=Math.floor(diff*rnd(40,70)*count*credScale);
  const baseXP=Math.floor(diff*25*(1+Math.floor(tier/3))*repScale);

  // Conditions
  let condition=null;
  const condPool=fd.conditions||[];
  if(condPool.length&&diff>=2&&Math.random()<0.35){
    condition=pick(condPool);
  }else if(diff>=3&&Math.random()<0.2){
    condition='speed';
  }

  // Punch-above-weight bonus
  const facRepTier=repTier(sf.parent||'neutral').min||0;
  const punchBonus=diff*50>facRepTier?Math.floor(baseCred*0.25):0;

  // Rep requirement — based on effective rep
  const repReq=sf.parent==='neutral'?0:(diff>=4?500:diff>=3?100:0);

  const namePool=[...(sf.names||[])];
  const name=namePool.length?pick(namePool):genName();

  return{id:uid(),name,flavor,subfac:sfKey,diff,verbKey:vk,objectives:objs,duration,
    condition,repReq,
    reward:{cred:baseCred,xp:baseXP,
      bonusCred:condition?Math.floor(baseCred*0.4):0,
      bonusRep:condition?baseXP*2:0,
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
    ct.objectives.forEach(o=>{if(o.file)S.deckRAM=S.deckRAM.filter(f=>f.id!==o.file.id);});
  }else{
    // Drop any existing selection first — one contract per run
    S.board.forEach(other=>{
      if(other.taken){other.taken=false;other.objectives.forEach(o=>{if(o.file)S.deckRAM=S.deckRAM.filter(f=>f.id!==o.file.id);});}
    });
    S.active=[];S.deckRAM=[];
    const need=ct.objectives.filter(o=>o.file).length;
    if(need>S.deckRAMMax){addLog('Contract requires more RAM than available','lw');return;}
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
    ct.objectives.forEach(o=>{if(o.file){o.file.preloaded=true;S.deckRAM.push(o.file);}});
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
  const gl=document.getElementById('grid-section-label');if(gl)gl.textContent='ACTIVE RUN';
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
  document.getElementById('combat-panel').classList.remove('active');
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
      runCred+=ct.reward.cred;runCts++;
      let repGain=ct.reward.xp;
      let bonusLog='';

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
        const t=S.contractTimers[ct.id];
        // Speed condition: completed in first 50% of time
        const ticksDone=t?(t.totalTicks-(t.ticksLeft||0)):t?.totalTicks||0;
        const elapsed=ticksDone*(100/Math.max(1,S.speed)); // approximate ms
        if(t&&t.ticksLeft>t.totalTicks*0.5){
          runCred+=ct.reward.bonusCred;repGain+=ct.reward.bonusRep;
          bonusLog=` +${ct.reward.bonusCred}₵ speed bonus`;
          ct.conditionMet=true;
        }else{
          bonusLog=' (speed bonus missed)';
        }
      }

      if(facKey){
        const prevTier=repTierName(facKey);
        // Sub-faction rep gain (full amount)
        const sfKey=ct.subfac;
        if(sfKey&&S.subrep){
          S.subrep[sfKey]=(S.subrep[sfKey]||0)+repGain;
          const sfDef=SUBFACTIONS[sfKey];
          const sfRep=S.subrep[sfKey];
          addLog(`◈ ${sfDef?.name||sfKey}: +${repGain} rep (${sfRep} total)`,'lg');
        }
        // Parent faction gets 30% of sub-faction gain + small flat
        const parentGain=Math.floor(repGain*0.30)+3;
        S.rep[facKey]=(S.rep[facKey]||0)+parentGain;
        // Rep conflict on parent
        const rival=REP_CONFLICT[facKey];
        if(rival&&S.rep[rival]>0){
          const loss=Math.floor(parentGain*0.3);
          S.rep[rival]=Math.max(0,(S.rep[rival]||0)-loss);
          if(loss>0)bonusLog+=` (${rival} -${loss})`;
        }
        if(facKey&&repTierName(facKey)!==prevTier)addLog(`★ ${(facKey||'').toUpperCase()} rep: ${prevTier} → ${repTierName(facKey)}`,'lp');
        // Record in repChanges for run summary
        if(!S._repChanges)S._repChanges=[];
        S._repChanges.push({fac:facKey,gain:parentGain,subfac:sfKey,subGain:repGain,rival:rival,rivalLoss:rival?Math.floor(parentGain*0.3):0});
      }

      // Booted penalty: lose rep
      if(!success&&facKey){
        const penalty=Math.floor(ct.reward.xp*0.5);
        S.rep[facKey]=Math.max(0,(S.rep[facKey]||0)-penalty);
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
        S.rep[facKey]=Math.max(0,(S.rep[facKey]||0)-penalty);
        addLog(`✗ ${ct.name}: failed (-${penalty} ${fac} rep)`,'lb');
      }else if(doneCount>0){
        const pc=Math.floor(ct.reward.cred*(doneCount/totalCount)*0.5);
        runCred+=pc;gainXP(Math.floor(ct.reward.xp*0.3));
        addLog(`~ ${ct.name}: partial +${pc}₵`,'lw');
      }
    }
  });
  // Cash out downloaded datastore files
  const dsFiles=S.deckRAM.filter(f=>!f.preloaded&&(f.credValue||0)>0);
  const dsCred=dsFiles.reduce((a,f)=>a+(f.credValue||0),0);
  if(dsCred>0){
    runCred+=dsCred;
    S.deckRAM=S.deckRAM.filter(f=>f.preloaded||!(f.credValue>0));
    addLog(`◉ Data sold: +${dsCred}₵ (${dsFiles.length} file${dsFiles.length>1?'s':''})`,'lc');
  }
  // Cash out GPU display feeds
  const gpuFiles=S.deckRAM.filter(f=>f.type==='DISPLAY'&&f.bonusCred);
  const gpuCred=gpuFiles.reduce((a,f)=>a+(f.bonusCred||0),0);
  if(gpuCred>0){
    runCred+=gpuCred;
    S.deckRAM=S.deckRAM.filter(f=>!(f.type==='DISPLAY'&&f.bonusCred));
    addLog(`▣ GPU feeds: +${gpuCred}₵`,'lc');
  }
  S.traceCarry=Math.floor(S.trace*0.10);
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
  S.runHistory.unshift({tier:curTier(),success,cred:runCred,contracts:runCts,level:S.level,subfac:activeCt?.subfac,flavor:activeCt?.flavor});
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
    contractCred:runCred-dsCred-gpuCred, // just contract payout
    dsCred, dsFiles:[...dsFiles],
    gpuCred,
    punchBonus:S.active[0]?.reward?.punchBonus||0,
    integrityLeft:S.integrity, integrityMax:maxInt(),
    traceEnd:S.trace,
    alertReached:S._redAlertHit?'RED':S.alert===1?'YELLOW':'GREEN',
    filesInRAM:[...S.deckRAM],
    repChanges:[...S._repChanges||[]],
    conditionMet:S.active[0]?.conditionMet||false,
    runDuration:S.stats?.currentRunStart?Date.now()-S.stats.currentRunStart:0,
    damageThisRun:S.stats?.totalDamageReceived||0,
    peakPressure:S._peakPressure||0,
    nodesVisitedRun:S._nodesVisitedRun||0,
    iceBreachedRun:S._iceBreachedRun||0,
  };

  // Check run + progression achievements
  if(typeof checkRunAchievements==='function')checkRunAchievements(_lastRunSummary);
  if(typeof checkProgressionAchievements==='function')checkProgressionAchievements();
  S.active=[];S.board=[];
  generateBoard();renderTopBar();renderBoard();autoSave();
  showRunSummary();
  // Restart autorun countdown — autoSelectContracts runs inside this
  if(typeof startAutoRunCountdown==='function')startAutoRunCountdown();
}

// RENDER
