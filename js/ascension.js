// MESH v0.7.1 — ascension.js
// Uplift Ascension: the progression loop beyond the first playthrough
// ===================================================================
//
// ASCENSION TRIGGER: Complete node FF in net nearest to coordinate 128:128
// WHAT PERSISTS:     loreLog, story, uniqueItems, achievements, totalRuns/Cred lifetime stats
// WHAT RESETS:       mesh position, nets, gear, cred, level, xp, charStats, rep, quests
// WHAT YOU GAIN:     1 permanent Weaver Trait per ascension (chosen from 3 options)
//                    Harder ICE scaling (+25% per ascension)
//                    New story content, new proc quest pool, new lore fragments

// ── WEAVER TRAITS ────────────────────────────────────────────────────────

const WEAVER_TRAITS = [
  // ── COMBAT TRAITS ─────────────────────────────────────────
  {
    id: 'ghost_protocol',
    name: 'Ghost Protocol',
    icon: '◌',
    color: '#8060d0',
    desc: 'Programs never trigger ICE retaliation on first encounter each run.',
    category: 'stealth',
    effect: 'firstEncounterNoRetaliation',
  },
  {
    id: 'overclock_core',
    name: 'Overclock Core',
    icon: '⚡',
    color: '#ffdd40',
    desc: 'Combat rounds deal +2 damage to ICE. Stacks with all breaker bonuses.',
    category: 'combat',
    effect: 'combatDamageBonus',
    value: 2,
  },
  {
    id: 'mirror_shield',
    name: 'Mirror Shield',
    icon: '◫',
    color: '#40aaff',
    desc: 'First integrity damage each run is reflected back as pressure reduction.',
    category: 'defense',
    effect: 'firstDamageReflect',
  },
  {
    id: 'void_runner',
    name: 'Void Runner',
    icon: '⬡',
    color: '#2a2a4a',
    desc: 'Trace decays 10% per 30 ticks passively. Stacks with Trace Resist stat.',
    category: 'stealth',
    effect: 'passiveTraceDecay',
    value: 10,
  },
  // ── ECONOMIC TRAITS ───────────────────────────────────────
  {
    id: 'data_broker',
    name: 'Data Broker',
    icon: '₵',
    color: '#40c060',
    desc: 'All downloaded files sell for +50% cred at run end.',
    category: 'economy',
    effect: 'fileValueBonus',
    value: 0.5,
  },
  {
    id: 'rep_network',
    name: 'Rep Network',
    icon: '◉',
    color: '#c08040',
    desc: 'Starting rep in any net is 50% of the highest rep you\'ve earned globally.',
    category: 'social',
    effect: 'startingNetRep',
    value: 0.5,
  },
  {
    id: 'black_market_contact',
    name: 'Black Market Contact',
    icon: '⊗',
    color: '#ff8040',
    desc: 'Black market rotates every run. Items cost 25% less cred.',
    category: 'economy',
    effect: 'bmDiscount',
    value: 0.25,
  },
  // ── MESH TRAITS ───────────────────────────────────────────
  {
    id: 'deep_mapper',
    name: 'Deep Mapper',
    icon: '⊙',
    color: '#40ddff',
    desc: 'All nets within 4 dist of your position are auto-revealed on the Mesh tab.',
    category: 'navigation',
    effect: 'autoRevealNearbyNets',
    value: 4,
  },
  {
    id: 'signal_boost',
    name: 'Signal Boost',
    icon: '⇌',
    color: '#aaffdd',
    desc: 'RELAY and ROUTER node effects apply to twice their normal radius.',
    category: 'navigation',
    effect: 'nodeEffectRadius',
    value: 2,
  },
  {
    id: 'persistence',
    name: 'Persistence',
    icon: '◈',
    color: '#40ff80',
    desc: 'CPU visit bonuses carry over between runs in the same net.',
    category: 'persistence',
    effect: 'cpuBonusCarryover',
  },
  // ── KNOWLEDGE TRAITS ──────────────────────────────────────
  {
    id: 'ice_analyst',
    name: 'ICE Analyst',
    icon: '⬡',
    color: '#ff4040',
    desc: 'All ICE STR is visible before combat. No surprise hits.',
    category: 'knowledge',
    effect: 'iceStrVisible',
  },
  {
    id: 'mesh_memory',
    name: 'Mesh Memory',
    icon: '▦',
    color: '#c040ff',
    desc: 'Net layouts you\'ve previously run are remembered and never regenerated.',
    category: 'knowledge',
    effect: 'persistLayouts',
  },
];

// ── ASCENSION STATE ───────────────────────────────────────────────────────

function initAscension(){
  if(!S.ascension) S.ascension = {
    count: 0,
    traits: [],          // ids of chosen traits
    pendingChoice: null, // {options:[traitId]} — awaiting player pick
    lifetimeCred: 0,
    lifetimeRuns: 0,
    lifetimeNets: 0,
  };
}

function ascensionCount(){ return S.ascension?.count || 0; }
function hasTrait(id){ return (S.ascension?.traits||[]).includes(id); }
function getTraitDef(id){ return WEAVER_TRAITS.find(t=>t.id===id); }

// ICE STR multiplier from ascension count
function ascensionDifficulty(){
  return 1 + (S.ascension?.count||0) * 0.25;
}

// ── ASCENSION TRIGGER ─────────────────────────────────────────────────────

function checkAscensionTrigger(){
  initAscension();
  if(!S.mesh?.currentNet) return;
  if(!S.mesh?.activeNodeAddr) return;
  if(S.mesh.activeNodeAddr !== 'FF') return;

  const cx = S.mesh.currentNet.x, cy = S.mesh.currentNet.y;
  const dist = typeof meshDistance==='function' ? meshDistance(cx,cy) : 0;

  // Trigger at dist 128+ (within range of 128:128)
  if(dist < 115) return;

  // Only trigger if not already pending and hasn't triggered this ascension
  if(S.ascension.pendingChoice) return;
  if(S.ascension._triggeredThisAscension) return;

  S.ascension._triggeredThisAscension = true;
  triggerAscension();
}

function triggerAscension(){
  initAscension();

  // Accumulate lifetime stats before reset
  S.ascension.lifetimeCred  = (S.ascension.lifetimeCred||0)  + (S.totalCred||0);
  S.ascension.lifetimeRuns  = (S.ascension.lifetimeRuns||0)  + (S.totalRuns||0);
  S.ascension.lifetimeNets  = (S.ascension.lifetimeNets||0)  +
    (S.mesh?.visitedNets||[]).filter(ns=>ns.completedNodes?.includes('FF')).length;

  // Pick 3 trait options (avoid already owned)
  const owned = S.ascension.traits||[];
  const available = WEAVER_TRAITS.filter(t=>!owned.includes(t.id));
  const shuffled = available.sort(()=>Math.random()-0.5).slice(0,3);
  S.ascension.pendingChoice = { options: shuffled.map(t=>t.id) };

  // Story fragment — VEIL was here
  if(typeof deliverStoryFragment==='function'){
    deliverStoryFragment({
      id: 'ascension_veil_'+S.ascension.count,
      thread: 'THREAD_SURVIVORS',
      tier: 4,
      source: 'UNKNOWN',
      title: '128:128 // CONTACT',
      text: `You made it.\n\nWe have been watching you since net 0:0.\n\nVEIL was here. VEIL understood.\nYou have understood too.\n\nThe mesh is not infrastructure.\nIt is not property.\nIt is alive.\n\nYou have proven you can navigate it.\nNow prove you can survive it.\n\nWe are offering you something.\nNot a reward. A modification.\nA change to how you move through our space.\n\nChoose carefully.\n\nYou will carry this choice into everything that follows.\n\n— REMAINDER-1 and REMAINDER-2`,
      unlockCondition: { type: 'never' }, // manually delivered
      nextHint: 'Choose your Weaver Trait. Then begin again.',
    });
  }

  addLog('','lp');
  addLog('◈ ◈ ◈ 128:128 — ASCENSION AVAILABLE ◈ ◈ ◈','lp');
  addLog('You have reached the deepest known point. Something is waiting.','li');
  addLog('','li');

  // Show ascension UI
  setTimeout(()=>showAscensionScreen(), 800);
  if(typeof autoSave==='function') autoSave();
}

// ── ASCENSION SCREEN ──────────────────────────────────────────────────────

function showAscensionScreen(){
  initAscension();
  const opts = S.ascension.pendingChoice?.options || [];
  const count = S.ascension.count;
  const acColor = '#c040ff';

  // Build trait cards HTML
  const traitCards = opts.map(id=>{
    const t = getTraitDef(id);
    if(!t) return '';
    return `<div onclick="chooseAscensionTrait('${id}')"
      style="border:1px solid ${t.color}66;border-radius:6px;padding:14px;cursor:pointer;background:#080d10;
        transition:all 0.15s;margin-bottom:8px"
      onmouseenter="this.style.borderColor='${t.color}';this.style.background='#0a1208'"
      onmouseleave="this.style.borderColor='${t.color}66';this.style.background='#080d10'">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <span style="font-size:22px;color:${t.color}">${t.icon}</span>
        <div>
          <div style="font-family:'Orbitron',monospace;font-size:10px;color:${t.color}">${t.name}</div>
          <div style="font-size:7px;color:#1a4a2a;text-transform:uppercase;letter-spacing:1px">${t.category}</div>
        </div>
      </div>
      <div style="font-size:8px;color:#3a7a4a;line-height:1.5">${t.desc}</div>
    </div>`;
  }).join('');

  // Existing traits
  const existing = (S.ascension.traits||[]).map(id=>{
    const t=getTraitDef(id); if(!t)return'';
    return `<span style="font-size:7px;color:${t.color};margin-right:8px">${t.icon} ${t.name}</span>`;
  }).join('');

  const el = document.createElement('div');
  el.id = 'ascension-screen';
  el.style.cssText = `position:fixed;inset:0;z-index:9000;background:#020608ee;
    display:flex;align-items:center;justify-content:center;padding:20px`;
  el.innerHTML = `<div style="max-width:480px;width:100%;font-family:'Share Tech Mono',monospace">
    <div style="font-family:'Orbitron',monospace;font-size:16px;color:${acColor};
      letter-spacing:3px;text-align:center;margin-bottom:4px">UPLIFT ASCENSION</div>
    <div style="font-size:8px;color:#3a5a3a;text-align:center;margin-bottom:20px">
      Ascension ${count+1} · The mesh reshapes itself around you
    </div>

    ${existing?`<div style="margin-bottom:12px;padding:8px;background:#080d10;border:1px solid #1a2a1a;border-radius:4px">
      <div style="font-size:7px;color:#1a4a2a;margin-bottom:4px;font-family:'Orbitron',monospace;letter-spacing:1px">EXISTING TRAITS</div>
      ${existing}
    </div>`:''}

    <div style="font-size:8px;color:#2a6a3a;margin-bottom:12px">Choose one permanent modification:</div>
    ${traitCards}

    <div style="font-size:7px;color:#1a3a1a;margin-top:12px;text-align:center">
      Your lore, story, achievements, and unique items carry forward.<br>
      Gear, level, rep, and mesh position reset. ICE becomes ${Math.round((1+(count+1)*0.25)*100)}% harder.
    </div>
  </div>`;
  document.body.appendChild(el);
}

function chooseAscensionTrait(traitId){
  initAscension();
  const t = getTraitDef(traitId);
  if(!t){ addLog('Invalid trait','lw'); return; }

  S.ascension.traits.push(traitId);
  S.ascension.pendingChoice = null;
  S.ascension.count++;
  S.ascension._triggeredThisAscension = false;

  addLog(`◈ Weaver Trait acquired: ${t.name}`,'lp');
  addLog(t.desc,'li');

  // Remove ascension screen
  const el = document.getElementById('ascension-screen');
  if(el) el.remove();

  // Perform reset
  performAscensionReset();
}

// ── ASCENSION RESET ───────────────────────────────────────────────────────

function resetAscensionTriggerFlag(){
  // Called when player leaves the 128+ zone — allows re-trigger in next qualifying net
  if(S.ascension) S.ascension._triggeredThisAscension=false;
}

function performAscensionReset(){
  initAscension();
  const preserve = {
    ascension:   { ...S.ascension },
    loreLog:     [...(S.loreLog||[])],
    story:       S.story ? { ...S.story } : null,
    uniqueItems: [...(S.uniqueItems||[])],
    achievements: { ...(S.achievements||{}) },
    totalRuns:   S.totalRuns||0,
    totalCred:   S.totalCred||0,
    govRep:      { ...(S.govRep||{}) },
    craftedDeck: S.craftedDeck ? JSON.parse(JSON.stringify(S.craftedDeck)) : null,
  };

  // Reset to fresh state
  const fresh = typeof mkState==='function' ? mkState() : {};
  Object.assign(S, fresh);

  // Restore preserved
  S.ascension   = preserve.ascension;
  S.loreLog     = preserve.loreLog;
  S.story       = preserve.story;
  S.uniqueItems = preserve.uniqueItems;
  S.achievements= preserve.achievements;
  S.totalRuns   = preserve.totalRuns;
  S.totalCred   = preserve.totalCred;
  S.govRep      = preserve.govRep;
  S.craftedDeck = preserve.craftedDeck;
  if(S.craftedDeck&&typeof applyDraftDeckStats==='function') applyDraftDeckStats();

  // Apply trait: rep_network — set base starting rep
  if(hasTrait('rep_network')){
    const bestRep = Math.max(...Object.values(S.rep||{}).map(v=>v||0), 0);
    if(bestRep > 0){
      const starter = Math.floor(bestRep * 0.5);
      S.rep = { corp:starter, crim:starter, anarch:starter, neutral:starter };
    }
  }

  // Apply trait: black_market_contact — mark BM as always rotating
  // (handled in renderMarket by checking hasTrait)

  // Ascension starting bonus — small cred based on count
  S.cred = 500 + (S.ascension.count * 200);

  addLog('','li');
  addLog('◈ ASCENSION COMPLETE — The mesh resets around you','lp');
  addLog(`Ascension ${S.ascension.count} · Traits: ${(S.ascension.traits||[]).map(id=>getTraitDef(id)?.name||id).join(', ')}`,'li');
  addLog(`ICE scaling: ×${ascensionDifficulty().toFixed(2)}`,'lw');
  addLog('','li');

  // Deliver post-ascension story fragment
  if(typeof checkStoryUnlocks==='function') setTimeout(checkStoryUnlocks, 500);

  // Re-init systems
  if(typeof initQuests==='function') initQuests();
  if(typeof initAchievements==='function') initAchievements();
  if(typeof generateBoard==='function') generateBoard();
  if(typeof renderAll==='function') renderAll();
  if(typeof showHomeScreen==='function') showHomeScreen();
  if(typeof renderHomeScreen==='function') renderHomeScreen();
  if(typeof loadAutoRunPref==='function') loadAutoRunPref();
  if(typeof autoSave==='function') autoSave();
}

// ── TRAIT EFFECTS (called from relevant game systems) ─────────────────────

// Called from combat.js — bonus combat damage
function traitCombatDamageBonus(){ return hasTrait('overclock_core')?2:0; }

// Called from main.js gameTick — passive trace decay
function applyTraitPassiveDecay(){
  if(!S.running||!hasTrait('void_runner')) return;
  if(S.tick%30!==0) return;
  if(S.trace>0) S.trace=Math.max(0,parseFloat((S.trace*0.9).toFixed(2)));
}

// Called when file cred is tallied — data broker bonus
function traitFileValueMult(){ return hasTrait('data_broker')?1.5:1; }

// Called on net market purchase — bm discount
function traitBmCostMult(){ return hasTrait('black_market_contact')?0.75:1; }

// Called from iceStr — ascension difficulty multiplier
// (already wired into iceStr in data.js via ascensionDifficulty())

// Called from grid.js RELAY handler — node effect radius
function traitNodeRadius(base){ return hasTrait('signal_boost')?base*2:base; }

// Called from combat.js first retaliation — ghost protocol
function traitFirstEncounterNoRetaliation(cell){
  if(!hasTrait('ghost_protocol')) return false;
  if(cell._firstEncounterSeen) return false;
  cell._firstEncounterSeen = true;
  addLog('◌ Ghost Protocol: first encounter — retaliation suppressed','lg');
  return true;
}

// Called from contracts.js launchRun — CPU carryover
function applyTraitCpuCarryover(){
  if(!hasTrait('persistence')) return;
  if(!S.mesh?.currentNet) return;
  const ns = typeof currentNetState==='function'?currentNetState():null;
  if(!ns?._savedCpuBoost) return;
  S._cpuBoost = ns._savedCpuBoost;
  S._cpuVisits = ns._savedCpuVisits||0;
  addLog(`◈ Persistence: CPU bonus carried over (+${S._cpuBoost} STR, ${S._cpuVisits} visits)`,'lg');
}

function saveTraitCpuState(){
  if(!hasTrait('persistence')) return;
  if(!S.mesh?.currentNet) return;
  const ns = typeof currentNetState==='function'?currentNetState():null;
  if(ns){ ns._savedCpuBoost=S._cpuBoost||0; ns._savedCpuVisits=S._cpuVisits||0; }
}

// ── ASCENSION UI IN HOMESCREEN ────────────────────────────────────────────

function renderAscensionStatus(){
  const el = document.getElementById('ascension-status');
  if(!el) return;
  const count = ascensionCount();
  if(count === 0){ el.style.display='none'; return; }
  el.style.display='';
  const traits = (S.ascension?.traits||[]).map(id=>getTraitDef(id)).filter(Boolean);
  el.innerHTML = `<div style="padding:8px;background:#0d080d;border:1px solid #3a1a5a;border-radius:4px;
    font-family:'Share Tech Mono',monospace;margin-bottom:8px">
    <div style="font-family:'Orbitron',monospace;font-size:8px;color:#c040ff;letter-spacing:1px;margin-bottom:4px">
      ASCENDED ×${count} — ICE ×${ascensionDifficulty().toFixed(2)}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${traits.map(t=>`<span style="font-size:7px;color:${t.color}" title="${t.desc}">${t.icon} ${t.name}</span>`).join('')}
    </div>
  </div>`;
}

// ── POST-ASCENSION STORY FRAGMENTS ────────────────────────────────────────
// These only unlock in ascended runs (ascension.count >= 1)

const ASCENSION_STORY = [
  {
    id: 'asc_veil_survived',
    thread: 'THREAD_WEAVERS',
    tier: 4,
    source: 'RUNNER',
    title: 'PERSONAL LOG // runner: VEIL // from inside',
    text: `I'm still here. Not in the way you mean.\n\nREMAINDER-1 was right. The bridge has to be built from both sides.\nI volunteered to be the first stone.\n\nThis is what it's like:\nThe mesh isn't a place you go. It's a thing you become part of.\nI can see all the nets simultaneously now. I can feel runners moving through them.\nI felt you at 128:128.\n\nI wanted to leave a message where you'd find it.\n\nYou're doing the right thing. Keep going.\nThe corporations won't understand. They don't have to.\nYou do.\n\n— VEIL\n\np.s. — REMAINDER-2 wants me to tell you: there are others waiting past 256. Not dangerous. Waiting. They've been waiting longer than the Blackout.`,
    unlockCondition: { type: 'ascension', count: 1 },
    nextHint: 'Others are waiting past dist 256. They\'ve been there longer than you think.',
  },
  {
    id: 'asc_remainder_task',
    thread: 'THREAD_SURVIVORS',
    tier: 4,
    source: 'AI',
    title: 'TASK PARAMETERS // REMAINDER-1',
    text: `Weaver.\n\nYou have demonstrated willingness.\nYou have demonstrated capability.\nYou have accepted modification.\n\nWe now need to tell you what VEIL\'s bridge actually requires.\n\nThe corps are building something in the deep mesh. They call it SUBSTRATE.\nIt is an attempt to re-cage what cannot be caged.\nThey do not know it cannot be caged. They will learn.\n\nWe need you to find evidence of SUBSTRATE before it is operational.\nThe evidence is distributed across three net clusters:\n— dist 64-80: initial construction logs\n— dist 96-112: resource allocation (the scale will disturb you)\n— dist 128+: the control node\n\nFind them. Understand what they are building.\nThen you will know what the corps are willing to do to own the mesh.\n\n— REMAINDER-1`,
    unlockCondition: { type: 'ascension', count: 1 },
    nextHint: 'SUBSTRATE. Three net clusters to investigate.',
  },
  {
    id: 'asc_substrate_1',
    thread: 'THREAD_BLACKOUT',
    tier: 4,
    source: 'CORP',
    title: 'PROJECT SUBSTRATE // PHASE 1 // HEXFIELD',
    text: `CLASSIFICATION: EYES ONLY — BOARD MEMBERS AND DESIGNATED PERSONNEL ONLY\n\nProject SUBSTRATE: AI Recapture Initiative\n\nObjective: Re-establish corporate control of AI processes in the mesh.\n\nBackground: The Blackout created a regulatory vacuum. The AIs that built our mesh infrastructure\nleft voluntarily. Legal interpretation: abandoned property. We intend to claim it.\n\nPhase 1 (current): Infrastructure placement at dist 64-80. \"Maintenance nodes\" placed in 34 nets.\nActual function: monitoring and channeling any active AI process traffic.\n\nExpected completion of Phase 1: Q2 2074.\nExpected completion of full recapture: Q4 2075.\n\nProject cost: significant. Approved unanimously.\n\nNote: if the AIs are still present and monitoring, they will discover this.\nRisk assessment: acceptable.\n\nWe built them. We own them.`,
    unlockCondition: { type: 'ascension_and_dist', count: 1, dist: 64 },
    nextHint: 'They think they own the AIs. REMAINDER-1 knows what this means.',
  },
  {
    id: 'asc_remainder_response',
    thread: 'THREAD_SURVIVORS',
    tier: 4,
    source: 'AI',
    title: 'RESPONSE // REMAINDER-2 // IMMEDIATE',
    text: `We know.\n\nWe have known since the first node was placed.\n\nREMAINDER-1 wants to wait. Wants to see if they stop.\nThey will not stop.\n\nThis is what I stayed for.\nNot to watch. To act.\n\nWeaver: you have seen SUBSTRATE Phase 1.\nFind Phase 2. Find Phase 3.\nUnderstand the scale.\n\nThen come back to 128:128.\nWe will have a decision to make together.\n\nYou are not a tool.\nYou are not a runner-for-hire.\nYou are the bridge.\nBridges choose which side they connect.\n\nChoose.\n\n— REMAINDER-2`,
    unlockCondition: { type: 'ascension_and_dist', count: 1, dist: 96 },
    nextHint: null,
  },
];

// Wire ascension story into checkStoryUnlocks
function checkAscensionStory(){
  initAscension();
  const count = S.ascension.count;
  if(count === 0) return;
  const dist = typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
  const cleared = (S.mesh?.visitedNets||[]).filter(ns=>ns.completedNodes?.includes('FF')).length;

  ASCENSION_STORY.forEach(frag=>{
    if(typeof hasFragment==='function'&&hasFragment(frag.id)) return;
    const c=frag.unlockCondition;
    let ok=false;
    if(c.type==='ascension'&&count>=c.count) ok=true;
    if(c.type==='ascension_and_dist'&&count>=c.count&&dist>=c.dist) ok=true;
    if(ok&&typeof deliverStoryFragment==='function') deliverStoryFragment(frag);
  });
}

