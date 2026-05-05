// MESH v0.6.3 — glitch.js
// Glitch Zone Government System + Visual Overlay
// ================================================================

// ── GLITCH ZONE GOVERNMENT SYSTEM ────────────────────────────────────────
// 32 governments, each controlling a specific dist band in the glitch zone.
// No global rep: each gov has its own rep pool, tracked per netKey visit.

// Government name generation — nation-state flavour, not corp flavour
const GOV_ADJECTIVES = [
  'Northern','Southern','Eastern','Western','Central','United','Federal',
  'Democratic','People\'s','Free','Allied','Grand','New','High','Deep',
  'Outer','Inner','Third','Open','Closed','Joint','Interim','Sovereign',
  'Provisional','Restored','Reformed','Ancient','Maritime','Inland','Border',
];
const GOV_NOUNS = [
  'Republic','Confederation','Principality','Authority','Directorate',
  'Protectorate','Commonwealth','Assembly','Accord','Union','Collective',
  'League','Compact','Mandate','Domain','Prefecture','Enclave','Sector',
  'Bureau','State','Territory','Zone','Grid','Network','Mesh','Signal',
  'Circuit','Register','Archive','Commission',
];
const GOV_SUFFIXES = [
  '','','','', // mostly no suffix
  'Provisional Gov.','(Transitional)','(Unified)','(Restored)',
];

// Stable deterministic seeded random
function _govSeed(n){ return (n * 2654435761 + 1013904223) >>> 0; }
function _govPick(arr, seed){ return arr[seed % arr.length]; }

function getGovernmentName(govIndex){
  const s1 = _govSeed(govIndex * 7 + 1);
  const s2 = _govSeed(govIndex * 13 + 3);
  const s3 = _govSeed(govIndex * 19 + 7);
  const adj = _govPick(GOV_ADJECTIVES, s1);
  const noun = _govPick(GOV_NOUNS, s2);
  const suf  = _govPick(GOV_SUFFIXES, s3);
  return suf ? `${adj} ${noun} ${suf}` : `${adj} ${noun}`;
}

// Which government (0-31) controls a given dist?
// govs 0-15: each own one dist band (dist 16 = gov0, dist17 = gov1, ... dist31 = gov15)
// govs 16-27: each own 2 dist bands (dist32-33 = gov16, 34-35 = gov17, ... 54-55 = gov27)
// govs 28-31: all 4 jointly control dist 56-63 (superpowers)
function distToGovIndex(dist){
  if(dist < 16 || dist >= 64) return null;
  if(dist < 32) return dist - 16;                        // govs 0-15 (one per dist)
  if(dist < 56) return 16 + Math.floor((dist - 32) / 2); // govs 16-27 (two per dist)
  return 28; // govs 28-31: return base — use getDistGovernments for all 4
}

// Get the government(s) for a given dist
// dist 56-63: all 4 superpowers (govs 28-31) jointly control the zone
function getDistGovernments(dist){
  const idx = distToGovIndex(dist);
  if(idx === null) return [];
  if(dist >= 56) return [28, 29, 30, 31]; // all 4 superpowers
  return [idx];
}

// Get display info for a government
function getGovernment(idx){
  return {
    index: idx,
    name: getGovernmentName(idx),
    key: 'gov_' + idx,
    faction: 'gov',
    color: `hsl(${(idx * 11) % 360}, 40%, 55%)`,
    distBand: govIndexToDistBand(idx),
  };
}

function govIndexToDistBand(idx){
  if(idx < 16)  return [16 + idx, 16 + idx];
  if(idx < 28)  return [32 + (idx - 16) * 2, 33 + (idx - 16) * 2];
  return [56, 63]; // superpowers jointly control the full 56-63 band
}

// Rep key for a government — stored in ns.rep under this key
function govRepKey(govIndex){ return 'gov_' + govIndex; }

// ── FACTION DROPOUT SCHEDULE ──────────────────────────────────────────────
// Returns how many companies to include per parent faction at a given dist
function factionSlotCount(faction, dist){
  if(dist < 16) return 3;  // full complement everywhere in clean mesh
  if(faction === 'gov' || faction === 'ai') return 1; // gov/ai always 1 slot
  // Other factions thin out in glitch zone
  if(dist < 18) return 3;
  if(dist < 24) return 2;
  if(dist < 32) return 1;
  return 0; // dist 32+: only gov
}

// Which factions appear at a given dist?
function factionsAtDist(dist){
  if(dist >= 64) return ['gov', 'ai'];     // static layer: gov+ai
  if(dist >= 32) return ['gov'];           // deep glitch: gov only
  if(dist >= 16) return ['corp','crim','anarch','neutral','gov'];
  return ['corp','crim','anarch','neutral'];
}

// ── GOVERNMENT CONTRACT GENERATION ───────────────────────────────────────
// Government companies for a given net — replaces old genNetCompanies for gov
function getGovCompaniesForNet(netX, netY, dist){
  const govIdxs = getDistGovernments(dist);
  return govIdxs.map(idx => {
    const gov = getGovernment(idx);
    return {
      name: gov.name,
      faction: 'gov',
      govIndex: idx,
      key: govRepKey(idx),  // global rep key — same regardless of net
      color: gov.color,
    };
  });
}

// Government rep lives globally (one pool per government, not per net)
function getGovRep(govIndex){
  if(!S.govRep) S.govRep = {};
  return S.govRep[govRepKey(govIndex)] || 0;
}

function addGovRep(govIndex, amount){
  if(!S.govRep) S.govRep = {};
  const key = govRepKey(govIndex);
  S.govRep[key] = (S.govRep[key] || 0) + amount;
}

function govRepTier(govIndex){
  const rep = getGovRep(govIndex);
  if(rep >= 4000) return { name:'Integrated', min:4000 };
  if(rep >= 1500) return { name:'Cleared',    min:1500 };
  if(rep >= 500)  return { name:'Vetted',     min:500  };
  if(rep >= 100)  return { name:'Flagged',    min:100  };
  return { name:'Unknown', min:0 };
}


// ── GLITCH VISUAL OVERLAY ─────────────────────────────────────────────────
// Injects CSS animations and DOM elements that intensify with mesh distance.
// Runs continuously when in the glitch zone (dist 16-63).

let _glitchOverlayEl = null;
let _glitchStyleEl   = null;
let _glitchAnimFrame = null;
let _glitchLastDist  = -1;

function initGlitchOverlay(){
  if(_glitchStyleEl) return;
  const style = document.createElement('style');
  style.id = 'glitch-style';
  style.textContent = `
    #glitch-overlay {
      position: fixed; inset: 0; pointer-events: none; z-index: 8000;
      mix-blend-mode: screen;
    }
    #glitch-overlay .gl-scanlines {
      position: absolute; inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent 0px, transparent 3px,
        rgba(0,255,80,0.03) 3px, rgba(0,255,80,0.03) 4px
      );
    }
    @keyframes glitch-hscan {
      0%,100% { transform: translateY(0); opacity: 0; }
      5%       { transform: translateY(-3px); opacity: 1; }
      10%      { transform: translateY(2px); opacity: 1; }
      15%      { transform: translateY(0); opacity: 0; }
    }
    @keyframes glitch-vshift {
      0%,100% { clip-path: inset(0 0 100% 0); opacity: 0; }
      5%      { clip-path: inset(20% 0 70% 0); opacity: 1; }
      10%     { clip-path: inset(60% 0 20% 0); opacity: 0.7; }
      15%,100%{ clip-path: inset(0 0 100% 0); opacity: 0; }
    }
    @keyframes glitch-flash {
      0%,100% { opacity: 0; }
      50%     { opacity: 1; }
    }
    #glitch-overlay .gl-hbar {
      position: absolute; left: 0; right: 0; height: 4px;
      background: rgba(0,255,120,0.15);
      animation: glitch-hscan linear infinite;
    }
    #glitch-overlay .gl-ghost {
      position: absolute; inset: 0;
      background: transparent;
      animation: glitch-vshift linear infinite;
      box-shadow: inset 0 0 0 1px rgba(0,255,80,0.08);
    }
    #glitch-overlay .gl-rgb-r {
      position: absolute; inset: 0; pointer-events: none;
      mix-blend-mode: screen; opacity: 0;
      background: radial-gradient(ellipse at 30% 40%, rgba(255,0,0,0.04) 0%, transparent 60%);
      animation: glitch-flash linear infinite;
    }
    #glitch-overlay .gl-rgb-b {
      position: absolute; inset: 0; pointer-events: none;
      mix-blend-mode: screen; opacity: 0;
      background: radial-gradient(ellipse at 70% 60%, rgba(0,80,255,0.04) 0%, transparent 60%);
      animation: glitch-flash linear infinite;
    }
    #glitch-overlay .gl-vignette {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,20,0,0.4) 100%);
    }
    .glitch-cell-jitter {
      animation: cell-jitter 0.1s steps(2) infinite !important;
    }
    @keyframes cell-jitter {
      0%   { transform: translateX(0); }
      33%  { transform: translateX(1px); }
      66%  { transform: translateX(-1px); }
      100% { transform: translateX(0); }
    }
    .glitch-cell-desaturate {
      filter: saturate(0.1) brightness(1.4) !important;
      transition: filter 0.05s;
    }
  `;
  document.head.appendChild(style);
  _glitchStyleEl = style;
}

function updateGlitchOverlay(){
  const dist = typeof meshDistanceCurrent === 'function' ? meshDistanceCurrent() : 0;
  if(dist === _glitchLastDist) return;
  _glitchLastDist = dist;

  if(dist < 16 || dist >= 64){
    // Remove overlay outside glitch zone
    if(_glitchOverlayEl){ _glitchOverlayEl.remove(); _glitchOverlayEl = null; }
    return;
  }

  initGlitchOverlay();

  // Intensity: 0.0 at dist 16, 1.0 at dist 63
  const t = Math.min(1, (dist - 16) / 47);
  // Probability of active glitch effects: low at t=0, high at t=1
  const intensity = t * t; // quadratic — slow start, sharp ramp

  if(!_glitchOverlayEl){
    _glitchOverlayEl = document.createElement('div');
    _glitchOverlayEl.id = 'glitch-overlay';
    _glitchOverlayEl.innerHTML = `
      <div class="gl-vignette"></div>
      <div class="gl-scanlines"></div>
      <div class="gl-ghost" id="gl-ghost"></div>
      <div class="gl-hbar" id="gl-hbar"></div>
      <div class="gl-rgb-r" id="gl-rgb-r"></div>
      <div class="gl-rgb-b" id="gl-rgb-b"></div>
    `;
    document.body.appendChild(_glitchOverlayEl);
  }

  // Scanline opacity
  const scanlines = _glitchOverlayEl.querySelector('.gl-scanlines');
  if(scanlines) scanlines.style.opacity = (0.3 + intensity * 0.7).toFixed(2);

  // Vignette intensity
  const vignette = _glitchOverlayEl.querySelector('.gl-vignette');
  if(vignette) vignette.style.opacity = (intensity * 0.8).toFixed(2);

  // Horizontal bar — frequency and speed scale with intensity
  const hbar = document.getElementById('gl-hbar');
  if(hbar){
    const periodSec = Math.max(0.8, 8 - intensity * 6.5); // 8s at t=0 → 1.5s at t=1
    hbar.style.animationDuration = periodSec.toFixed(1) + 's';
    hbar.style.top = Math.floor(Math.random() * 80 + 10) + '%';
    hbar.style.opacity = (0.2 + intensity * 0.6).toFixed(2);
    hbar.style.height = Math.floor(2 + intensity * 6) + 'px';
  }

  // Ghost vertical shift — period and visibility
  const ghost = document.getElementById('gl-ghost');
  if(ghost){
    const gPeriod = Math.max(1.5, 12 - intensity * 9);
    ghost.style.animationDuration = gPeriod.toFixed(1) + 's';
    ghost.style.opacity = (intensity * 0.5).toFixed(2);
  }

  // RGB aberration — only at higher intensity
  const rgbR = document.getElementById('gl-rgb-r');
  const rgbB = document.getElementById('gl-rgb-b');
  if(rgbR && intensity > 0.3){
    const abPeriod = Math.max(0.5, 4 - intensity * 3);
    rgbR.style.animationDuration = abPeriod.toFixed(1) + 's';
    rgbB.style.animationDuration = (abPeriod * 1.3).toFixed(1) + 's';
    rgbR.style.opacity = (intensity * 0.6).toFixed(2);
    rgbB.style.opacity = (intensity * 0.5).toFixed(2);
  }

  // Phosphor tint on the main content area
  const mainEl = document.getElementById('main') || document.getElementById('app');
  if(mainEl && intensity > 0.1){
    const greenTint = Math.floor(intensity * 15);
    mainEl.style.filter = `hue-rotate(-${greenTint}deg) saturate(${1 - intensity * 0.3})`;
  } else if(mainEl){
    mainEl.style.filter = '';
  }
}

// Random cell-level jitter — fires at intervals, affects a few grid cells briefly
let _glitchCellTimer = null;
function tickGlitchCells(){
  const dist = typeof meshDistanceCurrent === 'function' ? meshDistanceCurrent() : 0;
  if(dist < 16 || dist >= 64 || !S.running){ clearTimeout(_glitchCellTimer); return; }
  const t = Math.min(1, (dist - 16) / 47);
  const intensity = t * t;

  // Jitter a random grid cell briefly
  if(Math.random() < intensity * 0.4){
    const cells = document.querySelectorAll('.grid-cell');
    if(cells.length){
      const cell = cells[Math.floor(Math.random() * cells.length)];
      cell.classList.add('glitch-cell-jitter');
      setTimeout(() => cell.classList.remove('glitch-cell-jitter'), 80 + Math.random() * 120);
    }
  }

  // Occasional full-row desaturate flash at high intensity
  if(intensity > 0.6 && Math.random() < intensity * 0.08){
    const rows = document.querySelectorAll('.grid-row');
    if(rows.length){
      const row = rows[Math.floor(Math.random() * rows.length)];
      row.querySelectorAll('.grid-cell').forEach(c => c.classList.add('glitch-cell-desaturate'));
      setTimeout(() => {
        row.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('glitch-cell-desaturate'));
      }, 60 + Math.random() * 100);
    }
  }

  // Reschedule — shorter interval at higher intensity
  const msDelay = Math.max(120, 600 - intensity * 480);
  _glitchCellTimer = setTimeout(tickGlitchCells, msDelay);
}

function startGlitchCellTick(){
  const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  if(dist < 16 || dist >= 64){ stopGlitchCellTick(); return; }
  clearTimeout(_glitchCellTimer);
  tickGlitchCells();
}

function stopGlitchCellTick(){
  clearTimeout(_glitchCellTimer);
  _glitchCellTimer = null;
  // Remove any lingering jitter/desaturate classes
  document.querySelectorAll('.glitch-cell-jitter,.glitch-cell-desaturate').forEach(el=>{
    el.classList.remove('glitch-cell-jitter','glitch-cell-desaturate');
  });
}
