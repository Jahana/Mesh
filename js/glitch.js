// MESH v0.7.0 — glitch.js
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


// ── GLITCH VISUAL OVERLAY v2 ─────────────────────────────────────────────
// Approach: single canvas overlay running a continuous RAF loop,
// plus DOM row-displacement effects on a JS timer.
// Canvas is always present when in glitch zone; drawn every frame.

let _glitchOverlayEl = null;
let _glitchStyleEl   = null;
let _glitchCanvas    = null;
let _glitchCtx       = null;
let _glitchRafId     = null;
let _glitchCellTimer = null;
let _glitchActive    = false;

// ── SEED ──────────────────────────────────────────────────────────────────
let _gs = 1;
function _gr(){ _gs = (_gs * 1664525 + 1013904223) >>> 0; return _gs / 4294967296; }
function _gseed(){ _gs = ((Date.now() * 6364136) ^ (_gs * 1013904223)) >>> 0 || 1; }

// ── CSS (injected once) ──────────────────────────────────────────────────
function initGlitchOverlay(){
  if(_glitchStyleEl) return;
  const s = document.createElement('style');
  s.textContent = `
    #glitch-canvas {
      position:fixed;top:0;left:0;width:100%;height:100%;
      pointer-events:none;z-index:9000;
    }
    #glitch-overlay {
      position:fixed;inset:0;pointer-events:none;z-index:8990;
    }
    #glitch-overlay .gl-scanlines {
      position:absolute;inset:0;
      background:repeating-linear-gradient(
        0deg,transparent 0,transparent 2px,rgba(0,255,60,.028) 2px,rgba(0,255,60,.028) 3px
      );
    }
    #glitch-overlay .gl-vignette {
      position:absolute;inset:0;
      background:radial-gradient(ellipse at 50% 50%,transparent 30%,rgba(0,8,0,.7) 100%);
    }
    #glitch-overlay .gl-hbar {
      position:absolute;left:0;right:0;height:3px;
      background:linear-gradient(90deg,transparent,rgba(0,255,100,.3),transparent);
      animation:glHbar 3s linear infinite;
    }
    @keyframes glHbar {
      0%,100%{opacity:0;transform:translateY(0)} 10%{opacity:1} 15%{opacity:1;transform:translateY(4px)} 20%{opacity:0}
    }
    .glitch-row-shift { transition:none !important; }
    .glitch-cell-invert { filter:invert(.9) hue-rotate(100deg) !important; }
    .glitch-cell-desat  { filter:saturate(0) brightness(1.8) !important; }
  `;
  document.head.appendChild(s);
  _glitchStyleEl = s;
}

// ── CANVAS DRAW ───────────────────────────────────────────────────────────
function _drawGlitch(intensity){
  if(!_glitchCtx || !_glitchCanvas) return;
  const W = _glitchCanvas.width, H = _glitchCanvas.height;
  const ctx = _glitchCtx;
  _gseed();
  ctx.clearRect(0,0,W,H);


  // ── 1. Horizontal slice offsets — jagged VHS bands ──────────────────
  {
    const slices = Math.floor(3 + intensity * 15);
    for(let s = 0; s < slices; s++){
      if(_gr() > 0.6) continue;
      const y  = Math.floor(_gr() * H);
      const h  = 1 + Math.floor(_gr() * 8);
      const dx = Math.floor((_gr() - 0.5) * intensity * 80);
      if(Math.abs(dx) < 2) continue;
      ctx.save();
      ctx.globalAlpha = 0.5 + intensity * 0.4;
      ctx.fillStyle = `rgba(0,${180+Math.floor(_gr()*75)},${60+Math.floor(_gr()*60)},1)`;
      ctx.fillRect(dx, y, W, h);
      ctx.restore();
    }
  }

  // ── 2. Digital snow ────────────────────────────────────────────────────
  {
    const count = Math.floor(W * H * intensity * intensity * 0.02);
    ctx.save();
    for(let i = 0; i < count; i++){
      const px = Math.floor(_gr() * W);
      const py = Math.floor(_gr() * H);
      const b  = 120 + Math.floor(_gr() * 135);
      ctx.globalAlpha = 0.6 + _gr() * 0.4;
      ctx.fillStyle = _gr() < 0.65
        ? `rgb(40,${b},${Math.floor(b*0.4)})`
        : `rgb(${b},${b},${b})`;
      ctx.fillRect(px, py, _gr() < 0.15 ? 2 : 1, 1);
    }
    ctx.restore();
  }

  // ── 3. Snow patch clusters ─────────────────────────────────────────────
  {
    const patches = Math.floor(intensity * intensity * 6);
    for(let p = 0; p < patches; p++){
      const px = Math.floor(_gr() * (W - 100));
      const py = Math.floor(_gr() * (H - 10));
      const pw = 15 + Math.floor(_gr() * 90);
      const ph = 2  + Math.floor(_gr() * 5);
      ctx.save();
      ctx.globalAlpha = 0.35 + intensity * 0.5;
      for(let i = 0; i < pw; i += 2){
        if(_gr() < 0.4) continue;
        const b = 80 + Math.floor(_gr() * 175);
        ctx.fillStyle = `rgb(20,${b},${Math.floor(b*0.4)})`;
        ctx.fillRect(px + i, py, 2, ph);
      }
      ctx.restore();
    }
  }

  // ── 4. Full-width displacement lines ────────────────────────────────────
  {
    const lines = Math.floor(intensity * intensity * 12);
    for(let l = 0; l < lines; l++){
      const ly  = Math.floor(_gr() * H);
      const lh  = 1 + Math.floor(_gr() * 3);
      const ldx = Math.floor((_gr() - 0.5) * intensity * 60);
      ctx.save();
      ctx.globalAlpha = 0.25 + intensity * 0.5;
      ctx.fillStyle = `rgba(0,${180+Math.floor(_gr()*75)},60,1)`;
      ctx.fillRect(ldx, ly, W, lh);
      ctx.restore();
    }
  }

  // ── 5. Vertical tear lines ─────────────────────────────────────────────
  if(_gr() < intensity * 0.4){
    const tx = Math.floor(_gr() * W);
    const ty = Math.floor(_gr() * H * 0.6);
    const th = 40 + Math.floor(_gr() * H * 0.4);
    ctx.save();
    ctx.globalAlpha = 0.6 + intensity * 0.35;
    ctx.strokeStyle = `rgba(80,255,140,0.9)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    for(let y = ty; y < ty + th; y += 2){
      ctx.lineTo(tx + (_gr() - 0.5) * 8, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ── 6. RGB channel split ───────────────────────────────────────────────
  if(intensity > 0.2 && _gr() < intensity * 0.5){
    const sy  = Math.floor(_gr() * H);
    const sh  = 3 + Math.floor(_gr() * 20);
    const rdx = Math.floor((_gr() - 0.5) * intensity * 30);
    const bdx = Math.floor((_gr() - 0.5) * intensity * 24);
    ctx.save();
    ctx.globalAlpha = 0.3 + intensity * 0.4;
    ctx.fillStyle = 'rgba(255,40,40,0.9)';
    ctx.fillRect(rdx, sy, W, sh);
    ctx.fillStyle = 'rgba(40,40,255,0.9)';
    ctx.fillRect(bdx, sy + sh, W, sh);
    ctx.restore();
  }

  // ── 7. Full-screen flash ───────────────────────────────────────────────
  if(intensity > 0.65 && _gr() < 0.04){
    ctx.save();
    ctx.globalAlpha = 0.12 + _gr() * 0.15;
    ctx.fillStyle = 'rgba(0,255,80,1)';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 1. Horizontal slice offsets — glowing bands that displace across the screen
  if(intensity > 0.05){
    const numSlices = Math.floor(3 + intensity * 18);
    const sliceH    = Math.ceil(H / numSlices);
    for(let s = 0; s < numSlices; s++){
      if(_gr() > intensity * 0.65) continue;
      const y   = s * sliceH;
      const h   = 1 + Math.floor(_gr() * Math.max(2, sliceH * 0.5));
      const dx  = Math.floor((_gr() - .5) * intensity * 60);
      if(Math.abs(dx) < 2) continue;
      // Draw a bright displaced horizontal bar
      ctx.save();
      ctx.globalAlpha = 0.18 + intensity * 0.3;
      const g = ctx.createLinearGradient(dx, 0, dx+W, 0);
      g.addColorStop(0,   'rgba(0,255,80,0)');
      g.addColorStop(0.1, `rgba(0,${200+Math.floor(_gr()*55)},${60+Math.floor(_gr()*80)},0.9)`);
      g.addColorStop(0.9, `rgba(0,${200+Math.floor(_gr()*55)},${60+Math.floor(_gr()*80)},0.9)`);
      g.addColorStop(1,   'rgba(0,255,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(dx, y, W, h);
      ctx.restore();
    }
  }

  // 2. Digital snow — scattered pixels
  {
    const density = intensity * intensity * 0.012;
    const count   = Math.floor(W * H * density);
    ctx.save();
    for(let i = 0; i < count; i++){
      const px = Math.floor(_gr() * W);
      const py = Math.floor(_gr() * H);
      const b  = 80 + Math.floor(_gr() * 175);
      ctx.globalAlpha = 0.5 + _gr() * 0.5;
      ctx.fillStyle   = _gr() < .65
        ? `rgb(40,${b},${Math.floor(b*.5)})`  // green
        : `rgb(${b},${b},${b})`;              // white
      ctx.fillRect(px, py, 1 + (_gr()<.2?1:0), 1);
    }
    ctx.restore();
  }

  // 3. Snow patch clusters
  {
    const patches = Math.floor(intensity * intensity * 5);
    for(let p = 0; p < patches; p++){
      const px = Math.floor(_gr() * (W - 120));
      const py = Math.floor(_gr() * (H - 12));
      const pw = 20 + Math.floor(_gr() * 100);
      const ph = 2  + Math.floor(_gr() * 6);
      ctx.save();
      ctx.globalAlpha = .25 + intensity * .4;
      for(let i = 0; i < pw; i += 2){
        if(_gr() < .45) continue;
        const b = 60 + Math.floor(_gr() * 195);
        ctx.fillStyle = `rgb(20,${b},${Math.floor(b*.45)})`;
        ctx.fillRect(px+i, py, 2, ph);
      }
      ctx.restore();
    }
  }

  // 4. Horizontal displacement lines (full-width, shifted)
  {
    const lines = Math.floor(intensity * intensity * 10);
    for(let l = 0; l < lines; l++){
      const ly  = Math.floor(_gr() * H);
      const lh  = 1 + Math.floor(_gr() * 3);
      const ldx = Math.floor((_gr()-.5) * intensity * 50);
      ctx.save();
      ctx.globalAlpha = .15 + intensity * .25;
      ctx.fillStyle   = `rgba(0,${200+Math.floor(_gr()*55)},80,1)`;
      ctx.fillRect(ldx, ly, W, lh);
      ctx.restore();
    }
  }

  // 5. Vertical tear lines
  if(_gr() < intensity * 0.3){
    const tx = Math.floor(_gr() * W);
    const ty = Math.floor(_gr() * H * .6);
    const th = 30 + Math.floor(_gr() * H * .35);
    ctx.save();
    ctx.globalAlpha = .5 + intensity * .4;
    ctx.strokeStyle = `rgba(60,255,120,${.6+_gr()*.4})`;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    for(let y = ty; y < ty+th; y += 3){
      ctx.lineTo(tx + (_gr()-.5)*6, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // 6. RGB channel split
  if(intensity > 0.25 && _gr() < intensity * .45){
    const sy  = Math.floor(_gr() * H);
    const sh  = 3 + Math.floor(_gr() * 18);
    const rdx = Math.floor((_gr()-.5) * intensity * 24);
    const bdx = Math.floor((_gr()-.5) * intensity * 18);
    ctx.save();
    ctx.globalAlpha = .2 + intensity * .25;
    ctx.fillStyle = 'rgba(255,40,40,.8)';
    ctx.fillRect(rdx, sy, W, sh);
    ctx.fillStyle = 'rgba(40,40,255,.8)';
    ctx.fillRect(bdx, sy+sh, W, sh);
    ctx.restore();
  }

  // 7. Full-screen flash (rare, high intensity only)
  if(intensity > .7 && _gr() < .03){
    ctx.save();
    ctx.globalAlpha = .08 + _gr() * .12;
    ctx.fillStyle   = 'rgba(0,255,80,1)';
    ctx.fillRect(0,0,W,H);
    ctx.restore();
  }
}

// ── RAF LOOP ──────────────────────────────────────────────────────────────
function _rafLoop(){
  if(!_glitchActive){ _glitchRafId = null; return; }
  const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  if(dist < 16 || dist >= 64){ _stopGlitch(); return; }

  const t = Math.min(1, (dist-16)/47);
  const intensity = t * t;

  // Resize canvas if window changed
  if(_glitchCanvas &&
     (_glitchCanvas.width  !== window.innerWidth ||
      _glitchCanvas.height !== window.innerHeight)){
    _glitchCanvas.width  = window.innerWidth;
    _glitchCanvas.height = window.innerHeight;
  }

  _drawGlitch(intensity);
  _glitchRafId = requestAnimationFrame(_rafLoop);
}

// ── START / STOP ──────────────────────────────────────────────────────────
function _startGlitch(intensity){
  initGlitchOverlay();

  // CSS overlay
  if(!_glitchOverlayEl){
    _glitchOverlayEl = document.createElement('div');
    _glitchOverlayEl.id = 'glitch-overlay';
    _glitchOverlayEl.innerHTML =
      '<div class="gl-vignette"></div>' +
      '<div class="gl-scanlines"></div>' +
      '<div class="gl-hbar"></div>';
    document.body.appendChild(_glitchOverlayEl);
  }
  const sl = _glitchOverlayEl.querySelector('.gl-scanlines');
  if(sl) sl.style.opacity = (.15 + intensity * .85).toFixed(2);
  const vi = _glitchOverlayEl.querySelector('.gl-vignette');
  if(vi) vi.style.opacity = (.1 + intensity * .7).toFixed(2);
  const hb = _glitchOverlayEl.querySelector('.gl-hbar');
  if(hb){ hb.style.height=(2+intensity*7)+'px'; hb.style.top=(10+Math.random()*75)+'%'; }

  // Canvas
  if(!_glitchCanvas){
    _glitchCanvas = document.createElement('canvas');
    _glitchCanvas.id = 'glitch-canvas';
    _glitchCanvas.width  = window.innerWidth;
    _glitchCanvas.height = window.innerHeight;
    document.body.appendChild(_glitchCanvas);
    _glitchCtx = _glitchCanvas.getContext('2d');
  }

  // Phosphor tint on main
  const mainEl = document.getElementById('main') || document.getElementById('app');
  if(mainEl){
    const tint = Math.floor(intensity * 20);
    const sat  = Math.max(.55, 1 - intensity * .45);
    mainEl.style.filter = `hue-rotate(-${tint}deg) saturate(${sat})`;
  }

  // Start RAF
  _glitchActive = true;
  if(!_glitchRafId) _glitchRafId = requestAnimationFrame(_rafLoop);
}

function _stopGlitch(){
  _glitchActive = false;
  if(_glitchRafId){ cancelAnimationFrame(_glitchRafId); _glitchRafId = null; }
  if(_glitchOverlayEl){ _glitchOverlayEl.remove(); _glitchOverlayEl = null; }
  if(_glitchCanvas){ _glitchCanvas.remove(); _glitchCanvas = null; _glitchCtx = null; }
  const mainEl = document.getElementById('main') || document.getElementById('app');
  if(mainEl) mainEl.style.filter = '';
}

function updateGlitchOverlay(){
  const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  if(dist < 16 || dist >= 64){ _stopGlitch(); return; }
  const t = Math.min(1,(dist-16)/47);
  _startGlitch(t * t);
}

// ── CELL-LEVEL EFFECTS ────────────────────────────────────────────────────

function tickGlitchCells(){
  const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  if(dist < 16 || dist >= 64 || !S.running){ stopGlitchCellTick(); return; }
  const intensity = Math.pow(Math.min(1,(dist-16)/47), 2);

  // Jitter individual cells
  if(Math.random() < intensity * 0.55){
    const cells = document.querySelectorAll('.grid-cell');
    if(cells.length){
      const n = 1 + Math.floor(intensity * 4);
      for(let i=0;i<n;i++){
        const cell = cells[Math.floor(Math.random()*cells.length)];
        const dx = Math.floor((Math.random()-.5)*intensity*6)+'px';
        const dy = Math.floor((Math.random()-.5)*intensity*3)+'px';
        cell.style.transform = `translate(${dx},${dy})`;
        const c2 = cell;
        setTimeout(()=>{ c2.style.transform=''; }, 50+Math.random()*80);
      }
    }
  }

  // Row desaturate/invert
  if(intensity > 0.35 && Math.random() < intensity * 0.14){
    const rows = document.querySelectorAll('.grid-row');
    if(rows.length){
      const row = rows[Math.floor(Math.random()*rows.length)];
      const cls = (intensity > 0.65 && Math.random() < .35) ? 'glitch-cell-invert' : 'glitch-cell-desat';
      row.querySelectorAll('.grid-cell').forEach(c=>c.classList.add(cls));
      setTimeout(()=>row.querySelectorAll('.grid-cell').forEach(c=>c.classList.remove(cls)), 35+Math.random()*70);
    }
  }

  // Multi-row horizontal displacement
  if(intensity > 0.6 && Math.random() < intensity * 0.10){
    const rows = document.querySelectorAll('.grid-row');
    if(rows.length > 2){
      const start = Math.floor(Math.random()*(rows.length-2));
      const count = 1 + Math.floor(Math.random()*3);
      const shift = Math.floor((Math.random()-.5)*intensity*28)+'px';
      for(let r=start; r<Math.min(rows.length,start+count); r++){
        rows[r].style.transform = `translateX(${shift})`;
        const row = rows[r];
        setTimeout(()=>{ row.style.transform=''; }, 40+Math.random()*90);
      }
    }
  }

  const delay = Math.max(60, 480 - intensity*420);
  _glitchCellTimer = setTimeout(tickGlitchCells, delay);
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
  document.querySelectorAll('.glitch-cell-invert,.glitch-cell-desat').forEach(el=>{
    el.classList.remove('glitch-cell-invert','glitch-cell-desat');
    el.style.transform='';
  });
  document.querySelectorAll('.grid-row').forEach(r=>{ r.style.transform=''; });
}
