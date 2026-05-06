// MESH v0.7.0 — netgen.js
// =======================
// Net-level generation: company names, node layout for 16×16 nets

// ── COMPANY NAME GENERATOR ────────────────────────────────────────────────
// Each net has 3 companies per faction (4 factions = 12 companies in normal space)
// Name = prefix + core + suffix, seeded by net coordinates + faction + index

const CORP_PREFIXES   = ['Axiom','Apex','Vantage','Stratos','Nexus','Cipher','Helix','Vector','Orbital','Meridian','Sigma','Titan','Nova','Onyx','Prism','Kestrel','Aegis','Zenith','Pulse','Arcane'];
const CORP_CORES      = ['Tech','Systems','Dynamics','Solutions','Networks','Logic','Data','Core','Synth','Works','Labs','Corp','Group','Industries','Ventures','Capital','Analytics','Mesh','Grid','Security'];
const CORP_SUFFIXES   = ['Inc.','Ltd.','AG','SA','GmbH','Co.','Group','International','Global','Holdings','Consortium','Alliance','Collective','Institute','Foundation'];

const CRIM_PREFIXES   = ['Ghost','Shadow','Iron','Black','Dead','Void','Null','Rogue','Broken','Chrome','Rust','Neon','Static','Dark','Knife','Ash','Bone','Jade','Smoke','Wire'];
const CRIM_CORES      = ['Syndicate','Network','Crew','Guild','Ring','Circle','Cell','Front','Cartel','Exchange','Market','Den','Outfit','Operation','Bureau','Agency','Hand','Eye','Fist','Edge'];
const CRIM_SUFFIXES   = ['','','','','(Anon)','(Unl.)','Underground','Collective','Anonymous']; // many have no suffix

const ANARCH_PREFIXES = ['Free','Open','Red','Null','Static','Reclaim','Zero','Void','Signal','Pure','Raw','True','Bare','Real','Clear','Direct','Radical','Broken','Unbound','Living'];
const ANARCH_CORES    = ['Signal','Mesh','Net','Data','Grid','Source','Code','Protocol','Channel','Wave','Feed','Stream','Flow','Current','Circuit','Path','Route','Line','Link','Access'];
const ANARCH_SUFFIXES = ['Collective','Movement','Front','Initiative','Project','Commune','Network','Assembly','Coalition','Cell','','']; 

const NEUTRAL_PREFIXES= ['Open','Free','Fair','Clear','Wide','Deep','Fast','High','Long','Far','Near','Old','New','True','Real','Pure','Simple','Direct','Local','Global'];
const NEUTRAL_CORES   = ['Exchange','Market','Trade','Broker','Factor','Agent','Dealer','Source','Supply','Service','Logistics','Transit','Relay','Hub','Node','Port','Depot','Cache','Store','Vault'];
const NEUTRAL_SUFFIXES= ['Services','Unlimited','Associates','Partners','& Co.','Exchange','International','Network','Direct','Online',''];

// Deterministic random from seed
function seededRand(seed, max){
  // Simple LCG
  let s = (seed * 1664525 + 1013904223) & 0xFFFFFFFF;
  s = ((s >>> 0) % max + max) % max;
  return s;
}

function genCompanyName(faction, netX, netY, index){
  const seed = (netX * 7919 + netY * 1000003 + index * 97 + faction.charCodeAt(0) * 31) >>> 0;
  
  let prefixes, cores, suffixes;
  switch(faction){
    case 'corp':    prefixes=CORP_PREFIXES;    cores=CORP_CORES;    suffixes=CORP_SUFFIXES;   break;
    case 'crim':    prefixes=CRIM_PREFIXES;    cores=CRIM_CORES;    suffixes=CRIM_SUFFIXES;   break;
    case 'anarch':  prefixes=ANARCH_PREFIXES;  cores=ANARCH_CORES;  suffixes=ANARCH_SUFFIXES; break;
    case 'neutral': prefixes=NEUTRAL_PREFIXES; cores=NEUTRAL_CORES; suffixes=NEUTRAL_SUFFIXES;break;
    case 'gov':     prefixes=['National','Federal','State','Regional','Central','United','Allied','Joint','Public','Civil'];
                    cores=['Authority','Agency','Bureau','Department','Ministry','Office','Commission','Board','Council','Service'];
                    suffixes=['','(Gov)','(Auth)','Administration','Division']; break;
    default:        prefixes=CORP_PREFIXES; cores=CORP_CORES; suffixes=CORP_SUFFIXES;
  }

  const s1 = seededRand(seed, prefixes.length);
  const s2 = seededRand(seed ^ 0xDEADBEEF, cores.length);
  const s3 = seededRand(seed ^ 0xCAFEBABE, suffixes.length);

  const pre = prefixes[s1];
  const cor = cores[s2];
  const suf = suffixes[s3];

  // Avoid prefix === first word of core (looks odd)
  return suf ? `${pre} ${cor} ${suf}` : `${pre} ${cor}`;
}

function genNetCompanies(netX, netY, glitchLevel){
  const dist = typeof meshDistance==='function' ? meshDistance(netX,netY) : 0;
  const result = {};

  // ── Gov zone (dist 16-63): use government system ──────────────────────
  if(dist >= 16 && dist < 64 && typeof getGovCompaniesForNet==='function'){
    const govCos = getGovCompaniesForNet(netX, netY, dist);
    result['gov'] = govCos;
    // Non-gov factions fade out across the glitch zone
    const facSlots = typeof factionSlotCount==='function' ? factionSlotCount : ()=>3;
    ['corp','crim','anarch','neutral'].forEach(fac => {
      const count = facSlots(fac, dist);
      if(count <= 0) return; // faction dropped out
      result[fac] = [];
      for(let i = 0; i < count; i++){
        const key = `${fac}_${(netX>>>0).toString(16)}_${(netY>>>0).toString(16)}_${i}`;
        result[fac].push({
          name: genCompanyName(fac, netX, netY, i),
          faction: fac, index: i, key,
        });
      }
    });
    return result;
  }

  // ── Standard faction generation (clean mesh + static+ ) ───────────────
  const factions = dist >= 64 ? ['corp','crim','anarch','neutral','gov','ai'] :
                               ['corp','crim','anarch','neutral'];
  factions.forEach(fac => {
    const count = fac === 'gov' ? 1 : fac === 'ai' ? 1 : 3;
    result[fac] = [];
    for(let i = 0; i < count; i++){
      const key = `${fac}_${(netX>>>0).toString(16)}_${(netY>>>0).toString(16)}_${i}`;
      result[fac].push({
        name: genCompanyName(fac, netX, netY, i),
        faction: fac, index: i, key,
      });
    }
  });
  return result;
}

// ── NET NODE LAYOUT ────────────────────────────────────────────────────────
// 16×16 = 256 nodes per net
// Node types weighted by distance from origin and glitch level

// Node type availability by mesh distance
// dist 0: only basics. More types unlock as distance increases.
function availNodeTypes(meshDist){
  const types = {
    DATASTORE: 20,
    RAM:       15,
    IO:        12,
    EMPTY:     Math.max(5, 40 - meshDist*2),
  };
  if(meshDist >= 1){ types.CPU = 8; types.COP = 6; }
  if(meshDist >= 2){ types.GPU = 5; types.RELAY = 6; }
  if(meshDist >= 3){ types.FIREWALL = 5; types.TERMINAL = 4; }
  if(meshDist >= 4){ types.VAULT = 4; types.PROXY = 4; types.ARCHIVE = 4; }
  if(meshDist >= 8){ types.COP = (types.COP||6) + 2; types.FIREWALL = (types.FIREWALL||5) + 2; }
  // v0.7.0 new node types
  if(meshDist >= 3){ types.ROUTER = 4; }
  if(meshDist >= 5){ types.SENSOR = 4; types.SERVER = 3; }
  if(meshDist >= 8){ types.NEXUS = 2; types.LAB = 3; }
  if(meshDist >= 16){ types.BLACKSITE = 1; }
  return types;
}

function pickNetNodeTypeSeeded(rng, glitchLevel, meshDist){
  const types = availNodeTypes(meshDist||0);
  const entries = Object.entries(types).map(([t,w])=>[t,Math.max(1,w)]);
  const total = entries.reduce((s,[,w])=>s+w,0);
  let roll = rng()*total;
  for(const [type,weight] of entries){ roll-=weight; if(roll<=0)return type; }
  return 'EMPTY';
}

function pickNetNodeType(glitchLevel, meshDist){
  const types = availNodeTypes(meshDist||0);
  const entries = Object.entries(types).map(([t,w])=>[t,Math.max(1,w+(glitchLevel||0))]);
  const total = entries.reduce((s,[,w])=>s+w,0);
  let roll = Math.random()*total;
  for(const [type,weight] of entries){ roll-=weight; if(roll<=0)return type; }
  return 'EMPTY';
}

// ICE pool scales with mesh distance
// dist 0: Gatekeeper only. dist 1+: Barrier. dist 2+: Guardian. dist 4+: Hunter. etc.
function netICEPool(meshDist){
  if(!BASE_ICE) return ['GATEKEEPER'];
  return Object.entries(BASE_ICE)
    .filter(([k,v]) => meshDist >= (v.minMeshDist||0))
    .map(([k]) => k);
}

// ICE density scales with mesh distance (very sparse at 0:0)
function netICEChance(meshDist){
  if(meshDist < 1)  return 0.08;  // ~1 in 12 nodes has ICE at net 0:0
  if(meshDist < 4)  return 0.15;
  if(meshDist < 16) return 0.25;
  return Math.min(0.60, 0.25 + meshDist * 0.002);
}

// Generate a full 16×16 net node map
// Uses deterministic seeding so revisits get same base layout
// (but rep/completion state is stored separately in visitedNets)
function generateNetLayout(netX, netY, meshDist){
  const glitchLevel = meshGlitchLevel(meshDist);
  const seed0 = (netX * 2654435761 ^ netY * 2246822519) >>> 0;
  const rng = (() => {
    let s = seed0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
  })();

  const nodes = [];
  for(let row = 0; row < 16; row++){
    const rowNodes = [];
    for(let col = 0; col < 16; col++){
      const addr = nodeAddr(col, row);
      // Entry and exit are always fixed
      const isEntry = (col === 0  && row === 0);
      const isExit  = (col === 15 && row === 15); // FF

      let nodeType;
      if(isEntry) nodeType = 'ENTRY';
      else if(isExit) nodeType = 'EXIT';
      else {
        // Weighted random using seeded rng
        // Use seeded rng for deterministic layout, but still respect distance rules
        nodeType = pickNetNodeTypeSeeded(rng, glitchLevel, meshDist);
      }

      // ICE placement
      let ice = null;
      if(!isEntry && !isExit){
        const iceChance = netICEChance(meshDist) + glitchLevel * 0.03;
        if(rng() < iceChance){
          const pool = netICEPool(meshDist);
          if(pool.length) ice = pool[Math.floor(rng() * pool.length)];
        }
      } else if(isEntry){
        ice = 'GATEKEEPER'; // entry always has gatekeeper
      }

      // Trap placement
      let trap = null;
      if(!isEntry && !isExit && !ice){
        const trapChance = Math.min(0.4, 0.05 + meshDist * 0.001 + glitchLevel * 0.03);
        if(rng() < trapChance){
          const trapTypes = Object.keys(TRAPS || {});
          if(trapTypes.length) trap = trapTypes[Math.floor(rng() * trapTypes.length)];
        }
      }

      rowNodes.push({
        addr, col, row, nodeType, ice, trap,
        visited: false,
        scanned: false,
        destroyed: false,
      });
    }
    nodes.push(rowNodes);
  }

  // Wire NEXUS links to random nearby non-trivial node
  for(let row=0;row<nodes.length;row++) for(let col=0;col<(nodes[row]||[]).length;col++){
    const cell=nodes[row]?.[col];
    if(cell?.nodeType==='NEXUS'){
      const candidates=[];
      for(let dr=-4;dr<=4;dr++) for(let dc=-4;dc<=4;dc++){
        if(dr===0&&dc===0)continue;
        const nc=nodes[row+dr]?.[col+dc];
        if(nc&&!['NEXUS','EMPTY','ENTRY','EXIT'].includes(nc.nodeType)) candidates.push(nc.id);
      }
      if(candidates.length) cell.nexusLink=candidates[Math.floor(Math.random()*candidates.length)];
    }
  }

  // Ensure BLACKSITE nodes have ICE
  for(let row=0;row<nodes.length;row++) for(let col=0;col<(nodes[row]||[]).length;col++){
    const cell=nodes[row]?.[col];
    if(cell?.nodeType==='BLACKSITE'&&!cell.ice) cell.ice='GUARDIAN';
  }

  return nodes;
}

// ── TUTORIAL NET (3×3 firmware) ───────────────────────────────────────────
// Fixed layout, not procedural. One concept per node.

const TUTORIAL_CONCEPTS = [
  {
    addr:'00', nodeType:'ENTRY', concept:'weaving', title:'The Jack — Weaving',
    desc:`<b>Weaving</b> is what runners call jacking into a net.<br><br>
Your deck translates neural input into mesh-compatible signals. The experience is total immersion — you are not controlling an avatar. <em>You are here.</em><br><br>
<b>Integrity</b> is your body's tolerance for hostile data. Reach zero and you get booted hard. Repeated hard boots cause permanent damage that persists between runs.<br><br>
The auto-traverse moves you through nodes left to right, row by row. You can adjust speed (1×/2×/4×) or pause at any time from the Run tab. Press <b>Esc</b> to jack out early — you keep whatever you've collected so far.`
  },
  {
    addr:'01', nodeType:'DATASTORE', concept:'files', title:'Files & Storage',
    desc:`<b>Datastores</b> hold files — your primary income source in the mesh.<br><br>
When you arrive, your Scanner identifies the contents. Without a Scanner, files download blind — encrypted or worthless files waste storage space.<br><br>
<b>File types by value:</b><br>
◈ Blueprint (80₵) · Keyfile (60₵) · Credpack (50₵) · Corpdata (40₵)<br>
◈ Payload (35₵) · Display (25₵) · Manifest (15₵) · Syslog (0₵)<br><br>
Files sit in your deck's <b>Storage</b> until you reach the Exit node, where they're automatically sold. Your Storage capacity is separate from RAM — don't confuse the two.<br><br>
<b>Storage Chips</b> expand your file capacity. <b>Scanner v3</b> identifies all files instantly on arrival.`
  },
  {
    addr:'02', nodeType:'IO', concept:'deck', title:'Your Deck',
    desc:`Your deck has two distinct resource pools:<br><br>
<b>RAM</b> — holds running programs. Each program costs MEM to install. Exceed RAM and you can't install more programs. Managed from the Deck tab before a run.<br><br>
<b>Storage</b> — holds downloaded files and contract items. Separate from RAM. Expand with Storage Chip attachments.<br><br>
<b>Integrity</b> — your hit points in the mesh. ICE and traps drain it. Zero means hard boot.<br><br>
<b>Attachment Slots</b> — hardware upgrades that bolt onto your deck: RAM Chips, Storage Chips, Trace Filters, Analyzers, and more.<br><br>
<b>IO nodes</b> like this one establish a data conduit that speeds up all downloads for the rest of the run.`
  },
  {
    addr:'10', nodeType:'COP', concept:'stealth', title:'Staying Dark',
    desc:`<b>Alert Pressure</b> is the net's awareness of your presence — a continuous scale from 0 to 200.<br><br>
<b>GREEN</b> (0–49): You're a ghost. Pressure naturally decays over time.<br>
<b>YELLOW</b> (50–149): Patrols activate. COPs ping harder. Hunters may spawn.<br>
<b>RED</b> (150–200): Full lockdown. Hunters converge on your position. Trace climbs rapidly.<br><br>
<b>COP nodes</b> like this one send periodic pings that raise pressure. Silence them via Terminal nodes, or bleed off pressure continuously with <b>Soothe</b> programs.<br><br>
Key stealth programs:<br>
◈ <b>Hide</b> — makes you invisible to passive detection<br>
◈ <b>Deceive</b> — auto-responds to patrol queries<br>
◈ <b>Ghost</b> — lets you slip past hunters undetected<br>
◈ <b>Spoof</b> — masks your identity on the net`
  },
  {
    addr:'11', nodeType:'CPU', concept:'contracts', title:'Cred & Rep',
    desc:`<b>Cred</b> is currency. You earn it by selling downloaded files at the Exit node, and through contracts offered by companies operating on each net.<br><br>
<b>Rep</b> (Reputation) is tracked per-faction and per-subfaction. Higher rep unlocks:<br>
◈ Access to harder, better-paying contracts<br>
◈ Faction-specific shops and programs<br>
◈ Special perks at Elite (1500) and Legend (4000) tier<br><br>
Factions have rivalries: gaining Corporate rep slowly costs Anarchist rep, and vice versa.<br><br>
<b>CPU nodes</b> like this one reveal the net map, grant extra processing slots for parallel actions, and speed up scan/download operations. Visit them early.`
  },
  {
    addr:'12', nodeType:'FIREWALL', concept:'breaking', title:'Breaking ICE',
    desc:`<b>ICE</b> (Intrusion Countermeasure Electronics) blocks your path. Each ICE has a <b>Strength</b> stat. Your breaker's strength must exceed it.<br><br>
<b>Three ICE types, three breakers — match them or pay in integrity:</b><br>
◈ <b>Barrier</b> → <b>Fracter</b> (Mk1–Mk6)<br>
◈ <b>Gatekeeper</b> (Code Gate) → <b>Decoder</b> (Mk1–Mk6)<br>
◈ <b>Guardian / Hunter</b> (Sentry) → <b>Killer</b> (Mk1–Mk6)<br><br>
No matching breaker? ICE retaliates — integrity damage, alert pressure spike.<br><br>
Useful combat programs:<br>
◈ <b>Zap</b> — reduces ICE STR before every combat (passive)<br>
◈ <b>Overclock</b> — boosts your breaker STR every combat (passive)<br>
◈ <b>Daemon</b> — permanent passive STR boost<br>
◈ <b>Switchblade</b> — breaks any ICE type at reduced effectiveness<br><br>
<b>Firewall nodes</b> raise alert if your breaker STR is below the firewall rating when you pass through.`
  },
  {
    addr:'20', nodeType:'GPU', concept:'faction', title:'Factions & Companies',
    desc:`Every net in the Mesh is owned — or contested — by <b>companies</b> from four factions:<br><br>
◈ <b>Corporate</b> — pays well, wants stealth and precision. Rival to Anarchists.<br>
◈ <b>Criminal</b> — fast money, smash-and-grab, no questions. Slight rep bonus.<br>
◈ <b>Anarchist</b> — pays less cred but high rep. Destruction-focused. Rival to Corps.<br>
◈ <b>Neutral</b> — steady income, mixed jobs, no faction conflicts.<br><br>
Each net procedurally generates <b>3 companies per faction</b> with unique names. Rep earned in a net is stored — when you return, the companies remember you.<br><br>
There are also <b>20 subfactions</b> (5 per parent) with their own rep tracks. Working with one subfaction gives a small bonus to the parent faction over time.<br><br>
<b>GPU nodes</b> capture broadcast feeds as DISPLAY files — worth bonus cred with an Intercept program installed.`
  },
  {
    addr:'21', nodeType:'ARCHIVE', concept:'crafting', title:'Craft & Upgrade',
    desc:`Between runs, at home base, you can <b>craft programs</b> from blueprints.<br><br>
<b>Finding blueprints:</b><br>
◈ Datastore drops — 3–15% chance, scales with net depth<br>
◈ Archive nodes like this one — higher blueprint and lore drop rate<br>
◈ Some contracts reward blueprints on completion<br><br>
Crafted programs sit permanently in your inventory. Loadout (which programs are installed and running) is set in the <b>Deck tab</b> before each run.<br><br>
<b>Mk tiers:</b> Mk1–Mk3 are craftable from the start. Mk4–Mk6 need blueprints from deeper nets.<br><br>
<b>The Market</b> lets you buy programs directly — no blueprint needed, but cred cost is higher. Some programs are faction-locked (requires rep to access).<br><br>
<b>Archive nodes</b> always contain identified files and have a higher chance of blueprint and lore drops.`
  },
  {
    addr:'22', nodeType:'EXIT', concept:'complete', title:'Firmware Complete',
    desc:`<b>Firmware training complete.</b><br><br>
You've been running a simulation burned into your deck's ROM — a protected environment that mirrors mesh behavior without real exposure. Nothing here could kill you.<br><br>
That changes now.<br><br>
What the firmware couldn't simulate:<br>
◈ <b>Glitches</b> — at mesh distance 16+, the net destabilizes. Files corrupt. Programs flicker. Pressure spikes without warning.<br>
◈ <b>Hunters</b> — mobile ICE that actively tracks you across the net, not just sitting in a cell<br>
◈ <b>Uniques</b> — extraordinarily rare artifacts with permanent effects that persist across all future runs<br>
◈ <b>The Glitch</b> — a Blackout event in 2072. Every AI in existence vanished simultaneously. The Mesh appeared in the silence they left behind. Nobody knows why. Some people are looking.<br><br>
From your home screen, use <b>Email</b> to receive contracts and quest chains. Use <b>Deck</b> to manage your programs. Then jack in.<br><br>
<em>Net 0:0 is waiting. Nothing out there is glad you're coming.</em>`
  },
];

function buildTutorialNet(){
  // 3×3 grid of concept nodes
  const nodes = [];
  for(let row = 0; row < 3; row++){
    const rowNodes = [];
    for(let col = 0; col < 3; col++){
      const addr = nodeAddr(col, row); // '00','01','02','10','11','12','20','21','22'
      const concept = TUTORIAL_CONCEPTS.find(c => c.addr === addr);
      rowNodes.push({
        addr, col, row,
        nodeType: concept?.nodeType || 'EMPTY',
        concept: concept?.concept || null,
        conceptTitle: concept?.title || null,
        conceptDesc: concept?.desc || null,
        ice: addr === '00' ? 'GATEKEEPER' : null,
        trap: null,
        visited: false,
        scanned: false,
        destroyed: false,
        tutorialLocked: false, // set true until previous node complete
      });
    }
    nodes.push(rowNodes);
  }
  return nodes;
}
