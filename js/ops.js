// MESH v0.2 — ops.js — Off-grid operations
// ==========================================

function canRunOp(opId){
  const op=OPS[opId];if(!op)return{ok:false,reason:'Unknown op'};
  if(_runLocked)return{ok:false,reason:'Run in progress'};
  if(S.cred<op.cost)return{ok:false,reason:`Need ${op.cost}₵`};
  if(op.repReq>0){
    // Check any faction rep meets requirement
    const maxRep=Math.max(...Object.values(S.rep));
    if(maxRep<op.repReq)return{ok:false,reason:`Need ${op.repReq} rep`};
  }
  // Only one of each type at a time
  if((S.ops.activeOps||[]).some(a=>a.opId===opId&&!a.done))return{ok:false,reason:'Already running'};
  return{ok:true};
}

function startOp(opId){
  const op=OPS[opId];if(!op)return;
  const check=canRunOp(opId);
  if(!check.ok){addLog(`⚡ ${op.name}: ${check.reason}`,'lw');return;}
  S.cred-=op.cost;
  if(op.time===0){
    // Instant effect
    applyOpEffect(opId);
    addLog(`⚡ ${op.name}: applied (-${op.cost}₵)`,'li');
  }else{
    S.ops.activeOps.push({id:uid(),opId,startTime:Date.now(),duration:op.time*1000,done:false});
    addLog(`⚡ ${op.name}: in progress (${op.time}s, -${op.cost}₵)`,'li');
  }
  renderTopBar();renderOps();autoSave();
}

function applyOpEffect(opId){
  const op=OPS[opId];if(!op)return;
  const nr=S.ops.nextRun;
  switch(op.effect){
    case 'intel_nodes':   nr.intelNodes=true;  break;
    case 'intel_ice':     nr.intelIce=true;    break;
    case 'intel_traps':   nr.intelTraps=true;  break;
    case 'intel_full':    nr.intelNodes=nr.intelIce=nr.intelTraps=true; break;
    case 'net_cop':       nr.copBribed=true;   break;
    case 'net_trace':     nr.traceBonus=(nr.traceBonus||0)+30; break;
    case 'net_alert':     nr.alertSuppress=true; break;
    case 'net_backdoor':  nr.backdoorPlant=true; break;
    case 'maint_int':
      if(S.permIntLoss>0){S.permIntLoss--;addLog('◫ Integrity restored +1','lg');}
      else addLog('◫ No integrity loss to patch','lw');
      break;
    case 'maint_defrag':
      S._disabledProgs=[];
      addLog('⊛ Program defrag: all programs re-enabled','lg');
      break;
    case 'maint_trace':
      S.traceCarry=Math.max(0,(S.traceCarry||0)-20);
      addLog(`◌ Trace scrubbed: carry now ${S.traceCarry}%`,'lg');
      break;
  }
}

function tickOps(){
  if(!S.ops||!S.ops.activeOps)return;
  const now=Date.now();
  let changed=false;
  S.ops.activeOps.forEach(a=>{
    if(a.done)return;
    if(now-a.startTime>=a.duration){
      a.done=true;
      applyOpEffect(a.opId);
      const op=OPS[a.opId];
      addLog(`⚡ ${op?.name||a.opId}: complete`,'lg');
      changed=true;
    }
  });
  // Prune done ops older than 10s
  S.ops.activeOps=S.ops.activeOps.filter(a=>!a.done||(Date.now()-a.startTime-a.duration<10000));
  if(changed){renderOps();autoSave();}
}

function applyNextRunOps(){
  // Called at launchRun — consume queued next-run effects
  const nr=S.ops?.nextRun;if(!nr)return;
  if(nr.intelNodes){
    for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){const cell=S.grid[r]?.[c];if(cell)cell.visited=true;}
    addLog('⊙ Grid Scan: all nodes revealed','lg');
  }
  if(nr.intelIce){
    for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){const cell=S.grid[r]?.[c];if(cell&&cell.ice)cell.iceRevealed=true;}
    addLog('⬡ ICE Profile: all ICE revealed','lg');
  }
  if(nr.intelTraps){
    for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){const cell=S.grid[r]?.[c];if(cell&&cell.trap)cell.trapRevealed=true;}
    addLog('⚠ Trap Sweep: all traps revealed','lg');
  }
  if(nr.copBribed){
    // Silence first unsilenced COP
    for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){
      const cell=S.grid[r]?.[c];
      if(cell?.nodeType==='COP'&&!cell.copSilenced&&!cell.destroyed){
        cell.copSilenced=true;addLog(`⬟ COP Bribe: [${r},${c}] silenced`,'lg');break;
      }
    }
  }
  if(nr.traceBonus>0){
    S.trace=Math.max(0,S.trace-nr.traceBonus);
    addLog(`◎ Trace Ghost: -${nr.traceBonus}% trace`,'lg');
  }
  if(nr.alertSuppress){
    S._alertSuppressOne=true;
    addLog('⚠ Alert Suppress: first raise ignored','lg');
  }
  if(nr.backdoorPlant){
    // Find random interior non-entry/exit cell
    const candidates=[];
    for(let r=1;r<S.rows-1;r++)for(let c=1;c<S.cols-1;c++){
      const cell=S.grid[r]?.[c];
      if(cell&&cell.nodeType!=='EXIT'&&!cell.ice)candidates.push(cell);
    }
    if(candidates.length){
      const t=candidates[Math.floor(Math.random()*candidates.length)];
      S.player.r=t.r;S.player.c=t.c;
      addLog(`⤵ Backdoor Plant: starting at [${t.r},${t.c}]`,'lg');
    }
  }
  // Reset for next run
  S.ops.nextRun={intelNodes:false,intelIce:false,intelTraps:false,copBribed:false,traceBonus:0,alertSuppress:false,backdoorPlant:false};
}

function autoMaintenance(){
  if(typeof unlockAch==='function') unlockAch('full_maint');
  // Run applicable maintenance ops between runs (autorun only)
  // Instant ops fire immediately; defrag is allowed to delay the run
  const maintOps=OPS_BY_CAT.maint||[];
  maintOps.forEach(opId=>{
    const op=OPS[opId];if(!op)return;
    const useful=(()=>{
      switch(op.effect){
        case 'maint_int':    return op.time===0&&(S.permIntLoss||0)>0;
        case 'maint_defrag': return (S._disabledProgs||[]).length>0; // allowed even if timed
        case 'maint_trace':  return op.time===0&&(S.traceCarry||0)>0;
        default: return false;
      }
    })();
    if(!useful)return;
    if(S.cred<op.cost){addLog(`⚡ Auto-maint: can't afford ${op.name} (${op.cost}₵)`,'lw');return;}
    // Already running?
    if((S.ops?.activeOps||[]).some(a=>a.opId===opId&&!a.done))return;
    S.cred-=op.cost;
    if(op.time===0){
      applyOpEffect(opId);
      addLog(`⚡ Auto-maint: ${op.name} applied (-${op.cost}₵)`,'li');
    }else{
      // Timed op — queue it, delay launch until done
      const speedMult=S.running?(1/Math.max(1,S.speed)):1; // ops run faster when game is faster
      S.ops.activeOps.push({id:uid(),opId,startTime:Date.now(),duration:Math.floor(op.time*1000*speedMult),done:false});
      addLog(`⚡ Auto-maint: ${op.name} running (${op.time}s, -${op.cost}₵) — launch delayed`,'li');
    }
  });
}

function pendingAutoMaint(){
  // Returns true if a timed auto-maint op is still running
  return (S.ops?.activeOps||[]).some(a=>!a.done&&a.opId==='prog_defrag');
}

function renderOps(){
  const catEls={intel:'ops-intel',network:'ops-network',maint:'ops-maint'};
  Object.entries(OPS_BY_CAT).forEach(([cat,opIds])=>{
    const el=document.getElementById(catEls[cat]);if(!el)return;
    el.innerHTML='';
    opIds.forEach(opId=>{
      const op=OPS[opId];if(!op)return;
      const check=canRunOp(opId);
      const active=(S.ops?.activeOps||[]).find(a=>a.opId===opId&&!a.done);
      const nextRunEffect=getNextRunLabel(opId);
      const card=document.createElement('div');
      card.style.cssText='display:flex;align-items:center;gap:6px;padding:5px 6px;background:#0a1218;border:1px solid #1a2a1a;border-radius:3px;margin-bottom:3px;';
      let statusHtml='';
      if(active){
        const pct=Math.min(100,Math.round((Date.now()-active.startTime)/active.duration*100));
        const rem=Math.max(0,Math.ceil((active.duration-(Date.now()-active.startTime))/1000));
        statusHtml=`<div style="flex:1"><div style="height:3px;background:#1a2a1a;border-radius:2px;margin-bottom:2px"><div style="height:100%;width:${pct}%;background:#40aaff;border-radius:2px"></div></div><span style="font-size:7px;color:#40aaff">${rem}s remaining</span></div>`;
      }else if(nextRunEffect){
        statusHtml=`<span style="font-size:7px;color:#40ff80;flex:1">✓ ${nextRunEffect}</span>`;
      }else{
        statusHtml=`<button class="buy-btn" ${check.ok?'':'disabled'} onclick="startOp('${opId}')" title="${check.ok?'':''+check.reason}" style="white-space:nowrap">${op.cost}₵${op.time>0?' '+op.time+'s':''}</button>`;
      }
      card.innerHTML=`<span style="font-size:14px;color:#40c0c0;width:18px;text-align:center">${op.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:9px;color:#60c080">${op.name}</div>
          <div style="font-size:7px;color:#2a5a3a">${op.desc}</div>
          ${op.repReq?`<div style="font-size:7px;color:#6a4020">Req: ${op.repReq} rep</div>`:''}
        </div>${statusHtml}`;
      card.addEventListener('mouseenter',e=>ttShow(
        `<div style="color:#40c0c0;font-size:10px">${op.icon} ${op.name}</div><br>`+
        `<span style="color:#4a8a4a">${op.desc}</span><br><br>`+
        `Cost: <span style="color:#40ff80">${op.cost}₵</span>${op.time?`  Time: <span style="color:#40aaff">${op.time}s</span>`:'  Instant'}`+
        (op.repReq?`<br><span style="color:#aa6020">Requires ${op.repReq} rep</span>`:''),e));
      card.addEventListener('mouseleave',ttHide);
      el.appendChild(card);
    });
  });

  // Active ops
  const activeEl=document.getElementById('ops-active');
  if(activeEl){
    const active=(S.ops?.activeOps||[]).filter(a=>!a.done);
    activeEl.innerHTML=active.length===0?'<span style="color:#1a3a1a;font-size:9px">None running</span>':
      active.map(a=>{
        const op=OPS[a.opId];
        const pct=Math.min(100,Math.round((Date.now()-a.startTime)/a.duration*100));
        const rem=Math.max(0,Math.ceil((a.duration-(Date.now()-a.startTime))/1000));
        return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
          <span style="font-size:9px;color:#60c080;flex:1">${op?.icon||''} ${op?.name||a.opId}</span>
          <span style="font-size:8px;color:#40aaff">${rem}s</span>
          <div style="width:60px;height:4px;background:#1a2a1a;border-radius:2px"><div style="height:100%;width:${pct}%;background:#40aaff;border-radius:2px"></div></div>
        </div>`;
      }).join('');
  }
}

function getNextRunLabel(opId){
  const nr=S.ops?.nextRun;if(!nr)return '';
  const op=OPS[opId];if(!op)return '';
  switch(op.effect){
    case 'intel_nodes':  return nr.intelNodes?'nodes queued':'';
    case 'intel_ice':    return nr.intelIce?'ICE queued':'';
    case 'intel_traps':  return nr.intelTraps?'traps queued':'';
    case 'intel_full':   return (nr.intelNodes&&nr.intelIce&&nr.intelTraps)?'full intel queued':'';
    case 'net_cop':      return nr.copBribed?'bribe queued':'';
    case 'net_trace':    return nr.traceBonus>0?`-${nr.traceBonus}% queued`:'';
    case 'net_alert':    return nr.alertSuppress?'suppress queued':'';
    case 'net_backdoor': return nr.backdoorPlant?'backdoor queued':'';
    default: return '';
  }
}
