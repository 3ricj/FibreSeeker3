# Settings Fibre

This page lists the Profile settings that control continuous fibre: the strand speed phases (start, normal, finish) and tension controls in Fiber basics, the Fiber perimeter loop settings, and the Fiber infill pattern, density and direction settings. It also explains the minimum-length rules that silently drop short loops and strands. Each row gives the factory value per mode, the factory spread and the trap. Column meanings are on [Settings overview](Settings-Overview.md).

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unmarked claims are *Behaviour analysis*; factory values are from the factory preset files. Factory S / R / F = the profile group "PETG 0.2 mm | CFC PETG+X-CCF / PETG" in Speedy / Reinforced / Fortified. Fibre sections do not exist in Speedy.

## Profile › Fiber basics: strand speeds and phases

**Every fibre strand runs through start, normal and finish phases, each with a max speed, a min speed and a floor.** Max applies on straights and min on an arc of Min. arc radius; the floor applies at sharp corners. Speed falls smoothly with curvature, and the entity speed coefficients scale max and min but not the floor. Most fields here are expert-only. The strand life cycle is explained on [Fibre paths](Fibre-Paths.md) and [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md).

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Printing order (fibre) | `FiberPrintOrder` |  | – / Last in layer / Last in layer | no spread | When fibre prints in the layer. | Factory "Last in layer": plastic builds the channel, fibre goes in last *(Inferred)*. |
| Max. starting speed | `FiberStartMaxSpeed` | mm/s | – / 4 / 4 | R 3–5; F 3–5 | Max speed in the start phase (first Start length). | All max/min fibre speeds × the speed coefficient. |
| Max. normal speed | `FiberNormalMaxSpeed` | mm/s | – / 30 / 30 | R 20–30; F 15–30 | Straight-line fibre speed. Main fibre time lever. | X-CGF profiles run 15–20. |
| Min. normal speed | `FiberNormalMinSpeed` | mm/s | – / 5 / 5 | R 4–5; F 4–5 | Speed on an arc of Min. arc radius. | – |
| Min. normal speed limit | `FiberNormalMinLimitSpeed` | mm/s | – / 2 / 3 | F 2–3 | Speed floor at sharp corners. | Not scaled by speed coefficients. |
| Max. ending speed | `FiberFinishMaxSpeed` | mm/s | – / 10 / 15 | R 10–15; F 10–15 | Max speed after the cut (last 55.6 mm = 58 − 2 × 1.2 mm contact radius; *G-code*, 1.3.1). | – |
| Min. arc radius | `FiberMinRadius` | mm | – / 12 / 10 | R 10–12; F 10–12 | Radius at which speed reaches Min. Larger → slows earlier. | A fillet of this radius runs at Min. normal speed along its whole length, so in the slicer's model it is not faster than a sharp corner *(Inferred; see [Print time](Print-Time.md))*. Rounding helps lay-down, not time. |
| Slowing length | `FiberSlowLength` | mm | – / 5 / 5 | F 5–10 | Length held at corner speed after a corner. | Longer → better corner lay-down, slower. |
| Tension length | `FiberTensionLength` | mm | – / 2 / 2 | no spread | Length of reduced-feed tension segment on long straights. | Applies only to moves > 2 × this + 5 mm. Measurable: 2 mm at 50 % feeds 1.0 mm less tow on a strand that gets the segment (*G-code*, 1.3.1: 19 of 37 strands). |
| Tension fiber feedrate | `FiberTensionFeedrate` | % | – / 50 / 50 | R 20–50; F 20–50 | Tow feed % on the tension segment. Lower → more tension. | PA CF and PPS CF use 20. Probably appears in the export's SESSION block as `FiberTensionFFeedrate` *(Inferred)*. |
| Tension release fraction | `FiberTensionReleaseFraction` | % | – / 0 / 0 | R 0–100; F 0–100 | Extra feed at line end to release tension. | 100 in PA CF and PPS CF (and R PET GF + X-CCF); 0 elsewhere. |
| Plastic flow multiplier after cut | `FiberAfterCutExtrusionMultP` |  | – / 0.7 / 0.72 | R 0.65–0.7; F 0.65–0.72 | Matrix flow after the cut. | Where the slicer applies it was not established *(Inferred)*. |
| Do Z-hop after cut | `FiberDoZHopAfterCut` |  | – / off / off | no spread | Experimental: lift 1 mm instead of dragging on long after-cut corrections. | – |
| Correction move speed | `CorrectionMoveSpeed` | mm/s | – / 0.1 / 2 | R 0.1–2 | Speed of trajectory-correction moves. | Used only when Override correction move speed (`OverrideCorrectionSegmentSpeed`) is on; otherwise the print speed applies. That switch is off in all 48 factory profiles, so the R 0.1 mm/s value (6 X-CCF PETG/PET GF profiles) is inert *(Inferred)*. Consistent with *G-code* (1.3.1): Reinforced (0.1) and Fortified (2.0) files show the same correction moves. |
| Plastic extrusion compensation ratio | `PlasticExtrusionCompensationRatio` |  | – / 1 / 1 | no spread | Scales composite-head matrix flow. | Despite the name, does not touch the FFF head *(Inferred)*. |
| Fiber extrusion compensation ratio | `FiberExtrusionCompensationRatio` |  | – / 1 / 1 | no spread | Scales composite-head tow feed. | Composite head only *(Inferred)*. |
| Contact radius | `NozzleContactRadius` | mm | – / 0.4 / – | R 0.4–0.7 | Corner overshoot so the tow reaches the corner; an Extended twin applies after the cut. | Shown only in R; F presets lack both (value used in F unknown). |

## Profile › Fiber perimeter

**Fibre loops sit between plastic walls: Outer wall, then P. Outer, then F. Outer fibre loops, then P. Inner.** Holes get F. Inner loops.

**Short loops and strands vanish without a message.** With factory values, a loop shorter than 55 mm (about 17.5 mm hole diameter at the loop line) or a strand shorter than the 58 mm cut distance is dropped (consistent with *G-code*, 1.3.1: no strand under 63 mm, shortest 70 mm). All loops of one contour form one strand (*G-code*, 1.3.1).

- In **Reinforced** the dropped area becomes plastic "Internal solid infill".
- In **1.4.0 Fortified** there is no plastic fallback: an area fibre cannot fill is left empty with no message (*G-code*, 1.4.0: a factory Fortified Benchy lost its cabin walls and chimney; see [#38](https://github.com/3ricj/FibreSeeker3/issues/38)). 1.3.1 Fortified printed such areas in FFF plastic.
- Check the preview, and use Reinforced for thin features (see [Print modes](Print-Modes.md)).

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Generate fiber perimeters | `GenerateFiberPerimeters` |  | – / on / on | no spread | Fibre loops on/off. Sidebar "Shell" (R). | Forced off in S. Not shown in F (always on in factory F). |
| F. Outer | `InsetFOuterCount` | loops | – / 2 / 2 | no spread | Fibre loops along the outer contour. | All loops of one contour form one strand, so extra loops add little overhead *(Inferred)*. |
| F. Inner | `InsetFInnerCount` | loops | – / 2 / 2 | no spread | Fibre loops around holes. | Not in the mask form (copied from the profile). |
| P. Outer | `InsetXPOuterWithFiberCount` | loops | – / 1 / – | R 1–2 | Plastic walls outside the fibre (R). | Forced 0 in F. |
| P. Inner | `InsetXPInnerWithFiberCount` | loops | – / 1 / – | no spread | Plastic walls inside the fibre (R). | Forced 0 in F. |
| Extrusion width (fibre perimeter) | `InsetXFEWMM` | mm | – / 0.8 / 0.8 | no spread | Fibre bead width = loop pitch. | Each loop takes 0.8 mm; thin walls lose fibre. |
| Minimum perimeter length | `MinimumPerimeterLength` | mm | – / 55 / 55 | no spread | Shortest loop kept. Lower → smaller holes get fibre. | Strand must also exceed the 58 mm cut distance; short loops vanish silently. |
| Printing speed coefficient (perimeter) | `InsetXFSpeedCoeff` |  | – / 1 / 1 | no spread | Multiplies all perimeter fibre speeds. | Floors not scaled. |
| Fiber shell calculation order | `InsetXFCalcOrder` |  | – / Contour first / Contour first | no spread | Contour first or holes first. | Decides who gets fibre on a thin web *(Inferred)*. |
| Fiber shell adaptive loops | `MustGenerateFiberPerimeters` |  | – / off / on | F off/on | "Fiber shell adaptive loops": reduce loop count to fit *(Inferred)*. | Exact rule not established. |
| Adjust seam start position (fiber) | `EnableAdjustSeamStartPositionFiber` |  | – / off / on | F off/on | Expert. Offset the fibre strand start. | On → turns "longest edge" off (UI rule). |
| Put fiber seam on longest straight edge end | `PutFiberSeamOnLongestEdgeEnd` |  | – / off / off | no spread | Put strand start at the end of the longest straight. | On → turns both adjust options off. |

The seam brush panel says "Applies to plastic shell only", but the "Seam Fibers" brush is also used for fibre seams.

## Profile › Fiber infill

**Fibre infill fills the area inside the fibre loops.** Reinforced factory profiles use Isogrid at 20–25 %. Fortified forces Solid, so only the Solid fields act there.

- **Short strands are dropped.** Any strand shorter than about 63 mm (cut distance + 5 mm) is dropped (consistent with *G-code*, 1.3.1: shortest strand 70.4 mm of path). On small parts this removes all fibre infill at low densities: a Benchy at the factory 20 % Isogrid got none (see [#43](https://github.com/3ricj/FibreSeeker3/issues/43)).
- **Solid lines link only across small gaps.** Solid lines link across gaps up to 6 × width (4.8 mm); wider gaps start a new strand, with its own cut and restart.
- **Density limits.** The profile allows densities of 0–80 % for every type.

| UI label | Key | Unit | Factory S / R / F | Factory range | What it does | Gotcha |
|---|---|---|---|---|---|---|
| Generate fiber infills | `GenerateFiberInfill` |  | – / on / on | no spread | Fibre infill on/off. Sidebar "Infill" (R). | Forced off in S. |
| Fiber infill pattern | `InfillFType` |  | – / Isogrid / Solid | no spread | Solid, Rhombic, Isogrid, Anisogrid, Tetragrid. | Forced Solid in F. Sidebar "Infill Type". |
| Extrusion width (solid) | `InfillFSolidEW` | mm | – / 0.8 / 0.8 | F 0.7–0.8 | Solid line spacing/width. | – |
| Guide directions (°/°/°...) | `InfillFSolidAngleList` |  | – / "0" / "0/90/0" | F "0"/"0/90/0" | Solid direction per macro layer, cycled ("0/90"). *G-code* (1.3.1): "0/90/0" gave 60 layers at 0° and 40 at 90°. *G-code* (1.4.0): factory PLA 0.2mm Fortified ("0") laid all 84 fibre-infill layers of a 60 × 60 × 20 mm cube at 0° (*Community*, [#47](https://github.com/3ricj/FibreSeeker3/issues/47)). | "0" = all layers one way (7 of 16 F profiles). New layups force "0/45/-45/90". |
| Infill extension into perimeters | `InfillFSolidExtendIntoPerimeters` | mm | – / -0.3 / 0 | no spread | Offset of solid fibre into the walls (mm). | R −0.3 stops 0.3 mm short *(Inferred sign)*. |
| Minimum line length (solid) | `InfillFSolidMinSegmentLength` | mm | – / 10 / 10 | no spread | Shorter solid lines are extended, joined or dropped. | Separate from the ≈63 mm minimum strand. |
| Extrusion width (cellular) | `InfillFCellularEWMM` | mm | – / 0.8 / 0.8 | F 0.7–0.8 | Cellular rib width. | Rib spacing ∝ width ÷ density. |
| Fill density (Isogrid) | `InfillFIsogridFillDensity` | % | – / 20 / 25 | R 20–25 | Isogrid density. Pitch = 3 × 0.8 ÷ density (20 % → 12 mm). | Sidebar Infill Density / Enhancement Magnitude write this when Isogrid. |
| Fill density (Rhombic) | `InfillFRhombicFillDensity` | % | – / 25 / 30 | R 20–25 | Rhombic density. | Its limits are used by the sidebar density for every type. |
| Fill density (Tetragrid) | `InfillFTetragridFillDensity` | % | – / 25 / 30 | R 20–25 | Tetragrid density. | Profile max 80 % for all types. |
| Rib slope angle (Tetragrid) | `InfillFTetragridSideAngle` | ° | – / 60 / 60 | no spread | Rib slope from horizontal; ribs lean with Z. | Only Tetragrid varies by layer. |

**Enhancement Magnitude** (Reinforced sidebar) writes only the density of the selected fibre infill type, in steps of 0 / 10 / 30 / 60 / 80 %, and opens at step 1 whatever the profile holds; details on [Settings overview](Settings-Overview.md) and [#40](https://github.com/3ricj/FibreSeeker3/issues/40).

## See also

- [Fibre paths](Fibre-Paths.md)
- [Settings overview](Settings-Overview.md)
- [Masks and layups](Masks-and-Layups.md)
- [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md)
- [Troubleshooting: silent behaviours](Troubleshooting-Silent-Behaviours.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
