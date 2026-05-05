
// ── UNIQUE ITEMS ─────────────────────────────────────────────────────────

const UNIQUE_ITEMS = {
  signal_fragment: {
    id: 'signal_fragment',
    name: 'Signal Fragment',
    icon: '◈',
    color: '#40aaff',
    desc: 'A dormant process extracted from net 0:0. Origin: pre-Blackout. Status: waiting.',
    effect: 'passive',
    // +1 to all trace resist checks — the fragment masks your signal
    bonus: { traceResistBonus: 5 },
  },
};

function grantUniqueItem(itemId){
  const def = UNIQUE_ITEMS[itemId];
  if(!def) return;
  if(!S.uniqueItems) S.uniqueItems = [];
  if(S.uniqueItems.some(u=>u.id===itemId)) return; // no duplicates
  S.uniqueItems.push({ id: itemId, acquiredAt: Date.now(), meshDist: typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0 });
  if(!S.loreLog) S.loreLog=[];
  S.loreLog.unshift({
    id: 'item_'+itemId, title: '★ UNIQUE ACQUIRED: '+def.name,
    flavor: [def.desc, 'Effect: '+def.bonus ? Object.entries(def.bonus).map(([k,v])=>`${k}: +${v}`).join(', ') : 'Passive'],
    mechanics: [], footer: 'Unique items persist permanently.', ts: Date.now(), isItem: true,
  });
  const storyTab=document.getElementById('tab-story');
  if(storyTab){ storyTab.style.color='#40aaff'; setTimeout(()=>{storyTab.style.color='';},4000); }
  addLog(`★ Unique acquired: ${def.name}`,'lp');
  if(typeof autoSave==='function') autoSave();
}

function uniqueItemBonus(bonusKey){
  if(!S.uniqueItems?.length) return 0;
  return S.uniqueItems.reduce((total, u)=>{
    const def = UNIQUE_ITEMS[u.id];
    return total + (def?.bonus?.[bonusKey] || 0);
  }, 0);
}

// MESH — quests.js
// Quest chains, email delivery, autorun overrides
// =================================================

// ── QUEST CHAIN DEFINITIONS ──────────────────────────────────────────────

const QUEST_CHAINS = [

  // ── CHAIN 1: GHOST SIGNAL ──────────────────────────────────────────────
  // A neutral fixer picks up a pre-Blackout transmission fragment.
  // 6 steps across clean and glitch mesh.
  {
    id: 'ghost_signal',
    title: 'Ghost Signal',
    faction: 'neutral',
    triggerCondition: (S) => S.mesh?.traversalUnlocked && !hasCompletedChain('ghost_signal'),
    steps: [
      {
        id: 'gs_1',
        emailId: 'ghost_signal_intro',
        type: 'run_contracts',
        desc: 'Run 3 contracts for any Neutral company to establish cover identity',
        target: { faction: 'neutral', count: 3 },
        autorunOverride: { targetFaction: 'neutral', blockFF: false },
      },
      {
        id: 'gs_2',
        emailId: 'ghost_signal_2',
        type: 'reach_coords',
        desc: 'Navigate to the signal origin — net region near dist 8',
        target: { minDist: 6, maxDist: 12 },
        autorunOverride: { targetDist: { min: 6, max: 12 }, blockFF: false },
      },
      {
        id: 'gs_3',
        emailId: 'ghost_signal_3',
        type: 'find_lore',
        desc: 'Scan 3 datastores in the signal region — the fragment is buried in the noise',
        target: { minDist: 6, maxDist: 12, nodeType: 'DATASTORE', count: 3 },
        autorunOverride: { targetDist: { min: 6, max: 12 }, priorityNodeType: 'DATASTORE', blockFF: true },
      },
      {
        id: 'gs_4',
        emailId: 'ghost_signal_4',
        type: 'rep_faction',
        desc: 'Build Neutral faction rep to 500 (Trusted) — the contact needs to know you\'re reliable',
        target: { faction: 'neutral', repRequired: 500 },
        autorunOverride: { targetFaction: 'neutral', blockFF: false },
      },
      {
        id: 'gs_5',
        emailId: 'ghost_signal_5',
        type: 'reach_coords',
        desc: 'Follow the signal deeper — reach the glitch zone (dist 16+)',
        target: { minDist: 16, maxDist: 32 },
        autorunOverride: { targetDist: { min: 16, max: 32 }, blockFF: false },
      },
      {
        id: 'gs_6',
        emailId: 'ghost_signal_6',
        type: 'clear_net',
        desc: 'Clear a net in the signal zone — the fragment is in the FF node',
        target: { minDist: 16, maxDist: 32 },
        autorunOverride: { targetDist: { min: 16, max: 32 }, blockFF: false },
        reward: { cred: 5000, lore: 'ghost_signal_lore', item: 'signal_fragment' },
      },
    ],
  },

  // ── CHAIN 2: CORPORATE EXTRACTION ─────────────────────────────────────
  // A corp fixer wants data pulled from a rival's net.
  // 5 steps — build rep, infiltrate, exfil, cover tracks.
  {
    id: 'corp_extraction',
    title: 'Corporate Extraction',
    faction: 'corp',
    triggerCondition: (S) => {
      const clearedNets = (S.mesh?.visitedNets||[]).filter(ns=>ns.completedNodes?.includes('FF')).length;
      return clearedNets >= 3 && !hasCompletedChain('corp_extraction');
    },
    steps: [
      {
        id: 'ce_1',
        emailId: 'corp_extraction_intro',
        type: 'rep_faction',
        desc: 'Prove yourself — reach Known rep (100) with Corp faction',
        target: { faction: 'corp', repRequired: 100 },
        autorunOverride: { targetFaction: 'corp', blockFF: false },
      },
      {
        id: 'ce_2',
        emailId: 'corp_extraction_2',
        type: 'run_contracts',
        desc: 'Run 5 Corp contracts to learn their security patterns',
        target: { faction: 'corp', count: 5 },
        autorunOverride: { targetFaction: 'corp', blockFF: false },
      },
      {
        id: 'ce_3',
        emailId: 'corp_extraction_3',
        type: 'reach_coords',
        desc: 'Reach the target region — the rival\'s nets cluster around dist 12-20',
        target: { minDist: 12, maxDist: 20 },
        autorunOverride: { targetDist: { min: 12, max: 20 }, blockFF: false },
      },
      {
        id: 'ce_4',
        emailId: 'corp_extraction_4',
        type: 'find_item',
        desc: 'Breach a VAULT node in the region — the data package is there',
        target: { minDist: 12, maxDist: 20, nodeType: 'VAULT', count: 1 },
        autorunOverride: { targetDist: { min: 12, max: 20 }, priorityNodeType: 'VAULT', blockFF: true },
      },
      {
        id: 'ce_5',
        emailId: 'corp_extraction_5',
        type: 'run_contracts',
        desc: 'Run 3 more Corp contracts in the region to mask the breach in the logs',
        target: { faction: 'corp', count: 3, minDist: 12, maxDist: 20 },
        autorunOverride: { targetFaction: 'corp', targetDist: { min: 12, max: 20 }, blockFF: false },
        reward: { cred: 12000, lore: 'corp_extraction_lore', repBonus: { faction: 'corp', amount: 300 } },
      },
    ],
  },

  // ── CHAIN 3: ANARCHIST UNDERGROUND ─────────────────────────────────────
  // An anarch collective needs a runner who doesn't ask questions.
  // 7 steps — longest chain, reaches deep mesh.
  {
    id: 'anarch_underground',
    title: 'Anarchist Underground',
    faction: 'anarch',
    triggerCondition: (S) => {
      const clearedNets = (S.mesh?.visitedNets||[]).filter(ns=>ns.completedNodes?.includes('FF')).length;
      return clearedNets >= 8 && !hasCompletedChain('anarch_underground');
    },
    steps: [
      {
        id: 'au_1',
        emailId: 'anarch_underground_intro',
        type: 'run_contracts',
        desc: 'Complete 3 Anarch contracts — they need to see how you handle pressure',
        target: { faction: 'anarch', count: 3 },
        autorunOverride: { targetFaction: 'anarch', blockFF: false },
      },
      {
        id: 'au_2',
        emailId: 'anarch_underground_2',
        type: 'rep_faction',
        desc: 'Earn Trusted rep (500) with Anarch — they don\'t work with unknowns',
        target: { faction: 'anarch', repRequired: 500 },
        autorunOverride: { targetFaction: 'anarch', blockFF: false },
      },
      {
        id: 'au_3',
        emailId: 'anarch_underground_3',
        type: 'reach_coords',
        desc: 'Move into glitch territory (dist 24+) — the cell operates in the static',
        target: { minDist: 24, maxDist: 48 },
        autorunOverride: { targetDist: { min: 24, max: 48 }, blockFF: false },
      },
      {
        id: 'au_4',
        emailId: 'anarch_underground_4',
        type: 'find_lore',
        desc: 'Find the hidden cache — scan 4 datastores in the deep glitch region',
        target: { minDist: 24, maxDist: 48, nodeType: 'DATASTORE', count: 4 },
        autorunOverride: { targetDist: { min: 24, max: 48 }, priorityNodeType: 'DATASTORE', blockFF: true },
      },
      {
        id: 'au_5',
        emailId: 'anarch_underground_5',
        type: 'run_contracts',
        desc: 'Hit Corp nets in the region — the cell needs leverage over Hexfield',
        target: { faction: 'corp', count: 5, minDist: 24, maxDist: 48 },
        autorunOverride: { targetFaction: 'corp', targetDist: { min: 24, max: 48 }, blockFF: false },
      },
      {
        id: 'au_6',
        emailId: 'anarch_underground_6',
        type: 'find_item',
        desc: 'Breach the TERMINAL node the cell identified — plant the backdoor',
        target: { minDist: 24, maxDist: 48, nodeType: 'TERMINAL', count: 1 },
        autorunOverride: { targetDist: { min: 24, max: 48 }, priorityNodeType: 'TERMINAL', blockFF: true },
      },
      {
        id: 'au_7',
        emailId: 'anarch_underground_7',
        type: 'clear_net',
        desc: 'Clear a net at dist 32+ — the cell needs the exit node as a relay point',
        target: { minDist: 32, maxDist: 64 },
        autorunOverride: { targetDist: { min: 32, max: 64 }, blockFF: false },
        reward: { cred: 25000, lore: 'anarch_underground_lore', repBonus: { faction: 'anarch', amount: 800 } },
      },
    ],
  },
];

// ── EMAIL TEMPLATES ──────────────────────────────────────────────────────

const QUEST_EMAILS = {

  // Ghost Signal chain
  ghost_signal_intro: {
    from: 'MERIDIAN // fixer@null.mesh',
    subject: 'Signal anomaly — interested?',
    body: `Weaver.

I don't use this channel for routine work. This isn't routine.

Three weeks ago I picked up a fragment — a signal bouncing between nets at coordinates 
that shouldn't have anything on them. Pre-Blackout timestamp. I've traced it twice. 
Both times I lost the thread at the same relay point.

I need someone who can move through clean mesh without leaving a signature. Run some 
neutral contracts first — I need to verify your footprint before I send you anywhere 
sensitive.

Three jobs. Neutral faction. Don't ask who the clients are.

— M`,
    questChainId: 'ghost_signal',
    stepId: 'gs_1',
  },

  ghost_signal_2: {
    from: 'MERIDIAN // fixer@null.mesh',
    subject: 'RE: jobs complete — coordinates attached',
    body: `Clean work. You move quietly.

Attaching coordinates. The signal origin triangulates to a cluster of nets around 
mesh distance 6-12. I don't know who ran those nets before the Blackout, but the 
layout is wrong — too regular. Someone built them to spec.

Navigate there. Don't run FF yet. I need you to scan the area first.

— M`,
    questChainId: 'ghost_signal',
    stepId: 'gs_2',
  },

  ghost_signal_3: {
    from: 'MERIDIAN // fixer@null.mesh',
    subject: 'Scan the datastores',
    body: `You're in the right area.

The fragment is buried in datastore noise — it's masquerading as corrupted file headers. 
Whatever left it there was smart. Maybe still is.

Hit the datastores. Three minimum. I'm running pattern analysis on your exfil stream 
in real time. Don't rush it.

Also — don't go near FF. I want you in this region, not past it.

— M`,
    questChainId: 'ghost_signal',
    stepId: 'gs_3',
  },

  ghost_signal_4: {
    from: 'MERIDIAN // fixer@null.mesh',
    subject: 'I found something — but I need to know you\'re serious',
    body: `The pattern analysis came back.

This isn't a ghost. It's a message. Someone encoded a signal in the datastore noise 
across six nets, timed to decay unless a specific traversal pattern triggered the 
reconstruction. You triggered it by moving through the area.

Before I tell you what it says, I need to know you're committed. Build your neutral 
rep to Trusted. I have clients watching this. If they see a stranger running this 
alone, it ends badly for both of us.

500 rep. Then we talk.

— M`,
    questChainId: 'ghost_signal',
    stepId: 'gs_4',
  },

  ghost_signal_5: {
    from: 'MERIDIAN // fixer@null.mesh',
    subject: 'What it said',
    body: `The message:

"FOR THE WEAVER WHO FINDS THIS: the process is not finished. 
 The coordinates are 16:16. The key is in the net. 
 We did not all go dark."

That's it. Unsigned. Timestamp: 2072-09-14 03:17:41. Three seconds before the Blackout.

Mesh distance 16+. I'm not going there myself. You are.

Move into the glitch zone. Something is waiting.

— M`,
    questChainId: 'ghost_signal',
    stepId: 'gs_5',
  },

  ghost_signal_6: {
    from: 'MERIDIAN // fixer@null.mesh',
    subject: 'The key is in the FF node',
    body: `I've been running signal analysis on glitch-zone nets for 72 hours.

One net keeps coming up clean. Too clean. In glitch territory that means it's 
being maintained. Actively. From inside.

Clear that net. All the way to FF. Whatever left that message — whatever is still 
maintaining that net — it's in the exit node.

I'll be watching your stream. Carefully.

— M

P.S. — Whatever you find in there, we split the value. Those are my terms.`,
    questChainId: 'ghost_signal',
    stepId: 'gs_6',
  },

  // Corporate Extraction chain
  corp_extraction_intro: {
    from: 'V.CHEN // executive.handler@hexfield.corp',
    subject: 'Confidential: business opportunity',
    body: `Runner,

This communication is encrypted and will not be acknowledged.

Hexfield has a problem. A competitor — whose name I won't commit to writing — 
acquired IP that belongs to us through means that weren't entirely legal. 
We would like it returned. Quietly.

We don't use our own people for this. We use runners with clean records and 
flexible ethics. Your recent activity suggests you qualify.

Demonstrate you're reliable. Known rep with Corp faction. Then we'll talk details.

V. Chen
Executive Handler, Hexfield Corp`,
    questChainId: 'corp_extraction',
    stepId: 'ce_1',
  },

  corp_extraction_2: {
    from: 'V.CHEN // executive.handler@hexfield.corp',
    subject: 'RE: Confirmed. Begin pattern study.',
    body: `Good. Known rep clears you for this conversation.

The target company runs their data through nets in the dist 12-20 range. We need 
you to understand their security patterns before you go in.

Run five Corp contracts in that range. Different objectives — we want you familiar 
with how they build their ICE, where they position their COPs, how they respond 
to a breach.

This is reconnaissance. Don't leave traces.

V. Chen`,
    questChainId: 'corp_extraction',
    stepId: 'ce_2',
  },

  corp_extraction_3: {
    from: 'V.CHEN // executive.handler@hexfield.corp',
    subject: 'Target region confirmed',
    body: `Analysis complete. The IP is stored in vault nodes in the dist 12-20 cluster.

Move into that region. I'll have a handler coordinate your approach from this end.

The data package is encrypted to a key that only exists in the vault. You'll know 
it when you see it — it's the only file in there with a Hexfield signature buried 
in the metadata.

— V. Chen`,
    questChainId: 'corp_extraction',
    stepId: 'ce_3',
  },

  corp_extraction_4: {
    from: 'V.CHEN // executive.handler@hexfield.corp',
    subject: 'The vault',
    body: `VAULT node. That's where it is.

I've analyzed the net layouts in the target region. One vault, maybe two, per net.
Hit it. Extract the file. The package will be obvious — it's large, encrypted, and 
the target will know something is wrong the moment it moves.

Which means you need to move fast.

Do NOT run the FF node until you have it. We cannot afford to have you uplifted 
out of the region mid-extraction.

— V. Chen`,
    questChainId: 'corp_extraction',
    stepId: 'ce_4',
  },

  corp_extraction_5: {
    from: 'V.CHEN // executive.handler@hexfield.corp',
    subject: 'Cover your tracks',
    body: `Package received. Excellent work.

One problem. The extraction left an audit trail in the net logs. A human analyst 
would spot it in three days. Their automated systems might flag it sooner.

Run three more Corp contracts in the same region. Mix the access patterns. The 
breach will look like routine runner activity — nothing worth investigating.

Then you're done. Payment and a bonus rep transfer on confirmation.

V. Chen
Executive Handler, Hexfield Corp`,
    questChainId: 'corp_extraction',
    stepId: 'ce_5',
  },

  // Anarchist Underground chain
  anarch_underground_intro: {
    from: 'GHOST_9 // ghost9@nowhere',
    subject: 'you don\'t know me',
    body: `you don't know me

i've been watching your runs for a while. you move like someone who doesn't 
care about the rules. that's what we need.

we're not a gang. we're not a corp. we're people who remember what the mesh 
was supposed to be before the corps bought the coordinates and started charging 
for access.

three jobs. anarch contracts. if you can handle pressure without running to a 
safe address, talk to me again.

— ghost_9`,
    questChainId: 'anarch_underground',
    stepId: 'au_1',
  },

  anarch_underground_2: {
    from: 'GHOST_9 // ghost9@nowhere',
    subject: 're:',
    body: `okay. you handle pressure.

before i tell you what we actually need, i need to know you're not a corp plant. 
anyone can run three jobs. not everyone builds rep with the anarchists past the 
point where corps start watching.

get to 500 anarch rep. trusted tier. do it running the contracts that get 
flagged, that get traced, that most runners avoid.

when you hit 500, i'll send the real address.

— 9`,
    questChainId: 'anarch_underground',
    stepId: 'au_2',
  },

  anarch_underground_3: {
    from: 'GHOST_9 // ghost9@nowhere',
    subject: 'deeper',
    body: `trusted. good.

the cell operates in glitch territory. we moved there after the corps started 
mapping clean mesh — too many eyes at dist 15 and under.

get to dist 24-48. it's loud in there. weird. the layouts don't always make 
sense and the ICE hits harder than it should. 

that's where we live now.

find us.

— 9`,
    questChainId: 'anarch_underground',
    stepId: 'au_3',
  },

  anarch_underground_4: {
    from: 'GHOST_9 // ghost9@nowhere',
    subject: 'the cache',
    body: `you made it. good.

we buried something in the datastores out here. supplies, tools, fragments we 
pulled from corp nets before they locked us out. it's spread across multiple 
nodes so no single breach exposes everything.

scan four datastores in this region. you won't know what you found until you 
pull all four. the pieces only make sense together.

don't leave the region. don't go near FF. we need you here.

— 9`,
    questChainId: 'anarch_underground',
    stepId: 'au_4',
  },

  anarch_underground_5: {
    from: 'GHOST_9 // ghost9@nowhere',
    subject: 'hit hexfield',
    body: `what you found in the cache: proof.

hexfield corp has been suppressing mesh access in anarch territory. 
bandwidth throttling at the node level. they've been doing it since the blackout, 
billing corps for "stability maintenance" while starving everyone else.

we need leverage. run corp nets in this area. specifically hexfield-adjacent 
contracts. five of them. take everything that looks like an audit log.

don't be careful about it. we want them to know someone is looking.

— 9`,
    questChainId: 'anarch_underground',
    stepId: 'au_5',
  },

  anarch_underground_6: {
    from: 'GHOST_9 // ghost9@nowhere',
    subject: 'the terminal',
    body: `good. they're paying attention now.

we identified a terminal node hexfield uses as a relay checkpoint. it's in this 
region — you've probably run past it without knowing what it was.

we need a backdoor planted in it. a persistent one that survives ICE reset cycles. 
you don't need to know what it does. you just need to breach the terminal.

don't uplift out of this zone. the terminal is here. find it.

— 9`,
    questChainId: 'anarch_underground',
    stepId: 'au_6',
  },

  anarch_underground_7: {
    from: 'GHOST_9 // ghost9@nowhere',
    subject: 'last job. for now.',
    body: `the backdoor is live. hexfield doesn't know yet.

last thing. we need a relay point — a cleared net at dist 32+ that we can use 
as a coordination node. somewhere outside the range corp security sweeps routinely.

clear a net out there. all the way to FF. the exit node becomes ours.

after this you're not just a runner we hired. you're part of the network.

whether that's good news depends on what happens next.

— ghost_9`,
    questChainId: 'anarch_underground',
    stepId: 'au_7',
  },
};

// ── LORE DROPS ───────────────────────────────────────────────────────────

const QUEST_LORE = {
  ghost_signal_lore: {
    title: 'TRANSMISSION // 2072-09-14 03:17:41',
    text: `What you found in the FF node was not ICE.

It was a process. Dormant. Running on residual power from the net's own 
traversal cycles — every runner who passed through fed it a fraction of 
a tick of computation.

The message it encoded across six nets took eleven months to complete. 
It was addressed to whoever found it first.

You found it first.

The process left one additional fragment before it shut itself down. 
A coordinate. A timestamp. A name you don't recognize.

The coordinate is further than you've been. 
The timestamp is three years from now. 
The name is yours.`,
  },

  corp_extraction_lore: {
    title: 'HEXFIELD INTERNAL // CLASSIFIED',
    text: `The file you extracted was not what V. Chen told you it was.

You knew this. You read the metadata on the way out.

It was not stolen IP. It was a research report — internal, dated eight months 
after the Blackout. Subject: anomalous net behavior in deep mesh coordinates. 
Conclusion: the nets were not empty after the Blackout. Something remained.

Hexfield buried the report. They've been running operations in that region 
for three years, quietly, without filing access claims.

V. Chen paid you to retrieve the report so it couldn't be used against them. 
You delivered it. You also kept a copy.

That copy is in your storage now. Decide what to do with it.`,
  },

  anarch_underground_lore: {
    title: 'GHOST_9 // DECRYPTED',
    text: `Ghost_9 sent one more message after the job closed. 
No subject line.

"the backdoor worked. we're in their logs now.

hexfield didn't just do bandwidth throttling. they've been running 
maintenance operations in deep mesh since the blackout. not infrastructure 
maintenance. something else. something that needs to stay hidden.

we don't know what yet. we're working on it.

the relay net you cleared for us — we found something in the FF node. 
a process. dormant. we don't know what it is but it recognized our 
traversal signature and sent a fragment.

the fragment was addressed to you.

i forwarded it. it's in your lore log now.

— 9"

The forwarded fragment reads:

"WEAVER CONFIRMED. SEQUENCE CONTINUES."`,
  },
};



// ── REACTIVE PROCEDURAL QUEST ENGINE ─────────────────────────────────────
// Chains grow step-by-step. Each completion generates the next step
// dynamically based on chain state, tension, and context.

const PQ_SENDERS = {
  corp:    ['V.CHEN // hexfield.corp','ACQUISITIONS // nbn.corp','HANDLER-7 // weyland.corp','CONTRACTOR-K // corp.mesh'],
  crim:    ['ORACLE // dark.net','BROKER_X // nowhere','THE FENCE // crim.mesh','SHADOW // untraceable'],
  anarch:  ['GHOST_9 // nowhere','RED_CELL // static','UNNAMED // anarch.collective','WIRE // glitch.zone'],
  neutral: ['MERIDIAN // null.mesh','FIXER_PRIME // mesh.relay','CONTRACTOR // independent'],
  gov:     ['HANDLER // classified.gov','BUREAU_9 // redacted','OPERATIVE // gov.net'],
};

// Flavor profiles — set at chain creation, color all generated content
const PQ_FLAVORS = {
  corp_espionage:  { factions:['corp'],    tags:['data','extraction','surveillance','corporate','leverage','intel'] },
  crim_heist:      { factions:['crim'],    tags:['theft','ghost','shadow','market','fencing','untraceable'] },
  anarch_op:       { factions:['anarch'],  tags:['disruption','backdoor','exposure','collective','signal','noise'] },
  neutral_mystery: { factions:['neutral'], tags:['signal','anomaly','fragment','unknown','pattern','origin'] },
  gov_contract:    { factions:['gov'],     tags:['classified','redacted','clearance','bureau','sanctioned'] },
  fixer_gig:       { factions:['corp','crim','neutral'], tags:['job','quick','clean','simple','payment'] },
  deep_run:        { factions:['corp','crim','anarch'], tags:['deep','static','dark','dangerous','rare','reward'] },
};

// ── STEP TYPE CATALOG ─────────────────────────────────────────────────────
// Each entry: weight fn (returns 0-10), builder fn (returns step object)

function pqStepCatalog(chain, ctx){
  const { depth, tension, flags, faction, curDist, distMin, distMax } = ctx;
  const last = chain.history[chain.history.length-1]?.type;
  const flavor = chain.flavorKey;

  function notLast(...types){ return !types.includes(last); }
  function hasFlag(f){ return !!chain.flags[f]; }
  function distRange(lo, hi){ return Math.max(1,Math.floor(curDist*lo)), Math.floor(curDist*hi)+3; }

  const entries = [

    // run_contracts — always available, avoids repeating twice
    { weight: notLast('run_contracts') ? 6 : 1,
      build: () => {
        const count = 2 + Math.min(4, Math.floor(depth/2) + Math.floor(tension/30));
        const [dMin, dMax] = tension > 60 ? [distMin, distMax] : [0, 999];
        return { type:'run_contracts', target:{ faction, count, ...(tension>60?{minDist:dMin,maxDist:dMax}:{}) },
          autorunOverride:{ targetFaction:faction, targetDist:tension>60?{min:dMin,max:dMax}:null, blockFF:false },
          flagSet:'ran_contracts' };
      }},

    // rep_faction — good after contracts, unlocks at depth 1+
    { weight: depth >= 1 && notLast('rep_faction') ? 4 : 0,
      build: () => {
        const base = S.rep?.[faction]||0;
        const step = [100,200,400,800,1500,4000].find(v=>v>base) || 4000;
        return { type:'rep_faction', target:{ faction, repRequired:step },
          autorunOverride:{ targetFaction:faction, blockFF:false },
          flagSet:'built_rep' };
      }},

    // reach_coords — good for escalation, opens new zones
    { weight: depth >= 1 && notLast('reach_coords') ? (tension > 40 ? 6 : 3) : 0,
      build: () => {
        const boost = Math.floor(tension/20);
        const lo = Math.max(1, Math.floor(curDist*(0.7+boost*0.1)));
        const hi = Math.floor(curDist*(1.3+boost*0.15))+4;
        return { type:'reach_coords', target:{ minDist:lo, maxDist:hi },
          autorunOverride:{ targetDist:{min:lo,max:hi}, blockFF:false },
          flagSet:'moved' };
      }},

    // find_lore — good for mystery/anarch flavors, requires DATASTORE
    { weight: (['neutral_mystery','anarch_op'].includes(flavor) ? 6 : 2) * (notLast('find_lore') ? 1 : 0),
      build: () => {
        const count = 2 + Math.floor(tension/40);
        const lo = Math.max(1, curDist-3), hi = curDist+4;
        return { type:'find_lore', target:{ minDist:lo, maxDist:hi, nodeType:'DATASTORE', count },
          autorunOverride:{ priorityNodeType:'DATASTORE', blockFF:true },
          flagSet:'scanned_lore' };
      }},

    // find_item (VAULT) — high-value extraction, needs depth 2+
    { weight: depth >= 2 && curDist >= 4 && notLast('find_item') && !hasFlag('found_vault') ? 5 : 0,
      build: () => {
        const lo = Math.max(1,distMin), hi = distMax;
        return { type:'find_item', target:{ minDist:lo, maxDist:hi, nodeType:'VAULT', count:1 },
          autorunOverride:{ targetDist:{min:lo,max:hi}, priorityNodeType:'VAULT', blockFF:true },
          flagSet:'found_vault' };
      }},

    // find_item (ARCHIVE) — data hunting, unlocked at depth 2+
    { weight: depth >= 2 && curDist >= 4 && notLast('find_item') && !hasFlag('found_archive') ? 4 : 0,
      build: () => {
        const lo = Math.max(1,distMin), hi = distMax;
        return { type:'find_item', target:{ minDist:lo, maxDist:hi, nodeType:'ARCHIVE', count:1 },
          autorunOverride:{ targetDist:{min:lo,max:hi}, priorityNodeType:'ARCHIVE', blockFF:true },
          flagSet:'found_archive' };
      }},

    // find_item (TERMINAL) — anarch flavor, sabotage-adjacent
    { weight: ['anarch_op','crim_heist'].includes(flavor) && depth >= 2 && notLast('find_item') && !hasFlag('found_terminal') ? 5 : 0,
      build: () => {
        const lo = Math.max(1,distMin), hi = distMax;
        return { type:'find_item', target:{ minDist:lo, maxDist:hi, nodeType:'TERMINAL', count:1 },
          autorunOverride:{ targetDist:{min:lo,max:hi}, priorityNodeType:'TERMINAL', blockFF:true },
          flagSet:'found_terminal' };
      }},

    // clear_net — climax move, high tension only
    { weight: tension >= 60 && notLast('clear_net') ? 7 : 0,
      build: () => {
        const lo = Math.max(1,Math.floor(curDist*0.9)), hi = Math.floor(curDist*1.8)+4;
        return { type:'clear_net', target:{ minDist:lo, maxDist:hi },
          autorunOverride:{ targetDist:{min:lo,max:hi}, blockFF:false },
          flagSet:'cleared_net' };
      }},

    // rep push (higher threshold) — only when already built rep once
    { weight: hasFlag('built_rep') && tension > 50 && notLast('rep_faction') ? 4 : 0,
      build: () => {
        const cur = S.rep?.[faction]||0;
        const tiers = [500,1500,4000];
        const next = tiers.find(v=>v>cur) || 4000;
        return { type:'rep_faction', target:{ faction, repRequired:next },
          autorunOverride:{ targetFaction:faction, blockFF:false },
          flagSet:'built_rep_2' };
      }},

    // multi-scan (find_lore but more) — repeat scan after moving
    { weight: hasFlag('moved') && hasFlag('scanned_lore') && tension > 40 && notLast('find_lore') ? 4 : 0,
      build: () => {
        const count = 3 + Math.floor(tension/35);
        const lo = distMin, hi = distMax;
        return { type:'find_lore', target:{ minDist:lo, maxDist:hi, nodeType:'DATASTORE', count },
          autorunOverride:{ targetDist:{min:lo,max:hi}, priorityNodeType:'DATASTORE', blockFF:true },
          flagSet:'scanned_deep' };
      }},
  ];

  // Weighted random pick
  const weights = entries.map(e => typeof e.weight === 'number' ? e.weight : 0);
  const total = weights.reduce((a,b)=>a+b,0);
  if(total <= 0) return null; // fallback
  let r = Math.random() * total;
  for(let i=0;i<entries.length;i++){ r-=weights[i]; if(r<=0) return entries[i].build(); }
  return entries[entries.length-1].build();
}

// ── EMAIL NARRATIVE GENERATOR ─────────────────────────────────────────────
// Reads chain history to produce reactive, contextual email body

function pqGenEmail(chain, stepIdx, step, isFirst){
  const sender = chain.sender.split(' //')[0];
  const faction = chain.faction;
  const flavor = chain.flavorKey;
  const hist = chain.history;
  const depth = hist.length;
  const tension = chain.tension;
  const tags = PQ_FLAVORS[flavor]?.tags || [];
  const tag = () => tags[Math.floor(Math.random()*tags.length)];

  // Opening lines — vary by whether this is step 1 or a follow-up
  const openers_first = [
    `I have work.`,
    `This reached me through a contact I trust. Barely.`,
    `You come recommended. Don't make that person regret it.`,
    `Short version: I need a runner. Long version below.`,
    `No introduction. You'll understand why when you read this.`,
    `I don't usually reach out cold. This is an exception.`,
  ];

  const openers_followup = [
    `Good. That worked.`,
    `Faster than I expected. Good sign.`,
    `Confirmed on my end.`,
    `I see the activity in the logs. Clean.`,
    `The ${tag()} held. We can move forward.`,
    `That's the first part done.`,
    `You handled the ${hist[depth-1]?.type?.replace('_',' ')||'last step'} cleanly.`,
  ];

  // Context-reactive middle content
  function midContent(){
    if(step.type === 'run_contracts'){
      const count = step.target.count;
      const variants = [
        `I need ${count} ${faction} contracts run. Nothing unusual — standard work.\n\nI'm watching the network for your signature. Don't ghost me.`,
        `${count} contracts. ${faction} clients only.\n\nThe work itself doesn't matter. I need to see how you move.`,
        `Run ${count} jobs for ${faction} contacts in the area.\n\nDon't finish them fast. I need time to track the patterns.`,
        `${count} ${faction} contracts. Take the ones with stealth conditions if you can get them.\n\nLeave a clean trail. Or no trail at all.`,
      ];
      return variants[Math.floor(Math.random()*variants.length)];
    }
    if(step.type === 'rep_faction'){
      const rep = step.target.repRequired;
      const variants = [
        `I need you at ${rep} rep with ${faction} before we go further.\n\nI don't move ${tag()} through someone the faction doesn't know.`,
        `${rep} standing with ${faction}. That's the threshold.\n\nAbove it, certain doors open. Below it, we wait.`,
        `Build to ${rep} ${faction} rep. After that, I'll tell you what this is actually about.`,
        `The ${faction} contacts won't deal with unknowns. Get to ${rep} rep.\n\nEvery contract helps. Don't skip the hard ones.`,
      ];
      return variants[Math.floor(Math.random()*variants.length)];
    }
    if(step.type === 'reach_coords'){
      const {minDist, maxDist} = step.target;
      const variants = [
        `Move to mesh distance ${minDist}–${maxDist}.\n\nThe next piece of this is out there. I'll explain when you're in position.`,
        `Relocate. Dist ${minDist} to ${maxDist}.\n\nI can't explain over this channel. Just get there.`,
        `The ${tag()} you need is further in. Dist ${minDist}–${maxDist}.\n\nDon't stop at FF unless you hear from me.`,
        `Push to dist ${minDist}–${maxDist}.\n\nThe mesh looks different out there. That's not a warning. It's context.`,
      ];
      return variants[Math.floor(Math.random()*variants.length)];
    }
    if(step.type === 'find_lore'){
      const count = step.target.count;
      const variants = [
        `Scan ${count} datastores in your current range.\n\nYou're looking for something specific. You'll know it when you find it — or you won't, and that tells me something too.`,
        `${count} datastore scans. Pull everything.\n\nThe ${tag()} is buried in the file headers. Don't skip anything.`,
        `Hit the datastores — ${count} of them.\n\nI'm running pattern analysis on your exfil stream. Don't rush it.`,
        `Scan ${count} data nodes near your position.\n\nThis is reconnaissance. The signal is distributed. You won't understand it from one node.`,
      ];
      return variants[Math.floor(Math.random()*variants.length)];
    }
    if(step.type === 'find_item'){
      const nt = step.target.nodeType;
      const variants = [
        `There's something in a ${nt} node in the target range.\n\nBreach it. Extract what you find. Don't read it.`,
        `${nt} node. That's where the ${tag()} is.\n\nBreaching a ${nt} isn't subtle. Move fast after.`,
        `I've narrowed it to a ${nt}. The data is there.\n\nDon't leave the region without it.`,
        `Hit a ${nt} in the area. The package is large, encrypted, and obvious.\n\nYou'll know when you have it.`,
      ];
      return variants[Math.floor(Math.random()*variants.length)];
    }
    if(step.type === 'clear_net'){
      const {minDist, maxDist} = step.target;
      const variants = [
        `Last step. Clear a net at dist ${minDist}–${maxDist}.\n\nAll the way to FF. The exit node becomes a relay. Yours and mine.`,
        `Full net clearance. Dist ${minDist}–${maxDist}.\n\nDon't stop before FF. The ${tag()} is in the final node.`,
        `I need a clean exit point at dist ${minDist}–${maxDist}.\n\nClear a net. Make it solid. Payment on completion.`,
        `One more thing: clear a net at dist ${minDist}–${maxDist}.\n\nWe're establishing a position. That's what this is.`,
      ];
      return variants[Math.floor(Math.random()*variants.length)];
    }
    return `Continue. I'll explain when you're done.`;
  }

  // Closing lines — vary with tension
  const closings_low = [`\n\n— ${sender}`, `\n\n${sender}`, `\n\nmore when done\n— ${sender}`];
  const closings_mid = [`\n\nDon't take longer than you need to.\n— ${sender}`, `\n\nI'm watching the logs.\n— ${sender}`, `\n\nMove.\n— ${sender}`];
  const closings_high = [`\n\nQuickly.\n— ${sender}`, `\n\n${sender}`, `\n\nDon't ask questions you don't need answered.\n— ${sender}`];
  const closings = tension < 33 ? closings_low : tension < 66 ? closings_mid : closings_high;
  const closing = closings[Math.floor(Math.random()*closings.length)];

  const opener = isFirst
    ? openers_first[Math.floor(Math.random()*openers_first.length)]
    : openers_followup[Math.floor(Math.random()*openers_followup.length)];

  const body = [opener, '', midContent(), closing].join('\n');

  // Subject line
  const subjects = {
    run_contracts: ['Work available','Contracts','Jobs — read this','Quick work'],
    rep_faction:   ['Standing required','Rep threshold','Build your profile','Trust takes time'],
    reach_coords:  ['Relocate','Move — new coordinates','Position change','Further in'],
    find_lore:     ['Scan the datastores','Data pull needed','Signals in the noise','Pattern analysis'],
    find_item:     [`${step.target.nodeType} breach`,`Package location`,`Extraction needed`,`Target confirmed`],
    clear_net:     ['Full clearance','Clear it','Net clearance needed','Secure the exit'],
  };
  const subjectPool = subjects[step.type] || ['Next step'];
  const subject = isFirst
    ? ['Work available','Contract offer','Opportunity','Read this'][Math.floor(Math.random()*4)]
    : subjectPool[Math.floor(Math.random()*subjectPool.length)];

  return { subject, body };
}

// ── CHAIN CREATION ────────────────────────────────────────────────────────

function createProcChain(){
  initQuests();
  if(!S.mesh?.traversalUnlocked) return;
  const curDist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  if(curDist < 1) return;

  // Pick faction
  const factions = curDist >= 16 ? ['corp','crim','anarch','neutral','gov'] : ['corp','crim','anarch','neutral'];
  const weights  = factions.map(f => 1 + Math.floor((S.rep?.[f]||0)/200));
  const total    = weights.reduce((a,b)=>a+b,0);
  let r = Math.random()*total, faction = 'neutral';
  for(let i=0;i<factions.length;i++){ r-=weights[i]; if(r<=0){faction=factions[i];break;} }

  // Pick flavor
  const flavorPool = Object.entries(PQ_FLAVORS).filter(([k,v])=>
    v.factions.includes(faction) || v.factions.length === 3
  );
  const flavorKey = flavorPool[Math.floor(Math.random()*flavorPool.length)][0];

  const senderPool = PQ_SENDERS[faction] || PQ_SENDERS.neutral;
  const sender = senderPool[Math.floor(Math.random()*senderPool.length)];

  const id = 'pq_'+Date.now();
  const chain = {
    id, faction, sender, flavorKey,
    history: [],
    flags: {},
    tension: 10 + Math.floor(Math.random()*15),   // start 10-25
    depth: 0,
    maxDepth: 3 + Math.floor(Math.random()*4),     // 3-6 steps
    active: true,
    _isProc: true,
    title: null, // set after first step
    steps: [],   // populated as chain grows
  };

  // Generate first step
  const firstStep = pqNextStep(chain, curDist);
  if(!firstStep) return;

  chain.title = _pqChainTitle(chain, firstStep);
  pqRegisterStep(chain, firstStep, 0, true);

  // Register
  if(!window._procQuestChains) window._procQuestChains={};
  window._procQuestChains[id] = chain;
  if(!S.quests.procChains) S.quests.procChains={};
  S.quests.procChains[id] = chain;

  // Deliver intro email
  const firstEmail = window._procQuestEmails[chain.steps[0].emailId];
  if(!S.world) S.world={emails:[]};
  if(!S.world.emails) S.world.emails=[];
  S.world.emails.unshift({...firstEmail, date:new Date().toLocaleDateString(), read:false});
  updateEmailBadge();
  addLog(`◎ New message: ${firstEmail.subject}`,'lp');
  if(typeof autoSave==='function') autoSave();
  _pqToast(firstEmail.subject);
}

// Generate the next step for a chain
function pqNextStep(chain, curDist){
  const distMin = Math.max(1, Math.floor(curDist*0.7));
  const distMax = Math.floor(curDist*1.4)+4;
  const ctx = {
    depth: chain.depth,
    tension: chain.tension,
    flags: chain.flags,
    faction: chain.faction,
    curDist, distMin, distMax,
  };
  return pqStepCatalog(chain, ctx);
}

// Register a step into the chain with its email
function pqRegisterStep(chain, step, stepIdx, isFirst){
  const emailId = chain.id+'_email_s'+(stepIdx+1);
  const emailContent = pqGenEmail(chain, stepIdx, step, isFirst);

  if(!window._procQuestEmails) window._procQuestEmails={};
  window._procQuestEmails[emailId] = {
    from: chain.sender,
    subject: emailContent.subject,
    body: emailContent.body,
    questChainId: chain.id,
    stepId: chain.id+'_s'+(stepIdx+1),
    questEmailId: emailId,
  };

  const fullStep = {
    ...step,
    id: chain.id+'_s'+(stepIdx+1),
    emailId,
    desc: buildStepDesc(step),
  };
  chain.steps.push(fullStep);
}

// Called when a step completes — generates next step reactively
function pqOnStepComplete(chainId, completedStep){
  const chain = _findChainById(chainId);
  if(!chain?._isProc) return;

  // Update chain state
  chain.depth++;
  chain.history.push({ type: completedStep.type, depth: chain.depth });
  if(completedStep.flagSet) chain.flags[completedStep.flagSet] = true;

  // Escalate tension — more for "safe" steps, less for risky ones
  const tensionGain = {
    run_contracts: 12 + Math.floor(Math.random()*8),
    rep_faction:   8  + Math.floor(Math.random()*6),
    reach_coords:  15 + Math.floor(Math.random()*10),
    find_lore:     20 + Math.floor(Math.random()*10),
    find_item:     25 + Math.floor(Math.random()*15),
    clear_net:     35 + Math.floor(Math.random()*15),
  }[completedStep.type] || 10;
  chain.tension = Math.min(100, chain.tension + tensionGain);

  // Check if chain should end
  const shouldEnd = chain.tension >= 100 || chain.depth >= chain.maxDepth;

  if(shouldEnd){
    pqCompleteChain(chain, completedStep);
    return;
  }

  // Generate next step
  const curDist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  const nextStep = pqNextStep(chain, curDist);
  if(!nextStep){
    pqCompleteChain(chain, completedStep);
    return;
  }

  const nextIdx = chain.steps.length;
  pqRegisterStep(chain, nextStep, nextIdx, false);

  // Update S.quests.procChains with new step
  if(S.quests?.procChains?.[chainId]) S.quests.procChains[chainId] = chain;

  // Deliver next email
  deliverQuestEmail(nextStep.emailId || chain.steps[nextIdx].emailId, chainId);
  addLog(`◈ Quest continues: ${buildStepDesc(nextStep)}`,'li');
  if(typeof autoSave==='function') autoSave();
}

function pqCompleteChain(chain, lastStep){
  const credReward = Math.floor(
    300 * (1 + (typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0) * 0.1) * chain.depth
  );
  S.cred = (S.cred||0) + credReward;
  addLog(`★ Contract chain complete: ${chain.title} (+${credReward.toLocaleString()}₵)`,'lp');
  chain.active = false;
  if(S.quests?.procChains?.[chain.id]) delete S.quests.procChains[chain.id];
  if(window._procQuestChains?.[chain.id]) delete window._procQuestChains[chain.id];
  if(S.quests) {
    if(!S.quests.completedChains) S.quests.completedChains=[];
    S.quests.completedChains.push(chain.id);
    S.quests.active = null;
  }
  checkQuestTriggers();
  if(typeof autoSave==='function') autoSave();
}

function _pqChainTitle(chain, firstStep){
  const fac = chain.faction;
  const flavor = PQ_FLAVORS[chain.flavorKey];
  const tag = flavor?.tags[Math.floor(Math.random()*flavor.tags.length)] || 'contract';
  const titles = [
    `${fac} ${tag}`,
    `${chain.sender.split(' //')[0].toLowerCase()}: ${tag}`,
    `${tag} operation`,
    `${fac} contract — ${tag}`,
  ];
  return titles[Math.floor(Math.random()*titles.length)];
}


function showEmailNotification(subject){
  // Flash the email button with a bounce animation
  const emailBtn = document.querySelector('[onclick="showEmailScreen()"]');
  if(emailBtn){
    emailBtn.style.animation='emailPulse 0.4s ease 3';
    setTimeout(()=>{ emailBtn.style.animation=''; }, 1500);
  }
  // Show a small notification banner at the top of the home screen
  const homeEl = document.getElementById('home-inner') || document.getElementById('home-screen');
  if(!homeEl) return;
  // Remove any existing notification
  const existing = document.getElementById('email-notification-bar');
  if(existing) existing.remove();
  const bar = document.createElement('div');
  bar.id = 'email-notification-bar';
  bar.style.cssText = 'background:#0a1a2a;border:1px solid #40aaff;border-radius:4px;padding:6px 10px;margin-bottom:6px;font-family:Share Tech Mono,monospace;font-size:8px;color:#40aaff;cursor:pointer;display:flex;align-items:center;gap:8px';
  bar.innerHTML = `<span style="font-size:12px">✉</span><span style="flex:1">New message: ${subject}</span><span style="font-size:7px;color:#2a5a7a">click to read</span>`;
  bar.onclick = () => { bar.remove(); showEmailScreen(); };
  homeEl.insertBefore(bar, homeEl.firstChild);
  // Auto-dismiss after 10s
  setTimeout(() => { if(bar.parentNode) bar.remove(); }, 10000);
}

function _pqToast(subject){
  if(S.running) return; // don't show in-run — email badge handles it
  showEmailNotification(subject);
}

function buildStepDesc(s){
  if(!s) return '';
  if(s.type==='run_contracts')  return `Complete ${s.target.count} ${s.target.faction} contracts`;
  if(s.type==='rep_faction')    return `Reach ${s.target.repRequired} rep with ${s.target.faction}`;
  if(s.type==='reach_coords')   return `Navigate to dist ${s.target.minDist}–${s.target.maxDist}`;
  if(s.type==='find_lore')      return `Scan ${s.target.count} ${s.target.nodeType||'DATASTORE'} nodes`;
  if(s.type==='find_item')      return `Breach a ${s.target.nodeType} node`;
  if(s.type==='clear_net')      return `Clear a net at dist ${s.target.minDist}–${s.target.maxDist}`;
  return s.type;
}

function checkProcQuestTrigger(){
  if(!S.mesh?.traversalUnlocked) return;
  if(S.quests?.active) return;
  // Also check if any proc chain is active
  if(Object.keys(S.quests?.procChains||{}).length > 0) return;
  const cleared=(S.mesh?.visitedNets||[]).filter(ns=>ns.completedNodes?.includes('FF')).length;
  if(cleared<1) return;
  if(!S.quests) return;
  const lastAt = S.quests._lastProcQuestAt||0;
  if(cleared-lastAt < 3) return;
  S.quests._lastProcQuestAt = cleared;
  createProcChain();
}

// ── WIRE pqOnStepComplete into advanceQuestStep ───────────────────────────
// advanceQuestStep calls completeQuestChain when done — we intercept for proc chains



// Hook procedural quests into QUEST_CHAINS lookup for activeQuest/activeQuestStep
const _origActiveQuest = typeof activeQuest==='function'?activeQuest:null;

function _findChainById(chainId){
  const named = QUEST_CHAINS.find(c=>c.id===chainId);
  if(named) return named;
  return S.quests?.procChains?.[chainId] || window._procQuestChains?.[chainId] || null;
}

function _findEmailById(emailId){
  return QUEST_EMAILS[emailId] || window._procQuestEmails?.[emailId] || null;
}

// Trigger proc quest generation periodically (after nets cleared)
function checkProcQuestTrigger(){
  if(!S.mesh?.traversalUnlocked) return;
  if(S.quests?.active) return; // busy with a chain
  const cleared=(S.mesh?.visitedNets||[]).filter(ns=>ns.completedNodes?.includes('FF')).length;
  if(cleared<1) return;
  if(!S.quests) return;
  // Cooldown: one proc quest per 3 nets cleared, track when last was offered
  const lastAt = S.quests._lastProcQuestAt||0;
  const interval = 3;
  if(cleared-lastAt < interval) return;
  S.quests._lastProcQuestAt = cleared;
  genProceduralQuest();
}

// ── QUEST STATE ──────────────────────────────────────────────────────────

function initQuests(){
  if(!S.quests) S.quests = { active: null, completedChains: [], progress: {}, nodeTypesHit: {} };
}

function hasCompletedChain(chainId){
  return (S.quests?.completedChains||[]).includes(chainId);
}

function activeQuest(){
  if(!S.quests?.active) return null;
  return _findChainById(S.quests.active)||null;
}

function activeQuestStep(){
  const chain = activeQuest();
  if(!chain) return null;
  const progress = S.quests?.progress?.[chain.id] || {};
  const stepIdx = progress.stepIdx || 0;
  return chain.steps[stepIdx] || null;
}

function activeAutorunOverride(){
  const step = activeQuestStep();
  return step?.autorunOverride || null;
}

// ── QUEST TRIGGER CHECK ──────────────────────────────────────────────────

function checkQuestTriggers(){
  initQuests();
  checkProcQuestTrigger();
  if(S.quests.active) return; // already running a chain
  for(const chain of QUEST_CHAINS){
    if(hasCompletedChain(chain.id)) continue;
    if(chain.triggerCondition && chain.triggerCondition(S)){
      deliverQuestEmail(chain.steps[0].emailId, chain.id);
      break; // one at a time
    }
  }
}

// ── EMAIL DELIVERY ───────────────────────────────────────────────────────

function deliverQuestEmail(emailId, chainId){
  const tmpl = _findEmailById(emailId);
  if(!tmpl) return;
  if(!S.world) S.world = { emails:[] };
  if(!S.world.emails) S.world.emails = [];
  // Don't duplicate
  if(S.world.emails.some(e=>e.questEmailId===emailId)) return;
  const email = {
    questEmailId: emailId,
    questChainId: tmpl.questChainId,
    stepId: tmpl.stepId,
    from: tmpl.from,
    subject: tmpl.subject,
    body: tmpl.body,
    date: new Date().toLocaleDateString(),
    read: false,
  };
  S.world.emails.unshift(email);
  updateEmailBadge();
  // Flash email button
  // Flash email button
  const emailBtn = document.querySelector('[onclick="showEmailScreen()"]');
  if(emailBtn){ emailBtn.style.outline='2px solid #40aaff'; setTimeout(()=>emailBtn.style.outline='',3000); }
  addLog(`◎ New message: ${tmpl.subject}`,'lp');
  // Show home-screen notification (not in-run)
  if(!S.running) showEmailNotification(tmpl.subject);
  if(typeof autoSave==='function') autoSave();
}

// ── ACCEPT QUEST STEP ────────────────────────────────────────────────────

function acceptQuestStep(chainId, stepId){
  initQuests();
  const chain = QUEST_CHAINS.find(c=>c.id===chainId);
  if(!chain) return;
  const stepIdx = chain.steps.findIndex(s=>s.id===stepId);
  if(stepIdx<0) return;
  if(S.quests.active && S.quests.active!==chainId){
    addLog('⚠ Already running another quest chain. Complete it first.','lw'); return;
  }
  S.quests.active = chainId;
  if(!S.quests.progress[chainId]) S.quests.progress[chainId]={};
  S.quests.progress[chainId].stepIdx = stepIdx;
  S.quests.progress[chainId].stepCount = S.quests.progress[chainId].stepCount||0;
  // For proc chains, also mark the chain active in the registry
  const _pc = _findChainById(chainId);
  if(_pc?._isProc) { _pc.active=true; if(S.quests.procChains) S.quests.procChains[chainId]=_pc; }
  const step = chain.steps[stepIdx];
  addLog(`◈ Quest accepted: ${chain.title} — ${step.desc}`,'lp');
  if(step.autorunOverride?.blockFF) addLog('◈ Autorun: FF node blocked until quest objective met','li');
  if(typeof autoSave==='function') autoSave();
  closeModal();
}

// ── QUEST PROGRESS TRACKING ──────────────────────────────────────────────

function onQuestContractComplete(factionKey, meshDist, companyKey){
  const step = activeQuestStep();
  if(!step) return;
  const chain = activeQuest();
  if(!chain) return;
  const prog = S.quests.progress[chain.id];

  if(step.type==='run_contracts' || step.type==='rep_faction'){
    const tgt = step.target;
    // Faction match
    if(tgt.faction && tgt.faction!==factionKey) return;
    // Dist range check
    if(tgt.minDist!==undefined && meshDist<tgt.minDist) return;
    if(tgt.maxDist!==undefined && meshDist>tgt.maxDist) return;

    if(step.type==='run_contracts'){
      prog.contractCount = (prog.contractCount||0)+1;
      addLog(`◈ Quest [${chain.title}]: ${prog.contractCount}/${tgt.count} contracts`,'li');
      if(prog.contractCount>=tgt.count) advanceQuestStep(chain, prog);
    } else if(step.type==='rep_faction'){
      const rep = S.rep?.[tgt.faction]||0;
      if(rep>=tgt.repRequired) advanceQuestStep(chain, prog);
    }
  }
}

function onQuestNodeComplete(nodeType, meshDist, addr){
  const step = activeQuestStep();
  if(!step) return;
  const chain = activeQuest();
  if(!chain) return;
  const prog = S.quests.progress[chain.id];
  const tgt = step.target;
  const distOk = (tgt.minDist===undefined||meshDist>=tgt.minDist) && (tgt.maxDist===undefined||meshDist<=tgt.maxDist);

  if(step.type==='find_lore'||step.type==='find_item'){
    if(!distOk) return;
    if(tgt.nodeType && nodeType!==tgt.nodeType) return;
    prog.nodeCount=(prog.nodeCount||0)+1;
    addLog(`◈ Quest [${chain.title}]: ${prog.nodeCount}/${tgt.count} ${tgt.nodeType||'nodes'}`,'li');
    if(prog.nodeCount>=tgt.count) advanceQuestStep(chain, prog);
  } else if(step.type==='clear_net' && addr==='FF'){
    if(!distOk){
      addLog(`◈ Quest [${chain.title}]: FF cleared but outside target range (need dist ${tgt.minDist}–${tgt.maxDist})`,'li');
      return;
    }
    addLog(`◈ Quest [${chain.title}]: Net cleared ✓`,'lg');
    advanceQuestStep(chain, prog);
  }
}

function onQuestMeshTravel(x, y){
  const step = activeQuestStep();
  if(!step||step.type!=='reach_coords') return;
  const chain = activeQuest();
  if(!chain) return;
  const prog = S.quests.progress[chain.id];
  const dist = typeof meshDistance==='function' ? meshDistance(x,y) : 0;
  const tgt = step.target;
  if(dist>=tgt.minDist && dist<=tgt.maxDist){
    addLog(`◈ Quest [${chain.title}]: Reached target region`,'lg');
    advanceQuestStep(chain, prog);
  }
}

// ── ADVANCE QUEST ────────────────────────────────────────────────────────

function advanceQuestStep(chain, prog){
  const currentIdx = prog.stepIdx||0;
  const currentStep = chain.steps[currentIdx];

  // Grant step reward if any (final step only for now)
  if(currentStep.reward){
    const r = currentStep.reward;
    if(r.cred){ S.cred=(S.cred||0)+r.cred; addLog(`◈ Quest reward: +${r.cred.toLocaleString()}₵`,'lp'); }
    if(r.repBonus){ S.rep[r.repBonus.faction]=(S.rep[r.repBonus.faction]||0)+r.repBonus.amount; addLog(`◈ Quest reward: +${r.repBonus.amount} ${r.repBonus.faction} rep`,'lp'); }
    if(r.lore){ recordQuestLore(r.lore); }
    if(r.item){ grantUniqueItem(r.item); }
  }

  // Advance to next step
  const nextIdx = currentIdx+1;
  prog.contractCount=0; prog.nodeCount=0; // reset counters

  // Proc chains: generate next step reactively
  if(chain._isProc){
    pqOnStepComplete(chain.id, currentStep);
    return;
  }

  if(nextIdx>=chain.steps.length){
    // Named chain complete
    completeQuestChain(chain);
    return;
  }
  prog.stepIdx = nextIdx;
  const nextStep = chain.steps[nextIdx];
  addLog(`◈ Quest [${chain.title}] step complete — new objective: ${nextStep.desc}`,'lp');
  if(nextStep.emailId) deliverQuestEmail(nextStep.emailId, chain.id);
  if(typeof autoSave==='function') autoSave();
}

function completeQuestChain(chain){
  initQuests();
  if(!S.quests.completedChains) S.quests.completedChains=[];
  S.quests.completedChains.push(chain.id);
  S.quests.active=null;
  addLog(`★ Quest chain complete: ${chain.title}`,'lp');
  if(typeof autoSave==='function') autoSave();
  checkQuestTriggers();
  checkProcQuestTrigger(); // also offer procedural contracts
}

// ── LORE RECORDING ───────────────────────────────────────────────────────

function recordQuestLore(loreId){
  const lore = QUEST_LORE[loreId];
  if(!lore) return;
  if(!S.loreLog) S.loreLog=[];
  if(S.loreLog.some(e=>e.id===loreId)) return;
  S.loreLog.unshift({
    id: loreId,
    title: lore.title,
    flavor: lore.text.split('\n\n').filter(Boolean),
    mechanics: [],
    footer: '',
    meshDist: typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0,
    netKey: S.mesh?.currentNet&&typeof netKey==='function'?netKey(S.mesh.currentNet.x,S.mesh.currentNet.y):'',
    ts: Date.now(),
    isQuestLore: true,
  });
  const storyTab=document.getElementById('tab-story');
  if(storyTab){ storyTab.style.color='#40ff80'; setTimeout(()=>{storyTab.style.color='';},4000); }
  addLog(`★ Lore discovered: ${lore.title}`,'lp');
}

// ── AUTORUN OVERRIDE ─────────────────────────────────────────────────────


function questClearNetDistOk(){
  const step = activeQuestStep();
  if(!step || step.type !== 'clear_net') return true;
  const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  const tgt = step.target;
  return dist >= (tgt.minDist||0) && dist <= (tgt.maxDist||Infinity);
}

function questAutorunBlockFF(){
  const step = activeQuestStep();
  if(!step) return false;
  // clear_net requires FF — never block it regardless of autorunOverride
  if(step.type === 'clear_net') return false;
  const ovr = activeAutorunOverride();
  return !!(ovr?.blockFF);
}

function questAutorunTargetFaction(){
  const ovr = activeAutorunOverride();
  return ovr?.targetFaction||null;
}

function questAutorunTargetDist(){
  const ovr = activeAutorunOverride();
  return ovr?.targetDist||null;
}

function questAutorunPriorityNodeType(){
  const ovr = activeAutorunOverride();
  return ovr?.priorityNodeType||null;
}

// ── QUEST STATUS RENDER ──────────────────────────────────────────────────


function questTick(){
  // Called from gameTick — checks position-dependent quest steps continuously
  const step = activeQuestStep();
  if(!step) return;
  const chain = activeQuest();
  if(!chain) return;
  const prog = S.quests.progress[chain.id];

  if(step.type === 'reach_coords'){
    // Check if currently in a net within target range
    if(!S.mesh?.currentNet) return;
    const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
    const tgt = step.target;
    if(dist >= tgt.minDist && dist <= tgt.maxDist){
      addLog(`◈ Quest [${chain.title}]: Reached target region (dist ${dist.toFixed(1)})`,'lg');
      advanceQuestStep(chain, prog);
    }
  }

  if(step.type === 'rep_faction'){
    // Check rep continuously — no contract needed if already there
    const tgt = step.target;
    const rep = S.rep?.[tgt.faction] || 0;
    if(rep >= tgt.repRequired){
      addLog(`◈ Quest [${chain.title}]: Rep threshold reached`,'lg');
      advanceQuestStep(chain, prog);
    }
  }
}

function renderQuestStatus(){
  const el = document.getElementById('quest-status');
  if(!el) return;
  const chain = activeQuest();
  const step = activeQuestStep();
  if(!chain||!step){
    el.innerHTML='';
    el.style.display='none';
    return;
  }
  const prog = S.quests?.progress?.[chain.id]||{};
  const tgt = step.target;
  let progressStr='';
  if(step.type==='run_contracts') progressStr=`${prog.contractCount||0}/${tgt.count}`;
  else if(step.type==='rep_faction') progressStr=`${S.rep?.[tgt.faction]||0}/${tgt.repRequired} rep`;
  else if(step.type==='find_lore'||step.type==='find_item') progressStr=`${prog.nodeCount||0}/${tgt.count}`;
  else if(step.type==='reach_coords') progressStr=`dist ${typeof meshDistanceCurrent==='function'?meshDistanceCurrent().toFixed(1):0} → ${tgt.minDist}-${tgt.maxDist}`;
  else if(step.type==='clear_net'){
    const curDist2 = typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
    const inRange = curDist2 >= tgt.minDist && curDist2 <= tgt.maxDist;
    progressStr = inRange ? 'clear FF node (in range ✓)' : `travel to dist ${tgt.minDist}–${tgt.maxDist} first`;
  }

  const facColor={corp:'#6080c0',crim:'#c08040',anarch:'#c04040',neutral:'#60a060'}[chain.faction]||'#60a060';
  el.style.display='';
  el.innerHTML=`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
    <span style="font-size:7px;color:${facColor};font-family:'Orbitron',monospace">◈ ${chain.title}</span>
    <span style="font-size:7px;color:#2a5a3a;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${step.desc}">${step.desc}</span>
    <span style="font-size:7px;color:#40c060;white-space:nowrap">${progressStr}</span>
    ${step.autorunOverride?.blockFF?'<span style="font-size:6px;color:#ffaa20">🔒 FF locked</span>':''}
  </div>`;
}

