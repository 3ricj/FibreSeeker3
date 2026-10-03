# Issue-coverage report — G-code Inspector

Tool: `Tools/gcode-inspector` (standalone HTML / JS / Node, no build step, no install).
Repository: <https://github.com/3ricj/FibreSeeker3>
Generated from `src/rules.json` + `reports/corpus-results.json` by `Tools/gcode-inspector/src/gen_report.js`.

## How to reproduce

```bash
# CLI — run the engine over every G-code fixture, write JSON + Markdown results
node Tools/gcode-inspector/src/inspect.js Test_files/*.gcode \
     --json reports/corpus-results.json --md reports/corpus-results.md

# Regenerate this coverage report from the manifest + results
node Tools/gcode-inspector/src/gen_report.js

# Rebuild the single-file browser bundle after any src/*.js change
node Tools/gcode-inspector/src/build_bundle.js

# Self-test: engine parity + bundle freshness + C01/C06 calibration guards
node Tools/gcode-inspector/src/selftest.js

# UI test: drives the real upload -> inspect -> render flow headlessly
node Tools/gcode-inspector/src/uitest.js
```

The deliverable is a single self-contained file, `Tools/gcode-inspector/g-code-inspector.html`
(~81 KB, no dependencies, no network). It inlines the same `src/*.js` engine the CLI
uses, so a rule can never disagree between the CLI and the UI. `selftest.js` proves it
two ways: it loads the bundle inside a `vm` context with only `self` defined and diffs
the findings against the CLI on every fixture, and it re-renders the bundle from
`src/*.js` to fail if the shipped file is stale.

## Coverage: rules the tool tests for

Every rule below is `implemented` and fired on at least one repo fixture during the
corpus run (see `reports/corpus-results.md`). "Fired on" lists the fixtures that
triggered the rule and the finding count in each.

| Rule | Issue | Severity | What it detects | Fired on (fixture: findings) |
|---|---|---|---|---|
| C01 | [#1](https://github.com/3ricj/FibreSeeker3/issues/1) | warning | A plastic (E) travel that immediately follows a plastic extrusion, classified against the coverage raster as crossing a void or open air, with neither a retraction nor a Z-hop within a 3-line window. Also flags the emitter-ordering quirk where the retraction is written after the travel. | Benchy_fortified-pla 21, Benchy_renforced_level1 12, Benchy_renforced_level2 13, Benchy_renforced_level3 15, Benchy_renforced_level4 16, Benchy_renforced_level5 17, Benchy_speedy_default_settings-pla 19, Benchy_speedy_default_settings 6 |
| C02 | [#2](https://github.com/3ricj/FibreSeeker3/issues/2) | warning | The `; SEAM Plastic/Fiber at X.. Y..` marker repeats within a 0.5 mm XY cell for >= minSeamRun consecutive layers. | Benchy_fortified-pla 1, Benchy_renforced_level1 1, Benchy_renforced_level2 1, Benchy_renforced_level3 1, Benchy_renforced_level4 1, Benchy_renforced_level5-pla 1, Benchy_renforced_level5 1, Benchy_speedy_default_settings-pla 1, Benchy_speedy_default_settings 1, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 1 |
| C03 | [#3](https://github.com/3ricj/FibreSeeker3/issues/3) | critical | A layer leaves an enclosed empty region (flood-fill from outside never reaches it) whose inscribed width exceeds gapRatio x the Inset0 bead width and is bounded by a perimeter bead, capped at MAX_GAP_MM so designed openings are excluded. | Benchy_fortified-pla 146, Benchy_fortified 122, Benchy_renforced_level1 80, Benchy_renforced_level2 77, Benchy_renforced_level3 83, Benchy_renforced_level4 79, Benchy_renforced_level5-pla 83, Benchy_renforced_level5 87, Benchy_speedy_default_settings-pla 146, Benchy_speedy_default_settings 103, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 147 |
| C04 | [#4](https://github.com/3ricj/FibreSeeker3/issues/4) | warning | Sustained (>= 1 s continuous) melt demand E/dist*width*height*speed above the material ceiling, plus a header-derived corroboration from Inset0Speed x Inset0EWMM x MacroLayerHeight. | Benchy_fortified-pla 1, Benchy_fortified 1, Benchy_renforced_level1 1, Benchy_renforced_level2 1, Benchy_renforced_level3 1, Benchy_renforced_level4 1, Benchy_renforced_level5-pla 1, Benchy_renforced_level5 1, Benchy_speedy_default_settings-pla 1, Benchy_speedy_default_settings 1 |
| C05 | [#5](https://github.com/3ricj/FibreSeeker3/issues/5) | warning | A layer's summed move time is below Profile.MinLayerTimeForSlowing (falling back to LayerTimeForMaxCooling, then a tool floor, when the profile declares 0). | Benchy_fortified-pla 125, Benchy_fortified 103, Benchy_renforced_level1 94, Benchy_renforced_level2 92, Benchy_renforced_level3 93, Benchy_renforced_level4 93, Benchy_renforced_level5-pla 56, Benchy_renforced_level5 92, Benchy_speedy_default_settings-pla 123, Benchy_speedy_default_settings 62, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 5 |
| C06 | [#6](https://github.com/3ricj/FibreSeeker3/issues/6) | warning | A contiguous printed path whose sampled points are >90% unsupported, reported at its completed length once it reaches minUnsupported mm. The run ends at supported plastic, a travel, a feature change or a layer change. Support is age-based: material deposited in that column within the last supportDepth (2) layers, probed over a supportRadius (0.4 mm) disc, excluding the layer being printed. Support/skirt/brim/priming/wipe excluded; plastic only. | Benchy_renforced_level1 21, Benchy_renforced_level2 19, Benchy_renforced_level3 21, Benchy_renforced_level4 20, Benchy_renforced_level5-pla 14, Benchy_renforced_level5 20, Benchy_speedy_default_settings 1, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 595 |
| C07 | [#8](https://github.com/3ricj/FibreSeeker3/issues/8) | warning | No M204 (accel), or first M204 past line 200, or no M205 (jerk), or no M203 (max feedrate); Klipper motion limits present only as a header echo, not executable lines. | Benchy_fortified-pla 3, Benchy_fortified 2, Benchy_renforced_level1 3, Benchy_renforced_level2 3, Benchy_renforced_level3 3, Benchy_renforced_level4 3, Benchy_renforced_level5-pla 3, Benchy_renforced_level5 3, Benchy_speedy_default_settings-pla 3, Benchy_speedy_default_settings 3, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 3 |
| C08 | [#9](https://github.com/3ricj/FibreSeeker3/issues/9) | critical | Any M1001/M1002 emitted (no firmware handler exists); M1002 without a matching M1001; M1001 with no L parameter; unclosed M1001 windows. | Benchy_fortified 1, Benchy_renforced_level1 1, Benchy_renforced_level2 1, Benchy_renforced_level3 1, Benchy_renforced_level4 1, Benchy_renforced_level5-pla 1, Benchy_renforced_level5 1 |
| C09 | [#11](https://github.com/3ricj/FibreSeeker3/issues/11) | critical | A verb outside the documented dialect is emitted (e.g. CASE_FAN, SET_FAN_AT_LAYER); CASE_FAN referenced by exported start/end gcode; start gcode reads toolhead_temp where a chamber reading is expected (issue #10). | Benchy_fortified-pla 1, Benchy_speedy_default_settings-pla 1 |
| C10 | [#29](https://github.com/3ricj/FibreSeeker3/issues/29) | critical | A plastic travel Z-hop (up ZhopP then back to the same Z within a travel, last extrusion axis E) is emitted while the SESSION echo reports Profile.DoZHop=false. | Benchy_fortified 1 |
| C11 | — | critical | Deposited geometry leaves the declared build area; no extrusion moves parsed; no ; LAYER: markers parsed; header LAYER_COUNT disagrees with parsed layer markers; relative-XYZ (G91) in an absolute-XYZ dialect. | Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 1 |
| C12 | — | critical | Positive `U` deposition on layer 1 inside a part-geometry feature (anything other than Skirt/Brim/Priming line/Wipe tower) while the SESSION echo shows the print is not fortified. Fortified = `CurrentSliceType == 2` (Composite Only) or `Profile.MustGenerateFiberPerimeters == true`, i.e. the fibre is the part's own skin and must start at the bed. A first-layer fibre pass confined to the sacrificial priming/skirt is reported as info, not a violation. | Benchy_fortified-pla 1, Benchy_fortified 1, Benchy_renforced_level1 1, Benchy_renforced_level2 1, Benchy_renforced_level3 1, Benchy_renforced_level4 1, Benchy_renforced_level5-pla 1, Benchy_renforced_level5 1, Benchy_speedy_default_settings-pla 1, Benchy_speedy_default_settings 1, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 1 |
| C13 | — | info | Verdict derived from observed deposition (plastic `E` > 0 and/or fibre `U` > 0) plus the `T0`/`T1` counts, then cross-checked against the `; PRINTING_MODE:` header. A header that contradicts observed deposition is a warning, except `Composite Only` with plastic present, which is the documented wet-out/tool-change quirk and is reported as info. | Benchy_fortified-pla 1, Benchy_fortified 2, Benchy_renforced_level1 1, Benchy_renforced_level2 1, Benchy_renforced_level3 1, Benchy_renforced_level4 1, Benchy_renforced_level5-pla 1, Benchy_renforced_level5 1, Benchy_speedy_default_settings-pla 1, Benchy_speedy_default_settings 1, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 1 |
| C14 | — | info | Fibre is reported in three separated quantities: fed = every positive `U` word; deposited = positive `U` on a move with XY motion; restart = positive `U` with no XY motion (the `G1 F1200 U55 ; Extrude restart` air prime). Cuts = `M2800` count, with the `;CUT DISTANCE` sum and the constant tail length. Deposited is cross-checked against the `MATERIAL_PRINT_DATA` tow `Length` (agrees to 6 significant digits corpus-wide) and the cut count against the `M1001` segment count. | Benchy_fortified-pla 1, Benchy_fortified 2, Benchy_renforced_level1 2, Benchy_renforced_level2 2, Benchy_renforced_level3 2, Benchy_renforced_level4 2, Benchy_renforced_level5-pla 2, Benchy_renforced_level5 2, Benchy_speedy_default_settings-pla 1, Benchy_speedy_default_settings 1, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 1 |
| C15 | — | info | Each flag in `Dialect.MACHINE_FLAGS` (homing G28, bed mesh/auto-leveling, Z probe & Z-offset, AI/spaghetti detection, filament runout/motion sensor, resonance/input shaper, power-loss recovery, crash detection, pause/cancel-on-failure) is searched for in the *command* text of every non-comment line, never in a comment, so a header echo can never count as presence. Absence is reported explicitly with the list of what was not found. | Benchy_fortified-pla 1, Benchy_fortified 1, Benchy_renforced_level1 1, Benchy_renforced_level2 1, Benchy_renforced_level3 1, Benchy_renforced_level4 1, Benchy_renforced_level5-pla 1, Benchy_renforced_level5 1, Benchy_speedy_default_settings-pla 1, Benchy_speedy_default_settings 1, Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m 1 |

## Observed magnitudes across the corpus

| Rule | Issue | Total findings | Critical | Worst observed | Files hit |
|---|---|---:|---:|---|---:|
| C01 | #1 | 119 | 5 | 52.40 | 8/11 |
| C02 | #2 | 10 | 8 | 124.00 | 10/11 |
| C03 | #3 | 1,153 | 451 | 1.60 | 11/11 |
| C04 | #4 | 10 | 0 | 19.20 | 10/11 |
| C05 | #5 | 938 | 169 | 8.58 | 11/11 |
| C06 | #6 | 711 | 205 | 1,324.49 | 8/11 |
| C07 | #8 | 32 | 0 | — | 11/11 |
| C08 | #9 | 7 | 7 | — | 7/11 |
| C09 | #11 | 2 | 0 | — | 2/11 |
| C10 | #29 | 1 | 1 | 9,418.00 | 1/11 |
| C11 | — | 1 | 0 | — | 1/11 |
| C12 | — | 11 | 0 | — | 11/11 |
| C13 | — | 12 | 0 | — | 11/11 |
| C14 | — | 18 | 0 | 78.91 | 11/11 |
| C15 | — | 11 | 0 | — | 11/11 |

## Print contract — the four questions asked of every file

Rules **C12–C15** answer the owner's four questions (2026-10-03). They are
report rules, not defect rules: they always emit at least one `info` line per
file so the answer is never silently absent.

| File | Mode (header) | Tool configuration (observed) | Carbon on L1 | Fibre fed | Fibre in part | Cuts | Flags |
|---|---|---|---|---:|---:|---:|---|
| Benchy_fortified-pla | Plastic Only | plastic-only | none | 0.00 m | 0.00 m | 0 | none |
| Benchy_fortified | Composite Only | dual | ok (fortified) | 78.91 m | 63.51 m | 280 | none |
| Benchy_renforced_level1 | Plastic and Composite | dual | ok (priming only) | 6.73 m | 4.69 m | 37 | none |
| Benchy_renforced_level2 | Plastic and Composite | dual | ok (priming only) | 6.72 m | 4.69 m | 37 | none |
| Benchy_renforced_level3 | Plastic and Composite | dual | ok (priming only) | 7.17 m | 4.86 m | 42 | none |
| Benchy_renforced_level4 | Plastic and Composite | dual | ok (priming only) | 13.59 m | 8.09 m | 100 | none |
| Benchy_renforced_level5-pla | Plastic and Composite | dual | ok (priming only) | 4.11 m | 2.07 m | 37 | none |
| Benchy_renforced_level5 | Plastic and Composite | dual | ok (priming only) | 15.94 m | 10.16 m | 105 | none |
| Benchy_speedy_default_settings-pla | Plastic Only | plastic-only | none | 0.00 m | 0.00 m | 0 | none |
| Benchy_speedy_default_settings | Plastic Only | plastic-only | none | 0.00 m | 0.00 m | 0 | none |
| Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m | Plastic Only | plastic-only | none | 0.00 m | 0.00 m | 0 | none |

**1. Carbon on layer 1 (C12).** No file in the corpus violates the rule. The only
print that lays fibre into part geometry on layer 1 is `Benchy_fortified.gcode`, which
is fortified — `CurrentSliceType=2` plus `MustGenerateFiberPerimeters=true` — so the
fibre *is* the part's skin and must start at the bed. Every reinforced-level sample
puts ~25 mm of fibre on layer 1 inside the `Priming line` section only: that is the
documented head-loading pass, on the bed but not part of the part, so it is reported
as `sacrificial-only` rather than a violation. Note `Benchy_renforced_level5-pla.gcode`:
its profile carries `MustGenerateFiberPerimeters=true`, but it deposits no structural
fibre on layer 1, so the verdict is `sacrificial-only` and not "fortified fibre" — the
engine reports what was laid down, not what the profile was configured to allow. The
violation branch is exercised by
`Tools/gcode-inspector/src/fixtures/synthetic_c12_c15.gcode`, because no real slice
in this corpus produces one.

**2. Tool configuration (C13).** The verdict is derived from *observed deposition*
(which extrusion axis actually moved) and the `T0`/`T1` counts, then cross-checked
against the `; PRINTING_MODE:` header — because the header alone is wrong in both
directions. `Benchy_fortified.gcode` declares `Composite Only` yet issues 136 `T1`
changes and deposits 2.87 m of plastic: the fibre wet-out matrix and the tool-change
dance still drive the plastic tool. That is a documented dialect quirk, reported as
info, not a contradiction warning.

**3. Fibre used and cuts (C14).** Fibre is reported in three separated quantities,
because "total length of fibre used" has two honest answers:

- **fed** — every positive `U` word: what left the spool.
- **deposited** — positive `U` on a move with XY motion: what landed in the part.
- **restart** — positive `U` with no XY motion, i.e. `G1 F1200 U55 ; Extrude restart`.
  Air prime that pushes the 54.8 mm post-cut tail through the head before deposition
  resumes. Real consumption, zero deposition: 20 % of `fortified`, 36 % of `level5`.

`deposited` reconciles with the slicer's own `MATERIAL_PRINT_DATA` tow `Length` to 6
significant digits on every fibre file (fortified: 63.510473 m measured vs
63.510474 m declared), which is what makes the fed−deposited split trustworthy rather
than a parse artefact. Cuts are `M2800` blade fires, one per fibre segment; the count
equals the `M1001` window count on every real file, and the tail is the constant
54.8 mm everywhere. Cuts were previously only inferable from the raw `M1001` count and
are now reported directly.

**4. Machine flags (C15).** **All 11 real files are silent on every one of the 9
recognised assist commands** — no `G28`, no `G29`/`BED_MESH_CALIBRATE`, no probe or
Z-offset verb, no AI/spaghetti-detection macro, no filament-runout enable, no
resonance/input-shaper calibration, no power-loss hook, no crash detection, no
pause/cancel-on-failure hook. Flags are matched only in the *command* text of
non-comment lines, so a header echo can never register as presence. Absence here means
"this file does not request it", **not** "the machine lacks it": homing and meshing
normally run before the print starts, and none of these features is exported as a
SESSION setting at all — the exported profile vocabulary is slicing geometry and
motion only. The `present` branch is exercised by the synthetic fixture.

## Punted issues (not covered, with reason)

These open/closed issues are **not** adjudicated by the tool. Each is listed with a
verdict so the tracker owner can revisit if the reporter adds a G-code artifact.

| Issue | Title | Verdict | Reason |
|---|---|---|---|
| [#25](https://github.com/3ricj/FibreSeeker3/issues/25) | Documentation improvement | out-of-scope: not file-related | Asks for clearer bed-leveling / first-layer-troubleshooting documentation and companion videos. No G-code artifact to inspect. |
| [#26](https://github.com/3ricj/FibreSeeker3/issues/26) | No cleaning of the left head during prints | out-of-scope: firmware/config, not sliced output | Closed. The defect and its fix live in Klipper tool_switch.cfg / cleaning-station macros, not in the emitted G-code. The tool inspects sliced files, not printer firmware config. |
| [#7](https://github.com/3ricj/FibreSeeker3/issues/7) | Fan schedule not machine-readable | closed; partially observed by C09 | Closed. The per-layer fan plan living only in the header echo is observable (SET_FAN_AT_LAYER is flagged as an undefined verb by C09), but the issue is a slicer feature request, not a defect the tool adjudicates. |

## Issue accounting

Every issue number appears exactly once across the two tables above.

- **Covered by a rule:** #1, #2, #3, #4, #5, #6, #8, #9, #11, #29
- **Punted:** #25, #26, #7
- **Union (issues accounted for):** #1, #2, #3, #4, #5, #6, #7, #8, #9, #11, #25, #26, #29

Issue #10 (chamber-temp reading `toolhead_temp`) is folded into rule **C09**, which
flags the start-gcode reference; it is not given its own rule because it is a one-line
header-text check, not a separate analysis pass.

## Parse / geometry sanity

Files with C11 parse/geometry findings:
- Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode — 1 finding(s)

## Definitional notes (where the tool intentionally differs from a report)

- **C01 population.** Issue #1 counts *relocation events* (one per travel block); the
  engine counts *individual `G0` travel lines*, and Rocket Slicer emits ~17 `G0` lines
  per relocation (a two-segment Z-hop path plus intermediate moves). The engine's
  **worst-case** distances and line numbers match issue #1 exactly (L1 51.7 mm @589,
  L2 52.4 @635, L3 51.9 @606, L4 51.7 @602, L5 51.8 @615; `fortified` fully mitigated),
  confirming the same physical moves are found. Only the per-file tally differs, by
  definition, not by detection.
- **C05 floor when the profile is silent.** `Benchy_fortified.gcode` exports
  `MinLayerTimeForSlowing=0`. A 0 floor does not license a 0.3 s layer — it means the
  slowdown pass was disabled — so the tool falls back to `LayerTimeForMaxCooling`,
  then a 5 s floor, and says which rule fired in the finding evidence.
- **C03 gap ceiling.** Enclosed voids wider than 4 mm are treated as designed geometry
  (the Benchy cabin, the mast channel), not a bead that failed to close, so the tool
  reports the 0.6–1.6 mm splits that match issue #3's "0.9–2.8 mm void" band rather
  than the part's intentional openings.
- **C06 support window.** Issue #6 reports 16 findings at 16.2–64.8 mm. A naive
  "is the layer directly below empty?" probe reports 3,025 findings on this corpus, of
  which only 4.5 % land in a section the slicer itself labels `BRIDGE`/`OVERHANG` —
  rotating-infill phase and top-skin-over-sparse-infill both look unsupported to it.
  Support is therefore modelled by *age*: a point is supported if plastic was deposited
  in that column within the last `supportDepth` layers, excluding the layer being
  printed. Sweeping the window against the slicer's own feature labels (independent
  ground truth) gives 2 layers at 76.7 % agreement / 116 findings versus 1 layer at
  4.5 % / 3,025 and 3 layers at 6.9 % / 29. The tool reports 116 findings spanning
  16.0-41.5 mm (median 22.1 mm), the same floor and band as the issue, counted per
  printed run rather than per reported row.
- **C06 calibration set.** Issue #6 is a Benchy-band report (16 findings, 16.2–64.8 mm),
  and the C06 `supportDepth`/`supportRadius` constants were swept against the Benchy
  fixtures. The corpus has since grown a non-Benchy part — the 60 MB Tinmorry sample
  added for #29 — whose large organic-support geometry produces 451 findings on a
  single layer, the longest 1324 mm, all inside `TOP` skin over sparse infill. That is
  the known top-skin-over-infill artefact at scale, not a new defect, and the
  Benchy-derived bounds do not transfer to it. The `selftest.js` guard is therefore
  scoped to the `Benchy_*` calibration set and the outlier count is pinned separately,
  so re-tuning C06 for large parts is a visible, deliberate change rather than a
  silent one. **Open item: C06 is uncalibrated for non-Benchy geometry.**

