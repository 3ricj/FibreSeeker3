# Known Bugs

This page is an index of known Rocket Slicer and FibreSeeker 3 bugs and community findings, grouped by area (Fortified, fibre, temperatures and fans, factory presets, G-code, user interface, firmware and app), each with its GitHub issue, current status and the workaround. It ends with a summary of what checking real exported G-code confirmed or contradicted. Details of each symptom are on the troubleshooting pages linked in the "See" column.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Issues are on the community tracker at https://github.com/3ricj/FibreSeeker3/issues. Issues [#38](https://github.com/3ricj/FibreSeeker3/issues/38)–[#48](https://github.com/3ricj/FibreSeeker3/issues/48) were filed on 19 Oct 2026 after re-checking each against the public test files and the 1.4.0.857 factory presets. Statuses are as of 20 Oct 2026; vendor replies are still awaited on #38 (regression), #47 (whether "0" is intended), #48 (fix) and #37 (whether the runtime install fixes the reporter's PC). Manufacturer statements quoted here have not been independently verified. Always check the slicer version on line 1 (line 2 in 1.4.0) of a G-code file before applying a 1.3.1 finding to 1.4.0 or the reverse.

## Fortified

| Issue | Subject | Status / workaround | See |
|---|---|---|---|
| [#38](https://github.com/3ricj/FibreSeeker3/issues/38) | 1.4.0 Fortified silently omits features fibre can't fill (thin walls, pillars, towers, pins, small holes and whatever sits on them); `LAYER_COUNT` header wrong; regression from 1.3.1, which filled such areas with FFF plastic as the official manual describes | Open, critical. Check the preview layer by layer; use Reinforced for parts with thin features, or thicken them *(inferred)*. A Z jump of more than one macro layer between `; LAYER:` markers, or `LAYER_COUNT` > `TOTAL_LAYER`, hints at dropped features | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| [#38](https://github.com/3ricj/FibreSeeker3/issues/38) (note) | 1.3.1 Fortified file says `Composite Only` and the save prompt asks only for CFC plastic, yet the file has 136 changes to `T1` (FFF head) | 1.3.1 only: load FFF plastic too, or check the file for `T1` lines. 1.4.0 Fortified uses no `T1` | [Slicer messages](Troubleshooting-Slicer-Messages.md) |
| [#47](https://github.com/3ricj/FibreSeeker3/issues/47) | Fortified "0" Guide directions (`InfillFSolidAngleList`) lay every fibre layer at 0° (7 of 16 Fortified profiles; also all Reinforced Solid profiles). Confirmed in 1.4.0: a cube had 84 of 84 fibre-infill layers at 0° | Open; intent unknown. Set "0/90" or "0/60/-60" in a copied profile, or match the load | [Print quality](Troubleshooting-Print-Quality.md) |

## Fibre

| Issue | Subject | Status / workaround | See |
|---|---|---|---|
| [#43](https://github.com/3ricj/FibreSeeker3/issues/43) | Reinforced fibre infill silently dropped on small parts: on a Benchy, factory Isogrid 10–20 % lays no fibre infill, 30 % lays 5 strands, 60–80 % lays 63–68 | Open. Raise Enhancement Magnitude to 60–80 %, or accept it; check the preview with "Show Fiber Only" | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| [#39](https://github.com/3ricj/FibreSeeker3/issues/39) | Reported fibre length, weight and cost exclude the 55 mm restart feed of every strand: real tow use is 1.24–1.98 × the reported figure (1.3.1 Benchys) | Open. Add 55 mm × the number of `M1001` lines to the reported length | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |

## Temperatures, chamber and fans

| Issue | Subject | Status / workaround | See |
|---|---|---|---|
| [#41](https://github.com/3ricj/FibreSeeker3/issues/41) | Tool-change preheat is issued at the change, seconds before `M109`, so the head heats while the printer waits; the waits are missing from the time estimate (each change charged ≈ 5–6 s against ≈ 18–41 s of real heating; Reinforced Benchys under-estimated by up to ≈ 14–31 %) | Open. Treat the estimate as a lower bound; add ≈ 45–60 s per macro layer in Reinforced | [Silent behaviours](Troubleshooting-Silent-Behaviours.md), [Print time](Print-Time.md) |
| [#44](https://github.com/3ricj/FibreSeeker3/issues/44) | First-layer bed temperature is set at layer 1 without a wait (the start waits only on the regular bed value) | Open. Set first-layer bed = regular bed, or add `M190 S<first-layer value>` to the printer Start G-code | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| [#35](https://github.com/3ricj/FibreSeeker3/issues/35) | Chamber exhaust and auxiliary fan behaviour: any `M106 P3` (aux fan, scheduled at 50–100 % from layer 2–5 in 28 of 30 factory R/F fan tables) switches the chamber heater off and opens the louvres; `M106 P3` / `P5` are never switched off at job end (the end code zeroes only `M106 P1`); every job sends `M141 S0` / `M191 S0`, which cancels a chamber preheated from the panel *(inferred; untested)* | Manufacturer has described the fan ports and interlock. For chamber-heated jobs, clear the aux column in a copied profile *(inferred)*; add `M106 P3 S0` and `M106 P5 S0` to the printer End G-code (ending with a newline); set material chamber temperatures. Whether the firmware turns the fans off at job end is still open | [Silent behaviours](Troubleshooting-Silent-Behaviours.md), [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md) |
| [#10](https://github.com/3ricj/FibreSeeker3/issues/10) | Error 10077 "chamber temperature too high" actually reads a sensor inside the printhead housing (53 °C PLA / 63 °C PETG) | Confirmed by the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35); the text is to be fixed. For PLA / PETG in a warm room or on long prints, print with the door and top cover open | [Printer error codes](Printer-Error-Codes.md) |

## Factory presets

| Issue | Subject | Status / workaround | See |
|---|---|---|---|
| [#42](https://github.com/3ricj/FibreSeeker3/issues/42) | Speedy "PET GF 0.1 mm" (both groups): Start G-code has `SET PRESSURE ADVANCE` / `SMOOTH TIME` with spaces and split lines; stock Klipper reports "Unknown command" and carries on, so pressure advance 0.035 and smooth time 0.04 are not applied (vendor firmware reaction unknown) | Open. Replace those four lines with `SET_PRESSURE_ADVANCE EXTRUDER=extruder1 ADVANCE=0.035 SMOOTH_TIME=0.04` | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| [#45](https://github.com/3ricj/FibreSeeker3/issues/45) | Factory preset outliers: matrix cost 1 per kg (CFC PETG / PA + X-CCF) and PLA X-CCF fibre 60 vs 180; Fortified PET GF + CGF start script (no pressure advance, minimum cruise ratio 0, square-corner velocity 1); Speedy PLA 0.25 top intermediate skin overlap −0.4; PPS CF group pairs a PPS CF shell (bed 85 °C) with the CFC PA matrix (bed 80 °C), so `M140` toggles by layer | Open; intent unknown. Enter real prices; compare the PET GF + CGF script with its X-CCF sibling; set the overlap to 0–0.1; give both materials the same bed temperature | [Factory materials and profiles](Factory-Materials-and-Profiles.md) |

## G-code output

| Issue | Subject | Status / workaround | See |
|---|---|---|---|
| [#1](https://github.com/3ricj/FibreSeeker3/issues/1) | Un-retracted travels. 1.3.1: with Do retract only when crossing borders on, travels up to 52 mm inside the part carry no retract (longest 51.8 mm excluding the move off the brush after a tool change); PLA files also leave 2–3.5 mm travels unretracted against a 2 mm threshold. 1.4.0: a no-op `G1 E0` where a retract belongs, then up to 33 mm unretracted (Do wipe nozzle on, wipe length 0; link *inferred*) | Turn Do retract only when crossing borders off; in 1.4.0 turn Do wipe nozzle off | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| [#2](https://github.com/3ricj/FibreSeeker3/issues/2) | Seams stacked in one line for 55–124 layers (corner-seeking seam, distribution off) | By design. Paint seams or enable seam distribution | [Print quality](Troubleshooting-Print-Quality.md) |
| [#3](https://github.com/3ricj/FibreSeeker3/issues/3) | Enclosed 0.6–1.6 mm gaps between walls (mainly 1.3.1, classic walls) | Use 1.4.0 and keep gap infill on (variable widths 0.09–0.61 mm) | [Print quality](Troubleshooting-Print-Quality.md) |
| [#4](https://github.com/3ricj/FibreSeeker3/issues/4) | No volumetric cap in 1.3.1: plastic flow up to 61 mm³/s | A 1.3.1 finding; 1.4.0 caps at 25 mm³/s. Use 1.4.0 or lower the speeds | [Print quality](Troubleshooting-Print-Quality.md) |
| [#5](https://github.com/3ricj/FibreSeeker3/issues/5) | Minimum layer time: the 1.3.1 slowdown stopped at ≈ 40 mm/s, leaving very short layers under target | 1.4.0 adds a minimum-speed setting (output untested). More parts per plate; more cooling | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| [#8](https://github.com/3ricj/FibreSeeker3/issues/8) | Implicit motion contract: no `M203` / `M205`; the slicer's `M204` accelerations override `printer.cfg` for the whole print, and Klipper keeps pressure advance, minimum cruise ratio and square-corner velocity until restart | By design. Change accelerations in the slicer's printer settings; set every motion value explicitly in each custom profile's Start G-code | [Motion settings](Motion-Settings.md) |
| [#7](https://github.com/3ricj/FibreSeeker3/issues/7), [#11](https://github.com/3ricj/FibreSeeker3/issues/11) | The 1.3.1 PLA start script used `SET_FAN_AT_LAYER` (#11: `CASE_FAN` undefined) | No 1.4.0 factory preset contains it; use the 1.4.0 presets or remove the line from a custom script | [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md) |
| [#29](https://github.com/3ricj/FibreSeeker3/issues/29) | Z-hops with Do Z-hop off: 9,655 plastic Z-hops in the 1.3.1 Fortified Benchy, 8,886 of them without a retract | Nothing to change in the slicer; 1.4.0 output not yet checked | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| [#30](https://github.com/3ricj/FibreSeeker3/issues/30) | 1.4.0 omits intermediate top infill: bridge and top skin full, but the three solid layers between them almost empty (Top solid 5). Its comments also discuss holes too small for a pin (X-Y hole compensation) | Manufacturer says it is a regression from 1.3.2, fixed for the next hotfix build (not verified). Inspect large roofs in the preview; try more top layers *(untested)*. For holes, enlarge them in CAD: Holes expansion probably has no effect in 1.4.0 *(inferred)* | [Silent behaviours](Troubleshooting-Silent-Behaviours.md), [Print quality](Troubleshooting-Print-Quality.md) |
| [#46](https://github.com/3ricj/FibreSeeker3/issues/46) | 1.4.0 comments (`; LAYER:`, `; SEAM`) use the locale's decimal comma (`[0,2]`) | Cosmetic; printing unaffected. Tools that parse G-code must accept either separator | [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md) |
| [#48](https://github.com/3ricj/FibreSeeker3/issues/48) | Custom G-code fields lose trailing `n` or `\` characters (not newlines): `…FAN=chamber_fan` becomes `…chamber_fa`. Confirmed in 1.4.0.857: `M117 fan` written as `M117 fa` | Open. End every custom G-code field with a newline or ` ;` | [Custom G-code and export](Custom-G-code-and-Export.md) |
| [ERROR_CODES.md](https://github.com/3ricj/FibreSeeker3/blob/main/ERROR_CODES.md) | 1.3.x on a comma-decimal Windows PC writes comma decimals inside commands (e.g. `P0,05`), giving printer errors 10057 → 10009 | Fixed in 1.4.0 (commands written with `.`). Update the slicer | [Printer error codes](Printer-Error-Codes.md) |

## User interface

| Issue | Subject | Status / workaround | See |
|---|---|---|---|
| [#40](https://github.com/3ricj/FibreSeeker3/issues/40) | Enhancement Magnitude slider opens at step 1 (10 %) whatever the profile holds; re-picking the last-written step writes nothing; keyboard Enter / Space writes nothing | Open. Move to another step and back with the mouse; check the density in the dialog | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| [#41](https://github.com/3ricj/FibreSeeker3/issues/41) | Tooltips disagree with behaviour: preheat "before the extruder change" is written only seconds before `M109`; illustrations not shown in 1.4.0 and many outdated (cut 13 mm vs 58 mm) | Trust the behaviour, not the tooltip | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |

## Firmware and app

| Issue | Subject | Status / workaround | See |
|---|---|---|---|
| [#37](https://github.com/3ricj/FibreSeeker3/issues/37) | Slicing failure on Windows: every model reported broken, Model Repair fails, `boostvoronoi_4x5x0.dll` reported missing although present | Likely the Microsoft Visual C++ 2015–2022 x64 runtime is missing and the installer does not ship it *(inferred)*. Install the latest Visual C++ Redistributable (x64), then restart Rocket Slicer. Awaiting confirmation from the reporter | [Slicer messages](Troubleshooting-Slicer-Messages.md) |
| [#9](https://github.com/3ricj/FibreSeeker3/issues/9) | `M1001` / `M1002` have no handler in firmware 2.2.42.831: Klipper logs "Unknown command" at INFO level and carries on, so the strand tow budget currently does nothing (repeated by the owner in [#31](https://github.com/3ricj/FibreSeeker3/issues/31)) | Manufacturer says it is investigating. Fibre jobs run regardless; no action needed | [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md) |
| [#24](https://github.com/3ricj/FibreSeeker3/issues/24) | Network upload stalls at a few per cent; how to export logs; loading the FFF head | Answered by FibreSeek in the thread: check the Wi-Fi signal (cause was a distant access point) or copy the file to USB; export printer logs via Notifications → Export Logs and slicer logs via Settings → Export Logs; feed FFF filament by hand up to the extruder gear | [Printer error codes](Printer-Error-Codes.md) |

## What real G-code confirmed or contradicted

**Most of the behaviour analysis holds; the printer values, chamber commands, acceleration and several tool-change details did not.** The test set is the repo's [Test_files](https://github.com/3ricj/FibreSeeker3/tree/main/Test_files): ten Benchys from slicer **1.3.1.480** (Speedy, Reinforced at five fibre densities, Fortified; PETG and PLA; the file named `Benchy_fortified-pla` is actually Plastic Only, so the only Fortified fibre file is PETG) and one large Plastic Only job from **1.4.0.857**. A 1.4.0.857 Fortified Benchy, sliced from the repo's `3DBenchy.stl` with the factory "CFC PETG + X-CCF / PETG" profile ([#38](https://github.com/3ricj/FibreSeeker3/issues/38)), settles Fortified. No 1.4.0 Reinforced file exists, so the other fibre and tool-change results are 1.3.1 behaviour. Every file's `; SESSION:` reports `Edition` 4. None of this has been checked against physical prints.

| Earlier assumption | Result | Evidence |
|---|---|---|
| Z travel 5 mm/s, Z-lift 10 mm, chamber off, regular acceleration 5000 | **Wrong:** 10 mm/s, 5 mm, chamber on, 8000 (the preset's base values; the preset's override values, keys ending in `Over`, are not applied) | All 11 SESSION blocks; every slicer-generated Z-only move is `F600` (the printer Start G-code's own `G0 Z10 F900` aside); lift +5 mm on every lifted tool change (73 of 74 in Reinforced; 271 of 271 in Fortified) |
| `M141` / `M191` never emitted | **Wrong:** 2 × `M141 S0` + 1 × `M191 S0` per file | All 11 files, both versions |
| One `M204 S5000` per factory file | **Wrong:** S5000 / S8000 alternate (gap infill or overhang infill at 8000) | 1.4.0: 195 + 195 |
| `M1001 L` = strand length | **Refined:** a tow budget = floor(55 + length fed before the cut) | 638 / 638 strands |
| Finish phase ≈ 58 mm less one contact radius | **Refined:** 55.6 mm = 58 − 2 × 1.2 mm | 611 / 638 strands (the rest 55.7–56.5 mm) |
| The first strand may lack the restart feed | Every strand gets `G1 F1500 U55` | 638 / 638 |
| Fortified uses only `T0`, no plastic | **Confirmed for 1.4.0:** one `T0 R`, no `T1`, no `E` move; areas fibre cannot fill are left empty with no message (Benchy cabin walls Z ≈ 25.5–31.8 mm and chimney missing, roof sliced over nothing; 17 % of the 1.3.1 plastic-head cells uncovered). **Contradicted for 1.3.1:** 136 changes to `T1`; 103 of 240 layers plastic only; plastic laid as solid "Cellular infill" | 1.3.1 matches the official manual ("when print length or space is insufficient, plastic infill is used"); 1.4.0 does not, so it is a regression ([#38](https://github.com/3ricj/FibreSeeker3/issues/38)) |
| Hidden 25 mm³/s volumetric cap | **1.4.0 only:** 0 of 1.86 M moves above 25.3 mm³/s. 1.3.1 peaks at 26–61 mm³/s (PETG 36–61, PLA 26–32); peaks depend on how very short moves are counted (moves ≥ 0.5 mm only: Speedy 45, Reinforced 80 % 37, Fortified 54) | [#4](https://github.com/3ricj/FibreSeeker3/issues/4) is a 1.3.1 finding |
| Plastic Z-hop only with Do Z-hop on and a retract | **Not in 1.3.1:** 9,655 hops with Do Z-hop off in Fortified, 8,886 of them without a retract | [#29](https://github.com/3ricj/FibreSeeker3/issues/29) |
| Fibre strands under ≈ 58 / 63 mm dropped | Consistent: shortest strand 70.4 mm of path; Reinforced 10–20 % Isogrid lays no fibre infill on a Benchy | Exact threshold not pinned; [#43](https://github.com/3ricj/FibreSeeker3/issues/43) |
| Aux / exhaust fans left on; preheat seconds before `M109`; heat-ups charged ≈ 0 in the estimate | Confirmed (≈ 5–6 s charged per tool change) | 1.3.1; [#41](https://github.com/3ricj/FibreSeeker3/issues/41) |
| Speedy holds `T0` at standby? | No: `T0` is never heated in Speedy | 1.3.1 and 1.4.0 |
| Guide directions cycle per fibre layer; one strand per contour | Confirmed (Fortified "0/90/0": 60 layers at 0°, 40 at 90°) | 1.3.1 |

**Version differences seen in the files or in the slicer changelog (community copy):**

- **1.3.1:** separate plastic and fibre extrusion compensation ratios (default 1.0); "fibre seam at end of longest edge" disables the other seam options; fixed accelerations being imported as ≈ 50 from legacy 3MF files and older projects (check projects saved before 1.3.1).
- **1.3.2:** PA and PPS profiles added; plastic perimeters beyond the model boundary fixed.
- **1.4.0:** adaptive-width walls and **gap infill** (variable widths 0.09–0.61 mm seen alongside classic walls); region ownership between skins, bridges, fibre perimeters and infill reworked (one 1.4.0 file shows three solid layers missing between a bridge and a top skin, [#30](https://github.com/3ricj/FibreSeeker3/issues/30)); short-layer cooling slowdown defaults; fan-command ordering fixed; volumetric cap present; commands locale-invariant.

## See also

- [Troubleshooting silent behaviours](Troubleshooting-Silent-Behaviours.md)
- [Troubleshooting slicer messages](Troubleshooting-Slicer-Messages.md)
- [Evidence and versions](Evidence-and-Versions.md)
- [Open questions](Open-Questions.md)
- [Factory materials and profiles](Factory-Materials-and-Profiles.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
