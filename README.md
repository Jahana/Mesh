# MESH v0.6.3 — Idle Netrunner

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
  ├── ◎ Email · Quest chains · Deck · Market · Craft · Ops
  └── ⬡ Jack In → MESH

MESH  (coordinate space x:y — 32-bit unsigned integer pairs)
  ├── dist 0–15: Clean  ·  16–63: Glitch  ·  64–255: Static  ·  256+: AI Territory
  ├── ◈ LORE tab: story fragments, uplift briefings, datastore finds
  └── ⬡ MESH tab: coordinate navigation, visited net list (unlocks on Uplift)

NET  (16×16 node map, addresses 00–FF)
  ├── Factions: Corp/Crim/Anarch/Neutral (0+) · Gov (16+) · AI (64+)
  ├── 3 companies per faction — subfactions, per-net rep tracking
  ├── Net market: faction gear scaled by mesh distance
  └── ⬡ NET tab: compact 18px map — faction colors, node types, ICE indicators

NODE  (single contract run)
  ├── Grid size: dist/4 → TIER_GRIDS (4×4 at dist 0 → 15×15 at dist 56)
  ├── ICE STR: (base + dist/3 + glitch + static − router) × ascensionDifficulty
  └── Complete FF → Uplift briefing → autorun BFS travel
```

---

## Tabs

| Tab | Available | Contents |
|---|---|---|
| ⬡ CHAR | Always | Character stats, XP pool |
| ◈ LORE | Always | Story fragments, uplift briefings, datastore/quest lore |
| ▸ RUN | In-net | Run view, contract board, collapsible program list, log |
| ⬡ NET | In-net | Compact 16×16 net map |
| ⬡ DECK | Always | Hardware, programs, attachments, black market |
| ▸ MARKET | Always | Home or net market (faction gear by dist) |
| ⚙ CRAFT | dist 32+ | Blueprints, crafting queue |
| ▦ INV | Always | Inventory |
| ⚡ OPS | Always | Off-grid operations, ⟳ auto-repeat toggle |
| 🏆 ACH | Always | 95 achievements |
| 📊 STATS | Always | Lifetime stats with mesh section |
| ▲ PROGRESS | Always | XP, rep, sub-faction rep |
| ◈ ARCHIVE | Always | Weaver milestone dashboard, unique items |
| ⬡ MESH | Post-Uplift | Mesh nav, visited nets |
| 💾 SAVE | Always | Slots, export/import |

---

## Node Types (21 total)

| Node | Icon | Unlocks at | Mechanic |
|---|---|---|---|
| ENTRY | ⬡ | always | Run start point |
| EXIT (FF) | ◎ | always | Completes run, triggers Uplift |
| EMPTY | · | always | Pass-through |
| RAM | ▦ | always | Auto-collect file |
| I/O | ⇄ | always | Download speed boost, small cred |
| CPU | ◈ | dist 1 | Reveal map, sweep traps, +breaker STR (stacks) |
| GPU | ▣ | dist 2 | Intercept feed — needs Intercept program |
| DATASTORE | ◉ | always | Scan/decrypt/download files; 15% lore drop |
| COP | ⬟ | dist 1 | Silence to stop pings; may spawn Hunter |
| RELAY | ⇢ | dist 2 | Reveals cells in radius, freezes nearest patrol |
| VAULT | ◆ | dist 4 | High-value files — **requires Decrypt program** |
| PROXY | ⬭ | dist 4 | Reroutes patrols away from its row and column |
| FIREWALL | ▣ | dist 3 | Pressure spike if breaker STR < firewallStr |
| TERMINAL | ⌨ | dist 3 | Reveals and silences all COPs |
| ARCHIVE | ◎ | dist 4 | Historical data, sells at exit |
| ROUTER | ⇌ | dist 3 | −1 all ICE STR per router hacked (stacks), reveals patrols |
| SENSOR | ◉ | dist 5 | Re-visit to disable; +20 trace/sensor at exit if active |
| SERVER | ▣ | dist 5 | Tap for cred; clean-exit bonus |
| NEXUS | ⊛ | dist 8 | Links to a remote node; visiting auto-completes the linked objective |
| BLACKSITE | ◼ | dist 16 | Hidden until adjacent; always ICE-guarded; extreme rewards, triggers sensors |
| LAB | ⚗ | dist 8 | Blueprint progress (2 visits = earn BP) |

---

## ICE Types (14 total)

| ICE | Unlocks | Base STR | Retaliation Effect |
|---|---|---|---|
| GATEKEEPER | dist 0 | 2 | Raises alert level |
| BARRIER | dist 0 | 2 | +trace (resist reduces) |
| GUARDIAN | dist 0 | 2 | Disables random installed program |
| HUNTER | dist 0 | 3 | Mobile — tracks player |
| PROBE | dist 4 | 3 | 60% chance to disable a program |
| BLACK_ICE | dist 8 | 6 | Permanently −1 max INT; final strike on death |
| TAR_PIT | dist 12 | 2 | Stacks movement slow (+4 ticks/stack) |
| TRACER | dist 16 | 2 | +10 pressure; may spawn Hunter |
| KRAKEN | dist 32 | 5 | Spawns Hunter on each hit; blocks entire rows |
| MIMIC | dist 48 | 3 | Disguised as benign node until retaliation reveals it |
| LEECH | dist 64 | 3 | Drains breaker STR permanently this run (stacks) |
| CASCADE | dist 96 | 4 | Spawns a Barrier on defeat |
| ARCHITECT | dist 128 | 3 | Self-repairs COP nodes; +15 pressure on retaliation |
| OMEGA | dist 192 | 7 | All effects: pressure + trace + permanent INT loss |

All ICE STR scales: `(base + dist/3 + glitch bonus + static bonus − router hacks) × ascension multiplier`

**Hunter varieties:** Standard · Bloodhound (fast, raises alert on contact) · Spike (slow, disables program) · Ghost (invisible, ignores stealth) · Pack (spawns a second on contact)

---

## Contract System

### Generation
Contracts are generated from **26 subfactions** across 6 parent factions. Each subfaction has distinct verb pools (basic/advanced/elite), conditions, cred/rep multipliers, and contract names. Difficulty (1–4) gates on level and faction rep.

### Rarity
| Rarity | Badge | Reward mult | Condition |
|---|---|---|---|
| Common | — | ×1.0 | diff 1–2 |
| Uncommon | ◈ | ×1.15 | diff 3 or has condition |
| Rare | ★ | ×1.4 | diff 4 or diff 3 + condition |
| Elite | ☠ | ×1.8 | diff 4 + condition + dist 16+ |

### Conditions
| Condition | Bonus | Available in |
|---|---|---|
| Stealth | +60% cred, +2.5× rep | Corp, Ghost Syndicate, Gov |
| Speed | +60% cred, +2.5× rep if <60s | Runners' Guild, Corp, Crim |
| Witness | +60% cred, +2.5× rep, no Hunter spawned | Ghost Syndicate, Runners' Guild, Anarch/Crim diff 3+ |

**Risk contracts** — 30% of elite contracts are RISK: no partial credit, ×2 payout on full completion.

### Reward Scaling
```
floor = diff × 30 × (1 + dist × 0.06) × objectives    ← minimum always meaningful
roll  = diff × rnd(20,60) × (1 + tier × 0.25) × objectives
cred  = (floor + roll) × subfactionMult × rarityMult
rep   = diff × 25 × (1 + tier/3 + dist × 0.04) × repMult
```
Partial completion: 70% of proportional cred (0% for RISK contracts).

### Verbs (20 total)
`obtain` `delete` `exfil` `upload` `activate` `modify` `display` `backdoor` `destroy` `access` `terminal` `archive` `intercept_relay` `surveil` `route` `corrupt` `clone` `burn` `trace_back` `harvest`

---

## Factions & Subfactions

| Parent | Subfactions | Rep conflict | Legend perk (4000) |
|---|---|---|---|
| Corp | Axiom Biotech · Ironwall Sec · Silk Genomics · Meridian Finance · Vantage Media | Anarch | Zero trace at run start |
| Criminal | Runners' Guild · Fixer Network · Ghost Syndicate · The Cartel · Deadcode | — | Hunters 25% slower |
| Anarchist | Reclaim · The Static · Red Cell · Null Signal · Ironclad | Corp | ICE −2 STR + trap immunity |
| Neutral | Freelance · Data Brokers · Mesh Collective · Shadow Market · Cipher | — | Black market −20% |
| Government | Bureau of Intel · Enforcement Div · Regulatory Net | — | High cred multiplier |
| AI | Pattern Echo · Signal Remnant · Deep Process | — | Adaptive ICE resistance |

Passive idle income: ~1₵ per 500 rep per 30s tick during runs.

---

## Character Stats

| Stat | Effect |
|---|---|
| Neural Buffer | +2 RAM/level |
| Reflex | −0.4 ticks/move/level |
| Stealth | +2 pressure decay/level |
| Integrity | +3 max INT/level |
| Trace Resist | −3% trace gain/level; raises trace cap |
| Intrusion | +1 all breaker STR/level |

Cost: 0–19 = `baseCost × (1 + level × 0.5)`. Level 20+ = 4× per level. No cap.  
Trace carry: 30% on success / 70% on fail, decays 15% each run.

---

## Quests

**Named chains:**

| Chain | Steps | Trigger | Reward |
|---|---|---|---|
| Ghost Signal | 6 | Uplift | 5000₵ + Signal Fragment unique |
| Corporate Extraction | 5 | 3 nets cleared | 12000₵ + 300 corp rep |
| Anarchist Underground | 7 | 8 nets cleared | 25000₵ + 800 anarch rep |

**Procedural chains** — generated every 3 nets cleared when no chain is active. Each step generated reactively after the previous completes, driven by tension (0–100), chain history, and context. Ends at tension ≥ 100 or max depth (3–6). 7 flavor profiles, 10 step types.

Autorun overrides per step: `blockFF` · `targetFaction` · `targetDist` · `priorityNodeType`

---

## Lore System (◈ LORE tab)

| Source | Color | How unlocked |
|---|---|---|
| Story fragments | By source type | Milestone-based (15 frags, 3 threads) |
| Uplift briefings | Distance gradient | Every FF completion (7 tiers) |
| Datastore fragments | Orange-red | 15% on full scan, 8% on empty |
| Quest lore | Amber | Quest chain completion |
| Unique items | Blue | Quest rewards |

**Threads:** THE BLACKOUT · THE SURVIVORS (REMAINDER-1 & 2) · THE WEAVERS (VEIL & runners before you)  
Post-ascension SUBSTRATE arc: 4 additional fragments at ascension 1+ / dist 64+.

---

## Uplift Ascension

Triggered at dist 115+ (128:128 zone). Choose 1 of 3 Weaver Traits. The story continues.

**Persists:** lore, story, achievements, unique items, lifetime stats  
**Resets:** gear, level, xp, rep, charStats, mesh, quests, cred (starts 500 + 200×count)  
**ICE scaling:** ×(1 + count × 0.25)

**12 Weaver Traits:**

| Trait | Category | Effect |
|---|---|---|
| Ghost Protocol | Stealth | No ICE retaliation on first encounter per run |
| Void Runner | Stealth | Trace decays 10% per 30 ticks passively |
| Overclock Core | Combat | +2 damage to ICE in combat |
| Mirror Shield | Defense | First integrity damage reflected as pressure reduction |
| Data Broker | Economy | Files sell for +50% cred |
| Black Market Contact | Economy | BM rotates every run, −25% cost |
| Rep Network | Social | Start with 50% of max global rep |
| Deep Mapper | Navigation | Auto-reveals nets within 4 dist |
| Signal Boost | Navigation | RELAY/ROUTER node radius ×2 |
| Persistence | Persistence | CPU bonuses carry over between runs in same net |
| ICE Analyst | Knowledge | ICE type visible on NET tab before combat |
| Mesh Memory | Knowledge | Net layouts preserved across runs |

---

## Autorun

Toggle **AUTO** in topbar. Unlocks on Uplift.

Within a net (priority): quest node type → quest faction → FF if unblocked → 60% toward FF / 40% random

On FF — BFS: quest `clear_net` targets dist range midpoint · Default: 60% deeper / 30% lateral / 10% toward origin · 8-hop search

---

## File Structure

| File | Contents |
|---|---|
| `js/data.js` | ICE (14), programs, node defs (21), verb defs (20), 26 subfactions, rep tiers |
| `js/state.js` | State factory, autorun, uplift BFS |
| `js/save.js` | Save/load/export/import, title screen |
| `js/deck.js` | Inventory, hardware, shop, crafting, blueprints, black market |
| `js/combat.js` | ICE combat, per-type retaliation, trait hooks |
| `js/grid.js` | Traversal, all 21 node interactions, autoDoObj (20 verbs), patrol AI |
| `js/contracts.js` | Contract gen (rarity, risk, witness), run lifecycle, scaling, rep |
| `js/ops.js` | Off-grid operations, auto-repeat |
| `js/achievements.js` | 95 achievements, live refresh |
| `js/render.js` | All render, rarity badges, BLACKSITE hide, MIMIC reveal |
| `js/main.js` | Game loop, idle income, passive trait ticks |
| `js/mesh.js` | Mesh coordinates, distance, glitch effects |
| `js/netgen.js` | Net layout gen, company names, NEXUS links, firmware tutorial |
| `js/world.js` | Home, net map, uplift briefings, datastore lore, mesh traversal |
| `js/quests.js` | Named chains, reactive proc engine, unique items, email toast |
| `js/story.js` | 15 story fragments (3 threads), LORE tab render |
| `js/ascension.js` | Uplift Ascension, 12 Weaver Traits, SUBSTRATE story arc |

---

## Version History

### v0.6.3 *(current)*
**Contract system overhaul:**
- Reward floor now scales with dist — no more sub-200₵ contracts at dist 50
- Rep gain scales with mesh distance (deeper = faster faction trust)
- Contract rarity: Common / Uncommon ◈ / Rare ★ / Elite ☠ — multipliers 1.0×–1.8×
- Risk contracts — 30% of elite: no partial credit, ×2 payout
- Condition bonuses: +60% cred / +2.5× rep (up from 40% / 2×)
- New Witness condition: complete without any Hunter spawning (criminal/anarch)
- Speed condition fixed: now checks actual elapsed real-time (<60s), not broken tick counter
- Partial credit: 70% proportional (up from 50%)

**Audit fixes:**
- MIMIC `mimicRevealed` now synced to cell (render disguise drops correctly)
- BLACKSITE hidden until player adjacent, ICE always assigned in buildGrid
- FIREWALL `firewallStr` computed at generation (was always 0)
- BLACK_ICE and ARCHITECT `prestigeReq` removed (were preventing them from spawning)
- New nodes (ROUTER/SENSOR/SERVER/LAB/BLACKSITE) added to buildGrid random pool
- NEXUS links assigned when placed randomly in buildGrid
- VAULT `access` verb now gates on Decrypt program
- 6 new subfactions: bureau_intel, enforcement_div, regulatory_net, pattern_echo, signal_remnant, deep_process
- Gov/AI contracts use correct new verbs (surveil, route, harvest, trace_back, clone, burn)

### v0.6.2
- Story/lore fragment dedup fixed across all sources
- 8 new contract verb handlers implemented
- 4 unwired ascension traits implemented (mirror_shield, deep_mapper, ice_analyst, mesh_memory)
- NET tab map fully implemented (18px compact grid)
- Ops auto-repeat persisted across sessions

### v0.6.1
- Uplift Ascension system (12 Weaver Traits, SUBSTRATE story arc)
- 6 new node types with full interactions
- Reactive procedural quest engine (tension-based, narrative email gen)
- Story generation: 15 fragments, 3 threads, LORE tab rebuilt
- All prestige zombie code removed

### v0.6
- Quest hooks wired (contracts, nodes, mesh travel)
- Unique item system (Signal Fragment)
- Achievement checkers wired to actual data
- checkQuestTriggers on load

### v0.5.x
- Grid dist/4, ICE STR from dist, char stat bonuses
- Uplift lore briefings, 95 achievements
- Autorun, CHAR/NET/MESH tabs, per-net rep, net market
