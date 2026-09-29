# FibreSeeker 3 — Head & Fiber Usage Analysis of Reference G-code

**Date:** 2026-09-29
**Sources:** Rocket Slicer reference files (S-hook 20 m, Benchy fortified, Benchy reinforced level 5). The scripts in [`../analysis/`](../analysis/) reproduce every number.

## TL;DR

- **Yes, the g-code cuts the fiber.** Every fiber segment ends with `M2800` (servo cutter) → `M400` (sync) → `;CUT DISTANCE 54.8`.
- **The cut leaves a ≈54.8 mm tail** between the cutter blade and the nozzle. This is a hard mechanical constant: `;CUT DISTANCE` is `54.8` on **every single segment in every file** (395/395).
- **The tail is reused, not discarded.** The next segment's `G1 F1200 U55 ; Extrude restart` feeds exactly 55 mm to push the 54.8 mm tail through the path (≈0.2 mm overlap into the nozzle). No purge tower is used.
- **The fiber axis `U` is never retracted** — 0 negative-`U` moves across all files. Retraction is done on the matrix axis `V` only.
- **`M1001 L<n>` is a budget**: `L = floor(total U to be fed in the segment, including the 55 restart)`. Verified on all 395 segments: `L ≤ ΣU < L+1`, never off by more than 1.0 mm.
- **Per move, `V = U × P`** — the `P` word on fiber `G1` moves is the matrix-per-fiber ratio, not a positional parameter. Verified to within rounding on 28,000+ moves.

## 1. The fiber segment lifecycle (T0)

```gcode
T0 R ; switch extruder type to:FIBER      ← optional R = reverse/undo last feed
MOVE_TO_BRUSH_STATION / CLEAN_NOZZLE / MOVE_OUT_BRUSH_STATION
M1001 L80                                  ← open feed window, budget = 80 mm
G1 F1200 U55 ; Extrude restart             ← re-feed the 54.8 mm tail (in the air)
G0 X… Z0.200 F30000                         ← descend to layer height
G1 F600 V4 ; Extrude restart               ← prime matrix at start point
G1 X… V0.02520 U1.20000 P0.021 F300        ← deposit moves, V = U × P
…
; Start to cut
M2800                                      ← blade fires
M400                                       ← dwell until carriage stopped
;CUT DISTANCE 54.8                         ← tail length left in the path
G0 … F480                                  ← separation move
G1 X… V0.50400                             ← matrix-only wipe/drag (no U)
; Cutting completed.
G1 F600 V-1 ; Retract                      ← pull matrix 1 mm so tail doesn't drool
G0 X195.500 F600                           ← park
M1002                                      ← close feed window
```

Every fiber section (priming line and fiber infill alike) follows this exactly. `M2800` count == `M1001` count == `M1002` count in all files.

## 2. Tail mechanics

| Fact | Value | Evidence |
|---|---|---|
| Tail after cut | 54.8 mm | `;CUT DISTANCE 54.8` on 395/395 cuts (constant across files/profiles) |
| Restart feed | exactly `U55` | every segment in all files, no exceptions |
| Tail fate | pushed through and laid down as the leading fiber of the next segment | restart happens at Z1.2 before the deposit; first `V4` prime embeds the tip |
| Waste per segment | 55 mm fiber (restart) + the post-cut `V`-only wipe drag | 55/segment: 36% of fiber in Benchy level5 (small segments), 20% in fortified (long segments) |
| Fiber never retracts | `U` is feed-only | 0 negative-`U` moves in 3 files |
| End of print | last segment is cut like any other; the 54.8 mm tail stays loaded | final `M1002` → normal tool-change/end g-code |

## 3. Head (T0/T1) usage pattern

- `T0` = CFC fiber head; `T1` = 0.4 mm plastic head. Switches are symmetric (37/37, 136/136, 10/10).
- **Leaving T0** (per fiber→plastic change): `M400` → `M104 S250 T1` / `M104 S180 T0` (preheat plastic, cool fiber; the S-hook profile cools T0 to `S150` instead) → **`G1 F600 V-4 ; Retract`** (pull matrix 4 mm; the fiber tail itself stays put) → Z-lift `G0 Z… F600` → `T1` → brush-station wipe.
- **Entering T0**: `M400` → `M104 S270 T0` / `M104 S150 T1` → `M109 S270 T0` (wait for fiber head) → `T0 [R]` → brush station — all inside the `; Start change extruder` block, before the first `M1001`.
- Multiple fiber segments can occur per T0 visit (280 segments / 136 T1 switches in fortified) — the window is opened/closed per segment, not per tool visit.
- V-retract census matches exactly: `V-1` once per cut, `V-4` once per T0→T1 change. (level5: 105+37 = 142 retracts; S-hook: 10+10 = 20.)

## 4. Usage accounting

- Segment feed: `L = floor(U_restart + Σ U_deposit)` (S-hook seg2: L=235, ΣU=235.94; fortified seg 587.99 → L=587).
- `P` (matrix ratio) varies by feature: e.g. 0.048–0.07 (walls, level5), 0.03–0.041 (fortified), 0.015–0.021 (S-hook). `V/U − P` deviation ≤ 0.001 (rounding).
- `V`-only moves (no `U`) after the cut are the matrix wipe/drag and the `V4` prime — matrix can be deposited with no fiber, but fiber is never deposited without matrix.

## 5. Rules for generating our own g-code

1. **Bracket** every fiber section: `M1001 L<floor(55+planned)>` … `M1002`. Compute the budget from the move list before emitting the block (or emit `M1001` after planning, never mid-segment).
2. **Start** the segment with `G1 F1200 U55 ; Extrude restart` above the layer (Z≈1.2), then `G0 … Z<layer>`, then `G1 F600 V4 ; Extrude restart` at the deposit start point.
3. **Deposit moves**: `U = segment_length × fiber_per_mm × flow`, `V = U × P`, keep `P` on the move; feedrate slow (`F300`–`F1800`).
4. **Close** with the canonical cut sequence: `; Start to cut` / `M2800` / `M400` / `;CUT DISTANCE 54.8` / separation move / `V`-only wipe / `G1 V-1` retract / park / `M1002`. The `M400` immediately *after* `M2800` is mandatory: Klipper drains the move queue in order, so the blade fires only once all preceding motion has completed, and the sync keeps the cutter action from overlapping the separation move that follows.
5. **Never emit negative `U`.** Retraction on a fiber move is expressed on `V` only (`V-1` at segment end, `V-4` at tool change).
6. **Tool change away from T0**: `V-4` retract + Z lift **before** `T1`, brush station after.
7. One segment = one cut. Never end a fiber run without `M2800`, even the last segment of the print — the firmware leaves the 54.8 mm tail loaded and expects the next print's `U55` to consume it.

## Reproduction

```
py -3 analysis/analyze_fiber_usage.py <files...>   # counts, cut contexts
py -3 analysis/analyze_fiber_deep.py  <files...>   # per-segment L vs ΣU, restart, retracts
py -3 analysis/analyze_ratio.py       <files...>   # V = U × P verification
```
