// MESH v0.2 — achievements.js
// ==============================

const ACHIEVEMENTS={
  // ── RUN ACHIEVEMENTS ─────────────────────────────────────────────────
  ghost_run:      {id:'ghost_run',      cat:'run',  icon:'◌', name:'Ghost Run',       desc:'Complete a run without alert reaching YELLOW'},
  speedrunner:    {id:'speedrunner',    cat:'run',  icon:'⚡', name:'Speedrunner',     desc:'Complete contract before 30% of timer elapsed'},
  untouchable:    {id:'untouchable',    cat:'run',  icon:'◫', name:'Untouchable',     desc:'Complete a run with full integrity remaining'},
  data_hoarder:   {id:'data_hoarder',  cat:'run',  icon:'▦', name:'Data Hoarder',    desc:'Fill all RAM slots with downloaded files in one run'},
  hunter_killer:  {id:'hunter_killer', cat:'run',  icon:'☠', name:'Hunter Killer',   desc:'Defeat 3 Hunters in a single run'},
  no_breaker:     {id:'no_breaker',    cat:'run',  icon:'⬡', name:'Raw Code',        desc:'Win a combat with no matching breaker installed'},
  kraken_slayer:  {id:'kraken_slayer', cat:'run',  icon:'⬡⬡',name:'Kraken Slayer',   desc:'Destroy a Kraken segment'},
  perfect_heist:  {id:'perfect_heist', cat:'run',  icon:'★', name:'Perfect Heist',   desc:'Stealth contract: condition met + full integrity'},
  all_nodes:      {id:'all_nodes',     cat:'run',  icon:'◈', name:'All Nodes',       desc:'Visit all 15 node types in a single run'},
  no_damage:      {id:'no_damage',     cat:'run',  icon:'◫', name:'Teflon Runner',   desc:'Complete a run taking zero integrity damage'},
  // ── PROGRESSION MILESTONES ───────────────────────────────────────────
  first_contract: {id:'first_contract',cat:'prog', icon:'▸', name:'First Contract',  desc:'Complete your first contract'},
  netrunner:      {id:'netrunner',     cat:'prog', icon:'◈', name:'Netrunner',       desc:'Complete 10 runs'},
  veteran:        {id:'veteran',       cat:'prog', icon:'◈', name:'Veteran',         desc:'Complete 100 runs'},
  legend_runs:    {id:'legend_runs',   cat:'prog', icon:'◈', name:'Legend',          desc:'Complete 1,000 runs'},
  millionaire:    {id:'millionaire',   cat:'prog', icon:'₵', name:'Millionaire',     desc:'Earn 1,000,000₵ lifetime'},
  tycoon:         {id:'tycoon',        cat:'prog', icon:'₵', name:'Tycoon',          desc:'Earn 10,000,000₵ lifetime'},
  prestige_1:     {id:'prestige_1',    cat:'prog', icon:'★', name:'Prestige I',      desc:'Achieve first prestige'},
  prestige_5:     {id:'prestige_5',    cat:'prog', icon:'★', name:'Prestige V',      desc:'Achieve fifth prestige'},
  prestige_10:    {id:'prestige_10',   cat:'prog', icon:'★', name:'Prestige X',      desc:'Achieve tenth prestige'},
  elite_rep:      {id:'elite_rep',     cat:'prog', icon:'◉', name:'Elite Status',    desc:'Reach Elite rep (1500) with any faction'},
  full_house:     {id:'full_house',    cat:'prog', icon:'◉', name:'Full House',      desc:'Reach Elite rep with all four factions'},
  collector:      {id:'collector',     cat:'prog', icon:'⬡', name:'Collector',       desc:'Own at least one Mk1-Mk3 breaker of every type'},
  high_level:     {id:'high_level',    cat:'prog', icon:'▲', name:'Deep Dive',       desc:'Reach level 50'},
  max_level:      {id:'max_level',     cat:'prog', icon:'▲', name:'Transcendent',    desc:'Reach level 100'},
  // ── DISCOVERY ────────────────────────────────────────────────────────
  bp_hunter:      {id:'bp_hunter',     cat:'disc', icon:'★', name:'Blueprint Hunter',desc:'Earn your first blueprint drop'},
  mythic_forged:  {id:'mythic_forged', cat:'disc', icon:'◆', name:'Mythic Forged',   desc:'Craft a mythic deck'},
  deep_grid:      {id:'deep_grid',     cat:'disc', icon:'⊙', name:'Deep Grid',       desc:'Run on a Tier 8+ grid'},
  omega_survived: {id:'omega_survived',cat:'disc', icon:'◼◎',name:'Omega Survived',  desc:'Take a hit from Omega ICE and survive'},
  kraken_met:     {id:'kraken_met',    cat:'disc', icon:'⬡⬡',name:'Kraken Spotted',  desc:'Encounter a Kraken ICE'},
  vault_opened:   {id:'vault_opened',  cat:'disc', icon:'◆', name:'Vault Breaker',   desc:'Open a VAULT node'},
  all_hunters:    {id:'all_hunters',   cat:'disc', icon:'☠', name:'Bestiary',        desc:'Encounter all 5 Hunter types'},
  all_ice:        {id:'all_ice',       cat:'disc', icon:'⬡', name:'ICE Compendium',  desc:'Encounter all base ICE types'},
};

function initAchievements(){
  if(!S.achievements)S.achievements={};
}

function hasAch(id){return !!(S.achievements||{})[id];}

function unlockAch(id){
  initAchievements();
  if(hasAch(id))return;
  const a=ACHIEVEMENTS[id];if(!a)return;
  S.achievements[id]={unlockedAt:Date.now()};
  addLog(`🏆 Achievement: ${a.name} — ${a.desc}`,'lp');
  autoSave();
  // Flash notification
  const notif=document.createElement('div');
  notif.style.cssText='position:fixed;bottom:20px;right:20px;background:#0a1a0a;border:1px solid #40ff80;'
    +'border-radius:4px;padding:8px 14px;font-family:Orbitron,monospace;font-size:10px;color:#40ff80;'
    +'z-index:9999;animation:achIn 0.3s ease;pointer-events:none;';
  notif.innerHTML=`🏆 ${a.name}`;
  document.body.appendChild(notif);
  setTimeout(()=>notif.remove(),3000);
}

// ── CHECKERS ──────────────────────────────────────────────────────────────

function checkRunAchievements(summary){
  // Called at end of run with summary data
  if(!summary||!summary.success)return;
  const ct=summary.contract;
  const iMax=summary.integrityMax;
  const intLeft=summary.integrityLeft;

  if(S.totalRuns>=1)unlockAch('first_contract');
  if(S.totalRuns>=10)unlockAch('netrunner');
  if(S.totalRuns>=100)unlockAch('veteran');
  if(S.totalRuns>=1000)unlockAch('legend_runs');
  if(S.totalCred>=1000000)unlockAch('millionaire');
  if(S.totalCred>=10000000)unlockAch('tycoon');

  // Alert level never hit yellow
  if(!S._yellowAlertHit&&!S._redAlertHit)unlockAch('ghost_run');

  // Speed: complete before 30% of timer
  if(ct&&summary.conditionMet&&ct.condition==='speed')unlockAch('speedrunner');

  // Full integrity
  if(intLeft>=iMax)unlockAch('untouchable');

  // No damage at all (check stats, not just final integrity)
  if((S.stats?.totalDamageReceived||0)===0||(summary.damageThisRun||0)===0)unlockAch('no_damage');

  // Data hoarder — all non-preloaded RAM slots filled
  const downloaded=summary.dsFiles||[];
  if(downloaded.length>0&&(S.storage||[]).filter(f=>!f.preloaded).length>=(storageMax()-reservedRAM()))
    unlockAch('data_hoarder');

  // Perfect heist
  if(ct?.condition==='stealth'&&summary.conditionMet&&intLeft>=iMax)
    unlockAch('perfect_heist');

  // All nodes visited — check S.grid for all node types visited
  if(S.grid.length){
    const allTypes=Object.keys(NODE_DEF).filter(k=>k!=='ENTRY'&&k!=='EXIT'&&k!=='EMPTY');
    const visited=new Set();
    for(let r=0;r<S.rows;r++)for(let c=0;c<S.cols;c++){
      const cell=S.grid[r]?.[c];
      if(cell?.visited)visited.add(cell.nodeType);
    }
    if(allTypes.every(t=>visited.has(t)))unlockAch('all_nodes');
  }

  // Deep grid
  if(curTier()>=8)unlockAch('deep_grid');

  // Kraken spotted/slain
  if(S._krakenMet)unlockAch('kraken_met');
  if(S._krakenSlain)unlockAch('kraken_slayer');

  // Vault opened
  if(S._vaultOpened)unlockAch('vault_opened');

  // Hunter types encountered
  if((S._hunterTypesEncountered||new Set()).size>=5)unlockAch('all_hunters');

  // ICE types encountered
  const baseIceTypes=Object.keys(BASE_ICE).filter(k=>!BASE_ICE[k].prestigeReq||S.prestige>=BASE_ICE[k].prestigeReq);
  if((S._iceEncountered||new Set()).size>=Math.min(8,baseIceTypes.length))unlockAch('all_ice');
}

function checkProgressionAchievements(){
  initAchievements();
  if(S.prestige>=1) unlockAch('prestige_1');
  if(S.prestige>=5) unlockAch('prestige_5');
  if(S.prestige>=10)unlockAch('prestige_10');
  if(S.level>=50)   unlockAch('high_level');
  if(S.level>=100)  unlockAch('max_level');

  // Elite rep
  const factions=['corp','crim','anarch','neutral'];
  if(factions.some(f=>(S.rep[f]||0)>=1500))unlockAch('elite_rep');
  if(factions.every(f=>(S.rep[f]||0)>=1500))unlockAch('full_house');

  // Collector — own Mk1-3 of each breaker type
  const breakerTypes=['BARRIER','GATEKEEPER','GUARDIAN'];
  const allOwned=breakerTypes.every(bt=>
    S.inventory.some(it=>{const d=pdef(it.defId);return d?.cat==='breaker'&&d.iceTypes?.includes(bt)&&(d.tier||0)>=3;})
  );
  if(allOwned)unlockAch('collector');

  // Blueprint drop
  if((S.earnedBps||[]).length>0)unlockAch('bp_hunter');

  // Mythic deck owned
  if(S.ownedHW.some(id=>id.includes('mythic')))unlockAch('mythic_forged');
}

function checkHunterKiller(){
  if((S._huntersKilledThisRun||0)>=3)unlockAch('hunter_killer');
}
function checkAfterCombat(){
  checkHunterKiller();
  checkProgressionAchievements();
}
function checkNoBreaker(){
  unlockAch('no_breaker');
}
function checkOmegaSurvived(){
  if(S.integrity>0)unlockAch('omega_survived');
}

function renderAchievements(){
  const el=document.getElementById('ach-inner');if(!el)return;
  initAchievements();
  const cats={run:'Run Feats',prog:'Milestones',disc:'Discoveries'};
  const unlocked=Object.values(ACHIEVEMENTS).filter(a=>hasAch(a.id)).length;
  const total=Object.values(ACHIEVEMENTS).length;
  let html=`<div style="font-size:9px;color:#3a6a3a;margin-bottom:8px">${unlocked}/${total} unlocked</div>`;

  // Progress bar
  html+=`<div style="height:4px;background:#1a2a1a;border-radius:2px;margin-bottom:12px">
    <div style="height:100%;width:${Math.round(unlocked/total*100)}%;background:#40ff80;border-radius:2px"></div>
  </div>`;

  Object.entries(cats).forEach(([cat,catName])=>{
    const achs=Object.values(ACHIEVEMENTS).filter(a=>a.cat===cat);
    html+=`<div class="ptitle" style="margin-top:8px">${catName}</div>`;
    html+=achs.map(a=>{
      const done=hasAch(a.id);
      const when=done?new Date(S.achievements[a.id].unlockedAt).toLocaleDateString():'';
      return `<div style="display:flex;align-items:center;gap:6px;padding:4px 6px;margin-bottom:2px;
        background:${done?'#0a1a0a':'#080d10'};border:1px solid ${done?'#1a4a1a':'#0d1a0d'};border-radius:3px;
        opacity:${done?1:0.45}">
        <span style="font-size:14px;width:20px;text-align:center;${done?'':'filter:grayscale(1)'}">${a.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:9px;color:${done?'#40ff80':'#3a5a3a'}">${a.name}</div>
          <div style="font-size:7px;color:#2a5a2a">${a.desc}</div>
        </div>
        ${done?`<span style="font-size:7px;color:#1a4a1a">${when}</span>`:''}
      </div>`;
    }).join('');
  });
  el.innerHTML=html;
}
