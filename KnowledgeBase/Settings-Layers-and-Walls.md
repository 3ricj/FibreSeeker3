# Settings Layers and Walls

This page lists the Profile settings for layer thickness, the first layer and plastic walls: the macro (fibre) layer and the micro-layer divisors for each plastic family, the plastic and fibre first-layer fields, and the outer-wall and inner-wall groups. Each row gives the factory value per mode, the factory spread and the trap. Column meanings are on [Settings overview](Settings-Overview.md).

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unmarked claims are *Behaviour analysis*; factory values are from the factory preset files. Factory S / R / F = the profile group "PETG 0.2 mm | CFC PETG+X-CCF / PETG" in Speedy / Reinforced / Fortified.

## Profile › Layer thickness and first layer

**The macro layer is the fibre layer; plastic prints in micro layers inside it.** Each plastic family has its own divisor, so the outer wall can be finer than the infill. When any fibre is generated, the first layer uses the fibre first-layer height instead of First layer height. Layer scheduling is explained on [How the slicer works](How-the-Slicer-Works.md).

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Macrolayer height | `MacroLayerHeight` | mm | 0.2 / 0.24 / 0.24 | S 0.1–0.25; R 0.24–0.3; F 0.24–0.3 | Fibre layer pitch; every plastic micro height = this ÷ its divisor. Higher → faster, coarser. | R/F value is set by the fibre (0.24 X-CCF, 0.30 X-CGF), not the group name. Much lower squashes the bead *(Inferred)*. Changing it rescales all micro heights. |
| Outer wall layer height | `Inset0RatioToMacro` | mm | ÷1 = 0.2 / ÷2 = 0.12 / ÷1 = 0.24 | R ÷1/2; F ÷1/2 | Divisor for the outer-wall micro height (shown in mm). | Stored as an integer 1–10; the stepper skips divisors that give an inexact height. Sidebar "Layer Height" shows macro ÷ this. |
| Plastic perimeters layer height | `InsetXPRatioToMacro` | mm | ÷1 = 0.2 / ÷1 = 0.24 / ÷1 = 0.24 | R ÷1/2; F ÷1/2 | Divisor for inner plastic wall height. | – |
| Infill layer height | `InfillRatioToMacro` | mm | ÷1 = 0.2 / ÷1 = 0.24 / ÷1 = 0.24 | no spread | Divisor for plastic infill height. | – |
| First layer height | `FLThickness` | mm | 0.2 / 0.2 / – | no spread | Plastic first-layer height. | Replaced by the fibre first-layer height whenever fibre is generated (R/F). |
| Fill pattern (first layer) | `BottomMostSkinInfillPattern` |  | Line / Zigzag / – | no spread | First-layer pattern. | – |
| Printing speed (first layer) | `BottomMostSkinSpeed` | mm/s | 50 / 100 / – | S 50–150 | First-layer skin speed. | Walls and infill on layer 0 use `FLSpeed` (50 S / 100 R), which has no UI field (visible in the export's SESSION block). |
| Flow multiplier (first layer) | `BottomMostSkinExtrusionMultP` |  | 1 / 1.1 / – | S 0.91–1; R 1–1.1 | First-layer skin flow. Higher → more squish. | – |
| Layer height (fibre first layer) | `FiberFLThicknessMM` | mm | – / 0.2 / 0.15 | no spread | Intended first-layer height when fibre is on. | **May have no effect**: the slicer may use `FiberFLThickness` (no UI field) instead ([Open questions](Open-Questions.md)). Real 1.3.1 exports carry both: `FiberFLThicknessMM` 0.2 and `FiberFLThickness` 0.24 (not the 0.3 default), with layer 1 at 0.2; still unresolved for 1.4.0. |
| Flow multiplier (fibre first layer) | `FiberFLExtrusionMultP` |  | – / 1.05 / 1.05 | R 1–1.05; F 1–1.05 | First-layer composite matrix flow. | – |
| Speed coefficient (fibre first layer) | `FiberFLSpeedCoeff` |  | – / 1 / 1 | no spread | Scales max/min fibre speeds on layer 0. | Does not scale the speed floors. |

## Profile › Walls

**Plastic walls come in two families: the outer-wall group and the inner plastic walls.** Each has its own count, width, flow, speed and layer height. Widths are absolute millimetres. Every factory profile uses the classic generator and prints walls inside-out. Walls do not exist in Fortified.

**All plastic speeds are silently capped at 25 mm³/s** by `MaxVolumetricSpeed`, a setting with no UI field (factory value in every plastic; visible in the SESSION block of 1.4.0 exports). *G-code*, 1.4.0: 58 % of moves sit at the cap, none above it; 1.3.1 had no cap and reached 26–61 mm³/s. The cap speed is 25 ÷ (width × height × flow multiplier), because the cap is computed from each move's extrusion, which includes the multipliers: about 258 mm/s for Speedy 0.2 mm sparse infill (0.44 × 0.2 mm × 1.1). See [Print time](Print-Time.md) for what this means for speed changes.

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Use classic wall generator | `UseClassicWallGenerator` |  | on / on / – | no spread | On = fixed-width walls; off = adaptive (variable-width) walls. | Off: an adaptive planning failure **aborts the slice**; the six adaptive tuning fields are ignored (see [Settings overview](Settings-Overview.md)). Keep on. |
| Outer wall | `Inset0Count` | loops | 2 / 2 / – | no spread | Number of loops in the outer-wall group, printed at the outer-wall micro height. | Sidebar "Plastic Wall" writes this. Forced 0 in F. "2" = two fine-height loops, not outer + inner. |
| Printing speed (outer wall) | `Inset0Speed` | mm/s | 200 / 200 / – | S 60–200; R 150–200 | Outer-wall speed. Lower → better surface. | Sidebar "Printing Speed" does **not** change it. Plastic is capped at 25 mm³/s (hidden). |
| Outer wall extrusion width | `Inset0EWMM` | mm | 0.4 / 0.4 / – | R 0.4–0.42 | Outer-wall line width (absolute mm). | Widths do not follow nozzle size. |
| Flow multiplier (outer wall) | `Inset0ExtrusionMultP` |  | 1 / 0.9 / – | S 0.88–1; R 0.88–1 | Outer-wall flow, × the material flow. | Walls are fed rectangle volume, so slight over-extrusion is expected *(Inferred)*; tune here. |
| Plastic perimeters | `InsetXPCount` | loops | 1 / 1 / – | S 1–2; R 1–2 | Inner plastic wall loops when fibre perimeters are off. | With fibre perimeters on, P. Outer / P. Inner apply instead. Forced 0 in F. |
| Printing speed (plastic perimeters) | `InsetXPSpeed` | mm/s | 300 / 250 / – | S 120–300; R 250–300 | Inner plastic wall speed. | The only field the sidebar "Printing Speed" writes. |
| Outer contour expansion | `OuterContourExpansion` | mm | 0 / 0 / – | S 0–0.05 | Grows (+) or shrinks (−) the outer contour radius to correct size. | The 1.4.0 slicing step never uses it, so it probably has no effect *(Inferred; confirm with a test slice)*. |
| Holes expansion | `HolesExpansion` | mm | 0 / 0 / – | no spread | Grows (+) or shrinks (−) holes. | The 1.4.0 slicing step never uses it, so it probably has no effect *(Inferred; confirm with a test slice)*. Correct undersized holes in CAD for now. |
| Spiral vase mode | `IsSpiralVase` |  | off / – / – | no spread | Spiral vase. | Speedy only; forced off in R and F. |

**Test for the expansion settings.** Slice a plate with a 5 mm hole at 0 and at +0.3 mm Holes expansion and compare the hole perimeter coordinates in the G-code. If they are identical, the setting does nothing.

## See also

- [Settings overview](Settings-Overview.md)
- [Plastic paths](Plastic-Paths.md)
- [Settings: plastic infill and features](Settings-Plastic-Infill-and-Features.md)
- [Settings: fibre](Settings-Fibre.md)
- [Troubleshooting: print quality](Troubleshooting-Print-Quality.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
