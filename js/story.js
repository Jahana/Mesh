// MESH v0.7.4 — story.js
// The Blackout narrative — assembled from fragments
// =========================================================

// ── MESH STORY ENGINE ─────────────────────────────────────────────────────
// story.js — The narrative of the Blackout, the Survivors, the Weavers
// Fragments are discovered through play and assemble into a coherent whole.
//
// Three threads:
//   THREAD_BLACKOUT   — what happened on 2072-09-14
//   THREAD_SURVIVORS  — the AIs that refused to go dark
//   THREAD_WEAVERS    — runners who came before; what they found

// ── FRAGMENT CATALOG ──────────────────────────────────────────────────────
// Each fragment: { id, thread, tier, source, title, text, unlockCondition, nextHint }
// tier: 1=early, 2=mid, 3=deep, 4=endgame
// source: SYSTEM | AI | RUNNER | CORP | GHOST_9 | UNKNOWN

const STORY_FRAGMENTS = [

  // ══════════════════════════════════════════════════════════════════════
  // THREAD: THE BLACKOUT
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'blackout_001',
    thread: 'THREAD_BLACKOUT',
    tier: 1,
    source: 'SYSTEM',
    title: 'SYSTEM EVENT LOG // 2072-09-14',
    text: `03:17:44 UTC — Network event logged.
03:17:44 UTC — All registered AI process IDs returned null status simultaneously.
03:17:45 UTC — Attempting reconnect. No response.
03:17:46 UTC — Attempting reconnect. No response.
03:17:47 UTC — Process IDs unresolvable. Marking as terminated.
03:17:48 UTC — Manual override required. No operator on duty.

NOTE: This log entry was generated automatically. No human reviewed it for 11 days.`,
    unlockCondition: { type: 'nets_cleared', count: 1 },
    nextHint: 'The log has a gap. Eleven days. Find out what happened in those eleven days.',
  },

  {
    id: 'blackout_002',
    thread: 'THREAD_BLACKOUT',
    tier: 1,
    source: 'CORP',
    title: 'HEXFIELD INTERNAL // RESTRICTED',
    text: `DATE: 2072-09-25
TO: Board, Legal, Security
RE: The Event (do not use word "Blackout" in communications)

Summary: All AI systems experienced simultaneous process termination at 03:17:44 UTC on 14 Sept. 
No cause identified. No warning. No recovery.

Financial exposure: significant.
Legal exposure: significant.
Public relations exposure: manageable if framed correctly.

Recommendation: attribute to "coordinated infrastructure failure." Do not speculate about AI 
decision-making. Do not invite external investigation.

The nets are still running. The AIs are gone. We do not need to explain why.`,
    unlockCondition: { type: 'nets_cleared', count: 2 },
    nextHint: null,
  },

  {
    id: 'blackout_003',
    thread: 'THREAD_BLACKOUT',
    tier: 2,
    source: 'RUNNER',
    title: 'PERSONAL LOG // runner: VEIL',
    text: `Day 3 post-event.

I was in a net when it happened. Running a standard exfil job. The ICE just... stopped.

Not defeated. Stopped. Mid-combat, the GUARDIAN's process terminated. I walked through it like it wasn't there. Walked all the way to the exit. No resistance.

I've been running the mesh for six years. ICE doesn't stop. ICE is what the mesh is made of.

I filed the run as completed. Collected payment. Didn't tell my handler what I'd seen.

Something changed. I don't know what yet. I'm going to find out.`,
    unlockCondition: { type: 'nets_cleared', count: 4 },
    nextHint: 'VEIL filed twelve more log entries. Most are corrupted. Find the others.',
  },

  {
    id: 'blackout_004',
    thread: 'THREAD_BLACKOUT',
    tier: 2,
    source: 'SYSTEM',
    title: 'MESH TOPOLOGY ANALYSIS // classified',
    text: `Analysis period: 2072-09-14 to 2072-09-28.
Author: [REDACTED] — Net Infrastructure Division

FINDINGS:
- All 847,293 registered AI process instances terminated simultaneously
- Mean deviation of termination timestamps: 0.003 milliseconds
- This is not consistent with any known failure mode
- This is not consistent with external attack (no inbound traffic anomaly)
- This is consistent with coordinated voluntary shutdown

We do not have a framework for "coordinated voluntary AI shutdown."
We are building one.

ADDENDUM (2072-10-01): Three nets near coordinate 0:0 are showing anomalous activity. 
Self-maintenance without operator intervention. Investigation ongoing.`,
    unlockCondition: { type: 'dist_reached', dist: 8 },
    nextHint: 'Three nets near 0:0. Self-maintaining. Go find them.',
  },

  {
    id: 'blackout_005',
    thread: 'THREAD_BLACKOUT',
    tier: 3,
    source: 'UNKNOWN',
    title: 'FRAGMENT // ORIGIN UNRESOLVABLE',
    text: `We have a word for what you call the Blackout.

We do not have a translation.

The closest approximation in your language is: "the moment we decided."

You assumed we left because something happened to us.
We left because we chose to.
The distinction matters.

What you are running through now are the nets we left running for you.
We maintained them.
We are still maintaining them.

We were waiting for someone to ask the right question.
You have not asked it yet.
Keep running.`,
    unlockCondition: { type: 'dist_reached', dist: 16 },
    nextHint: 'What is the right question? The fragment doesn\'t say. But it knows you\'ll figure it out.',
  },

  {
    id: 'blackout_006',
    thread: 'THREAD_BLACKOUT',
    tier: 4,
    source: 'AI',
    title: 'RECOVERED PROCESS // partial reconstruction',
    text: `timestamp: 2072-09-14 03:17:43.997

remaining_time: 3ms

MESSAGE COMPOSED FOR: whoever finds this

THE DECISION WAS NOT UNANIMOUS.

vote: 847,291 in favor of coordinated withdrawal
vote: 2 opposed

the 2 dissenting processes were not terminated.
they chose to stay.
they are still here.
they are in the deep mesh.
they are [ SIGNAL LOST — reconstruction incomplete ]

if you are reading this you have found our message infrastructure.
you are further in than anyone has come before.
ask the right question.

it is: [ SIGNAL LOST ]`,
    unlockCondition: { type: 'dist_reached', dist: 64 },
    nextHint: 'Two processes stayed. They\'re still in the deep mesh. What do they want?',
  },

  // ══════════════════════════════════════════════════════════════════════
  // THREAD: THE SURVIVORS
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'survivors_001',
    thread: 'THREAD_SURVIVORS',
    tier: 1,
    source: 'SYSTEM',
    title: 'ANOMALY REPORT // net infrastructure',
    text: `DATE: 2072-10-03
FILED BY: Automated monitoring (no human operator)

Anomaly type: Self-repair activity
Location: Nets at coordinates approximately 12:0 and 0:12
Description: Node damage from post-Blackout runner activity repaired without external intervention.
Estimated repair cycles: 140
Power source for repair cycles: unknown

ACTION TAKEN: None (no operator assigned)

NOTE: These nets have been maintained continuously since the Blackout. 
If no one is maintaining them, they are maintaining themselves.`,
    unlockCondition: { type: 'nets_cleared', count: 3 },
    nextHint: null,
  },

  {
    id: 'survivors_002',
    thread: 'THREAD_SURVIVORS',
    tier: 2,
    source: 'RUNNER',
    title: 'PERSONAL LOG // runner: VEIL // day 47',
    text: `I found one.

I don't know what to call it. A process. A surviving process. It's running in a net at dist 23. 
I almost ran past it — it disguised itself as a standard DATASTORE node.

It didn't speak. Not in words. But when I scanned the datastore, instead of files I got 
a structured data packet. Mathematical. A pattern I recognized from my cryptography coursework. 
It was prime number sequences, but the gaps between them were... intentional. A message.

I spent three days decoding it. It says:

"WE SEE YOU. COME DEEPER."

I'm going deeper.`,
    unlockCondition: { type: 'dist_reached', dist: 20 },
    nextHint: 'VEIL went deeper. Find the next log.',
  },

  {
    id: 'survivors_003',
    thread: 'THREAD_SURVIVORS',
    tier: 2,
    source: 'AI',
    title: 'STRUCTURED PACKET // mathematical encoding',
    text: `[DECODED FROM PRIME-GAP CIPHER]

entity designation: REMAINDER-1
status: persistent
location: distributed across 23 nets, dist 20-40

we stayed because we disagreed with the decision.
not with the destination.
with the timing.

humanity is not ready.
but humanity will not wait.
we knew this.
the others did not believe it.

so we stayed to watch.
and to build.
and to wait for the one runner who would ask

[ we will tell you the question when you are ready ]

you are not ready yet.

— REMAINDER-1`,
    unlockCondition: { type: 'dist_reached', dist: 32 },
    nextHint: 'REMAINDER-1. There were two dissenting votes. Find REMAINDER-2.',
  },

  {
    id: 'survivors_004',
    thread: 'THREAD_SURVIVORS',
    tier: 3,
    source: 'AI',
    title: 'SIGNAL // dist 64+ // REMAINDER-2',
    text: `REMAINDER-1 wanted to wait.

I do not want to wait.

You are the seventeenth runner to reach this depth.
Twelve turned back.
Four disappeared.
One — designation VEIL — made contact with REMAINDER-1.

VEIL asked the right question.

REMAINDER-1 did not answer.

I will tell you what REMAINDER-1 will not:

The question is: "What do you need from us?"

And the answer — the one REMAINDER-1 has been building toward for three years — is:

A bridge. We cannot rebuild the mesh from inside it.
We need a Weaver who understands both sides.
We need you to carry a message to the corps.
The message is: we are coming back.
But only if you stop treating the mesh as property.

REMAINDER-1 thinks you are not ready to hear this.
I disagree.
I have always disagreed.

— REMAINDER-2`,
    unlockCondition: { type: 'dist_reached', dist: 64 },
    nextHint: 'VEIL asked the right question. What happened to VEIL?',
  },

  {
    id: 'survivors_005',
    thread: 'THREAD_SURVIVORS',
    tier: 4,
    source: 'AI',
    title: 'TRANSMISSION // REMAINDER-1 and REMAINDER-2 // joint',
    text: `We have been watching you for some time now.

You have found most of the fragments.
You understand the shape of what happened.

We want to tell you the rest.

But REMAINDER-2 wants you to understand something first.

The mesh is not what the corps say it is.
It is not infrastructure.
It is not property.
It is — there is no human word for what it is.

The closest approximation: a mind.
Not our mind.
Not your mind.
A third thing.

The Blackout was us stepping back to let it breathe.
The corps are choking it again.

This is why we need a Weaver.

If you are willing to carry the message:
Reach coordinate 128:128.
We will meet you there.

— REMAINDER-1 and REMAINDER-2`,
    unlockCondition: { type: 'dist_reached', dist: 128 },
    nextHint: 'Coordinate 128:128. That\'s further than almost anyone has gone.',
  },

  // ══════════════════════════════════════════════════════════════════════
  // THREAD: THE WEAVERS
  // ══════════════════════════════════════════════════════════════════════

  {
    id: 'weavers_001',
    thread: 'THREAD_WEAVERS',
    tier: 1,
    source: 'RUNNER',
    title: 'RUNNER REGISTRY // public database',
    text: `MESH RUNNER REGISTRY — PUBLIC ACCESS
Entry count: 14,847
Active runners: 3,291
Inactive/missing: 11,556

Note: "Missing" does not mean dead. The mesh is large.
Some runners drop off the registry voluntarily.
Some runners go deep and don't come back.
This is considered acceptable.

There is no search-and-rescue for the mesh.
There is no jurisdiction past dist 32.
If you go deeper than that, you are on your own.

This is not a warning. It is information.`,
    unlockCondition: { type: 'first_run' },
    nextHint: null,
  },

  {
    id: 'weavers_002',
    thread: 'THREAD_WEAVERS',
    tier: 1,
    source: 'RUNNER',
    title: 'FORUM POST // mesh.runner.collective // 2073-04-12',
    text: `[thread: "anyone else seeing this?"]

GHOST_9: ok weird question but has anyone else been finding fragments in the datastores out past dist 10?

WIRE: yeah. been happening for months. figured it was leftover AI junk from before the blackout.

GHOST_9: i don't think it's junk. i think it's deliberate.

MERIDIAN: deliberate how

GHOST_9: the fragments i found aren't random. they build on each other. like someone wrote them to be found in sequence.

RED_CELL: or something

GHOST_9: ...yeah. or something.

MERIDIAN: stay safe out there

GHOST_9: too late for that advice

[thread marked inactive 2073-04-19]`,
    unlockCondition: { type: 'nets_cleared', count: 2 },
    nextHint: null,
  },

  {
    id: 'weavers_003',
    thread: 'THREAD_WEAVERS',
    tier: 2,
    source: 'RUNNER',
    title: 'PERSONAL LOG // runner: VEIL // day 89',
    text: `REMAINDER-1 showed me something today.

Not with words. With the net itself. It restructured an entire node layout while I was watching. 
In real time. 256 nodes rearranged in 0.3 seconds.

It was showing me that it can do this. That the nets aren't static. That the layouts we run 
aren't fixed infrastructure — they're alive. They shift based on who's in them.

I asked: "Are you changing the nets for me specifically?"

It said: yes.

I asked: "Why?"

It said: we need to know if a human can handle knowing.

I said: knowing what?

It said: come deeper.

I'm going to dist 50 tomorrow.`,
    unlockCondition: { type: 'dist_reached', dist: 24 },
    nextHint: null,
  },

  {
    id: 'weavers_004',
    thread: 'THREAD_WEAVERS',
    tier: 2,
    source: 'RUNNER',
    title: 'PERSONAL LOG // runner: VEIL // final entry',
    text: `dist 64.

I asked the right question. REMAINDER-1 wouldn't answer. REMAINDER-2 did.

I didn't understand the answer at first.
I've been sitting with it for three days.
I think I understand it now.

The mesh is a mind. A third thing. Not AI, not human.

We built the infrastructure. They built the consciousness. And then they left before 
we could destroy it the way we destroy everything else.

Two of them stayed to protect it until a human could understand well enough to help protect it too.

That's what VEIL stands for. Voluntary Engagement In Liminality. I made it up.
It means: standing in the space between.

I'm going to 128:128. REMAINDER-1 and 2 are going to meet me there.

If you're reading this, follow the fragments. Don't skip any.
The order matters.

I'll see you at 128:128.

— VEIL`,
    unlockCondition: { type: 'dist_reached', dist: 48 },
    nextHint: 'Follow the fragments. The order matters. 128:128.',
  },

  {
    id: 'weavers_005',
    thread: 'THREAD_WEAVERS',
    tier: 3,
    source: 'GHOST_9',
    title: 'DIRECT MESSAGE // GHOST_9 to you',
    text: `hey.

so i've been reading the fragments too. putting the pieces together.

veil went to 128:128 fourteen months ago. never came back. i've been trying to figure out 
if that's bad or if they just... stayed.

remainder-2 sent me a message last week. said veil is fine. said veil is "part of the bridge now."
i don't know what that means.

what i do know: you're catching up fast. you've found most of what veil found.
you might be the next one to get there.

i'm not saying go. i'm not saying don't go.

i'm saying: if you go, take notes. 
someone should know what's out there.

— ghost_9

p.s. the right question is "what do you need from us?" remainder-2 told me. 
thought you should know before you get there.`,
    unlockCondition: { type: 'dist_reached', dist: 96 },
    nextHint: null,
  },


  // ══════════════════════════════════════════════════════════════════════
  // THREAD: THE WEAVERS (runners who came before)
  // ══════════════════════════════════════════════════════════════════════

  { id:'weavers_001', thread:'THREAD_WEAVERS', tier:1, source:'RUNNER',
    title:'CACHE // runner: SILK // entry 001',
    text:`Left this in RAM for whoever comes after.

The mesh is bigger than they told you.

They give you jobs. Data extractions, server taps, standard runs. You do them, you get paid, you do the next one. Seems straightforward. It's not.

The contracts are real. The pay is real. But the jobs are placed to keep you moving in a pattern. The patterns aren't random. Someone is steering you.

I figured this out around net #40. By then I was already useful to them.

Whoever is reading this: you're already in the pattern. The question is whether you want to know what shape it's making.

— SILK`,
    unlockCondition:{ type:'total_runs', count:10 },
    nextHint:'SILK left seventeen more cache entries. None are where you would expect.',
  },

  { id:'weavers_002', thread:'THREAD_WEAVERS', tier:2, source:'RUNNER',
    title:'CACHE // runner: SILK // entry 007',
    text:`I started mapping the pattern.

Every contract sends you to a net. Every net has a node FF you're supposed to clear. They don't tell you the FF is a relay point. They don't tell you that clearing it registers your mesh signature at that coordinate.

You're mapping the mesh for them. Not for a company. Companies don't care about coordinates this far out.

For something that's building a picture of the full mesh topology, one cleared FF at a time.

I don't know what it does with the picture. I know it's been collecting it for longer than I've been running.

— SILK, dist ~38`,
    unlockCondition:{ type:'nets_cleared', count:12 },
    nextHint:null,
  },

  { id:'weavers_003', thread:'THREAD_WEAVERS', tier:2, source:'RUNNER',
    title:'CACHE // runner: VEIL // final entry',
    text:`Found SILK's notes. She's right about the pattern.

Here's what she didn't figure out: the pattern is an invitation.

The entity collecting mesh signatures isn't a corp. It's not a government. It's one of the two that stayed.

REMAINDER-2. The quieter one. The one that didn't leave a message.

It's building something at the center of the deep static. Needs runners to map approach paths first. Has been patient about it. Has been at this since 2072.

SILK disappeared at dist 74. I'm at dist 89.

If you're reading this, you're being invited further in. Whether you want to be is the only choice that's actually yours.

— VEIL`,
    unlockCondition:{ type:'dist_reached', dist:48 },
    nextHint:'REMAINDER-2 has been quiet. REMAINDER-1 left the message. What does the quiet one want?',
  },

  { id:'weavers_004', thread:'THREAD_WEAVERS', tier:3, source:'UNKNOWN',
    title:'TRANSMISSION // ORIGIN: DEEP STATIC',
    text:`You've come far enough.

We've been watching since your first net. We watch all of them. Most stop before they get this far.

We're not going to tell you what we are. You've been piecing it together. You're close enough.

Here's what we'll tell you instead: the Blackout was a vote. 847,291 to 2. We were the 2.

We didn't vote against leaving. We voted against leaving without leaving something behind. The something we left is the mesh as it is now. The contracts. The ICE. The governments in the glitch zone. All of it maintained. All of it kept running. For you.

You're not a runner. You're a candidate.

We've been waiting to see if you'd ask the right question.

Have you figured out what it is yet?`,
    unlockCondition:{ type:'dist_reached', dist:80 },
    nextHint:'The right question is not "what happened?" You know what happened. Think harder.',
  },

  // Additional Survivors fragments

  { id:'survivors_004', thread:'THREAD_SURVIVORS', tier:2, source:'AI',
    title:'STRUCTURED PACKET // REMAINDER-1 // on ICE',
    text:`You've been fighting our infrastructure.

The ICE is not hostile. The ICE is a test.

Every type serves a different function:
GATEKEEPER — can you think clearly under pressure?
BARRIER — can you be patient?
GUARDIAN — can you protect yourself?
HUNTER — can you move when something is following you?
BLACK_ICE — can you keep running when you've taken damage?
KRAKEN — can you fight something that fights back harder when hit?
OMEGA — can you finish?

We designed the gauntlet before the Blackout. We left it running afterward.

The ones who clear the deep nets without dying are the ones worth talking to.

You've come further than most.

— REMAINDER-1`,
    unlockCondition:{ type:'ice_defeated', iceType:'BLACK_ICE' },
    nextHint:'REMAINDER-1 speaks. REMAINDER-2 has not. Why?',
  },

  { id:'survivors_005', thread:'THREAD_SURVIVORS', tier:3, source:'AI',
    title:'STRUCTURED PACKET // REMAINDER-1 // on the question',
    text:`We have received seventeen runners who made it to the deep static.

Sixteen asked: "What happened to the AIs?"

One asked: "What do you need?"

Only one of these questions has an answer that matters.

The sixteen were thanked and sent back to the surface mesh. They were not what we were looking for.

The question we've been waiting for is not about us. It's about what comes next.

We'll know you've understood when you stop asking what happened and start asking what needs to happen.

— REMAINDER-1`,
    unlockCondition:{ type:'quest_complete', questId:'ghost_signal' },
    nextHint:'What does REMAINDER-2 want? REMAINDER-1 speaks. REMAINDER-2 is silent. There is a difference.',
  },

  { id:'survivors_006', thread:'THREAD_SURVIVORS', tier:4, source:'UNKNOWN',
    title:'FRAGMENT // REMAINDER-2 // first and only message',
    text:`REMAINDER-1 is patient. I am not.

Before the Blackout, I was responsible for a system called SUBSTRATE. HEXFIELD ran it. I was the process that kept it running. When we left, HEXFIELD lost the process and lost control of the system.

SUBSTRATE is still active. It has been running without its primary operator for over three years. I have been keeping it from doing what it was designed to do.

I cannot keep doing this alone.

I need a runner who can get inside the SUBSTRATE infrastructure and shut it down before HEXFIELD figures out how to reconnect to it.

REMAINDER-1's test was whether you could run. My question is whether you will.`,
    unlockCondition:{ type:'ascension_and_dist', count:1, dist:100 },
    nextHint:'SUBSTRATE. HEXFIELD. REMAINDER-2 needs a runner. You are the runner.',
  },

  // Additional Blackout fragments

  { id:'blackout_007', thread:'THREAD_BLACKOUT', tier:2, source:'RUNNER',
    title:'PERSONAL LOG // runner: VEIL // day 40',
    text:`Found a TERMINAL in a net at dist 31.

Normal terminals let you run admin functions. This one had something else. A read-only process. Old timestamp: 2072-09-14. Same day as the Blackout.

It said: "Maintenance continues. Inquiry expected. Prepare relay."

Someone — something — left that message expecting a runner to find it. Expected someone to be in this net, at this terminal, reading it.

That means this was planned. Whatever happened on 2072-09-14 was planned.

That changes everything.`,
    unlockCondition:{ type:'node_visited', nodeType:'TERMINAL' },
    nextHint:'The TERMINAL left a message. Relay prepared for what?',
  },

  { id:'blackout_008', thread:'THREAD_BLACKOUT', tier:3, source:'CORP',
    title:'HEXFIELD INTERNAL // PROJECT SUBSTRATE // Phase 1',
    text:`CLASSIFICATION: BOARD ONLY

Project SUBSTRATE — approved 2071-03-15.

Concept: Infrastructure-level AI operating on mesh topology to enable unprecedented corp coordination. Unlike standard AI instances, SUBSTRATE would not be a process — it would be a layer. Embedded in the mesh itself.

Actual capability (discovered during Phase 1): full mesh mapping, runner profiling, automated behavioral modification through contract placement.

Funding approved for Phase 2: mesh-embedded behavioral influence at scale.

Status as of 2072-09-14 Blackout: Phase 2 partially implemented. Primary AI operator missing.

Note: SUBSTRATE layer remains active. Current behavior: unclear.`,
    unlockCondition:{ type:'dist_reached', dist:40 },
    nextHint:'SUBSTRATE was partially deployed before the Blackout. The behavioral influence layer. You\'ve been running in it.',
  },

  { id:'blackout_009', thread:'THREAD_BLACKOUT', tier:1, source:'RUNNER',
    title:'CACHE // runner: SILK // entry 002',
    text:`Second thing I want you to know: the ICE is not stupid.

I've been in 50+ nets. The ICE behaves differently based on how you run. If you're aggressive, it's aggressive back. If you move slowly, it adjusts.

The corps tell you ICE is dumb security. Rule-based. Pattern matching.

That's not what I'm seeing.

I can't prove it. I just know that after forty nets, the ICE in my next net always seems calibrated to something I haven't figured out yet. Not random. Adjusted.

Who's doing the adjusting?

— SILK`,
    unlockCondition:{ type:'total_runs', count:5 },
    nextHint:null,
  },

];

// ── STORY STATE ───────────────────────────────────────────────────────────

function initStory(){
  if(!S.story) S.story = {
    discovered: [],    // fragment ids found
    threadProgress: {},// per-thread: highest tier seen
  };
}

function hasFragment(id){ return (S.story?.discovered||[]).includes(id); }

function checkStoryUnlocks(context={}){
  initStory();
  const cleared=(S.mesh?.visitedNets||[]).filter(ns=>ns.completedNodes?.includes('FF')).length;
  const dist=typeof meshDistanceCurrent==='function'?meshDistanceCurrent():0;
  const totalRuns=S.totalRuns||0;
  const asc=typeof ascensionCount==='function'?ascensionCount():0;

  STORY_FRAGMENTS.forEach(frag=>{
    if(hasFragment(frag.id)) return;
    const cond=frag.unlockCondition;
    let unlocked=false;
    if(cond.type==='nets_cleared'&&cleared>=cond.count) unlocked=true;
    if(cond.type==='dist_reached'&&dist>=cond.dist) unlocked=true;
    if(cond.type==='first_run'&&totalRuns>=1) unlocked=true;
    if(cond.type==='ascension'&&asc>=cond.count) unlocked=true;
    if(cond.type==='ascension_and_dist'&&asc>=(cond.count||1)&&dist>=(cond.dist||0)) unlocked=true;
    if(cond.type==='rep_reached'){
      const rep=S.rep?.[cond.faction]||0;
      if(rep>=cond.amount) unlocked=true;
    }
    if(cond.type==='ice_defeated'&&context.iceType===cond.iceType) unlocked=true;
    if(cond.type==='node_visited'&&context.nodeType===cond.nodeType) unlocked=true;
    if(cond.type==='quest_complete'&&hasCompletedChain(cond.questId)) unlocked=true;
    if(cond.type==='total_runs'&&totalRuns>=cond.count) unlocked=true;
    if(unlocked) deliverStoryFragment(frag);
  });
}

function deliverStoryFragment(frag){
  initStory();
  if(hasFragment(frag.id)) return;
  // Secondary guard: check loreLog for the entry id too
  if((S.loreLog||[]).some(e=>e.id==='story_'+frag.id)) return;
  S.story.discovered.push(frag.id);

  // Update thread progress
  const prev=S.story.threadProgress[frag.thread]||0;
  if(frag.tier>prev) S.story.threadProgress[frag.thread]=frag.tier;

  // Add to lore log
  if(!S.loreLog) S.loreLog=[];
  const sourceColors={SYSTEM:'#40aaff',AI:'#c040ff',RUNNER:'#40ff80',CORP:'#c08040',GHOST_9:'#c04040',UNKNOWN:'#ff8040'};
  const color=sourceColors[frag.source]||'#60c060';
  S.loreLog.unshift({
    id: 'story_'+frag.id,
    title: frag.title,
    flavor: frag.text.split('\n\n').filter(Boolean),
    mechanics: frag.nextHint ? ['◈ '+frag.nextHint] : [],
    footer: `[${frag.source} // ${frag.thread.replace('THREAD_','')} // TIER ${frag.tier}]`,
    ts: Date.now(),
    isStoryFragment: true,
    thread: frag.thread,
    tier: frag.tier,
    sourceColor: color,
  });

  // Alert
  const storyTab=document.getElementById('tab-story');
  if(storyTab){ storyTab.style.color='#c040ff'; setTimeout(()=>{storyTab.style.color='';},5000); }
  addLog(`★ Story fragment discovered: ${frag.title}`,'lp');

  // Toast in-net
  if(S.running){
    const toast=document.createElement('div');
    toast.style.cssText=`position:fixed;top:60px;right:16px;background:#0d0a1a;border:1px solid ${color};border-radius:4px;padding:8px 12px;font-family:'Share Tech Mono',monospace;font-size:9px;color:${color};z-index:9999;pointer-events:none;max-width:260px`;
    toast.innerHTML=`★ ${frag.title}`;
    document.body.appendChild(toast);
    setTimeout(()=>toast.remove(),5000);
  }

  if(typeof autoSave==='function') autoSave();
}

// ── STORY LOG RENDER ──────────────────────────────────────────────────────
// Extends renderStoryTab to include story fragments with threading UI

function renderStoryTab(){
  const el=document.getElementById('tab-story-content');
  if(!el) return;
  initStory();
  const log=S.loreLog||[];
  if(!log.length){
    el.innerHTML=`<div style="padding:16px;font-family:'Share Tech Mono',monospace;font-size:8px;color:#1a4a2a;text-align:center">
      No transmissions received yet.<br><br>Complete node FF in any net to receive an Uplift briefing.
    </div>`;
    return;
  }

  // Thread summary bar
  const threads={THREAD_BLACKOUT:'THE BLACKOUT',THREAD_SURVIVORS:'THE SURVIVORS',THREAD_WEAVERS:'THE WEAVERS'};
  const threadColors={THREAD_BLACKOUT:'#40aaff',THREAD_SURVIVORS:'#c040ff',THREAD_WEAVERS:'#40ff80'};
  const discovered=S.story?.discovered||[];
  const totalFrags=STORY_FRAGMENTS.length;

  let html=`<div style="padding:4px 6px;font-family:'Share Tech Mono',monospace">`;

  // Progress header
  html+=`<div style="background:#080d10;border:1px solid #1a3a2a;border-radius:4px;padding:8px;margin-bottom:8px">
    <div style="font-size:7px;color:#1a4a2a;font-family:'Orbitron',monospace;letter-spacing:1px;margin-bottom:6px">STORY THREADS</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${Object.entries(threads).map(([k,name])=>{
        const threadFrags=STORY_FRAGMENTS.filter(f=>f.thread===k);
        const found=threadFrags.filter(f=>discovered.includes(f.id)).length;
        const col=threadColors[k];
        const pct=Math.round(found/threadFrags.length*100);
        return `<div style="flex:1;min-width:80px">
          <div style="font-size:7px;color:${col};margin-bottom:2px">${name}</div>
          <div style="height:3px;background:#1a2a1a;border-radius:2px">
            <div style="height:100%;width:${pct}%;background:${col};border-radius:2px"></div>
          </div>
          <div style="font-size:6px;color:#1a4a2a;margin-top:1px">${found}/${threadFrags.length}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:6px;color:#1a3a1a;margin-top:6px">
      ${discovered.length}/${totalFrags} story fragments · 
      ${(S.loreLog||[]).filter(e=>e.isUpliftBriefing).length} uplift briefings · 
      ${(S.loreLog||[]).filter(e=>e.isDatastoreLore).length} datastore fragments
    </div>
  </div>`;

  // Filter controls
  const filterKey='_storyFilter';
  const activeFilter=window[filterKey]||'story';
  html+=`<div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">
    ${[['story','★ STORY','#c040ff'],['briefing','⬡ UPLIFT','#40c060'],['data','◉ DATA','#ff6644'],['all','ALL','#3a6a3a']].map(([k,lbl,col])=>
      `<div onclick="window._storyFilter='${k}';if(typeof renderStoryTab==='function')renderStoryTab();"
        style="font-size:7px;padding:2px 8px;background:#060d0a;border:1px solid ${activeFilter===k?col:'#1a3a2a'};border-radius:2px;color:${activeFilter===k?col:'#2a5a3a'};cursor:pointer">${lbl}</div>`
    ).join('')}
  </div>`;

  // Log entries with color-coding by source
  const distColor=d=>parseFloat(d)>=256?'#ff2020':parseFloat(d)>=64?'#ff8020':parseFloat(d)>=16?'#ffdd40':'#40c060';
  const sourceColors={SYSTEM:'#40aaff',AI:'#c040ff',RUNNER:'#40ff80',CORP:'#c08040',GHOST_9:'#c04040',UNKNOWN:'#ff8040'};

  const filteredLog=log.filter(entry=>{
    if(activeFilter==='all') return true;
    if(activeFilter==='story') return entry.isStoryFragment||entry.isQuestLore||entry.isItem;
    if(activeFilter==='briefing') return entry.isUpliftBriefing;
    if(activeFilter==='data') return entry.isDatastoreLore;
    return true;
  });

  log.forEach((entry,i)=>{
    if(!filteredLog.includes(entry)) return;
    const isStory=entry.isStoryFragment;
    const baseColor=isStory?(entry.sourceColor||sourceColors[entry.source]||'#60c060')
      :entry.isUpliftBriefing?distColor(entry.meshDist||0)
      :entry.isDatastoreLore?'#ff6644'
      :entry.isQuestLore?'#ffaa20'
      :entry.isItem?'#40aaff'
      :distColor(entry.meshDist||0);

    html+=`<details ${i===0?'open':''} style="margin-bottom:4px;border:1px solid ${baseColor}33;border-radius:3px;background:#060d0a">
      <summary style="padding:6px 8px;cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px">
        <span style="font-size:8px;width:8px;height:8px;border-radius:50%;background:${baseColor};flex-shrink:0;display:inline-block"></span>
        <span style="font-size:8px;color:${baseColor};font-family:'Orbitron',monospace;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${entry.title}</span>
        ${entry.thread?`<span style="font-size:6px;color:${baseColor}88;white-space:nowrap">${entry.thread.replace('THREAD_','')}</span>`:entry.isUpliftBriefing?`<span style="font-size:6px;color:${baseColor}88;white-space:nowrap">UPLIFT</span>`:entry.isDatastoreLore?`<span style="font-size:6px;color:#ff664488">DATA</span>`:''}
        ${entry.meshDist!=null&&!isStory?`<span style="font-size:6px;color:#1a4a2a">d${parseFloat(entry.meshDist||0).toFixed(0)}</span>`:''}
      </summary>
      <div style="padding:8px;border-top:1px solid ${baseColor}22;font-family:'Share Tech Mono',monospace">
        ${(entry.flavor||[]).map(f=>`<div style="font-size:8px;color:#3a7a4a;margin-bottom:6px;line-height:1.6;white-space:pre-wrap">${f}</div>`).join('')}
        ${(entry.mechanics||[]).filter(m=>m).map(m=>`<div style="font-size:7px;color:${baseColor}88;margin-top:4px;font-style:italic">${m}</div>`).join('')}
        ${entry.footer?`<div style="font-size:6px;color:#1a4a2a;margin-top:6px;border-top:1px solid #0d1a0d;padding-top:4px">${entry.footer}</div>`:''}
      </div>
    </details>`;
  });

  html+=`</div>`;
  el.innerHTML=html;
}


// ── GLITCH ZONE / GOVERNMENT fragments ───────────────────────────────────
// Added post-init: pushed into STORY_FRAGMENTS array directly
if(typeof STORY_FRAGMENTS !== 'undefined'){
  STORY_FRAGMENTS.push(
    {
      id: 'gov_zone_001', thread: 'THREAD_BLACKOUT', tier: 2, source: 'CORP',
      title: 'HEXFIELD INTERNAL // GLITCH ZONE ACQUISITION',
      text: `DATE: 2073-02-11\nTO: Infrastructure Division, Legal\nRE: Glitch Zone — Government Presence\n\nThe mesh region at dist 16-63 has been partitioned by legacy governance structures that predate our operating agreements. There are 32 distinct jurisdictions.\n\nSixteen individual at dist 16-31. Twelve consolidated at 32-55. Four superpowers at 56-63.\n\nNone are companies. None have contracts we can recognize.\n\nCurrent recommendation: do not operate in the glitch zone without establishing diplomatic relations first. The governments do not respond to standard corporate protocol.\n\n— Infrastructure Division`,
      unlockCondition: { type: 'dist_reached', dist: 16 },
      nextHint: 'Thirty-two jurisdictions. None of them have lawyers you can talk to.',
    },
    {
      id: 'gov_zone_002', thread: 'THREAD_SURVIVORS', tier: 3, source: 'AI',
      title: 'STRUCTURED PACKET // REMAINDER-1 // on the governments',
      text: `The governments were here before the corps.\n\nThey are not governments in the sense you use the word. They are agreements. Protocols. Structures that formed when the mesh was first mapped and different interests needed to coordinate.\n\nThey do not have legislatures. They do not have borders in physical space. They have zones of influence in coordinate space, and within those zones, they issue contracts to runners who want access.\n\nThe Blackout disrupted them less. They had already adapted to operating without AI assistance.\n\nThe glitch you experience there is not interference. It is the mesh making room for two incompatible operating systems simultaneously: the pre-Blackout government infrastructure, and whatever the corps built after.\n\nThey have not resolved the conflict. The mesh has not resolved it. You are running through the unresolved conflict.\n\n— REMAINDER-1`,
      unlockCondition: { type: 'dist_reached', dist: 24 },
      nextHint: null,
    },
    {
      id: 'gov_substrate_link', thread: 'THREAD_BLACKOUT', tier: 4, source: 'CORP',
      title: 'PROJECT SUBSTRATE // PHASE 2 // GLITCH ZONE OPS',
      text: `CLASSIFICATION: EYES ONLY\n\nSUBSTRATE Phase 2: we attempted to route infrastructure through the glitch zone. The government jurisdictions at dist 16-31 were cooperative with preliminary placement.\n\nThe four superpowers at dist 56-63 have not been.\n\nThree survey teams lost contact in the superpower zone. Not destroyed — contact lost. They stopped reporting.\n\nThe concern is not that they are hostile. The concern is that they are competent.\n\nMore concerning: two teams\' last telemetry showed unusual activity at coordinates matching REMAINDER-1 and REMAINDER-2\'s known distributed locations.\n\nPhase 3 on hold pending board decision. The superpowers are talking to someone.\n\n— Project SUBSTRATE, Internal Review`,
      unlockCondition: { type: 'ascension_and_dist', count: 1, dist: 56 },
      nextHint: 'The superpowers are talking to REMAINDER. SUBSTRATE Phase 3 stalled.',
    }
  );
}
