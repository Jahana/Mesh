// MESH v0.6.2 — mesh.js
// =====================
// Mesh coordinate space: two 32-bit unsigned integers (x, y)
// Distance from origin: sqrt(x^2 + y^2)
// Glitch threshold: 16 units
// AI territory: 256 units

// ── MESH STATE ────────────────────────────────────────────────────────────

function mkMeshState(){
  return {
    x: 0,           // 32-bit unsigned mesh X
    y: 0,           // 32-bit unsigned mesh Y
    unlocked: false, // true after firmware tutorial complete
    traversalUnlocked: false, // true after completing node FF in net 0:0
    visitedNets: [], // [{x,y,completedNodes:[],rep:{},companies:{}}]
    currentNet: null, // {x,y} or null if in real world
    glitchLevel: 0,  // 0=none, 1=minor, 2=moderate, 3=severe
  };
}

function meshDistance(x, y){
  // Euclidean distance from origin — use floating point (JS handles 32-bit fine)
  return Math.sqrt(x * x + y * y);
}

function meshDistanceCurrent(){
  if(!S.mesh) return 0;
  // When in a net, distance is based on that net's coordinates
  if(S.mesh.currentNet) return meshDistance(S.mesh.currentNet.x||0, S.mesh.currentNet.y||0);
  return meshDistance(S.mesh.x||0, S.mesh.y||0);
}

function meshGlitchLevel(dist){
  if(dist === undefined) dist = meshDistanceCurrent();
  if(dist < 16)   return 0; // clean
  if(dist < 64)   return 1; // minor glitches
  if(dist < 128)  return 2; // moderate
  if(dist < 256)  return 3; // severe
  return 4; // AI territory
}

function inAITerritory(){
  return meshDistanceCurrent() >= 256;
}

function inGlitchTerritory(){
  return meshDistanceCurrent() >= 16;
}

// ── NET KEY ───────────────────────────────────────────────────────────────

function netKey(x, y){
  // Stable string key for a net address
  return `${(x>>>0).toString(16).padStart(8,'0')}:${(y>>>0).toString(16).padStart(8,'0')}`;
}

function currentNetKey(){
  if(!S.mesh?.currentNet) return null;
  return netKey(S.mesh.currentNet.x, S.mesh.currentNet.y);
}

// ── NET STATE (per-net persistence) ──────────────────────────────────────

function getNetState(x, y){
  if(!S.mesh) return null;
  if(!S.mesh.visitedNets) S.mesh.visitedNets = [];
  const key = netKey(x, y);
  let ns = S.mesh.visitedNets.find(n => netKey(n.x, n.y) === key);
  if(!ns){
    ns = {
      x, y,
      completedNodes: [],  // hex addresses of completed nodes e.g. ['00','FF']
      rep: {},             // faction rep specific to this net
      companies: null,     // generated on first visit
      firstVisit: Date.now(),
    };
    S.mesh.visitedNets.push(ns);
  }
  return ns;
}

function currentNetState(){
  if(!S.mesh?.currentNet) return null;
  return getNetState(S.mesh.currentNet.x, S.mesh.currentNet.y);
}

// ── NODE ADDRESS ENCODING ─────────────────────────────────────────────────
// Node at grid column c, row r in a 16×16 net:
// address = (c * 16 + r) → 1 byte → 2 hex digits
// e.g. col 12 (C), row 10 (A) → 0xCA → "CA"

function nodeAddr(col, row){
  return ((col * 16 + row) & 0xFF).toString(16).toUpperCase().padStart(2,'0');
}

function addrToColRow(addr){
  const v = parseInt(addr, 16);
  return { col: (v >> 4) & 0xF, row: v & 0xF };
}

function isNodeComplete(addr){
  const ns = currentNetState();
  return ns ? ns.completedNodes.includes(addr) : false;
}

function markNodeComplete(addr){
  const ns = currentNetState();
  if(ns && !ns.completedNodes.includes(addr)){
    ns.completedNodes.push(addr);
  }
}

// ── GLITCH EFFECTS ────────────────────────────────────────────────────────

function tickGlitch(){
  const level = meshGlitchLevel();
  if(level === 0 || !S.running) return;

  // Glitch probability scales with level
  const baseProbPerTick = [0, 0.0005, 0.002, 0.006, 0.015][level] || 0;
  if(Math.random() > baseProbPerTick) return;

  const effects = ['pressure_spike','file_corrupt','visual_noise','trace_blip','program_flicker'];
  const effect = effects[Math.floor(Math.random() * Math.min(effects.length, level + 1))];

  switch(effect){
    case 'pressure_spike':
      if(typeof addPressure === 'function'){
        const amt = level * rnd(2, 8);
        addPressure(amt);
        addLog(`⚡ GLITCH: pressure spike +${amt}`, 'lw');
      }
      break;
    case 'file_corrupt':
      if(S.storage?.length){
        const idx = Math.floor(Math.random() * S.storage.length);
        const f = S.storage[idx];
        if(f && !f.preloaded && !f.contractTarget){
          f.credValue = Math.max(0, Math.floor((f.credValue||0) * 0.5));
          addLog(`⚡ GLITCH: file corrupted — ${fLabel(f)} value halved`, 'lw');
        }
      }
      break;
    case 'trace_blip':
      S.trace = Math.min(100, (S.trace||0) + level * rnd(1, 4));
      addLog(`⚡ GLITCH: trace blip +${level * 2}%`, 'lw');
      break;
    case 'program_flicker':
      // Briefly disable a random program for 10 ticks
      if(S.installed?.length){
        const iid = S.installed[Math.floor(Math.random() * S.installed.length)];
        if(iid && !(S._disabledProgs||[]).includes(iid)){
          if(!S._disabledProgs) S._disabledProgs = [];
          S._disabledProgs.push(iid);
          S._glitchFlickerProgs = S._glitchFlickerProgs || {};
          S._glitchFlickerProgs[iid] = (S.tick||0) + 10;
          addLog('⚡ GLITCH: program flicker', 'lw');
        }
      }
      break;
    case 'visual_noise':
      // Cosmetic — just log it
      addLog('⚡ GLITCH: signal noise', 'lw');
      break;
  }
}

function tickGlitchRestore(){
  // Re-enable flickering programs after their duration
  if(!S._glitchFlickerProgs) return;
  const now = S.tick || 0;
  Object.entries(S._glitchFlickerProgs).forEach(([iid, expiry]) => {
    if(now >= expiry){
      S._disabledProgs = (S._disabledProgs||[]).filter(x => x !== iid);
      delete S._glitchFlickerProgs[iid];
    }
  });
}

// ── NEIGHBORING NETS ──────────────────────────────────────────────────────

function neighboringNets(x, y){
  // Cardinal + diagonal neighbors in mesh space
  return [
    {x: x+1, y},   {x: x-1, y},
    {x, y: y+1},   {x, y: y-1},
    {x: x+1, y: y+1}, {x: x+1, y: y-1},
    {x: x-1, y: y+1}, {x: x-1, y: y-1},
  ].filter(n => n.x >= 0 && n.y >= 0); // no negative coordinates
}
