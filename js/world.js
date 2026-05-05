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

// MESH v0.6.2 — world.js
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

const UPLIFT_LORE = [
  // dist 0 — first uplift (net 0:0 only, special case)
  {
    minDist: 0, maxDist: 0,
    title: 'UPLIFT — NET 0:0 CLEARED',
    flavor: [
      'Signal lock confirmed. You are now visible to the Mesh.',
      'Net 0:0 was the first node ever registered. No company owns it.',
      'The Blackout happened here. The logs are gone. Something remains.',
    ],
    mechanics: [
      'Mesh traversal unlocked — you can now move between nets.',
      'Cardinal neighbors are accessible. Each net is unique.',
      'Autorun enabled — AUTO will navigate nets and nodes for you.',
      'Deeper nets offer stronger ICE, better rewards, and rarer gear.',
    ],
    footer: 'The coordinate space is open. Where you go is your choice.',
  },
  // dist 1–15 — clean mesh
  {
    minDist: 1, maxDist: 15,
    title: 'NET CLEARED — CLEAN MESH',
    flavor: [
      'Corporate traffic is thick here. Routine nets. Predictable ICE.',
      'These coords are mapped. Someone keeps the layouts clean.',
      'Standard encryption. Standard retaliation. Nothing surprising.',
    ],
    mechanics: [
      'ICE types: Gatekeeper, Barrier, Guardian, Hunter.',
      'Node types include CPU, COP, GPU — standard grid.',
      'Rep with local companies builds quickly at this depth.',
      'Net market offers baseline gear at standard prices.',
    ],
    footer: 'Stay sharp. Clean does not mean safe.',
  },
  // dist 16–31 — glitch zone
  {
    minDist: 16, maxDist: 31,
    title: 'NET CLEARED — GLITCH ZONE',
    flavor: [
      'Signal degradation detected. Something corrupted these nets after the Blackout.',
      'Intercepted fragment: "...the mapping protocols failed at dist 16. Beyond this, the Mesh self-modifies."',
      'You can feel the static. It is not interference. It is something listening.',
    ],
    mechanics: [
      'NEW: Probe ICE — scans your installed programs, disables one per round.',
      'NEW: Tracer ICE — adds pressure continuously. Spawns Hunter at pressure 200.',
      'Glitch effects: file corruption, alert pressure spikes, grid flicker.',
      'Government faction begins appearing in some nets.',
      'Net market prices higher. Gear is better.',
    ],
    footer: 'The glitch is not a bug. It was left here intentionally.',
  },
  // dist 32–63 — deep glitch
  {
    minDist: 32, maxDist: 63,
    title: 'NET CLEARED — DEEP GLITCH',
    flavor: [
      'Fragmented transmission received: "...do not run at dist 32. The Kraken is real."',
      'Three corps lost entire security teams trying to map this region after the Blackout.',
      'The nets here rewrite themselves between visits. No layout persists.',
    ],
    mechanics: [
      'NEW: Kraken ICE — blocks entire rows, spawns Hunter segments on damage.',
      'NEW: Mimic ICE — disguises itself as another node type. Scan before you move.',
      'Alert sensitivity is elevated. Pressure decays slower without Stealth stats.',
      'Mk4+ breakers begin appearing in net markets.',
      'Blueprint drops increase. Rare gear unlocks.',
    ],
    footer: 'The Kraken was not designed by any corp on record.',
  },
  // dist 64–127 — static
  {
    minDist: 64, maxDist: 127,
    title: 'NET CLEARED — STATIC LAYER',
    flavor: [
      'You are past the mapped region. No corp has filed a claim beyond dist 64.',
      'Received: "...signal origin unknown. Repeating: DO NOT APPROACH THE STATIC LAYER—" [END]',
      'The nets here have no owners. They run themselves. They have been running since the Blackout.',
    ],
    mechanics: [
      'NEW: Leech ICE — drains breaker STR each combat. It accumulates. Plan for it.',
      'NEW: Cascade ICE — defeats into a Barrier. Clear it twice.',
      'Grid sizes expand. Runs are longer. Integrity matters more.',
      'Character stats become critical — ICE STR scales with distance.',
      'Net market offers Legendary-rarity decks.',
    ],
    footer: 'Something is maintaining these nets. It is not doing it for you.',
  },
  // dist 128–255 — dark mesh
  {
    minDist: 128, maxDist: 255,
    title: 'NET CLEARED — DARK MESH',
    flavor: [
      'SYSTEM LOG 2072-09-14: "All AI processes terminated simultaneously at 03:17:44. Cause: unknown."',
      'The Blackout started here. The nets at this depth were the last to go silent.',
      'You have found something. Fragments of logs. A pattern in the node layouts. The AIs left something behind.',
    ],
    mechanics: [
      'NEW: Architect ICE — auto-repairs silenced COP nodes. Silence is not permanent here.',
      'NEW: Omega ICE — combined trace, pressure, and INT effects. Prepare thoroughly.',
      'ICE STR is severe. Intrusion character stat is essential.',
      'Trace Resist stat is critical — trace accumulates quickly.',
      'Mythic gear begins appearing in net markets.',
      'Legend rep with local companies unlocks unique perks.',
    ],
    footer: 'The Blackout was not an accident. The evidence is here. Piece it together.',
  },
  // dist 256+ — AI territory
  {
    minDist: 256, maxDist: Infinity,
    title: 'NET CLEARED — AI TERRITORY',
    flavor: [
      'WARNING: You have crossed the threshold. The AIs that survived the Blackout are here.',
      'They did not vanish. They retreated. This is where they went.',
      'Incoming transmission — source: unresolvable — "We know you are here, Weaver."',
    ],
    mechanics: [
      'AI faction present in all nets. Their ICE is adaptive.',
      'All ICE types at maximum STR. All character stats matter.',
      'The mesh itself reacts to your presence. Alert decays slower.',
      'Gear available here cannot be found anywhere else.',
      'You are not supposed to be here. That is why you came.',
    ],
    footer: 'This is what the Mesh has always been for. You just had to get here first.',
  },
];

function getUpliftLore(meshDist, isFirstUplift){
  if(isFirstUplift) return UPLIFT_LORE[0];
  return UPLIFT_LORE.slice(1).find(l => meshDist >= l.minDist && meshDist <= l.maxDist)
    || UPLIFT_LORE[UPLIFT_LORE.length - 1];
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
  const flavorMap = {corp:'CORPORATE',crim:'CRIMINAL',anarch:'ANARCHIST',neutral:'NEUTRAL',gov:'CORPORATE',ai:'NEUTRAL'};
  const flavor = flavorMap[fac] || 'NEUTRAL';

  // Pick verbs based on faction
  const verbsByFac = {
    corp:    {basic:['obtain','access','delete'],advanced:['exfil','access','modify'],elite:['exfil','backdoor','modify']},
    crim:    {basic:['obtain','delete','exfil'],advanced:['exfil','collect_delete','backdoor'],elite:['collect_delete','exfil','backdoor']},
    anarch:  {basic:['delete','destroy','activate'],advanced:['destroy','backdoor','delete'],elite:['backdoor','destroy','exfil']},
    neutral: {basic:['obtain','activate','archive'],advanced:['obtain','exfil','archive'],elite:['exfil','access','archive']},
    gov:     {basic:['access','obtain','archive'],advanced:['access','exfil','modify'],elite:['modify','exfil','backdoor']},
    ai:      {basic:['access','activate','obtain'],advanced:['modify','access','exfil'],elite:['backdoor','modify','exfil']},
  };
  const tierKey = tier<=2?'basic':tier<=4?'advanced':'elite';
  const verbs = (verbsByFac[fac]||verbsByFac.neutral)[tierKey];
  const action = verbs[Math.floor(Math.random()*verbs.length)];

  // Use genContract with the company key as subfac identifier
  // Pass company object directly so genContract uses the right verbs/names
  const ct = typeof genContract==='function'
    ? genContract(level, tier, flavor, null, company)
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
  const questAcceptBtn = e.questChainId && e.stepId
    ? `<div style="margin-top:12px"><button class="buy-btn" onclick="acceptQuestStep('${e.questChainId}','${e.stepId}')">◈ Accept Quest Objective</button></div>`
    : e.contract
      ? `<div style="margin-top:12px"><button class="buy-btn" onclick="acceptEmailContract(${idx})">Accept Contract</button></div>`
      : '';
  showModal(e.subject||'Email', `
    <div style="font-size:8px;color:#2a5a3a;margin-bottom:8px">From: ${e.from||'Unknown'} · ${e.date||''}</div>
    <div style="font-size:9px;color:#3a7a3a;line-height:1.8;white-space:pre-wrap">${e.body||''}</div>
    ${questAcceptBtn}
  `,[{label:'Close',cls:'modal-confirm',fn:closeModal}]);
  renderEmailScreen();
  updateEmailBadge();
  if(typeof autoSave==='function') autoSave();
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
