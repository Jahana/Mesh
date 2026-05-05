# MESH v0.6.1 — Idle Netrunner

> *"All the nets that ever were, are, or will be make up the Mesh"*

Browser-based idle game set after the Blackout of 2072, when every AI vanished simultaneously. You are a Weaver: navigating corporate nets, breaking ICE, building rep, and piecing together what happened.

---

## Quickstart

Open `index.html` in any modern browser. No server required. Saves to `localStorage` — 3 named slots + JSON export/import.

**Keys:** `1` `2` `4` — speed · `Space`/`0` — pause · `Esc` — jack out

---

## Architecture

```
FIRMWARE  (deck ROM tutorial — 9 concept nodes → MESH ACCESS)

REAL WORLD  (home base)
  ├── ◎ Email / Quest chains · Deck · Market · Craft (dist 32+) · Ops
  └── ⬡ Jack In → MESH

MESH  (coordinate space x:y — unsigned 32-bit integers)
  ├── dist 0–15: Clean · 16–63: Glitch · 64–255: Static · 256+: AI
  ├── ⬡ MESH tab: unlocks on Uplift · ◈ LORE tab: story log
  └── Navigate cardinal neighbors · revisit any net

NET  (16×16 node map, 00–FF)
  ├── Factions: Corp/Crim/Anarch/Neutral (0+) · Gov (16+) · AI (64+)
  ├── 3 companies per faction — subfactions, rep per net
  ├── Net market: faction gear scaled by distance
  └── ⬡ NET tab always visible in-net · click node → preview → ENTER

NODE  (single contract run)
  ├── Grid: dist/4 → TIER_GRIDS (4×4 at dist 0, 8×8 at dist 28, 15×15 at dist 56)
  ├── ICE STR: base + dist/3 + glitch bonus (dist 16+) + static bonus (dist 64+)
  └── Complete FF → Uplift briefing → autorun travel
```

---

## Tabs

| Tab | Always? | Contents |
|---|---|---|
| ⬡ CHAR | ✓ | Character stats, XP pool spend |
| ◈ LORE | ✓ | Story log — Uplift briefings, quest lore, datastore fragments |
| ▸ RUN | In-net | Active run, contract board, setup panel |
| ⬡ NET | In-net | Net map — view/navigate independently of run |
| ⬡ DECK | ✓ | Hardware, programs, attachments, black market |
| ▸ MARKET | ✓ | Global (home) or net market (when jacked in) |
| ⚙ CRAFT | dist 32+ | Blueprints, crafting queue |
| ▦ INV | ✓ | Inventory management |
| ⚡ OPS | ✓ | Off-grid operations with auto-repeat toggle |
| 🏆 ACH | ✓ | 95 achievements, 7 categories |
| 📊 STATS | ✓ | Run/combat/grid/mesh lifetime stats |
| ▲ PROGRESS | ✓ | XP bar, rep, sub-faction rep by net |
| ◈ ARCHIVE | ✓ | Weaver milestone summary, unique items, lore preview |
| ⬡ MESH | Post-Uplift | Mesh coordinate nav, neighbor nets, visited nets |
| 💾 SAVE | ✓ | Save slots, export/import |

---

## Difficulty Scaling (all from mesh distance)

| Dimension | Formula |
|---|---|
| Grid size | `dist/4` → TIER_GRIDS[tier] |
| ICE STR | `base + dist/3 + floor((dist-16)/8) + floor((dist-64)/16)` |
| Contract rewards | `+4% per dist unit` |
| Net market prices | `+8% per dist unit` |
| Net market gear | `+1 stat tier per 8 dist` |
| Blueprint drops | dist ≥ 16, chance scales; Archive nodes guaranteed |
| Mythic crafting | dist ≥ 32 |
| COP self-repair | dist ≥ 128 |

---

## Character Stats (⬡ CHAR tab)

XP Pool accrues alongside level XP, never consumed by levelling. Shown in topbar as **POOL**.

| Stat | Effect | Applied In |
|---|---|---|
| Neural Buffer | +2 RAM / level | `ramMax()` |
| Reflex | −0.4 ticks/move / level | `moveTicks()` |
| Stealth | +2 pressure decay / level | decay + soothe |
| Integrity | +3 max INT / level | `maxInt()` |
| Trace Resist | −3% trace gain / level | all trace sources |
| Intrusion | +1 breaker STR / level | combat STR |

Cost: 0–19 = `baseCost × (1 + level × 0.5)`. Level 20+ = 4× per level. No cap.

Trace cap = 100 + Trace Resist cap bonus. Trace carry between runs: 30% on success / 70% on fail, decays 15% each run.

---

## Factions & Reputation

| Faction | Unlocks at | Legend Perk (4000 rep) |
|---|---|---|
| Corp | dist 0 | 0 trace at run start |
| Criminal | dist 0 | Hunters 25% slower |
| Anarchist | dist 0 | ICE −2 STR + trap immunity |
| Neutral | dist 0 | Black market −20% |
| Government | dist 16 | High cred multiplier |
| AI | dist 64 | Adaptive ICE |

Passive idle income: 1₵ per 500 global rep per 30s tick (during runs). Local company rep also contributes.

---

## Quests (◎ Email)

**Named chains** (story-driven, triggered by milestones):

| Chain | Steps | Trigger | Reward |
|---|---|---|---|
| Ghost Signal | 6 | Uplift | 5000₵ + Signal Fragment unique |
| Corporate Extraction | 5 | 3 nets cleared | 12000₵ + 300 corp rep |
| Anarchist Underground | 7 | 8 nets cleared | 25000₵ + 800 anarch rep |

**Procedural chains** (reactive, unlimited) — generated every 3 nets cleared when no chain is active. Each chain grows step-by-step; new steps are generated *after* the previous completes based on chain state, tension (0–100), history, and context. Chains end when tension hits 100 or max depth (3–6) is reached.

- 7 flavor profiles: corp_espionage, crim_heist, anarch_op, neutral_mystery, gov_contract, fixer_gig, deep_run
- 10 step types with weighted selection that responds to chain history and flags
- Email body generated fresh each step from chain narrative state
- Toast notification appears in-net when new email arrives

Autorun overrides per step: `blockFF` · `targetFaction` · `targetDist` · `priorityNodeType`

---

## Lore System (◈ LORE tab)

Three sources:
- **Uplift briefings** — 7 distance tiers, on every FF completion
- **Quest lore** — narrative drops on chain completion
- **Datastore fragments** — 10 unique pre-Blackout fragments, 15% drop chance

---

## Operations (⚡ OPS tab)

Off-grid operations across Intel / Network / Maintenance categories. Each op has a **⟳ auto-repeat** toggle — when enabled, the op automatically re-queues 500ms after completing.

---

## Unique Items

Rare artifacts from quest rewards, persist permanently. Currently:
- **Signal Fragment** — +5% trace resist. From Ghost Signal chain.

---

## Autorun

Toggle **AUTO** in topbar. Unlocked by Uplift.

**Within a net (priority order):**
1. Quest priority node type?
2. Quest target faction nodes?
3. FF accessible and not blocked?
4. 60% toward FF · 40% random

**On FF — uplift BFS with quest awareness:**
- Quest `clear_net`: targets step's dist range midpoint
- Default: 60% deeper · 30% lateral · 10% toward origin
- 8-hop search

---

## File Structure

| File | Contents |
|------|----------|
| `js/data.js` | Constants, ICE, programs, manufacturers, rep tiers, char stats, net market |
| `js/state.js` | State, autorun, moveTicks, uplift BFS |
| `js/save.js` | Save/load/export/import, title screen |
| `js/deck.js` | Inventory, hardware, attachments, shop, crafting, blueprints (dist-gated) |
| `js/combat.js` | ICE combat, retaliation, trace resist, unique bonuses |
| `js/grid.js` | Traversal, ICE AI, traps (tracked), datastore lore drops, blueprint drops |
| `js/contracts.js` | Contract gen, run lifecycle, rewards, rep, FF/Uplift, trace carry |
| `js/ops.js` | Off-grid operations, auto-repeat |
| `js/achievements.js` | 95 achievements, live refresh |
| `js/render.js` | All render, Weaver Archive tab, enriched run history |
| `js/main.js` | Game loop, idle income tick, pressure decay |
| `js/mesh.js` | Mesh coordinates, distance, glitch effects |
| `js/netgen.js` | Net layout, company names, firmware tutorial |
| `js/world.js` | Home, net map, mesh traversal, uplift briefings, datastore lore |
| `js/quests.js` | Quest chains, reactive proc gen engine, unique items, email delivery |

---

## Version History

### v0.6.1 *(current)*
- Trap stat tracking added (`trapsTriggered`)
- ◈ ARCHIVE tab (was PRESTIGE): Weaver milestone dashboard — mesh stats, unique items, faction standing, recent lore
- STATS tab: new Mesh section (nets cleared, deepest dist, quests done, XP pool)
- Run history: now stores and displays net coordinates, node address, mesh distance
- traceCarry: decays 15% each run (was permanent until next run)
- Passive idle income from faction/company rep during runs
- Ops auto-repeat: ⟳ toggle button per operation
- Grid size: fixed both enterNode paths to use dist/4 (was still dist/16 in one path)

### v0.6
- Reactive procedural quest engine (chain grows step-by-step, email generated from state)
- Named quest chains: Ghost Signal, Corporate Extraction, Anarchist Underground
- Quest hooks wired: onQuestContractComplete, onQuestNodeComplete, onQuestMeshTravel
- DATASTORE scanning counts for find_lore quest steps (fires mid-run)
- In-net email toast on new message arrival
- Blueprint drops fixed: prestigeReq converted to mesh dist (P1=dist8, P2=dist16, etc.)
- Government faction generated at dist 16+, AI at dist 64+
- Prestige fully removed from all game systems
- Run summary enriched: realMs, cred, contracts, copsSilenced, damageThisRun
- Achievement checkers wired to actual tracked data
- Unique item system (Signal Fragment, UNIQUE_ITEMS catalog)
- Quest faction targeting in autorun (prefers matching company nodes)
- Datastore lore fragments (10 unique, 15% drop)
- charTraceCapBonus wired to trace-out threshold
- checkQuestTriggers runs on load and game init

### v0.5.4
- Grid size dist/4; ICE STR from dist not level
- All 6 character stat bonuses verified and wired
- Distance-scaled contract rewards; trace display rounded

### v0.5.3
- Uplift lore briefings (7 distance tiers)
- 95 achievements across 7 categories

### v0.5.x
- Autorun, XP Pool, CHAR tab, NET tab, MESH tab, run summary
- Per-net company rep, net market, suggested loadout, Apply Loadout

### v0.4.x
- 4-tier architecture, net map, firmware tutorial, net generation

### v0.1–v0.3
- Core grid traversal, ICE combat, contracts, multi-file refactor
