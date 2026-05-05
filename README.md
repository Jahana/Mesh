# MESH v0.5 — Idle Netrunner

> *"All the nets that ever were, are, or will be make up the Mesh"*

A browser-based idle game set in a future where a catastrophic Blackout in 2072 caused every AI to vanish simultaneously — leaving behind a vast, leaderless network called the Mesh. You play a Weaver: navigating corporate nets, breaking ICE, building rep with net-specific companies, and slowly uncovering what happened.

---

## Quickstart

Open `index.html` in any modern browser. No server required. Progress saves automatically to `localStorage` with 3 named save slots, plus JSON export/import.

**Keyboard shortcuts:**

| Key | Action |
|-----|--------|
| `1` `2` `4` | Set game speed |
| `Space` / `0` | Pause / unpause |
| `D` | Deck tab |
| `M` | Market tab |
| `C` | Craft tab (unlocks at mesh dist 4) |
| `I` | Inventory tab |
| `O` | Ops tab |
| `P` | Progression tab |
| `A` | Achievements tab |
| `S` | Stats tab |
| `Esc` | Jack out |

---

## Architecture

```
FIRMWARE  (deck ROM — tutorial, not in mesh)
  └── Complete all 9 concept nodes → MESH ACCESS granted

REAL WORLD  (home base)
  ├── Email / Quest chains (stub — TBD)
  ├── Deck & Programs
  ├── Market / Craft (craft unlocks at mesh dist 4)
  ├── Operations
  └── ⬡ Jack In → MESH

MESH  (coordinate space — two 32-bit unsigned integers x:y)
  ├── Origin: 00000000:00000000
  ├── Distance < 16: clean space
  ├── Distance 16–255: glitch territory (pressure spikes, file corruption, flicker)
  ├── Distance ≥ 256: AI-controlled (future)
  ├── ⬡ MESH tab unlocks after completing node FF in net 0:0 (Uplift)
  └── Enter net address → NET

NET  (16×16 node map, addressed 00–FF)
  ├── Procedurally generated, cached per net coordinates
  ├── 3 companies per faction (Corp/Crim/Anarch/Neutral) — procedural names
  ├── Companies ARE the subfactions — rep tracked per company per net
  ├── Node 00: always accessible entry point
  ├── Traversal: complete a node to unlock its 4 cardinal neighbors (N/S/E/W)
  ├── Click node → contract preview + suggested loadout → ENTER NODE
  └── Glitch territory adds Government faction; AI territory replaces all factions

NODE  (single contract run)
  ├── Grid size scales with mesh distance tier
  ├── ICE types, node variety, and rewards scale with mesh distance
  ├── Complete → node glows in faction color, return to net map
  └── Run history and rep stored persistently per net
```

---

## File Structure

| File | Contents |
|------|----------|
| `index.html` | HTML structure + all CSS |
| `js/data.js` | Constants — ICE, nodes, programs, traps, blueprints, manufacturers, rep tiers |
| `js/state.js` | Game state (`mkState`), autorun, auto-loadout, tick functions |
| `js/save.js` | Save/load/export/import, autosave, title screen |
| `js/deck.js` | Inventory, hardware, attachments, shop, crafting, blueprints, black market |
| `js/combat.js` | Program helpers, ICE combat engine, per-ICE retaliation effects |
| `js/grid.js` | Node traversal, interactions, patrol/hunter AI, trap system, datastore scanning |
| `js/contracts.js` | Contract generation, run lifecycle, `finishRun`, rewards, rep |
| `js/ops.js` | Off-grid operations — intel, network, maintenance |
| `js/achievements.js` | 30 achievements across 3 categories |
| `js/render.js` | All render functions, UI utilities, context nav, suggested loadout |
| `js/main.js` | Game loop (`gameTick`), keyboard shortcuts, initialization |
| `js/mesh.js` | Mesh coordinate system, distance, glitch effects, net state persistence |
| `js/netgen.js` | Net layout generation (16×16), company name generator, firmware tutorial |
| `js/world.js` | Home screen, email, firmware, jack-in flow, net map, mesh traversal |

---

## Core Systems

### Firmware Tutorial
A 3×3 protected simulation in the deck's ROM. Nine concept nodes — one per core mechanic (Weaving, Files & Storage, Your Deck, Staying Dark, Cred & Rep, Breaking ICE, Factions, Craft & Upgrade, Completion). Must be completed before mesh access is granted. Can be re-run at any time.

### RAM vs Storage
**RAM** — holds running programs (MEM units). Shown in topbar. Managed in Deck tab before a run. Expanded with RAM Chip attachments.

**Storage** — holds downloaded files and contract items during a run. Separate pool shown in run panel. Expanded with Storage Chip attachments.

### ICE (14 types, unlocked by mesh distance)

| ICE | Min Dist | Effect |
|-----|---------|--------|
| Gatekeeper | 0 | Alert raise on retaliation |
| Barrier | 0 | +15% trace |
| Guardian | 0 | Disables a program |
| Hunter | 0 | Mobile — pursues player |
| Probe | 4 | Disables random program |
| Black ICE | 8 | Permanent INT loss |
| Tar Pit | 12 | Slows movement |
| Tracer | 16 | +10 pressure |
| Kraken | 32 | Row blocker, spawns hunters |
| Mimic | 48 | Disguised as another node |
| Leech | 64 | Drains breaker STR each combat |
| Cascade | 96 | Spawns Barrier on defeat |
| Architect | 128 | Auto-repairs silenced COPs |
| Omega | 192 | Combined pressure/trace/INT effects |

### Programs (all passive)

**Breakers:**
- Fracter Mk1–6 → Barrier ICE
- Decoder Mk1–6 → Gatekeeper / Code Gate
- Killer Mk1–6 → Guardian / Hunter / Sentry

Higher Mk tiers unlock by mesh distance: Mk3 at dist 4, Mk4 at dist 8, Mk5 at dist 16, Mk6 at dist 32.

**Utility:** Hide, Deceive, Scanner v1–3, Zap v1–3, Decrypt v1–2, Soothe v1–3, Intercept, Armor v1–2, Spoof, Overclock v1–2, Ghost, Polymorph v1–2, Switchblade, Cloak, Daemon

### Companies & Rep (per-net)
Each net procedurally generates **3 companies per faction** with deterministic names seeded by net coordinates. These companies ARE the subfactions — rep is tracked per company per net and persists across revisits.

Parent faction rep (`S.rep.corp` etc.) accumulates globally at 30% of company rep gained — this gates market access and faction perks.

**Rep tiers:** Unknown → Known (100) → Trusted (500) → Elite (1500) → Legend (4000)

**Legend perks:** Corp = 0 trace at run start · Crim = hunters 25% slower · Anarch = ICE −2 STR + trap immunity · Neutral = black market −20%

**Future:** Government rep persists across all nets it controls. Each AI is its own unique faction.

### Deck Manufacturers

| Manufacturer | Specialty |
|---|---|
| Hexfield | RAM |
| Ironwall | Integrity |
| Silk Corp | Speed |
| Vantage | Trace resistance |
| Novatek | Storage |

Rarities: Common → Uncommon → Rare → Legendary → Mythic (craft only). Signature perks at Rare+.

### Node Types by Mesh Distance

- **Dist 0:** Datastore, RAM, IO, Empty
- **Dist 1+:** CPU, COP
- **Dist 2+:** GPU, Relay
- **Dist 3+:** Firewall, Terminal
- **Dist 4+:** Vault, Proxy, Archive

### Net Map Navigation
- All nodes show as `⬡` colored by faction ownership
- Current position shown as `◈` in green with glow
- Completed nodes glow in their faction color with `✓`
- Inaccessible nodes (not adjacent to a completed node) shown at 25% opacity
- Click a node → contract preview + suggested loadout + Apply Loadout button appears in preview pane
- ← NET button returns to net map from node preview

### Mesh Traversal (Uplift)
Completing node `FF` in net `0:0` grants **Uplift** — the `⬡ MESH` tab unlocks. The Mesh tab shows:
- Current coordinates and distance from origin
- 4 cardinal neighbor nets (N/S/E/W) with ICE tier, reward tier, and distance info
- All previously visited nets with completion counts

Clicking a neighbor or visited net calls `travelToNet(x, y)` and enters the new net.

### Operations (OPS Tab)
11 operations across Intel / Network / Maintenance. Time scales with game speed. Defrag delays jack-in with a live countdown indicator in the topbar.

---

## Version History

### v0.5 *(current)*
- Per-net company rep fully working — `ns.rep[company.key]` stored and displayed
- Company names in run history (not raw keys)
- Suggested loadout panel on node click with 1-click Apply Loadout
- Apply Loadout button greys out when installed loadout matches proposal
- ← NET back button in node preview
- Player position `◈` shown on net map, centered in scroll view
- `genContract` accepts company object directly — correct verbs/names/rep multipliers per faction
- Old saves: companies without key field regenerate automatically on load
- Uplift: completing node FF in net 0:0 unlocks Mesh traversal and `⬡ MESH` tab
- Mesh tab: coordinate display, 4 cardinal neighbors, visited net list with fast-travel
- Subfaction display names in progression screen (per-net, grouped by net address)

### v0.4.5
- Companies = Subfactions: 3 per faction per net, procedurally generated
- Rep per-net: stored in `ns.rep`, not global `S.subrep`
- Global `S.subrep` removed entirely
- `genContract` updated to use per-net rep for difficulty gating
- Prestige fully removed from all UI (progression, save slots, stats bar)
- Context nav (⌂ HOME / ⬡ JACK IN / ⏏ JACK OUT) in visible topbar
- Node preview: contract, ICE/trap info, company name
- Net map: player node `◈` tracking, center-on-player scroll
- Flavored file names (`slush_fund.A3F`, `master_key.4E8`, etc.)

### v0.4.4
- Full 4-tier architecture: Firmware → Real World → Mesh → Net → Node
- Home screen with Email stub, Jack In, context nav
- Net map: 16×16 faction-colored nodes, cardinal-only adjacency gating
- Node entry launches run engine; completion returns to net map
- ICE unlocks by mesh distance (not prestige)
- Node types scale with mesh distance
- RAM vs Storage fully separated in all UI
- Crafting locked until mesh distance 4
- Company name generator: deterministic procedural names per net per faction
- Glitch effects at mesh distance 16+
- Layout versioning — net layouts regenerate when generation logic changes

### v0.4.3
- Firmware tutorial: 3×3 deck ROM, 9 concept nodes with full explanations
- Mesh coordinate system with distance/glitch thresholds
- Net generation: 16×16 procedural layout with seeded RNG and ICE strip validation

### v0.4 – v0.4.2
- Tick-based speed-aware contract timers
- 20 sub-factions (later replaced by per-net companies)
- All copyrighted names replaced (Hexfield, Ironwall, Silk Corp, Vantage)
- Speed preference persists across runs; black market rotation saved

### v0.3
- Title screen, progression screen, stats/achievements tabs
- Responsive layout, keyboard shortcuts
- Polymorph modal, Scanner v3, Vault re-check on visit

### v0.2
- Multi-file refactor (11 JS modules)
- Trap system, attachment system, rep system
- Auto-loadout, autorun (disabled until in-game unlock), run summary
- OPS tab, blueprint discovery, 5 Hunter varieties
- Alert pressure system, 3-slot save system

### v0.1
- Initial monolithic build — core grid traversal, ICE combat, basic contracts
