# G code Structure and Fibre Strands

This page describes the G-code Rocket Slicer writes for the FibreSeeker 3: the Klipper dialect and number formats, the order of the header, start block, per-layer content, end block and trailer, and exactly how every fibre strand is framed (approach, restart feed, cut, finish, ironing tail) including what `M1001 L` really means. Use it to read or debug an exported `.gcode`. For a command-by-command reference, see the companion [GCODE_REFERENCE.md](https://github.com/3ricj/FibreSeeker3/blob/main/GCODE_REFERENCE.md) in the repo.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## G-code structure

**Flavour: Klipper, with FibreSeek additions.** The printer's Postprocessor type (`PostprocessorType`) is 3 = SK3, a FibreSeek variant of the slicer's Klipper output. Compared with plain Klipper output it adds the tool-change brush sequence, a `P` word on composite moves, a thumbnail placeholder and layer-count reporting, and it drops `G28`. *Behaviour analysis*, consistent with every test file.

Evidence on this page comes from the repo's [Test_files](https://github.com/3ricj/FibreSeeker3/tree/main/Test_files) (ten Benchys from 1.3.1.480 and one Plastic Only job from 1.4.0.857) plus a factory-profile 1.4.0.857 Fortified Benchy. No 1.4.0 Reinforced file has been checked, so fibre details marked 1.3.1 may differ in 1.4.0.

### Dialect

| Item | Output | Evidence |
|---|---|---|
| Units, positioning | `G21`, `G90` | G-code |
| Extrusion | Relative (`M83`); `G92` resets are therefore never written by the slicer | G-code |
| Plastic move | `G1 X Y [Z] E F`; arcs `G2`/`G3` are possible on the FFF head only (0 in all 11 test files: arc fitting off) | G-code |
| Composite move | `G1 X Y [Z] V<matrix> U<fibre> P<V÷U> F`. `V` and `U` appear only when non-zero; `P` only when both are. No `E` under T0, no `U`/`V` under T1 | G-code, 1.3.1 |
| Travel | `G0`, with Z only when it changes; Z-only moves at **F600** (10 mm/s, the effective Z travel speed) | G-code |
| Number formats | XYZ to 3 decimal places; E/U/V to 5; F = mm/s × 60, written only when it changes. Integral values lose their decimals (`X172`, `Z10`, `U55`, `V5`) | G-code |
| Decimal separator | Commands always use `.` in 1.4.0. Comments (`; LAYER:` Z, `; SEAM … at X Y Z`, header date) follow the PC's locale, e.g. `[0,2]` on a German-locale PC ([#46](https://github.com/3ricj/FibreSeeker3/issues/46)). 1.3.x also wrote comma decimals into **commands** on such PCs, which the printer rejects (error 10057; see [Printer error codes](Printer-Error-Codes.md)) | G-code, 1.4.0 |

- The firmware meaning of the `P` ratio is unknown *(Inferred: a feed-sync hint)*.
- Stock Klipper reads V and U only if they are registered as extra axes, so the vendor firmware must map them *(Inferred)*. The community's config notes ([HardwareInfo.md](https://github.com/3ricj/FibreSeeker3/blob/main/Exploration/HardwareInfo.md)) describe U as the fibre-feed channel (`extruder2`) and V as the matrix drive (`extruder`), switched by a firmware extruder-mode command.

### File layout

| Part | Content, in order |
|---|---|
| Header | `; Generated with FibreSeek Rocket Slicer v…`, `; Printer Processor Type:`, `; LAYER_COUNT:`, `; PRINTING_MODE:` (Plastic Only / Plastic and Composite / Composite Only). **No time or material usage.** In 1.4.0, line 1 is `; PREVIEW_CONTEXT: {…}` and the header follows on lines 2–5 |
| Start | `SET_PRINT_STATS_INFO TOTAL_LAYER=n`; profile Start G-code; `M104` first head and `M140` (no wait), then `M141 S0`; `G21 G90 M83`; printer Start G-code (`G92 E0`, `G0 Z10 F900`); `M190`, then `M191 S0`; initial select: standby `M104` for the other head, `M109`, `T<n> R`, three brush macros. First tool is T0 if the job has any fibre. The start waits on the regular bed value; a different first-layer bed value is set at layer 1 without a wait (1.3.1 PLA) |
| Each layer | `M104`/`M140` on change; `; MACROLAYER:<k> [Z]` (macro layers; 1.3.1 omits it for macro 1), `; LAYER:<n> [Z]`, `; TIME LEFT: <s> S` (1.3.1 only), `SET_PRINT_STATS_INFO CURRENT_LAYER=n`, then the fan-table `M106 P3/P5` (after the markers, not before); skirt/brim (first layer), wipe tower, supports; per head a tool change if needed, then per entity a comment (e.g. `; Inset XF start`), fan update, `M204`, moves. 1.4.0 adds `; LINE_WIDTH:` / `; ENTITY_LINE_HEIGHT:` comments |
| End | Retract (only if the last head is FFF; it uses the tool-change retract length, `E-5` PETG / `E-10` PLA); `M400`; `M104 S0` per head; last fan off (`M106 P1 S0`); profile End G-code (empty); `M140 S0`; `M141 S0`; printer End G-code (`M400`, `G90`). No `M84`, no park, auxiliary and exhaust fans left on |
| Trailer | `; SESSION:` (JSON of **every effective setting**), `; PRINTINFO:` (time, per-head material and cost, model info), `; MATERIAL_PRINT_DATA:`, `; ENTITY_PRINT_DATA:`, thumbnail. 1.4.0 adds `; PREVIEW_LAYER_TIMES:` (per-layer times, before SESSION) and `; GENERATION_SUMMARY:` (after ENTITY) |

The layout is *G-code*-confirmed in 1.3.1 and 1.4.0 except where a version is named. Where each custom G-code field lands is detailed in [Custom G-code and export](Custom-G-code-and-Export.md); temperature and fan commands in [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md).

**`LAYER_COUNT` can be wrong; `TOTAL_LAYER` is right.** In 1.4.0 the header count can differ from the printed layers: 303 vs 155 `; LAYER:` markers in a Plastic Only file; 167 vs 140 in a Fortified Benchy, where the 27 extra correspond to the empty Z 25.35 → 31.83 mm gap *(Inferred)*. See [#38](https://github.com/3ricj/FibreSeeker3/issues/38) and [Known bugs](Known-Bugs.md).

**Layer numbering.** `n` counts every printed micro layer, starting at 1. It is the number the profile's Cooling fan table (`LayersAndFanSpeedsArray`) matches, not a count of fibre layers. With an Outer wall divisor of 2 there are two output layers per macro layer. See [How the slicer works](How-the-Slicer-Works.md) for macro and micro layers.

**A shared `.gcode` carries its full settings in `; SESSION:`** — read it first when troubleshooting someone else's print.

## Fibre strands, cut and restart

**Every fibre path, perimeter or infill, is framed and emitted the same way**, with each marker exactly once per strand (*G-code*, 1.3.1, 638 strands):

```
; Debug: MovePolygon starts          (always emitted, despite the name)
G0 … Z<z+1>                          approach point, 1 mm back and up
M1001 L<tow budget mm>               strand start: floor(55 + fed length before the cut)
G1 F1500 U55 ; Extrude restart       tow-only restart feed, on every strand including the first
G0 … Z<z>                            diagonal descent onto the start
G1 F600 V… ; Extrude restart         matrix unretract (V1 in a visit, V5 after a change in 1.3.1 PETG)
G4 P0                                restart pause (factory 0 s)
G1 X Y V U P F …                     start phase, then normal phase
; Start to cut
M2800 / M400 / ;CUT DISTANCE 54.8    Cut G-code (CutCode), written verbatim
G1 X Y V P F …                       finish phase on cut tow: 55.6 mm, V only, no U
; Cutting completed.
G1 F… V-1 ; Retract                  matrix retract
G0 …                                 ironing tail (factory 8 mm; 6.8–9.2 mm observed), no extrusion
M1002                                strand end
```

### What each part means

- **`M1001 L` is a tow budget, not the strand length.** It equals floor(restart 55 mm + XY length of the `U`-feeding moves before the cut) on 638 of 638 test strands (18 of them within 0.06 mm of coordinate rounding). It leaves out the ≈ 55.6 mm laid after the cut. *G-code*, 1.3.1.
  - Firmware 2.2.42.831 has no handler for `M1001`/`M1002`: Klipper logs "Unknown command" at INFO level and carries on, so the budget currently does nothing ([#9](https://github.com/3ricj/FibreSeeker3/issues/9); the manufacturer says it is investigating). A future firmware could use L, for example for a tow-runout check.
- **Cut position.** The finish phase after `M2800` is 55.6 mm of path on 611 of 638 strands (the rest 55.7–56.5 mm), i.e. Cut distance 58 − 2 × contact radius 1.2 mm. *G-code*, 1.3.1.
- **The restart tow is laid, not lost** *(Inferred)*: the 55 mm pushed in at the restart refills the cutter-to-nozzle path and becomes the post-cut tail of the strand. It is still drawn from the spool, but the reported fibre length leaves it out (see [costs](Factory-Materials-and-Profiles.md) and [#39](https://github.com/3ricj/FibreSeeker3/issues/39)).
- **Matrix unretract** = total retract + the composite's extra unretract length: 0 extra in 1.3.1 CFC PETG (so `V1`/`V5`), −1 in 1.3.1 CFC PLA and in 1.4.0 CFC PETG. With −1 the in-visit unretract becomes the axis-less `G1 F600 ; Extrude restart` (*Behaviour analysis*; predicted, untested on 1.4.0 output).
- **Correction moves.** Inside a strand nearly every fibre `G1` is followed by a short `G0` (0.1–2.5 mm, no U/V) at fibre speed, often backwards or sideways at turns: 14–18 % of the nozzle path (*G-code*, 1.3.1). Klipper treats `G0` like `G1`, so the tow is dragged without feed. Their purpose is *(Inferred)* trajectory correction at corners.
- **"; Extrude restart" is on every unretract**, including plain FFF ones. Only a line with a `U` word is a fibre restart.
- **Tension has no command.** It is shaped only by the `U` amount on short sub-segments: with Tension length 2 mm at 50 %, a strand that gets a tension segment feeds 1.0 mm less tow than its path (*G-code*, 1.3.1 PLA: 19 of 37 strands carry one 2 mm half-feed segment; the other 18 have none, mostly strands without a long straight). `M1001`/`M1002` probably let the firmware supervise feed or tension per strand *(Inferred)*.
- **`M2800` is the cutter macro.** `M400` waits for it. `U` is never negative.
- **Priming line.** On layer 0, when present, it is one strand wrapped in `; Priming line start` / `; Start priming` / `; End priming`.

  | File | Priming strand | SESSION `PrimingLineLength` |
  |---|---|---|
  | 1.3.1 Reinforced Benchys | Yes, `M1001 L80` | 90 |
  | 1.3.1 Fortified Benchy | None | – |
  | 1.4.0 Fortified Benchy | Yes, `M1001 L80`, 6 fibre moves | 0 |

  Whether 1.4.0 always generates one with factory `PrimingLine*` = 0 is open (see [Open questions](Open-Questions.md)).

When and why strands are cut, minimum strand lengths and the speed phases are in [How the slicer works](How-the-Slicer-Works.md) and [Fibre paths](Fibre-Paths.md). The firmware semantics of `M1001`, `M1002`, `M2800`, `T0 R`/`T1 R` and the `P` word are unknown; see [Open questions](Open-Questions.md).

## See also

- [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)
- [Custom G-code and export](Custom-G-code-and-Export.md)
- [Fibre paths](Fibre-Paths.md)
- [Known bugs](Known-Bugs.md)
- [Evidence and versions](Evidence-and-Versions.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
