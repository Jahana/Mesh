// MESH v0.5.4 — main.js
// ===================

let tickAccum=0,lastTs=null;
let _shopCdTick=0;

function gameTick(ts){
  if(!lastTs)lastTs=ts;
  const dt=Math.min(ts-lastTs,500); lastTs=ts;
  requestAnimationFrame(gameTick);

  // Ops tick even when not running
  if(typeof tickOps==='function')tickOps();

  // Shop rotation — every 5s
  _shopCdTick+=dt;
  if(_shopCdTick>=5000){
    _shopCdTick=0;
    tickShops();
    const mktOpen=document.getElementById('tab-market-content')?.classList.contains('active');
    if(mktOpen){
      ['gen','corp','crim','anarch'].forEach(f=>{
        const el=document.getElementById('mkt-cd-'+f);
        if(el)el.textContent=timeToRotate(f);
      });
    }
  }

  if(!S.running||S.paused)return;

  // 1 tick = BASE_TICK_MS at 1× speed
  tickAccum+=dt*S.speed;
  if(tickAccum<BASE_TICK_MS)return;
  tickAccum-=BASE_TICK_MS;
  if(tickAccum>BASE_TICK_MS*2)tickAccum=BASE_TICK_MS*2;
  S.tick++;

  // Contract timer decrement (one tick per game tick, speed already baked into tick rate)
  if(typeof tickContractTimers==='function')tickContractTimers();

  // Crafting timers
  if(S.crafting&&S.crafting.some(c=>!c.done)){
    const now=Date.now();
    S.crafting.forEach(c=>{if(!c.done&&now-c.startTime>=c.craftTime)c.done=true;});
  }

  // ── PRESSURE + TRACE MANAGEMENT ──────────────────────────────────────────

  // Natural pressure decay at GREEN — very slow, reward for staying quiet
  if(S.alertPressure>0&&S.alert===0&&S.tick%30===0){
    const _stealthDecay = 1 + (typeof charPressureDecayBonus==='function' ? Math.floor(charPressureDecayBonus()/10) : 0);
    S.alertPressure=Math.max(0,S.alertPressure-_stealthDecay); // base −1 + stealth bonus
    S.alert=pressureToAlert(S.alertPressure);
  }

  // Soothe — continuous pressure reduction, no cooldown, scales with urgency
  if(S.tick%15===0){ // check every 15 ticks (1.5s) — matches base action rate
    let totalReduction=0;
    const coolingBonus=attachEffect('soothe_cd'); // cooling unit bonus to rate
    getByEffect('soothe').forEach(({d})=>{
      const rate=S.alertPressure>0
        ?(d.urgentRate||6)   // urgent rate when pressure > 0
        :(d.pressureRate||3); // gentle rate at green
      totalReduction+=rate+(coolingBonus>0?2:0);
    });
    if(S._mfrPerk?.autoSoothe&&S.alertPressure>0)totalReduction+=5; // Vantage mythic
    if(S.alertPressure>0){ const _sd=typeof charPressureDecayBonus==='function'?charPressureDecayBonus():0; if(_sd>0) totalReduction+=Math.floor(_sd/5); } // Stealth stat
    if(totalReduction>0){
      const prevAlert=S.alert;
      reducePressure(totalReduction);
      // Only log when crossing a threshold
      if(S.alert!==prevAlert){
        addLog(`≋ Soothe → ${'GREEN YELLOW RED'.split(' ')[S.alert]}`,'lg');
      }
    }
  }

  // Trace dynamics — tied to alert level
  if(S.tick%5===0){
    // Natural decay at GREEN, flat at YELLOW, rise at RED
    if(S.alert===0&&S.trace>0){
      let traceDecay=0.5; // base 0.5%/5t at GREEN
      if(isElite('corp'))traceDecay+=2;
      if((S._mfrPerk?.traceDecay||0)>0)traceDecay+=S._mfrPerk.traceDecay;
      const relayDecay=S._relayCount||0; // RELAY nodes add decay
      traceDecay+=relayDecay;
      S.trace=Math.max(0,S.trace-traceDecay);
    }else if(S.alert===2&&S.tick%10===0){
      // At RED: trace creeps up passively
      { const _tr3=typeof charTraceResist==='function'?charTraceResist():0; S.trace=Math.min(100,S.trace+Math.max(0,0.5*(1-_tr3/100))); }
    }
  }

  // Combat
  if(S.combat){
    S.combatTick++;
    if(S.combatTick>=combatTicks()){S.combatTick=0;resolveCombatRound();}
    updateCombatUI();renderGrid();renderRunner();
    if(S.tick%5===0)renderTopBar();
    return;
  }

  // Patrol movement — every 30 ticks
  if(S.tick%30===0)movePatrols();

  // Hunter movement — scales with tier
  if(S.hunters.length&&S.tick%hunterMoveTicks()===0)moveHunters();

  // Hunter spawn at Red — every 60 ticks
  // Hunter spawns scale with pressure — spawn faster at higher pressure
  if(S.alertPressure>=PRESSURE_RED){
    const spawnInterval=Math.max(20, 60-Math.floor((S.alertPressure-PRESSURE_RED)/5));
    if(S.tick%spawnInterval===0)spawnHunter();
  }

  // COP trace pings — every 25 ticks
  if(S.tick%25===0)tickCOPPings();
  if(S.prestige>=9&&S.tick%10===0)tickCOPRepair();

  // Action queue
  if(S.actionQueue.length){
    tickActionQueue();
    if(S.actionQueue.length)S.player.stalled=true;
  }

  // Contract timer expiry — every 10 ticks (tick-based, speed-aware)
  if(S.tick%10===0){
    S.active.forEach(ct=>{
      const t=S.contractTimers[ct.id];
      if(t&&t.ticksLeft<=0)ct.objectives.forEach(o=>{if(!o.done)o.failed=true;});
    });
    renderRunContracts();
  }

  // Player movement
  if(!S.player.stalled){
    S.player.waitTicks=(S.player.waitTicks||0)+1;
    if(S.player.waitTicks>=moveTicks()){
      S.player.waitTicks=0;
      const next=nextPos();
      if(next){S.player.r=next.r;S.player.c=next.c;onArrive(next.r,next.c);}
    }
  }

  // Render
  if(S.tick%2===0)renderGrid();
  if(S.tick%3===0)renderTopBar();
  if(S.tick%5===0){renderRunner();renderPrograms();renderRunRAM();}
}

function init(){
  loadAutoRunPref();
  if(typeof initBMRotation==='function')initBMRotation();
  renderAll();
  requestAnimationFrame(gameTick);
  // Show title screen — handles new/continue/load
  showTitle();
  // After title, home screen will be shown by the load/new game flow
  setInterval(()=>{
    if(S.crafting&&S.crafting.some(c=>!c.done)){
      if(document.getElementById('tab-craft-content')?.classList.contains('active'))renderCraft();
    }
    if(document.getElementById('tab-ops-content')?.classList.contains('active'))renderOps();
  },1000);
  setInterval(()=>{
    if(_autoSlot!==null){autoSave();}
  },10*60*1000);
}


// ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Don't intercept when typing in an input
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  const k=e.key;

  // Speed controls
  if(k==='1')setSpeed(1);
  else if(k==='2')setSpeed(2);
  else if(k==='4')setSpeed(4);
  else if(k===' '||k==='0'){e.preventDefault();setSpeed(S.paused||S.speed===0?1:0);}

  // Tab switching
  else if(k==='r'||k==='R')showTab('run');
  else if(k==='d'||k==='D')showTab('deck');
  else if(k==='m'||k==='M')showTab('market');
  else if(k==='c'||k==='C')showTab('craft');
  else if(k==='i'||k==='I')showTab('inv');
  else if(k==='o'||k==='O')showTab('ops');
  else if(k==='p'||k==='P')showTab('progression');
  else if(k==='a'||k==='A')showTab('ach');
  else if(k==='s'||k==='S')showTab('stats');

  // Launch / jack out
  else if(k==='Enter'&&!S.running&&S.active.length)manualLaunch();
  else if(k==='Escape'&&S.running)jackOut();
});

document.getElementById('modal').addEventListener('click',e=>{if(e.target===document.getElementById('modal'))closeModal();});
init();
