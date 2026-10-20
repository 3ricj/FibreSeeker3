# Fibre Paths

This page explains how Rocket Slicer lays continuous fibre: how fibre perimeters are arranged and when they are dropped, how each fibre infill pattern works, the life cycle every fibre strand follows (restart, start, corners, cut, finish), how Reinforced and Fortified differ where fibre cannot fit, and which problems are dropped silently versus which abort the slice.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unless marked otherwise, the behaviour on this page is *Behaviour analysis*: established by analysing the slicer and its preset files. Points checked in exported G-code are marked *G-code* with the version. Most fibre behaviour is confirmed in 1.3.1 output; for 1.4.0 one factory-profile Fortified Benchy and one Fortified cube have been checked. None of this has yet been checked against physical prints.

## Fibre perimeters

### Layout

**From the outside in, on each macro layer with fibre perimeters on:**

| Order | What | UI field (key) | Factory Reinforced / Fortified |
|---|---|---|---|
| 1 | Plastic outer wall(s) | Outer wall (`Inset0Count`) | 2 / 0 (forced) |
| 2 | Plastic walls outside the fibre | P. Outer (`InsetXPOuterWithFiberCount`) | 1–2 / 0 (forced) |
| 3 | **Fibre loops on the outer contour** | F. Outer (`InsetFOuterCount`) | 2 / 2 |
| 4 | Plastic walls inside the fibre | P. Inner (`InsetXPInnerWithFiberCount`) | 1 / 0 (forced) |
| 5 | Infill (fibre or plastic) | – | – |

- Holes get F. Inner (`InsetFInnerCount`, factory 2) fibre loops on the hole side.
- **Loop pitch = fibre Extrusion width** (`InsetXFEWMM`, factory 0.8 mm). Two loops make a 1.6 mm fibre band on each side.
- A wall too thin to hold the outer plastic walls, the P. Outer walls and at least one 0.8 mm fibre loop gets no fibre perimeter (*Inferred*).
- Fiber shell calculation order (`InsetXFCalcOrder`, factory "Contour first") decides whether the outer contour or the holes claim fibre first where they compete for a thin web (*Inferred*).

### One strand per contour

**All the fibre loops of one contour are joined into a single continuous strand.** Short radial steps connect consecutive loops, so the strand has one start, one cut and one restart (*G-code*, 1.3.1: one fibre-perimeter strand per layer, 2 outer + 2 inner loops).

- Extra loops therefore add little per-strand overhead.
- The joints show as a radial seam on each layer.

### Minimum lengths

**Small parts, small islands and small holes simply get no fibre perimeter, with no message.** Two factory rules decide it:

| Rule | Threshold | Applies to | What happens to the area |
|---|---|---|---|
| Strand must be longer than the cut distance | ≈ **58 mm** (Cut distance, `CutDistance`, CFC extruder) | The joined outer-contour path | Dropped. The area is returned for infill. |
| Each loop must be at least Minimum perimeter length (`MinimumPerimeterLength`) | **55 mm** (built-in default 45) | Each loop | Dropped. The area becomes a solid substitution region (plastic solid in Reinforced). |

With factory settings:

- A round hole needs a loop circumference of at least 55 mm, about **17.5 mm diameter at the loop line**, to get any inner fibre loop (*Inferred*, arithmetic).
- Real 1.3.1 output is consistent: no strand shorter than 63 mm, shortest 70.4 mm of path (*G-code*, 1.3.1). The exact threshold is not pinned down by the data.
- Lowering Minimum perimeter length lets smaller features take fibre, but the cut-distance floor still applies. The tooltip warns of poor lay-up on short contours.

### Other perimeter behaviour

- **Fiber shell adaptive loops** (`MustGenerateFiberPerimeters`). Factory: on in most Fortified profiles, off in Reinforced. It appears to reduce the loop count per contour or hole until the loops fit, instead of dropping them (*Inferred*; the exact rule is not established, see [Open questions](Open-Questions.md)).
- **After-cut straightening.** On the last cut-distance of each strand, where the tow is already cut and has no tension, small fillets made of tiny segments are replaced by sharp corners or chords.
- **Fibre seam.** The strand start follows the fibre seam settings, painted fibre seam strokes, or "Put fiber seam on longest straight edge end". The start is where the restart, approach and anchoring happen, so it is the weakest and most visible point on the loop (*Inferred*).

## Fibre infill

**Fibre infill fills the area left inside the fibre loops and the inner plastic walls.** Each island is first offset by Infill extension into perimeters (`InfillFSolidExtendIntoPerimeters`). Factory Reinforced Solid uses −0.3 mm, which stops the fibre 0.3 mm short of the walls (*Inferred*: sign of the offset).

| Fiber infill pattern (`InfillFType`) | Geometry | Rib spacing (EW = 0.8 mm) | Varies by layer? |
|---|---|---|---|
| Solid (0) | Parallel lines at spacing = EW, linked into long serpentines | 0.8 mm | Angle cycles through Guide directions (`InfillFSolidAngleList`), one entry per macro layer |
| Rhombic grid (1) | Two rib families | 2·EW ÷ density | No |
| Isogrid (2), Reinforced factory | Three families 60° apart (triangles) | 3·EW ÷ density: 20 % → 12 mm, 25 % → 9.6 mm | No: ribs stack into vertical walls |
| Anisogrid (3) | Main ribs at ± half the rib angle, plus transverse ribs | From density and rib angle | No |
| Tetragrid (4) | As anisogrid, with sloped ribs | As anisogrid | **Yes**: ribs lean with Z and form 3-D cells |

### Rules that drop or change fibre infill

- **Minimum strand length = cut distance + 5 mm ≈ 63 mm** (factory). Shorter paths are dropped. In Reinforced they become plastic stubs or residual plastic infill printed by the FFF head. In Fortified they are discarded (*G-code*, 1.4.0; see [Reinforced versus Fortified](#reinforced-versus-fortified-where-plastic-replaces-fibre)).
- **Low densities lose all fibre infill on small parts.** Real 1.3.1 Reinforced Benchys with Isogrid (*G-code*, 1.3.1):

| Density | Fibre-infill strands |
|---|---|
| 10 % | none |
| 20 % (factory) | none |
| 30 % | 5 |
| 60 % and 80 % | 63–68, roughly 70–230 mm long (another path measure gives 76–191 mm) |

  At 10–20 % the rib spacing (12–24 mm) exceeds the 4.8 mm linking limit, so each rib is its own short strand and is dropped (*Inferred*). Reported as [#43](https://github.com/3ricj/FibreSeeker3/issues/43).
- **Minimum line length** (`InfillFSolidMinSegmentLength`, factory 10 mm). Shorter lines are extended, joined or dropped.
- **Solid linking.** Solid lines are linked only across gaps of up to 6 × EW (4.8 mm). Wider gaps start a new strand, which means another cut and restart.
- **Guide directions.** The list cycles one entry per fibre layer (*G-code*, 1.3.1: "0/90/0" gave 60 layers at 0° and 40 at 90°).
  - An empty or invalid Guide directions list gives 0° on every layer.
  - Factory "0" (all Reinforced Solid; 7 of 16 Fortified profiles) is unidirectional (*G-code*, 1.4.0: a factory PLA 0.2 mm Fortified cube laid all 84 fibre-infill layers at 0°; [#47](https://github.com/3ricj/FibreSeeker3/issues/47)).
  - Use "0/90" or "0/60/-60" for in-plane balance.

### Enhancement Magnitude slider (Reinforced only)

- Shown only when the fibre infill type is not Solid. It writes **only** the current pattern's density: steps 0–4 → 0 / 10 / 30 / 60 / 80 %.
- It opens at step 1 whatever the real density (factory 20–25 %), and re-picking the last-written step does nothing. Real 1.3.1 exports fit this: two of six "level" files kept the factory 20 % (*G-code*, 1.3.1; [#40](https://github.com/3ricj/FibreSeeker3/issues/40)).
- Using the keyboard moves the handle but writes nothing.
- Avoid step 0 (behaviour at 0 % is untested); use the Infill switch instead.

## Strand life cycle: start, corners, cut and restart

**Every fibre strand, whether a perimeter or an infill path, follows the same sequence.** Steps 1–8 and their G-code markers are confirmed in real output (*G-code*, 1.3.1, 638 strands). The G-code itself is described on [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md).

1. **Approach.** Travel to an approach point 1 mm (`ZHopF`) behind and above the start.
2. **Restart feed.** Extrude the restart length (Fiber restart length, `FiberRestartLength`, factory **55 mm**) of tow only, at 25 mm/s. Real 1.3.1 output does this on **every** strand, including the first. It probably refills the cutter-to-nozzle path; that tow is laid as the strand's post-cut tail, so it is used, not wasted, but the reported fibre length leaves it out (*Inferred*; [#39](https://github.com/3ricj/FibreSeeker3/issues/39)).
3. **Touch down.** Descend diagonally onto the start point, unretract the matrix and pause (factory 0 s).
4. **Start phase.** Print the first Start length (`FiberStartLength`) mm slowly.
5. **Normal phase.** Print with corner-dependent speed (below) and tension segments.
6. **Cut** before the strand end. The cutter command is `M2800` followed by `M400`. In real 1.3.1 output the path after the cut is 55.6 mm on 611 of 638 strands, i.e. Cut distance 58 − 2 × contact radius 1.2 mm.
7. **Finish phase.** Print the remaining 55.6 mm of already-cut tow (611 of 638 real strands; the rest up to 56.5 mm), with matrix (`V`) but no tow feed (`U`), at the slower Finish speeds. Plastic flow here is scaled by Plastic flow multiplier after cut (`FiberAfterCutExtrusionMultP`, factory 0.65–0.72); exactly where this scaling is applied is not established (*Inferred*).
8. **Ironing tail.** Travel along the end for an ironing tail (factory 8 mm; 6.8–9.2 mm in real output) without extruding. This presses the cut end down.

### Corner speed

**Fibre slows smoothly with curvature, and sharp corners drop to the floor speed.** Each phase has a max speed (straights), a min speed (at Min. arc radius, `FiberMinRadius`, factory 10–12 mm) and a min-speed limit (floor):

v = Vmax ÷ (1 + Rmin · (Vmax/Vmin − 1) ÷ R)

- After a corner, the next Slowing length (`FiberSlowLength`, 5–10 mm) stays at the corner speed.
- The speed coefficients scale max and min, but not the floor.
- The curvature radius at a vertex is segment length ÷ turn angle, with the length capped at Max. arc segment length (`FiberMaxArcSegmentLength`, factory 4–7 mm). A turn between long segments is therefore treated as a tight arc (90° at 7 mm → R ≈ 4.5 mm), which is why sharp corners fall to the floor. The tooltip's "considered a straight line" does not describe this (*Inferred*: which UI field feeds this cap).
- Turns smaller than an angle threshold get Max speed. The threshold's value is not known (see [Open questions](Open-Questions.md)).

Worked example, Reinforced X-CCF (normal phase 30 / 5 / 2 mm/s, Rmin 12 mm):

| Feature | Speed |
|---|---|
| Straight | 30 mm/s |
| Arc of radius 12 mm | 5 mm/s |
| 90° corner | ≈ 2 mm/s, then 5 mm held at that speed |

**Rounded corners are not faster in the slicer's model** (*Inferred*, arithmetic). A fillet runs at the curvature speed along its whole length (5 mm/s at R = 12 mm) and holds it for the Slowing length afterwards, whereas a sharp corner costs only about 5 mm at the floor.

- A 90° fillet of R 12 mm takes about 4.6 s, against about 3 s for the sharp corner over the same span.
- Rounding breaks even only at radii of roughly 70 mm.
- Exception: a fillet tessellated so finely that each vertex turns less than the angle threshold runs at Max speed.
- Rounding still helps the tow lie down (*Inferred*).

### Other strand behaviour

- **Tension segments.** Moves longer than 2 × Tension length + 5 mm feed less tow over their first Tension length (`FiberTensionLength`, factory 2 mm at 20–50 % feed). Confirmed: 2 mm at 50 % feeds 1.0 mm less tow on each strand that gets a segment (19 of 37 strands in the PLA file; the rest had none) (*G-code*, 1.3.1).
- **Trajectory correction.** Moves are extended past corners by the Contact radius / Extended contact radius (`NozzleContactRadius` and its Extended twin) so the tow, which leaves at the rear of the nozzle face, reaches each corner (*Inferred*). Real 1.3.1 strands also contain short `G0` moves (0.1–2.5 mm, no feed) after nearly every fibre `G1`, often backwards at turns: 14–18 % of the strand's nozzle path. These are probably correction moves (*Inferred*).
- **No hard minimum turning radius.** The slicer slows down instead of refusing a tight turn.

### Per-strand overhead

**Each strand costs roughly 7–10 s of fixed overhead, regardless of its length** (*Inferred*): restart feed (55 mm at 10–25 mm/s), approach, the slow start phase, the cut, the slow finish phase over the last 55.6 mm and the 8 mm ironing tail.

- With factory X-CCF/PETG values these steps take about 9.5–11 s, less the ≈ 2 s the same length would take at 30 mm/s.
- CFC PA's 10 mm/s restart adds about 3 s.
- The slicer's built-in defaults (42 mm restart at 10 mm/s, 1 s pause) give 8–10 s.
- **Fewer, longer strands save time.** See [Print time](Print-Time.md).

## Reinforced versus Fortified: where plastic replaces fibre

**Reinforced** runs the full plastic pipeline plus fibre:

- Within a layer, plastic prints first and fibre last (Printing order, `FiberPrintOrder`, factory "Last in layer"). The bead is laid into the space the plastic micro layers leave for it (*Inferred*).
- The plastic under the next fibre layer's footprint is made solid, so the fibre has a continuous bed (*Inferred*: purpose).

**Fortified in 1.4.0.857 has no plastic fallback, and drops what fibre cannot fill without a message** (*G-code*, 1.4.0). A factory Fortified slice of the repo's 3DBenchy (CFC PETG + X-CCF / PETG) shows:

- One tool select (`T0 R`), no `T1` and no plastic-head (`E`) move.
- No extrusion at Z ≈ 25.5–31.8 mm (cabin walls and window pillars) or above Z 40 mm (the chimney). The layer after Z 25.35 is at Z 31.83, so the cabin roof (Z ≈ 32–40 mm) is sliced over nothing. Deck-rim areas at Z 19–25 mm also lose coverage.
- Of the 0.5 mm cells the 1.3.1 Fortified Benchy printed with the FFF head, 17 % have no 1.4.0 extrusion within 0.5 mm.
- No error or warning; the "FORTIFIED mode cannot materialize plastic entities" abort did not fire.

**1.3.1.480 behaved differently** (*G-code*, 1.3.1). Its Fortified Benchy (`Benchy_fortified.gcode` in [Test_files](https://github.com/3ricj/FibreSeeker3/tree/main/Test_files)):

- switches to the FFF head 136 times;
- lays 38.5 m of plastic-head path (1.43 m of PETG) as solid-pitch "Cellular infill" (and a little solid infill);
- has 103 of its 240 layers plastic only, although its SESSION has plastic infill density and wall counts at 0.

The FibreSeeker manual describes the 1.3.1 behaviour: when print length or space is insufficient, plastic infill is used (*Official*). 1.4.0 is therefore a regression against both, and on any model with thin features it can cause a failed print ([#38](https://github.com/3ricj/FibreSeeker3/issues/38)).

| Situation | Reinforced | Fortified (1.4.0) |
|---|---|---|
| Fibre loop shorter than Minimum perimeter length | Plastic solid fill, printed by the FFF head | Area left to solid fibre infill, or empty (*Inferred*) |
| Joined loop path shorter than the cut distance | Area returned to infill | Area to solid fibre infill |
| Fibre infill residuals and short stubs | Plastic infill printed by the FFF head | **Discarded** |
| Region too small for a 63 mm infill strand | Plastic | **Void** (*G-code*, 1.4.0) |
| Thin wall, pillar or tower with no room for fibre | Plastic walls (FFF head) | **Nothing printed**; features above it are sliced over air (*G-code*, 1.4.0) |

**What to do:**

- **In 1.4.0 Fortified, check the preview layer by layer for missing thin features** (walls, pillars, pins, towers, small holes) and for parts left floating above them. The slicer gives no warning. (*Inferred*: the preview shows the sliced paths.)
- Use Reinforced for parts with thin walls, towers or pins: its FFF plastic covers what fibre cannot.
- Or thicken such features until fibre fits (*Inferred*; the minimum width that works has not been measured).
- 1.3.1 Fortified jobs need FFF plastic loaded; 1.4.0 Fortified jobs use only the composite head.
- Fortified's outer surface is the fibre bead, and its dimensional accuracy depends on trajectory correction.

## Dropped silently versus aborted

**The slicer has no warnings channel.** A problem either aborts the slice, showing "Slicing failed: {message}" with the slicer's own text, or the feature is quietly left out. Use Global settings → log export to get the full error detail. The full message list, with fixes, is on [Troubleshooting: slicer messages](Troubleshooting-Slicer-Messages.md).

### Silently dropped (no message)

| What disappears | Why |
|---|---|
| Fibre perimeters on small parts, islands and holes | Joined strand under ≈ 58 mm, or loop under 55 mm |
| Fibre perimeter in thin walls | No room for one 0.8 mm loop after the plastic walls |
| Fibre infill in small regions | Path under ≈ 63 mm |
| Fibre infill residuals in Fortified | No plastic allowed (*G-code*, 1.4.0; 1.3.1 prints them in plastic) |
| Whole thin features in Fortified (walls, pillars, towers) | No room for fibre and no plastic fallback (*G-code*, 1.4.0: Benchy cabin walls and chimney missing; 1.3.1 printed them in plastic) |
| Very narrow gaps | Narrower than 12 % of line spacing |
| Parts too thin to slice | Dropped before slicing. The slice aborts only if no parts are left. |
| Plastic speeds above the volumetric cap | Capped at 25 mm³/s (1.4.0 only) |
| Fibre infill on small parts at low density | All ribs too short to keep (*G-code*, 1.3.1) |

### Aborts the slice

| Message (start) | Typical cause |
|---|---|
| "… layer schedule is invalid: macro height X um must be evenly divisible by ratio N" | A layer-height divisor does not divide the macro height |
| "Adaptive wall planning failed for …" | Classic wall generator off |
| "Cut length not enough" | A fibre strand too short to place the cut |
| "FORTIFIED mode cannot materialize plastic entities on layer N" | A plastic path survived in Fortified (for example a mask or layup re-adding walls or skins). *Behaviour analysis*, 1.4.0; not seen in output. It did not fire on a factory Fortified Benchy that lost whole features, so it guards only against plastic paths that are generated, not against areas fibre cannot fill (*Inferred*) |
| "Part '…' contains multiple masks with priority N…" | Duplicate mask priority |
| "No models to slice or models are too small to be sliced" | Every part is too thin, or the units are wrong |
| "… must be greater than MacroLayerHeight … for conventional support" | Normal support line width ≤ macro height |
| "Classic wall flow produces a non-positive line spacing." | Wall width too small for its layer height |
| Tree-support configuration errors (Chinese text) | Out-of-range tree-support values |

Settings that look editable but have no effect are listed on [Settings overview](Settings-Overview.md).

## See also

- [Print modes](Print-Modes.md)
- [Settings: fibre](Settings-Fibre.md)
- [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md)
- [Troubleshooting: silent behaviours](Troubleshooting-Silent-Behaviours.md)
- [Print time](Print-Time.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
