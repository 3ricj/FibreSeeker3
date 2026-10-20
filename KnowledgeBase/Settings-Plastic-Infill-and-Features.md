# Settings Plastic Infill and Features

This page lists the Profile settings for plastic skins (top, bottom, internal solid and micro infill), plastic sparse infill, and the plastic-only feature sections: brim, skirt, overhang slowdown, bridges and gap infill. Each row gives the factory value per mode, the factory spread and the trap. None of these print in Fortified. Column meanings are on [Settings overview](Settings-Overview.md).

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unmarked claims are *Behaviour analysis*; factory values are from the factory preset files. Factory S / R / F = the profile group "PETG 0.2 mm | CFC PETG+X-CCF / PETG" in Speedy / Reinforced / Fortified.

## Profile › Plastic solid and micro infill

**Skins have separate classes, each with its own pattern, width, flow and speed.** "Internal solid infill" (`ReplaceFiberPlasticSolid…`) is the plastic solid printed in Reinforced where fibre loops were rejected (too short, too small a hole). None of these print in Fortified.

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Top solid | `InfillSTopLayerCount` | layers | 5 / 5 / – | S 5–9 | Top solid skin layers. | Forced 0 in F (PA CF F preset holds 5; ignored). |
| Bottom solid | `InfillSBottomLayerCount` | layers | 3 / 3 / – | S 3–6 | Bottom solid skin layers. | Forced 0 in F. |
| Fill pattern (top-most) | `TopMostSkinInfillPattern` |  | Zigzag / Zigzag / – | no spread | Visible top surface pattern. | – |
| Printing speed (top-most) | `TopMostSkinSpeed` | mm/s | 100 / 200 / – | S 50–100; R 150–200 | Top surface speed. Lower → smoother top. | – |
| Flow multiplier (top intermediate) | `TopIntermediateSkinExtrusionMultP` |  | 0.9 / 0.6 / – | S 0.9–0.95; R 0.6–0.7 | Flow of skins below the top. | R factory 0.6–0.7, much lower than S. |
| Infill/Wall overlap (top intermediate) | `TopIntermediateSkinInfillExtendIntoPerimeterRatio` |  | 0.1 / 0.1 / – | S -0.4–0.1; R 0–0.1 | Skin/wall overlap (ratio). Higher → better bond, blob risk. | Speedy PLA 0.25 has −0.4 (pulls skin off walls). |
| Fill pattern (internal solid) | `ReplaceFiberPlasticSolidInfillPattern` |  | Concentric / Concentric / – | no spread | Plastic solid printed where fibre loops are rejected (R). | Tooltip wrongly says "bottom solid skin". |
| Printing speed (internal solid) | `ReplaceFiberPlasticSolidSpeed` | mm/s | 50 / 200 / – | R 150–200 | Speed of that substitute solid. | R only in practice; F has no plastic fallback in 1.4.0 (*G-code*, 1.4.0: no plastic-head move in a Fortified Benchy). 1.3.1 Fortified did print plastic. |
| Flow multiplier (internal solid) | `ReplaceFiberPlasticSolidExtrusionMultP` |  | 1 / 0.9 / – | R 0.85–0.9 | Flow of that substitute solid. | – |
| Use micro infill on top surfaces (Beta) | `TopUseMicroInfill` |  | off / off / – | no spread | Beta: micro infill on top surfaces. | Behaviour not established; leave off. |
| Fill pattern (sparse) | `InfillPCellularFillType` |  | Grid / Zigzag / – | no spread | Plastic sparse infill pattern (19 options). | Sidebar "Infill Pattern". At 100 % only Line/Zigzag/Concentric are allowed (prompt). |
| Fill density (sparse) | `InfillPCellularFillDensity` | % | 15 / 20 / – | no spread | Sparse infill density. | Sidebar "Infill Density". Forced 0 in F. Integer only. |
| Printing speed (sparse) | `InfillPCellularSpeed` | mm/s | 300 / 300 / – | S 150–300; R 250–300 | Sparse infill speed. | In 1.4.0, 300 mm/s already exceeds the 25 mm³/s cap (≈258 mm/s for S 0.2 mm at 0.44 × 0.2 mm × flow 1.1; ≈231 mm/s for R X-CCF at 0.45 × 0.24 mm); raising it gains nothing. |
| Fill angle offset (sparse) | `InfillPCellularFillAngleStep` | ° | 90 / 90 / – | S 0–90 | Angle change per layer. | Speedy PET GF 0.25 has 0 (all layers one direction). |

**Sidebar 100 % prompt.** Typing 100 % sparse density with a pattern other than Line, Zigzag or Concentric (or picking such a pattern at 100 %) brings up a prompt: Yes switches to Zigzag; No resets density to the built-in default, 50 %.

The role of the micro infill settings (`InfillPMicro…`, `TopUseMicroInfill`) has not been established; see [Open questions](Open-Questions.md).

## Profile › Brim, skirt, overhang, bridge and gap infill

**These are plastic-only sections, absent in Fortified.** Brim (factory off) and skirt (factory on, 2–3 loops) are first-layer only, and there is no raft. Overhang slowdown scales wall speed by the unsupported fraction of the line.

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Generate brim | `GenerateBrim` |  | off / off / – | no spread | Brim on/off. | First layer only. No raft exists. |
| Slow down at overhang | `EnableSlowDownAtOverhang` |  | on / on / – | no spread | Slows walls by unsupported fraction. | Not passed to the slicer in F. |
| Slow down for curled perimeters | `EnableSlowDownAtPredictedWallCurl` |  | on / on / – | no spread | Extra slowdown for predicted curl. | Needs overhang slowdown on. |
| 50 % overhang speed | `Percent50OverhangSpeed` | mm/s | 50 / 30 / – | R 30–50 | Wall speed at 50 % overhang. | Integer only. |
| Printing speed (bridge) | `BridgeSpeed` | mm/s | 50 / 80 / – | S 20–150; R 50–100 | Bridge infill speed. | – |
| Flow multiplier (bridge) | `BridgeExtrusionMultP` |  | 1 / 0.8 / – | S 0.91–1; R 0.7–0.85 | Bridge flow. Lower → less sag. | – |
| Enable gap infill | `GapFillEnabled` |  | on / on / – | no spread | Variable-width fill of thin gaps. | Not shown in F; a plastic path in F aborts the slice (*Behaviour analysis*, untested in 1.4.0 output). In 1.4.0 output gap infill carries widths of 0.09–0.61 mm and prints at the printer's regular acceleration, 8000 mm/s² (*G-code*, 1.4.0). |
| Gap fill flow ratio | `GapFillFlowRatio` | % | 100 % / 90 % / – | R 80–90 % | Gap-fill flow. | Stored 0.5–1.5, shown ×100 %. |

## See also

- [Settings overview](Settings-Overview.md)
- [Settings: layers and walls](Settings-Layers-and-Walls.md)
- [Plastic paths](Plastic-Paths.md)
- [Print modes](Print-Modes.md)
- [Print time](Print-Time.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
