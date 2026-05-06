# MESH v0.7.1 — Idle Netrunner

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
  ├── dist 16–63:  Glitch Zone  ← government territory, glitch overlay, faction dropout
  ├── dist 64–255: Static layer
  ├── dist 256+:   AI Territory

NET  (16×16 node map, addresses 00–FF)
  ├── Cells colored by faction (corp=blue, crim=amber, anarch=red, neutral=green, gov=olive)
  ├── 3 companies per non-gov faction, 1–4 government entities per net
  └── Net market: faction gear + deck components in glitch zone

NODE  (single contract run)
  ├── Grid: dist/4 → TIER_GRIDS (4×4 at dist 0 → 15×15 at dist 56)
  ├── Per-node interaction timing (RAM 0.8s → BLACKSITE 4s)
  └── Progress bar on every active queued cell
```

---

## Glitch Zone (dist 16–63)

Government territory. Other factions thin out and disappear by dist 32.

**Visual overlay** — burst-based event system:
- RAF loop runs continuously; effects fire in discrete bursts (not every frame)
- Burst frequency: ~5s apart at dist 16, ~1s apart at dist 63
- Burst duration: 100–400ms
- Each burst shows one effect type: horizontal slice offsets, digital snow + clusters, displacement lines, vertical tears, RGB channel split, or full-screen flash
- CSS layer: scanlines, vignette, phosphor glow bar (always present)
- Cell-level: jitter, row desaturation/inversion, multi-row displacement (during runs)

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

Gov rep tracked globally per government in `S.govRep`. Tiers: Unknown → Flagged → Vetted → Cleared → Integrated.

---

## Node Types (21 total)

| Node | Icon | Unlocks | Time | Effect |
|---|---|---|---|---|
| ENTRY | ⬡ | always | — | Run start |
| EXIT | ◎ | always | — | Completes run |
| EMPTY | · | always | — | Pass-through |
| RAM | ▦ | always | 0.8s | Auto-collect file |
| I/O | ⇄ | always | 0.8s | Download speed boost, small cred |
| CPU | ◈ | dist 1 | 2s | Map reveal, trap sweep, +breaker STR |
| GPU | ▣ | dist 2 | 2s | Intercept feed — needs Intercept program |
| DATASTORE | ◉ | always | multi | Scan/decrypt/download; 15% lore drop |
| COP | ⬟ | dist 1 | 2s | Silence to stop pings; may spawn Hunter |
| RELAY | ⇢ | dist 2 | 1.2s | Reveals cells in radius, freezes patrol |
| VAULT | ◆ | dist 4 | 3.5s | High-value files — requires Decrypt |
| PROXY | ⬭ | dist 4 | 1.2s | Reroutes patrols away from row/col |
| FIREWALL | ▣ | dist 3 | 2.2s | Pressure spike if breaker STR low |
| TERMINAL | ⌨ | dist 3 | 2.5s | Reveals and silences all COPs |
| ARCHIVE | ◎ | dist 4 | 2.5s | Historical data, sells at exit |
| ROUTER | ⇌ | dist 3 | 1.8s | −1 all ICE STR per hack (stacks) |
| SENSOR | ◉ | dist 5 | 1.5s | Re-visit to disable; +20 trace at exit |
| SERVER | ▣ | dist 5 | 2.5s | Cred tap; clean-exit bonus |
| NEXUS | ⊛ | dist 8 | 2s | Auto-completes linked secondary node |
| BLACKSITE | ◼ | dist 16 | 4s | Hidden until adjacent; ICE-guarded; first visit reveals ICE, return after breach for reward + 40% blueprint + 25% component |
| LAB | ⚗ | dist 8 | 3s | Blueprint progress (2 visits = earn blueprint) |

---

## ICE Types (14 total)

| ICE | Unlocks | Mobile | Retaliation |
|---|---|---|---|
| GATEKEEPER | dist 0 | — | Raises alert |
| BARRIER | dist 0 | — | +trace |
| GUARDIAN | dist 0 | — | Disables random program |
| HUNTER | dist 0 | **yes** | Activates as moving hunter at run start |
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

### Faction tiers (corp / crim / anarch / neutral)
| Tier | Floor | Perk |
|---|---|---|
| Unknown | 0 | — |
| Known | 100 | Shop access, basic contracts |
| Trusted | 500 | Advanced contracts |
| Elite | 1500 | Elite contracts, faction perk active |
| Legend | 4000 | Legend perk active |

Rep floor: earned tier level is permanent — penalties can never push rep below the floor.

### Government rep (per government, glitch zone)
Unknown → Flagged (100) → Vetted (500) → Cleared (1500) → Integrated (4000)

### Quest rep steps
`rep_faction` quest objectives now check rep continuously — they advance immediately if the threshold is already met when the step starts, not just on next contract completion.

---

## Deck Crafting (CRAFT tab, dist 16+)

Assembled from a **chassis** + **components**. Stats apply live.

### Chassis
Drops from government contracts (diff 2: 6%, diff 3: 12%, diff 4: 25%). Rarities: Salvage → Standard → Military → Advanced → Prototype. Tier (1–3) scales with gov rep.

**Slot capacity doubles each chassis tier:** T1=1.0 cap/slot, T2=2.0, T3=4.0

### Component capacity cost = 1 / 2^(tier−1)
T1=1.0 · T2=0.5 · T3=0.25 · T4=0.125 · T5=0.0625 · T6=0.03125

Mix freely: 1×T2 + 2×T3 = 1.0 ✓ in a T1 slot

### Component categories (T1–T6 each)
| Category | Stat | T1→T6 range |
|---|---|---|
| RAM | +RAM | +2 → +20 |
| CPU | +breaker STR, −action ticks | +1/−1 → +12/−8 |
| Storage | +file storage | +3 → +28 |
| Accessory | varies | Trace Filter / ICE Scanner / Ghost Protocol / Integrity Shield / Pressure Dampener |

**Acquisition:** Gov contracts (chassis 6–25%, components 12–30%), LAB nodes (30%), TERMINAL (8%), BLACKSITE (25%), net market (4 per net in glitch zone).

---

## Blueprints

Starter blueprints always available. Higher tiers unlock by mesh distance:

| Tier | Dist |
|---|---|
| T4 programs | 8+ |
| T5 programs | 16+ |
| T6 programs | 24+ |
| Mythic decks | 32+ |

Blueprints drop from: diff 3+ contracts (15%), diff 4 (30%), LAB (2 visits), BLACKSITE (40%), DATASTORE (rare).

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

---

## Quests

**Named chains:**
| Chain | Steps | Trigger | Reward |
|---|---|---|---|
| Ghost Signal | 6 | Uplift | 5000₵ + Signal Fragment |
| Corporate Extraction | 5 | 3 nets cleared | 12000₵ + 300 corp rep |
| Anarchist Underground | 7 | 8 nets cleared | 25000₵ + 800 anarch rep |

**Procedural chains** — generated every 3 nets, tension-driven, 7 flavor profiles, 10 step types.

Emails on home screen only. Quest objectives persist through save/load.

---

## Save System

Full run state persists: active contracts, grid, storage, player position, integrity, trace, alert, patrols, hunters. `runSnapshot` rebuilt on load. Persists: quests, story, ascension, govRep, craftedDeck, uniqueItems, uplift seen state.

---

## Uplift Ascension

Triggered at dist 115+. Choose 1 of 3 Weaver Traits.

**Persists:** lore, story, achievements, unique items, lifetime stats, govRep, craftedDeck  
**Resets:** gear, level, xp, rep, charStats, mesh, quests  
**ICE scaling:** ×(1 + count × 0.25)

**12 Weaver Traits:** Ghost Protocol · Void Runner · Overclock Core · Mirror Shield · Data Broker · Black Market Contact · Rep Network · Deep Mapper · Signal Boost · Persistence · ICE Analyst · Mesh Memory

---

## File Structure

| File | Contents |
|---|---|
| `js/data.js` | ICE (14), programs, node defs + NODE_INTERACT_TICKS, 28 subfactions |
| `js/state.js` | State factory, autorun (LAB priority when in progress), moveTicks |
| `js/save.js` | Save/load — full run state + runSnapshot rebuild |
| `js/deck.js` | Inventory, hardware, shop, blueprints (dist-gated) |
| `js/deck_crafting.js` | Chassis + components, market purchase, stat aggregation |
| `js/combat.js` | ICE combat, re-entrancy guard, mobile ICE override STR |
| `js/grid.js` | Traversal, 21 node interactions, activateMobileICE, BLACKSITE two-visit fix |
| `js/contracts.js` | Contract gen, scaling, rep floors, gov routing |
| `js/ops.js` | Off-grid operations, auto-repeat |
| `js/achievements.js` | 95 achievements (all callers wired) |
| `js/render.js` | All render; faction-colored net map; dist-gated blueprints; gov rep tabs |
| `js/main.js` | Game loop, trace cap threshold, glitch overlay tick |
| `js/mesh.js` | Mesh coordinates, distance, graduated glitch levels |
| `js/netgen.js` | Net layout gen, company names, NEXUS links, firmware |
| `js/world.js` | Home, net map, mesh traversal, genNetContract |
| `js/quests.js` | Named chains, proc engine, checkRepFactionSteps, email |
| `js/story.js` | Story fragments + gov/SUBSTRATE fragments |
| `js/glitch.js` | 32 governments, faction dropout, burst-based glitch overlay |
| `js/ascension.js` | Uplift Ascension, 12 Weaver Traits, SUBSTRATE arc |

---

## Version History

### v0.7.1 *(current)*
- **Glitch overlay** — burst-based event system: effects fire 1–5 seconds apart, visible for 100–400ms each; fixed timer being cancelled by repeated `updateGlitchOverlay` calls (was resetting every 3s, preventing bursts from ever firing)
- **Storage fix** — `S.storageMax` (stale cached field) replaced with live `storageMax()` call everywhere; storage was capping at 8 regardless of hardware or deck components
- **Net map** — cells colored by faction using same seed as `genNodeContract` (was using different seed, causing color/contract mismatch)
- **Quest rep steps** — `checkRepFactionSteps()` runs on contract complete, quest accept, and `checkQuestTriggers`; steps no longer get stuck waiting for a contract that never comes
- **Hunter ICE** — `activateMobileICE()` now correctly called after `buildGrid()` in `launchRun` (was defined but never wired in)
- **BLACKSITE reward** — `blacksiteDone` no longer set before ICE check; reward now fires correctly on return visit after breach
- **Blueprint gates** — all `prestigeReq` checks replaced with `dist × 8` equivalents; T4+ blueprints and programs now visible

### v0.7.0
- Deck crafting system (chassis + components, 4 categories, capacity math)
- Save/load full run state; runSnapshot rebuilt; quest objectives survive reload
- Canvas glitch overlay (horizontal slices, snow, tears, displacement, RGB split)
- Government system (32 procedural govs, faction dropout, gov rep UI)
- Trace cap threshold from Trace Resist stat
- Three achievements wired (black_market, intel_op, triple_kill)
- Email body inline (was hidden behind z-index)
- Node timing per type (RAM 0.8s → BLACKSITE 4s)

### v0.6.x
- Uplift Ascension, 12 Weaver Traits, SUBSTRATE arc
- Reactive procedural quest engine
- Contract rarity, risk contracts, witness condition
- Rep floors, faction perks, per-net rep
- Prestige fully removed, dist-based gating throughout
