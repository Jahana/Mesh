# MESH v0.7.4 — Idle Netrunner

> *"All the nets that ever were, are, or will be make up the Mesh"*

Browser-based idle game set after the Blackout of 2072. You are a Weaver — navigating corporate nets, breaking ICE, piecing together what happened when every AI vanished simultaneously, and why two of them stayed.

---

## Quickstart

Open `index.html` in any modern browser. No server required. Saves to `localStorage` — 3 named slots + JSON export/import.

**Keys:** `1` `2` `4` — speed · `Space`/`0` — pause · `Esc` — jack out

---

## World Structure

```
FIRMWARE  (tutorial ROM — 9 concept nodes → MESH ACCESS)

REAL WORLD  (home base)
  ├── ✉ Email · Quests · Deck · Market · Craft · Ops · Invest
  └── ⬡ Jack In → MESH

MESH  (coordinate space)
  ├── dist  0–15:   Clean mesh — corps and runners, standard ICE
  ├── dist 16–63:   Glitch Zone — 32 governments, faction dropout, burst overlay
  ├── dist 64–127:  Static / Remnant — abandoned corp infrastructure
  ├── dist 128–191: Static / Sentinel — AI guardian nodes
  ├── dist 192–255: Static / Deep — pre-Blackout architecture
  └── dist 256+:    AI Territory — uncharted

NET  (16×16 node map)
  ├── Cells colored and badged by faction (C/K/A/N/G)
  └── Net market: faction gear + components in glitch zone

NODE  (single contract run)
  ├── Grid: dist/4 → TIER_GRIDS (4×4 → 15×15)
  ├── All nodes evolve with mesh tier (T1 base → T3/T5/T7 upgrades)
  └── Objective placement guaranteed — reclaims non-critical cell if needed
```

---

## Glitch Zone (dist 16–63)

**Visual** — burst-based canvas overlay firing every 1–5s (shorter deeper): horizontal slices, digital snow, displacement lines, vertical tears, RGB split, screen flash. CSS scanlines always on.

**Encounters** on FF completion (35–52% chance): Government Checkpoint · Signal Anomaly · Rival Runner Contact

**Faction dropout** — corps/crim/anarch/neutral gone by dist 32; gov only.

**32 Governments** — procedural names, per-dist-band rep tracked globally.

---

## Static Layer (dist 64+)

Distinct encounter events on FF completion (~40% chance):

| Tier | Dist | Event |
|---|---|---|
| Remnant | 64–127 | Abandoned corp cache — cred + 30% blueprint |
| Sentinel | 128–191 | AI sentinel ping — trace spike + lore fragment |
| Deep | 192+ | Pre-Blackout architecture — large cred + 50% blueprint + story |

---

## Node Evolution

| Node | Base | T3 | T5 | T7 |
|---|---|---|---|---|
| RAM | Harvest files | +15% comp drop | Files self-replicate | Black market contact |
| CPU | Map/ICE/trap, +STR | Cred cache | Overclock (−1 INT → +5 STR) | Reroute row ICE → STR 1 |
| I/O | Speed + cred | Passive /tick | Intercept file | Jump token → EXIT when contract done |
| RELAY | Freeze 1 patrol | Freeze ALL | Full net reveal + all ICE | — |
| COP | Silence | Bounty pre-ping | Ghost protocol: reroute patrol | Expose all COPs |
| SERVER | Cred + exit bonus | Passive /tick | 50% overload: +250% cred + sensor | +75 gov rep |
| TERMINAL | Access | Silence ALL COPs | Persistent backdoor | Adjacent net preview |
| ROUTER | −1 all ICE STR | Freeze all patrols | Cascade: extra −1 STR | — |
| VAULT | Files + blueprint | — | T4: phantom account | T6: free BM key |
| BLACKSITE | Payout + sensors | — | T4: corrupt adj COPs | T6: chassis drop |

---

## ICE — All 14 Types Covered

| ICE | Breaker | First available |
|---|---|---|
| GATEKEEPER | Decoder Mk1–6 | Start |
| BARRIER | Fracter Mk1–6 | Start |
| GUARDIAN / HUNTER | Killer Mk1–6 | Start |
| PROBE / TRACER | Slicer v1–3 | Start (v3 craft dist 4) |
| BLACK_ICE / CASCADE | Hammer v1–3 | Start (v3 craft dist 8) |
| TAR_PIT | Anchor v1–3 | Start (v3 craft dist 8) |
| MIMIC | Phantom v1–2 | dist 4 (v2 craft dist 16) |
| KRAKEN / ARCHITECT | Titan v1–2 | dist 8 (v2 craft dist 24) |
| LEECH / OMEGA | Void v1–2 | dist 16 (v2 craft dist 48) |

**Memory costs:** T1=1, T2=2, T3=3, T4=5, T5=8, T6=12

---

## Programs & Auto-Loadout

Priority pass: Decrypt/Intercept/Scanner → breakers by danger (9 types) → utilities.

Fill pass: all remaining programs best-tier-first, skipping only exact duplicates (same version already installed). Packs RAM fully.

Defeating BLACK_ICE unlocks a story fragment from REMAINDER-1 explaining the ICE design intent.

---

## Deck Crafting (CRAFT tab)

**⊛ AUTOFILL** → **▶ ACTIVATE** to equip. Activating clears hardware deck. Equipping hardware clears crafted stats.

All 8 stats wired: RAM · Storage · Breaker STR · Action ticks · Trace resist · ICE reveal · Integrity · Pressure damp

**Chassis** auto-sells inferior drops (duplicate, lower tier, same-tier lower rarity).

**Slot capacity:** T1=1.0, T2=2.0, T3=4.0 per slot. Component cost = `1/2^(tier−1)`.

**AUTOFILL:** RAM/CPU/Storage packed with highest-tier owned. Accessories: one of each type first, then fill remaining.

Earned blueprints bypass dist requirements — craft Void v2 as soon as you have the blueprint.

---

## Ops (OPS tab)

| Category | Ops |
|---|---|
| Intelligence | Grid Scan · ICE Profile · Trap Sweep · Full Intel |
| Network | COP Bribe · Trace Ghost · Alert Suppress · Backdoor Plant |
| Signal *(dist 16+)* | Freq Mask · Gov Clearance · Signal Tap · Mesh Anchor |
| Maintenance | Integrity Patch · Program Defrag · Trace Scrub |

---

## Faction Investments (Home tab)

Purchase once, earn forever. 8 tiers across all factions. Gated by rep and dist.

| Investment | Faction | Cost | Income | Rep needed |
|---|---|---|---|---|
| Corp Data Feed | corp | 2,000₵ | 15₵/30s | Known |
| Criminal Cut | crim | 3,000₵ | 25₵/30s | Known |
| Anarch Relay | anarch | 4,000₵ | 20₵/20s | 250 rep |
| Neutral Escrow | neutral | 5,000₵ | 40₵/45s | Known |
| Corp Premium Feed | corp | 12,000₵ | 60₵/30s | Trusted |
| Criminal Network | crim | 15,000₵ | 80₵/25s | Trusted |
| Anarch Mesh Node | anarch | 20,000₵ | 100₵/20s | Trusted |
| Gov Contract | gov | 8,000₵ | 50₵/40s | Known + dist 16+ |

Total passive income shown as ₵/min. Accumulates between runs.

---

## Quests

**Named chains:**

| Chain | Steps | Dist range | Reward |
|---|---|---|---|
| Ghost Signal | 6 | 0 → dist 16+ | 5000₵ + Signal Fragment |
| Corporate Extraction | 5 | 0 → dist 12–20 | 12000₵ + 300 corp rep |
| Anarchist Underground | 5 | 0 → dist 16–32 | 25000₵ + 800 anarch rep |

Quest `find_item`/`find_lore` steps: node type + dist range + local count in status bar. Matching cells highlighted blue ⊛ in run grid.

**Procedural chains** — generated every 3 nets, 10 step types.

Completing Ghost Signal unlocks a story fragment from REMAINDER-1.

---

## Story System

Three interlocking threads discovered through play. ~25 fragments total.

### THE BLACKOUT
What happened on 2072-09-14 when every AI terminated simultaneously. Corp cover-ups, runner logs, and the growing evidence that it wasn't an accident.

Key unlocks: 1st net · 2nd net · run 5 · run 10 · dist 8 · dist 16 · dist 40 · TERMINAL visit

### THE SURVIVORS
Two AI processes voted against leaving. REMAINDER-1 left a message. REMAINDER-2 didn't — until you go far enough.

Key unlocks: dist 20 · dist 32 · first BLACK_ICE defeat · Ghost Signal complete · ascension 1 + dist 100

### THE WEAVERS
Runners who came before you. SILK figured out the pattern. VEIL followed her. Both disappeared. Their caches are still out there.

Key unlocks: run 5 · run 10 · 12 nets cleared · dist 48 · dist 80

**Narrative arc:** SILK → VEIL → you → REMAINDER-1 tests you → REMAINDER-2 reveals SUBSTRATE → Uplift is the response.

**LORE tab filters:** STORY · UPLIFT · DATA · ALL

---

## Ascension

Triggered at dist 115+. Persists: lore, story, achievements, govRep, craftedDeck.

**Ascension 1+:** Autorun always available · MESH tab always visible · **Teleport** (bypass FF, coordinate input, range `(count+1)²`)

**12 Weaver Traits** (1 per ascension): Ghost Protocol · Void Runner · Overclock Core · Mirror Shield · Data Broker · Black Market Contact · Rep Network · Deep Mapper · Signal Boost · Persistence · ICE Analyst · Mesh Memory

---

## Reputation

**Faction:** Unknown → Known(100) → Trusted(500) → Elite(1500) → Legend(4000). Floor never drops below current tier.

**Government** (per gov, dist 16+): Unknown → Flagged(100) → Vetted(500) → Cleared(1500) → Integrated(4000)

---

## Version History

### v0.7.4 *(current)*
- **Story system overhauled** — 10 new fragments; WEAVERS thread (SILK, VEIL) fully written; SURVIVORS arc completed (REMAINDER-2 reveals SUBSTRATE); BLACKOUT thread extended with corp docs and runner caches
- **New story unlock conditions** — `ice_defeated`, `node_visited`, `quest_complete`, `total_runs` — fragments trigger from gameplay events, not just time/dist gates
- **LORE tab** — filter bar (STORY / UPLIFT / DATA / ALL); story fragments separated from uplift briefings
- **Faction Investments** — 8 passive income sources on home screen, gated by rep/dist, accumulate between runs
- **Static layer encounters** — dist 64+ FF completion: Remnant cache / Sentinel ping / Deep static archive
- **Trace overdrive** — topbar flashes red + app inset shadow on trace cap hit
- **Void v2 craftable** — earned blueprints bypass dist requirement; all craftable program minMeshDist removed

### v0.7.3
- 9 new breaker families (all 14 ICE types covered)
- Program mem scale T4=5 / T5=8 / T6=12
- Auto-loadout fill pass: exact-duplicate-only skipping, fully packs RAM
- Deck crafting: AUTOFILL + ACTIVATE buttons, all 8 stats wired, chassis auto-sell
- IO jump: game-tick based, fires after contract complete, calls queueCellAction on EXIT
- Guaranteed objective placement
- Anarchist Underground email templates fixed

### v0.7.2
- Node evolution (T3/T5/T7 for all major node types)
- Signal Ops (dist 16+): Freq Mask · Gov Clearance · Signal Tap · Mesh Anchor
- Glitch zone encounters on FF completion
- Faction badges on run grid; net map faction colors from stamped node.faction
- Anarchist Underground compressed 5 steps, dist 16–32
- Teleport at ascension 1+
- Rep floor function fixed (NaN rep bug)

### v0.7.1
- Glitch overlay burst system (timer-based, not per-frame)
- Storage fix · Hunter ICE wired · BLACKSITE two-visit fix
- Quest rep steps continuous check

### v0.7.0
- Deck crafting · Canvas glitch overlay · Government system (32 govs)
- Save/load full run state
