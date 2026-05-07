// ── DECK CRAFTING SYSTEM ─────────────────────────────────────────────────
// deck_crafting.js
//
// A crafted deck is assembled from a CHASSIS + COMPONENTS.
// Chassis defines slot capacity per category (RAM, CPU, STORAGE, ACCESSORY).
// Components have tiers 1–6. Higher tier = smaller (more fit per slot).
// Capacity formula: a tier-N component costs 1/(2^(N-1)) capacity.
//   T1 = 1.0  capacity unit
//   T2 = 0.5  capacity unit  → 2 per slot
//   T3 = 0.25 capacity unit  → 4 per slot
//   T4 = 0.125               → 8 per slot
//   T5 = 0.0625              → 16 per slot
//   T6 = 0.03125             → 32 per slot
//
// A tier-I chassis slot has capacity = 1.0 (holds exactly 1 T1 component).
// Chassis slot capacity doubles each chassis tier.
//   Chassis tier 1: 1.0 per slot
//   Chassis tier 2: 2.0 per slot  (e.g. 4 T3s, or 1 T1+2 T2s)
//   Chassis tier 3: 4.0 per slot
//   etc.
//
// Higher rarity chassis can have MORE slots per category.

function dcComponentCost(compTier){ return 1 / Math.pow(2, compTier-1); }
function dcSlotCapacity(chassisTier){ return Math.pow(2, chassisTier-1); }

// ── CHASSIS DEFINITIONS ───────────────────────────────────────────────────

const DC_CHASSIS_RARITIES = ['salvage','standard','military','advanced','prototype'];

// Slots per category [RAM, CPU, STORAGE, ACCESSORY]
// Higher rarity = more slots, potentially unequal distribution
const DC_CHASSIS_SLOTS = {
  salvage:   { ram:1, cpu:1, storage:1, accessory:1 },
  standard:  { ram:2, cpu:1, storage:2, accessory:1 },
  military:  { ram:2, cpu:2, storage:2, accessory:2 },
  advanced:  { ram:3, cpu:2, storage:3, accessory:2 },
  prototype: { ram:4, cpu:3, storage:4, accessory:3 },
};

const DC_CHASSIS_COLORS = {
  salvage:'#3a6a3a', standard:'#40aaff', military:'#ffaa20',
  advanced:'#c040ff', prototype:'#ff4040',
};

const DC_CHASSIS_TIER_NAMES = ['—','Mark I','Mark II','Mark III','Mark IV','Mark V','Mark VI'];

function mkChassis(rarity, tier, source){
  const slots = DC_CHASSIS_SLOTS[rarity] || DC_CHASSIS_SLOTS.salvage;
  const slotCap = dcSlotCapacity(tier);
  const govBonus = source === 'gov' ? 0.5 : 0; // gov chassis: slight bonus capacity
  return {
    id: uid ? uid() : Math.random().toString(36).slice(2),
    type: 'chassis',
    rarity,
    tier,
    name: `${rarity.charAt(0).toUpperCase()+rarity.slice(1)} Chassis ${DC_CHASSIS_TIER_NAMES[tier]||''}`.trim(),
    source: source || 'found',
    slotCap: slotCap + govBonus,
    slots: { ...slots },
    color: DC_CHASSIS_COLORS[rarity] || '#3a6a3a',
    desc: `${DC_CHASSIS_SLOTS[rarity] ? Object.entries(slots).map(([k,v])=>`${v} ${k.toUpperCase()}`).join(', ') : '?'} · ${slotCap.toFixed(2)} cap/slot`,
  };
}

// ── COMPONENT DEFINITIONS ─────────────────────────────────────────────────

const DC_COMPONENTS = [
  // ── RAM MODULES ──────────────────────────────────────────────────────────
  { id:'dc_ram_1', cat:'ram', tier:1, name:'RAM Stick T1', icon:'▦', desc:'+2 RAM',        effect:{ram:2},    cost:500  },
  { id:'dc_ram_2', cat:'ram', tier:2, name:'RAM Module T2',icon:'▦', desc:'+3 RAM',        effect:{ram:3},    cost:1200 },
  { id:'dc_ram_3', cat:'ram', tier:3, name:'RAM Array T3', icon:'▦', desc:'+5 RAM',        effect:{ram:5},    cost:3000 },
  { id:'dc_ram_4', cat:'ram', tier:4, name:'RAM Core T4',  icon:'▦', desc:'+8 RAM',        effect:{ram:8},    cost:8000 },
  { id:'dc_ram_5', cat:'ram', tier:5, name:'RAM Matrix T5',icon:'▦', desc:'+12 RAM',       effect:{ram:12},   cost:20000},
  { id:'dc_ram_6', cat:'ram', tier:6, name:'RAM Lattice T6',icon:'▦',desc:'+20 RAM',       effect:{ram:20},   cost:60000},

  // ── CPU MODULES ───────────────────────────────────────────────────────────
  { id:'dc_cpu_1', cat:'cpu', tier:1, name:'CPU Unit T1',   icon:'◈', desc:'+1 breaker STR, −1 action tick',  effect:{breakerStr:1,actionTick:-1}, cost:600  },
  { id:'dc_cpu_2', cat:'cpu', tier:2, name:'CPU Chip T2',   icon:'◈', desc:'+2 breaker STR, −2 action tick',  effect:{breakerStr:2,actionTick:-2}, cost:1500 },
  { id:'dc_cpu_3', cat:'cpu', tier:3, name:'CPU Core T3',   icon:'◈', desc:'+3 breaker STR, −3 action tick',  effect:{breakerStr:3,actionTick:-3}, cost:4000 },
  { id:'dc_cpu_4', cat:'cpu', tier:4, name:'CPU Array T4',  icon:'◈', desc:'+5 breaker STR, −4 action tick',  effect:{breakerStr:5,actionTick:-4}, cost:10000},
  { id:'dc_cpu_5', cat:'cpu', tier:5, name:'CPU Matrix T5', icon:'◈', desc:'+8 breaker STR, −6 action tick',  effect:{breakerStr:8,actionTick:-6}, cost:28000},
  { id:'dc_cpu_6', cat:'cpu', tier:6, name:'CPU Lattice T6',icon:'◈', desc:'+12 breaker STR, −8 action tick', effect:{breakerStr:12,actionTick:-8},cost:75000},

  // ── STORAGE MODULES ───────────────────────────────────────────────────────
  { id:'dc_stor_1', cat:'storage', tier:1, name:'Storage Bay T1',   icon:'◉', desc:'+3 file storage',    effect:{storage:3},  cost:400  },
  { id:'dc_stor_2', cat:'storage', tier:2, name:'Storage Unit T2',  icon:'◉', desc:'+5 file storage',    effect:{storage:5},  cost:900  },
  { id:'dc_stor_3', cat:'storage', tier:3, name:'Storage Array T3', icon:'◉', desc:'+8 file storage',    effect:{storage:8},  cost:2500 },
  { id:'dc_stor_4', cat:'storage', tier:4, name:'Storage Core T4',  icon:'◉', desc:'+12 file storage',   effect:{storage:12}, cost:7000 },
  { id:'dc_stor_5', cat:'storage', tier:5, name:'Storage Matrix T5',icon:'◉', desc:'+18 file storage',   effect:{storage:18}, cost:18000},
  { id:'dc_stor_6', cat:'storage', tier:6, name:'Storage Lattice T6',icon:'◉',desc:'+28 file storage',   effect:{storage:28}, cost:50000},

  // ── ACCESSORY MODULES ─────────────────────────────────────────────────────
  { id:'dc_acc_trace_1', cat:'accessory', tier:1, name:'Trace Filter T1',    icon:'◎', desc:'−5% trace gain',        effect:{traceResist:5},   cost:1000 },
  { id:'dc_acc_trace_2', cat:'accessory', tier:2, name:'Trace Filter T2',    icon:'◎', desc:'−8% trace gain',        effect:{traceResist:8},   cost:2500 },
  { id:'dc_acc_trace_3', cat:'accessory', tier:3, name:'Trace Filter T3',    icon:'◎', desc:'−12% trace gain',       effect:{traceResist:12},  cost:6000 },
  { id:'dc_acc_ice_1',   cat:'accessory', tier:1, name:'ICE Scanner T1',     icon:'⬡', desc:'Reveal ICE types',      effect:{iceReveal:1},     cost:1200 },
  { id:'dc_acc_ice_2',   cat:'accessory', tier:2, name:'ICE Scanner T2',     icon:'⬡', desc:'Reveal ICE + STR',      effect:{iceReveal:2},     cost:3000 },
  { id:'dc_acc_ghost_1', cat:'accessory', tier:1, name:'Ghost Protocol T1',  icon:'◌', desc:'+1 stealth power',      effect:{stealth:1},       cost:1500 },
  { id:'dc_acc_ghost_2', cat:'accessory', tier:2, name:'Ghost Protocol T2',  icon:'◌', desc:'+2 stealth power',      effect:{stealth:2},       cost:4000 },
  { id:'dc_acc_ghost_3', cat:'accessory', tier:3, name:'Ghost Protocol T3',  icon:'◌', desc:'+3 stealth power',      effect:{stealth:3},       cost:10000},
  { id:'dc_acc_int_1',   cat:'accessory', tier:1, name:'Integrity Shield T1',icon:'◫', desc:'+3 max integrity',      effect:{integrity:3},     cost:2000 },
  { id:'dc_acc_int_2',   cat:'accessory', tier:2, name:'Integrity Shield T2',icon:'◫', desc:'+5 max integrity',      effect:{integrity:5},     cost:5000 },
  { id:'dc_acc_int_3',   cat:'accessory', tier:3, name:'Integrity Shield T3',icon:'◫', desc:'+8 max integrity',      effect:{integrity:8},     cost:13000},
  { id:'dc_acc_pressure_1',cat:'accessory',tier:1,name:'Pressure Dampener T1',icon:'⊙',desc:'−10 pressure on alert raise',effect:{pressureDamp:10}, cost:1800 },
  { id:'dc_acc_pressure_2',cat:'accessory',tier:2,name:'Pressure Dampener T2',icon:'⊙',desc:'−20 pressure on alert raise',effect:{pressureDamp:20}, cost:4500 },
];

// ── CRAFTED DECK STATE ────────────────────────────────────────────────────

function initCraftedDeck(){
  if(!S.craftedDeck) S.craftedDeck = {
    chassis: null,      // chassis object or null
    slots: {            // installed components per category: [{compId,instId}]
      ram: [], cpu: [], storage: [], accessory: []
    },
    chassisInventory: [],  // owned chassis not yet installed
    compInventory: [],     // owned components not yet installed
  };
}

// Calculate total capacity used by a slot's components
function dcSlotUsed(comps){
  return comps.reduce((sum, c) => {
    const def = DC_COMPONENTS.find(x=>x.id===c.compId);
    return sum + (def ? dcComponentCost(def.tier) : 0);
  }, 0);
}

// Calculate total capacity available for a slot category
function dcSlotAvailable(cat){
  initCraftedDeck();
  const chassis = S.craftedDeck.chassis;
  if(!chassis) return 0;
  const numSlots = chassis.slots[cat] || 0;
  return numSlots * chassis.slotCap;
}

// Can a component be added to a category?
function dcCanAdd(cat, compId){
  const def = DC_COMPONENTS.find(x=>x.id===compId);
  if(!def || def.cat !== cat) return false;
  const used = dcSlotUsed(S.craftedDeck.slots[cat] || []);
  const avail = dcSlotAvailable(cat);
  return used + dcComponentCost(def.tier) <= avail + 0.001; // float tolerance
}

// Add a component to the crafted deck
function dcAddComponent(cat, compId){
  initCraftedDeck();
  if(!dcCanAdd(cat, compId)){ addLog('Insufficient slot capacity','lw'); return false; }
  // Remove from comp inventory
  const idx = S.craftedDeck.compInventory.findIndex(c=>c.compId===compId);
  if(idx < 0){ addLog('Component not in inventory','lw'); return false; }
  const inst = S.craftedDeck.compInventory.splice(idx, 1)[0];
  if(!S.craftedDeck.slots[cat]) S.craftedDeck.slots[cat] = [];
  S.craftedDeck.slots[cat].push(inst);
  applyDraftDeckStats();
  if(typeof autoSave==='function') autoSave();
  if(typeof renderDeckCraft==='function') renderDeckCraft();
  return true;
}

// Remove a component from the crafted deck
function dcRemoveComponent(cat, instId){
  initCraftedDeck();
  const slots = S.craftedDeck.slots[cat] || [];
  const idx = slots.findIndex(c=>c.instId===instId);
  if(idx < 0) return;
  const [comp] = slots.splice(idx, 1);
  S.craftedDeck.compInventory.push(comp);
  applyDraftDeckStats();
  if(typeof autoSave==='function') autoSave();
  if(typeof renderDeckCraft==='function') renderDeckCraft();
}

// Install a chassis
function dcInstallChassis(chassisInstId){
  initCraftedDeck();
  const idx = S.craftedDeck.chassisInventory.findIndex(c=>c.instId===chassisInstId);
  if(idx < 0){ addLog('Chassis not found','lw'); return; }
  // Return old chassis to inventory
  if(S.craftedDeck.chassis){
    // Clear all installed components back to compInventory
    ['ram','cpu','storage','accessory'].forEach(cat=>{
      (S.craftedDeck.slots[cat]||[]).forEach(c=>S.craftedDeck.compInventory.push(c));
      S.craftedDeck.slots[cat] = [];
    });
    // Return old chassis to inventory pool
    const old = S.craftedDeck.chassis;
    S.craftedDeck.chassisInventory.push({ ...old, instId: uid() });
  }
  const [chassis] = S.craftedDeck.chassisInventory.splice(idx, 1);
  S.craftedDeck.chassis = chassis;
  applyDraftDeckStats();
  addLog(`◈ Chassis installed: ${chassis.name}`,'lg');
  if(typeof autoSave==='function') autoSave();
  if(typeof renderDeckCraft==='function') renderDeckCraft();
}

// Commit crafted deck as active hardware

function dcAutofill(){
  initCraftedDeck();
  const chassis = S.craftedDeck.chassis;
  if(!chassis){ addLog('Autofill: no chassis installed','lw'); return; }

  const cap = chassis.slotCap;
  const slots = chassis.slots;  // {ram:N, cpu:N, storage:N, accessory:N}

  // Helper: used capacity for a category
  function usedCap(cat){
    return (S.craftedDeck.slots[cat]||[]).reduce((s,inst)=>{
      const def=DC_COMPONENTS.find(x=>x.id===inst.compId);
      return s+(def?dcComponentCost(def.tier):0);
    },0);
  }
  function freeCap(cat){ return Math.max(0, slots[cat]*cap - usedCap(cat)); }

  // Owned component inventory (not yet installed)
  const owned = S.craftedDeck.compInventory||[];

  // ── Non-accessory categories: pack highest tier that fits ────────────────
  for(const cat of ['ram','cpu','storage']){
    let free = freeCap(cat);
    if(free <= 0.001) continue;
    // Sort owned comps of this cat by tier desc
    const avail = owned
      .filter(inst=>{ const d=DC_COMPONENTS.find(x=>x.id===inst.compId); return d&&d.cat===cat; })
      .sort((a,b)=>{
        const da=DC_COMPONENTS.find(x=>x.id===a.compId);
        const db=DC_COMPONENTS.find(x=>x.id===b.compId);
        return (db?.tier||0)-(da?.tier||0);
      });
    for(const inst of avail){
      const def=DC_COMPONENTS.find(x=>x.id===inst.compId);
      if(!def) continue;
      const cost=dcComponentCost(def.tier);
      if(cost<=free+0.001){
        // Install it
        const ownedIdx=owned.indexOf(inst);
        if(ownedIdx>=0){ owned.splice(ownedIdx,1); }
        S.craftedDeck.slots[cat].push({compId:def.id,instId:inst.instId||uid()});
        free-=cost;
        if(free<0.001) break;
      }
    }
  }

  // ── Accessory: one of each type (highest tier), then fill remaining ──────
  {
    let free = freeCap('accessory');
    if(free > 0.001){
      // Group accessory types by their effect key
      const accTypes = {};
      DC_COMPONENTS.filter(d=>d.cat==='accessory').forEach(d=>{
        const key=Object.keys(d.effect)[0];
        if(!accTypes[key]||d.tier>accTypes[key].tier) accTypes[key]=d;
      });

      // For each type, try to install the highest tier we own (one per type first)
      const installed = new Set();
      for(const [effKey, bestDef] of Object.entries(accTypes)){
        if(free<0.001) break;
        // Find highest-tier owned accessory of this effect type
        const avail=owned
          .filter(inst=>{
            const d=DC_COMPONENTS.find(x=>x.id===inst.compId);
            return d&&d.cat==='accessory'&&Object.keys(d.effect)[0]===effKey;
          })
          .sort((a,b)=>{
            const da=DC_COMPONENTS.find(x=>x.id===a.compId);
            const db=DC_COMPONENTS.find(x=>x.id===b.compId);
            return (db?.tier||0)-(da?.tier||0);
          });
        if(!avail.length) continue;
        const inst=avail[0];
        const def=DC_COMPONENTS.find(x=>x.id===inst.compId);
        const cost=dcComponentCost(def.tier);
        if(cost<=free+0.001){
          const idx=owned.indexOf(inst);
          if(idx>=0){ owned.splice(idx,1); }
          S.craftedDeck.slots.accessory.push({compId:def.id,instId:inst.instId||uid()});
          installed.add(effKey);
          free-=cost;
        }
      }

      // Fill any remaining accessory capacity with best remaining owned accessories
      if(free>0.001){
        const remaining=owned
          .filter(inst=>{ const d=DC_COMPONENTS.find(x=>x.id===inst.compId); return d&&d.cat==='accessory'; })
          .sort((a,b)=>{ const da=DC_COMPONENTS.find(x=>x.id===a.compId),db=DC_COMPONENTS.find(x=>x.id===b.compId); return (db?.tier||0)-(da?.tier||0); });
        for(const inst of remaining){
          if(free<0.001) break;
          const def=DC_COMPONENTS.find(x=>x.id===inst.compId);
          if(!def) continue;
          const cost=dcComponentCost(def.tier);
          if(cost<=free+0.001){
            const idx=owned.indexOf(inst);
            if(idx>=0){ owned.splice(idx,1); }
            S.craftedDeck.slots.accessory.push({compId:def.id,instId:inst.instId||uid()});
            free-=cost;
          }
        }
      }
    }
  }

  applyDraftDeckStats();
  addLog('◈ Deck autofilled — slots packed with highest-tier components','lp');
  if(typeof renderDeckCraft==='function') renderDeckCraft();
  if(typeof autoSave==='function') autoSave();
}

function dcCommitDeck(){
  initCraftedDeck();
  if(!S.craftedDeck.chassis){ addLog('No chassis installed','lw'); return; }
  // Unequip hardware deck — crafted deck replaces it
  if(S.hardware){
    const _old = typeof HARDWARE!=='undefined' ? HARDWARE.find(h=>h.id===S.hardware) : null;
    addLog(`◈ ${_old?.name||'Deck'} unequipped — replaced by crafted deck`,'lw');
    S.hardware = null;
  }
  applyDraftDeckStats();
  const _st=S.craftedDeck.activeStats||{};
  const _parts=[];
  if(_st.ram)_parts.push(`+${_st.ram} RAM`);
  if(_st.storage)_parts.push(`+${_st.storage} storage`);
  if(_st.breakerStr)_parts.push(`+${_st.breakerStr} breaker STR`);
  if(_st.integrity)_parts.push(`+${_st.integrity} INT`);
  if(_st.traceResist)_parts.push(`-${_st.traceResist}% trace`);
  if(_st.iceReveal)_parts.push('ICE reveal');
  addLog(`◈ Crafted deck activated — ${_parts.join(', ')||'no bonuses yet'}`,'lp');
  if(typeof autoSave==='function') autoSave();
  if(typeof renderDeckCraft==='function') renderDeckCraft();
  if(typeof renderDeck==='function') renderDeck();
  if(typeof renderTopBar==='function') renderTopBar();
}

// Calculate and apply all crafted deck stat bonuses
function applyDraftDeckStats(){
  initCraftedDeck();
  // Aggregate component effects
  let ram=0, breakerStr=0, actionTick=0, storage=0, traceResist=0,
      iceReveal=0, stealth=0, integrity=0, pressureDamp=0;

  ['ram','cpu','storage','accessory'].forEach(cat=>{
    (S.craftedDeck.slots[cat]||[]).forEach(inst=>{
      const def = DC_COMPONENTS.find(x=>x.id===inst.compId);
      if(!def) return;
      const e = def.effect;
      if(e.ram)          ram          += e.ram;
      if(e.breakerStr)   breakerStr   += e.breakerStr;
      if(e.actionTick)   actionTick   += e.actionTick; // negative = faster
      if(e.storage)      storage      += e.storage;
      if(e.traceResist)  traceResist  += e.traceResist;
      if(e.iceReveal)    iceReveal    = Math.max(iceReveal, e.iceReveal);
      if(e.stealth)      stealth      += e.stealth;
      if(e.integrity)    integrity    += e.integrity;
      if(e.pressureDamp) pressureDamp += e.pressureDamp;
    });
  });

  // Store on S for use by game systems
  S.craftedDeck.activeStats = { ram, breakerStr, actionTick, storage, traceResist, iceReveal, stealth, integrity, pressureDamp };
}

function getDeckCraftStat(stat){ return S.craftedDeck?.activeStats?.[stat] || 0; }

// ── CHASSIS DROPS ─────────────────────────────────────────────────────────

function tryDropChassis(source){
  initCraftedDeck();
  const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  if(dist < 16) return; // need gov contracts to get chassis

  // Rarity weighted by dist and source
  const govDrop = source === 'gov';
  const pool = govDrop
    ? ['salvage','salvage','standard','standard','military','advanced']
    : ['salvage','salvage','salvage','standard','standard','military'];
  const rarity = pool[Math.floor(Math.random()*pool.length)];

  // Tier 1 for now — higher tier chassis would come from higher dist/gov rep
  const govRep = typeof getGovRep==='function' ? Math.max(...Object.keys(S.govRep||{}).map(k=>{
    const idx=parseInt(k.replace('gov_',''));
    return isNaN(idx)?0:getGovRep(idx);
  }),0) : 0;
  const tier = govRep >= 4000 ? 3 : govRep >= 1500 ? 2 : 1;

  const chassis = mkChassis(rarity, tier, source);
  chassis.instId = typeof uid==='function' ? uid() : Math.random().toString(36).slice(2);
  S.craftedDeck.chassisInventory.push(chassis);

  // Auto-sell inferior chassis from inventory (runs after new chassis is added)
  {
    const _RR={salvage:0,standard:1,military:2,advanced:3,prototype:4};
    const _SP={salvage:200,standard:600,military:1500,advanced:4000,prototype:10000};
    const _inv=S.craftedDeck.chassisInventory;
    const _equip=S.craftedDeck.chassis; // currently equipped (if any)

    // Determine the single best chassis we own across installed + inventory
    const _all=[...(_equip?[_equip]:[]),..._inv];
    const _bestTier=Math.max(..._all.map(ch=>ch.tier||1));
    const _bestRarityAtBestTier=_all
      .filter(ch=>(ch.tier||1)===_bestTier)
      .reduce((best,ch)=>(_RR[ch.rarity]||0)>(_RR[best]||0)?ch.rarity:best,'salvage');

    const _sold=[];
    // Work backwards so splice indices stay valid
    for(let i=_inv.length-1;i>=0;i--){
      const ch=_inv[i];
      const t=ch.tier||1, r=ch.rarity;
      let sell=false;
      // A: duplicate — same tier+rarity exists elsewhere in inv or as equipped
      const _elsewhere=_inv.some((o,j)=>j!==i&&o.tier===t&&o.rarity===r)||(_equip&&_equip.tier===t&&_equip.rarity===r);
      if(_elsewhere) sell=true;
      // B: lower tier than our best
      else if(t<_bestTier) sell=true;
      // C: same tier as best but lower rarity than our best at that tier
      else if(t===_bestTier&&(_RR[r]||0)<(_RR[_bestRarityAtBestTier]||0)) sell=true;

      if(sell){
        _sold.push({name:ch.name,rarity:r,price:_SP[r]||200});
        S.cred=(S.cred||0)+(_SP[r]||200);
        _inv.splice(i,1);
      }
    }
    if(_sold.length){
      const _total=_sold.reduce((s,x)=>s+x.price,0);
      addLog(`◈ Auto-sold ${_sold.length} chassis (${_sold.map(x=>x.rarity).join(', ')}) +${_total}₵`,'lg');
    }
  }

  if(!S.loreLog) S.loreLog=[];
  addLog(`◈ CHASSIS found: ${chassis.name} [${rarity}] (${source})`, 'lp');
  const tab=document.getElementById('tab-craft');
  if(tab){ tab.style.color='#c040ff'; setTimeout(()=>{tab.style.color='';},4000); }
  if(typeof autoSave==='function') autoSave();
}

// ── COMPONENT ACQUISITION ─────────────────────────────────────────────────

function grantComponent(compId, source){
  initCraftedDeck();
  const def = DC_COMPONENTS.find(x=>x.id===compId);
  if(!def) return;
  const instId = typeof uid==='function' ? uid() : Math.random().toString(36).slice(2);
  S.craftedDeck.compInventory.push({ compId, instId });
  addLog(`◈ Component acquired: ${def.name} (${source||'found'})`, 'lg');
  if(typeof autoSave==='function') autoSave();
}

function tryDropComponent(source){
  initCraftedDeck();
  const dist = typeof meshDistanceCurrent==='function' ? meshDistanceCurrent() : 0;
  // Component drop pool: tier scales with dist
  const maxTier = Math.min(6, 1 + Math.floor(dist/12));
  const eligible = DC_COMPONENTS.filter(c=>c.tier<=maxTier);
  if(!eligible.length) return;
  const comp = eligible[Math.floor(Math.random()*eligible.length)];
  grantComponent(comp.id, source);
}



// ── MARKET PURCHASE ───────────────────────────────────────────────────────
function buyDeckComponent(compId, cost){
  if(!S.cred||S.cred<cost){ addLog('Insufficient cred','lw'); return; }
  const def=DC_COMPONENTS.find(x=>x.id===compId);
  if(!def){ addLog('Component not found','lw'); return; }
  S.cred-=cost;
  grantComponent(compId,'net market');
  if(typeof renderTopBar==='function') renderTopBar();
  if(typeof renderMarket==='function') renderMarket();
  if(typeof renderDeckCraft==='function') renderDeckCraft();
  if(typeof autoSave==='function') autoSave();
}
