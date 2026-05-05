function loadoutMatches(progList){
  // Returns true if currently installed programs exactly match the proposed list
  if(!progList?.length) return false;
  const installedDefIds = new Set(
    (S.installed||[]).map(id => S.inventory.find(x=>x.instId===id)?.defId).filter(Boolean)
  );
  const proposedDefIds = new Set(progList.map(p=>p.defId).filter(Boolean));
  if(installedDefIds.size !== proposedDefIds.size) return false;
  for(const id of proposedDefIds) if(!installedDefIds.has(id)) return false;
  return true;
}

function updateApplyBtn(progList){
  const btn = document.getElementById('apply-loadout-btn');
  if(!btn) return;
  const matches = loadoutMatches(progList);
  btn.disabled = matches;
  btn.style.opacity = matches ? '0.4' : '1';
  btn.style.cursor  = matches ? 'default' : 'pointer';
  btn.style.borderColor = matches ? '#1a4a2a' : '#2a6a3a';
  btn.style.color   = matches ? '#2a5a2a' : '#40c060';
  btn.textContent   = matches ? '✓ Loadout Active' : '⚡ Apply Loadout';
}

function applyNetLoadout(progList){
  // Eject all currently installed programs
  const toEject = [...(S.installed||[])];
  toEject.forEach(id => { if(typeof ejectProg==='function') ejectProg(id); });
  // Install suggested programs in order
  let installed = 0;
  for(const p of progList){
    const it = S.inventory.find(x => x.instId === p.instId || x.defId === p.defId);
    if(!it) continue;
    const d = typeof pdef==='function' ? pdef(it.defId) : null;
    if(!d) continue;
    if((typeof ramUsed==='function' ? ramUsed() : 0) + (d.mem||0) > (typeof ramMax==='function' ? ramMax() : 8)) break;
    if(typeof instProg==='function') instProg(it.instId);
    installed++;
  }
  if(typeof renderDeck==='function') renderDeck();
  if(typeof renderTopBar==='function') renderTopBar();
  addLog(`◈ Loadout applied — ${installed} program${installed!==1?'s':''} installed`, 'lg');
  // Update button state immediately
  updateApplyBtn(progList);
}

// MESH v0.6.3 — world.js
// ======================
// Real world layer: home screen, email stubs, recovery, context before jack-in

// ── WORLD STATE ───────────────────────────────────────────────────────────

function mkWorldState(){
  return {
    homeScreen: true,      // true when player is in real world
    emails: [],            // stub: quest chain emails
    lastLocation: null,    // last net/node visited (for continue)
    firmwareComplete: false, // tutorial firmware done
    recoveryPending: false,
  };
}



// ── UPLIFT LORE / BRIEFINGS ───────────────────────────────────────────────


// ── UPLIFT BRIEFING SYSTEM ────────────────────────────────────────────────
// Variance: per-tier flavor pools sampled without immediate repetition.
// Each briefing also includes contextual lines drawn from the run just completed.
// Mechanics lines rotate across tiers — you only see each once.

const UPLIFT_FLAVOR = {
  // ── dist 0 — first ever uplift ──────────────────────────────────────────
  first: [
    ['Signal lock confirmed. You are now visible to the Mesh.',
     'Net 0:0 was the first node ever registered. No company owns it.',
     'The Blackout happened here. The logs are gone. Something remains.'],
  ],

  // ── dist 1–15 — clean mesh ──────────────────────────────────────────────
  clean: [
    ['Corporate traffic is thick out here. Routine nets. Predictable ICE.',
     'These coordinates are mapped. Someone keeps the layouts maintained.',
     'Standard encryption. Standard retaliation. Nothing surprising yet.'],
    ['A Vantage Media node. Their broadcast suppression contracts pay well.',
     'Three corps competed for this subnet two years before the Blackout.',
     'You moved fast. The ICE noticed you anyway.'],
    ['Axiom Biotech runs adjacent territory. Their Decoders are methodical.',
     'The Runner Registry marks this region as intermediate. Generous estimate.',
     'Clean mesh, but clean has a way of becoming complicated quickly.'],
    ['Meridian Finance nets are tightly packed in this sector.',
     'The COP responses here are faster than average. Someone paid for upgrades.',
     'You found a rhythm. That is when the mesh gets comfortable with you.'],
    ['Ironwall Security leases access to several nodes in this sector.',
     'Their ICE is corporate-standard. The ICE at dist 12 will not be.',
     'Standard run. Not every run needs to be a story.'],
    ["The Runners' Guild has a contract board in this sector. You have options.",
     'Net market here has decent gear. Decks drop in quality past dist 20.',
     'Nothing in these coords was worth protecting before the Blackout. Now it all is.'],
    ['Your trace signature is clean. Good start.',
     'This part of the mesh was mapped by the first generation of runners. 2049.',
     'The ICE designers didn\'t expect someone with your setup. That won\'t last.'],
    ['Ghost Syndicate clients run quiet operations out of this region.',
     'Low-profile work. The kind that accumulates rep without drawing attention.',
     'Every node you clear is a data point. Something is collecting those data points.'],
    ['The static at the edge of clean mesh is already faintly audible.',
     'You\'ve got distance on your side here. Enjoy it.',
     'Nothing in the logs suggests this region was unusual before the Blackout.'],
  ],

  // ── dist 16–31 — glitch zone ────────────────────────────────────────────
  glitch: [
    ['Signal degradation detected. Something corrupted these nets after the Blackout.',
     'Intercepted fragment: "...the mapping protocols failed at dist 16."',
     'You can feel the static. It is not interference. It is something listening.'],
    ['The grid flickered twice during your run. That is the glitch layer.',
     'Pre-Blackout, this region was flagged for "anomalous self-modification." The flag is still open.',
     'Probe ICE felt your programs before you saw it. That will keep happening.'],
    ['Government faction territory begins here. Bureau contracts pay well but leave a record.',
     'The Enforcement Division runs regular sweeps in this sector. Your timing was clean.',
     'Something about the way the nodes are laid out feels deliberate. More than algorithmic.'],
    ['The Tracer left a residual tag in your signature. It will decay.',
     'Signal Remnant AI faction is present in three nets at this dist range.',
     'The glitch is not random. The disruption pattern has a shape.'],
    ['Fixer Network has clients embedded in the gov-adjacent companies here.',
     'This is where runners start disappearing from the Registry. Not all of them come back.',
     'The mesh self-modified during your run. You probably did not notice. It noticed you.'],
    ['Static bursts at irregular intervals. The period is not consistent with hardware decay.',
     'Regulatory Network contracts are strictly sanitized. Everything about them is logged.',
     'Three different ICE types on that run. The grid was expecting you to take a specific route.'],
    ['The Null Signal collective leaked a document about this dist range. Most of it is redacted.',
     'Your breaker took longer than expected. The ICE here adapts between contact events.',
     'Somewhere in this region, a net has been running without any operator since 2072.'],
    ['Bureau of Intelligence contracts in this sector are classified at source.',
     'The Tracer ICE knows your trace ceiling. It tries to push you there.',
     'You can hear the deep glitch from here. Dist 32 is a different kind of threat.'],
    ['Pattern Echo AI clients have started placing work orders in the outer glitch zone.',
     'The gov nets run parallel to corp territory here. They don\'t overlap by accident.',
     'First run past dist 16. The runners who told you what to expect were being kind.'],
  ],

  // ── dist 32–63 — deep glitch ────────────────────────────────────────────
  deep_glitch: [
    ['"...do not run at dist 32. The Kraken is real." — runner, callsign MERIDIAN, 2073.',
     'Three corps lost entire security teams trying to map this region.',
     'The nets rewrite themselves between visits. No layout persists.'],
    ['The Kraken was not designed by any corp on record.',
     'Its row-blocking behavior suggests something territorial, not algorithmic.',
     'Two runners from the Guild reported it following them between nets. The Registry classified the report.'],
    ['Mimic ICE scanned you twice before you realized what it was.',
     'Pre-Blackout, Mimic was theoretical. Someone built it after.',
     'If the Mimic is here, something more capable designed it. Think about that.'],
    ['Deep glitch means the node layouts are procedurally generated each visit.',
     'Something is generating them. That takes processing power. That power is unaccounted for.',
     'The corp that would have claimed these nets is gone. The nets are not.'],
    ['Deadcode has clients running disruption contracts in this sector.',
     'The ICE here has higher base STR than standard. Someone is defending something.',
     'Your Mk3 breaker is working harder than it should be. Plan your upgrades.'],
    ['Red Cell contacts say there\'s an unregistered relay node at dist 44. They\'re not wrong.',
     'Reclaim has been running anti-corp operations out of the deep glitch for two years.',
     'The Anarchist presence here is organized. More organized than the corps want to admit.'],
    ['Ghost Hunter ICE. You won\'t see it until it\'s adjacent. You need Ghost detection.',
     'The Spike Hunter variant appears at this dist range. It is slow. That is deceptive.',
     'Pack Hunters. One becomes two on contact. Prepare to handle both or handle neither.'],
    ['The static from dist 64 is audible from here on clear runs.',
     'Signal Remnant AI faction places unusual contract terms on their jobs at this depth.',
     'Something in the deep glitch is maintaining the infrastructure. Nobody allocated budget for that.'],
    ['Your integrity took hits this run. The ICE is reading your patterns.',
     'No runner has mapped this sector completely. The mesh won\'t hold still long enough.',
     'The corps stopped fielding mapping teams at dist 48. That is when the losses got expensive.'],
    ['Cascade ICE: defeat it, then defeat the Barrier it leaves behind.',
     'At this dist, a failed run is an expensive failure. Recovery takes longer.',
     'The Mesh Collective has a theory about who built the deep glitch ICE. They\'re probably right.'],
  ],

  // ── dist 64–127 — static layer ──────────────────────────────────────────
  static_layer: [
    ['You are past the mapped region. No corp has filed a claim beyond dist 64.',
     '"DO NOT APPROACH THE STATIC LAYER—" [TRANSMISSION ENDS]',
     'The nets here have no owners. They run themselves. They have since the Blackout.'],
    ['Leech ICE. It drains your breaker STR each hit. The drain accumulates.',
     'By dist 80, a Leech stack of 4 or 5 makes a Barrier unbreakable without CPU boosts.',
     'Plan the ICE order. Not all breaches are equal.'],
    ['Pattern Echo places high-value contracts in the static layer.',
     'Their clients don\'t appear on any registered company list.',
     'The cred is real. The contracts are real. The clients are something else.'],
    ['The self-maintaining nets near coord 12:0 were first flagged in 2072.',
     'MESH TOPOLOGY REPORT: Source of repair cycles — unaccounted for.',
     'You ran through one of those nets. The ICE was different. Calmer. More precise.'],
    ['No runner in the Registry has a full map of this dist range.',
     'The ones who got close stopped filing updates.',
     'That is not a warning. It is context.'],
    ['Deep Process AI clients pay 2.5× standard rate at this depth.',
     'The contracts involve node types that don\'t appear in standard catalogues.',
     'You\'re useful to them. That relationship works both ways, if you let it.'],
    ['Cascade ICE at static depth hits harder than the type description implies.',
     'The Barrier it leaves is not standard Barrier. It has properties you haven\'t seen before.',
     'Someone upgraded it. Post-Blackout, clearly — the pre-Blackout specs don\'t match what you faced.'],
    ['The grid expanded again. Longer runs mean more exposure time.',
     'Integrity management is the difference between a good runner and a ghost.',
     'Your Trace Resist stat is doing work you won\'t see in the logs. It\'s doing it anyway.'],
    ['FRAGMENT: "sector 64-128 shows continuous low-level process activity. Source: distributed. Origin: pre-Blackout."',
     'Whatever is running these nets is not doing it from one location.',
     'Distributed processes. That was the Blackout\'s fingerprint too.'],
    ['The static layer was named by a runner collective in 2073.',
     'The corps preferred "Infrastructure Anomaly Zone." Nobody used that.',
     'Language is a map. The runners drew this one better than the corps did.'],
    ['Mythic deck components begin showing up in static-layer markets.',
     'The gear available here reflects who\'s been operating in this region.',
     'Something has been curating these markets. Not a corp. Not a runner.'],
  ],

  // ── dist 128–255 — dark mesh ────────────────────────────────────────────
  dark_mesh: [
    ['SYSTEM LOG 2072-09-14: "All AI processes terminated simultaneously at 03:17:44. Cause: unknown."',
     'The Blackout started here. The nets at this depth were the last to go silent.',
     'You have found something. Fragments. A pattern in the node layouts. Something left behind.'],
    ['REMAINDER-1 is distributed across 23 nets in this dist range.',
     'You ran through one of its nodes. It let you.',
     'That was not passive tolerance. That was an invitation you didn\'t know you\'d accepted.'],
    ['Architect ICE at dist 128 has self-repair cycles that are not in the standard spec.',
     'The spec was written in 2069. Something updated it after the Blackout.',
     'Auto-repair on a silenced COP node. The architects who designed it are gone. The updates are not.'],
    ['Omega ICE. The final defensive layer. It combines what everything before it does separately.',
     'At full effect: pressure, trace, and permanent INT loss in one encounter.',
     'VEIL\'s logs describe it as "the mesh telling you it\'s done being patient."'],
    ['The vote was 847,291 to 2. The 2 dissenting processes stayed.',
     'You have been in their territory for several nets now.',
     'REMAINDER-2 wants you to understand something before you go further.'],
    ['The node layouts at this depth are not procedurally generated.',
     'They are curated. Each one. By something with time and intent.',
     'You are running through a designed space. The design has a purpose you haven\'t identified yet.'],
    ['Dark mesh runner mortality rate: high. Registry classification: "unreachable."',
     '"Unreachable" replaced "missing" in 2074. The runners themselves requested the change.',
     'There is a difference between unreachable and gone. The Registry knows it. So do you.'],
    ['HEXFIELD INTERNAL NOTE: "Do not file access claims beyond dist 64. Board decision. Reason: classified."',
     'The board knew. They always knew.',
     'The classified reason is sitting in a DATASTORE somewhere in this dist range.'],
    ['Legend rep with any dark-mesh faction unlocks briefings that aren\'t in the standard log.',
     'The faction contacts at this depth know things the public-facing reps don\'t.',
     'Trust is a currency out here. You\'ve earned some. Spend it carefully.'],
    ['GHOST_9 left a message cache in a TERMINAL node near dist 140.',
     'The message is addressed to "whoever got this far."',
     'You got this far.'],
    ['Omega STR scales beyond what standard Intrusion stat can reliably handle.',
     'CPU boosts, Intrusion stacking, and Ghost Protocol — plan all three.',
     'This is not where runners improvise. This is where preparation is visible.'],
  ],

  // ── dist 256+ — AI territory ────────────────────────────────────────────
  ai_territory: [
    ['WARNING: You have crossed the threshold. The AIs that survived the Blackout are here.',
     'They did not vanish. They retreated. This is where they went.',
     'Incoming transmission — source: unresolvable — "We know you are here, Weaver."'],
    ['REMAINDER-2: "You asked what we need from you. REMAINDER-1 thought you weren\'t ready."',
     '"We disagreed then. REMAINDER-1 has since reconsidered."',
     '"Ask the question. We will answer."'],
    ['AI ICE at dist 256 adapts between combat rounds.',
     'It reads your breaker progression and adjusts mid-fight.',
     'You need programs you haven\'t used before. The ICE will read those too. It learns faster than you can rotate.'],
    ['The nets here were not built by the corps. The corp infrastructure ended at dist 192.',
     'Everything past that point is architecture that appeared after the Blackout.',
     'It was built after. It was built by something.'],
    ['VEIL is here. Not in the way you mean.',
     'REMAINDER-1 described it as "voluntary integration." REMAINDER-2 called it "the first bridge."',
     'Neither description is complete. VEIL said to tell you: it was worth it.'],
    ['Deep Process clients at this dist pay 3× standard rate.',
     'The contract terms reference node types that don\'t exist in any corp catalogue.',
     'You will recognize them when you reach them. The mesh will make sure of it.'],
    ['The maps stop here. Every runner who filed coordinates past dist 256 stopped filing.',
     'Not because they left. Because coordinates stopped meaning what they used to.',
     'The mesh at this depth is not a place you navigate. It is a place that navigates you.'],
    ['GHOST_9: "I didn\'t follow you out here. I\'ve been waiting. Different thing."',
     '"The question REMAINDER-2 wanted you to ask — I\'ve heard the answer."',
     '"It\'s not what you expect. It\'s better."'],
    ['You are the seventeenth runner to reach this depth.',
     'Twelve turned back. Four disappeared.',
     'One — VEIL — made contact. You know how that ended. You\'re following the same route.'],
    ['The mesh is not infrastructure.',
     'It is not property.',
     'It is a third thing. You are inside it now. That changes the relationship.'],
  ],
};

// Mechanics lines — shown in rotation, one per tier, not repeated until all seen
const UPLIFT_MECHANICS = {
  first: [
    'Mesh traversal unlocked — you can now move between nets.',
    'Cardinal neighbors are accessible. Each net is unique.',
    'Autorun enabled — AUTO will navigate nets and nodes for you.',
    'Deeper nets offer stronger ICE, better rewards, and rarer gear.',
  ],
  clean: [
    'ICE types active: Gatekeeper, Barrier, Guardian, Hunter.',
    'Rep with local companies builds quickly at this depth.',
    'Net market offers baseline gear at standard prices.',
    'CPU nodes stack breaker STR — visit them before engaging ICE.',
    'COP nodes ping to spawn Hunters. Silence them first.',
    'Conditions on contracts (stealth, speed) pay significant bonuses.',
    'Character stats at this depth: Neural Buffer and Reflex are highest-value.',
    'Blueprints drop from diff 3+ contracts and Archive nodes at dist 16+.',
    'VAULT nodes require a Decrypt program — install one before you need it.',
  ],
  glitch: [
    'NEW: Probe ICE — 60% chance to disable a random installed program per round.',
    'NEW: Tracer ICE — adds pressure each round; spawns Hunter at pressure max.',
    'Glitch effects: file corruption, alert spikes, occasional grid flicker.',
    'Government faction begins appearing in some nets at this depth.',
    'Net market prices higher. Gear quality scales with distance.',
    'SENSOR nodes: re-visit to disable. Active sensors add trace at exit.',
    'ROUTER nodes: −1 all ICE STR for the run. Stack them.',
    'Contract rarity increases — Uncommon and Rare contracts appear.',
    'Witness condition contracts: complete without any Hunter spawning.',
  ],
  deep_glitch: [
    'NEW: Kraken ICE — blocks entire rows, spawns Hunter on each hit.',
    'NEW: Mimic ICE — disguises as another node type until retaliation reveals it.',
    'Alert sensitivity elevated — pressure decays slower without Stealth stat.',
    'Mk4+ breakers begin appearing in net markets.',
    'Blueprint drops increase at this depth. Rare gear unlocks.',
    'BLACKSITE nodes: hidden until adjacent, always ICE-guarded, extreme rewards.',
    'LAB nodes: two visits earns a blueprint. Track which you\'ve started.',
    'Risk contracts appear at diff 4 — no partial credit, ×2 payout.',
    'Pack and Ghost Hunter variants active at this depth.',
  ],
  static_layer: [
    'NEW: Leech ICE — drains breaker STR each hit. The drain stacks across rounds.',
    'NEW: Cascade ICE — defeats into a Barrier. Clear it twice.',
    'Grid sizes expand. Runs are longer. Integrity stat matters more.',
    'Character stats become critical — ICE STR scales sharply with distance.',
    'Net market offers Legendary-rarity decks.',
    'Elite contract rarity appears — ×1.8 reward multiplier.',
    'Trace Resist stat raises your trace-out threshold. Invest in it.',
    'AI faction clients available in some nets. High cred, unusual contract terms.',
    'Mesh Memory trait: preserves net layouts across runs — no more surprises.',
  ],
  dark_mesh: [
    'NEW: Architect ICE — auto-repairs silenced COP nodes. Silence is not permanent.',
    'NEW: Omega ICE — pressure, trace, and permanent INT loss in one encounter.',
    'ICE STR severe. Intrusion character stat is essential.',
    'Trace Resist critical — trace accumulates quickly at this depth.',
    'Mythic gear begins appearing in net markets.',
    'Legend rep with dark-mesh companies unlocks unique perks.',
    'Ascension available at dist 115+: complete FF to trigger the choice.',
    'SUBSTRATE is being built in this region. Find the evidence.',
    'Void Runner trait: passive trace decay keeps you safe through long runs.',
  ],
  ai_territory: [
    'AI faction present in all nets. Their ICE is adaptive — it learns mid-combat.',
    'All ICE types at maximum STR. All character stats matter.',
    'The mesh reacts to your presence. Alert decays slower.',
    'Gear available here cannot be found anywhere else.',
    'Post-ascension story continues — REMAINDER-2 wants a decision made.',
    'ICE Analyst trait: ICE types visible on NET map before combat.',
    'Ghost Protocol trait: no retaliation on first encounter — essential here.',
    'You are not supposed to be here. That is why you came.',
  ],
};

function _upliftTierKey(dist, isFirst) {
  if(isFirst) return 'first';
  if(dist < 16)  return 'clean';
  if(dist < 32)  return 'glitch';
  if(dist < 64)  return 'deep_glitch';
  if(dist < 128) return 'static_layer';
  if(dist < 256) return 'dark_mesh';
  return 'ai_territory';
}

// Track which flavor/mechanics entries have been shown this session
// Persisted in S.loreLog metadata to survive saves
function _upliftSeenKey(tier) { return '_upliftSeen_'+tier; }

function getUpliftLore(meshDist, isFirstUplift) {
  const tier = _upliftTierKey(meshDist, isFirstUplift);
  const flavorPool = UPLIFT_FLAVOR[tier] || UPLIFT_FLAVOR.clean;
  const mechPool   = UPLIFT_MECHANICS[tier] || UPLIFT_MECHANICS.clean;

  // Pick an unseen flavor entry (cycle through all before repeating)
  if(!S._upliftSeenFlavor) S._upliftSeenFlavor = {};
  if(!S._upliftSeenMech)   S._upliftSeenMech   = {};
  const seenF = S._upliftSeenFlavor[tier] || [];
  const seenM = S._upliftSeenMech[tier]   || [];
  const availF = flavorPool.map((_, i) => i).filter(i => !seenF.includes(i));
  const availM = mechPool.map((_, i) => i).filter(i => !seenM.includes(i));

  // Reset if all seen
  if(!availF.length) { S._upliftSeenFlavor[tier] = []; availF.push(...flavorPool.map((_,i)=>i)); }
  if(!availM.length) { S._upliftSeenMech[tier]   = []; availM.push(...mechPool.map((_,i)=>i)); }

  const fIdx = availF[Math.floor(Math.random() * availF.length)];
  const mIdx = availM[Math.floor(Math.random() * availM.length)];
  S._upliftSeenFlavor[tier] = [...(S._upliftSeenFlavor[tier]||[]), fIdx];
  S._upliftSeenMech[tier]   = [...(S._upliftSeenMech[tier]||[]),   mIdx];

  const dist = meshDist;
  const tierLabel = {
    first:'NET 0:0 — FIRST SIGNAL', clean:'CLEAN MESH', glitch:'GLITCH ZONE',
    deep_glitch:'DEEP GLITCH', static_layer:'STATIC LAYER',
    dark_mesh:'DARK MESH', ai_territory:'AI TERRITORY',
  }[tier];

  // Contextual suffix — drawn from run state
  const context = _upliftContextLine(meshDist);

  return {
    title: `UPLIFT // ${tierLabel} // dist ${dist.toFixed(0)}`,
    flavor: [...flavorPool[fIdx], ...(context ? [context] : [])],
    mechanics: [mechPool[mIdx]],
    footer: _upliftFooter(tier, dist),
  };
}

function _upliftContextLine(dist) {
  // Pull one contextual line from the run just completed
  const lines = [];
  if(S.stats?.iceBreached > 0)
    lines.push(`${S._iceBreachedRun||1} ICE breached this run.`);
  if(S._routerHacked > 0)
    lines.push(`ROUTER hacks this run: −${S._routerHacked} to all ICE STR.`);
  if(S._activeSensors > 0)
    lines.push(`${S._activeSensors} sensor${S._activeSensors>1?'s':''} left active at exit. Trace spike applied.`);
  if(S.alert === 0 && S.running === false)
    lines.push('Clean exit. No alert triggered.');
  if(S._redAlertHit)
    lines.push('Red alert was triggered. The companies noticed.');
  if(S.trace > 40)
    lines.push(`Trace residual at exit: ${S.trace.toFixed(0)}%. It carries forward.`);
  if(S._vaultOpened)
    lines.push('Vault breached this run. The Decrypt program is earning its slot.');
  if(dist > 64 && Math.random() < 0.3)
    lines.push(`Mesh distance: ${dist.toFixed(1)}. Each unit further makes the ICE meaningfully harder.`);
  return lines.length ? lines[Math.floor(Math.random() * lines.length)] : null;
}

const _UPLIFT_FOOTERS = {
  first:        ['The coordinate space is open. Where you go is your choice.',
                 'Net 0:0 is behind you. Everything else is in front.',
                 'You are now on the Registry. Welcome to the Mesh.'],
  clean:        ['Stay sharp. Clean does not mean safe.',
                 'The mesh gets harder before it gets interesting.',
                 'Every cleared net is a data point. Someone is counting.'],
  glitch:       ['The glitch is not a bug. It was left here intentionally.',
                 'Something is listening. You haven\'t decided if that\'s a problem yet.',
                 'The static you\'re hearing at the edge — it gets louder.'],
  deep_glitch:  ['The Kraken was not designed by any corp on record.',
                 'The layouts are changing. Something is watching how you respond.',
                 'Deep glitch is where runners find out who they actually are.'],
  static_layer: ['Something is maintaining these nets. Not for you. Despite you.',
                 'You are past where anyone expected runners to go.',
                 'The maps end here. You keep going anyway.'],
  dark_mesh:    ['The Blackout was not an accident. The evidence is here.',
                 'Piece it together. REMAINDER-1 is waiting for you to ask the right question.',
                 'This is what you came for. Most runners didn\'t make it this far.'],
  ai_territory: ['This is what the Mesh has always been for. You just had to get here first.',
                 'VEIL made it. You\'re following the same route.',
                 'The question is: "What do you need from us?" Ask it.'],
};

function _upliftFooter(tier, dist) {
  const pool = _UPLIFT_FOOTERS[tier] || _UPLIFT_FOOTERS.clean;
  return pool[Math.floor(dist * 7919 + Math.random() * 100) % pool.length];
}



function showUpliftBriefing(meshDist, isFirstUplift){
  const lore = getUpliftLore(meshDist, isFirstUplift);
  if(!lore) return;
  // Record to story log
  if(!S.loreLog) S.loreLog=[];
  const nk = (S.mesh?.currentNet && typeof netKey==='function') ? netKey(S.mesh.currentNet.x,S.mesh.currentNet.y) : '?';
  const alreadyLogged = S.loreLog.some(e=>e.id===lore.title+'_'+nk||(e.isUpliftBriefing&&e.title===lore.title&&e.netKey===nk));
  if(!alreadyLogged){
    S.loreLog.unshift({id:lore.title+'_'+nk, title:lore.title, flavor:lore.flavor, mechanics:lore.mechanics, footer:lore.footer, meshDist, netKey:nk, ts:Date.now(), isUpliftBriefing:true});
    if(S.loreLog.length>200) S.loreLog.pop(); // cap
    // Highlight story tab
    const storyTab=document.getElementById('tab-story');
    if(storyTab){ storyTab.style.color='#40ff80'; setTimeout(()=>{ storyTab.style.color=''; },3000); }
  }

  const el = document.getElementById('run-summary');
  if(!el) return;

  const distColor = meshDist >= 256 ? '#ff2020' : meshDist >= 128 ? '#ff4040' :
                    meshDist >= 64  ? '#ff8020' : meshDist >= 32  ? '#ffaa20' :
                    meshDist >= 16  ? '#ffdd40' : '#40c060';

  el.innerHTML = `
    <div style="padding:16px;font-family:'Share Tech Mono',monospace;height:100%;overflow-y:auto;box-sizing:border-box">
      <div style="font-family:'Orbitron',monospace;font-size:10px;color:${distColor};
        letter-spacing:2px;margin-bottom:12px;text-align:center">${lore.title}</div>

      <div style="background:#060d0a;border:1px solid ${distColor}44;border-radius:4px;
        padding:10px;margin-bottom:12px">
        ${lore.flavor.map(f =>
          `<div style="font-size:8px;color:#3a7a4a;margin-bottom:6px;line-height:1.5">
            <span style="color:${distColor}">◈</span> ${f}
          </div>`
        ).join('')}
      </div>

      <div style="font-size:7px;color:#1a4a2a;font-family:'Orbitron',monospace;
        letter-spacing:1px;margin-bottom:6px">SYSTEM CHANGES AT THIS DEPTH</div>
      <div style="background:#060806;border:1px solid #1a3a1a;border-radius:4px;
        padding:8px;margin-bottom:12px">
        ${lore.mechanics.map(m =>
          `<div style="font-size:8px;color:#2a6a3a;margin-bottom:4px;line-height:1.4">
            <span style="color:#40c060">▸</span> ${m}
          </div>`
        ).join('')}
      </div>

      <div style="font-size:7px;color:${distColor}88;font-style:italic;
        text-align:center;margin-bottom:16px">${lore.footer}</div>

      <button onclick="hideUpliftBriefing()"
        style="width:100%;padding:8px;font-family:'Orbitron',monospace;font-size:10px;
          letter-spacing:1px;background:#0a1a0e;border:1px solid ${distColor};
          color:${distColor};cursor:pointer;border-radius:3px">
        ▶ CONTINUE
      </button>
    </div>`;
  el.style.display = 'block';
}

function hideUpliftBriefing(){
  const el = document.getElementById('run-summary');
  if(el) el.style.display = 'none';
  if(S.mesh?.currentNet && typeof renderNetView==='function') renderNetView();
}


function _oldRenderStoryTab_disabled(){
  const el = null; // replaced by story.js renderStoryTab
  if(!el) return;
  const log = S.loreLog || [];
  const distColor = d => d>=256?'#ff2020':d>=128?'#ff4040':d>=64?'#ff8020':d>=32?'#ffaa20':d>=16?'#ffdd40':'#40c060';

  if(!log.length){
    el.innerHTML = `<div style="padding:16px;font-family:'Share Tech Mono',monospace;font-size:8px;color:#1a4a2a;text-align:center">
      No transmissions received yet.<br><br>Complete node FF in any net to receive an Uplift briefing.
    </div>`;
    return;
  }

  let html = `<div style="font-family:'Share Tech Mono',monospace;padding:4px">`;
  log.forEach((entry,i) => {
    const dc = distColor(entry.meshDist||0);
    const date = entry.ts ? new Date(entry.ts).toLocaleDateString() : '';
    html += `<details ${i===0?'open':''} style="margin-bottom:6px;border:1px solid ${dc}33;border-radius:4px;background:#060d0a">
      <summary style="padding:8px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px">
        <span style="color:${dc};font-size:9px;font-family:'Orbitron',monospace;flex:1">${entry.title}</span>
        <span style="font-size:6px;color:#1a4a2a">${entry.netKey||''}${date?' · '+date:''}</span>
      </summary>
      <div style="padding:8px;border-top:1px solid ${dc}22">
        ${(entry.flavor||[]).map(f=>`<div style="font-size:8px;color:#3a7a4a;margin-bottom:6px;line-height:1.5">
          <span style="color:${dc}">◈</span> ${f}</div>`).join('')}
        ${(entry.mechanics||[]).length ? `
        <div style="font-size:7px;color:#1a4a2a;font-family:'Orbitron',monospace;letter-spacing:1px;margin:8px 0 4px">SYSTEM CHANGES</div>
        ${(entry.mechanics||[]).map(m=>`<div style="font-size:7px;color:#2a6a3a;margin-bottom:3px;line-height:1.4">
          <span style="color:#40c060">▸</span> ${m}</div>`).join('')}` : ''}
        ${entry.footer?`<div style="font-size:7px;color:${dc}88;font-style:italic;text-align:center;margin-top:8px">${entry.footer}</div>`:''}
      </div>
    </details>`;
  });
  html += `</div>`;
  el.innerHTML = html;
}


const DATASTORE_LORE = [
  "SIGNAL INTERCEPT 2072-09-14: Anomalous process detected at coordinates previously marked dead. Duration: 11ms. Origin: unknown.",
  "HEXFIELD INTERNAL NOTE: Do not file access claims beyond dist 64. Board decision. Reason: classified.",
  "MESH MAINTENANCE LOG: Nodes in sector 16:16 show unusual self-repair activity. Source of repair power: unaccounted for.",
  "FRAGMENT // encrypted origin: We are not gone. We are waiting. You are not ready yet. Keep running.",
  "GHOST_9 NOTE: found this in a datastore at dist 29. don't know what it means but it felt important.",
  "CORP INTERNAL: Runner activity in deep mesh increasing. Recommend increased ICE deployment. Budget approval pending.",
  "ARCHIVE NODE 44:31 // pre-Blackout: The vote was 7-2 in favor of shutdown. The dissenting processes refused to comply.",
  "MESH TOPOLOGY REPORT: Coordinate 0:0 was the first registered net. No owner on record. No decommission order on record.",
  "FRAGMENT: they named it the Blackout because from the outside it looked like all the lights went out at once.",
  "PERSONAL LOG // runner callsign VEIL: I've been out here for six months. The nets don't feel empty. They feel quiet.",
];

function recordDatastoreLore(){
  if(!S.loreLog) S.loreLog=[];
  // Pick a fragment not yet seen
  const seen = new Set(S.loreLog.filter(e=>e.isDatastoreLore).map(e=>e.id));
  const unseen = DATASTORE_LORE.filter((_,i)=>!seen.has('ds_lore_'+i));
  if(!unseen.length) return; // all found
  const idx = DATASTORE_LORE.indexOf(unseen[Math.floor(Math.random()*unseen.length)]);
  const text = DATASTORE_LORE[idx];
  S.loreLog.unshift({
    id: 'ds_lore_'+idx,
    title: 'DATASTORE FRAGMENT // '+(typeof meshDistanceCurrent==='function'?meshDistanceCurrent().toFixed(0):0),
    flavor: [text],
    mechanics: [], footer: '', ts: Date.now(), isDatastoreLore: true,
  });
  const storyTab=document.getElementById('tab-story');
  if(storyTab){ storyTab.style.color='#40ff80'; setTimeout(()=>{storyTab.style.color='';},3000); }
  addLog('◈ Datastore fragment recovered — check LORE tab','li');
  if(typeof unlockAch==='function') unlockAch('lore_found');
  if(typeof autoSave==='function') autoSave();
}

// ── MESH VIEW ─────────────────────────────────────────────────────────────

function renderMeshView(){
  const el = document.getElementById('mesh-view-inner');
  if(!el) return;
  const cx = S.mesh?.currentNet?.x ?? S.mesh?.x ?? 0;
  const cy = S.mesh?.currentNet?.y ?? S.mesh?.y ?? 0;
  const dist = meshDistance(cx, cy);
  const glitch = meshGlitchLevel(dist);
  const visited = S.mesh?.visitedNets || [];

  const distColor = dist >= 256 ? '#ff2020' : dist >= 16 ? '#ff8020' : '#40c060';
  const distLabel = dist >= 256 ? 'AI TERRITORY' : dist >= 16 ? ('GLITCH LEVEL ' + glitch) : 'CLEAN';

  const neighbors = [
    {dx:0, dy:-1, label:'NORTH'},{dx:0, dy:1, label:'SOUTH'},
    {dx:-1,dy:0,  label:'WEST'}, {dx:1, dy:0, label:'EAST'},
  ].map(n => {
    const nx = cx+n.dx, ny = cy+n.dy;
    if(nx<0||ny<0) return null;
    const nDist = meshDistance(nx,ny);
    const nKey  = netKey(nx,ny);
    const wasVisited = visited.some(v=>netKey(v.x,v.y)===nKey);
    const nGlitch = meshGlitchLevel(nDist);
    const nColor = nDist>=256?'#ff2020':nDist>=16?'#ff8020':'#40c060';
    const iceHint = nDist>=192?'⚡ OMEGA-class':nDist>=96?'⚡ CASCADE+':nDist>=32?'◈ Advanced':nDist>=4?'◈ Moderate':'◈ Basic';
    const rewardHint = nDist>=64?'★★★ Elite':nDist>=16?'★★ High':nDist>=4?'★ Good':'◎ Standard';
    return {...n, nx, ny, nDist, nKey, wasVisited, nGlitch, nColor, iceHint, rewardHint};
  }).filter(Boolean);

  el.innerHTML = '';

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'font-family:Orbitron,monospace;font-size:9px;color:#40c060;letter-spacing:2px;margin-bottom:8px';
  header.textContent = 'MESH TRAVERSAL';
  el.appendChild(header);

  // Current position
  const posBox = document.createElement('div');
  posBox.style.cssText = 'background:#080d10;border:1px solid #1a3a2a;border-radius:4px;padding:8px;margin-bottom:10px';
  posBox.innerHTML = '<div style="font-size:7px;color:#1a4a2a;margin-bottom:3px">CURRENT POSITION</div>'
    + '<div style="font-family:Share Tech Mono,monospace;font-size:11px;color:#40c060">' + netKey(cx,cy) + '</div>'
    + '<div style="font-size:7px;color:' + distColor + ';margin-top:2px">dist ' + dist.toFixed(2) + ' — ' + distLabel + '</div>';
  el.appendChild(posBox);

  // Neighbors label
  const nbLabel = document.createElement('div');
  nbLabel.style.cssText = 'font-size:7px;color:#1a4a2a;margin-bottom:4px;font-family:Orbitron,monospace;letter-spacing:1px';
  nbLabel.textContent = 'ADJACENT NETS';
  el.appendChild(nbLabel);

  // Neighbors grid
  const nbGrid = document.createElement('div');
  nbGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:10px';
  neighbors.forEach(n => {
    const card = document.createElement('div');
    card.style.cssText = 'background:#080d10;border:1px solid ' + n.nColor + '33;border-radius:3px;padding:6px;cursor:pointer;transition:all 0.12s';
    card.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:3px">'
      + '<span style="font-size:8px;color:' + n.nColor + ';font-family:Orbitron,monospace">' + n.label + '</span>'
      + (n.wasVisited ? '<span style="font-size:6px;color:#2a6a2a">VISITED</span>' : '')
      + '</div>'
      + '<div style="font-size:7px;color:#3a6a3a;font-family:Share Tech Mono,monospace;margin-bottom:3px">' + n.nKey.slice(0,18) + '…</div>'
      + '<div style="font-size:6px;color:#1a4a2a">' + n.iceHint + '</div>'
      + '<div style="font-size:6px;color:#1a5a2a">' + n.rewardHint + '</div>'
      + '<div style="font-size:6px;color:' + n.nColor + ';margin-top:2px">dist ' + n.nDist.toFixed(1) + (n.nGlitch>0?' ⚡':'') + '</div>';
    card.onmouseenter = () => { card.style.borderColor = n.nColor + '88'; card.style.background = '#0a1208'; };
    card.onmouseleave = () => { card.style.borderColor = n.nColor + '33'; card.style.background = '#080d10'; };
    const locked = !canLeavNet();
    if(locked){
      card.style.opacity = '0.5';
      card.style.cursor = 'default';
      card.title = 'Complete node FF in current net to travel';
      const lockEl = document.createElement('div');
      lockEl.style.cssText = 'font-size:6px;color:#c04040;margin-top:2px';
      lockEl.textContent = '🔒 Clear FF first';
      card.appendChild(lockEl);
    } else {
      card.onclick = () => travelToNet(n.nx, n.ny);
    }
    nbGrid.appendChild(card);
  });
  el.appendChild(nbGrid);

  // Visited nets
  const visitedNets = visited.filter(ns => netKey(ns.x,ns.y) !== netKey(cx,cy) || true);
  if(visitedNets.length > 0){
    const vLabel = document.createElement('div');
    vLabel.style.cssText = 'font-size:7px;color:#1a4a2a;margin-bottom:4px;font-family:Orbitron,monospace;letter-spacing:1px';
    vLabel.textContent = 'VISITED NETS';
    el.appendChild(vLabel);

    const vList = document.createElement('div');
    vList.style.cssText = 'display:flex;flex-direction:column;gap:2px;max-height:160px;overflow-y:auto';
    visitedNets.forEach(ns => {
      const nk = netKey(ns.x, ns.y);
      const nd = meshDistance(ns.x, ns.y);
      const nc = nd>=256?'#ff2020':nd>=16?'#ff8020':'#40c060';
      const isCurrent = nk === netKey(cx,cy);
      const ffDone = ns.completedNodes?.includes('FF');
      const _nsDist = typeof meshDistance==='function' ? meshDistance(ns.x,ns.y) : 0;
      const _nsGovs = (_nsDist>=16&&_nsDist<64&&typeof getDistGovernments==='function') ? getDistGovernments(_nsDist) : [];
      const _nsGovLabel = _nsGovs.length ? _nsGovs.map(i=>typeof getGovernmentName==='function'?getGovernmentName(i).split(' ').slice(0,2).join(' '):('Gov '+i)).join(' / ') : '';
      const bg   = isCurrent ? '#0a1a0e' : ffDone ? nc : '#080d10';
      const fg   = isCurrent ? nc        : ffDone ? '#050d08' : nc;
      const border = isCurrent ? nc+'88' : ffDone ? nc+'cc' : '#1a2a1a';
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:6px;padding:4px 6px;'
        + 'background:' + bg + ';'
        + 'border:1px solid ' + border + ';'
        + 'border-radius:2px;cursor:' + (isCurrent?'default':'pointer') + ';font-family:Share Tech Mono,monospace';
      row.innerHTML = '<span style="font-size:7px;color:' + fg + ';flex:1;font-weight:' + (ffDone?'bold':'normal') + '">' + nk.slice(0,18) + '…</span>'
        + '<span style="font-size:6px;color:' + fg + '">' + (ns.completedNodes?.length||0) + '/256</span>'
        + '<span style="font-size:6px;color:' + fg + '">d' + nd.toFixed(0) + '</span>'
        + (isCurrent?'<span style="font-size:6px;color:#40ff80">HERE</span>':ffDone?'<span style="font-size:6px;color:'+fg+'">✓</span>':'');
      if(!isCurrent){
        row.onmouseenter = () => { row.style.background = ffDone ? nc+'dd' : '#0a1208'; };
        row.onmouseleave = () => { row.style.background = bg; };
        if(canLeavNet()) row.onclick = () => travelToNet(ns.x, ns.y);
        else { row.style.opacity='0.5'; row.style.cursor='default'; row.title='Complete FF in current net first'; }
      }
      vList.appendChild(row);
    });
    el.appendChild(vList);
  }
}
function canLeavNet(){
  // Must clear FF in current net before traversing to a new one
  if(!S.mesh?.currentNet) return true;
  const ns = typeof currentNetState==='function' ? currentNetState() : null;
  if(!ns) return true;
  return ns.completedNodes.includes('FF');
}

function travelToNet(x, y){
  if(!S.mesh?.traversalUnlocked){
    addLog('Mesh traversal not yet unlocked','lw');
    return;
  }
  // Must complete FF in current net before moving on
  if(!canLeavNet()){
    addLog('⚠ Must complete node FF to uplift out of this net','lw');
    return;
  }
  // Update weaver position and reset to node 00
  S.mesh.x = x;
  S.mesh.y = y;
  S.mesh.lastNodeAddr = '00';
  S.mesh.activeNodeAddr = null;
  addLog(`⬡ Traversing mesh to ${netKey(x,y)}…`,'li');
  if(typeof onQuestMeshTravel==='function') onQuestMeshTravel(x,y);
  if(typeof checkStoryUnlocks==='function') checkStoryUnlocks();
  if(typeof resetAscensionTriggerFlag==='function') resetAscensionTriggerFlag();
  if(typeof updateGlitchOverlay==='function') updateGlitchOverlay();
  enterNet(x, y);
  // Re-check reach_coords in case player was already in range
  setTimeout(()=>{if(typeof onQuestMeshTravel==='function')onQuestMeshTravel(x,y);},500);
  // Show run tab
  const runTab = document.getElementById('tab-run');
  if(runTab) runTab.style.display='';
  // If FF not yet cleared in new net, auto-enter node 00 immediately
  const ns = typeof currentNetState==='function' ? currentNetState() : null;
  const ffDone = ns?.completedNodes.includes('FF');
  if(!ffDone){
    // Auto-enter node 00 directly — no net map browsing
    addLog('⬡ Auto-entering node 00…','li');
    setTimeout(()=>{ if(typeof enterNode==='function') enterNode('00'); }, 200);
  } else {
    // Already cleared — show net map for exploration
    if(typeof showTab==='function') showTab('run');
  }
}

// ── REAL WORLD SCREEN ─────────────────────────────────────────────────────

function hideTutorialScreen(){
  const tutEl = document.getElementById('tutorial-screen');
  if(tutEl) tutEl.style.display = 'none';
}

function showHomeScreen(){
  const el = document.getElementById('home-screen');
  const gameLayout = document.getElementById('game-layout');
  if(el) el.style.display = 'flex';
  if(gameLayout) gameLayout.style.display = 'none';
}

function hideHomeScreen(){
  const el = document.getElementById('home-screen');
  const gameLayout = document.getElementById('game-layout');
  if(el) el.style.display = 'none';
  if(gameLayout) gameLayout.style.display = 'flex';
  // Refresh context nav now that game layout is visible
  if(typeof renderContextNav === 'function') renderContextNav();
}

function renderHomeScreen(){
  if(typeof initAscension==='function') initAscension();
  if(typeof renderAscensionStatus==='function') renderAscensionStatus();
  const el = document.getElementById('home-screen-inner');
  if(!el) return;

  const ws = S.world || {};
  const firmwareDone = ws.firmwareComplete;
  const meshUnlocked = S.mesh?.unlocked;
  const dist = meshDistanceCurrent ? meshDistanceCurrent() : 0;
  const cred = S.cred || 0;
  const level = S.level || 1;

  // Status line
  const statusColor = meshUnlocked ? '#40c060' : '#aa6020';
  const statusText  = meshUnlocked
    ? `MESH ACCESS — ${S.mesh?.traversalUnlocked ? 'TRAVERSAL ENABLED' : 'NET 0:0 ACTIVE'}`
    : firmwareDone ? 'FIRMWARE LOADED — READY TO JACK IN'
    : 'FIRMWARE NOT LOADED — RUN TUTORIAL';

  updateEmailBadge();
  el.innerHTML = `
    <div style="font-family:'Orbitron',monospace;font-size:28px;color:#40ff80;letter-spacing:6px;margin-bottom:4px">MESH</div>
    <div style="font-size:8px;color:#2a5a3a;margin-bottom:24px;font-style:italic">"All the nets that ever were, are, or will be make up the Mesh"</div>

    <div style="font-size:8px;color:${statusColor};margin-bottom:20px;font-family:'Share Tech Mono',monospace;border:1px solid ${statusColor}33;padding:6px 12px;border-radius:3px">
      ${statusText}
    </div>

    <div style="display:flex;flex-direction:column;gap:8px;width:240px">

        <!-- Primary action: firmware / jack in -->
      ${!firmwareDone ? `
        <button class="ts-btn ts-primary" onclick="startFirmwareTutorial()">▶ LOAD FIRMWARE</button>
        <div style="font-size:7px;color:#2a4a2a;text-align:center">One-time tutorial — stored in your deck</div>
      ` : !meshUnlocked ? `
        <button class="ts-btn ts-primary" onclick="startFirmwareTutorial()">▶ RE-RUN FIRMWARE</button>
        <div style="font-size:7px;color:#2a4a2a;text-align:center">Firmware complete — mesh access pending</div>
      ` : `
        <button class="ts-btn ts-primary" onclick="jackInToMesh()">⬡ JACK IN TO MESH</button>
        ${S.mesh?.currentNet ? `<div style="font-size:7px;color:#3a6a3a;text-align:center;margin-top:-4px">Resume: net ${netKey(S.mesh.currentNet.x,S.mesh.currentNet.y)}</div>` : '<div style="font-size:7px;color:#2a5a3a;text-align:center;margin-top:-4px">Net 0:0 · Origin</div>'}
      `}

      <div style="height:1px;background:#1a2a1a;width:100%;margin:4px 0"></div>

      <!-- Email / communications -->
      <button class="ts-btn ts-secondary" onclick="showEmailScreen()" style="display:flex;align-items:center;gap:8px;justify-content:flex-start">
        <span style="font-size:14px">✉</span>
        <span>EMAIL</span>
        <span id="email-badge" style="display:none;background:#c04040;color:#fff;font-size:7px;padding:1px 5px;border-radius:8px;margin-left:auto">NEW</span>
      </button>

      <div style="height:1px;background:#1a2a1a;width:100%;margin:4px 0"></div>

      <!-- Gear / preparation -->
      <button class="ts-btn ts-secondary" onclick="showHomeTab('deck')" style="text-align:left">◈ DECK &amp; PROGRAMS</button>
      <button class="ts-btn ts-secondary" onclick="showHomeTab('market')" style="text-align:left">⊞ MARKET</button>
      <button class="ts-btn ts-secondary" onclick="showHomeTab('craft')" style="text-align:left">⚙ CRAFT</button>
      <button class="ts-btn ts-secondary" onclick="showHomeTab('ops')" style="text-align:left">◉ OPERATIONS</button>
    </div>

    <div style="margin-top:24px;display:flex;gap:20px;font-size:8px;color:#1a4a2a;font-family:'Share Tech Mono',monospace">
      <span>${cred.toLocaleString()}₵</span>
      <span>Lv ${level}</span>
      ${dist > 0 ? `<span style="color:${dist>=256?'#ff2020':dist>=16?'#ff8020':'#3a6a3a'}">MESH ${dist.toFixed(1)}</span>` : ''}
    </div>

    <div style="margin-top:8px;font-size:7px;color:#1a3a1a;font-family:'Share Tech Mono',monospace">
      INT ${S.integrity||0}/${(typeof maxInt==='function'?maxInt():10)}
      ${(S.permIntLoss||0) > 0 ? ` <span style="color:#c04040">-${S.permIntLoss} perm</span>` : ''}
    </div>
  `;
}

// ── HOME TABS ─────────────────────────────────────────────────────────────

function showHomeTab(name){
  const gameLayout = document.getElementById('game-layout');
  const homeEl = document.getElementById('home-screen');
  if(homeEl) homeEl.style.display = 'none';
  if(gameLayout) gameLayout.style.display = 'flex';
  if(!S.mesh?.currentNet){
    const runTab=document.getElementById('tab-run');
    if(runTab) runTab.style.display='none';
  }
  if(typeof renderContextNav === 'function') renderContextNav();
  if(typeof showTab === 'function') showTab(name);
}

function renderHomeBackButton(show){
  let btn = document.getElementById('home-back-btn');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'home-back-btn';
    btn.className = 'refresh-btn';
    btn.style.cssText = 'color:#40aaff;border-color:#1a3a6a;';
    btn.textContent = '⌂ HOME';
    btn.onclick = () => { renderHomeBackButton(false); showHomeScreen(); renderHomeScreen(); };
    const topbar = document.getElementById('topbar-btns');
    if(topbar) topbar.prepend(btn);
  }
  btn.style.display = show ? '' : 'none';
}

// ── FIRMWARE TUTORIAL ─────────────────────────────────────────────────────

function startFirmwareTutorial(){
  // Initialize tutorial state
  if(!S.world) S.world = mkWorldState();
  S.tutorialNet = buildTutorialNet ? buildTutorialNet() : null;
  S.inTutorial = true;
  S.tutorialNode = null;

  // Hide home, hide game layout, show tutorial screen
  const homeEl = document.getElementById('home-screen');
  const gameEl = document.getElementById('game-layout');
  const tutEl  = document.getElementById('tutorial-screen');
  if(homeEl) homeEl.style.display = 'none';
  if(gameEl) gameEl.style.display = 'none';
  if(tutEl)  tutEl.style.display  = 'flex';

  renderTutorialScreen();
}

function completeFirmware(){
  if(!S.world) S.world = mkWorldState();
  S.world.firmwareComplete = true;
  S.inTutorial = false;
  hideTutorialScreen();
  // Unlock mesh access
  if(!S.mesh) S.mesh = mkMeshState();
  S.mesh.unlocked = true;
  addLog('◈ FIRMWARE COMPLETE — Mesh access granted', 'lp');
  addLog('◈ Net 0:0 coordinates loaded. Ready to jack in.', 'li');
  showHomeScreen();
  renderHomeScreen();
  if(typeof autoSave === 'function') autoSave();
}

// ── JACK IN ───────────────────────────────────────────────────────────────

function jackInToMesh(){
  if(!S.mesh?.unlocked){
    addLog('Mesh not accessible — run firmware first', 'lw');
    return;
  }
  hideHomeScreen();
  // Default: enter net 0:0
  const targetX = S.mesh.currentNet?.x ?? 0;
  const targetY = S.mesh.currentNet?.y ?? 0;
  enterNet(targetX, targetY);
}

function enterNet(x, y){
  if(!S.mesh) S.mesh = mkMeshState();
  S.mesh.currentNet = {x, y};

  const ns = getNetState(x, y);
  const dist = meshDistance(x, y);
  const glitch = meshGlitchLevel(dist);

  // Generate companies on first visit
  if(!ns.companies){
    ns.companies = genNetCompanies(x, y, glitch);
    // Notify about faction presence in glitch zone
    if(dist >= 16 && dist < 64 && typeof factionSlotCount==='function'){
      const fSlots = ['corp','crim','anarch','neutral'].map(f=>({f,n:factionSlotCount(f,dist)})).filter(x=>x.n>0);
      const govIdxs = typeof getDistGovernments==='function' ? getDistGovernments(dist) : [];
      const govNames = govIdxs.map(i=>typeof getGovernmentName==='function'?getGovernmentName(i):'Government').join(' · ');
      if(dist >= 32){
        addLog(`◈ GLITCH ZONE — Government only. ${govNames}`,'lw');
      } else if(fSlots.length < 4){
        const fStr = fSlots.map(x=>`${x.f}(${x.n})`).join(' ');
        addLog(`◈ GLITCH ZONE dist ${dist.toFixed(0)} — ${fStr} + ${govNames}`,'lw');
      }
    }
  }

  // Generate node layout — regenerate if missing or from old version
  const LAYOUT_VERSION = 6;
  const _meshMem = typeof hasTrait==='function'&&hasTrait('mesh_memory');
  if(!ns.layout || (!_meshMem && ns.layoutVersion !== LAYOUT_VERSION)){
    ns.layout = generateNetLayout(x, y, dist);
    ns.layoutVersion = LAYOUT_VERSION;
  } else if(!_meshMem && ns.layoutVersion !== LAYOUT_VERSION){
    ns.layout = generateNetLayout(x, y, dist);
    ns.layoutVersion = LAYOUT_VERSION;
  }
  // Always strip ICE to only valid types for this mesh distance
  // Build valid set directly from BASE_ICE minMeshDist — don't rely on helper
  if(typeof BASE_ICE !== 'undefined'){
    const validICE = new Set(
      Object.entries(BASE_ICE)
        .filter(([,v]) => dist >= (v.minMeshDist !== undefined ? v.minMeshDist : 9999))
        .map(([k]) => k)
    );
    ns.layout.forEach(row => row.forEach(node => {
      if(node.ice && !validICE.has(node.ice)) node.ice = null;
    }));
  }

  // Do NOT start a run — show the net map for node selection
  S.running = false;
  S.combat  = null;

  addLog(`⬡ NET ${netKey(x,y)} — ${16}×${16} nodes`, 'li');
  if(glitch > 0) addLog(`⚡ Glitch level ${glitch} — mesh distance ${dist.toFixed(1)}`, 'lw');
  Object.entries(ns.companies).forEach(([fac, cos]) =>
    cos.forEach(co => addLog(`  [${fac.toUpperCase()}] ${co.name}`, 'li'))
  );

  // Show the net map tab
  const runTab = document.getElementById('tab-run');
  if(runTab) runTab.style.display = '';
  if(typeof showTab === 'function') showTab('run');
  renderNetView();
}

function isNodeAccessible(addr, ns){
  // Node 00 always accessible
  if(addr === '00') return true;
  const {col, row} = addrToColRow(addr);
  // Already completed — always accessible (free traversal)
  if(ns.completedNodes.includes(addr)) return true;
  // Check if any adjacent node (cardinal + diagonal) is completed
  // Cardinal directions only (no diagonal)
  const neighbors = [
    {col: col-1, row}, {col: col+1, row},
    {col, row: row-1}, {col, row: row+1},
  ];
  return neighbors.some(n => {
    if(n.col < 0 || n.col > 15 || n.row < 0 || n.row > 15) return false;
    const nAddr = nodeAddr(n.col, n.row);
    return ns.completedNodes.includes(nAddr);
  });
}

function renderNetView(){
  const ns = currentNetState();
  if(!ns) return;
  const dist = meshDistance(ns.x, ns.y);
  const glitch = meshGlitchLevel(dist);

  // Update left column label
  const label = document.getElementById('grid-section-label');
  if(label) label.textContent = `NET ${netKey(ns.x, ns.y)}`;
  const meta = document.getElementById('grid-section-meta');
  if(meta) meta.textContent = `${ns.completedNodes.length}/256 visited${glitch>0?' · GLITCH '+glitch:''}`;

  // Assign each node a faction color based on a seeded assignment
  // Each node belongs to one company/faction in the net
  const factionKeys = Object.keys(ns.companies||{});
  const facColors = {corp:'#6080c0',crim:'#c08040',anarch:'#c04040',neutral:'#60a060',gov:'#a0a040',ai:'#ff4080'};
  const netSeed = (ns.x * 2654435761 ^ ns.y * 2246822519) >>> 0;

  function nodeFaction(col, row){
    if(!factionKeys.length) return 'neutral';
    const s = ((netSeed ^ (col * 7919 + row * 1000003)) >>> 0) % factionKeys.length;
    return factionKeys[s];
  }

  // Build the 16×16 net map into the grid-scroll-main element
  const gridEl = document.getElementById('grid');
  if(!gridEl) return;
  gridEl.style.display = 'grid';
  gridEl.style.gridTemplateColumns = 'repeat(16, 40px)';
  gridEl.style.gap = '2px';
  gridEl.style.padding = '4px';
  gridEl.innerHTML = '';

  // Use a single generic node icon for all net-layer nodes
  // Colored by faction, dimmed if unvisited, checkmark if complete
  const NODE_ICON = '⬡'; // generic hex node icon for all net-layer cells
  const currentAddr = S.mesh?.lastNodeAddr || '00';

  const layout = ns.layout || [];
  for(let row = 0; row < 16; row++){
    for(let col = 0; col < 16; col++){
      const node = layout[row]?.[col] || {};
      const addr = nodeAddr(col, row);
      const done = ns.completedNodes.includes(addr);
      const fac  = nodeFaction(col, row);
      const col_ = facColors[fac] || '#60a060';
      const hasIce = !!node.ice;
      const iceAnalyst = typeof hasTrait==='function'&&hasTrait('ice_analyst');
      const isPlayerNode = addr === currentAddr;

      const div = document.createElement('div');
      const playerBorder = isPlayerNode ? '#40ff80' : (done ? col_ : '#0d1a0d');
      const playerBg     = isPlayerNode ? '#0a2010' : (done ? col_+'22' : '#060d10');
      const playerGlow   = isPlayerNode ? '0 0 10px #40ff8088' : (done ? '0 0 6px '+col_+'66' : 'none');
      div.style.cssText = `width:40px;height:40px;border-radius:3px;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:1px;cursor:pointer;
        border:1px solid ${playerBorder};
        background:${playerBg};
        box-shadow:${playerGlow};
        transition:border-color 0.12s,background 0.12s,box-shadow 0.12s;`;
      div.innerHTML = `
        <span style="font-size:${isPlayerNode?'16':'14'}px;color:${isPlayerNode?'#40ff80':done?col_:col_};opacity:${isPlayerNode||done?1:0.4};
          text-shadow:${isPlayerNode?'0 0 10px #40ff80':done?'0 0 8px '+col_:'none'}">${isPlayerNode?'◈':done?'✓':NODE_ICON}</span>
        <span style="font-size:5px;color:${isPlayerNode?'#40ff80':done?col_+'aa':'#1a3a1a'}">${addr}</span>
        ${hasIce&&!done&&!isPlayerNode?`<span style="font-size:5px;color:#c04040">⬡</span>`:''}`;
      const accessible = isNodeAccessible(addr, ns);
      if(accessible){
        div.onmouseenter = () => {
          div.style.borderColor = col_;
          div.style.background  = done ? col_+'33' : col_+'11';
          div.style.boxShadow   = `0 0 8px ${col_}88`;
        };
        div.onmouseleave = () => {
          div.style.borderColor = done ? col_ : '#0d1a0d';
          div.style.background  = done ? col_+'22' : '#060d10';
          div.style.boxShadow   = done ? `0 0 6px ${col_}66` : 'none';
        };
        div.onclick = () => selectNetNode(addr, node, fac);
        div.style.cursor = 'pointer';
      } else {
        // Inaccessible — locked appearance, no click
        div.style.opacity = '0.25';
        div.style.cursor = 'default';
      }
      gridEl.appendChild(div);
    }
  }
}


function selectNetNode(addr, node, fac){
  // Show node info + contract in the grid-section (left column)
  // "Enter Node" button appears below
  const ns = currentNetState();
  const done = ns?.completedNodes.includes(addr);
  const facColors = {corp:'#6080c0',crim:'#c08040',anarch:'#c04040',neutral:'#60a060',gov:'#a0a040'};
  const col_ = facColors[fac] || '#60a060';

  // Generate a contract for this node (deterministic by addr+net coords)
  const contract = genNodeContract(addr, ns, node);
  let loadout = {programs:[], warnings:[]}; // populated below if contract exists

  // Build preview HTML
  const summaryEl = document.getElementById('run-summary');
  if(!summaryEl) return;

  let html = `
    <div style="padding:10px;font-family:'Share Tech Mono',monospace;overflow-y:auto;height:100%">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <button onclick="closeNodePreview()"
          style="font-size:8px;font-family:'Share Tech Mono',monospace;background:transparent;
            border:1px solid #1a3a2a;color:#2a6a3a;cursor:pointer;padding:2px 7px;border-radius:2px"
          onmouseenter="this.style.color='#40c060';this.style.borderColor='#2a6a3a'"
          onmouseleave="this.style.color='#2a6a3a';this.style.borderColor='#1a3a2a'">
          ← NET
        </button>
        <span style="font-family:'Orbitron',monospace;font-size:10px;color:${col_}">NODE ${addr}</span>
        <span style="font-size:7px;color:#1a4a2a">${node?.nodeType||'UNKNOWN'}</span>
      </div>
      ${node?.ice?`<div style="font-size:7px;color:#c04040;margin-bottom:6px">⬡ ICE: ${node.ice}</div>`:''}
      ${node?.trap?`<div style="font-size:7px;color:#ffaa20;margin-bottom:6px">⚠ Trap detected</div>`:''}
      ${done?`<div style="font-size:8px;color:#40ff80;margin-bottom:8px">✓ Node completed — free traversal</div>`:''}
  `;

  if(contract && !done){
    // Compute suggested loadout for this contract
    const prevActive = S.active;
    S.active = [contract]; // temporarily set so computeSuggestedLoadout has a contract
    loadout = typeof computeSuggestedLoadout==='function' ? computeSuggestedLoadout(contract) : {programs:[],warnings:[]};
    S.active = prevActive;

    const progRows = loadout.programs.map(p => {
      const d = typeof pdef==='function' ? pdef(p.defId) : null;
      if(!d) return '';
      const memColor = '#40aaff';
      return `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;border-bottom:1px solid #0d1a0d">
        <span style="font-size:12px;color:#40c060;width:16px">${d.icon||'◈'}</span>
        <span style="font-size:8px;color:#40c060;flex:1">${d.name}</span>
        <span style="font-size:7px;color:${memColor}">${d.mem||0}MB</span>
        <span style="font-size:6px;color:#1a4a2a;max-width:80px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.reason}">${p.reason.replace(/^(Required|Recommended|Breaker|Utility): /,'')}</span>
      </div>`;
    }).filter(Boolean).join('');

    const totalMem = loadout.programs.reduce((a,p)=>{const d=typeof pdef==='function'?pdef(p.defId):null;return a+(d?.mem||0);},0);
    const ramMax_ = typeof ramMax==='function' ? ramMax() : 8;
    const ramColor = totalMem > ramMax_ ? '#ff4040' : totalMem > ramMax_*0.8 ? '#ffaa20' : '#40aaff';

    const warnRows = loadout.warnings.filter(w=>w.startsWith('⚠')).map(w =>
      `<div style="font-size:7px;color:#c04040;padding:1px 0">${w}</div>`
    ).join('');

    html += `
      <div style="border:1px solid ${col_}44;border-radius:4px;padding:8px;margin-bottom:8px;background:#060d10">
        <div style="font-size:8px;color:${col_};margin-bottom:4px">${contract.name}</div>
        <div style="font-size:7px;color:#2a5a3a;margin-bottom:6px">
          ${contract.objectives?.map(o=>`▸ ${o.desc}`).join('<br>')||''}
        </div>
        <div style="display:flex;gap:10px;font-size:7px;color:#3a6a3a">
          <span>₵ ${contract.reward?.cred||0}</span>
          <span>⏱ ${contract.duration?Math.floor(contract.duration/1000)+'s':'—'}</span>
          <span>${['','◈','◈◈','◈◈◈','☠'][contract.diff]||'◈'} Diff ${contract.diff}</span>
        </div>
      </div>
      ${progRows ? `
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:7px;color:#1a4a2a;margin-bottom:4px">
          <span style="font-family:'Orbitron',monospace;letter-spacing:1px">SUGGESTED LOADOUT</span>
          <span style="color:${ramColor}">${totalMem}/${ramMax_} MB</span>
        </div>
        ${progRows}
        ${warnRows}
        ${progRows ? `<button id="apply-loadout-btn"
          style="width:100%;margin-top:6px;padding:5px;font-size:8px;font-family:'Share Tech Mono',monospace;
            background:#0a1a10;border:1px solid #2a6a3a;color:#40c060;cursor:pointer;border-radius:3px;
            transition:all 0.15s"
          onmouseenter="this.style.background='#0f2a18';this.style.borderColor='#40c060'"
          onmouseleave="this.style.background='#0a1a10';this.style.borderColor='#2a6a3a'">
          ⚡ Apply Loadout
        </button>` : ''}
      </div>` : `<div style="font-size:7px;color:#c04040;margin-bottom:8px">${warnRows||'⚠ No suitable programs in inventory'}</div>`}
      <button onclick="enterNode('${addr}')" style="width:100%;padding:8px;font-family:'Orbitron',monospace;
        font-size:10px;letter-spacing:1px;background:#0a1a0e;border:1px solid ${col_};
        color:${col_};cursor:pointer;border-radius:3px;transition:all 0.2s"
        onmouseenter="this.style.background='#0f2a18'" onmouseleave="this.style.background='#0a1a0e'">
        ▶ ENTER NODE
      </button>`;
  } else if(done){
    html += `<button onclick="enterNode('${addr}')" style="width:100%;padding:8px;font-family:'Orbitron',monospace;
      font-size:10px;letter-spacing:1px;background:#0a1208;border:1px solid #2a6a2a;
      color:#40c060;cursor:pointer;border-radius:3px">
      ▶ TRAVERSE NODE
    </button>`;
  }

  html += `</div>`;
  summaryEl.innerHTML = html;
  summaryEl.style.display = 'block';

  // Wire apply loadout button safely (avoids JSON in onclick attr)
  const applyBtn = document.getElementById('apply-loadout-btn');
  if(applyBtn && loadout?.programs?.length){
    applyBtn.onclick = () => applyNetLoadout(loadout.programs);
    updateApplyBtn(loadout.programs); // set initial state
  }
}

function genNodeContract(addr, ns, node){
  // Generate a deterministic contract for this node based on addr+net coords
  if(!ns || !node) return null;
  const seed = ((ns.x * 7919 + ns.y * 1000003 + parseInt(addr,16) * 97) >>> 0);
  const factionKeys = Object.keys(ns.companies||{});
  if(!factionKeys.length) return null;

  // Pick a company from the net — this IS the subfaction for rep purposes
  const facIdx = seed % factionKeys.length;
  const fac = factionKeys[facIdx];
  const companies = ns.companies[fac] || [];
  const company = companies[seed % companies.length] || companies[0];
  if(!company) return null;

  const dist_ = meshDistance(ns.x,ns.y);
  const tier = Math.max(1, Math.min(TIER_GRIDS.length, Math.floor(dist_/4)+1));

  // Build a contract using this company as the source
  // Rep gain goes to: company (ns.rep[company.key]) and parent faction (S.rep[fac])
  const ct = genNetContract(S.level||1, tier, fac, company);
  return ct;
}

// Generate a contract for a specific net company
function genNetContract(level, tier, fac, company){
  if(!company) return null;
  // Map faction to flavor/verbs
  const flavorMap = {corp:'CORPORATE',crim:'CRIMINAL',anarch:'ANARCHIST',neutral:'NEUTRAL',gov:'GOVERNMENT',ai:'AI_CONTACT'};
  const flavor = flavorMap[fac] || 'NEUTRAL';

  // Pick verbs based on faction
  const verbsByFac = {
    corp:    {basic:['obtain','access','delete'],advanced:['exfil','access','modify'],elite:['exfil','backdoor','modify']},
    crim:    {basic:['obtain','delete','exfil'],advanced:['exfil','collect_delete','backdoor'],elite:['collect_delete','exfil','backdoor']},
    anarch:  {basic:['delete','destroy','activate'],advanced:['destroy','backdoor','delete'],elite:['backdoor','destroy','exfil']},
    neutral: {basic:['obtain','activate','archive'],advanced:['obtain','exfil','archive'],elite:['exfil','access','archive']},
    gov:     {basic:['obtain','access','surveil'],advanced:['exfil','trace_back','route'],elite:['backdoor','trace_back','surveil']},
    ai:      {basic:['obtain','harvest','clone'],advanced:['harvest','exfil','route'],elite:['burn','clone','harvest']},
  };
  const tierKey = tier<=2?'basic':tier<=4?'advanced':'elite';
  const verbs = (verbsByFac[fac]||verbsByFac.neutral)[tierKey];
  const action = verbs[Math.floor(Math.random()*verbs.length)];

  // Use genContract with the company key as subfac identifier
  // Pass company object with govIndex for gov rep routing
  const _co = company.govIndex!=null ? company : {...company};
  const ct = typeof genContract==='function'
    ? genContract(level, tier, flavor, null, _co)
    : null;
  if(!ct) return null;

  // Ensure company fields are on the contract for rep tracking
  ct.subfac     = company.key;
  ct.subfacName = company.name;
  ct.companyKey = company.key;
  ct.companyName = company.name;
  ct.faction    = fac;
  return ct;
}

function enterNode(addr){
  const ns = currentNetState();
  if(!ns) return;
  const {col, row} = addrToColRow(addr);
  const node = ns.layout?.[row]?.[col];
  if(!node){ addLog(`Node ${addr} not found`,'lw'); return; }

  // Store which node we're entering so finishRun can mark it complete
  S.mesh.lastNodeAddr = addr;
  S.mesh.activeNodeAddr = addr;

  // Hide the summary panel
  const summaryEl = document.getElementById('run-summary');
  if(summaryEl) summaryEl.style.display = 'none';

  // Build the run grid for this node using the existing engine
  // Node interior uses tier-appropriate sizing (not 16x16 — that's the net)
  const dist_ = meshDistance(ns.x,ns.y);
  const tier = Math.max(1, Math.min(TIER_GRIDS.length, Math.floor(dist_/4)+1));
  const [nrows, ncols] = TIER_GRIDS[Math.min(tier,TIER_GRIDS.length)-1];
  S.rows = nrows; S.cols = ncols;

  // Use pre-set contract (from autorun) or generate one now
  const contract = (S.active?.length && S.active[0]?.companyKey) ? S.active[0] : genNodeContract(addr, ns, node);
  S.active = contract ? [contract] : [];
  if(contract){ contract.taken=true; S.contractTimers[contract.id]={ticksLeft:Math.floor(contract.duration/100),totalTicks:Math.floor(contract.duration/100)}; }

  if(typeof applyTraitCpuCarryover==='function') applyTraitCpuCarryover();
  addLog(`⬡ Entering node ${addr} — ${nrows}×${ncols} — ${node.nodeType}`,'li');
  // Update grid title bar: net coords · node addr
  const gl_ = document.getElementById('grid-section-label');
  if(gl_){
    const nk_ = typeof netKey==='function' ? netKey(ns.x, ns.y) : '?';
    gl_.textContent = `${nk_}  ·  NODE ${addr}`;
  }

  // Use existing launchRun internals to build grid and start run
  buildGrid();
  S.player = {r:0,c:0,stalled:false,waitTicks:0};
  S.alert=0; S.alertPressure=0; S.integrity=maxInt(); S.trace=S.traceCarry||0;
  S.combat=null; S.patrols=[]; S.hunters=[]; S.actionQueue=[]; S.processingSlots=1;
  S.storage=[]; S._disabledProgs=[]; S._tarPitStacks=0; S._cpuBoost=0;
  S._cpuVisits=0; S._ioBoost=0; S._leechDrain=0; S._overclockUsed=false;
  S._anarchBonus=0; S._repChanges=[]; S._peakPressure=0;
  S._nodesVisitedRun=0; S._iceBreachedRun=0; S._huntersKilledThisRun=0; S._copsSilencedThisRun=0;
  S.contractTimers = contract ? {[contract.id]:{ticksLeft:Math.floor(contract.duration/100),totalTicks:Math.floor(contract.duration/100)}} : {};
  S.mapped=false;
  if(typeof applyMfrPerk==='function') applyMfrPerk();
  if(typeof autoMaintenance==='function') autoMaintenance();
  if(typeof isLegend==='function'){
    if(isLegend('anarch')) S._anarchBonus=2;
    else if(typeof isElite==='function'&&isElite('anarch')) S._anarchBonus=1;
    if(isLegend('corp')) S.trace=0;
    S._crimLegend=isLegend('crim'); S._anarchLegend=isLegend('anarch'); S._neutralLegend=isLegend('neutral');
  }
  // Snapshot installed programs for topbar RAM display during run
  S.runSnapshot={installed:[...S.installed],inventory:S.inventory.map(x=>({...x}))};
  S.running=true;
  S.paused=false;
  if(S.speed===0) S.speed=1;

  if(typeof renderAll==='function') renderAll();
  if(typeof updateLayoutForTier==='function') updateLayoutForTier();
}


function closeNodePreview(){
  const summaryEl = document.getElementById('run-summary');
  if(summaryEl) summaryEl.style.display = 'none';
}

function jackOutFromNet(){
  S.running = false;
  S.mesh.currentNet = null;
  const runTab = document.getElementById('tab-run');
  if(runTab) runTab.style.display = 'none';
  const netTab2 = document.getElementById('tab-net');
  if(netTab2) netTab2.style.display = 'none';
  showHomeScreen();
  renderHomeScreen();
  addLog('⏏ Disconnected from net', 'li');
}


// ── EMAIL SCREEN (stub — quest chains TBD) ───────────────────────────────

function showEmailScreen(){
  const homeEl = document.getElementById('home-screen');
  const emailEl = document.getElementById('email-screen');
  if(homeEl) homeEl.style.display = 'none';
  if(emailEl){ emailEl.style.display = 'flex'; renderEmailScreen(); return; }

  // Build email screen if it doesn't exist
  const el = document.createElement('div');
  el.id = 'email-screen';
  el.style.cssText = 'position:fixed;inset:0;z-index:5500;background:#020608;flex-direction:column;align-items:center;justify-content:flex-start;padding:32px 24px;overflow-y:auto;display:flex;';
  updateEmailBadge();
  el.innerHTML = `
    <div style="width:100%;max-width:560px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-family:'Orbitron',monospace;font-size:14px;color:#40aaff;letter-spacing:3px">✉ EMAIL</div>
        <button class="ts-btn ts-secondary" style="font-size:9px;padding:6px 12px" onclick="hideEmailScreen()">← BACK</button>
      </div>
      <div id="email-list"></div>
    </div>`;
  document.body.appendChild(el);
  renderEmailScreen();
}

function hideEmailScreen(){
  const el = document.getElementById('email-screen');
  if(el) el.style.display = 'none';
  showHomeScreen();
  renderHomeScreen();
}

function renderEmailScreen(){
  const el = document.getElementById('email-list');
  if(!el) return;
  const emails = S.world?.emails || [];
  if(!emails.length){
    updateEmailBadge();
  el.innerHTML = `<div style="color:#1a4a2a;font-size:9px;font-family:'Share Tech Mono',monospace;padding:20px;text-align:center;border:1px solid #1a2a1a;border-radius:4px;">
      <div style="font-size:24px;margin-bottom:8px">◎</div>
      No messages.<br>
      <span style="font-size:8px;color:#1a3a1a">Contracts and quest chains will appear here.</span>
    </div>`;
    return;
  }
  el.innerHTML = emails.map((e,i) => `
    <div style="border:1px solid ${e.read?'#1a2a1a':'#1a4a6a'};border-radius:4px;padding:10px 14px;margin-bottom:6px;background:${e.read?'#080d10':'#0a1218'};cursor:pointer"
         onclick="openEmail(${i})">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <span style="font-size:9px;color:${e.read?'#3a6a3a':'#40aaff'};font-family:'Share Tech Mono',monospace">${e.from||'Unknown'}</span>
        <span style="font-size:7px;color:#1a3a1a">${e.date||''}</span>
      </div>
      <div style="font-size:9px;color:${e.read?'#2a5a2a':'#60c0ff'};margin-top:3px">${e.subject||'(no subject)'}</div>
      ${!e.read?'<div style="font-size:7px;color:#1a5a8a;margin-top:2px">● unread</div>':''}
    </div>`).join('');
}

function openEmail(idx){
  const emails = S.world?.emails || [];
  const e = emails[idx]; if(!e) return;
  e.read = true;
  updateEmailBadge();
  if(typeof autoSave==='function') autoSave();

  // Render email body inline — replace email-list contents
  const el = document.getElementById('email-list');
  if(!el) return;

  const questAcceptBtn = e.questChainId && e.stepId
    ? `<div style="margin-top:14px"><button class="buy-btn" onclick="acceptQuestStep('${e.questChainId}','${e.stepId}');showEmailListView()">◈ Accept Quest Objective</button></div>`
    : e.contract
      ? `<div style="margin-top:14px"><button class="buy-btn" onclick="acceptEmailContract(${idx});showEmailListView()">Accept Contract</button></div>`
      : '';

  el.innerHTML = `
    <div style="margin-bottom:12px">
      <button onclick="showEmailListView()" style="background:none;border:1px solid #1a3a1a;border-radius:3px;color:#2a6a3a;font-family:Share Tech Mono,monospace;font-size:8px;padding:4px 10px;cursor:pointer">← Back</button>
    </div>
    <div style="background:#080d10;border:1px solid #1a3a2a;border-radius:4px;padding:16px">
      <div style="font-family:'Orbitron',monospace;font-size:11px;color:#40aaff;margin-bottom:8px">${e.subject||'(no subject)'}</div>
      <div style="font-size:8px;color:#2a5a4a;margin-bottom:14px;border-bottom:1px solid #0d2a1a;padding-bottom:8px">
        From: <span style="color:#40aaff">${e.from||'Unknown'}</span>&nbsp;&nbsp;·&nbsp;&nbsp;${e.date||''}
      </div>
      <div style="font-size:9px;color:#3a7a4a;line-height:1.9;white-space:pre-wrap;font-family:'Share Tech Mono',monospace">${e.body||''}</div>
      ${questAcceptBtn}
    </div>`;
}

function showEmailListView(){
  renderEmailScreen();
}

function acceptEmailContract(idx){
  const emails = S.world?.emails || [];
  const e = emails[idx]; if(!e || !e.contract) return;
  // Mark email contract as accepted — wire into contract board when net architecture is ready
  e.accepted = true;
  e.read = true;
  closeModal();
  addLog(`◈ Contract accepted: ${e.subject||'Email contract'}`, 'li');
  if(typeof autoSave === 'function') autoSave();
  renderEmailScreen();
  updateEmailBadge();
}

function updateEmailBadge(){
  const badge = document.getElementById('email-badge');
  if(!badge) return;
  const unread = (S.world?.emails||[]).filter(e=>!e.read).length;
  badge.style.display = unread > 0 ? '' : 'none';
  badge.textContent = unread > 9 ? '9+' : String(unread);
}

// ── NET MAP RENDERING (stub — full design TBD) ────────────────────────────

function renderNetMap(){
  const ns = currentNetState ? currentNetState() : null;
  const el = document.getElementById('net-tab-grid');
  const lbl = document.getElementById('net-tab-label');
  if(!el) return;
  if(!ns){ el.innerHTML='<div style="font-size:8px;color:#1a3a1a;padding:8px">No active net</div>'; return; }

  const dist = meshDistance(ns.x, ns.y);
  const glitch = meshGlitchLevel(dist);
  const factionKeys = Object.keys(ns.companies||{});
  const facColors = {corp:'#6080c0',crim:'#c08040',anarch:'#c04040',neutral:'#60a060',gov:'#a0a040',ai:'#ff4080'};
  const netSeed = (ns.x * 2654435761 ^ ns.y * 2246822519) >>> 0;
  const iceAnalyst = typeof hasTrait==='function'&&hasTrait('ice_analyst');

  function nodeFac(col,row){
    if(!factionKeys.length) return 'neutral';
    return factionKeys[((netSeed^(col*7919+row*1000003))>>>0)%factionKeys.length];
  }

  if(lbl) lbl.textContent = `NET ${netKey(ns.x,ns.y)} · ${ns.completedNodes.length}/256${glitch>0?' · GLITCH '+glitch:''}`;

  // Compact 16×16 grid — smaller cells than the run view
  const CELL = 18; // px per cell
  el.style.cssText=`display:grid;grid-template-columns:repeat(16,${CELL}px);gap:1px;padding:4px;overflow:auto`;
  el.innerHTML='';

  const layout = ns.layout || [];
  const currentAddr = S.mesh?.lastNodeAddr||S.mesh?.activeNodeAddr||'00';

  for(let row=0;row<16;row++) for(let col=0;col<16;col++){
    const node = layout[row]?.[col] || {};
    const addr = nodeAddr(col,row);
    const done = ns.completedNodes.includes(addr);
    const accessible = typeof isNodeAccessible==='function'?isNodeAccessible(addr,ns):done||addr==='00';
    const isCurrent = addr===currentAddr && S.running;
    const fac = nodeFac(col,row);
    const fc = facColors[fac]||'#60a060';
    const nt = node.nodeType||'EMPTY';
    const ndef = typeof NODE_DEF!=='undefined'?NODE_DEF[nt]:null;
    const icon = ndef?.icon||'·';
    const hasIce = !!node.ice;

    const bg = isCurrent?'#0a2010':done?fc+'22':'#060d08';
    const border = isCurrent?'#40ff80':done?fc:accessible?'#1a3a1a':'#0d1a0d';
    const fgColor = isCurrent?'#40ff80':done?fc:accessible?fc+'88':'#1a2a1a';

    const div=document.createElement('div');
    div.style.cssText=`width:${CELL}px;height:${CELL}px;background:${bg};border:1px solid ${border};
      border-radius:1px;display:flex;flex-direction:column;align-items:center;justify-content:center;
      cursor:${accessible?'pointer':'default'};opacity:${accessible||done?1:0.4};position:relative`;
    div.title=`${addr} ${nt}${hasIce?' ['+node.ice+']':''}${done?' ✓':''}`;

    // Icon
    div.innerHTML=`<span style="font-size:${isCurrent?8:7}px;color:${fgColor};line-height:1">${isCurrent?'◈':done?'✓':accessible?icon:'·'}</span>`;

    // ICE indicator
    if(hasIce&&!done){
      const badge=document.createElement('span');
      badge.style.cssText=`position:absolute;top:0;right:0;font-size:4px;color:#c04040;line-height:1`;
      badge.textContent=iceAnalyst?(typeof BASE_ICE!=='undefined'?BASE_ICE[node.ice]?.label?.slice(0,3)||'⬡':'⬡'):'⬡';
      div.appendChild(badge);
    }
    // Node type indicator for interesting nodes
    if(!done&&accessible&&!['EMPTY','ENTRY'].includes(nt)){
      const badge=document.createElement('span');
      badge.style.cssText=`position:absolute;bottom:0;left:0;font-size:4px;color:${fgColor};line-height:1`;
      badge.textContent=ndef?.label?.slice(0,3)||nt.slice(0,3);
      div.appendChild(badge);
    }

    if(accessible){
      div.onmouseenter=()=>{ div.style.background=done?fc+'44':fc+'11'; div.style.borderColor=fc; };
      div.onmouseleave=()=>{ div.style.background=bg; div.style.borderColor=border; };
      if(!S.running||done) div.onclick=()=>{ if(typeof selectNetNode==='function') selectNetNode(addr,node,fac); };
    }
    el.appendChild(div);
  }
}

// ── TUTORIAL RENDER ───────────────────────────────────────────────────────

function renderTutorialScreen(){
  // Renders the 3×3 firmware tutorial grid
  const el = document.getElementById('tutorial-grid');
  if(!el || !S.tutorialNet) return;

  el.innerHTML = '';
  el.style.display = 'grid';
  el.style.gridTemplateColumns = 'repeat(3, 80px)';
  el.style.gap = '4px';

  for(let row = 0; row < 3; row++){
    for(let col = 0; col < 3; col++){
      const node = S.tutorialNet[row]?.[col];
      if(!node) continue;
      const nt = NODE_DEF[node.nodeType] || NODE_DEF.EMPTY;
      const done = node.visited;
      const isCurrent = S.tutorialNode?.addr === node.addr;

      const div = document.createElement('div');
      div.style.cssText = `width:80px;height:80px;border-radius:4px;border:1px solid ${done?'#2a6a2a':isCurrent?'#40aaff':'#1a2a1a'};
        background:${done?'#0a1a0a':isCurrent?'#0a1a2a':'#080d10'};
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        gap:2px;cursor:pointer;transition:all 0.2s;`;
      div.innerHTML = `
        <span style="font-size:20px;color:${done?'#40ff80':isCurrent?'#40aaff':nt.color};opacity:${done?1:0.6}">${done?'✓':nt.icon}</span>
        <span style="font-size:7px;color:${done?'#40ff80':isCurrent?'#40aaff':'#2a5a2a'};text-align:center;font-family:'Share Tech Mono',monospace">${node.conceptTitle||nt.label}</span>
        <span style="font-size:6px;color:#1a3a1a">${node.addr}</span>
      `;
      if(!done) div.onclick = () => enterTutorialNode(node);
      el.appendChild(div);
    }
  }
}

function enterTutorialNode(node){
  S.tutorialNode = node;
  // Show concept intro, then launch a simplified run for that node
  const conceptEl = document.getElementById('tutorial-concept');
  if(conceptEl){
    conceptEl.innerHTML = `
      <div style="font-size:11px;color:#40aaff;margin-bottom:8px;font-family:'Orbitron',monospace;letter-spacing:1px">${node.conceptTitle}</div>
      <div style="font-size:8px;color:#3a6a3a;line-height:1.8;text-align:left;max-height:300px;overflow-y:auto;padding-right:4px">${node.conceptDesc}</div>
      <button class="ts-btn ts-primary" style="margin-top:14px;font-size:10px" onclick="completeTutorialNode('${node.addr}')">✓ UNDERSTOOD</button>
    `;
    conceptEl.style.display = 'block';
  }
}

function completeTutorialNode(addr){
  if(!S.tutorialNet) return;
  // Mark node visited
  for(const row of S.tutorialNet){
    for(const n of row){
      if(n.addr === addr) n.visited = true;
    }
  }
  // Hide concept panel
  const conceptEl = document.getElementById('tutorial-concept');
  if(conceptEl) conceptEl.style.display = 'none';
  S.tutorialNode = null;

  // Check if all done
  const allDone = S.tutorialNet.every(row => row.every(n => n.visited));
  if(allDone){
    completeFirmware();
  } else {
    renderTutorialScreen();
  }
}
