# Troubleshooting Print Quality

This page maps visible print defects to the Rocket Slicer settings most likely to cause them: first fibre defects (fibre not laid, breaking, wrong cuts, poor adhesion, corners, restart blobs), then plastic defects (extrusion, walls, seams, gaps, skins, adhesion and support). Each row says which way to move the setting and how well the link is established; where an official FibreSeek wiki page has the hands-on procedure, it is linked. Work through [Troubleshooting slicer messages](Troubleshooting-Slicer-Messages.md) (diagnostic order) and [Troubleshooting silent behaviours](Troubleshooting-Silent-Behaviours.md) first: many "quality" problems are edits that never reached the G-code.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

**How to read the tables.** Settings are given as UI label (`SettingKey`). ↑ means raise, ↓ means lower. Change one setting at a time and reslice. Factory values are from the group "PETG 0.2 mm | CFC PETG+X-CCF / PETG" unless stated; S / R / F = Speedy / Reinforced / Fortified. Factory templates are view-only: duplicate the group and edit the copy. Prefer *Behaviour analysis* rows over *FFF practice* rows. None of these fixes has yet been confirmed on physical prints.

## Fibre print-quality symptoms

**Fibre defects mostly come from strand geometry (corners, short strands, strand starts and ends), not from the bead itself.** The fibre-basics fields are expert-only: turn expert mode on. Contact radius is shown only in Reinforced. "Composite ›" is the Composite dialog; "ExtruderC" is Printer › Extruders (CFC). See [Settings: fibre](Settings-Fibre.md) and [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md) for the strand life cycle.

### Fibre not laid, breaking or cut wrongly

| Symptom | Likely settings (UI label, key) | Direction | Evidence |
|---|---|---|---|
| **Fibre not laid** where expected (the preview shows it, the print doesn't) | The strand start is not anchoring: Restart pause (`ZHopFPauseAdhesion`, factory 0 s, built-in default 1 s); Max. starting speed (`FiberStartMaxSpeed`, 3–5 mm/s); Start length (`FiberStartLength`) | Pause ↑ (e.g. 0.5–1 s); start speed ↓; start length ↑. Procedure: [Missing fibre](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/fibre-missing) | Behaviour analysis (mechanism); Inferred (effect) |
| Fibre not laid: the tow does not reach the nozzle after a cut | Fiber restart length (`FiberRestartLength`, 55 mm, fed at the start of every strand) and Cut distance (`CutDistance`, 58 mm) are hardware values | Do not change them without FibreSeek guidance; check the tow path and cutter. Official clog procedure (in short): check the spool for breaks or a gritty feel, heat the composite nozzle, extrude 50 mm at about 250 °C, check the rubber feed rollers for wear, clear fibre debris from the tension sensor, then run Fiber Extrusion Calibration. Full steps: [Fibre unclogging in composite hotend](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/fibre-unclogging) | Behaviour analysis + Inferred; Official |
| Fibre not laid: the preview is also empty | Short strands, small features, thin walls or Fortified dropping features | See [Troubleshooting silent behaviours](Troubleshooting-Silent-Behaviours.md) | Behaviour analysis |
| **Fibre breaks** or pulls off on curves | Tension fiber feedrate (`FiberTensionFeedrate`, 50 %; PA/PPS 20 %): too low = high tension. Fiber feedrate (`InsetXFExtrusionFPercent`, `InfillF…ExtrusionFPercent`, 100 %): below 100 tightens the tow | Tension feedrate ↑; fibre feedrate toward 100–105 % | Behaviour analysis (mechanism); Inferred (effect) |
| Fibre breaks at sharp corners | Min. normal speed limit (`FiberNormalMinLimitSpeed`, 2–3 mm/s), Min. arc radius (`FiberMinRadius`, 10–12 mm), Slowing length (`FiberSlowLength`, 5–10 mm) | Speed floor ↓, Slowing length ↑; round corners in CAD to R ≥ Min. arc radius | Behaviour analysis + Inferred |
| Fibre breaks: no obvious slicer cause | Wet or damaged tow, a tight spool, burrs in the tow path; worn or misaligned feed rollers; fibre debris on the tension sensor | Dry and inspect. See [Fibre unclogging in composite hotend](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/fibre-unclogging) and the roller-replacement guides under [Repair and replace](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3) | FFF practice; Official |
| **Cut in the wrong place**: an un-reinforced tail or an overrun at strand ends | Cut distance (`CutDistance`, 58 mm) must match the hardware; the `;CUT DISTANCE 54.8` comment in the file is fixed text and is not used. Real 1.3.1 strands lay 55.6 mm after the cut = 58 − 2 × 1.2 mm contact radius. Extended contact radius (`NozzleContactRadiusExtended`) shifts the cut point | Confirm the hardware value with FibreSeek; change the contact radius only with care | Behaviour analysis; G-code (1.3.1); Inferred (which radius places the cut) |
| Strand ends lift or curl | Plastic flow multiplier after cut (`FiberAfterCutExtrusionMultP`, 0.65–0.72); Max. / Min. ending speed (`FiberFinish…Speed`); Finish ironing distance (`FinishIroningDistance`, 8 mm); Do Z-hop after cut (experimental) | After-cut flow ↑; ending speed ↓; ironing distance ↑. Procedure: [Fibre splaying and protrusion](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/fiber-protrude) | Behaviour analysis (fields); Inferred (effect; where the after-cut flow is applied is not established) |

### Adhesion, corners, seams and bead fill

| Symptom | Likely settings (UI label, key) | Direction | Evidence |
|---|---|---|---|
| **Poor adhesion** of fibre to the layer below | Macrolayer height (`MacroLayerHeight`) vs tow (0.24 / 0.30 mm for 0.25 / 0.35 mm tow); Composite › Extruder temperature; Composite › Plastic flow multiplier (`ExtrusionMultiplierP`, 0.8 X-CCF / 0.68 X-CGF) | Keep the factory macro height; matrix flow ↑ slightly; temperature ↑ within the material's range. Procedure: [Fibre layer defects](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/fibre-layer-defects) | Behaviour analysis (bead maths); Inferred; FFF practice (temperature) |
| Poor fibre adhesion on layer 1 | Flow multiplier (fibre first layer) (`FiberFLExtrusionMultP`, 1.05); Build plate temperature; Layer height (fibre first layer) (`FiberFLThicknessMM`) may be ignored in favour of a hidden fibre first-layer height that is not shown in the UI (default 0.3 mm; 0.24 mm in 1.3.1 exports) | Flow ↑; bed clean and at temperature; check the first-layer Z in the G-code | Behaviour analysis + Inferred; FFF practice (bed preparation) |
| Poor bond between fibre and plastic (Reinforced) | Printing order (`FiberPrintOrder`, Last in layer); Composite vs FFF temperatures; standby temperature too low | Keep the factory order; standby ↑ | Inferred; FFF practice |
| **Corners rounded or cut** | Contact radius (`NozzleContactRadius`, 0.4–0.7 mm, Reinforced only; the value Fortified uses is unknown) | Radius ↑. Procedure: [Carbon fibre path deviation](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/fiber-deviation) | Behaviour analysis + Inferred |
| Corners bulge or loop out | Contact radius (as above) | Radius ↓ | Behaviour analysis + Inferred |
| Sharp corners at strand ends where the model has fillets | After the cut, the last ≈ 55.6 mm of the strand is straightened, so small fillets become corners | Expected; move the strand start (seam) | Behaviour analysis |
| **Restart blobs** or bumps at strand starts | The 55 mm restart feed runs at Fiber extrusion speed (`ExtrusionSpeedF`; `G1 F1500 U55` on every strand in 1.3.1) from 1 mm above the part (`ZHopF`); the matrix unretract = total retract + extra length (1.3.1 CFC PETG: `V1`, or `V5` after a tool change; an extra length of −1 gives net 0) | Paint a fibre seam or use "Put fiber seam on longest straight edge end"; `ExtrusionSpeedF` ↓ | Behaviour analysis (sequence); Inferred (fix) |
| Visible radial seam on fibre loops | Loops of one contour are joined by short radial steps, plus the strand start | Seam painting ("Seam Fibers"); Adjust seam start position (fiber) | Behaviour analysis + Inferred |
| Composite bead under- or over-filled | Composite › Plastic flow multiplier; Plastic extrusion compensation ratio (composite head only); Extrusion width (`InsetXFEWMM`, 0.8 mm) vs macro height | Adjust one at a time, in small steps | Behaviour analysis (formula); Inferred (which ratio) |
| Fibre layers split or warp (Fortified) | Guide directions (`InfillFSolidAngleList`) "0" in 7 of 16 Fortified profiles: every solid fibre layer at 0° ([#47](https://github.com/3ricj/FibreSeeker3/issues/47)) | Set "0/90" or "0/60/-60". See also [Fibre layer defects](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/fibre-layer-defects) | Behaviour analysis + Inferred; G-code (1.4.0, all at 0°) |
| Infill stops short of the walls (Reinforced Solid) | Infill extension into perimeters (`InfillFSolidExtendIntoPerimeters`, −0.3 mm) | Toward 0 | Inferred (sign) |

## Plastic print-quality symptoms

**Plastic paths behave much like any FFF slicer, with three differences:** widths are absolute millimetres, walls are fed as rectangle volume, and several retraction features are inert. These rows apply in Speedy and Reinforced; Fortified has no plastic head in 1.4.0. See [Plastic paths](Plastic-Paths.md) and [Settings: plastic infill and features](Settings-Plastic-Infill-and-Features.md).

### Extrusion, walls and seams

| Symptom | Likely settings (UI label, key) | Direction | Evidence |
|---|---|---|---|
| Over-extrusion on walls | Flow multiplier (outer wall) (`Inset0ExtrusionMultP`), Flow multiplier (plastic perimeters) (`InsetXPExtrusionMultP`); walls are fed ≈ 12 % more than their line spacing | Per-entity multiplier ↓ | Behaviour analysis + Inferred |
| Over- or under-extrusion everywhere | Plastic › Flow multiplier (`ExtrusionMultiplierP`, 1) | Material-wide ↑ / ↓. If under-extrusion persists, check for a clog: [Plastic hotend unclogging](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/plastic-hotend-unclogging) | Behaviour analysis |
| Under-extrusion at high speed | 1.4.0: the 25 mm³/s cap already limits speed (58 % of moves are at the cap in the 1.4.0 Plastic Only test file); if the hot end cannot sustain that, slow the entity. 1.3.1 has no cap ([#4](https://github.com/3ricj/FibreSeeker3/issues/4)) | Entity speed ↓ | Behaviour analysis; G-code (cap); FFF practice (hot-end limit) |
| Wrong line width after a nozzle change | Widths are absolute (`…EWMM`), not relative to the nozzle | Edit every width | Behaviour analysis |
| First layer too thin or too fat | Flow multiplier (first layer) (`BottomMostSkinExtrusionMultP`, 1.1 in R); First layer height (`FLThickness`) is replaced by the fibre first-layer height in R/F; walls and infill on layer 0 run at a hidden first-layer speed not shown in the UI (100 mm/s in R) | Flow ↑ / ↓; Printing speed (first layer) (`BottomMostSkinSpeed`) ↓ | Behaviour analysis |
| Part dimensionally off; holes too small for a pin (raised in the comments of [#30](https://github.com/3ricj/FibreSeeker3/issues/30)) | Outer contour expansion (`OuterContourExpansion`), Holes expansion (`HolesExpansion`): Rocket Slicer's equivalent of other slicers' "X-Y hole compensation" | ± as measured, **but in 1.4.0 these two probably have no effect** *(inferred)*. Test first (slice at 0 and +0.3 mm and compare the G-code); otherwise enlarge the holes in CAD. See also [Non-circular holes](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/non-circular-holes) | Behaviour analysis + Inferred |
| **Stringing** | Plastic › Retract length (`RetractionLengthOnTravel`, 0.3–1 mm), Retract speed; Retract min travel inside part (`RetractMinimumTravelNoCrossing`); Avoid crossing borders (`DoAvoidCrossingPerimeters`); Do retract only when crossing borders (on = long unretracted internal travels, [#1](https://github.com/3ricj/FibreSeeker3/issues/1)); Do wipe nozzle (1.4.0: may replace retracts with `G1 E0`); temperature | Retract ↑ slightly; crossing-only off; wipe off; temperature ↓ | Behaviour analysis (logic); G-code; FFF practice (amounts) |
| Ooze from the standby head (Reinforced) | Extruder standby temperature (`TemperatureWait`, 100–150 °C); Retract length on tool change (5 mm) | Standby ↓ (costs reheat time, see [Print time](Print-Time.md)) | Behaviour analysis (mechanism); FFF practice |
| **Seam blobs** | Perimeter trim ratio (`TrimGapRatio`, 0; PLA and Reinforced PA CF 1); Do coast / Do wipe are inert until Plastic › Coast length / Wipe nozzle length > 0 | Trim ratio ↑ (0.1–0.5); set coast / wipe lengths | Behaviour analysis |
| Seam in a bad place or stacked in one line ([#2](https://github.com/3ricj/FibreSeeker3/issues/2)) | Seam painting ("Seam Plastics"); Adjust seam start position (plastic) (`EnableAdjustSeamStartPositionPlastic`); seam distribution (off in the real files) | Paint, or enable and set an offset or distribution | Behaviour analysis; G-code |
| Rough outer surface | Printing speed (outer wall) (`Inset0Speed`, 200 mm/s; the sidebar speed does not change it); Outer wall layer height | Speed ↓; divisor ↑. Procedures: [Improving shell quality](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/poor-shell-quality); for faceting, [Visible STL triangles](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/stl-triangle) | Behaviour analysis; FFF practice |

### Gaps, skins, adhesion and support

| Symptom | Likely settings (UI label, key) | Direction | Evidence |
|---|---|---|---|
| **Gaps between walls and infill / skin** ([#3](https://github.com/3ricj/FibreSeeker3/issues/3)) | Infill/Wall overlap (`…InfillExtendIntoPerimeterRatio`; Speedy PLA 0.25 top intermediate −0.4); in 1.3.1, no variable-width gap infill | Toward 0–0.1; use 1.4.0 with gap infill on | Behaviour analysis (value); Inferred (effect) |
| Thin gaps left empty | Enable gap infill (`GapFillEnabled`); gaps under 12 % of the line spacing are never filled; Gap fill flow ratio (`GapFillFlowRatio`) | Keep it on; flow ↑ | Behaviour analysis |
| Pillowing or holes in the top surface | Top solid (`InfillSTopLayerCount`); Flow multiplier (top intermediate) (`TopIntermediateSkinExtrusionMultP`, R 0.6–0.7); over a bridged roof in 1.4.0, the solid layers between bridge and top may be missing ([#30](https://github.com/3ricj/FibreSeeker3/issues/30)) | Layers ↑; flow ↑; inspect the preview | Behaviour analysis (values); G-code (1.4.0); FFF practice |
| Grid infill all in one direction | Fill angle offset (sparse) (`InfillPCellularFillAngleStep`; Speedy PET GF 0.25 = 0) | Set 90 | Behaviour analysis |
| **Warping / lifting** | Build plate temperature (keep both materials equal); Generate brim (`GenerateBrim`, off; there is no raft); cooling table "Auxiliary cooling fan" (`M106 P3`, 50–100 % from layer 2–5 in R/F; it also switches the chamber heater off and opens the louvres, per the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35)); part fan; no adhesive on the bed | Brim on; aux fan ↓ for PA / PPS; part fan ↓; adhesive on the bed | Behaviour analysis (fields); Official; FFF practice (effect) |
| Poor first-layer adhesion | Bed temperature (the first-layer value is not waited for in 1.3.1, [#44](https://github.com/3ricj/FibreSeeker3/issues/44)); first-layer flow and speed above; Z offset is set on the printer (firmware 2.2.42 ignores Z-offset changes under 0.03 mm) | As above; enable auto bed levelling; level the bed hot (PLA 55 °C, PETG 75 °C); if gaps persist, the official guide points to the piezo sensor. Procedure: [First print failure](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/first-layer-print-failure) | FFF practice; Official |
| Small layers overheat or sag | Layer time for max fan speed (`LayerTimeForMaxCooling`) and Minimum layer print time act independently | Cooling ↑, or more parts per plate | Behaviour analysis + Inferred |
| **Support too hard to remove** | Top Z distance (0.2 mm), XY distance (0.4 mm), support interface density | Z distance ↑ | Behaviour analysis (fields); FFF practice |
| Support where none is wanted | Enable support (on in R); Build plate only (shown inverted); Threshold angle (`SupportThresholdAngleDegree`, 30°) | Off; turn Build plate only on; angle ↓ | Behaviour analysis |
| No support where needed | Threshold angle; Remove small overhangs (on); support enforcer mask | Angle ↑; add an enforcer | Behaviour analysis |
| Overhang walls droop | Slow down at overhang; 50 % overhang speed (`Percent50OverhangSpeed`); there is no bridge fan setting | Speed ↓; Bridge flow ↓ | Behaviour analysis |

Layer shifts between the plastic and fibre heads are a machine issue, not a slicer one: see [Printer error codes](Printer-Error-Codes.md) (machine-side checks) and the official [Layer shifting](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/layer-shifting) guide.

## See also

- [Troubleshooting silent behaviours](Troubleshooting-Silent-Behaviours.md)
- [Troubleshooting slicer messages](Troubleshooting-Slicer-Messages.md)
- [Settings: fibre](Settings-Fibre.md)
- [Plastic paths](Plastic-Paths.md)
- [Printer error codes](Printer-Error-Codes.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
