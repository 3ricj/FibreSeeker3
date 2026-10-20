# Settings Material Extruder Printer

This page lists the Plastic, Composite, Extruder and Printer settings that matter most: temperatures, Z-hop and Z-lift heights, composite flow and tow settings, the hardware cut and restart lengths, and the printer's chamber, Z-travel and acceleration values. It also explains which printer preset values are actually used. Column meanings are on [Settings overview](Settings-Overview.md).

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unmarked claims are *Behaviour analysis*; factory values are from the factory preset files.

## Material, extruder and printer settings

**Material and printer values combine with the profile; they never override it.** For example, extrusion = material flow × the profile's per-entity multiplier, and line width = the profile width in mm (or coefficient × nozzle diameter when that is 0). Baselines are PETG (FFF), CFC PETG + X-CCF (composite) and the single factory printer and extruder rows. Ranges run over 5 plastics and 4 composites. Full per-material tables are on [Factory materials and profiles](Factory-Materials-and-Profiles.md).

| UI label | Key | Unit | Factory baseline | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Extruder temperature (FFF plastic) | `TemperaturePrint` | °C | 250 | 220–330 | FFF nozzle temperature. | PPS CF needs 330 °C. |
| Extruder standby temperature (FFF plastic) | `TemperatureWait` | °C | 120 | 100–150 | FFF standby while the other head prints (R). | Lower standby → longer reheat at each head change *(Inferred)*. |
| Build plate temperature (FFF plastic) | `BedTemperature` | °C | 75 | 55–85 | Bed temperature. | Bed follows the active head's material; set both materials equal. |
| Layer time for max fan speed (FFF plastic) | `LayerTimeForMaxCooling` | s | 4 | 2–5 | Layer time below which fan goes to max. | Integer only. |
| Z-hop height (FFF plastic) | `ZHopP` | mm | 0.4 | no spread | Z-hop height. | Height for the profile's "Do Z-hop" *(Inferred)*. |
| Coast length (FFF plastic) | `CoastAtEndLength` | mm | 0 | no spread | Coast length. | 0 makes profile coast inert. |
| Extra unretract on tool change (FFF plastic) | `ExtraLengthPOnToolChange` | mm | -1 | -1–1 | Extra unretract on tool change. | Used only if printer "Do unretract before tool change" is on (factory off). For the composite matrix, 1.3.1 output does include the material's extra length in the restart unretract (−1 in CFC PLA); scope unresolved. |
| Plastic flow multiplier (composite) | `ExtrusionMultiplierP` |  | 0.8 | 0.68–0.8 | Matrix flow of the composite. | X-CGF 0.68, X-CCF 0.8. |
| Fiber diameter (composite) | `FiberDiameter` | mm | 0.25 | 0.25–0.35 | Tow diameter; drives the macro layer choice. | – |
| Extruder temperature (composite) | `TemperaturePrint` | °C | 270 | 230–270 | Composite nozzle temperature. | – |
| Z-lift on restart (composite) | `ZHopF` | mm | 1 | no spread | Lift for the approach to each strand start. | – |
| Fiber extrusion speed (composite) | `ExtrusionSpeedF` | mm/s | 25 | 10–25 | Tow feed speed for the 55 mm restart. | Per-strand overhead; PA composite 10 mm/s. |
| Cut distance (CFC extruder) | `CutDistance` | mm | 58 | no spread | Tow length between cut and strand end; minimum strand ≈ this. | Manufacturer-only value; do not change. Real 1.3.1 strands lay 55.6 mm after the cut (58 − 2 × 1.2 mm contact radius). The `;CUT DISTANCE 54.8` comment is fixed text. |
| Fiber restart length (CFC extruder) | `FiberRestartLength` | mm | 55 | no spread | Tow pushed out after each cut. | Hardware value. Fed at the start of **every** strand (`G1 F1500 U55`), and left out of the reported fibre length, weight and cost (*G-code*, 1.3.1; [#39](https://github.com/3ricj/FibreSeeker3/issues/39)). |
| Nozzle diameter (FFF extruder) | `NozzleDiameter` | mm | 0.4 | no spread | FFF nozzle. | Line widths are absolute; a new nozzle needs width edits. |
| Enable jerk control (printer) | `UseJerks` |  | off | no spread | Emit jerk lines. | Off: no M205. Jerk X/Y/Z/E, Outer wall jerk and Regular jerk are therefore not emitted. |
| Has heated chamber (printer) | `HasHeatedChamber` |  | on (preset base; its `…Over` "off" is not applied) | no spread | Chamber control. | With material chamber 0, every job sends `M141 S0` / `M191 S0` at start and `M141 S0` at end (*G-code*, 1.3.1 and 1.4.0). `M141 S0` with a target set switches the chamber heater off (per the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35)), so a chamber preheated from the panel is cancelled at job start *(Inferred, untested)*. |
| Z travel speed (printer) | `TravelSpeedZ` | mm/s | 10 (`…Over` 5 not applied) | no spread | Z-only moves (`F600`). | *G-code* confirmed. |
| Z-lift on tool change (printer) | `ZLiftOnToolChange` | mm | 5 (`…Over` 10 not applied) | no spread | Lift before every head change, and once after the skirt. | ≈ 1 s per change; a minor time lever. Appears in the export's SESSION block as `ZLiftOnToolchange`. |
| Regular acceleration (printer) | `RegularAcceleration` | mm/s² | 8000 (`…Over` 5000 not applied) | no spread | Used by entities without their own acceleration (gap infill in 1.4.0, overhang infill in 1.3.1). | Emitted as `M204 S8000`; other entities run at 5000. |

## Printer preset values that are never used

**The printer preset ships `…Over` values, but real exports use the base values.** The preset holds Z travel 5 mm/s, Z-lift 10 mm, heated chamber off and regular acceleration 5000 as `…Over` values; real exports (1.3.1 and 1.4.0) carry the base values 10 mm/s / 5 mm / on / 8000 mm/s² (*G-code*). The UI writes edits to the base value, never to `…Over`. Every real export's `; SESSION:` block shows `Edition` 4 (*G-code*, 1.3.1 and 1.4.0), the edition in which these `…Over` values are not applied *(Inferred)*.

## Practical notes

- **Bed temperature follows the active head's material.** Set the plastic and the composite to the same bed temperature to avoid changes mid-print. See [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md).
- **Changing the FFF nozzle does not rescale widths.** Line widths in the profile are absolute millimetres; edit them by hand.
- **Cut distance and restart length are hardware values.** Don't change them; they set the minimum strand length (about 58 mm, so loops and strands under about 63 mm are dropped; see [Settings: fibre](Settings-Fibre.md)).
- **The restart tow is not in the estimate.** The 55 mm restart fed at every strand start is missing from the reported fibre length, weight and cost ([#39](https://github.com/3ricj/FibreSeeker3/issues/39)).

## See also

- [Factory materials and profiles](Factory-Materials-and-Profiles.md)
- [Machine overview](Machine-Overview.md)
- [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)
- [Motion settings](Motion-Settings.md)
- [Settings overview](Settings-Overview.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
