# G-code Inspector — test results

Produced by `Tools/gcode-inspector` (standalone HTML/JS/Node).
Generated: 2026-10-03T19:33:11Z

Engine settings: coverage raster cell **0.2 mm**, travel sampled at 0.25 mm, gap search radius 6 mm, unsupported-run floor 16 mm, seam-run floor 10 layers, sustained-flow window 1 s, coverage checks **ON**.

## Per-file summary

| File | Tool | L1 fibre | Fibre m (fed/dep) | Cuts | Flags | Layers | Moves | Travel | Unretr. | Void/Air | Unmit. | Zhop#29 | SeamRun | Gap mm | Flow mm3/s | MinLayer s | Unsup mm | M1001 | Findings |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Benchy_fortified-pla.gcode | FFF | no | 0.00 / 0.00 | 0 | 0/9 | 240 | 84,639 | 12,017 | 6,661 | 70/16 | 20 | 0 | 26 | 1.60 | 16.0 | 1.42 | 0 | 0 | 302 |
| Benchy_fortified.gcode | dual | yes (fortified) | 78.91 / 63.51 | 280 | 0/9 | 240 | 104,359 | 40,693 | 8,750 | 66/115 | 0 | 9,418 | 0 | 1.40 | 16.0 | 0.28 | 0 | 280 | 236 |
| Benchy_renforced_level1.gcode | dual | priming only | 6.73 / 4.69 | 37 | 0/9 | 399 | 177,080 | 27,816 | 15,021 | 792/357 | 17 | 0 | 91 | 1.60 | 19.2 | 1.57 | 3 | 37 | 218 |
| Benchy_renforced_level2.gcode | dual | priming only | 6.72 / 4.69 | 37 | 0/9 | 399 | 176,952 | 27,784 | 14,769 | 793/361 | 15 | 0 | 91 | 1.60 | 19.2 | 1.57 | 2 | 37 | 212 |
| Benchy_renforced_level3.gcode | dual | priming only | 7.17 / 4.86 | 42 | 0/9 | 399 | 178,267 | 28,441 | 15,538 | 774/347 | 17 | 0 | 91 | 1.60 | 19.2 | 1.58 | 2 | 42 | 223 |
| Benchy_renforced_level4.gcode | dual | priming only | 13.59 / 8.09 | 100 | 0/9 | 399 | 183,143 | 31,023 | 15,900 | 786/326 | 19 | 0 | 91 | 1.60 | 19.2 | 1.58 | 2 | 100 | 219 |
| Benchy_renforced_level5-pla.gcode | dual | priming only | 4.11 / 2.07 | 37 | 0/9 | 200 | 118,929 | 21,731 | 6,360 | 483/501 | 8 | 0 | 46 | 1.40 | 19.2 | 1.56 | 0 | 37 | 164 |
| Benchy_renforced_level5.gcode | dual | priming only | 15.94 / 10.16 | 105 | 0/9 | 399 | 185,469 | 31,897 | 16,085 | 793/265 | 20 | 0 | 91 | 1.60 | 19.2 | 1.58 | 3 | 105 | 227 |
| Benchy_speedy_default_settings-pla.gcode | FFF | no | 0.00 / 0.00 | 0 | 0/9 | 240 | 84,520 | 11,946 | 6,652 | 66/16 | 18 | 0 | 35 | 1.60 | 16.0 | 1.42 | 0 | 0 | 298 |
| Benchy_speedy_default_settings.gcode | FFF | no | 0.00 / 0.00 | 0 | 0/9 | 240 | 90,695 | 10,898 | 4,528 | 33/272 | 9 | 0 | 55 | 1.20 | 16.0 | 1.59 | 1 | 0 | 181 |
| Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode | FFF | no | 0.00 / 0.00 | 0 | 0/9 | 155 | 2,061,888 | 139,982 | 34,176 | 521/332 | 5 | 0 | 124 | 1.60 | 0.9 | 4.66 | 16 | 0 | 756 |

Column notes:

- **Tool** — observed deposition: `dual` = FFF + CFC fibre, `FFF` = single-tool plastic.
- **L1 fibre** — whether fibre was deposited in part geometry on layer 1.
  `yes (fortified)` is permitted, `YES (violation)` is a C12 finding, `priming only`
  means the only layer-1 fibre is the sacrificial priming/skirt pass.
- **Fibre m (fed/dep)** — total metres leaving the spool / metres landing in the part.
  The difference is the `U55` air-prime that pushes the post-cut tail through the head.
- **Cuts** — `M2800` blade fires, one per fibre segment.
- **Flags** — machine-assist commands present / total recognised (see C15).
- **Unretr.** — plastic (`E`) travels with no retraction issued before the move.
- **Void/Air** — of *all* travels, how many crossed a void / flew over open air.
- **Unmit.** — void-or-air travels with neither retraction nor Z-hop: the issue #1 defect set.
- **Zhop#29** — plastic travel Z-hops emitted while the exported `Profile.DoZHop` was `false`.
- **SeamRun** — longest run of consecutive layers whose seam marker sits at the same XY.
- **Gap mm** — widest void measured between a deposition start point and the nearest deposited material.
- **Flow mm3/s** — worst sustained volumetric demand (or the header-derived wall demand).
- **Unsup mm** — unsupported printed length laid down with the part fan off.

## Aggregate by check

| Check | Issue | Description | Findings | Critical | Worst |
|---|---|---|---:|---:|---|
| C01 | [#1](https://github.com/3ricj/FibreSeeker3/issues/1) | Un-retracted plastic travel across voids / open air (stringing) | 119 | 5 | 52.40 |
| C02 | [#2](https://github.com/3ricj/FibreSeeker3/issues/2) | Aligned seams — perimeter start points stacked in Z | 10 | 8 | 124.00 |
| C03 | [#3](https://github.com/3ricj/FibreSeeker3/issues/3) | Enclosed gaps wider than the deposited bead | 1,153 | 451 | 1.60 |
| C04 | [#4](https://github.com/3ricj/FibreSeeker3/issues/4) | Volumetric flow demand above the material ceiling | 10 | 0 | 19.20 |
| C05 | [#5](https://github.com/3ricj/FibreSeeker3/issues/5) | Layer time below the slicer’s own minimum | 938 | 169 | 8.58 |
| C06 | [#6](https://github.com/3ricj/FibreSeeker3/issues/6) | Long unsupported (bridging) printed runs | 711 | 205 | 1,324.49 |
| C07 | [#8](https://github.com/3ricj/FibreSeeker3/issues/8) | Implicit motion contract — accel/jerk/max-feedrate not declared | 32 | 0 | — |
| C08 | [#9](https://github.com/3ricj/FibreSeeker3/issues/9) | Fiber-feed window commands M1001/M1002 unimplemented in firmware | 7 | 7 | — |
| C09 | [#11](https://github.com/3ricj/FibreSeeker3/issues/11) | Slicer/firmware command contract — undefined verbs | 2 | 0 | — |
| C10 | [#29](https://github.com/3ricj/FibreSeeker3/issues/29) | Plastic travel Z-hop emitted against the exported DoZHop setting | 1 | 1 | 9,418.00 |
| C11 | — | Geometry / parse sanity | 1 | 0 | — |
| C12 | — | Carbon fibre deposited on the first layer of a non-fortified print | 11 | 0 | — |
| C13 | — | Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF | 12 | 0 | — |
| C14 | — | Fibre consumption and cut count | 18 | 0 | 78.91 |
| C15 | — | Machine-assist flags (AI detection, bed mesh, runout) present or absent | 11 | 0 | — |

---

## Benchy_fortified-pla.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:51 AM` · processor SK3 · mode Plastic Only · 88,953 lines
- Layers 240 (header `LAYER_COUNT` 240) · moves 84,639 (69,848 extruding, 12,017 travel) · tool changes 1
- Estimated print time 35.3 min · plastic 5.01 m · fiber 0.00 m · bbox 122.2–182.3 × 137.2–167.8 mm
- Material PLA · `DoZHop`=true `ZhopP`=0 · `MinLayerTimeForSlowing`=10 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.2 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 237 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 0/0 · fan commands 9 · seam markers 748 (71 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** no fibre on layer 1. Fortified = `CurrentSliceType=0`, `MustGenerateFiberPerimeters=false`.

**2. Tool configuration.** **Single-tool FFF** (no fibre deposited) — `T0`×0 / `T1`×1, plastic 5.01 m, fibre 0.00 m fed. Header `PRINTING_MODE: Plastic Only` declares plastic-only.

**3. Fibre used / cuts.** 0.00 m fed · 0.00 m deposited in the part · 0.00 m (0 %) air-primed through the head. **0 cuts** (`M2800`). Slicer `MATERIAL_PRINT_DATA` declares 0.00 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 21 | 0 | 3.33 |
| C02 | #2 | 1 | 0 | 26.00 |
| C03 | #3 | 146 | 64 | 1.60 |
| C04 | #4 | 1 | 0 | 16.00 |
| C05 | #5 | 125 | 39 | 8.58 |
| C06 | #6 | 0 | 0 | — |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 0 | 0 | — |
| C09 | #11 | 1 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 1 | 0 | — |
| C15 | — | 1 | 0 | — |

### C01 — Un-retracted plastic travel across voids / open air (stringing) (issue #1)

- `Benchy_fortified-pla.gcode:715` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 715 (1.9 mm, void) is followed by a retraction within 3 lines
- `Benchy_fortified-pla.gcode:772` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 772 (2.8 mm, void) is followed by a retraction within 3 lines
- `Benchy_fortified-pla.gcode:879` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 879 (2.7 mm, void) is followed by a retraction within 3 lines
- `Benchy_fortified-pla.gcode:941` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 941 (3.3 mm, void) is followed by a retraction within 3 lines
- `Benchy_fortified-pla.gcode:982` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 982 (2.3 mm, void) is followed by a retraction within 3 lines
- `Benchy_fortified-pla.gcode:1043` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 1043 (2.3 mm, void) is followed by a retraction within 3 lines
- _… 15 more_

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_fortified-pla.gcode:75303` layer 191 [warning] Seam repeated at the same XY for 26 consecutive layers at X149.332 Y152.817 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_fortified-pla.gcode:2439` layer 3 [critical] Layer 3 encloses 8 perimeter-bounded gap(s); widest ≈ 1.00 mm across (12.1 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified-pla.gcode:3181` layer 4 [critical] Layer 4 encloses 3 perimeter-bounded gap(s); widest ≈ 1.00 mm across (4.2 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified-pla.gcode:3714` layer 5 [critical] Layer 5 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.6 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified-pla.gcode:3941` layer 6 [critical] Layer 6 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.3 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified-pla.gcode:4675` layer 9 [critical] Layer 9 encloses 4 perimeter-bounded gap(s); widest ≈ 1.00 mm across (3.2 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified-pla.gcode:4918` layer 10 [critical] Layer 10 encloses 3 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 140 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_fortified-pla.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.2 mm bead = 16.0 mm³/s constant wall demand vs a 15 mm³/s PLA ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_fortified-pla.gcode:80881` layer 201 [critical] Layer 201 time 2.47s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=2.47s
- `Benchy_fortified-pla.gcode:81121` layer 202 [critical] Layer 202 time 1.45s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.45s
- `Benchy_fortified-pla.gcode:81323` layer 203 [critical] Layer 203 time 1.42s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.42s
- `Benchy_fortified-pla.gcode:81509` layer 204 [critical] Layer 204 time 1.42s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.42s
- `Benchy_fortified-pla.gcode:81696` layer 205 [critical] Layer 205 time 1.43s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.43s
- `Benchy_fortified-pla.gcode:81880` layer 206 [critical] Layer 206 time 1.43s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.43s
- _… 119 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_fortified-pla.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_fortified-pla.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_fortified-pla.gcode:237` [warning] First M204 (acceleration regime) appears at line 237 — past the header/preamble, so generic tools parse default values — M204 S5000

### C09 — Slicer/firmware command contract — undefined verbs (issue #11)

- `Benchy_fortified-pla.gcode:0` [warning] Undefined command SET_FAN_AT_LAYER used 1 time(s) — not part of the documented dialect

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_fortified-pla.gcode:0` layer 1 [info] No fibre on layer 1 — first layer is plastic-only — first fibre layer none

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_fortified-pla.gcode:0` [info] Tool configuration: single-tool FFF (no fibre deposited) — T0×0 / T1×1, plastic 5.01 m, fibre 0.00 m fed — ; PRINTING_MODE: Plastic Only (declares plastic-only)

### C14 — Fibre consumption and cut count

- `Benchy_fortified-pla.gcode:0` [info] No fibre consumed — 0 mm fed, 0 cuts (slicer declares 0.00 m tow) — single-tool FFF print; the CFC tool never fed

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_fortified-pla.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_fortified.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:50 AM` · processor SK3 · mode Composite Only · 114,926 lines
- Layers 240 (header `LAYER_COUNT` 240) · moves 104,359 (42,438 extruding, 40,693 travel) · tool changes 272
- Estimated print time 272.1 min · plastic 2.87 m · fiber 78.91 m · bbox 121.8–182.5 × 136.0–169.2 mm
- Material PETG · `DoZHop`=false `ZhopP`=0.4 · `MinLayerTimeForSlowing`=0 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.2 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 54 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 280/280 · fan commands 922 · seam markers 264 (0 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** fibre on layer 1 — PERMITTED (fortified print) (317.9 mm deposited; features: Inset XF, Fiber infill). Fortified = `CurrentSliceType=2`, `MustGenerateFiberPerimeters=true`. First fibre layer: 1.

**2. Tool configuration.** **Dual-tool** (FFF + CFC fibre) — `T0`×136 / `T1`×136, plastic 2.87 m, fibre 78.91 m fed. Header `PRINTING_MODE: Composite Only` declares fiber-only — **contradicted by observed deposition**.

**3. Fibre used / cuts.** 78.91 m fed · 63.51 m deposited in the part · 15.40 m (20 %) air-primed through the head. **280 cuts** (`M2800`), constant 54.8 mm tail = 15.34 m trimmed. Slicer `MATERIAL_PRINT_DATA` declares 63.51 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 0 | 0 | — |
| C02 | #2 | 0 | 0 | — |
| C03 | #3 | 122 | 63 | 1.40 |
| C04 | #4 | 1 | 0 | 16.00 |
| C05 | #5 | 103 | 64 | 4.72 |
| C06 | #6 | 0 | 0 | — |
| C07 | #8 | 2 | 0 | — |
| C08 | #9 | 1 | 1 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 1 | 1 | 9,418.00 |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 2 | 0 | — |
| C14 | — | 2 | 0 | 78.91 |
| C15 | — | 1 | 0 | — |

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_fortified.gcode:32` layer 1 [critical] Layer 1 encloses 15 perimeter-bounded gap(s); widest ≈ 1.20 mm across (9.5 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified.gcode:2177` layer 2 [critical] Layer 2 encloses 13 perimeter-bounded gap(s); widest ≈ 1.00 mm across (23.7 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified.gcode:5749` layer 8 [critical] Layer 8 encloses 19 perimeter-bounded gap(s); widest ≈ 1.20 mm across (23.6 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified.gcode:7127` layer 10 [critical] Layer 10 encloses 11 perimeter-bounded gap(s); widest ≈ 1.00 mm across (9.2 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified.gcode:7768` layer 11 [critical] Layer 11 encloses 9 perimeter-bounded gap(s); widest ≈ 1.00 mm across (20.3 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_fortified.gcode:9207` layer 13 [critical] Layer 13 encloses 8 perimeter-bounded gap(s); widest ≈ 1.00 mm across (7.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 116 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_fortified.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.2 mm bead = 16.0 mm³/s constant wall demand vs a 12 mm³/s PETG ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_fortified.gcode:94207` layer 136 [critical] Layer 136 time 1.03s is below the 5s floor (profile declares no minimum) — tool floor (profile declares no minimum)=5 measured=1.03s
- `Benchy_fortified.gcode:94317` layer 137 [critical] Layer 137 time 1.03s is below the 5s floor (profile declares no minimum) — tool floor (profile declares no minimum)=5 measured=1.03s
- `Benchy_fortified.gcode:94465` layer 138 [critical] Layer 138 time 1.03s is below the 5s floor (profile declares no minimum) — tool floor (profile declares no minimum)=5 measured=1.03s
- `Benchy_fortified.gcode:94575` layer 139 [critical] Layer 139 time 1.03s is below the 5s floor (profile declares no minimum) — tool floor (profile declares no minimum)=5 measured=1.03s
- `Benchy_fortified.gcode:94685` layer 140 [critical] Layer 140 time 1.24s is below the 5s floor (profile declares no minimum) — tool floor (profile declares no minimum)=5 measured=1.24s
- `Benchy_fortified.gcode:94850` layer 141 [critical] Layer 141 time 1.03s is below the 5s floor (profile declares no minimum) — tool floor (profile declares no minimum)=5 measured=1.03s
- _… 97 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_fortified.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_fortified.gcode:0` [warning] No M203 (max feedrate) command in the file

### C08 — Fiber-feed window commands M1001/M1002 unimplemented in firmware (issue #9)

- `Benchy_fortified.gcode:0` [critical] 280 × M1001 / 280 × M1002 emitted — no firmware handler exists (issue #9) — fiber-feed windows bracketed by unimplemented commands

### C10 — Plastic travel Z-hop emitted against the exported DoZHop setting (issue #29)

- `Benchy_fortified.gcode:61` layer 1 [critical] 9418 plastic travel Z-hops of 0.40 mm emitted while Profile.DoZHop=false — first at line 61: Z0.200 → Z0.600 → Z0.200 (ZhopP=0.4, no preceding retraction)

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_fortified.gcode:497` layer 1 [info] Fibre on layer 1 (317.9 mm deposited) — permitted: this is a fortified print — CurrentSliceType=2 MustGenerateFiberPerimeters=true; Inset XF 266.4, Fiber infill 51.5

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_fortified.gcode:0` [info] Tool configuration: dual-tool (FFF + CFC fibre) — T0×136 / T1×136, plastic 2.87 m, fibre 78.91 m fed — ; PRINTING_MODE: Composite Only (declares fiber-only)
- `Benchy_fortified.gcode:0` [info] Header says "Composite Only" but the plastic tool is used — the fibre wet-out matrix and tool-change dance still drive T1 — plastic 2.87 m deposited across 136 T1 changes

### C14 — Fibre consumption and cut count

- `Benchy_fortified.gcode:0` [info] Fibre: 78.91 m fed — 63.51 m deposited in the part, 15.40 m (20 %) air-primed through the head; slicer declares 63.51 m — fed=ΣU, deposited=ΣU on moves with XY motion, restart=ΣU with no XY motion; MATERIAL_PRINT_DATA tow Length=63.510474 m
- `Benchy_fortified.gcode:0` [info] 280 fibre cut(s) (M2800), tail constant 54.8 mm — 15.34 m of trimmed tail — M2800 count; ;CUT DISTANCE sum 15344 mm

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_fortified.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_renforced_level1.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:46 AM` · processor SK3 · mode Plastic and Composite · 184,893 lines
- Layers 399 (header `LAYER_COUNT` 399) · moves 177,080 (144,812 extruding, 27,816 travel) · tool changes 74
- Estimated print time 67.1 min · plastic 6.69 m · fiber 6.73 m · bbox 106.5–188.7 × 130.9–172.1 mm
- Material PETG · `DoZHop`=true `ZhopP`=0.4 · `MinLayerTimeForSlowing`=5 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.24 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 1279 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 37/37 · fan commands 422 · seam markers 1310 (93 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** layer-1 fibre is sacrificial priming/skirt only — part first layer is plastic (25.0 mm deposited; features: Priming line). Fortified = `CurrentSliceType=1`, `MustGenerateFiberPerimeters=false`. First fibre layer: 1.

**2. Tool configuration.** **Dual-tool** (FFF + CFC fibre) — `T0`×37 / `T1`×37, plastic 6.69 m, fibre 6.73 m fed. Header `PRINTING_MODE: Plastic and Composite` declares dual.

**3. Fibre used / cuts.** 6.73 m fed · 4.69 m deposited in the part · 2.04 m (30 %) air-primed through the head. **37 cuts** (`M2800`), constant 54.8 mm tail = 2.03 m trimmed. Slicer `MATERIAL_PRINT_DATA` declares 4.69 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 12 | 1 | 51.68 |
| C02 | #2 | 1 | 1 | 91.00 |
| C03 | #3 | 80 | 26 | 1.60 |
| C04 | #4 | 1 | 0 | 19.20 |
| C05 | #5 | 94 | 0 | 3.43 |
| C06 | #6 | 21 | 2 | 41.55 |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 1 | 1 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 2 | 0 | 6.73 |
| C15 | — | 1 | 0 | — |

### C01 — Un-retracted plastic travel across voids / open air (stringing) (issue #1)

- `Benchy_renforced_level1.gcode:589` layer 1 [critical] Un-retracted plastic travel across void of 51.7 mm (stringing risk) — G0 X172.284 Y144.906 F30000 at line 589 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level1.gcode:701` layer 1 [warning] Un-retracted plastic travel across void of 9.4 mm (stringing risk) — G0 X176.311 Y153.727 F30000 at line 701 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level1.gcode:3601` layer 3 [warning] Un-retracted plastic travel across void of 15.2 mm (stringing risk) — G0 X137.443 Y154.979 F30000 at line 3601 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level1.gcode:3636` layer 3 [warning] Un-retracted plastic travel across void of 9.5 mm (stringing risk) — G0 X127.787 Y148.152 F30000 at line 3636 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level1.gcode:1299` layer 1 [info] Un-retracted plastic travel across void of 3.1 mm (stringing risk) — G0 X162.933 Y149.938 F30000 at line 1299 — no retraction, no Z-hop, Inset XP
- `Benchy_renforced_level1.gcode:1567` layer 1 [info] Un-retracted plastic travel across void of 4.0 mm (stringing risk) — G0 X154.495 Y155.219 F30000 at line 1567 — no retraction, no Z-hop, Inset 0
- _… 6 more_

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_renforced_level1.gcode:160022` layer 309 [critical] Seam repeated at the same XY for 91 consecutive layers at X149.476 Y152.495 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_renforced_level1.gcode:4291` layer 5 [critical] Layer 5 encloses 8 perimeter-bounded gap(s); widest ≈ 1.00 mm across (10.1 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level1.gcode:5391` layer 7 [critical] Layer 7 encloses 10 perimeter-bounded gap(s); widest ≈ 1.00 mm across (7.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level1.gcode:12210` layer 23 [critical] Layer 23 encloses 4 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level1.gcode:14575` layer 29 [critical] Layer 29 encloses 3 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.0 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level1.gcode:16223` layer 33 [critical] Layer 33 encloses 3 perimeter-bounded gap(s); widest ≈ 1.20 mm across (1.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level1.gcode:17885` layer 37 [critical] Layer 37 encloses 4 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.0 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 74 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_renforced_level1.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.24 mm bead = 19.2 mm³/s constant wall demand vs a 12 mm³/s PETG ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_renforced_level1.gcode:3157` layer 2 [warning] Layer 2 time 4.95s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.95s
- `Benchy_renforced_level1.gcode:138058` layer 222 [warning] Layer 222 time 4.75s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.75s
- `Benchy_renforced_level1.gcode:138600` layer 224 [warning] Layer 224 time 4.41s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.41s
- `Benchy_renforced_level1.gcode:139102` layer 226 [warning] Layer 226 time 4.15s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.15s
- `Benchy_renforced_level1.gcode:139557` layer 228 [warning] Layer 228 time 3.81s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.81s
- `Benchy_renforced_level1.gcode:139998` layer 230 [warning] Layer 230 time 3.82s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.82s
- _… 88 more_

### C06 — Long unsupported (bridging) printed runs (issue #6)

- `Benchy_renforced_level1.gcode:159433` layer 307 [critical] Unsupported printed run of 40.8 mm — TOP section at F30000, fan on
- `Benchy_renforced_level1.gcode:159556` layer 307 [critical] Unsupported printed run of 41.5 mm — BRIDGE section at F3000, fan on
- `Benchy_renforced_level1.gcode:42720` layer 76 [warning] Unsupported printed run of 22.0 mm — WALL section at F8940, fan on
- `Benchy_renforced_level1.gcode:72975` layer 115 [warning] Unsupported printed run of 25.3 mm — OVERHANG section at F30000, fan on
- `Benchy_renforced_level1.gcode:155695` layer 293 [warning] Unsupported printed run of 16.2 mm — WALL section at F8700, fan on
- `Benchy_renforced_level1.gcode:159477` layer 307 [warning] Unsupported printed run of 16.1 mm — BRIDGE section at F3000, fan on
- _… 15 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_renforced_level1.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_renforced_level1.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_renforced_level1.gcode:1279` [warning] First M204 (acceleration regime) appears at line 1279 — past the header/preamble, so generic tools parse default values — M204 S5000

### C08 — Fiber-feed window commands M1001/M1002 unimplemented in firmware (issue #9)

- `Benchy_renforced_level1.gcode:0` [critical] 37 × M1001 / 37 × M1002 emitted — no firmware handler exists (issue #9) — fiber-feed windows bracketed by unimplemented commands

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_renforced_level1.gcode:50` layer 1 [info] Fibre on layer 1 is confined to the sacrificial priming/skirt pass (25.0 mm) — the part’s first layer is plastic — Priming line 25.0; first fibre move at line 50

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_renforced_level1.gcode:0` [info] Tool configuration: dual-tool (FFF + CFC fibre) — T0×37 / T1×37, plastic 6.69 m, fibre 6.73 m fed — ; PRINTING_MODE: Plastic and Composite (declares dual)

### C14 — Fibre consumption and cut count

- `Benchy_renforced_level1.gcode:0` [info] Fibre: 6.73 m fed — 4.69 m deposited in the part, 2.04 m (30 %) air-primed through the head; slicer declares 4.69 m — fed=ΣU, deposited=ΣU on moves with XY motion, restart=ΣU with no XY motion; MATERIAL_PRINT_DATA tow Length=4.692162 m
- `Benchy_renforced_level1.gcode:0` [info] 37 fibre cut(s) (M2800), tail constant 54.8 mm — 2.03 m of trimmed tail — M2800 count; ;CUT DISTANCE sum 2028 mm

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_renforced_level1.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_renforced_level2.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:47 AM` · processor SK3 · mode Plastic and Composite · 184,766 lines
- Layers 399 (header `LAYER_COUNT` 399) · moves 176,952 (144,676 extruding, 27,784 travel) · tool changes 74
- Estimated print time 67.2 min · plastic 6.54 m · fiber 6.72 m · bbox 106.5–188.7 × 130.9–172.0 mm
- Material PETG · `DoZHop`=true `ZhopP`=0.4 · `MinLayerTimeForSlowing`=5 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.24 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 1277 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 37/37 · fan commands 422 · seam markers 1310 (86 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** layer-1 fibre is sacrificial priming/skirt only — part first layer is plastic (25.0 mm deposited; features: Priming line). Fortified = `CurrentSliceType=1`, `MustGenerateFiberPerimeters=false`. First fibre layer: 1.

**2. Tool configuration.** **Dual-tool** (FFF + CFC fibre) — `T0`×37 / `T1`×37, plastic 6.54 m, fibre 6.72 m fed. Header `PRINTING_MODE: Plastic and Composite` declares dual.

**3. Fibre used / cuts.** 6.72 m fed · 4.69 m deposited in the part · 2.04 m (30 %) air-primed through the head. **37 cuts** (`M2800`), constant 54.8 mm tail = 2.03 m trimmed. Slicer `MATERIAL_PRINT_DATA` declares 4.69 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 13 | 1 | 52.40 |
| C02 | #2 | 1 | 1 | 91.00 |
| C03 | #3 | 77 | 24 | 1.60 |
| C04 | #4 | 1 | 0 | 19.20 |
| C05 | #5 | 92 | 0 | 3.43 |
| C06 | #6 | 19 | 3 | 41.55 |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 1 | 1 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 2 | 0 | 6.72 |
| C15 | — | 1 | 0 | — |

### C01 — Un-retracted plastic travel across voids / open air (stringing) (issue #1)

- `Benchy_renforced_level2.gcode:635` layer 1 [critical] Un-retracted plastic travel across void of 52.4 mm (stringing risk) — G0 X172.821 Y145.057 F30000 at line 635 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level2.gcode:691` layer 1 [warning] Un-retracted plastic travel across void of 9.3 mm (stringing risk) — G0 X176.654 Y153.580 F30000 at line 691 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level2.gcode:3723` layer 3 [warning] Un-retracted plastic travel across void of 15.2 mm (stringing risk) — G0 X137.444 Y154.980 F30000 at line 3723 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level2.gcode:3759` layer 3 [warning] Un-retracted plastic travel across void of 9.5 mm (stringing risk) — G0 X127.773 Y148.138 F30000 at line 3759 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level2.gcode:4221` layer 3 [warning] Un-retracted plastic travel across void of 11.1 mm (stringing risk) — G0 X147.346 Y149.043 F30000 at line 4221 — no retraction, no Z-hop, Bridge solid infill
- `Benchy_renforced_level2.gcode:1299` layer 1 [info] Un-retracted plastic travel across void of 3.1 mm (stringing risk) — G0 X162.945 Y149.953 F30000 at line 1299 — no retraction, no Z-hop, Inset XP
- _… 7 more_

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_renforced_level2.gcode:160002` layer 309 [critical] Seam repeated at the same XY for 91 consecutive layers at X149.477 Y152.500 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_renforced_level2.gcode:4407` layer 5 [critical] Layer 5 encloses 8 perimeter-bounded gap(s); widest ≈ 1.00 mm across (10.4 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level2.gcode:5508` layer 7 [critical] Layer 7 encloses 7 perimeter-bounded gap(s); widest ≈ 1.00 mm across (6.0 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level2.gcode:18699` layer 39 [critical] Layer 39 encloses 1 perimeter-bounded gap(s); widest ≈ 1.00 mm across (0.7 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level2.gcode:19692` layer 41 [critical] Layer 41 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.0 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level2.gcode:21775` layer 45 [critical] Layer 45 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.3 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level2.gcode:24076` layer 49 [critical] Layer 49 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.1 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 71 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_renforced_level2.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.24 mm bead = 19.2 mm³/s constant wall demand vs a 12 mm³/s PETG ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_renforced_level2.gcode:3280` layer 2 [warning] Layer 2 time 4.95s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.95s
- `Benchy_renforced_level2.gcode:138014` layer 222 [warning] Layer 222 time 4.81s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.81s
- `Benchy_renforced_level2.gcode:138561` layer 224 [warning] Layer 224 time 4.42s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.42s
- `Benchy_renforced_level2.gcode:139061` layer 226 [warning] Layer 226 time 4.15s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.15s
- `Benchy_renforced_level2.gcode:139522` layer 228 [warning] Layer 228 time 3.81s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.81s
- `Benchy_renforced_level2.gcode:139966` layer 230 [warning] Layer 230 time 3.82s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.82s
- _… 86 more_

### C06 — Long unsupported (bridging) printed runs (issue #6)

- `Benchy_renforced_level2.gcode:159415` layer 307 [critical] Unsupported printed run of 40.8 mm — TOP section at F30000, fan on
- `Benchy_renforced_level2.gcode:159539` layer 307 [critical] Unsupported printed run of 41.5 mm — BRIDGE section at F3000, fan on
- `Benchy_renforced_level2.gcode:159543` layer 307 [critical] Unsupported printed run of 40.8 mm — BRIDGE section at F3000, fan on
- `Benchy_renforced_level2.gcode:42280` layer 76 [warning] Unsupported printed run of 22.1 mm — WALL section at F8880, fan on
- `Benchy_renforced_level2.gcode:72747` layer 115 [warning] Unsupported printed run of 25.4 mm — OVERHANG section at F30000, fan on
- `Benchy_renforced_level2.gcode:155657` layer 293 [warning] Unsupported printed run of 16.2 mm — WALL section at F8700, fan on
- _… 13 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_renforced_level2.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_renforced_level2.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_renforced_level2.gcode:1277` [warning] First M204 (acceleration regime) appears at line 1277 — past the header/preamble, so generic tools parse default values — M204 S5000

### C08 — Fiber-feed window commands M1001/M1002 unimplemented in firmware (issue #9)

- `Benchy_renforced_level2.gcode:0` [critical] 37 × M1001 / 37 × M1002 emitted — no firmware handler exists (issue #9) — fiber-feed windows bracketed by unimplemented commands

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_renforced_level2.gcode:50` layer 1 [info] Fibre on layer 1 is confined to the sacrificial priming/skirt pass (25.0 mm) — the part’s first layer is plastic — Priming line 25.0; first fibre move at line 50

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_renforced_level2.gcode:0` [info] Tool configuration: dual-tool (FFF + CFC fibre) — T0×37 / T1×37, plastic 6.54 m, fibre 6.72 m fed — ; PRINTING_MODE: Plastic and Composite (declares dual)

### C14 — Fibre consumption and cut count

- `Benchy_renforced_level2.gcode:0` [info] Fibre: 6.72 m fed — 4.69 m deposited in the part, 2.04 m (30 %) air-primed through the head; slicer declares 4.69 m — fed=ΣU, deposited=ΣU on moves with XY motion, restart=ΣU with no XY motion; MATERIAL_PRINT_DATA tow Length=4.689408 m
- `Benchy_renforced_level2.gcode:0` [info] 37 fibre cut(s) (M2800), tail constant 54.8 mm — 2.03 m of trimmed tail — M2800 count; ;CUT DISTANCE sum 2028 mm

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_renforced_level2.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_renforced_level3.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:48 AM` · processor SK3 · mode Plastic and Composite · 186,150 lines
- Layers 399 (header `LAYER_COUNT` 399) · moves 178,267 (145,338 extruding, 28,441 travel) · tool changes 74
- Estimated print time 68.7 min · plastic 6.81 m · fiber 7.17 m · bbox 106.5–188.7 × 130.9–172.0 mm
- Material PETG · `DoZHop`=true `ZhopP`=0.4 · `MinLayerTimeForSlowing`=5 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.24 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 1274 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 42/42 · fan commands 418 · seam markers 1310 (89 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** layer-1 fibre is sacrificial priming/skirt only — part first layer is plastic (25.0 mm deposited; features: Priming line). Fortified = `CurrentSliceType=1`, `MustGenerateFiberPerimeters=false`. First fibre layer: 1.

**2. Tool configuration.** **Dual-tool** (FFF + CFC fibre) — `T0`×37 / `T1`×37, plastic 6.81 m, fibre 7.17 m fed. Header `PRINTING_MODE: Plastic and Composite` declares dual.

**3. Fibre used / cuts.** 7.17 m fed · 4.86 m deposited in the part · 2.31 m (32 %) air-primed through the head. **42 cuts** (`M2800`), constant 54.8 mm tail = 2.30 m trimmed. Slicer `MATERIAL_PRINT_DATA` declares 4.86 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 15 | 1 | 51.91 |
| C02 | #2 | 1 | 1 | 91.00 |
| C03 | #3 | 83 | 30 | 1.60 |
| C04 | #4 | 1 | 0 | 19.20 |
| C05 | #5 | 93 | 0 | 3.42 |
| C06 | #6 | 21 | 2 | 41.55 |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 1 | 1 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 2 | 0 | 7.17 |
| C15 | — | 1 | 0 | — |

### C01 — Un-retracted plastic travel across voids / open air (stringing) (issue #1)

- `Benchy_renforced_level3.gcode:606` layer 1 [critical] Un-retracted plastic travel across void of 51.9 mm (stringing risk) — G0 X172.250 Y145.305 F30000 at line 606 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level3.gcode:716` layer 1 [warning] Un-retracted plastic travel across void of 9.1 mm (stringing risk) — G0 X176.424 Y153.684 F30000 at line 716 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level3.gcode:3643` layer 3 [warning] Un-retracted plastic travel across void of 15.2 mm (stringing risk) — G0 X137.443 Y154.979 F30000 at line 3643 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level3.gcode:3678` layer 3 [warning] Un-retracted plastic travel across void of 9.5 mm (stringing risk) — G0 X127.787 Y148.152 F30000 at line 3678 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level3.gcode:4144` layer 3 [warning] Un-retracted plastic travel across void of 11.1 mm (stringing risk) — G0 X147.346 Y149.043 F30000 at line 4144 — no retraction, no Z-hop, Bridge solid infill
- `Benchy_renforced_level3.gcode:1296` layer 1 [info] Un-retracted plastic travel across void of 3.1 mm (stringing risk) — G0 X162.947 Y149.953 F30000 at line 1296 — no retraction, no Z-hop, Inset XP
- _… 9 more_

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_renforced_level3.gcode:161247` layer 309 [critical] Seam repeated at the same XY for 91 consecutive layers at X149.477 Y152.500 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_renforced_level3.gcode:4332` layer 5 [critical] Layer 5 encloses 7 perimeter-bounded gap(s); widest ≈ 1.00 mm across (9.3 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level3.gcode:5433` layer 7 [critical] Layer 7 encloses 6 perimeter-bounded gap(s); widest ≈ 1.00 mm across (5.3 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level3.gcode:15607` layer 31 [critical] Layer 31 encloses 8 perimeter-bounded gap(s); widest ≈ 1.00 mm across (5.7 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level3.gcode:16452` layer 33 [critical] Layer 33 encloses 4 perimeter-bounded gap(s); widest ≈ 1.20 mm across (2.7 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level3.gcode:17302` layer 35 [critical] Layer 35 encloses 5 perimeter-bounded gap(s); widest ≈ 1.20 mm across (3.4 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level3.gcode:21293` layer 43 [critical] Layer 43 encloses 5 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.5 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 77 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_renforced_level3.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.24 mm bead = 19.2 mm³/s constant wall demand vs a 12 mm³/s PETG ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_renforced_level3.gcode:3194` layer 2 [warning] Layer 2 time 4.95s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.95s
- `Benchy_renforced_level3.gcode:139209` layer 222 [warning] Layer 222 time 4.75s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.75s
- `Benchy_renforced_level3.gcode:139752` layer 224 [warning] Layer 224 time 4.42s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.42s
- `Benchy_renforced_level3.gcode:140253` layer 226 [warning] Layer 226 time 4.15s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.15s
- `Benchy_renforced_level3.gcode:140715` layer 228 [warning] Layer 228 time 3.81s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.81s
- `Benchy_renforced_level3.gcode:141161` layer 230 [warning] Layer 230 time 3.82s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.82s
- _… 87 more_

### C06 — Long unsupported (bridging) printed runs (issue #6)

- `Benchy_renforced_level3.gcode:160661` layer 307 [critical] Unsupported printed run of 40.9 mm — TOP section at F30000, fan on
- `Benchy_renforced_level3.gcode:160784` layer 307 [critical] Unsupported printed run of 41.5 mm — BRIDGE section at F3000, fan on
- `Benchy_renforced_level3.gcode:43478` layer 76 [warning] Unsupported printed run of 22.1 mm — WALL section at F8880, fan on
- `Benchy_renforced_level3.gcode:74045` layer 115 [warning] Unsupported printed run of 27.2 mm — OVERHANG section at F3000, fan on
- `Benchy_renforced_level3.gcode:156863` layer 293 [warning] Unsupported printed run of 16.4 mm — WALL section at F8760, fan on
- `Benchy_renforced_level3.gcode:160706` layer 307 [warning] Unsupported printed run of 16.1 mm — BRIDGE section at F3000, fan on
- _… 15 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_renforced_level3.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_renforced_level3.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_renforced_level3.gcode:1274` [warning] First M204 (acceleration regime) appears at line 1274 — past the header/preamble, so generic tools parse default values — M204 S5000

### C08 — Fiber-feed window commands M1001/M1002 unimplemented in firmware (issue #9)

- `Benchy_renforced_level3.gcode:0` [critical] 42 × M1001 / 42 × M1002 emitted — no firmware handler exists (issue #9) — fiber-feed windows bracketed by unimplemented commands

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_renforced_level3.gcode:50` layer 1 [info] Fibre on layer 1 is confined to the sacrificial priming/skirt pass (25.0 mm) — the part’s first layer is plastic — Priming line 25.0; first fibre move at line 50

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_renforced_level3.gcode:0` [info] Tool configuration: dual-tool (FFF + CFC fibre) — T0×37 / T1×37, plastic 6.81 m, fibre 7.17 m fed — ; PRINTING_MODE: Plastic and Composite (declares dual)

### C14 — Fibre consumption and cut count

- `Benchy_renforced_level3.gcode:0` [info] Fibre: 7.17 m fed — 4.86 m deposited in the part, 2.31 m (32 %) air-primed through the head; slicer declares 4.86 m — fed=ΣU, deposited=ΣU on moves with XY motion, restart=ΣU with no XY motion; MATERIAL_PRINT_DATA tow Length=4.864696 m
- `Benchy_renforced_level3.gcode:0` [info] 42 fibre cut(s) (M2800), tail constant 54.8 mm — 2.30 m of trimmed tail — M2800 count; ;CUT DISTANCE sum 2302 mm

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_renforced_level3.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_renforced_level4.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:49 AM` · processor SK3 · mode Plastic and Composite · 191,874 lines
- Layers 399 (header `LAYER_COUNT` 399) · moves 183,143 (147,522 extruding, 31,023 travel) · tool changes 74
- Estimated print time 92.0 min · plastic 6.84 m · fiber 13.59 m · bbox 106.5–188.7 × 130.9–172.1 mm
- Material PETG · `DoZHop`=true `ZhopP`=0.4 · `MinLayerTimeForSlowing`=5 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.24 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 1294 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 100/100 · fan commands 420 · seam markers 1310 (85 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** layer-1 fibre is sacrificial priming/skirt only — part first layer is plastic (25.0 mm deposited; features: Priming line). Fortified = `CurrentSliceType=1`, `MustGenerateFiberPerimeters=false`. First fibre layer: 1.

**2. Tool configuration.** **Dual-tool** (FFF + CFC fibre) — `T0`×37 / `T1`×37, plastic 6.84 m, fibre 13.59 m fed. Header `PRINTING_MODE: Plastic and Composite` declares dual.

**3. Fibre used / cuts.** 13.59 m fed · 8.09 m deposited in the part · 5.50 m (40 %) air-primed through the head. **100 cuts** (`M2800`), constant 54.8 mm tail = 5.48 m trimmed. Slicer `MATERIAL_PRINT_DATA` declares 8.09 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 16 | 1 | 51.67 |
| C02 | #2 | 1 | 1 | 91.00 |
| C03 | #3 | 79 | 36 | 1.60 |
| C04 | #4 | 1 | 0 | 19.20 |
| C05 | #5 | 93 | 0 | 3.42 |
| C06 | #6 | 20 | 3 | 41.55 |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 1 | 1 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 2 | 0 | 13.59 |
| C15 | — | 1 | 0 | — |

### C01 — Un-retracted plastic travel across voids / open air (stringing) (issue #1)

- `Benchy_renforced_level4.gcode:602` layer 1 [critical] Un-retracted plastic travel across void of 51.7 mm (stringing risk) — G0 X172.261 Y145.153 F30000 at line 602 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level4.gcode:712` layer 1 [warning] Un-retracted plastic travel across void of 9.2 mm (stringing risk) — G0 X176.648 Y153.577 F30000 at line 712 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level4.gcode:3561` layer 3 [warning] Un-retracted plastic travel across void of 15.2 mm (stringing risk) — G0 X137.443 Y154.979 F30000 at line 3561 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level4.gcode:3596` layer 3 [warning] Un-retracted plastic travel across void of 9.5 mm (stringing risk) — G0 X127.786 Y148.150 F30000 at line 3596 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level4.gcode:4057` layer 3 [warning] Un-retracted plastic travel across void of 11.1 mm (stringing risk) — G0 X147.346 Y149.043 F30000 at line 4057 — no retraction, no Z-hop, Bridge solid infill
- `Benchy_renforced_level4.gcode:1315` layer 1 [info] Un-retracted plastic travel across void of 3.1 mm (stringing risk) — G0 X162.932 Y149.938 F30000 at line 1315 — no retraction, no Z-hop, Inset XP
- _… 10 more_

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_renforced_level4.gcode:166949` layer 309 [critical] Seam repeated at the same XY for 91 consecutive layers at X149.477 Y152.500 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_renforced_level4.gcode:4243` layer 5 [critical] Layer 5 encloses 7 perimeter-bounded gap(s); widest ≈ 1.00 mm across (8.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level4.gcode:5345` layer 7 [critical] Layer 7 encloses 7 perimeter-bounded gap(s); widest ≈ 1.00 mm across (6.1 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level4.gcode:11209` layer 19 [critical] Layer 19 encloses 4 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.6 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level4.gcode:16127` layer 29 [critical] Layer 29 encloses 8 perimeter-bounded gap(s); widest ≈ 1.20 mm across (5.9 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level4.gcode:17205` layer 31 [critical] Layer 31 encloses 9 perimeter-bounded gap(s); widest ≈ 1.00 mm across (7.7 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level4.gcode:18321` layer 33 [critical] Layer 33 encloses 8 perimeter-bounded gap(s); widest ≈ 1.00 mm across (6.9 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 73 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_renforced_level4.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.24 mm bead = 19.2 mm³/s constant wall demand vs a 12 mm³/s PETG ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_renforced_level4.gcode:3121` layer 2 [warning] Layer 2 time 4.95s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.95s
- `Benchy_renforced_level4.gcode:145070` layer 222 [warning] Layer 222 time 4.80s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.80s
- `Benchy_renforced_level4.gcode:145623` layer 224 [warning] Layer 224 time 4.41s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.41s
- `Benchy_renforced_level4.gcode:146124` layer 226 [warning] Layer 226 time 4.15s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.15s
- `Benchy_renforced_level4.gcode:146581` layer 228 [warning] Layer 228 time 3.81s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.81s
- `Benchy_renforced_level4.gcode:147021` layer 230 [warning] Layer 230 time 3.82s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.82s
- _… 87 more_

### C06 — Long unsupported (bridging) printed runs (issue #6)

- `Benchy_renforced_level4.gcode:166366` layer 307 [critical] Unsupported printed run of 40.9 mm — TOP section at F30000, fan on
- `Benchy_renforced_level4.gcode:166489` layer 307 [critical] Unsupported printed run of 41.5 mm — BRIDGE section at F3000, fan on
- `Benchy_renforced_level4.gcode:166493` layer 307 [critical] Unsupported printed run of 40.8 mm — BRIDGE section at F3000, fan on
- `Benchy_renforced_level4.gcode:48397` layer 76 [warning] Unsupported printed run of 22.0 mm — WALL section at F8880, fan on
- `Benchy_renforced_level4.gcode:79534` layer 115 [warning] Unsupported printed run of 23.8 mm — OVERHANG section at F3000, fan on
- `Benchy_renforced_level4.gcode:162627` layer 293 [warning] Unsupported printed run of 16.4 mm — WALL section at F8700, fan on
- _… 14 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_renforced_level4.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_renforced_level4.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_renforced_level4.gcode:1294` [warning] First M204 (acceleration regime) appears at line 1294 — past the header/preamble, so generic tools parse default values — M204 S5000

### C08 — Fiber-feed window commands M1001/M1002 unimplemented in firmware (issue #9)

- `Benchy_renforced_level4.gcode:0` [critical] 100 × M1001 / 100 × M1002 emitted — no firmware handler exists (issue #9) — fiber-feed windows bracketed by unimplemented commands

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_renforced_level4.gcode:50` layer 1 [info] Fibre on layer 1 is confined to the sacrificial priming/skirt pass (25.0 mm) — the part’s first layer is plastic — Priming line 25.0; first fibre move at line 50

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_renforced_level4.gcode:0` [info] Tool configuration: dual-tool (FFF + CFC fibre) — T0×37 / T1×37, plastic 6.84 m, fibre 13.59 m fed — ; PRINTING_MODE: Plastic and Composite (declares dual)

### C14 — Fibre consumption and cut count

- `Benchy_renforced_level4.gcode:0` [info] Fibre: 13.59 m fed — 8.09 m deposited in the part, 5.50 m (40 %) air-primed through the head; slicer declares 8.09 m — fed=ΣU, deposited=ΣU on moves with XY motion, restart=ΣU with no XY motion; MATERIAL_PRINT_DATA tow Length=8.089992 m
- `Benchy_renforced_level4.gcode:0` [info] 100 fibre cut(s) (M2800), tail constant 54.8 mm — 5.48 m of trimmed tail — M2800 count; ;CUT DISTANCE sum 5480 mm

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_renforced_level4.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_renforced_level5-pla.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:52 AM` · processor SK3 · mode Plastic and Composite · 124,544 lines
- Layers 200 (header `LAYER_COUNT` 200) · moves 118,929 (93,813 extruding, 21,731 travel) · tool changes 74
- Estimated print time 52.8 min · plastic 7.10 m · fiber 4.11 m · bbox 106.5–188.7 × 130.5–172.5 mm
- Material PLA · `DoZHop`=false `ZhopP`=0 · `MinLayerTimeForSlowing`=10 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.24 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 1203 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 37/37 · fan commands 233 · seam markers 694 (54 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** layer-1 fibre is sacrificial priming/skirt only — part first layer is plastic (24.0 mm deposited; features: Priming line). Fortified = `CurrentSliceType=1`, `MustGenerateFiberPerimeters=true`. First fibre layer: 1.

**2. Tool configuration.** **Dual-tool** (FFF + CFC fibre) — `T0`×37 / `T1`×37, plastic 7.10 m, fibre 4.11 m fed. Header `PRINTING_MODE: Plastic and Composite` declares dual.

**3. Fibre used / cuts.** 4.11 m fed · 2.07 m deposited in the part · 2.04 m (50 %) air-primed through the head. **37 cuts** (`M2800`), constant 54.8 mm tail = 2.03 m trimmed. Slicer `MATERIAL_PRINT_DATA` declares 2.07 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 0 | 0 | — |
| C02 | #2 | 1 | 1 | 46.00 |
| C03 | #3 | 83 | 8 | 1.40 |
| C04 | #4 | 1 | 0 | 19.20 |
| C05 | #5 | 56 | 28 | 8.44 |
| C06 | #6 | 14 | 0 | 30.35 |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 1 | 1 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 2 | 0 | 4.11 |
| C15 | — | 1 | 0 | — |

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_renforced_level5-pla.gcode:109496` layer 155 [critical] Seam repeated at the same XY for 46 consecutive layers at X149.526 Y152.504 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_renforced_level5-pla.gcode:5179` layer 4 [critical] Layer 4 encloses 11 perimeter-bounded gap(s); widest ≈ 1.40 mm across (9.2 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5-pla.gcode:7428` layer 7 [critical] Layer 7 encloses 3 perimeter-bounded gap(s); widest ≈ 1.40 mm across (2.4 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5-pla.gcode:12408` layer 15 [critical] Layer 15 encloses 3 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.7 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5-pla.gcode:15543` layer 20 [critical] Layer 20 encloses 5 perimeter-bounded gap(s); widest ≈ 1.00 mm across (3.6 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5-pla.gcode:16972` layer 22 [critical] Layer 22 encloses 2 perimeter-bounded gap(s); widest ≈ 1.20 mm across (1.7 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5-pla.gcode:109360` layer 155 [critical] Layer 155 encloses 3 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 77 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_renforced_level5-pla.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.24 mm bead = 19.2 mm³/s constant wall demand vs a 15 mm³/s PLA ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_renforced_level5-pla.gcode:116858` layer 169 [critical] Layer 169 time 2.44s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=2.44s
- `Benchy_renforced_level5-pla.gcode:117086` layer 170 [critical] Layer 170 time 2.41s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=2.41s
- `Benchy_renforced_level5-pla.gcode:117314` layer 171 [critical] Layer 171 time 2.41s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=2.41s
- `Benchy_renforced_level5-pla.gcode:117532` layer 172 [critical] Layer 172 time 2.40s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=2.40s
- `Benchy_renforced_level5-pla.gcode:117746` layer 173 [critical] Layer 173 time 2.40s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=2.40s
- `Benchy_renforced_level5-pla.gcode:117958` layer 174 [critical] Layer 174 time 2.39s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=2.39s
- _… 50 more_

### C06 — Long unsupported (bridging) printed runs (issue #6)

- `Benchy_renforced_level5-pla.gcode:54272` layer 59 [warning] Unsupported printed run of 26.8 mm — OVERHANG section at F30000, fan on
- `Benchy_renforced_level5-pla.gcode:57309` layer 63 [warning] Unsupported printed run of 29.8 mm — TOP section at F900, fan on
- `Benchy_renforced_level5-pla.gcode:58378` layer 64 [warning] Unsupported printed run of 29.4 mm — TOP section at F900, fan on
- `Benchy_renforced_level5-pla.gcode:59168` layer 65 [warning] Unsupported printed run of 24.9 mm — TOP section at F900, fan on
- `Benchy_renforced_level5-pla.gcode:60013` layer 66 [warning] Unsupported printed run of 30.1 mm — TOP section at F7080, fan on
- `Benchy_renforced_level5-pla.gcode:60820` layer 67 [warning] Unsupported printed run of 26.7 mm — TOP section at F900, fan on
- _… 8 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_renforced_level5-pla.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_renforced_level5-pla.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_renforced_level5-pla.gcode:1203` [warning] First M204 (acceleration regime) appears at line 1203 — past the header/preamble, so generic tools parse default values — M204 S5000

### C08 — Fiber-feed window commands M1001/M1002 unimplemented in firmware (issue #9)

- `Benchy_renforced_level5-pla.gcode:0` [critical] 37 × M1001 / 37 × M1002 emitted — no firmware handler exists (issue #9) — fiber-feed windows bracketed by unimplemented commands

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_renforced_level5-pla.gcode:50` layer 1 [info] Fibre on layer 1 (0.0 mm deposited) — permitted: this is a fortified print — CurrentSliceType=1 MustGenerateFiberPerimeters=true; Priming line 24.0

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_renforced_level5-pla.gcode:0` [info] Tool configuration: dual-tool (FFF + CFC fibre) — T0×37 / T1×37, plastic 7.10 m, fibre 4.11 m fed — ; PRINTING_MODE: Plastic and Composite (declares dual)

### C14 — Fibre consumption and cut count

- `Benchy_renforced_level5-pla.gcode:0` [info] Fibre: 4.11 m fed — 2.07 m deposited in the part, 2.04 m (50 %) air-primed through the head; slicer declares 2.07 m — fed=ΣU, deposited=ΣU on moves with XY motion, restart=ΣU with no XY motion; MATERIAL_PRINT_DATA tow Length=2.071264 m
- `Benchy_renforced_level5-pla.gcode:0` [info] 37 fibre cut(s) (M2800), tail constant 54.8 mm — 2.03 m of trimmed tail — M2800 count; ;CUT DISTANCE sum 2028 mm

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_renforced_level5-pla.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_renforced_level5.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:50 AM` · processor SK3 · mode Plastic and Composite · 194,272 lines
- Layers 399 (header `LAYER_COUNT` 399) · moves 185,469 (148,962 extruding, 31,897 travel) · tool changes 74
- Estimated print time 103.2 min · plastic 6.94 m · fiber 15.94 m · bbox 106.5–188.7 × 130.9–172.1 mm
- Material PETG · `DoZHop`=true `ZhopP`=0.4 · `MinLayerTimeForSlowing`=5 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.24 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 1291 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 105/105 · fan commands 422 · seam markers 1310 (85 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** layer-1 fibre is sacrificial priming/skirt only — part first layer is plastic (25.0 mm deposited; features: Priming line). Fortified = `CurrentSliceType=1`, `MustGenerateFiberPerimeters=false`. First fibre layer: 1.

**2. Tool configuration.** **Dual-tool** (FFF + CFC fibre) — `T0`×37 / `T1`×37, plastic 6.94 m, fibre 15.94 m fed. Header `PRINTING_MODE: Plastic and Composite` declares dual.

**3. Fibre used / cuts.** 15.94 m fed · 10.16 m deposited in the part · 5.78 m (36 %) air-primed through the head. **105 cuts** (`M2800`), constant 54.8 mm tail = 5.75 m trimmed. Slicer `MATERIAL_PRINT_DATA` declares 10.16 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 17 | 1 | 51.75 |
| C02 | #2 | 1 | 1 | 91.00 |
| C03 | #3 | 87 | 37 | 1.60 |
| C04 | #4 | 1 | 0 | 19.20 |
| C05 | #5 | 92 | 0 | 3.42 |
| C06 | #6 | 20 | 3 | 41.55 |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 1 | 1 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 2 | 0 | 15.94 |
| C15 | — | 1 | 0 | — |

### C01 — Un-retracted plastic travel across voids / open air (stringing) (issue #1)

- `Benchy_renforced_level5.gcode:615` layer 1 [critical] Un-retracted plastic travel across void of 51.8 mm (stringing risk) — G0 X172.303 Y145.003 F30000 at line 615 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level5.gcode:729` layer 1 [warning] Un-retracted plastic travel across void of 9.3 mm (stringing risk) — G0 X176.400 Y153.683 F30000 at line 729 — no retraction, no Z-hop, Skirt
- `Benchy_renforced_level5.gcode:3488` layer 3 [warning] Un-retracted plastic travel across void of 15.2 mm (stringing risk) — G0 X137.444 Y154.980 F30000 at line 3488 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level5.gcode:3522` layer 3 [warning] Un-retracted plastic travel across void of 9.5 mm (stringing risk) — G0 X127.786 Y148.150 F30000 at line 3522 — no retraction, no Z-hop, Bottom intermediate solid infill
- `Benchy_renforced_level5.gcode:1311` layer 1 [info] Un-retracted plastic travel across void of 3.2 mm (stringing risk) — G0 X162.933 Y149.938 F30000 at line 1311 — no retraction, no Z-hop, Inset XP
- `Benchy_renforced_level5.gcode:1566` layer 1 [info] Un-retracted plastic travel across void of 4.0 mm (stringing risk) — G0 X154.497 Y155.187 F30000 at line 1566 — no retraction, no Z-hop, Inset 0
- _… 11 more_

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_renforced_level5.gcode:169291` layer 309 [critical] Seam repeated at the same XY for 91 consecutive layers at X149.477 Y152.499 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_renforced_level5.gcode:4168` layer 5 [critical] Layer 5 encloses 8 perimeter-bounded gap(s); widest ≈ 1.00 mm across (10.5 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5.gcode:5256` layer 7 [critical] Layer 7 encloses 10 perimeter-bounded gap(s); widest ≈ 1.00 mm across (9.1 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5.gcode:7517` layer 11 [critical] Layer 11 encloses 8 perimeter-bounded gap(s); widest ≈ 1.00 mm across (9.2 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5.gcode:8408` layer 13 [critical] Layer 13 encloses 7 perimeter-bounded gap(s); widest ≈ 1.00 mm across (9.7 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5.gcode:15683` layer 27 [critical] Layer 27 encloses 12 perimeter-bounded gap(s); widest ≈ 1.00 mm across (11.5 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_renforced_level5.gcode:18109` layer 31 [critical] Layer 31 encloses 15 perimeter-bounded gap(s); widest ≈ 1.20 mm across (16.2 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 81 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_renforced_level5.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.24 mm bead = 19.2 mm³/s constant wall demand vs a 12 mm³/s PETG ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_renforced_level5.gcode:3045` layer 2 [warning] Layer 2 time 4.95s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.95s
- `Benchy_renforced_level5.gcode:147276` layer 222 [warning] Layer 222 time 4.83s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.83s
- `Benchy_renforced_level5.gcode:147829` layer 224 [warning] Layer 224 time 4.42s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.42s
- `Benchy_renforced_level5.gcode:148329` layer 226 [warning] Layer 226 time 4.15s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.15s
- `Benchy_renforced_level5.gcode:148786` layer 228 [warning] Layer 228 time 3.81s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.81s
- `Benchy_renforced_level5.gcode:149233` layer 230 [warning] Layer 230 time 3.82s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=3.82s
- _… 86 more_

### C06 — Long unsupported (bridging) printed runs (issue #6)

- `Benchy_renforced_level5.gcode:168708` layer 307 [critical] Unsupported printed run of 40.8 mm — TOP section at F30000, fan on
- `Benchy_renforced_level5.gcode:168832` layer 307 [critical] Unsupported printed run of 41.5 mm — BRIDGE section at F3000, fan on
- `Benchy_renforced_level5.gcode:168836` layer 307 [critical] Unsupported printed run of 41.2 mm — BRIDGE section at F3000, fan on
- `Benchy_renforced_level5.gcode:50955` layer 76 [warning] Unsupported printed run of 22.0 mm — WALL section at F8760, fan on
- `Benchy_renforced_level5.gcode:82005` layer 115 [warning] Unsupported printed run of 31.0 mm — OVERHANG section at F30000, fan on
- `Benchy_renforced_level5.gcode:164939` layer 293 [warning] Unsupported printed run of 16.2 mm — WALL section at F8700, fan on
- _… 14 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_renforced_level5.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_renforced_level5.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_renforced_level5.gcode:1291` [warning] First M204 (acceleration regime) appears at line 1291 — past the header/preamble, so generic tools parse default values — M204 S5000

### C08 — Fiber-feed window commands M1001/M1002 unimplemented in firmware (issue #9)

- `Benchy_renforced_level5.gcode:0` [critical] 105 × M1001 / 105 × M1002 emitted — no firmware handler exists (issue #9) — fiber-feed windows bracketed by unimplemented commands

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_renforced_level5.gcode:50` layer 1 [info] Fibre on layer 1 is confined to the sacrificial priming/skirt pass (25.0 mm) — the part’s first layer is plastic — Priming line 25.0; first fibre move at line 50

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_renforced_level5.gcode:0` [info] Tool configuration: dual-tool (FFF + CFC fibre) — T0×37 / T1×37, plastic 6.94 m, fibre 15.94 m fed — ; PRINTING_MODE: Plastic and Composite (declares dual)

### C14 — Fibre consumption and cut count

- `Benchy_renforced_level5.gcode:0` [info] Fibre: 15.94 m fed — 10.16 m deposited in the part, 5.78 m (36 %) air-primed through the head; slicer declares 10.16 m — fed=ΣU, deposited=ΣU on moves with XY motion, restart=ΣU with no XY motion; MATERIAL_PRINT_DATA tow Length=10.161230 m
- `Benchy_renforced_level5.gcode:0` [info] 105 fibre cut(s) (M2800), tail constant 54.8 mm — 5.75 m of trimmed tail — M2800 count; ;CUT DISTANCE sum 5754 mm

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_renforced_level5.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_speedy_default_settings-pla.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:54 AM` · processor SK3 · mode Plastic Only · 88,840 lines
- Layers 240 (header `LAYER_COUNT` 240) · moves 84,520 (69,795 extruding, 11,946 travel) · tool changes 1
- Estimated print time 35.2 min · plastic 5.01 m · fiber 0.00 m · bbox 122.2–182.3 × 137.2–167.8 mm
- Material PLA · `DoZHop`=true `ZhopP`=0 · `MinLayerTimeForSlowing`=10 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.2 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 228 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 0/0 · fan commands 9 · seam markers 748 (72 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** no fibre on layer 1. Fortified = `CurrentSliceType=0`, `MustGenerateFiberPerimeters=false`.

**2. Tool configuration.** **Single-tool FFF** (no fibre deposited) — `T0`×0 / `T1`×1, plastic 5.01 m, fibre 0.00 m fed. Header `PRINTING_MODE: Plastic Only` declares plastic-only.

**3. Fibre used / cuts.** 0.00 m fed · 0.00 m deposited in the part · 0.00 m (0 %) air-primed through the head. **0 cuts** (`M2800`). Slicer `MATERIAL_PRINT_DATA` declares 0.00 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 19 | 0 | 3.27 |
| C02 | #2 | 1 | 0 | 35.00 |
| C03 | #3 | 146 | 62 | 1.60 |
| C04 | #4 | 1 | 0 | 16.00 |
| C05 | #5 | 123 | 38 | 8.58 |
| C06 | #6 | 0 | 0 | — |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 0 | 0 | — |
| C09 | #11 | 1 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 1 | 0 | — |
| C15 | — | 1 | 0 | — |

### C01 — Un-retracted plastic travel across voids / open air (stringing) (issue #1)

- `Benchy_speedy_default_settings-pla.gcode:689` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 689 (1.9 mm, void) is followed by a retraction within 3 lines
- `Benchy_speedy_default_settings-pla.gcode:746` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 746 (2.6 mm, void) is followed by a retraction within 3 lines
- `Benchy_speedy_default_settings-pla.gcode:852` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 852 (2.8 mm, void) is followed by a retraction within 3 lines
- `Benchy_speedy_default_settings-pla.gcode:907` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 907 (3.3 mm, void) is followed by a retraction within 3 lines
- `Benchy_speedy_default_settings-pla.gcode:940` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 940 (2.3 mm, void) is followed by a retraction within 3 lines
- `Benchy_speedy_default_settings-pla.gcode:1002` layer 1 [warning] Retraction emitted AFTER the travel move (emitter ordering defect) — travel at line 1002 (2.4 mm, void) is followed by a retraction within 3 lines
- _… 13 more_

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_speedy_default_settings-pla.gcode:81823` layer 206 [warning] Seam repeated at the same XY for 35 consecutive layers at X149.352 Y152.698 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_speedy_default_settings-pla.gcode:2393` layer 3 [critical] Layer 3 encloses 7 perimeter-bounded gap(s); widest ≈ 1.00 mm across (12.1 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings-pla.gcode:3144` layer 4 [critical] Layer 4 encloses 3 perimeter-bounded gap(s); widest ≈ 1.00 mm across (4.3 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings-pla.gcode:3680` layer 5 [critical] Layer 5 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.6 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings-pla.gcode:3911` layer 6 [critical] Layer 6 encloses 1 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.0 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings-pla.gcode:4645` layer 9 [critical] Layer 9 encloses 4 perimeter-bounded gap(s); widest ≈ 1.00 mm across (3.1 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings-pla.gcode:4891` layer 10 [critical] Layer 10 encloses 3 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 140 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_speedy_default_settings-pla.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.2 mm bead = 16.0 mm³/s constant wall demand vs a 15 mm³/s PLA ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_speedy_default_settings-pla.gcode:81018` layer 202 [critical] Layer 202 time 1.45s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.45s
- `Benchy_speedy_default_settings-pla.gcode:81221` layer 203 [critical] Layer 203 time 1.42s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.42s
- `Benchy_speedy_default_settings-pla.gcode:81407` layer 204 [critical] Layer 204 time 1.42s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.42s
- `Benchy_speedy_default_settings-pla.gcode:81595` layer 205 [critical] Layer 205 time 1.43s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.43s
- `Benchy_speedy_default_settings-pla.gcode:81777` layer 206 [critical] Layer 206 time 1.43s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.43s
- `Benchy_speedy_default_settings-pla.gcode:81950` layer 207 [critical] Layer 207 time 1.43s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=1.43s
- _… 117 more_

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_speedy_default_settings-pla.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_speedy_default_settings-pla.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_speedy_default_settings-pla.gcode:228` [warning] First M204 (acceleration regime) appears at line 228 — past the header/preamble, so generic tools parse default values — M204 S5000

### C09 — Slicer/firmware command contract — undefined verbs (issue #11)

- `Benchy_speedy_default_settings-pla.gcode:0` [warning] Undefined command SET_FAN_AT_LAYER used 1 time(s) — not part of the documented dialect

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_speedy_default_settings-pla.gcode:0` layer 1 [info] No fibre on layer 1 — first layer is plastic-only — first fibre layer none

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_speedy_default_settings-pla.gcode:0` [info] Tool configuration: single-tool FFF (no fibre deposited) — T0×0 / T1×1, plastic 5.01 m, fibre 0.00 m fed — ; PRINTING_MODE: Plastic Only (declares plastic-only)

### C14 — Fibre consumption and cut count

- `Benchy_speedy_default_settings-pla.gcode:0` [info] No fibre consumed — 0 mm fed, 0 cuts (slicer declares 0.00 m tow) — single-tool FFF print; the CFC tool never fed

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_speedy_default_settings-pla.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Benchy_speedy_default_settings.gcode

- Slicer `FibreSeek Rocket Slicer v1.3.1.480 on 9/15/2026 at 8:44 AM` · processor SK3 · mode Plastic Only · 94,997 lines
- Layers 240 (header `LAYER_COUNT` 240) · moves 90,695 (74,833 extruding, 10,898 travel) · tool changes 1
- Estimated print time 25.0 min · plastic 5.53 m · fiber 0.00 m · bbox 122.2–182.3 × 137.2–167.8 mm
- Material PETG · `DoZHop`=true `ZhopP`=0.4 · `MinLayerTimeForSlowing`=5 · `Inset0Speed`=200 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.2 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 224 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 0/0 · fan commands 12 · seam markers 748 (71 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** no fibre on layer 1. Fortified = `CurrentSliceType=0`, `MustGenerateFiberPerimeters=false`.

**2. Tool configuration.** **Single-tool FFF** (no fibre deposited) — `T0`×0 / `T1`×1, plastic 5.53 m, fibre 0.00 m fed. Header `PRINTING_MODE: Plastic Only` declares plastic-only.

**3. Fibre used / cuts.** 0.00 m fed · 0.00 m deposited in the part · 0.00 m (0 %) air-primed through the head. **0 cuts** (`M2800`). Slicer `MATERIAL_PRINT_DATA` declares 0.00 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 6 | 0 | 3.95 |
| C02 | #2 | 1 | 1 | 55.00 |
| C03 | #3 | 103 | 15 | 1.20 |
| C04 | #4 | 1 | 0 | 16.00 |
| C05 | #5 | 62 | 0 | 3.41 |
| C06 | #6 | 1 | 0 | 26.78 |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 0 | 0 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 0 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 1 | 0 | — |
| C15 | — | 1 | 0 | — |

### C01 — Un-retracted plastic travel across voids / open air (stringing) (issue #1)

- `Benchy_speedy_default_settings.gcode:509` layer 1 [info] Un-retracted plastic travel across void of 3.2 mm (stringing risk) — G0 X162.923 Y149.913 F30000 at line 509 — no retraction, no Z-hop, Inset XP
- `Benchy_speedy_default_settings.gcode:1115` layer 1 [info] Un-retracted plastic travel across void of 3.1 mm (stringing risk) — G0 X150.599 Y154.818 F30000 at line 1115 — no retraction, no Z-hop, Inset 0
- `Benchy_speedy_default_settings.gcode:1144` layer 1 [info] Un-retracted plastic travel across void of 3.9 mm (stringing risk) — G0 X154.527 Y155.189 F30000 at line 1144 — no retraction, no Z-hop, Inset 0
- `Benchy_speedy_default_settings.gcode:1967` layer 1 [info] Un-retracted plastic travel across void of 3.6 mm (stringing risk) — G0 X133.463 F30000 at line 1967 — no retraction, no Z-hop, Bottom most solid infill
- `Benchy_speedy_default_settings.gcode:2020` layer 1 [info] Un-retracted plastic travel across void of 2.9 mm (stringing risk) — G0 X141.476 Y158.800 F30000 at line 2020 — no retraction, no Z-hop, Bottom most solid infill
- `Benchy_speedy_default_settings.gcode:2315` layer 2 [info] Un-retracted plastic travel across void of 3.6 mm (stringing risk) — G0 X137.064 F30000 at line 2315 — no retraction, no Z-hop, Bottom intermediate solid infill

### C02 — Aligned seams — perimeter start points stacked in Z (issue #2)

- `Benchy_speedy_default_settings.gcode:78904` layer 186 [critical] Seam repeated at the same XY for 55 consecutive layers at X149.506 Y152.505 — EnableAdjustSeamDistributionPositionPlastic=false

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Benchy_speedy_default_settings.gcode:3822` layer 5 [critical] Layer 5 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.4 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings.gcode:4047` layer 6 [critical] Layer 6 encloses 2 perimeter-bounded gap(s); widest ≈ 1.20 mm across (2.2 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings.gcode:5004` layer 10 [critical] Layer 10 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.1 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings.gcode:10097` layer 28 [critical] Layer 28 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.4 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings.gcode:10552` layer 29 [critical] Layer 29 encloses 4 perimeter-bounded gap(s); widest ≈ 1.00 mm across (2.5 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Benchy_speedy_default_settings.gcode:11469` layer 31 [critical] Layer 31 encloses 2 perimeter-bounded gap(s); widest ≈ 1.00 mm across (1.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 97 more_

### C04 — Volumetric flow demand above the material ceiling (issue #4)

- `Benchy_speedy_default_settings.gcode:0` [warning] Header Inset0Speed=200 mm/s on a 0.4 × 0.2 mm bead = 16.0 mm³/s constant wall demand vs a 12 mm³/s PETG ceiling — Inset0Speed / Inset0EWMM / MacroLayerHeight from the SESSION echo

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Benchy_speedy_default_settings.gcode:56198` layer 99 [warning] Layer 99 time 5.00s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=5.00s
- `Benchy_speedy_default_settings.gcode:70075` layer 134 [warning] Layer 134 time 4.89s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.89s
- `Benchy_speedy_default_settings.gcode:70292` layer 135 [warning] Layer 135 time 4.61s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.61s
- `Benchy_speedy_default_settings.gcode:70486` layer 136 [warning] Layer 136 time 4.61s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.61s
- `Benchy_speedy_default_settings.gcode:70677` layer 137 [warning] Layer 137 time 4.24s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.24s
- `Benchy_speedy_default_settings.gcode:70847` layer 138 [warning] Layer 138 time 4.26s is below the 5s floor (profile minimum) — Profile.MinLayerTimeForSlowing=5 measured=4.26s
- _… 56 more_

### C06 — Long unsupported (bridging) printed runs (issue #6)

- `Benchy_speedy_default_settings.gcode:78228` layer 184 [warning] Unsupported printed run of 26.8 mm — TOP section at F900, fan on

### C07 — Implicit motion contract — accel/jerk/max-feedrate not declared (issue #8)

- `Benchy_speedy_default_settings.gcode:0` [warning] No M205 (jerk) command in the file
- `Benchy_speedy_default_settings.gcode:0` [warning] No M203 (max feedrate) command in the file
- `Benchy_speedy_default_settings.gcode:224` [warning] First M204 (acceleration regime) appears at line 224 — past the header/preamble, so generic tools parse default values — M204 S5000

### C12 — Carbon fibre deposited on the first layer of a non-fortified print

- `Benchy_speedy_default_settings.gcode:0` layer 1 [info] No fibre on layer 1 — first layer is plastic-only — first fibre layer none

### C13 — Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF

- `Benchy_speedy_default_settings.gcode:0` [info] Tool configuration: single-tool FFF (no fibre deposited) — T0×0 / T1×1, plastic 5.53 m, fibre 0.00 m fed — ; PRINTING_MODE: Plastic Only (declares plastic-only)

### C14 — Fibre consumption and cut count

- `Benchy_speedy_default_settings.gcode:0` [info] No fibre consumed — 0 mm fed, 0 cuts (slicer declares 0.00 m tow) — single-tool FFF print; the CFC tool never fed

### C15 — Machine-assist flags (AI detection, bed mesh, runout) present or absent

- `Benchy_speedy_default_settings.gcode:0` [info] No machine-assist flag present — none of the 9 recognised commands appear as executable lines — absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook; absence means not requested by this file, not unconfigured on the machine (homing/meshing normally run before the print)

---

## Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode

- Slicer `FibreSeek Rocket Slicer v1.4.0.857 on 03.10.2026 at 18:50` · processor SK3 · mode Plastic Only · 2,109,305 lines
- Layers 155 (header `LAYER_COUNT` 303) · moves 2,061,888 (1,886,954 extruding, 139,982 travel) · tool changes 1
- Estimated print time 259.3 min · plastic 81.47 m · fiber 0.00 m · bbox 16.7–290.7 × 13.9–291.2 mm
- Material PETG · `DoZHop`=true `ZhopP`=0.4 · `MinLayerTimeForSlowing`=10 · `Inset0Speed`=100 · `Inset0EWMM`=0.4 · `MacroLayerHeight`=0.2 · `EnableAdjustSeamDistributionPositionPlastic`=false
- First `M204` at line 2331 · `M205` 0 · `M203` 0 · `M1001`/`M1002` 0/0 · fan commands 12 · seam markers 1200 (77 clusters ≥3 layers)

### Print contract

**1. Carbon on layer 1.** no fibre on layer 1. Fortified = `CurrentSliceType=0`, `MustGenerateFiberPerimeters=false`.

**2. Tool configuration.** **Single-tool FFF** (no fibre deposited) — `T0`×0 / `T1`×1, plastic 81.47 m, fibre 0.00 m fed. Header `PRINTING_MODE: Plastic Only` declares plastic-only.

**3. Fibre used / cuts.** 0.00 m fed · 0.00 m deposited in the part · 0.00 m (0 %) air-primed through the head. **0 cuts** (`M2800`). Slicer `MATERIAL_PRINT_DATA` declares 0.00 m of X-CCF — measured deposition agrees.

**4. Machine flags.** **none present** — all 9 recognised assist commands are absent from the file. Absent: Homing (G28), Bed mesh / auto-leveling, Z probe / probe calibration, AI / spaghetti detection, Filament runout / motion sensor, Resonance / input shaper calibration, Power-loss recovery, Crash detection, Pause/cancel-on-failure hook. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.

| Check | Issue | Findings | Critical | Worst |
|---|---|---:|---:|---|
| C01 | #1 | 0 | 0 | — |
| C02 | #2 | 1 | 1 | 124.00 |
| C03 | #3 | 147 | 86 | 1.60 |
| C04 | #4 | 0 | 0 | — |
| C05 | #5 | 5 | 0 | 5.34 |
| C06 | #6 | 595 | 192 | 1,324.49 |
| C07 | #8 | 3 | 0 | — |
| C08 | #9 | 0 | 0 | — |
| C09 | #11 | 0 | 0 | — |
| C10 | #29 | 0 | 0 | — |
| C11 | — | 1 | 0 | — |
| C12 | — | 1 | 0 | — |
| C13 | — | 1 | 0 | — |
| C14 | — | 1 | 0 | — |
| C15 | — | 1 | 0 | — |

### C03 — Enclosed gaps wider than the deposited bead (issue #3)

- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:38932` layer 4 [critical] Layer 4 encloses 76 perimeter-bounded gap(s); widest ≈ 1.40 mm across (66.4 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:73356` layer 5 [critical] Layer 5 encloses 69 perimeter-bounded gap(s); widest ≈ 1.40 mm across (51.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:108206` layer 6 [critical] Layer 6 encloses 114 perimeter-bounded gap(s); widest ≈ 1.20 mm across (76.0 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:143713` layer 7 [critical] Layer 7 encloses 286 perimeter-bounded gap(s); widest ≈ 1.40 mm across (198.3 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:179456` layer 8 [critical] Layer 8 encloses 20 perimeter-bounded gap(s); widest ≈ 1.20 mm across (10.8 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:215251` layer 9 [critical] Layer 9 encloses 145 perimeter-bounded gap(s); widest ≈ 1.20 mm across (94.0 mm² total) — wider than the 0.40 mm bead — enclosed empty area inside the layer footprint bounded by a perimeter bead
- _… 141 more_

### C05 — Layer time below the slicer’s own minimum (issue #5)

- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:628164` layer 20 [warning] Layer 20 time 5.11s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=5.11s
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:668352` layer 22 [warning] Layer 22 time 4.66s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=4.66s
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:828260` layer 27 [warning] Layer 27 time 5.11s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=5.11s
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:868126` layer 29 [warning] Layer 29 time 4.66s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=4.66s
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:906845` layer 31 [warning] Layer 31 time 5.72s is below the 10s floor (profile minimum) — Profile.MinLayerTimeForSlowing=10 measured=5.72s

### C06 — Long unsupported (bridging) printed runs (issue #6)

- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:1635537` layer 53 [critical] Unsupported printed run of 99.6 mm — TOP section at F3600, fan on
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:1635700` layer 53 [critical] Unsupported printed run of 244.4 mm — TOP section at F3600, fan on
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:1636046` layer 53 [critical] Unsupported printed run of 60.1 mm — TOP section at F3600, fan on
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:1636210` layer 53 [critical] Unsupported printed run of 40.8 mm — TOP section at F3600, fan on
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:1636300` layer 53 [critical] Unsupported printed run of 41.2 mm — TOP section at F3600, fan on
- `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode:1636311` layer 53 [critical] Unsupported printed run of 212.3 mm — TOP section at F900, fan on
- _… 589 more_

