# MESH v0.6.2 — Idle Netrunner

> *"All the nets that ever were, are, or will be make up the Mesh"*

Browser-based idle game set after the Blackout of 2072 — when every AI vanished simultaneously. You are a Weaver: navigating corporate nets, breaking ICE, building rep, and piecing together what happened.

---

## Quickstart

Open `index.html` in any modern browser. No server required. Saves to `localStorage` — 3 named slots + JSON export/import.

**Keys:** `1` `2` `4` — speed · `Space`/`0` — pause · `Esc` — jack out

---

## Architecture

```
FIRMWARE  (deck ROM tutorial — 9 concept nodes → MESH ACCESS)

REAL WORLD  (home base)
  ├── ◎ Email / Quest chains · Deck · Market · Craft · Ops
  └── ⬡ Jack In → MESH

MESH  (coordinate space x:y — unsigned 32-bit integers)
  ├── dist 0–15: Clean · 16–63: Glitch · 64–255: Static · 256+: AI Territory
  ├── ⬡ MESH tab: unlocks on Uplift · ◈ LORE tab: story log
  └── Navigate cardinal neighbors · revisit any cleared net

NET  (16×16 node map, addresses 00–FF)
  ├── Factions: Corp/Crim/Anarch/Neutral (0+) · Gov (16+) · AI (64+)
  ├── 3 companies per faction — subfactions, rep tracked per net
  ├── Net market: faction gear scaled by mesh distance
  └── ⬡ NET tab: compact map view — faction colors, ICE indicators, node types

NODE  (single contract run)
  ├── Grid: dist/4 → TIER_GRIDS (4×4 at dist 0, 8×8 at dist 28, 15×15 at dist 56)
  ├── ICE STR: (base + dist/3 + glitch bonus + static bonus) × ascension multiplier
  └── Complete FF → Uplift briefing → autorun travel
```

---

## Tabs

| Tab | Available | Contents |
|---|---|---|
| ⬡ CHAR | Always | Character stats, XP pool spend |
| ◈ LORE | Always | Story log — fragments, uplift briefings, quest lore, datastore finds |
| ▸ RUN | In-net | Active run, contract board, collapsible program list, log |
| ⬡ NET | In-net | Compact 16×16 net map with node types and ICE indicators |
| ⬡ DECK | Always | Hardware, programs, attachments, black market |
| ▸ MARKET | Always | Global (home) or net market (when jacked in) |
| ⚙ CRAFT | dist 32+ | Blueprints, crafting queue |
| ▦ INV | Always | Inventory management |
| ⚡ OPS | Always | Off-grid operations with ⟳ auto-repeat toggle |
| 🏆 ACH | Always | 95 achievements across 7 categories |
| 📊 STATS | Always | Run/combat/grid/mesh lifetime stats |
| ▲ PROGRESS | Always | XP bar, rep, sub-faction rep |
| ◈ ARCHIVE | Always | Weaver milestone dashboard, unique items, faction standing |
| ⬡ MESH | Post-Uplift | Mesh coordinate nav, visited nets list |
| 💾 SAVE | Always | Save slots, export/import |

---

## Node Types (20 total)

| Node | Icon | Unlocks | Effect |
|---|---|---|---|
| ENTRY | ⬡ | always | Run start |
| EXIT (FF) | ◎ | always | Run end — triggers Uplift on completion |
| EMPTY | · | always | No effect |
| RAM | ▦ | always | Auto-harvests files |
| I/O | ⇄ | always | Speeds downloads, small cred bonus |
| CPU | ◈ | dist 1 | Map, ICE reveal, trap sweep, +breaker STR (stacks) |
| GPU | ▣ | dist 2 | Intercept feed (needs Intercept program) |
| DATASTORE | ◉ | always | Scan/decrypt/download files, lore fragments |
| COP | ⬟ | dist 1 | Silence to stop pings; may spawn Hunter |
| RELAY | ⇢ | dist 2 | Reveals cells in radius, freezes nearest patrol |
| VAULT | ◆ | dist 4 | High-value files; **requires Decrypt program** |
| PROXY | ⬭ | dist 4 | Reroutes patrols away from its row/col |
| FIREWALL | ▣ | dist 3 | Pressure spike if breaker STR insufficient |
| TERMINAL | ⌨ | dist 3 | Reveals and silences all COPs |
| ARCHIVE | ◎ | dist 4 | Historical data, sells at exit |
| ROUTER | ⇌ | dist 3 | −1 all ICE STR per router (stacks), reveals patrols |
| SENSOR | ◉ | dist 5 | Re-visit to disable; +20 trace/sensor at exit |
| SERVER | ▣ | dist 5 | Cred tap + clean-exit bonus |
| NEXUS | ⊛ | dist 8 | Auto-completes linked secondary node |
| BLACKSITE | ◼ | dist 16 | Always ICE-guarded; extreme rewards, triggers sensors |
| LAB | ⚗ | dist 8 | Blueprint progress (2 visits = earn BP) |

---

## Contract Verbs (20 total)

`obtain` `delete` `exfil` `upload` `activate` `modify` `display` `backdoor` `destroy` `access` `terminal` `archive` `intercept_relay` `surveil` `route` `corrupt` `clone` `burn` `trace_back` `harvest`

Each verb maps to a node type and action. New verbs: `corrupt` degrades all files on node; `clone` copies without deleting; `burn` destroys node and extracts everything; `surveil` plants a watcher (reduces COP pings); `route` stacks ICE STR reduction; `trace_back` −20 trace; `harvest` blueprint/cred from research nodes.

---

## Difficulty Scaling

| Dimension | Formula |
|---|---|
| Grid size | `dist/4` → TIER_GRIDS |
| ICE STR | `(base + dist/3 + glitch + static − router) × ascensionDifficulty` |
| Contract rewards | +4% per dist unit |
| Net market prices | +8% per dist unit |
| Blueprint drops | dist ≥ 16, chance scales with dist; Archive/Blacksite/Vault guaranteed |
| Mythic crafting | dist ≥ 32 |
| COP self-repair | dist ≥ 128 |
| Ascension difficulty | ×(1 + count × 0.25) |

---

## Character Stats

| Stat | Effect |
|---|---|
| Neural Buffer | +2 RAM/level |
| Reflex | −0.4 ticks/move/level |
| Stealth | +2 pressure decay/level |
| Integrity | +3 max INT/level |
| Trace Resist | −3% trace gain/level, raises trace cap |
| Intrusion | +1 breaker STR/level |

XP Pool accrues alongside level XP, never consumed by levelling. Cost: 0–19 = `baseCost × (1 + level × 0.5)`. Level 20+ = 4× per level.

Trace carry: 30% on success / 70% on fail, decays 15% each run.

---

## Factions

| Faction | Unlocks | Legend perk (4000 rep) |
|---|---|---|
| Corp | dist 0 | Zero trace at run start |
| Criminal | dist 0 | Hunters 25% slower |
| Anarchist | dist 0 | ICE −2 STR + trap immunity |
| Neutral | dist 0 | Black market −20% |
| Government | dist 16 | High cred multiplier |
| AI | dist 64 | Adaptive ICE resistance |

Passive idle income: ~1₵ per 500 rep per 30s tick (during runs).

---

## Quests

**Named chains** (story-driven):

| Chain | Steps | Trigger | Reward |
|---|---|---|---|
| Ghost Signal | 6 | Uplift | 5000₵ + Signal Fragment |
| Corporate Extraction | 5 | 3 nets cleared | 12000₵ + 300 corp rep |
| Anarchist Underground | 7 | 8 nets cleared | 25000₵ + 800 anarch rep |

**Procedural chains** — generated every 3 nets cleared. Each step is generated *after* the previous completes, driven by chain state (tension 0–100, history, flags). Chain ends when tension hits 100 or max depth (3–6). 7 flavor profiles, 10 step types.

---

## Lore System (◈ LORE tab)

Three source types, each with distinct color and dedup:

| Source | Color | How acquired |
|---|---|---|
| Uplift briefings | Distance color | On every FF completion (7 tiers) |
| Story fragments | By source (blue/purple/green/amber/red) | Milestone-unlocked (15 fragments, 3 threads) |
| Datastore fragments | Orange-red | 15% chance on full scan, 8% on empty |
| Quest lore | Amber | On quest chain completion |
| Unique items | Blue | From quest rewards |

**Story threads:** THE BLACKOUT (what happened) · THE SURVIVORS (REMAINDER-1 and 2) · THE WEAVERS (VEIL and the runners before you)

Post-ascension story continues the SUBSTRATE arc — 4 additional fragments unlock at ascension 1+.

---

## Uplift Ascension

Triggered by completing node FF at dist 115+ (the 128:128 zone).

**Persists:** lore log, story, achievements, unique items, lifetime stats  
**Resets:** gear, level, xp, rep, charStats, mesh position, quests, cred  
**Starting cred:** 500 + 200 × ascension count  
**ICE scaling:** ×(1 + count × 0.25)

**12 Weaver Traits** (choose 1 of 3 per ascension):

| Trait | Category | Effect |
|---|---|---|
| Ghost Protocol | Stealth | No ICE retaliation on first encounter each run |
| Void Runner | Stealth | Trace decays 10% per 30 ticks passively |
| Overclock Core | Combat | +2 combat damage to ICE |
| Mirror Shield | Defense | First integrity damage reflected as pressure reduction |
| Data Broker | Economy | Files sell for +50% cred |
| Black Market Contact | Economy | BM rotates every run, −25% cost |
| Rep Network | Social | Start with 50% of max global rep |
| Deep Mapper | Navigation | Auto-reveals nets within 4 dist |
| Signal Boost | Navigation | RELAY/ROUTER radius ×2 |
| Persistence | Persistence | CPU bonuses carry over between runs in same net |
| ICE Analyst | Knowledge | All ICE STR visible on NET tab before combat |
| Mesh Memory | Knowledge | Net layouts preserved across runs |

---

## Autorun

Toggle **AUTO** in topbar. Unlocked by Uplift.

Within a net (priority): quest node type → quest faction → FF (if unblocked) → 60% toward FF / 40% random

On FF — BFS with quest awareness: `clear_net` targets step dist range · Default: 60% deeper / 30% lateral / 10% toward origin · 8-hop search

---

## File Structure

| File | Contents |
|---|---|
| `js/data.js` | Constants, ICE (14 types), programs, node/verb defs, rep tiers, char stats |
| `js/state.js` | State factory, autorun, uplift BFS |
| `js/save.js` | Save/load/export/import, title screen |
| `js/deck.js` | Inventory, hardware, shop, crafting, blueprints (dist-gated), black market |
| `js/combat.js` | ICE combat, retaliation, per-type effects, trait hooks |
| `js/grid.js` | Traversal, node interactions (20 types), autoDoObj (20 verbs), traps, patrol AI |
| `js/contracts.js` | Contract gen, run lifecycle, rewards, rep, FF/Uplift, trace carry |
| `js/ops.js` | Off-grid operations, auto-repeat |
| `js/achievements.js` | 95 achievements, live refresh |
| `js/render.js` | All render functions, collapsible program list, enriched log |
| `js/main.js` | Game loop, idle income, passive trait ticks |
| `js/mesh.js` | Mesh coordinates, distance, glitch effects |
| `js/netgen.js` | Net layout gen (20 node types), company names, firmware tutorial |
| `js/world.js` | Home, net map, mesh traversal, uplift briefings, datastore lore (10 fragments) |
| `js/quests.js` | Named chains, reactive proc engine, unique items, email toast |
| `js/story.js` | Story fragment system (15 fragments, 3 threads), LORE tab render |
| `js/ascension.js` | Uplift Ascension, 12 Weaver Traits, post-ascension story (4 fragments) |

---

## Version History

### v0.6.2 *(current)*
- Story/lore fragment dedup fixed — ascension fragments were checking wrong key in `S.story.discovered`
- `recordDatastoreLore` now actually called from grid.js (was defined but never wired)
- Story double-delivery guarded by secondary loreLog id check
- Uplift briefing dedup strengthened with title+netKey match
- 8 new contract verb handlers: corrupt, clone, burn, surveil, route, trace_back, harvest, intercept_relay
- 4 unwired ascension traits implemented: mirror_shield, deep_mapper, ice_analyst, mesh_memory
- VAULT node now requires Decrypt program to open
- NET tab map fully implemented (was stub) — 18px compact 16×16 grid, faction colors, ICE/node type indicators
- `mkState` rep object now includes neutral/gov/ai keys
- `traceCarry` corrected to 30%/70% split
- Ascension trigger resets on mesh travel (prevents double-fire)
- Ops auto-repeat now saved across sessions
- Program list collapse toggle in RUN tab header
- Log panel height increased, green header color

### v0.6.1
- Uplift Ascension system — 12 Weaver Traits, reset with preservation, SUBSTRATE storyline
- 6 new node types: ROUTER, SENSOR, SERVER, NEXUS, BLACKSITE, LAB
- Existing node implementations: RELAY reveals radius, PROXY reroutes patrols, FIREWALL checks STR, VAULT gates on Decrypt
- 8 new contract verbs defined and distributed across faction pools
- Reactive procedural quest engine (step-by-step generation, tension system, narrative email gen)
- Story generation system: 15 fragments across 3 threads (story.js), LORE tab rebuilt
- NET tab map implemented (compact 16×16)
- ARCHIVE tab (replaced PRESTIGE): Weaver milestone dashboard
- STATS tab: mesh section added
- Run history enriched with net/node/dist
- Passive idle income from faction rep
- Ops auto-repeat toggle
- Blueprint drops: prestigeReq converted to mesh dist gates
- Government faction generated at dist 16+, AI at dist 64+
- All prestige zombie code removed

### v0.6
- Quest hooks wired (onQuestContractComplete, onQuestNodeComplete, onQuestMeshTravel)
- DATASTORE scanning counts for find_lore quest steps (mid-run)
- In-net email toast on new message
- Unique item system (Signal Fragment + 5% trace resist)
- checkQuestTriggers on load and game init
- Achievement checkers wired to actual tracked data
- charTraceCapBonus wired to trace-out threshold

### v0.5.x
- Grid size dist/4, ICE STR from dist, char stat bonuses verified
- Uplift lore briefings (7 tiers), 95 achievements
- Autorun, XP Pool, CHAR/NET/MESH tabs, per-net rep, net market
