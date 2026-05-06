# MESH v0.7.0 — Idle Netrunner

> *"All the nets that ever were, are, or will be make up the Mesh"*

Browser-based idle game set after the Blackout of 2072. You are a Weaver: navigating corporate nets, breaking ICE, building faction rep, and piecing together what happened when every AI vanished simultaneously.

---

## Quickstart

Open `index.html` in any modern browser. No server required. Saves to `localStorage` — 3 named slots + JSON export/import.

**Keys:** `1` `2` `4` — speed · `Space`/`0` — pause · `Esc` — jack out

---

## Architecture

```
FIRMWARE  (tutorial ROM — 9 concept nodes → MESH ACCESS)

REAL WORLD  (home base)
  ├── ✉ Email · Quest chains · Deck · Market · Craft · Ops
  └── ⬡ Jack In → MESH

MESH  (coordinate space — 32-bit unsigned integer pairs)
  ├── dist  0–15:  Clean mesh
  ├── dist 16–63:  Glitch Zone  ← government territory, canvas glitch overlay, faction dropout
  ├── dist 64–255: Static layer
  ├── dist 256+:   AI Territory
  └── ⬡ MESH tab: coordinate nav, visited nets with government labels

NET  (16×16 node map, addresses 00–FF)
  ├── Factions scale with dist (see Glitch Zone below)
  ├── 3 companies per non-gov faction, 1–4 government entities per net
  ├── Net market: faction gear + deck components in glitch zone
  └── ⬡ NET tab: compact 18px map, ICE indicators, node types

NODE  (single contract run)
  ├── Grid: dist/4 → TIER_GRIDS (4×4 at dist 0 → 15×15 at dist 56)
  ├── ICE STR: (base + dist/3 + glitch + static − router) × ascensionDifficulty
  ├── Per-node interaction timing (RAM 0.8s → BLACKSITE 4s)
  └── Progress bar on every active queued cell
```

---

## Glitch Zone (dist 16–63)

Government territory. Other factions thin out and disappear.

**Visual overlay** — canvas-based RAF loop, scales quadratically from dist 16 to 63:
- Jagged horizontal slice offsets (VHS tracking artifact, ±40px at full intensity)
- Digital snow: scattered bright pixels + rectangular noise clusters
- Full-width displacement lines
- Vertical tear lines (jagged, animated)
- RGB channel split artifacts
- Rare full-screen green flash at high intensity
- Cell-level jitter, row desaturation/inversion flashes, multi-row displacement

**Faction dropout:**

| Dist | Corp/Crim/Anarch/Neutral | Government |
|---|---|---|
| 0–15 | 3 companies each | — |
| 16–17 | 3 companies each | +1 gov |
| 18–23 | 2 companies each | +1 gov |
| 24–31 | 1 company each | +1 gov |
| 32–63 | gone | 3 gov slots |

**32 Governments** — procedural nation-state names, stable per dist band:
- Govs 0–15: one per dist (dist 16–31)
- Govs 16–27: two dists each (dist 32–55)
- Govs 28–31: all four jointly control dist 56–63 (superpowers)

Gov rep tracked globally per government in `S.govRep`. Tiers: Unknown → Flagged → Vetted → Cleared → Integrated. Shown in PROGRESS and ARCHIVE tabs.

---

## Node Types (21 total)

| Node | Icon | Unlocks | Time | Effect |
|---|---|---|---|---|
| ENTRY | ⬡ | always | — | Run start |
| EXIT | ◎ | always | — | Completes run |
| EMPTY | · | always | — | Pass-through |
| RAM | ▦ | always | 0.8s | Auto-collect file |
| I/O | ⇄ | always | 0.8s | Download speed boost, small cred |
| CPU | ◈ | dist 1 | 2s | Map reveal, trap sweep, +breaker STR (stacks) |
| GPU | ▣ | dist 2 | 2s | Intercept feed — needs Intercept program |
| DATASTORE | ◉ | always | multi | Scan/decrypt/download; 15% lore drop |
| COP | ⬟ | dist 1 | 2s | Silence to stop pings; may spawn Hunter |
| RELAY | ⇢ | dist 2 | 1.2s | Reveals cells in radius, freezes patrol |
| VAULT | ◆ | dist 4 | 3.5s | High-value files — requires Decrypt |
| PROXY | ⬭ | dist 4 | 1.2s | Reroutes patrols away from row/col |
| FIREWALL | ▣ | dist 3 | 2.2s | Pressure spike if breaker STR insufficient |
| TERMINAL | ⌨ | dist 3 | 2.5s | Reveals and silences all COPs |
| ARCHIVE | ◎ | dist 4 | 2.5s | Historical data, sells at exit |
| ROUTER | ⇌ | dist 3 | 1.8s | −1 all ICE STR per hack (stacks), reveals patrols |
| SENSOR | ◉ | dist 5 | 1.5s | Re-visit to disable; +20 trace/sensor at exit |
| SERVER | ▣ | dist 5 | 2.5s | Cred tap; clean-exit bonus |
| NEXUS | ⊛ | dist 8 | 2s | Auto-completes linked secondary node |
| BLACKSITE | ◼ | dist 16 | 4s | Hidden until adjacent; always ICE-guarded; enter first to reveal ICE, return after breach for reward |
| LAB | ⚗ | dist 8 | 3s | Blueprint progress (2 visits = earn blueprint) |

**BLACKSITE behaviour:** First visit reveals ICE but does not consume the node. Break the ICE, then re-visit to collect the data file, blueprint chance (40%), component chance (25%), and sensor alert.

---

## ICE Types (14 total)

| ICE | Unlocks | Mobile | Retaliation |
|---|---|---|---|
| GATEKEEPER | dist 0 | — | Raises alert |
| BARRIER | dist 0 | — | +trace |
| GUARDIAN | dist 0 | — | Disables random program |
| HUNTER | dist 0 | **yes** | Tracks player; combat on contact |
| PROBE | dist 4 | — | 60% chance disable program |
| BLACK_ICE | dist 8 | — | Permanent −1 max INT |
| TAR_PIT | dist 12 | — | Stacks movement slow |
| TRACER | dist 16 | — | +pressure; may spawn Hunter |
| KRAKEN | dist 32 | — | Spawns Hunter on each hit; blocks rows |
| MIMIC | dist 48 | — | Disguised until retaliation |
| LEECH | dist 64 | — | Drains breaker STR per hit (stacks) |
| CASCADE | dist 96 | — | Spawns Barrier on defeat |
| ARCHITECT | dist 128 | — | Self-repairs COP nodes |
| OMEGA | dist 192 | — | Pressure + trace + permanent INT loss |

**Hunter ICE** is mobile — on run start it activates as a moving hunter entity that tracks the player across the grid, using the same movement system as COP-spawned hunters.

STR: `(base + dist/3 + glitch + static − router hacks) × ascension multiplier`

---

## Contract System

### Rarity
| Rarity | Badge | Mult | Threshold |
|---|---|---|---|
| Common | — | ×1.0 | diff 1–2 |
| Uncommon | ◈ | ×1.15 | diff 3 or condition |
| Rare | ★ | ×1.4 | diff 4 or diff 3 + condition |
| Elite | ☠ | ×1.8 | diff 4 + condition + dist 16+ |

**Risk contracts** — 30% of elite: no partial, ×2 payout.

### Conditions
| Condition | Bonus | Factions |
|---|---|---|
| Stealth | +60% cred, +2.5× rep | Corp, Ghost Syndicate, Gov |
| Speed | +60% cred if under grid-scaled time limit | Runners' Guild, Corp |
| Witness | +60% cred if no Hunter spawned | Ghost Syndicate, Runners' Guild |

### Reward Scaling
```
floor = diff × 30 × (1 + dist × 0.06) × objectives
roll  = diff × rnd(20,60) × (1 + tier × 0.25) × objectives
cred  = (floor + roll) × subfactionMult × rarityMult
rep   = diff × 25 × (1 + tier/3 + dist × 0.04) × repMult
```
Partial: 70% proportional (0% for Risk). Rep never drops below current tier floor.

---

## Reputation

### Faction rep tiers (corp/crim/anarch/neutral)
| Tier | Floor | Effect |
|---|---|---|
| Unknown | 0 | No shop access |
| Known | 100 | Shop access, basic contracts |
| Trusted | 500 | Advanced contracts |
| Elite | 1500 | Elite contracts, faction perk |
| Legend | 4000 | Legend perk |

**Rep floor:** Once you reach a tier, rep can never drop below its floor — even from 100 rival/failure penalties.

### Government rep (per government, dist 16+)
Unknown → Flagged (100) → Vetted (500) → Cleared (1500) → Integrated (4000)

---

## Deck Crafting (CRAFT tab, dist 16+)

Crafted decks are assembled from a **chassis** + **components**. Stats apply live — no commit step needed.

### Chassis
Drops from government contracts (diff 2: 6%, diff 3: 12%, diff 4: 25%). Rarities: Salvage → Standard → Military → Advanced → Prototype. Tier (1–3) scales with gov rep.

Each chassis has slot counts per category (RAM / CPU / STORAGE / ACCESSORY).

**Slot capacity doubles each chassis tier:**
- Tier 1 = 1.0 cap/slot, Tier 2 = 2.0, Tier 3 = 4.0

### Component capacity cost = 1 / 2^(tier−1)
- T1 = 1.0 → 1 per T1 slot
- T2 = 0.5 → 2 per T1 slot, or 4 per T2 slot
- T3 = 0.25 → 4 per T1 slot
- Mix: 1×T2 + 2×T3 = 0.5 + 0.5 = 1.0 in a T1 slot ✓

### Component categories (6 tiers each)
| Category | T1 effect | T6 effect |
|---|---|---|
| RAM | +2 RAM | +20 RAM |
| CPU | +1 breaker STR, −1 action tick | +12 breaker STR, −8 ticks |
| Storage | +3 file storage | +28 storage |
| Accessory | varies | varies |

**Accessories:** Trace Filter (−5/8/12% trace), ICE Scanner (reveal type/STR), Ghost Protocol (+stealth), Integrity Shield (+3/5/8 INT), Pressure Dampener (−10/20 pressure on alert raise)

**Acquisition:** Gov contracts drop chassis (6–25%) and components (12–30%). LAB nodes (30% component), TERMINAL nodes (8%), BLACKSITE (25% component), net market (4 components per net in glitch zone).

---

## Blueprints & Crafting

Blueprints unlock programs for crafting. Starter blueprints (Mk3 breakers, Decrypt, Overclock, etc.) always available. Higher tiers unlock by mesh distance:

| Tier | Dist required |
|---|---|
| T4 programs | dist 8+ |
| T5 programs | dist 16+ |
| T6 programs | dist 24+ |
| Mythic decks | dist 32+ |
| High-end utility | dist 40–80+ |

Blueprints drop from: diff 3+ contracts (15%), diff 4 (30%), LAB nodes (2 visits), BLACKSITE (40%), DATASTORE (rare).

---

## Character Stats

| Stat | Effect |
|---|---|
| Neural Buffer | +2 RAM/level |
| Reflex | −0.4 ticks/move/level |
| Stealth | +2 pressure decay/level |
| Integrity | +3 max INT/level |
| Trace Resist | −3% trace gain/level; raises trace-out threshold above 100% |
| Intrusion | +1 all breaker STR/level |

Trace-out threshold: 100 + `charTraceCapBonus()`. Exceeding it triggers Hunter spawn + 30% trace relief.

---

## Quests

**Named chains:**
| Chain | Steps | Trigger | Reward |
|---|---|---|---|
| Ghost Signal | 6 | Uplift | 5000₵ + Signal Fragment |
| Corporate Extraction | 5 | 3 nets cleared | 12000₵ + 300 corp rep |
| Anarchist Underground | 7 | 8 nets cleared | 25000₵ + 800 anarch rep |

**Procedural chains** — generated every 3 nets, tension-driven (0–100), 7 flavor profiles, 10 step types.

Email notifications on home screen only (not in-run). Quest objectives persist through save/load. Proc chains restored from save.

---

## Save System

Full run state persists across saves: active contracts, grid, storage, player position, integrity, trace, alert, patrols, hunters. `runSnapshot` rebuilt on load so programs work immediately.

Persists: quests, story, ascension, govRep, craftedDeck, uniqueItems, uplift seen state.

---

## Uplift Ascension

Triggered at dist 115+. Choose 1 of 3 Weaver Traits.

**Persists through ascension:** lore, story, achievements, unique items, lifetime stats, govRep, craftedDeck  
**Resets:** gear, level, xp, rep, charStats, mesh, quests  
**ICE scaling:** ×(1 + count × 0.25)

**12 Weaver Traits:** Ghost Protocol · Void Runner · Overclock Core · Mirror Shield · Data Broker · Black Market Contact · Rep Network · Deep Mapper · Signal Boost · Persistence · ICE Analyst · Mesh Memory

---

## File Structure

| File | Contents |
|---|---|
| `js/data.js` | ICE (14 + mobile flag), programs, node defs + NODE_INTERACT_TICKS, 28 subfactions |
| `js/state.js` | State factory, autorun, moveTicks, uplift BFS |
| `js/save.js` | Save/load including full run state + runSnapshot rebuild |
| `js/deck.js` | Inventory, hardware, shop, blueprints (dist-gated), black market |
| `js/deck_crafting.js` | Chassis + component system, market purchase, stat aggregation |
| `js/combat.js` | ICE combat, retaliation, re-entrancy guard, mobile ICE override |
| `js/grid.js` | Traversal, 21 node interactions, activateMobileICE, BLACKSITE fix |
| `js/contracts.js` | Contract gen (rarity/risk/witness), scaling, rep floors, gov routing |
| `js/ops.js` | Off-grid operations, auto-repeat |
| `js/achievements.js` | 95 achievements (all callers wired) |
| `js/render.js` | All render; prestige → dist gates; gov rep tabs; deck craft UI |
| `js/main.js` | Game loop, trace cap threshold, glitch overlay tick |
| `js/mesh.js` | Mesh coordinates, distance, graduated glitch levels |
| `js/netgen.js` | Net layout gen, company names, NEXUS links, firmware |
| `js/world.js` | Home, net map, mesh traversal, uplift briefings, genNetContract |
| `js/quests.js` | Named chains, proc engine, email notifications, proc chain save/restore |
| `js/story.js` | Story fragments + gov/SUBSTRATE fragments |
| `js/glitch.js` | 32 governments, faction dropout, canvas glitch overlay |
| `js/ascension.js` | Uplift Ascension, 12 Weaver Traits, SUBSTRATE arc |

---

## Version History

### v0.7.0 *(current)*
- **HUNTER ICE mobile** — activates as a moving hunter entity at run start; tracks player across grid
- **BLACKSITE fix** — `blacksiteDone` no longer set before ICE check; reward now fires correctly after breach
- **Blueprint system fixed** — prestige gates replaced with dist gates throughout render, shop, and market; T4+ blueprints and programs now actually appear
- **Rep floor** — faction rep can never drop below current tier minimum (Known=100, Trusted=500, etc.)

### v0.6.4
- **Deck crafting** — chassis + components, 24 component types, 4 categories, capacity math (T1=1.0, T2=0.5…), gov contract drops, net market, stats wired into all game systems
- **Save/load** — full run state (grid, contracts, player, hunters) now persists; runSnapshot rebuilt on load; quest objectives survive reload
- **Glitch overlay** — canvas-based RAF loop; horizontal slices, digital snow, tears, displacement lines, RGB split, cell jitter, row displacement
- **Government system** — 32 procedural governments, faction dropout, gov rep UI in PROGRESS/ARCHIVE/run summary
- **Trace cap** — Trace Resist stat now raises hunter-spawn threshold above 100%
- **Three achievements wired** — black_market, intel_op, triple_kill
- **Email inline** — body renders in email screen (was hidden behind z-index 5500)
- **Node timing** — NODE_INTERACT_TICKS per node type (RAM 0.8s → BLACKSITE 4s)

### v0.6.3
- Contract rarity (Common/Uncommon/Rare/Elite), risk contracts, witness condition, scaling floor
- 32 governments with glitch zone overlay, faction dropout schedule
- Uplift briefing rotation (60+ flavor sets, contextual run lines)
- Government rep (govRep), PROGRESS/ARCHIVE display
- Story fragments: gov/SUBSTRATE arc (3 new)

### v0.6.2
- 8 new verb handlers, 4 ascension traits, NET tab map
- BLACKSITE hidden until adjacent, FIREWALL strength at generation
- Gov/AI subfactions and correct verbs

### v0.6.1
- Uplift Ascension (12 Weaver Traits, SUBSTRATE arc)
- 6 new node types
- Reactive procedural quest engine
- 15 story fragments, 3 threads

### v0.6 — v0.5.x
- Quest hooks, unique items, achievement wiring
- Prestige removed, gov faction, mesh dist scaling
- Grid dist/4, ICE STR from dist, char stats, autorun, per-net rep
