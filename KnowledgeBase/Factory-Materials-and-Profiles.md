# Factory Materials and Profiles

This page lists the materials and profiles that ship with Rocket Slicer: the five FFF plastics, the four fibre composites and how they pair, how costs are calculated (and why the reported fibre length is short), how the 48 factory profiles are organised and what the layer height in a profile name really means, and the known defects in the factory presets with what to do about each.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Factory materials

**Five FFF plastics (for T1) and four composites (for T0).** A composite carries both the fibre and its own matrix plastic; the CFC matrix is not a separate plastic. The material list shows all nine, unfiltered; the profile group then decides which pairs are valid. Values below are from the factory preset files. *Behaviour analysis* unless marked.

### FFF plastics (`Plastics.json`)

| Setting (key) | PETG | PET GF | PA CF | PPS CF | PLA |
|---|---|---|---|---|---|
| Extruder temperature (`TemperaturePrint`), °C | 250 | 300 | 270 | **330** | 220 |
| Extruder standby temperature (`TemperatureWait`), °C | 120 | 150 | 150 | 150 | 100 |
| Extruder preheat temperature (`TemperaturePreheat`), °C | 250 | 280 | 250 | 280 | 220, **preheat off** |
| Build plate temperature (`BedTemperature`), °C | 75 | 75 | 80 | 85 | 55 |
| Regular / Maximum fan speed, % | 20 / 80 | 40 / 60 | 5 / 20 | 0 / 40 | 90 / 100 |
| Layer time for max fan speed (`LayerTimeForMaxCooling`), s | 4 | 5 | 3 | 5 | 2 |
| Density (`Density`), g/cm³ | 1.27 | 1.43 | 1.06 | 1.29 | 1.24 |
| Spool cost (`CostPerSpool`) per 1000 g | 20 | 24 | 20 | 24 | 20 |

- All five are 1.75 mm.
- Every first-layer value equals the regular value, so factory G-code has no first-layer temperature change.
- **Common to all five:**
  - a volumetric cap `MaxVolumetricSpeed` = 25 mm³/s with no UI field. It is a 1.4.0 feature: no 1.4.0 move exceeds it, while 1.3.1 exports have no cap (*G-code*, both versions; see [#4](https://github.com/3ricj/FibreSeeker3/issues/4) and [Print time](Print-Time.md));
  - Retract length on tool change (`RetractionLengthOnToolChange`) 5 mm, also used for the end-of-job retract;
  - coast length 0, which makes the profile's Coast at end inert;
  - Chamber temperature 0, which every job sends as `M141 S0` / `M191 S0` (see [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)).
- The FFF hot end must reach at least 330 °C to run PPS CF. Both nozzles are rated to 350 °C (*Official* spec), so this is within range.

### Composites (`Composites.json`): fibre and matrix pairings

| Setting (key) | CFC PETG + X-CCF | CFC PETG + CGF | CFC PA + X-CCF | CFC PLA + X-CCF |
|---|---|---|---|---|
| Fibre | X-CCF carbon | **X-CGF glass** | X-CCF carbon | X-CCF carbon |
| Matrix | PETG | PETG | PA | PLA |
| Fiber diameter (`FiberDiameter`), mm | 0.25 | **0.35** | 0.25 | 0.25 |
| Linear density (`LinearDensity`), tex | 102 | 170 | 102 | 102 |
| Plastic flow multiplier (`ExtrusionMultiplierP`) | 0.8 | **0.68** | 0.8 | 0.8 |
| Extruder temperature / standby, °C | 270 / 150 | 270 / 150 | 270 / **200** | 230 / 100 |
| Build plate temperature, °C | 75 | 75 | 80 | 55 |
| Composite fan (regular = first layer), % | 80 | 100 | 50 | 100 |
| Fiber extrusion speed (`ExtrusionSpeedF`), restart feed, mm/s | 25 | 20 | **10** | 25 |
| Fiber cost per spool, per 0.5 km | 180 | 45 | 180 | **60** |
| Plastic cost per spool (matrix), per 1000 g | **1** | 20 | **1** | 8 |

- **Common to all four:**
  - preheat on, set to the print temperature, except CFC PLA (preheat 220 °C, print 230 °C);
  - matrix retract 1 mm, and 5 mm on tool change, at 10 mm/s;
  - Z-lift on restart (`ZHopF`) 1 mm, Restart pause (`ZHopFPauseAdhesion`) 0 s, Finish ironing distance (`FinishIroningDistance`) 8 mm;
  - no volumetric cap and no layer-time fan rule.
- **Composite head values** (`ExtruderCs.json`):
  - Cut distance (`CutDistance`) **58 mm** (built-in default 40);
  - Fiber restart length (`FiberRestartLength`) **55 mm** (built-in default 42);
  - extruder contact radius 1.2 / 1.8 mm.

  These set the minimum fibre strand lengths described in [How the slicer works](How-the-Slicer-Works.md) and [Fibre paths](Fibre-Paths.md); how they show up in G-code is in [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md).
- **Valid pairings are limited.** X-CGF pairs only with PETG and PET GF shells. The PPS CF group uses the **PA**-matrix composite (see the anomaly table). There is no PLA, PA or PPS with glass.
- **Bead make-up** *(Inferred, arithmetic)*: fibre takes 26 % of an X-CCF bead (0.24 × 0.8 mm) and 40 % of an X-CGF bead (0.30 × 0.8 mm), 46 % at Fortified PET GF's 0.7 mm width. This is the tow's share of the whole bead including matrix; the official guide describes X-CCF itself as carbon tow pre-impregnated with thermoset resin at about 60 % fibre volume fraction (*Official*).

### Costs are rough, and some look like placeholders

- **Formulas** (*Behaviour analysis*). Plastic cost = mass ÷ spool weight × spool price; fibre cost = length ÷ spool length (km) × spool price; fibre mass = length × tex. 10 m of X-CCF = 1.0 g and 3.60.
- **Reported fibre length is short.** It equals the sum of `U` on XY moves only, so the 55 mm restart feed of every strand is left out. On the 1.3.1 Benchys the restart feed is 20–50 % of the tow actually fed, and real use is 1.24–1.98 × the reported figure (1.24 Fortified, 1.43–1.68 PETG Reinforced, 1.98 PLA Reinforced). *G-code*, 1.3.1; whether 1.4.0 does the same is untested. Fibre mass and cost inherit the gap. Reported as [#39](https://github.com/3ricj/FibreSeeker3/issues/39).
  - **Budget a spool as reported length + 55 mm × number of strands** (count the `M1001` lines in the G-code).
- **Currency.** The numbers are unitless; "Display currency" changes only the symbol.
- **Likely placeholders** *(Inferred)*: matrix at **1** per kg in the X-CCF PETG and PA composites (matrix cost shows as about zero), and X-CCF at **60** per 0.5 km in the PLA composite against 180 elsewhere. That the matrix cost uses the composite's Plastic cost per spool is itself *Inferred*. **Enter real prices before trusting the preview cost.**

## Factory profile library

**16 profile groups × 3 modes = 48 profiles, which reduce to 10 distinct Speedy, 7 Reinforced and 7 Fortified settings sets.** Each group pairs one FFF plastic with one composite. The app shows a group only when both of its materials are selected.

| FFF plastic | Composite | Speedy heights in the group names | Reinforced / Fortified macro layer |
|---|---|---|---|
| PETG | CFC PETG + X-CCF | 0.1, 0.2, 0.25 | 0.24 |
| PETG | CFC PETG + CGF | 0.1, 0.2, 0.25 | 0.30 |
| PET GF | CFC PETG + X-CCF | 0.1, 0.2, 0.25 | 0.24 |
| PET GF | CFC PETG + CGF | 0.1, 0.2, 0.25 | 0.30 |
| PA CF | CFC PA + X-CCF | 0.2 | 0.24 |
| PPS CF | CFC PA + X-CCF | 0.2 | 0.24 |
| PLA | CFC PLA + X-CCF | 0.2, 0.25 | 0.24 |

Group names read like "PETG 0.2 mm | CFC PETG+X-CCF / PETG". The default settings set is the Speedy profile of that group.

The headline setting differences between Speedy, Reinforced and Fortified, and which factory profile to start from for a given goal, are on [Print modes](Print-Modes.md).

### Layer-height rule

- **The height in a group name applies to Speedy only.** Reinforced and Fortified values depend only on the (plastic, composite) pair. "PETG 0.1 mm" and "PETG 0.25 mm" therefore carry identical Reinforced and identical Fortified profiles.
- **The fibre sets the Reinforced/Fortified macro layer:** 0.24 mm for X-CCF (0.25 mm tow) and 0.30 mm for X-CGF (0.35 mm tow). Both sit just under the tow diameter.
- **Don't go much lower.** A thinner macro layer compresses the bead and raises its fibre share *(Inferred)*.
- **Speedy profiles ignore the fibre.** The X-CCF and CGF sibling groups have identical Speedy profiles.
- Macro and micro layers are explained in [How the slicer works](How-the-Slicer-Works.md). Per-field values are in [Settings overview](Settings-Overview.md) and [Layers and walls](Settings-Layers-and-Walls.md).

## Known factory-preset anomalies

**Defects and oddities in the shipped templates, with what to do about each.** Factory templates are view-only in the profile dialog, so **duplicate the group before editing**. The values themselves are *Behaviour analysis* (read from the preset files); their effects are *Inferred* unless marked. Several are asked about in [#45](https://github.com/3ricj/FibreSeeker3/issues/45); intent is unknown until FibreSeek answers or test prints settle them.

| Item | Effect | Suggested action |
|---|---|---|
| Speedy "PET GF 0.1 mm" (both groups): Start G-code has `SET PRESSURE ADVANCE` and `SMOOTH TIME`, with spaces for underscores and arguments on separate lines | Stock Klipper reports four "Unknown command" messages and carries on. Pressure advance 0.035 and smooth time 0.04 are not applied. A vendor fork might abort instead (untested) | Replace those four lines with `SET_PRESSURE_ADVANCE EXTRUDER=extruder1 ADVANCE=0.035 SMOOTH_TIME=0.04` ([#42](https://github.com/3ricj/FibreSeeker3/issues/42)) |
| Group-name layer height (0.1 / 0.2 / 0.25) | Means nothing in Reinforced or Fortified (*Behaviour analysis*) | Choose groups by material; change Macrolayer height only with care |
| Fortified Guide directions (`InfillFSolidAngleList`) = "0" in 7 of 16 (PET GF + CGF, PA CF, PPS CF, PLA) | Every solid fibre layer at 0° (*G-code*, 1.4.0: PLA 0.2 mm cube, 84 of 84 fibre-infill layers at 0°; [#47](https://github.com/3ricj/FibreSeeker3/issues/47)): weak across the fibre and prone to splitting or warping | Set "0/90" or "0/60/-60", or match the load |
| Reinforced: Enable support on in all 16 profiles (off in Speedy and Fortified) | Switching to Reinforced silently adds tree support (*Behaviour analysis*) | Turn it off if the part does not need it |
| Reinforced PETG / PET GF + X-CCF (6 profiles): Correction move speed (`CorrectionMoveSpeed`) 0.1 mm/s (2 elsewhere) | Probably inert: the value is used only when Override correction move speed (`OverrideCorrectionSegmentSpeed`) is on, and it is off in every factory profile (*Inferred*). Probably a typo | Leave it; if you turn the override on, set 2 mm/s first |
| PPS CF group pairs a PPS CF shell (330 °C, bed 85) with the CFC **PA** matrix (270 °C, bed 80) | Shell-to-fibre bond unverified. The bed toggles between 80 and 85 °C by layer, because `M140` follows the active head's material (*Behaviour analysis*) | Give both materials the same bed temperature; test the bond ([#45](https://github.com/3ricj/FibreSeeker3/issues/45)) |
| Costs: matrix 1 per kg (X-CCF PETG/PA); PLA X-CCF fibre 60 vs 180 | Preview cost wrong | Enter real prices |
| Fortified PET GF + CGF Start G-code | No pressure advance, minimum cruise ratio 0, global square-corner velocity 1. Inconsistent with its X-CCF sibling; possibly unfinished | Compare with the X-CCF sibling's script (see [Motion settings](Motion-Settings.md)) |
| Speedy start scripts that omit minimum cruise ratio or smooth time | Values carry over from the previous print (stock Klipper behaviour) | Set every value explicitly |
| Fortified PA CF has top/bottom solid layers 5/3 (0/0 elsewhere) | Fortified forces them to zero. If a plastic path still survives, the slice aborts with "FORTIFIED mode cannot materialize plastic entities" (*Behaviour analysis*, untested; a factory 1.4.0 Fortified Benchy did not trigger it) | Leave as is; if that error appears, check [masks and layups](Masks-and-Layups.md) |
| Speedy PLA 0.25: top intermediate skin overlap (`TopIntermediateSkinInfillExtendIntoPerimeterRatio`) −0.4 | Pulls the skin away from the walls; possible gaps under the top | Set to 0–0.1 ([#45](https://github.com/3ricj/FibreSeeker3/issues/45)) |
| Speedy PET GF 0.25: Fill angle offset (`InfillPCellularFillAngleStep`) 0 (90 elsewhere) | Grid layers may all share one orientation | Set 90 |
| Chamber temperature 0 in every material | Has heated chamber is effectively on, so **every job** sends `M141 S0` and `M191 S0` at the start and `M141 S0` at the end (*G-code*, all 11 test files, 1.3.1 and 1.4.0). `M141 S0` with a target set switches the chamber heater off (per the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35)), so a chamber preheated from the machine panel is cancelled at job start *(Inferred; not tested)* | Set the material's chamber temperature first (copy the material) |

**Harmless data oddities:**

- The Cut G-code comment `;CUT DISTANCE 54.8` is verbatim text, identical on all 638 strands in the test files; the cut is actually placed by the 58 mm Cut distance.
- `AllowGenerateFiber` is false in 8 profiles, but is forced true at slice time for fibre jobs.
- Duplicate PA CF rows in `ProfileMaterials.json`, and inconsistent fibre-type strings.

## See also

- [Print modes](Print-Modes.md)
- [Settings: material, extruder and printer](Settings-Material-Extruder-Printer.md)
- [Motion settings](Motion-Settings.md)
- [Known bugs](Known-Bugs.md)
- [Machine overview](Machine-Overview.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
