# MESH v0.5.4 — Idle Netrunner

> *"All the nets that ever were, are, or will be make up the Mesh"*

A browser-based idle game set in a future where a catastrophic Blackout in 2072 caused every AI to vanish simultaneously — leaving behind a vast, leaderless network called the Mesh. You play a Weaver: navigating corporate nets, breaking ICE, building rep with net-specific companies, and slowly uncovering what happened.

---

## Quickstart

Open `index.html` in any modern browser. No server required. Saves automatically to `localStorage` with 3 named slots + JSON export/import.

**Keyboard shortcuts:** `1` `2` `4` — speed · `Space`/`0` — pause · `Esc` — jack out

---

## Architecture

```
FIRMWARE  (deck ROM — tutorial)
  └── Complete 9 concept nodes → MESH ACCESS granted

REAL WORLD  (home base)
  ├── Email, Deck, Market (global/neutral), Craft (dist 4+), Ops
  └── ⬡ Jack In → MESH

MESH  (coordinate space — two 32-bit unsigned integers x:y)
  ├── Origin 0:0 · dist < 16: clean · dist 16–255: glitch · dist ≥ 256: AI
  ├── ⬡ MESH tab: unlocks after Uplift (FF in net 0:0)
  └── Navigate cardinal neighbors or revisit any prior net

NET  (16×16 node map, addressed 00–FF)
  ├── 3 companies per faction — these ARE the subfactions (rep per net)
  ├── Net market: faction-specific gear, price + stat scaled by mesh distance
  ├── Node 00 = entry · Node FF = uplift gate
  ├── Cardinal adjacency: complete a node to unlock N/S/E/W neighbors
  ├── ⬡ NET tab: always visible when in a net — independent map view
  └── Click node → contract preview + suggested loadout → ENTER NODE → run

NODE  (single contract run)
  ├── Grid: size scales at dist/4 (4×4 at dist 0 → 9×9 at dist 32 → 15×15 at dist 56)
  ├── ICE STR: base + dist/3 + glitch bonus (dist 16+) + static bonus (dist 64+)
  ├── Grid title: NET coords · NODE addr · cell [r,c]
  └── Complete FF → Uplift briefing → auto-travel (autorun)
```

---

## File Structure

| File | Contents |
|------|----------|
| `index.html` | HTML + all CSS |
| `js/data.js` | Constants, ICE, nodes, programs, manufacturers, rep tiers, character stats, net market, distance scaling |
| `js/state.js` | Game state, autorun, moveTicks (reflex), uplift BFS |
| `js/save.js` | Save/load/export/import, autosave, title screen |
| `js/deck.js` | Inventory, hardware, attachments, shop, crafting, blueprints, black market, XP |
| `js/combat.js` | ICE combat engine, per-ICE retaliation, achievement hooks, trace resist |
| `js/grid.js` | Node traversal, interactions, patrol/hunter AI, traps, datastore, trace resist |
| `js/contracts.js` | Contract gen, run lifecycle, rewards (distance-scaled), rep, FF/Uplift detection |
| `js/ops.js` | Off-grid operations |
| `js/achievements.js` | 95 achievements across 7 categories, all checkers, live refresh on unlock |
| `js/render.js` | All render functions, net market, character tab, net tab, suggested loadout |
| `js/main.js` | Game loop, pressure decay (stealth), trace accumulation, keyboard shortcuts |
| `js/mesh.js` | Mesh coordinate system, distance, glitch, net state |
| `js/netgen.js` | Net layout generation, company name generator, firmware tutorial |
| `js/world.js` | Home, firmware, jack-in, net map, mesh traversal, uplift lore briefings |

---

## Difficulty Scaling

All difficulty dimensions scale from **mesh distance**, not player level:

### Grid Size (`dist / 4`)
| Dist | Grid |
|---|---|
| 0–3 | 4×4 |
| 8–11 | 5×5 |
| 16–19 | 6×6 |
| 32–35 | 8×8 |
| 40–43 | 9×9 |
| 56+ | 12×13+ |
| Max | 15×15 |

### ICE STR (`base + dist/3 + glitch + static`)
| Dist | Gatekeeper (base 2) | Hunter (base 3) |
|---|---|---|
| 0 | 2 | 3 |
| 6 | 4 | 5 |
| 16 | 8 (+ glitch) | 9 |
| 32 | 13 | 14 |
| 64 | 23 (+ static) | 24 |

### Contract Rewards (`+4% per dist unit`)
### Net Market Prices (`+8% per dist unit`)
### Net Market Gear Stats (`+1 tier per 8 dist`)

---

## Character Stats (⬡ CHAR tab — leftmost)

XP Pool accrues alongside level XP, never consumed by levelling. Shown in topbar as **POOL**.

| Stat | Effect | Applied In |
|---|---|---|
| Neural Buffer | +2 RAM / level | `ramMax()` |
| Reflex | −0.4 ticks/move / level | `moveTicks()` |
| Stealth | +2 pressure decay / level | `alertDecayRate()` + soothe |
| Integrity | +3 max INT / level | `maxInt()` |
| Trace Resist | −3% trace gain / level | all 4 trace sources |
| Intrusion | +1 all breaker STR / level | combat STR |

Cost: levels 0–19 = `baseCost × (1 + level × 0.5)`. Level 20+ = 4× per level. No cap.

With ICE scaling aggressively from distance, character stats become increasingly necessary rather than dominating early content.

---

## Autorun

Toggle **AUTO** in topbar. Unlocked by Uplift. Persistent across sessions.

**Within a net:** Always takes FF → 60% toward FF → 40% random

**On FF — Uplift briefing then BFS travel:**
- 60% deeper · 30% lateral · 10% toward origin
- Searches up to 8 hops through cleared nets
- Cleared nets show map; uncleared nets auto-enter node 00

**Uplift briefings** appear on FF completion — distance-aware lore and mechanic explanations for each zone (Clean / Glitch / Deep Glitch / Static / Dark Mesh / AI Territory).

---

## Net Market

When jacked in, MARKET shows per-company storefronts. **3 programs + 2 attachments + 1 deck** per company, deterministic per vendor. Prices and gear quality scale with mesh distance.

---

## Companies & Rep

3 companies per faction per net, procedural names seeded by coordinates. Rep in `ns.rep[company.key]`. Parent faction aggregates at 30% globally.

**Tiers:** Unknown → Known (100) → Trusted (500) → Elite (1500) → Legend (4000)

---

## Achievements (95 total, 7 categories)

Weaver · Mesh · Run Feats · Milestones · Discoveries · Gear & Craft · Operations

Achievement list live-refreshes when a new one unlocks (no need to re-open the tab).

---

## ICE Types (14, by min mesh distance)
Gatekeeper/Barrier/Guardian/Hunter (0) → Probe (4) → Black ICE (8) → Tar Pit (12) → Tracer (16) → Kraken (32) → Mimic (48) → Leech (64) → Cascade (96) → Architect (128) → Omega (192)

---

## Version History

### v0.5.4 *(current)*
- Grid size scales at `dist/4` (was `dist/16`) — meaningful size increases from net 1
- ICE STR scales from mesh distance directly: `base + dist/3 + glitch bonus + static bonus`
- Character stats no longer dominate early — ICE keeps pace with stat investment
- All 6 character stat bonuses verified wired: Integrity, Reflex, Stealth, Trace Resist all fixed
- Trace Resist applied to all 4 trace sources (Barrier retaliation, Tracer, COP pings, passive)
- Stealth applied to natural GREEN pressure decay and soothe reduction
- Reflex applied to `moveTicks()` — reduces movement ticks per cell
- Contract rewards scale +4% per mesh distance unit
- Trace display rounded to 2 decimal places (e.g. 4.75% not 4.7499...)
- Crafting hides blueprints for programs already owned in inventory

### v0.5.3
- Uplift lore briefings: distance-aware story/mechanic explanations on FF completion
- 7 lore tiers: 0:0 first uplift → Clean → Glitch → Deep Glitch → Static → Dark Mesh → AI Territory
- Briefing replaces run summary on FF; CONTINUE dismisses and triggers autorun
- Achievements: 29 → 95 across 7 categories (added Gear & Craft, Operations)
- ICE-specific encounter discoveries, faction Legend achievements, mesh distance milestones
- Achievement list live-refreshes on unlock
- Removed duplicate `renderAchievements` from render.js

### v0.5.2
- NET tab: dedicated tab for net map during runs
- Autorun loadout: preserves auto-set contract instead of regenerating
- Auto-uplift BFS: 60/30/10 directional bias, 8-hop search
- Net market: faction-specific gear per company, distance scaling
- `runSnapshot` created in `enterNode` (topbar RAM correct during net runs)
- Grid title bar: NET coords · NODE addr · cell position

### v0.5.1
- Autorun button moved to visible topbar
- XP Pool: `S.xpPool` correctly displayed in CHAR tab
- Run summary re-enabled after net node runs
- Auto-uplift on FF completion

### v0.5
- Character stats system (6 stats, XP Pool, 4× cost past level 20)
- Uplift: FF in net 0:0 unlocks Mesh tab + autorun
- FF gate: must complete FF to leave any net
- Per-net company subfaction rep

### v0.4.x
- Full 4-tier architecture: Firmware → Real World → Mesh → Net → Node
- Net map, cardinal adjacency, node preview, suggested loadout
- Companies = subfactions, per-net rep, context nav
- Firmware tutorial, mesh coordinate system, net generation

### v0.1–v0.3
- Initial build: grid traversal, ICE combat, contracts
- Multi-file refactor, trap/attachment/rep systems, OPS tab, achievements
