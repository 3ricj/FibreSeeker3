# Open Questions

This page lists what is still not known about Rocket Slicer and the FibreSeeker 3, grouped by topic, with what would settle each question: a test slice (anyone with the slicer can do it), a test print (needs the printer), or a manufacturer answer. Questions that have since been answered are listed at the end with their answers. If you can settle one, open an issue with the evidence (see [Evidence and versions](Evidence-and-Versions.md)).

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## How to read this list

**Each row says what would settle it.** "Test slice" means slicing a purpose-made part and reading the exported G-code; "test print" means running it on a printer and observing or timing it; "manufacturer" means only FibreSeek can say. The most valuable single contribution would be a **1.4.0.857 Reinforced G-code file** with factory settings, which would settle several rows at once.

## Slicer behaviour

| Question | Why it matters | What would settle it | Related |
|---|---|---|---|
| Which first-layer fibre thickness is used: the UI's fibre first-layer Layer height (`FiberFLThicknessMM`, 0.20 R / 0.15 F) or a separate value with no UI field (`FiberFLThickness`, default 0.3 mm; 0.24 in 1.3.1 exports)? If the latter, the UI field does nothing | First-layer fibre adhesion | Test slice: a 1.4.0 Reinforced or Fortified part whose fibre starts on layer 1, with the UI value changed; compare the first fibre layer's height. The 1.3.1 Reinforced files don't exercise it (first fibre on layer 7) | [Fibre settings](Settings-Fibre.md) |
| Do sidebar edits to a factory template survive a project reload? *Behaviour analysis* says no | Edits that silently revert | Test in the app: edit via the sidebar, save, reload, re-check | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| What does Enhancement Magnitude step 0 (0 % density) produce? | Sidebar fibre control | Test slice at step 0 | [#40](https://github.com/3ricj/FibreSeeker3/issues/40) |
| Do the adaptive-wall fractions really display as "0.85 %" in the running UI? | Misleading units | Screenshot of the field in 1.4.0 | [Layers and walls](Settings-Layers-and-Walls.md) |
| What do the micro-infill settings (Profile › Plastic solid and micro infill) actually control? | Unused-looking settings | Test slices toggling them, diffing the G-code | [Plastic infill and features](Settings-Plastic-Infill-and-Features.md) |
| How does a mask's single top/bottom count map to the profile's separate Top solid and Bottom solid counts? | Per-region skins | Test slice with a mask, counting skin layers above and below | [Masks and layups](Masks-and-Layups.md) |
| Do layup Z ranges follow a part moved in Z? (They rescale with scaling.) | Fibre bands landing in the wrong place | Test slice: set a band, raise the part, reslice | [Masks and layups](Masks-and-Layups.md) |
| Do a few UI fields (trim gap ratio, fibre tension feed rate) feed the slicing parameter their label suggests? | Settings that may not do what they say | Test slices changing each one alone | [Settings overview](Settings-Overview.md) |
| Exact order of the slicing pipeline's sub-stages per model (reconstructed from progress labels) | Understanding which feature wins a region | Test slices with conflicting features; manufacturer | [How the slicer works](How-the-Slicer-Works.md) |
| Which tree-support checks abort the slice and which only warn? Does enabling support in Fortified abort? | Unexpected "Slicing failed" | Test slices with support on in each mode | [Slicer messages](Troubleshooting-Slicer-Messages.md) |
| Does the priming line at negative Y raise the out-of-area warning, and does the firmware tolerate it? | First-fibre-layer failures | Test slice (warning); test print (firmware) | [Silent behaviours](Troubleshooting-Silent-Behaviours.md) |
| Do the 1.3.1 bugs persist in 1.4.0 **fibre** jobs: Z-hops with Do Z-hop off, the 40 mm/s minimum-layer-time limit, first-layer bed temperature set without a wait? (The volumetric cap is present in 1.4.0 Plastic Only output.) | Version-specific workarounds | Test slice: 1.4.0 Reinforced file | [#29](https://github.com/3ricj/FibreSeeker3/issues/29), [#5](https://github.com/3ricj/FibreSeeker3/issues/5), [#44](https://github.com/3ricj/FibreSeeker3/issues/44), [Known bugs](Known-Bugs.md) |

## Fibre

| Question | Why it matters | What would settle it | Related |
|---|---|---|---|
| **The corner-angle threshold for fibre slowdown.** Below it a vertex runs at Max. normal speed; above it, at curvature speed. It decides whether finely tessellated fillets and holes run at 30 mm/s or about 5 mm/s | All fillet and hole timings; whether rounded corners under about R 70 mm cost or save time (hole loop ≈ 30 s vs ≈ 5 s in [Print time](Print-Time.md) Case C) | Test slice: one part with known fillets and holes at several tessellations; read the `F` speeds on the fibre moves | [Fibre paths](Fibre-Paths.md) |
| What exactly does "Fiber shell adaptive loops" (`MustGenerateFiberPerimeters`) do? The per-hole loop schedule is unknown | Which holes get fibre | Test slices with holes of several sizes, on and off | [Fibre settings](Settings-Fibre.md) |
| In Fortified, is an area too small for fibre loops first offered to solid fibre infill? What is the narrowest feature fibre will fill? | Predicting what 1.4.0 Fortified leaves out | Test slice: a wedge or stepped-width part in 1.4.0 Fortified | [#38](https://github.com/3ricj/FibreSeeker3/issues/38), [Print modes](Print-Modes.md) |
| Can a fibre strand cross between islands without a cut? Each island is assumed to start a new strand | Strand count and time | Test slice: two islands close together; count `M2800` cuts | [Fibre paths](Fibre-Paths.md) |
| What is the exact minimum strand length? Real files are consistent with a floor of about 58–63 mm (shortest real strand 70.4 mm of path) but don't pin it | Which short ribs and loops are dropped | Test slice: ribs or loops of graded length | [#43](https://github.com/3ricj/FibreSeeker3/issues/43) |
| How do cellular infill ribs link into strands for Rhombic and other patterns, and on larger parts? (Isogrid on a Benchy is answered below) | Fibre infill amount and time | Test slices of a larger plate at several patterns and densities | [Fibre paths](Fibre-Paths.md) |
| Where is the after-cut plastic flow multiplier applied, and which contact radius (profile or extruder) places the cut? What contact radius does Fortified use, given its profiles have none? | Cut position and strand ends | Test slice changing each radius; manufacturer | [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md) |
| How does X-CCF lay at a 0.30 mm macro height (bead taller than the 0.25 mm tow)? | 20 % fewer layers | Test print | [Print time](Print-Time.md) |
| Is the factory cut distance correct? | Strand-end quality | Manufacturer; test print | [Fibre print quality](Troubleshooting-Print-Quality.md) |

## Machine and firmware

| Question | Why it matters | What would settle it | Related |
|---|---|---|---|
| **What the vendor commands mean to the firmware:** `M1001 L` (known to equal the tow budget, floor(55 + fed length before the cut), but not why the firmware needs it), `M1002`, `M2800`, `T0`/`T1` and the `R` suffix, the `P` word on composite moves, the brush macros, `SET_TOOL_CORNER_VELOCITY`, and how V and U are set up as axes | Custom G-code and post-processing | Manufacturer; the FibreSeeker `printer.cfg`. [#9](https://github.com/3ricj/FibreSeeker3/issues/9) (repeated in [#31](https://github.com/3ricj/FibreSeeker3/issues/31)) says `M1001`/`M1002` have no firmware handler; fibre jobs do run, so that is unproven | [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md), [GCODE_REFERENCE.md](https://github.com/3ricj/FibreSeeker3/blob/main/GCODE_REFERENCE.md) |
| Does the firmware switch the auxiliary and exhaust fans off at job end? The G-code leaves them on (last `P3`/`P5` = 255 in nine test files) | Fans running after a print | Test print, observing the fans; asked on [#35](https://github.com/3ricj/FibreSeeker3/issues/35) | [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md) |
| Does `M141 S0` switch off a chamber preheated from the panel? The manufacturer's description in [#35](https://github.com/3ricj/FibreSeeker3/issues/35) implies yes | Chamber-heated materials | Test print: preheat from the panel, start a job | [#35](https://github.com/3ricj/FibreSeeker3/issues/35) |
| Does an unknown command (e.g. the malformed Speedy "PET GF 0.1 mm" Start G-code lines) abort the print, or is it skipped? | Whether that profile is safe to use | Test print with that profile, or a one-line test file | [#42](https://github.com/3ricj/FibreSeeker3/issues/42) |
| Does job start reset velocity limits and pressure advance set by a previous job? | Settings bleeding between jobs | Test print: two jobs with different start scripts, querying Klipper between them | [Motion settings](Motion-Settings.md) |
| Do the `T0`/`T1` macros apply the inter-nozzle offset? *Inferred* from the zero offsets in the slicer and the official procedure that edits the machine offset | Head alignment | Manufacturer; `printer.cfg` | [Machine overview](Machine-Overview.md) |
| Why does the printer preset carry override values (Z travel 5 mm/s, Z-lift 10 mm, chamber off, accel 5000) that real exports never use, and were they meant to apply? | Which printer values are "real" | Manufacturer | [Material, extruder and printer settings](Settings-Material-Extruder-Printer.md) |
| 1.4.0 fibre output details: the axis-less restart unretract; whether a Reinforced priming line is generated with the 1.4.0 factory priming-line values at 0 | 1.4.0 Reinforced behaviour | Test slice: 1.4.0 Reinforced file | [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md) |
| Cost inputs: does the matrix cost use the composite's plastic cost per spool? Does 1.4.0 also exclude the 55 mm restart from the reported fibre length (confirmed for 1.3.1)? | Cost and usage reports | Test slice in 1.4.0 Reinforced, comparing the reported length with ΣU | [#39](https://github.com/3ricj/FibreSeeker3/issues/39) |

## Print time

| Question | Why it matters | What would settle it | Related |
|---|---|---|---|
| How long do the brush macros and cutter take, and how far does the idle nozzle cool during a visit? What makes up the slicer's ≈ 5–6 s charge per change? | Turns the 14–31 % Reinforced under-estimate (an upper bound) into a measured figure | Test print: time tool changes and log nozzle temperature in Moonraker | [#41](https://github.com/3ricj/FibreSeeker3/issues/41), [Print time](Print-Time.md) |
| Do tool-change blocks and composite moves count towards the 10 s minimum layer time, and are composite moves slowed by it? | Small-part time in Reinforced | Test slice: small Reinforced part, read per-layer times and speeds | [#5](https://github.com/3ricj/FibreSeeker3/issues/5) |
| Does a plate of several parts get one tool-change pair per layer for the whole plate? (*Inferred* from per-layer head grouping) | The biggest Reinforced time lever | Test slice: two parts in Reinforced; count `T0`/`T1` per layer | [Print time](Print-Time.md) |
| How high can Extruder standby temperature (`TemperatureWait`) go on each material without ooze or degradation? | Saves about 40 s per Reinforced macro layer | Test print per material | [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md) |
| How much do Klipper's square-corner velocity (1 mm/s on T0) and minimum cruise ratio 0.8 add to fibre strands? A Klipper-style model without minimum cruise ratio ran 8–31 % faster than the slicer's figure, so probably little | Accuracy of fibre time estimates | Test print, timed | [Motion settings](Motion-Settings.md) |
| How long do 1.4.0 fibre jobs really take? No 1.4.0 Reinforced file has been checked; the 1.4.0 Fortified Benchy (estimate 6 h 10 min, 374 strands) was not timed | Calibrating the estimate | Test print of a 1.4.0 Reinforced and Fortified job, timed | [Print time](Print-Time.md) |

## Presets intent

| Question | Why it matters | What would settle it | Related |
|---|---|---|---|
| Are the factory outliers intended: Correction move speed 0.1 mm/s in six Reinforced X-CCF profiles (inert while the override is off), placeholder-looking costs, the PET GF + CGF Fortified start script, Speedy PLA 0.25 overlap −0.4, the PPS CF bed? | Whether to "fix" them in copies | Manufacturer | [#45](https://github.com/3ricj/FibreSeeker3/issues/45), [Factory materials and profiles](Factory-Materials-and-Profiles.md) |
| Is Fortified Guide directions "0" (in 7 of 16 Fortified profiles) intended? It puts every fibre-infill layer at 0° | Transverse strength | Manufacturer | [#47](https://github.com/3ricj/FibreSeeker3/issues/47) |
| Does PPS CF bond to a PA matrix? | Material pairing | Manufacturer; test print | [Factory materials and profiles](Factory-Materials-and-Profiles.md) |
| Do the print-quality fixes on the troubleshooting pages work on real prints? All are untested on physical prints | Every quality recommendation | Test prints, reported back as issues | [Print quality](Troubleshooting-Print-Quality.md) |

## Answered

| Question | Answer | Evidence |
|---|---|---|
| Which licence edition do real exports run? | The full edition: `Edition` 4 in every exported `; SESSION:` block | *G-code*, 1.3.1 and 1.4.0 |
| Does Speedy heat or hold the composite head (T0) at standby? | No: T0 is never heated | *G-code*, 1.3.1 and 1.4.0 |
| Does Fortified use the FFF head where fibre cannot fill? | 1.3.1: yes (271 tool changes, 103 of 240 layers plastic only). 1.4.0: no, those areas are left empty with no message (a regression) | *G-code*; [#38](https://github.com/3ricj/FibreSeeker3/issues/38) |
| Does a 1.4.0 Fortified job get a priming strand? | Yes, even with the priming-line values at 0 | *G-code*, 1.4.0 |
| Does Fortified Guide directions "0" lay all fibre at 0°? | Yes: 84 of 84 fibre-infill layers on a test cube (intent still open, above) | *G-code*, 1.4.0; [#47](https://github.com/3ricj/FibreSeeker3/issues/47) |
| Do custom G-code fields lose a trailing `n` or `\`? | Yes: `M117 fan` is written as `M117 fa`. End every field with a real newline or ` ;` | *G-code*, 1.4.0; [#48](https://github.com/3ricj/FibreSeeker3/issues/48) |
| Which fan is P5? | The exhaust fan | *Community*, manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35) |
| How does Isogrid fibre infill link on a small part? | At 60–80 % ribs link into 63–68 strands of roughly 70–230 mm; at 10–20 % none survive on a Benchy | *G-code*, 1.3.1; [#43](https://github.com/3ricj/FibreSeeker3/issues/43) |
| What does `M1001 L` carry? | The tow budget: floor(55 + fed length before the cut), on all 638 real strands | *G-code*, 1.3.1 |

## See also

- [Evidence and versions](Evidence-and-Versions.md)
- [Known bugs](Known-Bugs.md)
- [Print time](Print-Time.md)
- [How the slicer works](How-the-Slicer-Works.md)
- [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
