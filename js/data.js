// MESH v0.7.4 — data.js
// ===================

// Level is now uncapped. Tier computed dynamically.
// Grid sizes computed asymptotically — approaches 15×15
const TIER_GRIDS=[[4,4],[4,5],[5,5],[5,6],[6,6],[6,7],[7,7],[7,8],[8,8],[9,9],[10,12],[11,12],[12,13],[13,14],[15,15]];

function levelToTier(lvl){
  // First 20 levels: tier 1-7 as before, then continues scaling
  if(lvl<=2)  return 1;
  if(lvl<=4)  return 2;
  if(lvl<=7)  return 3;
  if(lvl<=11) return 4;
  if(lvl<=15) return 5;
  if(lvl<=19) return 6;
  if(lvl<=25) return 7;
  if(lvl<=33) return 8;
  if(lvl<=43) return 9;
  if(lvl<=56) return 10;
  if(lvl<=72) return 11;
  if(lvl<=90) return 12;
  if(lvl<=110)return 13;
  if(lvl<=133)return 14;
  return 15;
}

// Asymptotic grid — max 15×15, approaches it via level
function gridForLevel(lvl){
  const tier=Math.min(15,levelToTier(lvl));
  return TIER_GRIDS[tier-1]||[15,15];
}
// Deck rarity tiers
const DECK_RARITY={
  common:    {id:'common',    name:'Common',    color:'#8a8a8a', lvlReq:1,  prestigeReq:0},
  uncommon:  {id:'uncommon',  name:'Uncommon',  color:'#40c060', lvlReq:5,  prestigeReq:0},
  rare:      {id:'rare',      name:'Rare',      color:'#4080ff', lvlReq:12, prestigeReq:1},
  legendary: {id:'legendary', name:'Legendary', color:'#a040ff', lvlReq:20, prestigeReq:2},
  mythic:    {id:'mythic',    name:'Mythic',    color:'#ffaa00', lvlReq:30, prestigeReq:4},
};

// Manufacturers — each specializes in a stat axis
const MANUFACTURERS={
  haas:    {id:'haas',    name:'Hexfield', specialty:'ram',       icon:'▦', color:'#4080ff',
             desc:'RAM specialists. +2 RAM per rarity above Common.',
             sigPerk:{rare:'Auto-identify files on harvest',legendary:'RAM overflow: excess files queued not lost',mythic:'+4 RAM, files never lost'}},
  weyland: {id:'weyland', name:'Ironwall',      specialty:'integrity', icon:'◫', color:'#c08040',
             desc:'Hardened decks. +3 INT per rarity. Rare+: damage reduction.',
             sigPerk:{rare:'First hit each combat absorbed free',legendary:'Combat damage -1 (min 1)',mythic:'Armor 2 passive every combat'}},
  jinteki: {id:'jinteki', name:'Silk Corp',      specialty:'speed',     icon:'◎', color:'#ff4060',
             desc:'Speed-optimized. -2 move ticks per rarity. Rare+: stealth bonus.',
             sigPerk:{rare:'+1 Hide stealth power passive',legendary:'Sneak chance +20%',mythic:'Tar Pit and Shock have no effect'}},
  nbn:     {id:'nbn',     name:'Vantage',          specialty:'trace',     icon:'◉', color:'#ffcc00',
             desc:'Trace management. Passive trace decay. Rare+: alert resistance.',
             sigPerk:{rare:'Trace decays 3%/tick passively',legendary:'Alert raises have 20% resist',mythic:'Red alert: auto-soothe every 5 ticks'}},
  novatek: {id:'novatek', name:'Novatek',      specialty:'slots',     icon:'⚙', color:'#40c0c0',
             desc:'Attachment specialists. +1 slot per rarity. Rare+: overclock synergy.',
             sigPerk:{rare:'Attachments: +1 power to all effects',legendary:'CPU nodes give +1 extra slot',mythic:'All attachment effects doubled'}},
};

// Generate a deck definition from manufacturer + rarity
function mkDeck(mfr, rarity, variant){
  const m=MANUFACTURERS[mfr];
  const r=DECK_RARITY[rarity];
  if(!m||!r)return null;
  const ri=['common','uncommon','rare','legendary','mythic'].indexOf(rarity); // 0-4
  // Base stats — manufacturer specialty gets top of range
  const isSpec=(stat)=>m.specialty===stat;
  const ram   =isSpec('ram')      ?(8+ri*4+ri*2)  :(8+ri*2);          // Hexfield: 8,14,20,26,32 others: 8,10,12,14,16
  const storage=isSpec('storage')  ?(12+ri*4+ri*2) :(8+ri*2);          // Novatek: 12,18,24,30,36 others: 8,10,12,14,16
  const integrity=isSpec('integrity')?(ri*5)       :(ri*2);            // Ironwall: 0,5,10,15,20 others: 0,2,4,6,8
  const spd   =isSpec('speed')    ?(1+ri)          :Math.max(1,ri);    // Silk Corp: 1,2,3,4,5 others: 0,1,2,3,4
  const slots =isSpec('slots')    ?(1+ri)          :Math.max(1,Math.ceil(ri/1.5)); // Novatek: 1,2,3,4,5 others: 1,1,2,3,4
  const cost  =[0,2000,8000,25000,80000][ri]+(variant||0)*500;
  const sigPerk=ri>=2?(m.sigPerk[rarity]||''):''; // rare+ get sig perk
  const id=`${mfr}_${rarity}${variant?'_'+variant:''}`;
  return{id, mfr, rarity, ri, name:`${m.name} ${r.name}${variant?` v${variant}`:''}`,
    ram, integrity, spd, slots, cost,
    lvl:r.lvlReq, prestigeReq:r.prestigeReq,
    color:r.color, mfrColor:m.color, icon:m.icon,
    sigPerk, desc:`${m.desc}${sigPerk?' ★ '+sigPerk:''}`,
    craftable:rarity==='mythic',
  };
}

// Pre-generated deck catalog
const HARDWARE=(()=>{
  const decks=[];
  const mfrs=Object.keys(MANUFACTURERS);
  const rarities=['common','uncommon','rare','legendary'];
  // Common: 1 per manufacturer, slight variants
  mfrs.forEach((m,i)=>decks.push(mkDeck(m,'common')));
  // Uncommon: 1 per manufacturer
  mfrs.forEach(m=>decks.push(mkDeck(m,'uncommon')));
  // Rare: 1 per manufacturer  
  mfrs.forEach(m=>decks.push(mkDeck(m,'rare')));
  // Legendary: 1 per manufacturer
  mfrs.forEach(m=>decks.push(mkDeck(m,'legendary')));
  // Mythic: craftable only, not in catalog for purchase
  mfrs.forEach(m=>decks.push(mkDeck(m,'mythic')));
  return decks;
})();

// Starting deck (Common Haas — balanced)
const STARTER_DECK=HARDWARE.find(h=>h.mfr==='haas'&&h.rarity==='common');

// ── PROGRAM TIER EXPANSION ───────────────────────────────────────────────
// Mk4-6 added — prestige gated. Existing Mk1-3 unchanged.
// (Appended to PDEFS array after load, or defined inline here for reference)
const PDEFS_EXTENDED=[
  // Breakers Mk4 (P1)
  {id:'fracter_4',minMeshDist:8,  name:'Fracter Mk4',  icon:'⬡',cat:'breaker',iceTypes:['BARRIER'],    tier:4,str:14,mem:5,cost:1800,faction:'gen',  prestigeReq:1,desc:'Breaks Barrier ICE. STR 14.'},
  {id:'decoder_4',minMeshDist:8,  name:'Decoder Mk4',  icon:'◇',cat:'breaker',iceTypes:['GATEKEEPER'], tier:4,str:14,mem:5,cost:1800,faction:'corp', prestigeReq:1,desc:'Breaks Gatekeeper. STR 14.'},
  {id:'killer_4',minMeshDist:8,   name:'Killer Mk4',   icon:'◈',cat:'breaker',iceTypes:['GUARDIAN','HUNTER'],tier:4,str:14,mem:5,cost:2000,faction:'crim', prestigeReq:1,desc:'Breaks Guardian/Hunter. STR 14.'},
  // Utility Mk2 (P1)
  {id:'soothe_3',minMeshDist:4,   name:'Soothe v3',    icon:'≋',cat:'utility',tier:3,mem:4,cost:1200,faction:'corp', prestigeReq:1,passive:true,effect:'soothe',pressureRate:4,urgentRate:8,desc:'Reduces alert pressure. −4/tick idle, −8 when raised.'},
  {id:'zap_3',minMeshDist:4,      name:'Zap v3',       icon:'⚡',cat:'utility',tier:3,mem:4,cost:1500,faction:'anarch',prestigeReq:1,passive:true,effect:'zap',    power:3,            desc:'Pre-combat -3 ICE STR (passive).'}, 
  {id:'scan_3',minMeshDist:4,     name:'Scanner v3',   icon:'⊙',cat:'utility',tier:3,mem:4,cost:1400,faction:'gen',  prestigeReq:1,passive:true,effect:'scan',                       desc:'Scans+identifies all files on datastore arrival.'},
  // Breakers Mk5 (P3)
  {id:'fracter_5',minMeshDist:16,  name:'Fracter Mk5',  icon:'⬡',cat:'breaker',iceTypes:['BARRIER'],    tier:5,str:20,mem:8,cost:5000,faction:'gen',  prestigeReq:3,desc:'Breaks Barrier ICE. STR 20.'},
  {id:'decoder_5',minMeshDist:16,  name:'Decoder Mk5',  icon:'◇',cat:'breaker',iceTypes:['GATEKEEPER'], tier:5,str:20,mem:8,cost:5000,faction:'corp', prestigeReq:3,desc:'Breaks Gatekeeper. STR 20.'},
  {id:'killer_5',minMeshDist:16,   name:'Killer Mk5',   icon:'◈',cat:'breaker',iceTypes:['GUARDIAN','HUNTER'],tier:5,str:20,mem:8,cost:5500,faction:'crim', prestigeReq:3,desc:'Breaks Guardian/Hunter. STR 20.'},
  // Utility advanced (P2-3)
  {id:'armor_2',    name:'Armor v2',     icon:'◫',cat:'utility',tier:2,mem:4,cost:2000,faction:'gen',  prestigeReq:2,passive:true,effect:'armor',   power:2,            desc:'Absorbs 2 retaliation hits per combat.'},
  {id:'deceive_3',  name:'Deceive v3',   icon:'⊘',cat:'utility',tier:3,mem:4,cost:2500,faction:'crim', prestigeReq:2,passive:true,effect:'deceive', power:3,            desc:'Auto-responds all patrol queries. Unlimited.'},
  {id:'hide_3',     name:'Hide v3',      icon:'◌',cat:'utility',tier:3,mem:5,cost:3000,faction:'anarch',prestigeReq:2,passive:true,effect:'stealth', power:4,           desc:'Detection -4. High sneak chance.'},
  // Breakers Mk6 — craftable only (P5)
  {id:'fracter_6',minMeshDist:32,  name:'Fracter Mk6',  icon:'⬡',cat:'breaker',iceTypes:['BARRIER'],    tier:6,str:28,mem:12,cost:0,   faction:'gen',  prestigeReq:5,craftable:true,desc:'Breaks Barrier ICE. STR 28. Craft only.'},
  {id:'decoder_6',minMeshDist:32,  name:'Decoder Mk6',  icon:'◇',cat:'breaker',iceTypes:['GATEKEEPER'], tier:6,str:28,mem:12,cost:0,   faction:'corp', prestigeReq:5,craftable:true,desc:'Breaks Gatekeeper. STR 28. Craft only.'},
  {id:'killer_6',minMeshDist:32,   name:'Killer Mk6',   icon:'◈',cat:'breaker',iceTypes:['GUARDIAN','HUNTER'],tier:6,str:28,mem:12,cost:0,faction:'crim', prestigeReq:5,craftable:true,desc:'Breaks Guardian/Hunter. STR 28. Craft only.'},
];

// Attachment definitions
const ATTACHMENTS={
  ram_chip:   {id:'ram_chip',   name:'RAM Chip',      icon:'▦',cost:150, faction:'gen',  effect:'ram',       power:2,  desc:'+2 RAM capacity'},
  ram_chip_2: {id:'ram_chip_2', name:'RAM Chip Mk2',  icon:'▦',cost:400, faction:'corp', effect:'ram',       power:4,  desc:'+4 RAM capacity'},
  coprocessor:{id:'coprocessor',name:'Co-Processor',  icon:'◈',cost:300, faction:'gen',  effect:'breaker_str',power:1, desc:'+1 all breaker STR this run'},
  trace_filter:{id:'trace_filter',name:'Trace Filter', icon:'◎',cost:200, faction:'crim', effect:'trace_start',power:10,desc:'-10% trace at run start'},
  ice_analyzer:{id:'ice_analyzer',name:'ICE Analyzer', icon:'⬡',cost:250, faction:'gen',  effect:'ice_reveal', power:1, desc:'Reveals ICE STR on visited cells'},
  neural_buf: {id:'neural_buf', name:'Neural Buffer',  icon:'◫',cost:350, faction:'corp', effect:'integrity',  power:3, desc:'+3 max integrity'},
  cooling:    {id:'cooling',    name:'Cooling Unit',   icon:'≋',cost:280, faction:'anarch',effect:'soothe_cd',  power:5, desc:'Soothe fires 5 ticks faster'},
  ghost_chip: {id:'ghost_chip', name:'Ghost Chip',     icon:'◌',cost:320, faction:'anarch',effect:'stealth',   power:1, desc:'+1 Hide stealth power'},
  // Mk2 attachments (uncommon tier — higher cost)
  storage_chip:   {id:'storage_chip',   name:'Storage Chip',     icon:'◫',cost:120, faction:'gen',  effect:'storage', power:4,  desc:'+4 file storage capacity'},
  storage_chip_2: {id:'storage_chip_2', name:'Storage Chip Mk2', icon:'◫',cost:350, faction:'crim', effect:'storage', power:8,  desc:'+8 file storage capacity'},
  storage_chip_3: {id:'storage_chip_3', name:'Storage Chip Mk3', icon:'◫',cost:900, faction:'crim', effect:'storage', power:16, desc:'+16 file storage capacity'},
  ram_chip_3: {id:'ram_chip_3',  name:'RAM Chip Mk3',    icon:'▦',cost:1200,faction:'corp', effect:'ram',        power:6, desc:'+6 RAM capacity'},
  neural_buf2:{id:'neural_buf2', name:'Neural Buffer Mk2',icon:'◫',cost:1500,faction:'corp', effect:'integrity',  power:6, desc:'+6 max integrity'},
  turbo_proc: {id:'turbo_proc',  name:'Turbo Processor', icon:'◈',cost:1800,faction:'gen',  effect:'breaker_str',power:2, desc:'+2 all breaker STR'},
  trace_scrub:{id:'trace_scrub', name:'Trace Scrubber',  icon:'◎',cost:1400,faction:'crim', effect:'trace_start',power:20,desc:'-20% trace at run start'},
  ice_ai:     {id:'ice_ai',      name:'ICE A.I.',         icon:'⬡',cost:2000,faction:'corp', effect:'ice_reveal', power:2, desc:'Reveals ICE+STR on all visited cells'},
  cryo_cooler:{id:'cryo_cooler', name:'Cryo Cooler',     icon:'≋',cost:2200,faction:'anarch',effect:'soothe_cd', power:10,desc:'Soothe fires 10 ticks faster'},
  stealth_os: {id:'stealth_os',  name:'Stealth OS',      icon:'◌',cost:2500,faction:'anarch',effect:'stealth',   power:2, desc:'+2 Hide stealth power'},
};

const ATTACH_MARKET_MK2=['ram_chip_3','storage_chip_3','neural_buf2','turbo_proc','trace_scrub','ice_ai','cryo_cooler','stealth_os'];
// Credit sink services (bought from UI buttons)
const CREDIT_SINKS={
  intel:         {id:'intel',         name:'Intel Package',  cost:150,  desc:'Reveal ICE positions on next grid before run starts'},
  trace_scrub:   {id:'trace_scrub',   name:'Trace Scrub',    cost:200,  desc:'Remove 20% trace carry-over between runs'},
};

// Black market item pool — rotates every 10 minutes, high cost, cross-faction
const BLACK_MARKET_POOL=[
  {id:'bm_decoder3',  name:'Decoder Mk3',    type:'program', defId:'decoder_3',  baseCost:2800, desc:'Black market Mk3 decoder — no rep required'},
  {id:'bm_killer3',   name:'Killer Mk3',     type:'program', defId:'killer_3',   baseCost:3000, desc:'Black market killer — bypasses faction gate'},
  {id:'bm_fracter4',  name:'Fracter Mk4',    type:'program', defId:'fracter_4',  baseCost:6000, desc:'Mk4 fracter — requires P1 but no faction'},
  {id:'bm_soothe2',   name:'Soothe v2',      type:'program', defId:'soothe_2',   baseCost:2000, desc:'Imported Soothe v2 — any faction'},
  {id:'bm_armor1',    name:'Armor v1',       type:'program', defId:'armor_1',    baseCost:1500, desc:'Hardened armor — black market import'},
  {id:'bm_ramchip',   name:'RAM Chip Mk2',   type:'attach',  attachId:'ram_chip_2',baseCost:2500,desc:'Extra RAM — off the books'},
  {id:'bm_tracer',    name:'Trace Filter',   type:'attach',  attachId:'trace_filter',baseCost:2200,desc:'Trace filter — untraceable source'},
  {id:'bm_overclock', name:'Overclock',      type:'program', defId:'overclock',  baseCost:3500, desc:'Anarch overclock — no faction required'},
  {id:'bm_haas_u',    name:'Hexfield Uncommon',  type:'deck',    deckId:'haas_uncommon',baseCost:5000,desc:'Hexfield Uncommon — grey market'},
  {id:'bm_jinteki_u', name:'Silk Corp Uncommon',type:'deck',   deckId:'jinteki_uncommon',baseCost:5000,desc:'Silk Corp Uncommon — no faction rep needed'},
];

const ATTACH_MARKET={
  gen:   ['ram_chip','storage_chip','coprocessor','ice_analyzer'],
  corp:  ['ram_chip_2','neural_buf'],
  crim:  ['storage_chip_2'],
  crim:  ['trace_filter'],
  anarch:['cooling','ghost_chip'],
};
const BASE_ICE={
  GATEKEEPER:{minMeshDist:0,icon:'⬡',baseStr:2,retaliation:1,badge:'ibg',label:'GATE'},
  BARRIER:   {minMeshDist:0,icon:'▦',baseStr:2,retaliation:1,badge:'ibb',label:'BARR'},
  GUARDIAN:  {minMeshDist:0,icon:'◈',baseStr:2,retaliation:2,badge:'ibgu',label:'GARD'},
  HUNTER:    {minMeshDist:0,icon:'☠',baseStr:3,retaliation:3,badge:'ibh',label:'HUNT',mobile:true},
  PROBE:     {minMeshDist:4,icon:'⊙',baseStr:3,retaliation:1,badge:'ibpr',label:'PROB'},
  BLACK_ICE: {minMeshDist:8,icon:'◼',baseStr:6,retaliation:5,badge:'ibbl',label:'BLCK'},
  TAR_PIT:   {minMeshDist:12,icon:'⬢',baseStr:2,retaliation:1,badge:'ibtp',label:'TAR'},
  TRACER:    {minMeshDist:16,icon:'◎',baseStr:2,retaliation:1,badge:'ibtr',label:'TRAC'},
  KRAKEN:    {minMeshDist:32,icon:'⬡⬡',baseStr:5,retaliation:3,badge:'ibk', label:'KRAK',rowBlocker:true},
  MIMIC:     {minMeshDist:48,icon:'◈',baseStr:3,retaliation:2,badge:'ibm', label:'MIMC',disguised:true},
  LEECH:     {minMeshDist:64,icon:'⊗',baseStr:3,retaliation:2,badge:'ibl', label:'LEEC',strDrain:1},
  CASCADE:   {minMeshDist:96,icon:'◉',baseStr:4,retaliation:2,badge:'ibc', label:'CASC',spawnsOnDeath:'BARRIER'},
  ARCHITECT: {minMeshDist:128,icon:'⬟',baseStr:3,retaliation:2,badge:'iba', label:'ARCH',selfRepair:true},
  OMEGA:     {minMeshDist:192,icon:'◼◎',baseStr:7,retaliation:4,badge:'ibo', label:'OMEG',multiEffect:true},
};
const NODE_DEF={
  ENTRY:    {icon:'⬡',label:'ENTRY',   color:'#00ff88'},
  EXIT:     {icon:'◎',label:'EXIT',    color:'#ff8800'},
  EMPTY:    {icon:'·',label:'EMPTY',   color:'#1a3a1a'},
  RAM:      {icon:'▦',label:'RAM',     color:'#40aaff'},
  IO:       {icon:'⇄',label:'I/O',    color:'#aaffaa'},
  CPU:      {icon:'◈',label:'CPU',     color:'#ffdd40'},
  GPU:      {icon:'▣',label:'GPU',     color:'#ff88ff'},
  DATASTORE:{icon:'◉',label:'DATA',   color:'#ff6644'},
  COP:      {icon:'⬟',label:'COP',    color:'#ff44aa'},
  // New node types
  RELAY:    {icon:'⇢',label:'RELAY',   color:'#40ffdd', desc:'Reveals surrounding cells. Stacks with CPU map range.'},
  VAULT:    {icon:'◆',label:'VAULT',   color:'#ffdd40', desc:'Locked high-value datastore. Requires Decrypt to open.'},
  PROXY:    {icon:'⬭',label:'PROXY',   color:'#c0a0ff', desc:'Reroutes patrols — they avoid this row/col for the run.'},
  FIREWALL: {icon:'▣',label:'FWALL',   color:'#ff4040', desc:'Raises alert unless breaker STR exceeds firewall level.'},
  TERMINAL: {icon:'⌨',label:'TERM',    color:'#80ff40', desc:'Reveals all COP locations and silences nearest one.'},
  ARCHIVE:  {icon:'◎',label:'ARCH',    color:'#ffa040', desc:'Historical data — sells for cred at exit, always identified.'},
  // v0.7.4 additions
  ROUTER:   {icon:'⇌',label:'ROUT',    color:'#40ddff', desc:'Network hub. Reduces all ICE STR by 1 for run. Reveals patrol paths.'},
  SENSOR:   {icon:'◉',label:'SENS',    color:'#ff6688', desc:'Early warning node. If not disabled, +20 trace spike at exit.'},
  SERVER:   {icon:'▣',label:'SERV',    color:'#aaffdd', desc:'Active host. Generates cred per tick while adjacent. Bonus on clean exit.'},
  NEXUS:    {icon:'⊛',label:'NEXUS',  color:'#ddaaff', desc:'Network nexus. Visiting completes a linked secondary node.'},
  BLACKSITE:{icon:'◼',label:'BSITE',  color:'#ff2020', desc:'Dark node. Hidden until adjacent. High rewards, always ICE-guarded.'},
  LAB:      {icon:'⚗',label:'LAB',     color:'#88ffaa', desc:'Research node. Grants partial blueprint progress.'},
};

// Hunter ICE varieties — assigned on spawn
const HUNTER_TYPES={
  standard:  {id:'standard',  name:'Hunter',      icon:'☠',  baseStr:3, retaliation:3, moveTicks:20, desc:'Tracks player position.'},
  bloodhound:{id:'bloodhound',name:'Bloodhound',  icon:'◈☠', baseStr:2, retaliation:2, moveTicks:12, onContact:'raiseAlert', desc:'Fast. Raises alert on contact.'},
  spike:     {id:'spike',     name:'Spike',       icon:'▲☠', baseStr:4, retaliation:5, moveTicks:30, onContact:'disableProg', desc:'Slow, devastating. Disables a program.'},
  ghost:     {id:'ghost',     name:'Ghost Hunter',icon:'◌☠', baseStr:2, retaliation:2, moveTicks:18, invisible:true, ignoreHide:true, desc:'Invisible until adjacent. Ignores stealth.'},
  pack:      {id:'pack',      name:'Pack Hunter', icon:'⊕☠', baseStr:2, retaliation:1, moveTicks:18, onContact:'spawn', desc:'Spawns a second Pack Hunter on first contact.'},
};

function pickHunterType(){
  const tier=curTier();
  // Standard at low alert/tier; nastier types unlock at yellow/red or high tier
  const pool=['standard'];
  if(S.alert>=1||tier>=4)pool.push('bloodhound');
  if(S.alert>=2||tier>=6)pool.push('spike','ghost');
  if(tier>=5)pool.push('pack');
  return pick(pool);
}
const FILE_TYPES=['CREDPACK','CORPDATA','KEYFILE','PAYLOAD','MANIFEST','SYSLOG','DISPLAY'];
// BLUEPRINT is a special drop type — not part of random file generation
const DS_FILE_TYPES=[...FILE_TYPES,'BLUEPRINT']; // datastores only, low chance
// Base cred value per file type. 0 = worthless (skip download)
const FILE_VALUE={CREDPACK:50,CORPDATA:40,KEYFILE:60,PAYLOAD:35,MANIFEST:15,SYSLOG:0,DISPLAY:25,BLUEPRINT:80};

// Tick system constants (at 10 ticks/second baseline)
// Alert pressure system (0-200 continuous, replaces integer 0/1/2)
const PRESSURE_GREEN   = 0;    // 0-49: Green
const PRESSURE_YELLOW  = 50;   // 50-149: Yellow
const PRESSURE_RED     = 150;  // 150+: Red
const PRESSURE_MAX     = 200;
const PRESSURE_PER_ALERT = 55; // raiseAlert(1) adds this much pressure

// Derived alert level from pressure
function pressureToAlert(p){
  if(p>=PRESSURE_RED)return 2;
  if(p>=PRESSURE_YELLOW)return 1;
  return 0;
}

const BASE_TICK_MS      = 100;  // 1 tick = 100ms
const BASE_MOVE_TICKS   = 20;   // movement: 2s baseline
const BASE_COMBAT_TICKS = 12;   // combat round: 1.2s baseline
const BASE_SCAN_TICKS   = 15;   // scan one file: 1.5s baseline
const BASE_DOWNLOAD_TICKS = 15; // download one file: 1.5s baseline
const BASE_DECRYPT_TICKS  = 15; // decrypt one file: 1.5s baseline

// Node interaction ticks — how long the player is stalled at each node type
// Applied in queueCellAction as a per-nodeType override
const NODE_INTERACT_TICKS = {
  // Instant feel — cosmetic/minor
  EMPTY:     0,    // no stall
  ENTRY:     0,
  RAM:       8,    // quick file grab
  IO:        8,    // port tap
  // Fast interactions
  RELAY:     12,   // map pulse — brief
  PROXY:     12,   // reroute — brief
  SENSOR:    15,   // disable sequence
  ROUTER:    18,   // network reroute
  // Standard interactions
  CPU:       20,   // full processing cycle
  GPU:       20,   // feed intercept
  TERMINAL:  25,   // COP sweep
  COP:       20,   // silence sequence
  NEXUS:     20,   // link resolution
  // Involved interactions
  SERVER:    25,   // tap and extract
  LAB:       30,   // research access
  ARCHIVE:   25,   // historical retrieval
  FIREWALL:  22,   // breach attempt
  VAULT:     35,   // locked extraction
  // Serious interactions
  BLACKSITE: 40,   // dark node — always dangerous, takes time
  DATASTORE: 0,    // datastore has its own queue-based timing
  EXIT:      0,    // FF handled separately
};
const BASE_SOOTHE_TICKS = 15;   // soothe cooldown: 1.5s baseline

// Tick reduction per tier (for breakers/programs)
const TIER_TICK_REDUCTION = {1:0, 2:2, 3:4};
// Deck speed bonus (movement ticks reduction)
const DECK_MOVE_BONUS = {basic:0, pro:2, mil:4, ghost:6};

const TRAPS={
  TRIPWIRE:  {id:'TRIPWIRE',  icon:'⚠', label:'TRIP', desc:'Alert +1',           color:'#ffaa20'},
  SHOCK:     {id:'SHOCK',     icon:'⚡', label:'SHCK', desc:'-2 INT, stun 3t',    color:'#ff4040'},
  TRACE:     {id:'TRACE',     icon:'◎', label:'TRCE', desc:'+30% trace',          color:'#8080ff'},
  ICE_SPAWN: {id:'ICE_SPAWN', icon:'☠', label:'ICSP', desc:'Spawns Hunter',       color:'#ff44aa'},
  DATA_BOMB: {id:'DATA_BOMB', icon:'◉', label:'DBMB', desc:'Destroys RAM file',   color:'#ff6644'},
  HONEYPOT:  {id:'HONEYPOT',  icon:'◉', label:'DATA', desc:'Fake datastore',      color:'#ff6644'},
};

// Reputation tiers per faction
const REP_TIERS=[
  {min:0,    name:'Unknown',  shopAccess:false, contractAccess:false},
  {min:100,  name:'Known',    shopAccess:true,  contractAccess:true},
  {min:500,  name:'Trusted',  shopAccess:true,  contractAccess:true},
  {min:1500, name:'Elite',    shopAccess:true,  contractAccess:true},
  {min:4000, name:'Legend',   shopAccess:true,  contractAccess:true},
];
const REP_PERK={
  corp:   'Elite: Trace decays passively. Legend: Start run with 0 trace always',
  crim:   'Elite: Alert raise -25% chance. Legend: Hunters move 25% slower',
  anarch: 'Elite: ICE STR -1 at start. Legend: ICE STR -2, traps never trigger',
  neutral:'Legend: All shop prices -20%',
};
const REP_CONFLICT={corp:'anarch', anarch:'corp'}; // gaining one loses small amount of other

// Attachment helpers
function attachSlots(){return hwdef()?.slots||1;}
function installedAttachments(){return (S.attachments||[]).map(a=>ATTACHMENTS[a.attachId]).filter(Boolean);}
function attachEffect(effect){return installedAttachments().filter(a=>a.effect===effect).reduce((sum,a)=>sum+(a.power||0),0);}
function canInstallAttach(attachId){
  if((S.attachments||[]).some(a=>a.attachId===attachId))return false; // already installed
  return (S.attachments||[]).length<attachSlots();
}
function installAttach(attachId,slot){
  if(!canInstallAttach(attachId))return false;
  S.attachments=S.attachments||[];
  S.attachments.push({slotIdx:slot,attachId});
  return true;
}
function removeAttach(attachId){
  S.attachments=(S.attachments||[]).filter(a=>a.attachId!==attachId);
}

function repTier(faction){
  const r=S.rep[faction]||0;
  let t=REP_TIERS[0];
  for(const tier of REP_TIERS){if(r>=tier.min)t=tier;}
  return t;
}
function repFloor(faction){
  // Rep can never drop below the minimum of the player's current tier
  return repTier(faction).min;
}
function repTierName(faction){return repTier(faction).name;}
function hasRepAccess(faction){return repTier(faction).shopAccess;}
function isElite(faction){return (S.rep[faction]||0)>=1500;}
function isLegend(faction){return (S.rep[faction]||0)>=4000;}
// Verb pools per faction — drives what kind of objectives contracts generate
// Each faction has verbs at diff tiers: basic (diff 1-2), advanced (diff 3-4), elite (diff 4+)
const CV={
  obtain:   {nodeTypes:['DATASTORE','RAM'],  action:'collect'},
  delete:   {nodeTypes:['DATASTORE'],        action:'delete'},
  exfil:    {nodeTypes:['DATASTORE'],        action:'collect_delete'},
  upload:   {nodeTypes:['DATASTORE'],        action:'upload'},
  activate: {nodeTypes:['IO'],               action:'activate'},
  modify:   {nodeTypes:['DATASTORE'],        action:'modify'},
  display:  {nodeTypes:['GPU'],              action:'display'},
  backdoor: {nodeTypes:['CPU'],              action:'backdoor'},
  destroy:  {nodeTypes:['COP','CPU','GPU','FIREWALL'],action:'destroy'},
  access:   {nodeTypes:['VAULT'],              action:'collect'},
  terminal: {nodeTypes:['TERMINAL'],           action:'activate'},
  archive:  {nodeTypes:['ARCHIVE'],            action:'collect'},
  // v0.7.4 additions
  intercept_relay:{nodeTypes:['RELAY','GPU'],    action:'display'},
  surveil:  {nodeTypes:['SENSOR'],               action:'activate'},
  route:    {nodeTypes:['ROUTER'],               action:'activate'},
  corrupt:  {nodeTypes:['DATASTORE','SERVER'],   action:'modify'},
  clone:    {nodeTypes:['DATASTORE'],            action:'collect'},
  burn:     {nodeTypes:['BLACKSITE','DATASTORE'],action:'collect_delete'},
  trace_back:{nodeTypes:['TERMINAL','ROUTER'],   action:'activate'},
  harvest:  {nodeTypes:['SERVER','LAB'],         action:'collect'},
};

// Faction contract verb pools by tier
// basic = diff 1-2 (Known), advanced = diff 3 (Trusted), elite = diff 4 (Elite)
// ── PARENT FACTION DEFINITIONS ───────────────────────────────────────────
// Sub-factions inherit parent verb pools but have unique names and modifiers
// Rep earned: subfaction gets full repGain, parent gets 15%

const PARENT_FACTIONS={
  corp:    {key:'corp',    name:'Corporate', color:'#6080c0', repConflict:'anarch'},
  crim:    {key:'crim',   name:'Criminal',  color:'#c08040', repConflict:null},
  anarch:  {key:'anarch', name:'Anarchist', color:'#c04040', repConflict:'corp'},
  neutral: {key:'neutral',name:'Neutral',   color:'#60a060', repConflict:null},
};

// ── SUB-FACTION DEFINITIONS ───────────────────────────────────────────────
const SUBFACTIONS={
  // ── CORPORATE (5) ───────────────────────────────────────────────────────
  axiom_biotech:{
    parent:'corp', name:'Axiom Biotech', color:'#5090e0',
    flavor:'CORPORATE',
    basic:['obtain','exfil','modify'],advanced:['exfil','modify','access'],elite:['backdoor','modify','exfil'],
    conditions:['stealth'],credMult:1.5,repMult:1.0,
    names:['Genome Retrieval','Bio-Data Extraction','Sequence Theft','Neural Archive Access',
           'Clone Record Purge','Phenotype Cover-Up','Stem Cell Heist','Axiom Audit'],
  },
  ironwall_sec:{
    parent:'corp', name:'Ironwall Security', color:'#4070c0',
    flavor:'CORPORATE',
    basic:['obtain','destroy','modify'],advanced:['backdoor','destroy','exfil'],elite:['backdoor','exfil','modify'],
    conditions:['speed','stealth'],credMult:1.4,repMult:1.0,
    names:['Security Breach Report','Counter-Intrusion Op','Threat Neutralization','Firewall Bypass',
           'Asset Protection Run','Hostile Audit','Breach & Sanitize','Network Hardening'],
  },
  silk_genomics:{
    parent:'corp', name:'Silk Genomics', color:'#8060d0',
    flavor:'CORPORATE',
    basic:['obtain','modify','access'],advanced:['exfil','access','display'],elite:['exfil','modify','backdoor'],
    conditions:['stealth'],credMult:1.4,repMult:1.0,
    names:['Identity Extraction','Genome Laundering','Silk Thread Op','Silent Acquisition',
           'Phenotype Cover','Clone Trace Purge','Biometric Theft','Quiet Heist'],
  },
  meridian_finance:{
    parent:'corp', name:'Meridian Finance', color:'#50a080',
    flavor:'CORPORATE',
    basic:['obtain','exfil','delete'],advanced:['exfil','modify','display'],elite:['backdoor','exfil','modify'],
    conditions:['stealth','speed'],credMult:1.6,repMult:1.0,
    names:['Ledger Extraction','Dark Pool Access','Financial Cover-Up','Asset Laundering',
           'Audit Trail Purge','Credit Flow Intercept','Offshore Data Run','Meridian Clean Sweep'],
  },
  vantage_media:{
    parent:'corp', name:'Vantage Media', color:'#6090b0',
    flavor:'CORPORATE',
    basic:['obtain','display','activate'],advanced:['display','exfil','backdoor'],elite:['display','backdoor','modify'],
    conditions:['speed'],credMult:1.3,repMult:1.0,
    names:['Signal Intercept','Broadcast Blackout','Media Suppression','Feed Hijack',
           'Archive Access','Surveillance Splice','Live Feed Exfil','Vantage Dark Op'],
  },
  // ── CRIMINAL (5) ────────────────────────────────────────────────────────
  runners_guild:{
    parent:'crim', name:"Runners' Guild", color:'#c09040',
    flavor:'CRIMINAL',
    basic:['obtain','delete','exfil'],advanced:['exfil','collect_delete','access'],elite:['exfil','collect_delete','backdoor'],
    conditions:['speed','witness'],credMult:1.2,repMult:1.1,
    names:['Quick Score','Runner Contract','Guild Job','Speed Run',
           'In-and-Out','Precision Lift','Timed Extraction','Guild Commission'],
  },
  fixer_network:{
    parent:'crim', name:'Fixer Network', color:'#b07030',
    flavor:'CRIMINAL',
    basic:['backdoor','obtain','activate'],advanced:['backdoor','exfil','access'],elite:['backdoor','collect_delete','exfil'],
    conditions:['stealth'],credMult:1.3,repMult:1.1,
    names:['Back Door Install','Network Plant','Fixer Special','Shadow Access',
           'Conduit Job','Broker Run','Off-Books Install','Fixer Arrangement'],
  },
  ghost_syndicate:{
    parent:'crim', name:'Ghost Syndicate', color:'#90a0c0',
    flavor:'CRIMINAL',
    basic:['obtain','access','exfil'],advanced:['access','exfil','collect_delete'],elite:['exfil','access','backdoor'],
    conditions:['stealth','witness'],credMult:1.4,repMult:1.1,
    names:['Ghost Protocol','Silent Lift','Phantom Job','Zero Trace Extraction',
           'Clean Sweep','Vault Ghost Run','Syndicate Sanctioned','No Witnesses'],
  },
  the_cartel:{
    parent:'crim', name:'The Cartel', color:'#c06020',
    flavor:'CRIMINAL',
    basic:['destroy','delete','obtain'],advanced:['destroy','collect_delete','terminal'],elite:['destroy','exfil','collect_delete'],
    conditions:['speed'],credMult:1.2,repMult:1.2,
    names:['Cartel Takedown','Hostile Strip','Asset Seizure','Cartel Enforcement',
           'Smash & Grab','Burn Job','Territory Run','Cartel Sanctioned Hit'],
  },
  deadcode:{
    parent:'crim', name:'Deadcode', color:'#80c060',
    flavor:'CRIMINAL',
    basic:['destroy','delete','backdoor'],advanced:['destroy','backdoor','collect_delete'],elite:['backdoor','destroy','exfil'],
    conditions:['speed'],credMult:1.1,repMult:1.2,
    names:['Code Kill','ICE Breaker Contract','System Burn','Deadcode Job',
           'Network Scorch','Logic Bomb Plant','Kill Switch','Deadcode Special'],
  },
  // ── ANARCHIST (5) ────────────────────────────────────────────────────────
  reclaim:{
    parent:'anarch', name:'Reclaim', color:'#d04040',
    flavor:'ANARCHIST',
    basic:['destroy','activate','backdoor'],advanced:['destroy','activate','archive'],elite:['destroy','backdoor','exfil'],
    conditions:[],credMult:0.9,repMult:1.5,
    names:['Corporate Takedown','Infrastructure Strike','Reclaim Op','Anti-Corp Action',
           'Exposure Run','Corporate Burn','Reclaim Sanction','Liberation Protocol'],
  },
  the_static:{
    parent:'anarch', name:'The Static', color:'#c03060',
    flavor:'ANARCHIST',
    basic:['destroy','delete','activate'],advanced:['destroy','backdoor','terminal'],elite:['backdoor','destroy','archive'],
    conditions:[],credMult:0.85,repMult:1.5,
    names:['Static Burst','Noise Injection','Grid Corruption','Chaos Protocol',
           'Signal Jam','The Static Job','System Noise','Cascade Burn'],
  },
  red_cell:{
    parent:'anarch', name:'Red Cell', color:'#e03030',
    flavor:'ANARCHIST',
    basic:['activate','terminal','backdoor'],advanced:['terminal','backdoor','destroy'],elite:['terminal','backdoor','archive'],
    conditions:[],credMult:0.9,repMult:1.6,
    names:['Red Cell Activation','System Takeover','Terminal Strike','Network Seize',
           'Red Protocol','Cell Op','Revolutionary Access','Takeover Run'],
  },
  null_signal:{
    parent:'anarch', name:'Null Signal', color:'#a040c0',
    flavor:'ANARCHIST',
    basic:['archive','obtain','activate'],advanced:['archive','exfil','backdoor'],elite:['archive','backdoor','exfil'],
    conditions:[],credMult:1.0,repMult:1.4,
    names:['Signal Leak','Whistleblower Run','Data Expose','Null Job',
           'Archive Dump','Truth Protocol','Signal Null','Expose Operation'],
  },
  ironclad:{
    parent:'anarch', name:'Ironclad', color:'#b05020',
    flavor:'ANARCHIST',
    basic:['destroy','terminal','delete'],advanced:['destroy','terminal','backdoor'],elite:['destroy','backdoor','collect_delete'],
    conditions:[],credMult:0.9,repMult:1.5,
    names:['Surveillance Burn','COP Takedown','Ironclad Strike','Anti-Surveillance Op',
           'Camera Kill','Grid Blind','Iron Protocol','Clad Job'],
  },
  // ── NEUTRAL (5) ──────────────────────────────────────────────────────────
  freelance:{
    parent:'neutral', name:'Freelance', color:'#60a060',
    flavor:'NEUTRAL',
    basic:['obtain','delete','activate','display'],advanced:['obtain','exfil','activate'],elite:['exfil','backdoor','obtain'],
    conditions:[],credMult:1.0,repMult:0.5,
    names:['Freelance Job','Open Contract','Anonymous Op','No Questions Asked',
           'Standard Run','Basic Extraction','Plain Job','Unnamed Contract'],
  },
  data_brokers:{
    parent:'neutral', name:'Data Brokers', color:'#70b070',
    flavor:'NEUTRAL',
    basic:['obtain','archive','access'],advanced:['obtain','exfil','archive'],elite:['exfil','access','archive'],
    conditions:[],credMult:1.1,repMult:0.5,
    names:['Data Package','Broker Acquisition','File Run','Archive Sweep',
           'Data Drop','Broker Special','Intelligence Package','Bulk Extraction'],
  },
  mesh_collective:{
    parent:'neutral', name:'The Mesh Collective', color:'#40c0c0',
    flavor:'NEUTRAL',
    basic:['activate','backdoor','obtain'],advanced:['backdoor','activate','archive'],elite:['backdoor','archive','exfil'],
    conditions:[],credMult:0.9,repMult:0.7,
    names:['Mesh Protocol','Collective Run','Network Maintenance','Mesh Job',
           'Relay Access','CPU Reclamation','Collective Op','Mesh Sanction'],
  },
  shadow_market:{
    parent:'neutral', name:'Shadow Market', color:'#909040',
    flavor:'NEUTRAL',
    basic:['obtain','delete','exfil'],advanced:['exfil','access','collect_delete'],elite:['collect_delete','exfil','backdoor'],
    conditions:[],credMult:1.2,repMult:0.5,
    names:['Shadow Deal','Market Run','Off-Books Job','Grey Market Op',
           'Shadow Acquisition','Unmarked Contract','Black Ledger Run','Market Special'],
  },
  cipher:{
    parent:'neutral', name:'Cipher', color:'#8080c0',
    flavor:'NEUTRAL',
    basic:['obtain','modify','activate'],advanced:['modify','exfil','backdoor'],elite:['backdoor','modify','exfil'],
    conditions:['stealth'],credMult:1.0,repMult:0.6,
    names:['Cipher Job','Unknown Origin','Encrypted Contract','Zero Attribution',
           'Null Source Op','Cipher Protocol','Encoded Run','Attribution Void'],
  },
};

// Sub-faction list by parent for quick lookup
const SUBFAC_BY_PARENT={
  corp:   ['axiom_biotech','ironwall_sec','silk_genomics','meridian_finance','vantage_media'],
  crim:   ['runners_guild','fixer_network','ghost_syndicate','the_cartel','deadcode'],
  anarch: ['reclaim','the_static','red_cell','null_signal','ironclad'],
  neutral:['freelance','data_brokers','mesh_collective','shadow_market','cipher'],
  gov:    ['bureau_intel','enforcement_div','regulatory_net'],
  ai:     ['pattern_echo','signal_remnant','deep_process'],
};

// Legacy FACTION_VERBS shim — genContract uses subfactions directly now
const FACTION_VERBS={
  CORPORATE:{basic:['obtain','exfil','modify'],advanced:['exfil','modify','backdoor'],elite:['backdoor','modify','exfil'],conditions:['stealth','speed'],credMult:1.4,repMult:1.0,names:[]},
  CRIMINAL: {basic:['obtain','delete','destroy'],advanced:['destroy','collect_delete','exfil'],elite:['destroy','exfil','backdoor'],conditions:['speed'],credMult:1.2,repMult:1.1,names:[]},
  ANARCHIST:{basic:['destroy','activate','backdoor'],advanced:['backdoor','destroy','activate'],elite:['backdoor','destroy','exfil'],conditions:[],credMult:0.9,repMult:1.4,names:[]},
  NEUTRAL:  {basic:['obtain','delete','activate'],advanced:['obtain','exfil','activate'],elite:['exfil','backdoor','obtain'],conditions:[],credMult:1.0,repMult:0.5,names:[]},
};
const PDEFS=[

  // ── NEW BREAKER FAMILIES ─────────────────────────────────────────────────
  // Slicer — PROBE + TRACER (sensor/trace ICE)
  {id:'slicer_1',name:'Slicer v1',icon:'◌',cat:'breaker',iceTypes:['PROBE','TRACER'],tier:1,str:3,mem:1,cost:90,faction:'corp',desc:'Breaks Probe and Tracer ICE. STR 3.'},
  {id:'slicer_2',name:'Slicer v2',icon:'◌',cat:'breaker',iceTypes:['PROBE','TRACER'],tier:2,str:7,mem:2,cost:350,faction:'corp',desc:'Breaks Probe and Tracer ICE. STR 7.'},
  {id:'slicer_3',name:'Slicer v3',icon:'◌',cat:'breaker',iceTypes:['PROBE','TRACER'],tier:3,str:12,mem:3,cost:0,faction:'corp',desc:'Breaks Probe and Tracer ICE. STR 12.',craftable:true},

  // Hammer — BLACK_ICE + CASCADE (destructive ICE)
  {id:'hammer_1',name:'Hammer v1',icon:'⬢',cat:'breaker',iceTypes:['BLACK_ICE','CASCADE'],tier:1,str:3,mem:2,cost:120,faction:'anarch',desc:'Breaks Black ICE and Cascade. STR 3.'},
  {id:'hammer_2',name:'Hammer v2',icon:'⬢',cat:'breaker',iceTypes:['BLACK_ICE','CASCADE'],tier:2,str:8,mem:3,cost:600,faction:'anarch',desc:'Breaks Black ICE and Cascade. STR 8.'},
  {id:'hammer_3',name:'Hammer v3',icon:'⬢',cat:'breaker',iceTypes:['BLACK_ICE','CASCADE'],tier:3,str:14,mem:4,cost:0,faction:'anarch',desc:'Breaks Black ICE and Cascade. STR 14.',craftable:true},

  // Anchor — TAR_PIT (movement/slow ICE)
  {id:'anchor_1',name:'Anchor v1',icon:'⬟',cat:'breaker',iceTypes:['TAR_PIT'],tier:1,str:3,mem:1,cost:80,faction:'neutral',desc:'Breaks Tar Pit ICE. STR 3.'},
  {id:'anchor_2',name:'Anchor v2',icon:'⬟',cat:'breaker',iceTypes:['TAR_PIT'],tier:2,str:8,mem:2,cost:320,faction:'neutral',desc:'Breaks Tar Pit ICE. STR 8.'},
  {id:'anchor_3',name:'Anchor v3',icon:'⬟',cat:'breaker',iceTypes:['TAR_PIT'],tier:3,str:14,mem:3,cost:0,faction:'neutral',desc:'Breaks Tar Pit ICE. STR 14.',craftable:true},

  // Phantom — MIMIC (disguised ICE)
  {id:'phantom_1',name:'Phantom v1',icon:'⊘',cat:'breaker',iceTypes:['MIMIC'],tier:2,str:5,mem:2,cost:400,faction:'crim',desc:'Breaks Mimic ICE — reveals disguise before combat. STR 5.'},
  {id:'phantom_2',name:'Phantom v2',icon:'⊘',cat:'breaker',iceTypes:['MIMIC'],tier:3,str:12,mem:4,cost:0,faction:'crim',desc:'Breaks Mimic ICE. STR 12.',craftable:true},

  // Titan — KRAKEN + ARCHITECT (heavy structural ICE)
  {id:'titan_1',name:'Titan v1',icon:'⊛',cat:'breaker',iceTypes:['KRAKEN','ARCHITECT'],tier:3,str:8,mem:4,cost:1200,faction:'corp',desc:'Breaks Kraken and Architect ICE. STR 8.'},
  {id:'titan_2',name:'Titan v2',icon:'⊛',cat:'breaker',iceTypes:['KRAKEN','ARCHITECT'],tier:4,str:16,mem:6,cost:0,faction:'corp',desc:'Breaks Kraken and Architect ICE. STR 16.',craftable:true},

  // Void — LEECH + OMEGA (extreme drain ICE)
  {id:'void_1',name:'Void v1',icon:'◼',cat:'breaker',iceTypes:['LEECH','OMEGA'],tier:4,str:10,mem:6,cost:3000,faction:'anarch',desc:'Breaks Leech and Omega ICE. STR 10.'},
  {id:'void_2',name:'Void v2',icon:'◼',cat:'breaker',iceTypes:['LEECH','OMEGA'],tier:5,str:20,mem:10,cost:0,faction:'anarch',desc:'Breaks Leech and Omega ICE. STR 20.',craftable:true},

  {id:'fracter_1',name:'Fracter Mk1',icon:'⬡',cat:'breaker',iceTypes:['BARRIER'],tier:1,str:2,mem:1,cost:80,faction:'gen',desc:'Breaks Barrier ICE. STR 2.'},
  {id:'fracter_2',name:'Fracter Mk2',icon:'⬡',cat:'breaker',iceTypes:['BARRIER'],tier:2,str:5,mem:2,cost:300,faction:'gen',desc:'Breaks Barrier ICE. STR 5.'},
  {id:'fracter_3',minMeshDist:4,name:'Fracter Mk3',icon:'⬡',cat:'breaker',iceTypes:['BARRIER'],tier:3,str:9,mem:3,cost:0,faction:'gen',desc:'Breaks Barrier ICE. STR 9.',craftable:true},
  {id:'decoder_1',name:'Decoder Mk1',icon:'◇',cat:'breaker',iceTypes:['GATEKEEPER'],tier:1,str:2,mem:1,cost:80,faction:'gen',desc:'Breaks Gatekeeper. STR 2.'},
  {id:'decoder_2',name:'Decoder Mk2',icon:'◇',cat:'breaker',iceTypes:['GATEKEEPER'],tier:2,str:5,mem:2,cost:300,faction:'corp',desc:'Breaks Gatekeeper. STR 5.'},
  {id:'decoder_3',minMeshDist:4,name:'Decoder Mk3',icon:'◇',cat:'breaker',iceTypes:['GATEKEEPER'],tier:3,str:9,mem:3,cost:0,faction:'corp',desc:'Breaks Gatekeeper. STR 9.',craftable:true},
  {id:'killer_1',name:'Killer Mk1',icon:'◈',cat:'breaker',iceTypes:['GUARDIAN','HUNTER'],tier:1,str:2,mem:1,cost:80,faction:'gen',desc:'Breaks Guardian/Hunter. STR 2.'},
  {id:'killer_2',name:'Killer Mk2',icon:'◈',cat:'breaker',iceTypes:['GUARDIAN','HUNTER'],tier:2,str:5,mem:2,cost:350,faction:'crim',desc:'Breaks Guardian/Hunter. STR 5.'},
  {id:'killer_3',minMeshDist:4,name:'Killer Mk3',icon:'◈',cat:'breaker',iceTypes:['GUARDIAN','HUNTER'],tier:3,str:9,mem:3,cost:0,faction:'crim',desc:'Breaks Guardian/Hunter. STR 9.',craftable:true},
  {id:'hide_1',name:'Hide v1',icon:'◌',cat:'utility',tier:1,mem:1,cost:60,faction:'gen',passive:true,effect:'stealth',power:1,desc:'Patrol detection -1. Barrier sneak assist.'},
  {id:'hide_2',name:'Hide v2',icon:'◌',cat:'utility',tier:2,mem:2,cost:220,faction:'anarch',passive:true,effect:'stealth',power:2,desc:'Detection -2. Stronger sneak.'},
  {id:'deceive_1',name:'Deceive v1',icon:'⊘',cat:'utility',tier:1,mem:1,cost:70,faction:'gen',passive:true,effect:'deceive',desc:'Auto-responds all Patrol queries (passive).'},
  {id:'deceive_2',name:'Deceive v2',icon:'⊘',cat:'utility',tier:2,mem:2,cost:250,faction:'crim',passive:true,effect:'deceive',desc:'Auto-responds all Patrol queries + spoofs identity (passive).'},
  {id:'scan_1',name:'Scanner v1',icon:'⊙',cat:'utility',tier:1,mem:1,cost:50,faction:'gen',passive:false,effect:'scan',desc:'Scans current cell.'},
  {id:'scan_2',name:'Scanner v2',icon:'⊙',cat:'utility',tier:2,mem:1,cost:180,faction:'gen',passive:false,effect:'scan',desc:'Scans + reveals adjacent cells.'},
  {id:'zap_1',name:'Zap v1',icon:'⚡',cat:'utility',tier:1,mem:1,cost:90,faction:'anarch',passive:true,effect:'zap',power:1,desc:'Pre-combat -1 ICE STR (passive).'}, 
  {id:'zap_2',name:'Zap v2',icon:'⚡',cat:'utility',tier:2,mem:2,cost:300,faction:'anarch',passive:true,effect:'zap',power:2,desc:'Pre-combat -2 ICE STR (passive).'}, 
  {id:'decrypt_1',name:'Decrypt v1',icon:'⊛',cat:'utility',tier:1,mem:1,cost:60,faction:'gen',passive:false,effect:'decrypt',desc:'Decrypts 1 encrypted file.'},
  {id:'decrypt_2',name:'Decrypt v2',icon:'⊛',cat:'utility',tier:2,mem:1,cost:200,faction:'corp',passive:true,effect:'decrypt',desc:'Auto-decrypts files on harvest.'},
  {id:'soothe_1',name:'Soothe v1',icon:'≋',cat:'utility',tier:1,mem:1,cost:80,faction:'gen',passive:true,effect:'soothe',pressureRate:1,urgentRate:2,desc:'Reduces alert pressure. −1/tick idle, −2 when raised.'},
  {id:'soothe_2',name:'Soothe v2',icon:'≋',cat:'utility',tier:2,mem:2,cost:280,faction:'corp',passive:true,effect:'soothe',pressureRate:2,urgentRate:4,desc:'Reduces alert pressure. −2/tick idle, −4 when raised.'},
  {id:'intercept',name:'Intercept',icon:'▣',cat:'utility',tier:2,mem:2,cost:350,faction:'anarch',passive:false,effect:'intercept',desc:'Required for GPU display contracts.'},
  {id:'armor_1',name:'Armor v1',icon:'◫',cat:'utility',tier:1,mem:2,cost:120,faction:'gen',passive:true,effect:'armor',power:1,desc:'Absorbs 1 retaliation hit per combat.',prestigeReq:1},
  {id:'spoof_1',name:'Spoof v1',icon:'⊕',cat:'utility',tier:1,mem:1,cost:100,faction:'crim',passive:true,effect:'spoof',desc:'Fakes node identity to Patrol queries.',prestigeReq:2},
  {id:'overclock',name:'Overclock',icon:'⚙',cat:'utility',tier:2,mem:2,cost:200,faction:'anarch',passive:true,effect:'overclock',power:2,desc:'Breaker STR +2 passive every combat.',prestigeReq:3},
  {id:'ghost_p',name:'Ghost',icon:'◌',cat:'utility',tier:2,mem:2,cost:250,faction:'gen',passive:true,effect:'ghost',power:10,desc:'Full invisibility — nullifies Patrol.',prestigeReq:4},
  {id:'polymorph',     name:'Polymorph',    icon:'⟁',cat:'utility',tier:3,mem:3,cost:400,  faction:'gen',  passive:false,effect:'polymorph',  desc:'Swap one installed program mid-run (once per cell).',prestigeReq:5},
  {id:'switchblade',   name:'Switchblade',  icon:'⚔',cat:'utility',tier:3,mem:2,cost:500,  faction:'crim', passive:true, effect:'switchblade',desc:'Auto-selects best breaker before each combat.',prestigeReq:6},
  {id:'cloak',         name:'Cloak',        icon:'◌',cat:'utility',tier:3,mem:2,cost:600,  faction:'gen',  passive:true, effect:'cloak',      desc:'First combat this run: guaranteed sneak.',prestigeReq:7},
  {id:'overclock_2',minMeshDist:4,   name:'Overclock v2', icon:'⚙',cat:'utility',tier:3,mem:5,cost:800,  faction:'anarch',passive:true,effect:'overclock2', power:4,desc:'Breaker STR +4 passive every combat.',prestigeReq:8},
  {id:'daemon',        name:'Daemon',       icon:'◈',cat:'utility',tier:3,mem:3,cost:1000, faction:'gen',  passive:true, effect:'daemon',     power:1,desc:'+1 STR to all breakers passively. Stacks.',prestigeReq:9},
  {id:'polymorph_2',   name:'Polymorph v2', icon:'⟁',cat:'utility',tier:4,mem:6,cost:2000, faction:'gen',  passive:false,effect:'polymorph2', desc:'Swap any programs freely mid-run.',prestigeReq:10},
];
// Crafting: time (seconds) + cred cost. No ingredient consumption.

// ── FACTION INVESTMENTS ───────────────────────────────────────────────────
// Passive income between runs — purchased with cred, generate income over time
const INVESTMENTS = [
  {id:'inv_corp_feed',     name:'Corp Data Feed',    faction:'corp',    cost:2000,  income:15,  interval:30,  minRep:100,  desc:'Corporate market data. +15₵/30s.'},
  {id:'inv_crim_cut',      name:'Criminal Cut',      faction:'crim',    cost:3000,  income:25,  interval:30,  minRep:100,  desc:'Percentage of black market trades. +25₵/30s.'},
  {id:'inv_anarch_relay',  name:'Anarch Relay Node', faction:'anarch',  cost:4000,  income:20,  interval:20,  minRep:250,  desc:'Relay access fees. +20₵/20s.'},
  {id:'inv_neutral_escrow',name:'Neutral Escrow',    faction:'neutral', cost:5000,  income:40,  interval:45,  minRep:100,  desc:'Escrow service cut. +40₵/45s.'},
  {id:'inv_corp_feed2',    name:'Corp Premium Feed',  faction:'corp',   cost:12000, income:60,  interval:30,  minRep:500,  desc:'High-frequency trading data. +60₵/30s.'},
  {id:'inv_crim_network',  name:'Criminal Network',   faction:'crim',   cost:15000, income:80,  interval:25,  minRep:500,  desc:'Full crime syndicate revenue share. +80₵/25s.'},
  {id:'inv_anarch_mesh',   name:'Anarch Mesh Node',   faction:'anarch', cost:20000, income:100, interval:20,  minRep:500,  desc:'Deep mesh relay network. +100₵/20s.'},
  {id:'inv_gov_contract',  name:'Gov Standing Contract',faction:'gov',  cost:8000,  income:50,  interval:40,  minRep:100,  desc:'Government maintenance retainer. +50₵/40s. Requires dist 16+.', minDist:16},
];

// ── CHARACTER STATS ──────────────────────────────────────────────────────
// Stats grow by spending XP. Deck hardware adds bonuses on top.
// Diminishing returns: cost = base_cost * (1 + current_level * 0.5)

const CHAR_STATS = {
  neural_buffer: {
    id:'neural_buffer', name:'Neural Buffer', icon:'▦',
    desc:'Raw processing capacity. Increases max RAM for programs.',
    color:'#40aaff',
    baseCost: 50,
    effect: (lvl) => ({ ramBonus: lvl * 2 }),
    displayEffect: (lvl) => `+${lvl*2} RAM`,
  },
  reflex: {
    id:'reflex', name:'Reflex', icon:'⚡',
    desc:'Reaction speed in the mesh. Reduces movement and action ticks.',
    color:'#ffdd40',
    baseCost: 60,
    effect: (lvl) => ({ tickReduction: Math.floor(lvl * 0.4) }),
    displayEffect: (lvl) => `-${Math.floor(lvl*0.4)} ticks/move`,
  },
  stealth: {
    id:'stealth', name:'Stealth', icon:'◌',
    desc:'Ability to stay dark. Increases pressure decay and Hide effectiveness.',
    color:'#8060d0',
    baseCost: 55,
    effect: (lvl) => ({ pressureDecayBonus: lvl * 2, hideBonus: Math.floor(lvl * 0.3) }),
    displayEffect: (lvl) => `+${lvl*2} pressure decay, +${Math.floor(lvl*0.3)} Hide`,
  },
  integrity: {
    id:'integrity', name:'Integrity', icon:'◈',
    desc:'Neural resilience. Increases max integrity independent of deck.',
    color:'#40ff80',
    baseCost: 65,
    effect: (lvl) => ({ intBonus: lvl * 3 }),
    displayEffect: (lvl) => `+${lvl*3} max INT`,
  },
  trace_resist: {
    id:'trace_resist', name:'Trace Resist', icon:'◎',
    desc:'Ability to mask identity. Slows trace accumulation and raises trace cap.',
    color:'#ff8040',
    baseCost: 55,
    effect: (lvl) => ({ traceResist: lvl * 3, traceCapBonus: lvl * 2 }),
    displayEffect: (lvl) => `-${lvl*3}% trace gain, +${lvl*2}% cap`,
  },
  intrusion: {
    id:'intrusion', name:'Intrusion', icon:'⬡',
    desc:'Breaker efficiency. Adds flat STR bonus to all breakers against ICE.',
    color:'#c04040',
    baseCost: 70,
    effect: (lvl) => ({ breakerBonus: lvl }),
    displayEffect: (lvl) => `+${lvl} all breaker STR`,
  },
};

const CHAR_STAT_KEYS = Object.keys(CHAR_STATS);

// Cost to raise a stat from its current level by 1
function statUpgradeCost(statId, currentLevel){
  const base = CHAR_STATS[statId]?.baseCost || 50;
  // Levels 0-19: soft diminishing returns (base * 1 + lvl * 0.5)
  // Level 20+:   each additional level costs 4× the previous level's cost
  if(currentLevel < 20){
    return Math.floor(base * (1 + currentLevel * 0.5));
  } else {
    // Cost at level 19 (the last pre-20 cost)
    const costAt19 = Math.floor(base * (1 + 19 * 0.5));
    // Each level past 20 multiplies by 4
    return Math.floor(costAt19 * Math.pow(4, currentLevel - 19));
  }
}

// Get effective stat value (character + deck bonus)
function charStat(statId){
  const lvl = S.charStats?.[statId] || 0;
  return lvl;
}

// Get total effect of a stat including level
function statEffect(statId){
  const lvl = charStat(statId);
  return CHAR_STATS[statId]?.effect(lvl) || {};
}

// Combined character bonus to RAM (character + deck + attachments)
function charRamBonus(){ return statEffect('neural_buffer').ramBonus || 0; }
function charIntBonus(){ return statEffect('integrity').intBonus || 0; }
function charBreakerBonus(){ return statEffect('intrusion').breakerBonus || 0; }
function charTraceResist(){ return (statEffect('trace_resist').traceResist||0)+(typeof getDeckCraftStat==='function'?getDeckCraftStat('traceResist'):0); }
function charTraceCapBonus(){ return statEffect('trace_resist').traceCapBonus || 0; }
function charPressureDecayBonus(){ return statEffect('stealth').pressureDecayBonus || 0; }
function charTickReduction(){ return statEffect('reflex').tickReduction || 0; }

const BLUEPRINTS=[
  // Tier 1-3 programs (always available)
  {id:'bp_f3',  name:'Fracter Mk3',   result:'fracter_3', craftTime:180, credCost:400},
  {id:'bp_d3',  name:'Decoder Mk3',   result:'decoder_3', craftTime:180, credCost:400},
  {id:'bp_k3',  name:'Killer Mk3',    result:'killer_3',  craftTime:180, credCost:450},
  {id:'bp_h2',  name:'Hide v2',       result:'hide_2',    craftTime:90,  credCost:150},
  {id:'bp_d2',  name:'Deceive v2',    result:'deceive_2', craftTime:90,  credCost:180},
  {id:'bp_z2',  name:'Zap v2',        result:'zap_2',     craftTime:120, credCost:250},
  {id:'bp_oc',  name:'Overclock',     result:'overclock', craftTime:150, credCost:350},
  {id:'bp_int', name:'Intercept',     result:'intercept', craftTime:120, credCost:300},
  {id:'bp_dc1', name:'Decrypt v1',    result:'decrypt_1', craftTime:60,  credCost:80},
  // New breaker family blueprints
  {id:'bp_sl3', name:'Slicer v3',   result:'slicer_3',  craftTime:180, credCost:450},
  {id:'bp_hm3', name:'Hammer v3',   result:'hammer_3',  craftTime:200, credCost:500},
  {id:'bp_anc3',name:'Anchor v3',   result:'anchor_3',  craftTime:160, credCost:400},
  {id:'bp_ph2', name:'Phantom v2',  result:'phantom_2', craftTime:240, credCost:800},
  {id:'bp_tt2', name:'Titan v2',    result:'titan_2',   craftTime:300, credCost:1200},
  {id:'bp_vd2', name:'Void v2',     result:'void_2',    craftTime:400, credCost:2500},
  {id:'bp_dc2', name:'Decrypt v2',    result:'decrypt_2', craftTime:120, credCost:220},
  // Tier 4 programs (Prestige 1)
  {id:'bp_f4',  name:'Fracter Mk4',   result:'fracter_4', craftTime:600,  credCost:1600, prestigeReq:1},
  {id:'bp_d4',  name:'Decoder Mk4',   result:'decoder_4', craftTime:600,  credCost:1600, prestigeReq:1},
  {id:'bp_k4',  name:'Killer Mk4',    result:'killer_4',  craftTime:600,  credCost:1800, prestigeReq:1},
  {id:'bp_s3',  name:'Soothe v3',     result:'soothe_3',  craftTime:400,  credCost:1000, prestigeReq:1},
  {id:'bp_z3',  name:'Zap v3',        result:'zap_3',     craftTime:500,  credCost:1300, prestigeReq:1},
  // Tier 5 programs (Prestige 3)
  {id:'bp_f5',  name:'Fracter Mk5',   result:'fracter_5', craftTime:1800, credCost:4500, prestigeReq:3},
  {id:'bp_d5',  name:'Decoder Mk5',   result:'decoder_5', craftTime:1800, credCost:4500, prestigeReq:3},
  {id:'bp_k5',  name:'Killer Mk5',    result:'killer_5',  craftTime:1800, credCost:5000, prestigeReq:3},
  {id:'bp_h3',  name:'Hide v3',       result:'hide_3',    craftTime:1200, credCost:2800, prestigeReq:2},
  {id:'bp_dc3', name:'Deceive v3',    result:'deceive_3', craftTime:1200, credCost:2300, prestigeReq:2},
  {id:'bp_a2',  name:'Armor v2',      result:'armor_2',   craftTime:900,  credCost:1800, prestigeReq:2},
  // Tier 6 programs (Prestige 5) — long craft, expensive
  {id:'bp_f6',  name:'Fracter Mk6',   result:'fracter_6', craftTime:7200, credCost:18000, prestigeReq:5},
  {id:'bp_d6',  name:'Decoder Mk6',   result:'decoder_6', craftTime:7200, credCost:18000, prestigeReq:5},
  {id:'bp_k6',  name:'Killer Mk6',    result:'killer_6',  craftTime:7200, credCost:20000, prestigeReq:5},
  // Mythic decks (Prestige 4) — massive credit sink
  {id:'bp_haas_mythic',    name:'Hexfield Mythic',  result:'haas_mythic',    craftTime:14400, credCost:80000, prestigeReq:4, isDeck:true},
  {id:'bp_weyland_mythic', name:'Ironwall Mythic',       result:'weyland_mythic', craftTime:14400, credCost:80000, prestigeReq:4, isDeck:true},
  {id:'bp_jinteki_mythic', name:'Silk Corp Mythic',       result:'jinteki_mythic', craftTime:14400, credCost:80000, prestigeReq:4, isDeck:true},
  {id:'bp_nbn_mythic',     name:'Vantage Mythic',           result:'nbn_mythic',     craftTime:14400, credCost:80000, prestigeReq:4, isDeck:true},
  {id:'bp_novatek_mythic', name:'Novatek Mythic',       result:'novatek_mythic', craftTime:14400, credCost:80000, prestigeReq:4, isDeck:true},
  // Prestige 6-10 programs (craft only)
  {id:'bp_sw',   name:'Switchblade',   result:'switchblade',  craftTime:3600,  credCost:8000,  prestigeReq:6},
  {id:'bp_cl',   name:'Cloak',         result:'cloak',        craftTime:3600,  credCost:10000, prestigeReq:7},
  {id:'bp_oc2',  name:'Overclock v2',  result:'overclock_2',  craftTime:7200,  credCost:20000, prestigeReq:8},
  {id:'bp_dm',   name:'Daemon',        result:'daemon',       craftTime:7200,  credCost:25000, prestigeReq:9},
  {id:'bp_pm2',  name:'Polymorph v2',  result:'polymorph_2',  craftTime:14400, credCost:50000, prestigeReq:10},
];
// Full pool of items available per faction (source of truth for rotation)
// Deck market alignment: manufacturer → faction shop
// ── OFF-GRID OPERATIONS ───────────────────────────────────────────────────
const OPS={
  // Intelligence
  grid_scan:    {id:'grid_scan',    cat:'intel',   name:'Grid Scan',       icon:'⊙', cost:200,  time:15,  repReq:0,   desc:'Reveals all node types on next grid',         effect:'intel_nodes'},
  ice_profile:  {id:'ice_profile',  cat:'intel',   name:'ICE Profile',     icon:'⬡', cost:350,  time:30,  repReq:0,   desc:'Reveals all ICE types + STR on next grid',    effect:'intel_ice'},
  trap_sweep:   {id:'trap_sweep',   cat:'intel',   name:'Trap Sweep',      icon:'⚠', cost:250,  time:20,  repReq:0,   desc:'Reveals all traps on next grid',              effect:'intel_traps'},
  full_intel:   {id:'full_intel',   cat:'intel',   name:'Full Intel',      icon:'◈', cost:700,  time:45,  repReq:100,  desc:'Nodes + ICE + traps revealed',                effect:'intel_full'},
  // Network
  cop_bribe:    {id:'cop_bribe',    cat:'network', name:'COP Bribe',       icon:'⬟', cost:400,  time:0,   repReq:0,   desc:'One COP starts silenced next run',            effect:'net_cop'},
  trace_ghost:  {id:'trace_ghost',  cat:'network', name:'Trace Ghost',     icon:'◎', cost:300,  time:15,  repReq:0,   desc:'Start next run -30% trace',                   effect:'net_trace'},
  alert_suppress:{id:'alert_suppress',cat:'network',name:'Alert Suppress', icon:'⚠', cost:500,  time:30,  repReq:100,  desc:'First alert raise on next run ignored',        effect:'net_alert'},
  backdoor_plant:{id:'backdoor_plant',cat:'network',name:'Backdoor Plant', icon:'⤵', cost:600,  time:45,  repReq:500, desc:'Start at random interior node next run',       effect:'net_backdoor'},
  // Signal (glitch zone operations — available at dist 16+)
  freq_mask:    {id:'freq_mask',     cat:'signal',  name:'Freq Mask',       icon:'◌', cost:400,  time:20,  repReq:0,   minDist:16, desc:'−2 to all ICE STR in glitch zones next run',    effect:'sig_freq'},
  gov_clearance:{id:'gov_clearance', cat:'signal',  name:'Gov Clearance',   icon:'◎', cost:600,  time:30,  repReq:100, minDist:16, desc:'+50 rep with dominant government next run',      effect:'sig_gov'},
  signal_tap:   {id:'signal_tap',    cat:'signal',  name:'Signal Tap',      icon:'⊛', cost:350,  time:25,  repReq:0,   minDist:16, desc:'+20% cred from contracts next run',              effect:'sig_cred'},
  mesh_anchor:  {id:'mesh_anchor',   cat:'signal',  name:'Mesh Anchor',     icon:'⬡', cost:500,  time:0,   repReq:500, minDist:24, desc:'Reduce glitch trace penalty by 50% next run',   effect:'sig_trace'},
  // Maintenance
  integrity_patch:{id:'integrity_patch',cat:'maint',name:'Integrity Patch',icon:'◫', cost:150,  time:0,   repReq:0,   desc:'Restore 1 permanent integrity loss',          effect:'maint_int', perUnit:true},
  prog_defrag:  {id:'prog_defrag',  cat:'maint',   name:'Program Defrag',  icon:'⊛', cost:200,  time:15,  repReq:0,   desc:'Clear all Guardian-disabled programs',        effect:'maint_defrag'},
  trace_scrub:  {id:'trace_scrub_op',cat:'maint',  name:'Trace Scrub',    icon:'◌', cost:200,  time:0,   repReq:0,   desc:'Remove 20% carry-over trace',                 effect:'maint_trace'},
};
const OPS_BY_CAT={
  intel: ['grid_scan','ice_profile','trap_sweep','full_intel'],
  network:['cop_bribe','trace_ghost','alert_suppress','backdoor_plant'],
  signal: ['freq_mask','gov_clearance','signal_tap','mesh_anchor'],
  maint: ['integrity_patch','prog_defrag','trace_scrub'],
};

const DECK_MFR_FACTION={
  haas:'corp', weyland:'corp',
  jinteki:'crim', nbn:'gen',
  novatek:'anarch',
};


// ── NET MARKET ────────────────────────────────────────────────────────────
// Each faction offers a curated selection of items scaled to mesh distance.
// Items are deterministic per company (seeded by company key).
// Stats and prices scale with mesh distance.

const NET_MARKET_BY_FACTION = {
  corp:    { programs:['decoder_1','decoder_2','decoder_3','slicer_1','slicer_2','slicer_3','titan_1','soothe_1','soothe_2','soothe_3','scan_2','scan_3','decrypt_1','decrypt_2','armor_1','armor_2','spoof_1'],
             attachments:['ram_chip','ram_chip_2','ram_chip_3','trace_filter','neural_buf','neural_buf2'],
             decks:['haas','nbn'] },
  crim:    { programs:['killer_1','killer_2','killer_3','phantom_1','phantom_2','deceive_1','deceive_2','ghost_p','hide_1','hide_2','switchblade','polymorph_1'],
             attachments:['storage_chip','storage_chip_2','storage_chip_3','trace_filter','coprocessor'],
             decks:['jinteki','novatek'] },
  anarch:  { programs:['fracter_1','fracter_2','fracter_3','hammer_1','hammer_2','void_1','zap_1','zap_2','zap_3','intercept','overclock','overclock_2','hide_2','cloak_p'],
             attachments:['ram_chip','coprocessor','turbo_proc','ice_ai','cryo_cooler'],
             decks:['novatek','haas'] },
  neutral: { programs:['scan_1','scan_2','anchor_1','anchor_2','hide_1','deceive_1','soothe_1','decrypt_1','zap_1','fracter_1','decoder_1','killer_1'],
             attachments:['ram_chip','storage_chip','trace_filter','coprocessor'],
             decks:['haas','weyland','jinteki','nbn','novatek'] },
  gov:     { programs:['scan_3','decrypt_2','armor_2','spoof_1','soothe_3'],
             attachments:['neural_buf2','ram_chip_3','stealth_os','trace_scrub'],
             decks:['weyland'] },
};

// How many items each company shows (seeded selection)
const NET_MARKET_COUNT = { programs:3, attachments:2, decks:1 };

// Distance scaling for net market items
function netMarketPriceScale(meshDist){
  return 1 + meshDist * 0.08; // +8% per unit distance
}

function netMarketStatScale(meshDist){
  return 1 + Math.floor(meshDist / 8); // +1 tier every 8 units distance
}

// Generate deterministic net market for a company
function genCompanyMarket(company, meshDist){
  const pool = NET_MARKET_BY_FACTION[company.faction] || NET_MARKET_BY_FACTION.neutral;
  const seed0 = (company.key || company.name || '').split('').reduce((a,c)=>a^c.charCodeAt(0)*31,0xCAFE);
  function seededPick(arr, count, seed){
    if(!arr?.length) return [];
    const s = arr.slice();
    const result = [];
    let st = seed >>> 0;
    for(let i=0;i<count&&s.length;i++){
      st=(st*1664525+1013904223)>>>0;
      const idx=st%s.length;
      result.push(s.splice(idx,1)[0]);
    }
    return result;
  }
  const meshTier = netMarketStatScale(meshDist);
  const priceScale = netMarketPriceScale(meshDist);

  // Filter programs by minMeshDist and tier cap
  const availProgs = (pool.programs||[]).filter(id=>{
    const d=PDEFS?.find(p=>p.id===id);
    return d && meshDist >= (d.minMeshDist||0);
  });
  const progIds = seededPick(availProgs, NET_MARKET_COUNT.programs, seed0^0x1111);
  const attachIds = seededPick(pool.attachments||[], NET_MARKET_COUNT.attachments, seed0^0x2222);
  const deckIds = seededPick(pool.decks||[], NET_MARKET_COUNT.decks, seed0^0x3333);

  return {
    company,
    meshDist,
    meshTier,
    priceScale,
    programs: progIds,
    attachments: attachIds,
    decks: deckIds,
  };
}

const MKT_POOL={
  gen:  ['fracter_1','fracter_2','decoder_1','decoder_2','killer_1','killer_2',
         'hide_1','deceive_1','deceive_2','scan_1','scan_2','decrypt_1','soothe_1','zap_1'],
  corp: ['decoder_2','decoder_3','decrypt_2','soothe_2','scan_2'],
  crim: ['killer_2','killer_3','deceive_2','spoof_1'],
  anarch:['fracter_2','zap_1','zap_2','hide_2','intercept','overclock'],
};
// Rotation intervals in ms
const MKT_INTERVAL={gen:3*60*1000, corp:5*60*1000, crim:4*60*1000, anarch:4*60*1000};
// Max items visible per shop
const MKT_MAX={gen:8, corp:5, crim:5, anarch:5};
// Live shop state — populated on first load, persisted in save
// S.shop = { gen:[{defId,listedAt},...], corp:[...], crim:[...], anarch:[...] }
//           nextRotate = { gen: timestamp, corp:..., crim:..., anarch:... }
const PRESTIGE_TREE=[
  {n:1, iceId:'PROBE',     iceName:'Probe',      iceDesc:'Scans installed programs each round — disables one permanently until defragged',
        progId:'armor_1',  progName:'Armor v1',   progDesc:'Absorbs 1 retaliation hit per combat'},
  {n:2, iceId:'BLACK_ICE', iceName:'Black ICE',   iceDesc:'Permanently reduces max INT by 1 on contact — restore with Integrity Patch',
        progId:'spoof_1',  progName:'Spoof',       progDesc:'Fakes node identity to Patrol queries'},
  {n:3, iceId:'TAR_PIT',   iceName:'Tar Pit',     iceDesc:'Stacks movement slow (+4t per stack); stacks persist for run',
        progId:'overclock',progName:'Overclock',   progDesc:'+3 breaker STR this run (cumulative per CPU visited)'},
  {n:4, iceId:'TRACER',    iceName:'Tracer',      iceDesc:'+10 pressure/round; spawns Hunter immediately at pressure 200',
        progId:'ghost_p',  progName:'Ghost',       progDesc:'Full invisibility — nullifies all Patrol detection'},
  {n:5, iceId:'KRAKEN',    iceName:'Kraken',      iceDesc:'Blocks all cells in its row — must be destroyed to advance; spawns Hunters when damaged',
        progId:'polymorph',progName:'Polymorph',   progDesc:'Swap one installed program with inventory mid-run (once per cell visited)'},
  {n:6, iceId:'MIMIC',     iceName:'Mimic',       iceDesc:'Disguises as a random node type — true nature revealed only on entry',
        progId:'switchblade',progName:'Switchblade',progDesc:'Auto-selects best available breaker before each combat, ignoring loadout'},
  {n:7, iceId:'LEECH',     iceName:'Leech',       iceDesc:'Drains 1 breaker STR each combat round (permanent for this run)',
        progId:'cloak',    progName:'Cloak',       progDesc:'First combat each run: guaranteed sneak success regardless of Hide power'},
  {n:8, iceId:'CASCADE',   iceName:'Cascade',     iceDesc:'On defeat, spawns a Barrier at half STR in same cell',
        progId:'overclock_2',progName:'Overclock v2',progDesc:'+6 breaker STR applied passively every combat this run'},
  {n:9, iceId:'ARCHITECT', iceName:'Architect',   iceDesc:'COP nodes auto-repair after 60 ticks — silencing is temporary',
        progId:'daemon',   progName:'Daemon',      progDesc:'+1 STR to all installed breakers passively (stackable)'},
  {n:10,iceId:'OMEGA',     iceName:'Omega ICE',   iceDesc:'Combines Gatekeeper+Black ICE+Tracer — raises alert, permanent INT loss, traces every round',
        progId:'polymorph_2',progName:'Polymorph v2',progDesc:'Swap any number of programs mid-run freely — full inventory access during run'},
];

// STATE
let _uid=0;
const uid=()=>'u'+(++_uid);
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const pdef=id=>PDEFS.find(p=>p.id===id);
const hwdef=()=>HARDWARE.find(h=>h.id===S.hardware);
const ramUsed=()=>S.installed.reduce((a,iid)=>{const it=S.inventory.find(x=>x.instId===iid);return a+(it?pdef(it.defId)?.mem||0:0);},0);
const ramMax=()=>(hwdef()?.ram||8)+attachEffect('ram')+(typeof charRamBonus==='function'?charRamBonus():0)+(typeof getDeckCraftStat==='function'?getDeckCraftStat('ram'):0);
const storageMax=()=>(hwdef()?.storage||8)+attachEffect('storage')+(typeof getDeckCraftStat==='function'?getDeckCraftStat('storage'):0);
const maxInt=()=>Math.max(1,10+(hwdef()?.integrity||0)+attachEffect('integrity')-(S.permIntLoss||0)+(typeof charIntBonus==='function'?charIntBonus():0)+(typeof getDeckCraftStat==='function'?getDeckCraftStat('integrity'):0));
const curTier=()=>levelToTier(S.level);
const prestigeThresholds=[20,40,60,80,100];
const nextPrestigeLevel=()=>prestigeThresholds.find(t=>t>S.level-S.prestige*20)||null;
const canPrestige=()=>prestigeThresholds.some(t=>S.level>=t);
const xpToLvl=lvl=>{
  if(lvl<=5)  return lvl*60;
  if(lvl<=10) return lvl*100;
  if(lvl<=15) return lvl*150;
  if(lvl<=25) return lvl*200;
  if(lvl<=40) return lvl*300;
  if(lvl<=60) return lvl*500;
  return lvl*800; // deep endgame — each level is a real achievement
};
const iceStr=(t,tier)=>{
  // freqMask op: -2 STR in glitch zone
  const _freqPenalty=(S._freqMaskActive&&typeof meshDistanceCurrent==='function'&&meshDistanceCurrent()>=16)?2:0;
  const base = BASE_ICE[t]?.baseStr || 2;
  const anarch = S._anarchBonus || 0;
  // In a net node: scale by mesh distance for faster/harsher ramp
  if(S.mesh?.currentNet){
    const routerReduction = S._routerHacked || 0;
    const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
    // +1 STR per 3 distance units, with extra multiplier past key thresholds
    const distBonus = Math.floor(dist / 3);
    const glitchBonus = dist >= 16 ? Math.floor((dist - 16) / 8) : 0;   // extra past glitch
    const deepBonus   = dist >= 64 ? Math.floor((dist - 64) / 16) : 0;  // extra past static
    const ascMult = typeof ascensionDifficulty==='function'?ascensionDifficulty():1;
    return Math.max(1, Math.round((base + distBonus + glitchBonus + deepBonus - anarch - routerReduction)*ascMult));
  }
  // Outside net: use level-based tier (firmware tutorial, legacy)
  return Math.max(1, base + Math.max(0,tier-1) + (tier>=8?Math.floor((tier-7)/2):0) - anarch);
};
// Available ICE filtered by mesh distance
const availICE=()=>Object.entries(BASE_ICE).filter(([k,v])=>!v.prestigeReq||S.prestige>=v.prestigeReq).map(([k])=>k);

