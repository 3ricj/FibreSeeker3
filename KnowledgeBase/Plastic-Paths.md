# Plastic Paths

This page explains how Rocket Slicer plans the plastic printed by the FFF head: the two families of plastic walls, classic versus adaptive walls, gap fill, seams and wall order, sparse infill and skins, the speed caps the slicer always applies to the plastic head, and how support, brim, skirt and raft behave. It applies to Speedy and Reinforced; Fortified prints no FFF plastic in 1.4.0 (see [Print modes](Print-Modes.md)).

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unless marked otherwise, the behaviour on this page is *Behaviour analysis*: established by analysing the slicer and its preset files. Points checked in exported G-code are marked *G-code* with the version.

## Walls

**Plastic walls come in two families, each with its own count, width, speed and layer height.**

| Family | UI field (key) | Factory | Layer height |
|---|---|---|---|
| Outer wall group | Outer wall (`Inset0Count`) | 2 | Outer-wall micro height |
| Inner plastic walls | Plastic perimeters (`InsetXPCount`) | varies | Their own micro height |
| Inner walls when fibre perimeters are on | P. Outer (`InsetXPOuterWithFiberCount`) and P. Inner (`InsetXPInnerWithFiberCount`) replace Plastic perimeters | see [Fibre paths](Fibre-Paths.md#fibre-perimeters) | Inner-wall micro height |

- "2 outer walls" means **two loops at the fine outer-wall height**, not one outer and one inner wall.
- The sidebar "Plastic Wall" control is the Outer wall count.
- The sidebar "Printing Speed" changes **only the inner-wall speed**.
- **Widths are absolute.** Every factory plastic width in mm (the `…EWMM` keys) is set, between 0.35 and 0.45 mm, so the coefficient values (`…EWCoeff`, 0–1.2) are never used. Changing the nozzle does not change line widths.
- Walls are **spaced** as rounded-rectangle beads but **fed** the volume of a rectangle. Expect slight over-extrusion on walls (*Inferred*). The factory per-feature flow multipliers (0.85–1.0) offset it. Tune walls with the per-feature multipliers.

How the micro layer heights relate to the macro layer is on [How the slicer works](How-the-Slicer-Works.md#macro-and-micro-layers).

## Classic versus adaptive (variable-width) walls

**Keep the classic wall generator on (the factory setting). Adaptive walls ignore most of their tuning fields and abort the slice if they fail.**

| | Classic (factory, all profiles) | Adaptive |
|---|---|---|
| Switch | Use classic wall generator (`UseClassicWallGenerator`) = on | = off |
| Geometry | Fixed-width offsets. The leftover area goes to gap fill or infill. | Arachne-style variable-width walls. Outer and inner walls are planned together. |
| Tuning fields | Width, count | Width and count only. **The six adaptive fields shown in the UI are ignored**; fixed multiples of the nozzle diameter are used instead (see [Settings overview](Settings-Overview.md)) |
| Failure | – | **Aborts the slice** with "Adaptive wall planning failed for …, island …, layer …". There is no fallback to classic. Fix: switch back to classic. |

## Gap fill, seams and wall order

- **Gap fill** (`GapFillEnabled`, factory on) is a variable-width centre line. Gaps narrower than 12 % of the line spacing stay empty.
  - In 1.4.0 output, gap fill carries per-move widths of 0.09–0.61 mm while classic walls stay at 0.4 mm (*G-code*, 1.4.0). The 1.4.0 changelog lists adaptive-width walls and gap infill as new.
  - Enclosed 0.6–1.6 mm voids between walls in 1.3.1 files are reported in [#3](https://github.com/3ricj/FibreSeeker3/issues/3) (*Community*).
- **Wall order:** walls print inside-out in every factory profile (`Inset0PrintOrder` = 1).
- **Seams** follow a painted seam stroke if present, otherwise a concave or hidden corner, optionally shifted by the seam start/distribution settings.
  - With distribution off, seams stack in one spot for 55–124 layers in the real test files ([#2](https://github.com/3ricj/FibreSeeker3/issues/2), *Community*).
  - Fix: paint seams, or enable seam distribution.

## Sparse infill and skins

**Sparse infill**

- 19 sparse patterns are available.
- Line spacing = width ÷ density for Line; × 2 for Grid (two directions per layer); × 3 for Triangles.
- Factory: Grid 15 % in Speedy, Zigzag 20 % in Reinforced, none in Fortified.

**Top and bottom skins**

- Skins have separate classes: topmost, top intermediate, bottommost, bottom intermediate, bridge, overhang and internal solid. Each has its own pattern, width, flow and speed.
- Layer counts are set by Top solid (`InfillSTopLayerCount`) and Bottom solid (`InfillSBottomLayerCount`). Factory: 5 / 3, or 9 / 6 in the 0.1 mm profiles.
- Top and bottom regions are grown up to 0.5 mm into neighbouring solid areas.

**1.4.0 defect: missing intermediate top layers on large roofs.** In a 1.4.0 test file, a large roof with Top solid 5 has a full bridge layer and a full top skin but almost no solid infill on the three layers between (*G-code*, 1.4.0; [#30](https://github.com/3ricj/FibreSeeker3/issues/30)). The manufacturer's reply in #30 says it is a regression from 1.3.2, already fixed internally and due in the next hotfix build (manufacturer statement, not independently verified). Until then, **step through large roofs in the preview before printing**.

## Speed caps the plastic head always applies

**Three limits can override your plastic speeds without telling you.** Their effect on print time is covered on [Print time](Print-Time.md).

### Volumetric cap: 25 mm³/s (1.4.0 only)

- The cap is set by `MaxVolumetricSpeed`, which has no UI field. It is in every factory plastic and appears in 1.4.0 SESSION blocks but not in 1.3.1 ones.
- Confirmed in output: in 1.4.0 G-code, 58 % of 1.86 million moves run at 24.5–25.3 mm³/s and none above (*G-code*, 1.4.0).
- 1.3.1 had no cap and reached 26–61 mm³/s (PETG Benchys 36–61), as reported in [#4](https://github.com/3ricj/FibreSeeker3/issues/4) (*G-code*, 1.3.1).
- The cap is computed from each move's actual extrusion, which includes the flow multipliers. So the capped speed = 25 ÷ (width × height × multiplier):

| Feature | Width × height × multiplier | Capped speed |
|---|---|---|
| Speedy 0.2 mm sparse infill | 0.44 × 0.2 × 1.1 | ≈ 258 mm/s |
| Speedy 0.25 mm sparse infill | 0.44 × 0.25 × 1.1 | ≈ 207 mm/s |
| Reinforced X-CCF sparse infill | 0.45 × 0.24 × 1.0 | ≈ 231 mm/s |

- Faster factory speeds are silently capped. Raising speeds above the cap gains nothing.
- The composite head has no cap.

### Overhang and curl slowdown

Lines are slowed according to how much of each line is unsupported. Curled perimeters are precomputed for this near the end of the slice.

### Minimum layer time

- Factory 10 s.
- All extruding moves on a short layer are scaled to one ceiling speed, with a floor of 10 mm/s (*Behaviour analysis*, 1.4.0). Travel is not slowed.
- In 1.3.1 output the slowdown stopped at ≈ 40 mm/s, leaving 39 measurable Speedy Benchy layers under the target time ([#5](https://github.com/3ricj/FibreSeeker3/issues/5), *G-code*, 1.3.1). 1.4.0 output has not been tested for this.

## Support, brim, skirt, raft

- **Support** is tree type in every factory profile, style Slim. It is on by factory default **only in Reinforced**, so switching to Reinforced silently turns tree support on.
- **Normal (classic) support needs a support line width greater than the macro layer height.** The interface blocks the slice otherwise, and the slice aborts with "… must be greater than MacroLayerHeight … for conventional support".
- **Brim** (factory off) and **skirt** (factory on) are first-layer only.
- **There is no raft.** The setting has no effect on slicing.

Hidden support styles and other options with no UI field are on [Settings overview](Settings-Overview.md); the support settings themselves are on [Settings: support, cooling and other](Settings-Support-Cooling-and-Other.md).

## See also

- [How the slicer works](How-the-Slicer-Works.md)
- [Settings: plastic infill and features](Settings-Plastic-Infill-and-Features.md)
- [Settings: layers and walls](Settings-Layers-and-Walls.md)
- [Troubleshooting: print quality](Troubleshooting-Print-Quality.md)
- [Print time](Print-Time.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
