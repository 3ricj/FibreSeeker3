# Tool Changes Temperatures and Fans

This page explains what happens in the G-code when the FibreSeeker 3 switches between the composite head (T0) and the FFF head (T1), why the preheat does not actually lead the change and how much time that costs against the slicer's estimate, which temperature commands every job sends (including the chamber commands), and how each `M106` fan port maps to the hardware, with the manufacturer's description of how chamber heating and auxiliary cooling interact.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Tool change

**Each T0 ↔ T1 change runs a fixed SK3 routine: retract, lift 5 mm, brush the FFF nozzle, then heat and wait.** The order below is *G-code*-confirmed in 1.3.1 Reinforced and Fortified files; no 1.4.0 test file contains a tool change.

**Both directions start the same way:**

1. `; Start change extruder`
2. Code Before Extruder Change (factory empty)
3. `M400`
4. preheat `M104 S<preheat> T<new>` (if preheat is on)
5. standby `M104 S<standby> T<old>`
6. a retract of the old head
7. `G0 Z+5 F600` (the 5 mm Z-lift at 10 mm/s)

The retract tops up to Retract length on tool change (5 mm): the composite head writes `V-4` after the strand's `V-1` (PLA `V-3` after `V-2`); the FFF head writes `E-5` (PLA `E-10`).

**Then they differ:**

| To FFF head (T1) | To composite head (T0) |
|---|---|
| `T1 ; switch extruder type to:PLASTIC` | Inserted after the two `M104` lines, before the retract: FFF part fan to the material maximum (`M106 P1 S229` = 90 % PETG) |
| `M106 P1 S255`, then `MOVE_TO_BRUSH_STATION`, `M109 S<print> T1`, `CLEAN_NOZZLE`, `MOVE_OUT_BRUSH_STATION` | `MOVE_TO_BRUSH_STATION`, `CLEAN_NOZZLE`, `MOVE_OUT_BRUSH_STATION` |
| Old fan off (`M106 P2 S0`) | `T0 ; switch extruder type to:FIBER`, `M106 P2 S255`, `M109 S<print> T0`, old fan off (`M106 P1 S0`) |

Code After Extruder Change (empty) and `; End change extruder` close the routine. The XY travel to the next start then runs at the lifted height, followed by `G0 Z<layer> F600`. The FFF restart after a change is `G1 F900 E5` (PETG).

- **The FFF nozzle is the one brushed in both directions.** The composite nozzle is brushed once, after the initial `T0 R` at job start (*G-code*, 1.3.1). [#26](https://github.com/3ricj/FibreSeeker3/issues/26) ("left head not cleaned") is recorded as fixed in the printer's macros.
- **Each change ends with a brief 100 % burst on the new head's fan** until the next entity sets the material value.
- **Plastic-only jobs** do one initial `M109 S<first-layer> T1`, `T1 R` and three brush macros. After the skirt a further +5 mm tool-change lift appears (so the job appears to lift 10 mm after the brim).
- **Extra unretract on tool change** (`ExtraLengthPOnToolChange`): for the FFF head it needs Do unretract before tool change, which is factory off. On the composite head the 1.3.1 restart unretract does include the material's extra length (−1 in CFC PLA), so that gate may not apply there; unresolved.

Where the Before/After Extruder Change fields land is detailed in [Custom G-code and export](Custom-G-code-and-Export.md).

### Preheat and standby on this printer

**The preheat does not lead the change.** For other printers the slicer moves the preheat `M104` earlier by (preheat − standby) ÷ heat-up speed (*Behaviour analysis*). On SK3 it is written at the start of the change routine, seconds before the `M109`: only the retract, lift, tool select and brush macros lie between them (*G-code*, 1.3.1). The tooltip's "preheated before the extruder change" does not hold on this printer. Reported in [#41](https://github.com/3ricj/FibreSeeker3/issues/41).

**Real wait per change**, from standby at the material's heat-up rate *(Inferred)*, against what the slicer charges (*Behaviour analysis*):

| Head and material (1.4.0 factory standby) | Real wait | Slicer's estimate |
|---|---|---|
| T0 CFC PETG (both fibres) | ≈ 37 s | 0 s |
| T0 CFC PA / CFC PLA | ≈ 22 s / ≈ 41 s | 0 s / 3 s |
| T1 PETG / PET GF / PA CF / PPS CF | ≈ 24 / 27 / 22 / 33 s | 0 / 3.6 / 3.6 / 9 s |
| T1 PLA (preheat off) | ≈ 22 s | ≈ 22 s, the only honest case |

**Measured on the 1.3.1 test files** (*G-code*):

- The slicer charges ≈ 5–6 s per change beyond motion, against 18.2 s (T1) / 28.1 s (T0) of heating at those files' standby values (150 / 180 °C, older than the 1.4.0 factory 120 / 150 °C), and up to 40.6 s for T0 CFC PLA.
- The Reinforced Benchys are under-estimated by ≈ 14–31 % (upper bound, assuming the idle nozzle reaches standby). Direction and size match the behaviour analysis.
- **With 1.4.0 factory standby values a Reinforced job runs roughly a minute per macro layer longer than estimated** *(Inferred)*; with 1.3.1 values about 46 s plus lift and brushing.
- The estimate also charges ≈ 0 for the initial heat-up (3.5–5.4 s charged in the test files) and for the brush, cutter and strand macros.
- **The motion part of the estimate is not optimistic:** it runs 8–17 % above a Klipper-style planner model on the 1.3.1 Benchys and 31 % above on the 1.4.0 file (*Inferred*: a model comparison, not re-run). The shortfall is all in the waits.

**Levers:**

- raise the standby temperature (watch for ooze);
- use fewer macro layers with fibre;
- Z-lift on tool change is a minor lever: 5 mm up and down at 10 mm/s is ≈ 1 s per change.

These are quantified in [Print time](Print-Time.md).

## Temperatures and fans

### Temperatures

- **Commands.** `M104 S T<n>` (no wait) and `M109 S T<n>` (wait, at every tool select); `M140` and `M190` (wait, start only).
- **Chamber commands in every job.** `M141 S0` follows the first `M140`, `M191 S0` follows `M190`, and `M141 S0` follows the final `M140 S0` in every test file (*G-code*, 1.3.1 and 1.4.0). This is because Has heated chamber is effectively on and every factory material has Chamber temperature 0. To keep a heated chamber, set the material's chamber temperature (copy the material first).
- **First-layer rule.**
  - The nozzle uses its first-layer value while Z ≤ First layers temp. height (`FirstLayersHeight`, mm, per material). The start writes the regular nozzle value with `M104` and waits on the first-layer value with `M109` (1.4.0 file: `M104 S245`, `M109 S250`, back to `M104 S245` at the end of layer 1).
  - The bed waits on its **regular** value; a different first-layer bed value is set at layer 1 **without a wait** (1.3.1 PLA: `M190 S55`, then `M140 S60`, back to 55 at layer 2). See [#44](https://github.com/3ricj/FibreSeeker3/issues/44).
  - The bed follows the material of the head active at each layer start (*Behaviour analysis*; no test file pairs different bed temperatures).
  - Factory 1.4.0 first-layer values equal the regular ones, so the only mid-print `M104` lines come from tool changes, and the only `M140` changes from the PPS CF / CFC PA pairing (see [factory-preset anomalies](Factory-Materials-and-Profiles.md)).
- **End of print.** `M104 S0` for each head, `M140 S0` and `M141 S0`.
- **Hardware limits** (*Official* spec): nozzles 350 °C, bed 120 °C, active chamber heating up to 65 °C. The fibre-feed channel has its own melt-zone heater that the slicer never sets (*Community* notes, [HardwareInfo.md](https://github.com/3ricj/FibreSeeker3/blob/main/Exploration/HardwareInfo.md); firmware presumably manages it *(Inferred)*).

### Chamber behaviour (per the manufacturer)

Described by the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35); not independently verified.

| Command | Chamber effect |
|---|---|
| `M141`/`M191` with a target above 0 | PTC heater and cross-flow fan on, louvres closed, exhaust fan off |
| `M141 S0` with a target set | Heater off; cross-flow fan runs about 1 min more to cool the heater |
| Any `M106 P3` (auxiliary) speed | Heater off, cross-flow fan on, louvres open to draw in cold air |

- The community repo owner reports that `M106 P3 S0` also opens the louvres and clears the chamber target, even when auxiliary cooling was not running.
- **Consequences** *(Inferred from that description)*: the start's `M141 S0` cancels a chamber preheated from the panel, and any Cooling-table P3 row cancels chamber heating.

### Fan mapping

| Slicer output | Driven by | Firmware target |
|---|---|---|
| `M106 P0` | Never emitted | Filter fan. Starts when printing starts and stops at finish or abort, independent of chamber heating (manufacturer, [#35](https://github.com/3ricj/FibreSeeker3/issues/35)) |
| `M106 P1` | FFF head's material Cooling settings | FFF (right) nozzle cooling, `fan3` (*Community*; confirmed by the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35)) |
| `M106 P2` | Composite material Cooling settings | Composite (left) nozzle cooling, `fan4` (*Community*; confirmed by the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35)) |
| `M106 P3` | Profile Cooling tab, "Auxiliary cooling fan" column | Auxiliary cooling fan. **Side effects:** chamber (PTC) heater off, cross-flow fan on, louvres open (manufacturer, [#35](https://github.com/3ricj/FibreSeeker3/issues/35)). Auxiliary cooling and chamber heating are mutually exclusive |
| `M106 P5` | Profile Cooling tab, "Exhaust fan" column | Exhaust fan (manufacturer, [#35](https://github.com/3ricj/FibreSeeker3/issues/35)). Off while chamber heating is active. The remap in the community's config notes lists no P5; the manufacturer's statement supersedes it |

- **`M106` is a firmware macro.** Stock Klipper ignores `P`. A plain `M106 S` (no P) would drive both part fans together; the slicer never emits it, nor `M106 P0` or `M107` (*G-code*, all 11 test files). See also [#11](https://github.com/3ricj/FibreSeeker3/issues/11).
- **S value.** S = % × 255 ÷ 100 (integer). 20 % gives 51 and 100 % gives 255.
- **FFF part fan, per entity:** First layers fan speed while Z ≤ First layers fan speed height; otherwise Maximum fan speed if the layer time ≤ Layer time for max fan speed; otherwise Regular fan speed. It steps, with no ramp. The minimum-layer-time slowdown is separate, so small layers get both *(Inferred)*; see [#5](https://github.com/3ricj/FibreSeeker3/issues/5).
- **Composite part fan.** First-layer or regular speed only, with no layer-time rule; constant (50–100 %) with factory data.
- **No bridge fan setting exists.** Only the overhang skin entities can override the fan.
- **Auxiliary/exhaust table.** It writes `M106 P3`/`P5` on the listed output layer numbers, after that layer's markers. Values persist until the next row and **are not switched off at the end** (*G-code*, 1.3.1: the last `P3`/`P5` stays at 255 in nine of the ten Benchys — all but the Speedy PETG file, which has no fan table; the end block zeroes only `M106 P1`). Whether the firmware turns them off at job end is open (see [Open questions](Open-Questions.md)).
- The 1.3.1 PLA start script used `SET_FAN_AT_LAYER` instead ([#7](https://github.com/3ricj/FibreSeeker3/issues/7), [#11](https://github.com/3ricj/FibreSeeker3/issues/11)); no 1.4.0 factory preset contains it.
- Firmware 2.2.38 and later let the exhaust, auxiliary and filter fan speeds be set from the printer UI (*Community*, [FIRMWARE.md](https://github.com/3ricj/FibreSeeker3/blob/main/FIRMWARE.md)).

### Cooling strategy and the printhead temperature alarm

Per the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35):

- For PLA/PETG the factory plan runs auxiliary cooling plus exhaust to lower the chamber temperature.
- A sensor in the printhead housing pauses the print at 53 °C (PLA) / 63 °C (PETG) with an alert that wrongly says "chamber temperature too high" (error 10077, [#10](https://github.com/3ricj/FibreSeeker3/issues/10); see [Printer error codes](Printer-Error-Codes.md)).
- In-chamber fans remove limited heat. **The best way to cool the printhead housing is to open the door and top cover**, which the manufacturer recommends for PLA/PETG and other low-temperature materials in a warm room or on long prints.
- Planned vendor changes: make the heating vs P3 interaction explicit, have the slicer warn on conflicts, and re-check P5, filter fan and louvres during the temperature-alarm pause.

**Chamber-heated jobs** (e.g. PA, PPS): a non-empty "Auxiliary cooling fan" column will switch the chamber heater off at its first row. Clear that column in a copied profile when the chamber must stay hot *(Inferred from the manufacturer's description)*.

## See also

- [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md)
- [Print time](Print-Time.md)
- [Settings: support, cooling and other](Settings-Support-Cooling-and-Other.md)
- [Printer error codes](Printer-Error-Codes.md)
- [Machine overview](Machine-Overview.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
