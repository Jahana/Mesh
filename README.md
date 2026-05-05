# MESH v0.6 — Idle Netrunner

> *"All the nets that ever were, are, or will be make up the Mesh"*

Browser-based idle game set after the Blackout of 2072, when every AI vanished simultaneously. You are a Weaver: navigating corporate nets, breaking ICE, building rep, and piecing together what happened.

---

## Quickstart

Open `index.html` in any modern browser. No server required. Saves to `localStorage` with 3 named slots + JSON export/import.

**Keys:** `1` `2` `4` — speed · `Space`/`0` — pause · `Esc` — jack out

---

## Architecture

```
FIRMWARE  (deck ROM tutorial — 9 concept nodes → MESH ACCESS)

REAL WORLD  (home base)
  ├── Email / Quest chains · Deck · Market · Craft (dist 32+) · Ops
  └── ⬡ Jack In → MESH

MESH  (coordinate space x:y — unsigned 32-bit integers)
  ├── dist 0–15: Clean · dist 16–63: Glitch · dist 64–255: Static · dist 256+: AI
  ├── ⬡ MESH tab: unlocks on Uplift · ◈ LORE tab: story log
  └── Navigate cardinal neighbors · revisit any net

NET  (16×16 node map, 00–FF)
  ├── Factions by dist: Corp/Crim/Anarch/Neutral (0+) · Gov (16+) · AI (64+)
  ├── 3 companies per faction — subfactions, rep per net
  ├── Net market: faction gear scaled by distance
  └── ⬡ NET tab always visible in-net · click node → preview → ENTER

NODE  (single contract run)
  ├── Grid: 4×4 at dist 0 → 15×15 at dist 56 (dist/4)
  ├── ICE STR: base + dist/3 + glitch bonus + static bonus
  └── Complete FF → Uplift briefing → autorun travel
```

---

## File Structure

| File | Contents |
|------|----------|
| `js/data.js` | Constants, ICE, programs, manufacturers, rep tiers, character stats, net market |
| `js/state.js` | State, autorun (with quest overrides), uplift BFS |
| `js/save.js` | Save/load/export/import, title screen |
| `js/deck.js` | Inventory, hardware, attachments, shop, crafting, blueprints, black market |
| `js/combat.js` | ICE combat, retaliation, trace resist, unique item bonuses |
| `js/grid.js` | Traversal, ICE AI, traps, datastore lore drops, blueprint drops |
| `js/contracts.js` | Contract gen, run lifecycle, rep, FF/Uplift, trace carry |
| `js/ops.js` | Off-grid operations |
| `js/achievements.js` | 95 achievements, all checkers (live refresh on unlock) |
| `js/render.js` | All render functions, net market, character tab, net tab |
| `js/main.js` | Game loop, pressure decay, trace cap, COP repair |
| `js/mesh.js` | Mesh coordinates, distance, glitch effects |
| `js/netgen.js` | Net layout, company name gen, firmware tutorial |
| `js/world.js` | Home, net map, mesh traversal, uplift briefings, lore drops |
| `js/quests.js` | Quest chains, email delivery, autorun overrides, unique items |

---

## Difficulty Scaling (all from mesh distance)

| Dimension | Formula | Example |
|---|---|---|
| Grid size | `dist/4` → TIER_GRIDS | 4×4 at 0, 8×8 at 32, 15×15 at 56 |
| ICE STR | `base + dist/3 + glitch + static` | Gatekeeper: 2 → 13 at dist 32 |
| Contract rewards | `+4% per dist unit` | ×5 at dist 100 |
| Net market prices | `+8% per dist unit` | ×9 at dist 100 |
| Net market gear | `+1 tier per 8 dist` | |
| Blueprint drops | `dist ≥ 16, chance scales` | Archive nodes always trigger |
| Mythic deck crafting | `dist ≥ 32` | (was prestige-gated, now fixed) |
| COP self-repair | `dist ≥ 128` | Architect ICE zone |

---

## Character Stats (⬡ CHAR tab)

XP Pool accrues alongside level XP, never consumed by levelling.

| Stat | Effect | Applied In |
|---|---|---|
| Neural Buffer | +2 RAM / level | `ramMax()` |
| Reflex | −0.4 ticks/move / level | `moveTicks()` |
| Stealth | +2 pressure decay / level | decay + soothe |
| Integrity | +3 max INT / level | `maxInt()` |
| Trace Resist | −3% trace gain / level | all 4 trace sources |
| Intrusion | +1 all breaker STR / level | combat STR |

Cost: 0–19 = `baseCost × (1 + level × 0.5)`. Level 20+ = 4× per level. No cap.

Trace cap = 100 + `Trace Resist cap bonus`. Trace carry between runs = 30% on success / 70% on fail.

---

## Factions & Government

| Faction | Unlocks at | Specialty |
|---|---|---|
| Corp | dist 0 | Decoder/Decrypt/Armor programs |
| Criminal | dist 0 | Killer/Deceive/Ghost programs |
| Anarchist | dist 0 | Fracter/Zap/Overclock programs |
| Neutral | dist 0 | Balanced pool |
| **Government** | **dist 16** | Scan/Armor/Modify, high cred multiplier |
| AI | dist 64 | Adaptive ICE, exotic programs |

---

## Quests (◎ Email → Accept)

Three multi-step quest chains delivered via email. Each step overrides autorun behavior:

| Chain | Steps | Faction | Trigger | Reward |
|---|---|---|---|---|
| Ghost Signal | 6 | Neutral | On Uplift | 5000₵ + signal_fragment unique |
| Corporate Extraction | 5 | Corp | 3 nets cleared | 12000₵ + 300 corp rep |
| Anarchist Underground | 7 | Anarch | 8 nets cleared | 25000₵ + 800 anarch rep |

**Step types:** run_contracts · rep_faction · reach_coords · find_lore · find_item · clear_net

**Autorun overrides:** `blockFF` · `targetFaction` (prefers matching company nodes) · `targetDist` · `priorityNodeType`

`clear_net` steps never block FF. If current net is outside target dist range, autorun BFS navigates toward target dist midpoint before clearing.

---

## Unique Items

Rare artifacts from quest rewards. Persist permanently. Currently:

- **Signal Fragment** — +5% trace resist bonus, masks your signal. Acquired from Ghost Signal chain.

---

## Lore System (◈ LORE tab)

Populated by three sources:
- **Uplift briefings** — on every FF completion, distance-aware story + mechanic summary
- **Quest lore** — narrative drops on chain completion (Ghost Signal, Corp Extraction, Anarchist Underground)
- **Datastore fragments** — 10 unique pre-Blackout fragments, 15% drop chance per datastore visit

---

## Autorun

Toggle **AUTO** in topbar. Unlocked by Uplift. Persistent across sessions.

**Within a net (quest overrides applied first):**
1. Quest priority node type (VAULT/DATASTORE/TERMINAL)?
2. Quest target faction nodes?
3. FF accessible and not blocked?
4. 60% toward FF · 40% random

**On FF — Uplift BFS (quest overrides applied first):**
- `clear_net` step: BFS targets step's dist range midpoint
- Default: 60% deeper · 30% lateral · 10% toward origin
- 8-hop search, up to dist 256

---

## Achievements (95 total, 7 categories)

Weaver · Mesh · Run Feats · Milestones · Discoveries · Gear & Craft · Operations

Checkers fire on: run completion · contract success · combat events · node interactions · mesh travel · stat upgrades · ops completion

---

## Version History

### v0.6 *(current)*
**Critical gap fixes:**
- Prestige system fully removed — `maxInt()` no longer uses `S.prestige`
- Mythic deck crafting now gates on mesh dist ≥ 32 (not prestige)
- Blueprint drops now gate on mesh dist ≥ 16, chance scales with distance
- COP self-repair (Architect) now gates on dist ≥ 128
- Government faction now actually generated at dist 16+, AI at dist 64+
- Run summary enriched: `realMs`, `cred`, `contracts`, `copsSilenced`, `damageThisRun` all tracked
- Achievement checkers wired to actual tracked data (speed_demon, cop_whisperer, etc.)
- `_yellowAlertHit`/`_redAlertHit` tracked during runs (ghost_run, silent_exit achievements)
- Quest unique item rewards handled — Signal Fragment grants +5% trace resist
- Quest faction targeting applies in `autoPickNextNode` (prefers matching company nodes)
- `reach_coords` re-checks on net entry (not only on travel)
- `auto_travel` achievement counter added
- `deep_archive` achievement fires on blueprint drop in Archive nodes
- Datastore lore fragments (10 unique, 15% drop) → LORE tab, unlocks `lore_found`
- `charTraceCapBonus` wired into trace-out threshold (raises cap above 100)
- Trace carry between runs: 30% of trace on success, 70% on fail
- Unique item system with `UNIQUE_ITEMS` catalog and persistent `S.uniqueItems`

### v0.5.4
- Grid scales at dist/4; ICE STR from dist not level
- All 6 char stat bonuses verified and wired
- Contract rewards scale with distance; trace display rounded
- Crafting hides owned programs

### v0.5.3
- Uplift lore briefings (7 distance tiers)
- 95 achievements across 7 categories
- Achievements live-refresh on unlock

### v0.5.2
- NET tab, autorun loadout fix, net market, runSnapshot, grid title bar

### v0.5.1 / v0.5
- Autorun button, XP Pool display, run summary in net, auto-uplift
- Character stats, CHAR tab, Uplift/Mesh tab, FF gate, per-net rep

### v0.4.x
- 4-tier architecture, net map, firmware tutorial, net generation, suggested loadout

### v0.1–v0.3
- Core grid traversal, ICE combat, multi-file refactor, trap/attachment/rep/ops systems
