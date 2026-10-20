# Motion Settings

This page explains how motion limits reach the FibreSeeker 3: the slicer itself only writes `M204` acceleration, while pressure advance, smooth time, square-corner velocity and minimum cruise ratio come from each profile's Start G-code. It lists the factory values, explains why acceleration alternates between 5000 and 8000 mm/s², and warns that Klipper keeps these values from one print to the next.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Acceleration: `M204` is the only motion command the slicer writes

**`M204 S<a>` is written per entity when the value changes; everything else comes from the profile's Start G-code.**

- The per-entity factory accelerations are 5000 mm/s², but entities with no acceleration field of their own use the printer's Regular acceleration, **8000 mm/s²** *(Inferred mechanism)*.
- Real files therefore alternate: `M204 S8000` right after every `; Gap infill start` (1.4.0) or `; Overhang infill start` (1.3.1), and the next entity returns to 5000. The 1.4.0 Plastic Only test file has 195 × `S8000` and 195 × `S5000`. Only the Fortified Benchy has a single `M204 S5000`. *G-code*, 1.3.1 and 1.4.0.
- **Klipper's `M204` sets `max_accel` directly, so the slicer's accelerations override `printer.cfg` for the whole print.** To change acceleration, edit the slicer's profile and printer accelerations, not the firmware config.
- There is no `M203`/`M205` in the output ([#8](https://github.com/3ricj/FibreSeeker3/issues/8)); that is by design.
- 1.3.1 fixed accelerations being imported as ≈ 50 from legacy 3MF files and older projects; check projects saved before 1.3.1 (*Community*, slicer changelog).

## Pressure advance and smooth time

**Set once per print by the profile's Start G-code, and only on `extruder1` (the FFF head)** in every 1.4.0 preset (and 10 of 11 test files).

- Factory pressure advance ranges from 0.01 (PPS CF) to 0.07 (PETG Reinforced/Fortified); smooth time is 0.02–0.04.
- **The slicer never sets the composite head's pressure advance**, so the lines in Fortified profiles tune a head that is not used *(Inferred; supported by the community notes in [HardwareInfo.md](https://github.com/3ricj/FibreSeeker3/blob/main/Exploration/HardwareInfo.md) that `extruder1` is the right-hand FFF head)*.
  - Exception: the 1.3.1 Fortified PETG export set `EXTRUDER=extruder ADVANCE=0` (the composite head, zero).
  - The 1.4.0 preset targets `extruder1` instead, and the 1.4.0 Fortified Benchy sets `extruder1` (0.07 / 0.02), a head that job never uses (*G-code*, 1.4.0).
- The Speedy "PET GF 0.1 mm" Start G-code is malformed and its pressure advance is not applied; the fix is on [Factory materials and profiles](Factory-Materials-and-Profiles.md) ([#42](https://github.com/3ricj/FibreSeeker3/issues/42)).

## Corner velocity

- **Reinforced and most Fortified profiles** call the vendor macro `SET_TOOL_CORNER_VELOCITY T=0 SCV=1` and `T=1 SCV=5`. These are per-tool square-corner velocities, presumably applied by `T0`/`T1` *(Inferred)*. The macro's firmware semantics are unknown (see [Open questions](Open-Questions.md)).
- **Speedy and Fortified PET GF + CGF** set the global `SET_VELOCITY_LIMIT SQUARE_CORNER_VELOCITY` (1–15) instead.

## Minimum cruise ratio

`SET_VELOCITY_LIMIT MINIMUM_CRUISE_RATIO` is **0.8** in Reinforced/Fortified (Klipper default 0.5). It noticeably slows short segments, such as fibre sub-segments and small perimeters *(FFF practice)*. See [Print time](Print-Time.md) for its cost.

## State carries over between prints

**Klipper keeps these runtime values until restart.** A profile that omits one inherits the previous job's value. For example, a Speedy PLA job after a Reinforced one keeps a minimum cruise ratio of 0.8. Whether the vendor firmware resets them at job start is unknown (see [Open questions](Open-Questions.md)).

**Fix:** in any copied profile, set every value explicitly in the Start G-code, e.g.

```
SET_PRESSURE_ADVANCE EXTRUDER=extruder1 ADVANCE=0.035 SMOOTH_TIME=0.04
SET_VELOCITY_LIMIT MINIMUM_CRUISE_RATIO=0.5 SQUARE_CORNER_VELOCITY=5
```

(values illustrative; take yours from the table below). End the field with a newline: see the trailing-character bug on [Custom G-code and export](Custom-G-code-and-Export.md).

## Factory start scripts

There are 15 distinct factory Start G-code variants (*Behaviour analysis*, from the preset files):

| Profiles | Pressure advance / smooth time (FFF) | Other lines |
|---|---|---|
| Reinforced and Fortified PETG | 0.07 / 0.02 | MCR 0.8; per-tool SCV 1 / 5 |
| Other Reinforced/Fortified | 0.01–0.03 / 0.02–0.04 | MCR 0.8; per-tool SCV 1 / 5 |
| Fortified PET GF + CGF | none | MCR 0; global SCV 1 |
| Speedy | 0.03–0.06 | global SCV 5–15; MCR 0.2–0.7 or absent |

MCR = minimum cruise ratio; SCV = square-corner velocity (mm/s). The Fortified PET GF + CGF script looks unfinished compared with its X-CCF sibling, and Speedy scripts that omit MCR or smooth time inherit the previous job's values — both are listed in the [factory-preset anomalies](Factory-Materials-and-Profiles.md).

## See also

- [Custom G-code and export](Custom-G-code-and-Export.md)
- [Factory materials and profiles](Factory-Materials-and-Profiles.md)
- [Print time](Print-Time.md)
- [Settings: material, extruder and printer](Settings-Material-Extruder-Printer.md)
- [Machine overview](Machine-Overview.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
