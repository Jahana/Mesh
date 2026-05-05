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
  // REMOVED: prestige_1:    cat:'prog', icon:'★', name:'Prestige I',      desc:'Achieve first prestige'},
  // REMOVED: prestige_5:    cat:'prog', icon:'★', name:'Prestige V',      desc:'Achieve fifth prestige'},
  // REMOVED: prestige_10:   cat:'prog', icon:'★', name:'Prestige X',      desc:'Achieve tenth prestige'},
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

  // ── MESH / NET ACHIEVEMENTS ──────────────────────────────────────────
  first_jack:     {id:'first_jack',    cat:'mesh', icon:'⬡', name:'First Jack',       desc:'Enter your first net in the Mesh'},
  net_cleared:    {id:'net_cleared',   cat:'mesh', icon:'✓', name:'Net Cleared',      desc:'Complete node FF in any net'},
  uplift:         {id:'uplift',        cat:'mesh', icon:'◈', name:'Uplift',           desc:'Complete node FF in net 0:0 and unlock Mesh traversal'},
  ten_nets:       {id:'ten_nets',      cat:'mesh', icon:'⬡', name:'Cartographer',     desc:'Clear FF in 10 different nets'},
  fifty_nets:     {id:'fifty_nets',    cat:'mesh', icon:'⬡', name:'Mesh Walker',      desc:'Clear FF in 50 different nets'},
  glitch_zone:    {id:'glitch_zone',   cat:'mesh', icon:'⚡', name:'Into the Static', desc:'Enter a net at mesh distance 16+'},
  deep_mesh:      {id:'deep_mesh',     cat:'mesh', icon:'⚡', name:'Deep Mesh',       desc:'Enter a net at mesh distance 64+'},
  hundred_nodes:  {id:'hundred_nodes', cat:'mesh', icon:'◈', name:'Node Veteran',     desc:'Complete 100 nodes across all nets'},
  thousand_nodes: {id:'thousand_nodes',cat:'mesh', icon:'◈', name:'Node Legend',      desc:'Complete 1,000 nodes across all nets'},
  net_rep_known:  {id:'net_rep_known', cat:'mesh', icon:'◉', name:'Known Face',       desc:'Reach Known (100) rep with any net company'},
  net_rep_elite:  {id:'net_rep_elite', cat:'mesh', icon:'◉', name:'Local Legend',     desc:'Reach Elite (1500) rep with any net company'},
  auto_travel:    {id:'auto_travel',   cat:'mesh', icon:'⚡', name:'Ghost in the Wire',desc:'Auto-traverse 10 nets in a single autorun session'},

  // ── CHARACTER ACHIEVEMENTS ───────────────────────────────────────────
  first_stat:     {id:'first_stat',    cat:'char', icon:'▲', name:'Self-Improvement', desc:'Spend XP to upgrade any character stat'},
  stat_10:        {id:'stat_10',       cat:'char', icon:'▲', name:'Trained',          desc:'Reach level 10 in any character stat'},
  stat_20:        {id:'stat_20',       cat:'char', icon:'▲', name:'Hardened',         desc:'Reach level 20 in any character stat'},
  all_stats_5:    {id:'all_stats_5',   cat:'char', icon:'◈', name:'Rounded',          desc:'Reach level 5 in all six character stats'},
  pool_spent:     {id:'pool_spent',    cat:'char', icon:'◈', name:'Invested',         desc:'Spend 10,000 XP from the pool on character stats'},
  
  // ── ADDITIONAL RUN FEATS ─────────────────────────────────────────────
  cascade_chain:  {id:'cascade_chain', cat:'run',  icon:'◉', name:'Chain Reaction',   desc:'Trigger a Cascade ICE (spawn Barrier on defeat)'},
  ice_breaker:    {id:'ice_breaker',   cat:'run',  icon:'⬡', name:'ICE Breaker',      desc:'Defeat 10 ICE in a single run'},
  silent_exit:    {id:'silent_exit',   cat:'run',  icon:'◌', name:'Silent Exit',      desc:'Complete a run at GREEN alert the whole time'},
  full_storage:   {id:'full_storage',  cat:'run',  icon:'▦', name:'Pack Rat',         desc:'Fill storage completely in one run'},
  cop_whisperer:  {id:'cop_whisperer', cat:'run',  icon:'⬟', name:'COP Whisperer',    desc:'Silence 3 COP nodes in a single run'},
  speed_demon:    {id:'speed_demon',   cat:'run',  icon:'⚡', name:'Speed Demon',      desc:'Complete a run in under 60 real seconds'},

  // ── ADDITIONAL DISCOVERIES ───────────────────────────────────────────
  net_market:     {id:'net_market',    cat:'disc', icon:'⊞', name:'Street Market',    desc:'Purchase an item from a net market'},
  deep_archive:   {id:'deep_archive',  cat:'disc', icon:'◎', name:'Deep Archive',     desc:'Find a blueprint in an Archive node'},
  lore_found:     {id:'lore_found',    cat:'disc', icon:'◈', name:'Signal in the Noise',desc:'Discover a lore fragment in a datastore'},
  polymorph_used: {id:'polymorph_used',cat:'disc', icon:'◈', name:'Shapeshifter',     desc:'Successfully use Polymorph to change a node type'},
  leech_survived: {id:'leech_survived',cat:'disc', icon:'⊗', name:'Leech Survivor',  desc:'Complete a run after Leech has drained your breaker STR'},
  // ── CRAFTING & GEAR ──────────────────────────────────────────────────
  first_craft:    {id:'first_craft',   cat:'gear', icon:'⚙', name:'Fabricator',       desc:'Craft your first program or deck'},
  full_mk3:       {id:'full_mk3',      cat:'gear', icon:'⚙', name:'Full Kit',          desc:'Have all three breaker types at Mk3 or higher installed simultaneously'},
  legendary_deck: {id:'legendary_deck',cat:'gear', icon:'▦', name:'Legendary Rig',     desc:'Equip a Legendary-rarity deck'},
  five_attach:    {id:'five_attach',   cat:'gear', icon:'◫', name:'Modded Out',        desc:'Install 5 or more attachments simultaneously'},
  black_market:   {id:'black_market',  cat:'gear', icon:'⊗', name:'Off the Books',     desc:'Purchase an item from the black market'},
  net_shopper:    {id:'net_shopper',   cat:'gear', icon:'⊞', name:'Net Shopper',       desc:'Purchase items from 5 different net companies'},
  all_mfr:        {id:'all_mfr',       cat:'gear', icon:'▦', name:'Brand Loyalty',     desc:'Own at least one deck from every manufacturer'},

  // ── OPS & SUPPORT ────────────────────────────────────────────────────
  first_op:       {id:'first_op',      cat:'ops',  icon:'⚡', name:'Off the Clock',    desc:'Complete your first off-grid operation'},
  ten_ops:        {id:'ten_ops',       cat:'ops',  icon:'⚡', name:'Operations Lead',  desc:'Complete 10 off-grid operations'},
  full_maint:     {id:'full_maint',    cat:'ops',  icon:'⚙', name:'Well Maintained',  desc:'Run auto-maintenance in a single session'},
  intel_op:       {id:'intel_op',      cat:'ops',  icon:'⊙', name:'Intel Acquired',   desc:'Purchase pre-run intel before a node'},

  // ── ICE ENCOUNTERS ───────────────────────────────────────────────────
  first_ice:      {id:'first_ice',     cat:'disc', icon:'⬡', name:'First Contact',    desc:'Encounter your first ICE'},
  black_ice_hit:  {id:'black_ice_hit', cat:'disc', icon:'◼', name:'Blackout',         desc:'Take a permanent INT loss from Black ICE'},
  tar_pitted:     {id:'tar_pitted',    cat:'disc', icon:'◎', name:'Stuck in the Mud', desc:'Get slowed by Tar Pit ICE'},
  mimic_found:    {id:'mimic_found',   cat:'disc', icon:'◈', name:'Nothing is Real',  desc:'Discover a Mimic ICE (disguised node)'},
  architect_met:  {id:'architect_met', cat:'disc', icon:'⬡', name:'The Architect',    desc:'Encounter an Architect ICE'},
  omega_met:      {id:'omega_met',     cat:'disc', icon:'◼◎',name:'End of Line',      desc:'Encounter an Omega ICE'},

  // ── REP & FACTION ────────────────────────────────────────────────────
  legend_corp:    {id:'legend_corp',   cat:'prog', icon:'◉', name:'Corporate Legend', desc:'Reach Legend (4000) rep with Corp faction'},
  legend_crim:    {id:'legend_crim',   cat:'prog', icon:'◉', name:'Criminal Legend',  desc:'Reach Legend (4000) rep with Criminal faction'},
  legend_anarch:  {id:'legend_anarch', cat:'prog', icon:'◉', name:'Anarchist Legend', desc:'Reach Legend (4000) rep with Anarch faction'},
  all_legend:     {id:'all_legend',    cat:'prog', icon:'◉', name:'Living Legend',    desc:'Reach Legend rep with all four factions'},
  net_legend:     {id:'net_legend',    cat:'mesh', icon:'◉', name:'Net Legend',       desc:'Reach Legend (4000) rep with any net company'},
  hundred_nets:   {id:'hundred_nets',  cat:'mesh', icon:'⬡', name:'Mesh Cartographer',desc:'Clear FF in 100 different nets'},
  dist_32:        {id:'dist_32',       cat:'mesh', icon:'⚡', name:'Glitch Rider',    desc:'Enter a net at mesh distance 32+'},
  dist_128:       {id:'dist_128',      cat:'mesh', icon:'⚡', name:'Signal Lost',      desc:'Enter a net at mesh distance 128+'},
  dist_256:       {id:'dist_256',      cat:'mesh', icon:'◼', name:'AI Territory',     desc:'Enter a net at mesh distance 256+'},

  // ── RUN DEPTH ────────────────────────────────────────────────────────
  ten_k_cred:     {id:'ten_k_cred',    cat:'run',  icon:'₵', name:'Big Score',        desc:'Earn 10,000₵ from a single run'},
  fifty_k_cred:   {id:'fifty_k_cred',  cat:'run',  icon:'₵', name:'Windfall',         desc:'Earn 50,000₵ from a single run'},
  five_contracts: {id:'five_contracts',cat:'run',  icon:'◈', name:'Multi-Tasker',     desc:'Complete 5 contracts in a single run'},
  no_programs:    {id:'no_programs',   cat:'run',  icon:'⬡', name:'Bare Metal',       desc:'Complete a contract with no programs installed'},
  full_ram:       {id:'full_ram',      cat:'run',  icon:'▦', name:'RAM Full',         desc:'Fill all RAM with programs at run start'},
  tier_10:        {id:'tier_10',       cat:'run',  icon:'◈', name:'Maximum Depth',    desc:'Complete a node at mesh tier 10 (dist 144+)'},
  speed_500ms:    {id:'speed_500ms',   cat:'run',  icon:'⚡', name:'Lightning',        desc:'Complete a run in under 30 real seconds'},
  triple_kill:    {id:'triple_kill',   cat:'run',  icon:'☠', name:'Triple Kill',      desc:'Defeat 3 different ICE types in a single combat sequence'},

  // ── WEAVER DEPTH ─────────────────────────────────────────────────────
  stat_50:        {id:'stat_50',       cat:'char', icon:'▲', name:'Transcendent',     desc:'Reach level 50 in any character stat'},
  all_stats_10:   {id:'all_stats_10',  cat:'char', icon:'◈', name:'Specialist',       desc:'Reach level 10 in all six character stats'},
  all_stats_20:   {id:'all_stats_20',  cat:'char', icon:'◈', name:'Master Weaver',    desc:'Reach level 20 in all six character stats'},
  pool_100k:      {id:'pool_100k',     cat:'char', icon:'◈', name:'Deep Investment',  desc:'Spend 100,000 XP from the pool on character stats'},

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
  // Refresh list if tab is open
  if(document.getElementById('tab-ach-content')?.classList.contains('active')) renderAchievements();
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
  if(intLeft>=iMax&&intLeft>0)unlockAch('untouchable');

  // No damage at all (check stats, not just final integrity)
  if((summary.damageThisRun||0)===0)unlockAch('no_damage');

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

  // COP silence count
  if((summary.copsSilenced||S._copsSilencedThisRun||0)>=3) unlockAch('cop_whisperer');

  // ICE defeated count
  if((summary.iceBreachedRun||S._iceBreachedRun||0)>=10) unlockAch('ice_breaker');

  // Full storage
  if((S.storage||[]).length>=storageMax()) unlockAch('full_storage');

  // Silent exit — GREEN the whole run
  if(!S._yellowAlertHit&&!S._redAlertHit) unlockAch('silent_exit');

  // Speed — real time
  const _ms = summary.realMs || 0;
  if(_ms>0 && _ms < 60000) unlockAch('speed_demon');
  if(_ms>0 && _ms < 30000) unlockAch('speed_500ms');

  // Single-run cred
  if((summary.runCred||summary.cred||0) >= 10000) unlockAch('ten_k_cred');
  if((summary.runCred||summary.cred||0) >= 50000) unlockAch('fifty_k_cred');

  // Contracts in one run
  if((summary.contracts||0) >= 5 || (summary.runCts||0) >= 5) unlockAch('five_contracts');

  // No programs installed
  if((S.installed||[]).length === 0) unlockAch('no_programs');

  // Full RAM at start (check snapshot)
  const snapMem = (S.runSnapshot?.installed||[]).reduce((a,iid)=>{
    const it=(S.runSnapshot?.inventory||[]).find(x=>x.instId===iid);
    return a+(it?pdef(it.defId)?.mem||0:0);},0);
  if(snapMem >= ramMax()) unlockAch('full_ram');

  // Tier 10
  if(curTier()>=10) unlockAch('tier_10');

  // Full kit: all 3 breaker types Mk3+ installed
  const instBreakers = (S.installed||[]).map(id=>{
    const it=S.inventory.find(x=>x.instId===id); return it?pdef(it.defId):null;
  }).filter(d=>d?.cat==='breaker');
  const hasBarrier  = instBreakers.some(d=>d.iceTypes?.includes('BARRIER')  && (d.tier||0)>=3);
  const hasGate     = instBreakers.some(d=>d.iceTypes?.includes('GATEKEEPER')&&(d.tier||0)>=3);
  const hasGuardian = instBreakers.some(d=>d.iceTypes?.includes('GUARDIAN') && (d.tier||0)>=3);
  if(hasBarrier && hasGate && hasGuardian) unlockAch('full_mk3');

  // Net-specific checks
  if(S.mesh?.currentNet) {
    // Total nodes completed across all nets
    const totalNodes = (S.mesh.visitedNets||[]).reduce((a,ns)=>a+(ns.completedNodes?.length||0),0);
    if(totalNodes>=100)  unlockAch('hundred_nodes');
    if(totalNodes>=1000) unlockAch('thousand_nodes');
    // Net company rep
    const allNsRep = (S.mesh.visitedNets||[]).flatMap(ns=>Object.values(ns.rep||{}));
    if(allNsRep.some(r=>r>=100))  unlockAch('net_rep_known');
    if(allNsRep.some(r=>r>=1500)) unlockAch('net_rep_elite');
  }
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
  if(S.ownedHW.some(id=>id.includes('mythic'))) unlockAch('mythic_forged');

  // Character stat achievements
  const stats = S.charStats||{};
  const statVals = Object.values(stats);
  if(statVals.some(v=>v>0))    unlockAch('first_stat');
  if(statVals.some(v=>v>=10))  unlockAch('stat_10');
  if(statVals.some(v=>v>=20))  unlockAch('stat_20');
  if(Object.keys(stats).length>=6&&Object.values(stats).every(v=>v>=5)) unlockAch('all_stats_5');
  if((S._totalXpSpent||0)>=10000) unlockAch('pool_spent');

  // Mesh achievements
  if(S.mesh?.currentNet) unlockAch('first_jack');
  if(S.mesh?.traversalUnlocked) unlockAch('uplift');
  const dist=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
  if(dist>=16)  unlockAch('glitch_zone');
  if(dist>=64)  unlockAch('deep_mesh');
  const clearedNets=(S.mesh?.visitedNets||[]).filter(ns=>ns.completedNodes?.includes('FF')).length;
  if(clearedNets>=1)   unlockAch('net_cleared');
  if(clearedNets>=10)  unlockAch('ten_nets');
  if(clearedNets>=50)  unlockAch('fifty_nets');
  if(clearedNets>=100) unlockAch('hundred_nets');

  // Mesh distance milestones
  const dist2=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
  if(dist2>=32)  unlockAch('dist_32');
  if(dist2>=128) unlockAch('dist_128');
  if(dist2>=256) unlockAch('dist_256');

  // Legend rep per faction
  if((S.rep?.corp   ||0)>=4000) unlockAch('legend_corp');
  if((S.rep?.crim   ||0)>=4000) unlockAch('legend_crim');
  if((S.rep?.anarch ||0)>=4000) unlockAch('legend_anarch');
  if(['corp','crim','anarch','neutral'].every(f=>(S.rep?.[f]||0)>=4000)) unlockAch('all_legend');

  // Net company legend rep
  const allNsRepVals=(S.mesh?.visitedNets||[]).flatMap(ns=>Object.values(ns.rep||{}));
  if(allNsRepVals.some(r=>r>=4000)) unlockAch('net_legend');

  // Char stat depth
  const statVals2=Object.values(S.charStats||{});
  if(statVals2.some(v=>v>=50)) unlockAch('stat_50');
  if(Object.keys(S.charStats||{}).length>=6&&statVals2.every(v=>v>=10)) unlockAch('all_stats_10');
  if(Object.keys(S.charStats||{}).length>=6&&statVals2.every(v=>v>=20)) unlockAch('all_stats_20');
  if((S._totalXpSpent||0)>=100000) unlockAch('pool_100k');

  // Gear achievements
  if((S.attachments||[]).length>=5) unlockAch('five_attach');
  if(S.hardware?.includes('legendary')||S.hardware?.includes('mythic')) unlockAch('legendary_deck');
  const mfrs=['haas','weyland','jinteki','nbn','novatek'];
  if(mfrs.every(m=>(S.ownedHW||[]).some(id=>id.startsWith(m)))) unlockAch('all_mfr');

  // Crafting
  if((S.craftedBps||[]).length>0) unlockAch('first_craft');

  // Ops
  const completedOps=(S.ops?.completedOps||[]).length+(S.stats?.totalOpsCompleted||0);
  if(completedOps>=1)  unlockAch('first_op');
  if(completedOps>=10) unlockAch('ten_ops');
}

function checkHunterKiller(){
  if((S._huntersKilledThisRun||0)>=3)unlockAch('hunter_killer');
}
function checkAfterCombat(){
  checkHunterKiller();
  checkProgressionAchievements();
}
function checkNoBreaker(){ unlockAch('no_breaker'); }
function checkOmegaSurvived(){ if(S.integrity>0) unlockAch('omega_survived'); }

function checkIceEncounter(iceType){
  if(!S._iceEncountered) S._iceEncountered=new Set();
  S._iceEncountered.add(iceType);
  if(!hasAch('first_ice')) unlockAch('first_ice');
  if(iceType==='BLACK_ICE')  unlockAch('black_ice_hit');
  if(iceType==='TAR_PIT')    unlockAch('tar_pitted');
  if(iceType==='MIMIC')      unlockAch('mimic_found');
  if(iceType==='ARCHITECT')  unlockAch('architect_met');
  if(iceType==='OMEGA')      unlockAch('omega_met');
}
function checkCascadeChain(){ unlockAch('cascade_chain'); }
function checkLeechSurvived(){ if(S.integrity>0) unlockAch('leech_survived'); }
function checkPolymorphUsed(){ unlockAch('polymorph_used'); }
function checkNetMarketPurchase(companyKey){
  unlockAch('net_market');
  if(companyKey){if(!S._netCompaniesShopped)S._netCompaniesShopped=new Set();S._netCompaniesShopped.add(companyKey);if(S._netCompaniesShopped.size>=5)unlockAch('net_shopper');}
}

function renderAchievements(){
  const el=document.getElementById('ach-inner');if(!el)return;
  initAchievements();
  const cats={char:'Weaver',mesh:'Mesh',run:'Run Feats',prog:'Milestones',disc:'Discoveries',gear:'Gear & Craft',ops:'Operations'};
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
