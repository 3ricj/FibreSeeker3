# Print Time

On the FibreSeeker 3, print time is set less by plastic speed than by three things the speed fields barely touch: tool changes in Reinforced (about a minute of real heating and moving per fibre layer), per-strand fibre overhead (about 7–10 s per strand), and fibre corner slowdown (about 2 mm/s at a sharp corner). This page sets out where the time goes in each mode, why the slicer's estimate runs low, which levers actually shorten real prints and what each costs, and which settings to leave alone.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## How to use this page

**Judge every change by real print time, not by the slicer's estimate.** The estimate leaves out or under-counts exactly the costs that dominate fibre prints (next section). A change that cuts tool-change waiting barely moves the estimate. A change that raises plastic speeds above the hidden cap moves neither the estimate nor the real time.

- **Calibrate once:** print a representative job and compare Moonraker's `print_stats` time with the slicer's figure. The ratio is fairly stable for a given profile (*Inferred*).
- **Use the preview:** the side panel's **Time** toggle splits the estimate by toolhead and by line type. The **Volumetric Flow** and **Speed** colour modes show where the plastic cap bites. The layer slider shows per-layer time. All of these are the slicer's own estimate, so they share its blind spots.
- **Evidence labels** follow [Evidence and versions](Evidence-and-Versions.md). Unmarked prose is *Behaviour analysis* of the slicer and its factory presets. Real exported G-code has been checked (ten 1.3.1.480 test files, one 1.4.0.857 Plastic Only file and one 1.4.0.857 Fortified Benchy), including the slicer's time estimate against a Klipper-style motion model. **No physical print has been timed**, so the time figures below are arithmetic from factory values, cross-checked against those files.
- **Conventions:** settings are given as UI label (`SettingKey`). Factory values are for the "PETG 0.2 mm | CFC PETG+X-CCF / PETG" group unless stated. S / R / F = Speedy / Reinforced / Fortified. ↑ = raise, ↓ = lower. Factory templates are view-only, so duplicate the group before editing. Where each setting lives, its range and its traps are in [Settings overview](Settings-Overview.md); the mechanisms are in [How the slicer works](How-the-Slicer-Works.md).

## Where the time goes, and why the estimate runs low

**Short answer:**

- **Speedy:** time is plastic motion, capped at 25 mm³/s.
- **Reinforced:** time is tool changes, fibre strands and plastic, roughly in that order on small and medium parts (*Inferred*).
- **Fortified:** time is fibre motion. Every cubic millimetre is laid by a 0.8 mm fibre bead at 30 mm/s or less, slowing to about 2–3 mm/s at every sharp turn.

| Mode | Dominant cost | Scales with | Slicer estimate |
|---|---|---|---|
| Speedy | Plastic extrusion at ≤ 25 mm³/s; minimum layer time on small parts | Part volume and layer count | Roughly right, apart from heat-up; the motion part ran 8–31 % above a Klipper-style model on real files (1.3.1 and 1.4.0) |
| Reinforced | Two tool changes per fibre (macro) layer; fibre strand overhead and corners; plastic | Number of macro layers with fibre; strand count | **Low by about 1 min per macro layer** with factory temperatures (*Inferred*) |
| Fortified | Solid fibre lines and their turns; perimeter strands | Cross-section area × number of macro layers | Low on corners and short segments (*Inferred*) |

### Why the estimate is low

The slicer's time planner writes the trailer time that the print card shows. On this printer it is a lower bound, for four reasons (detail in [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)):

1. **Initial heat-up is counted as about 0 s.** The start code sets the targets with `M104`/`M140` before the waiting `M109`/`M190`, so the planner charges almost nothing for the waits (*G-code*, 1.3.1: 3.5–4.3 s for the whole start; 1.4.0: ≈ 5.4 s). The real heat-up is at least about 60–90 s at the configured rates (bed 0.9 °C/s, nozzles 3.2 / 5.5 °C/s), and typically several minutes for the bed.
2. **Tool changes are charged about 5–6 s for an 18–41 s real wait** ([#41](https://github.com/3ricj/FibreSeeker3/issues/41)). On the SK3 the preheat `M104` is written seconds before the `M109`. The planner charges heat-up from the preheat value it has just set, but the nozzle is physically at standby (table below). Measured on the 1.3.1 Reinforced files: ≈ 5–6 s per change beyond motion (*G-code*, 1.3.1). On top of the wait, each change costs about 1 s of Z lift (5 mm up and down at 10 mm/s), which is counted, and brush macros, which are counted as ≈ 0 s.
3. **The motion model is not the problem.** The planner uses classic jerk (20 mm/s) and a 16-block look-ahead (*Behaviour analysis*), while the firmware is Klipper (square-corner velocity 1 mm/s on T0, 5 mm/s on T1, minimum cruise ratio 0.8 in R/F). Behaviour analysis suggested corners would run slower than planned, but on the real files the slicer's motion time is **8–17 % above** a Klipper-style planner model (1.3.1 Benchys) and **31 % above** on the 1.4.0 Plastic Only file (*Inferred*: a model comparison, not re-run). Minimum cruise ratio, not modelled there, may close some of that gap (*Inferred*).
4. **Fibre macros are charged little or nothing:** the cutter (`M2800` + `M400`, a small constant), brush macros (≈ 0 s) and raw macro lines (0 s) (*G-code*, 1.3.1). Their real duration is unknown.

Real wait per tool change against the estimate, 1.4.0 factory temperatures (estimate column from *Behaviour analysis*; the measured 1.3.1 charge is ≈ 5–6 s per change):

| Head and material | Estimate | Real wait (*Inferred*) |
|---|---|---|
| T0 CFC PETG (X-CCF or CGF) | 0 s | ≈ 37 s |
| T0 CFC PA | 0 s | ≈ 22 s |
| T0 CFC PLA | 3 s | ≈ 41 s |
| T1 PETG | 0 s | ≈ 24 s |
| T1 PET GF / PA CF / PPS CF | 3.6 / 3.6 / 9 s | ≈ 27 / 22 / 33 s |
| T1 PLA (preheat off) | ≈ 22 s | ≈ 22 s (the only honest case) |

**Rule of thumb** (*Inferred*): real Reinforced time ≈ estimate + initial heat-up + (number of tool changes × about 20–35 s), then more on fibre-heavy and detailed parts. On the real 1.3.1 Reinforced Benchys this puts the estimate ≈ 14–31 % low (an upper bound: it assumes the idle nozzle cools fully to standby). The 1.3.1 files used standby 150 / 180 °C (18 s / 28 s reheat); the 1.4.0 factory values (120 / 150 °C) make each reheat longer (24 s / 37 s).

**Making the estimate honest.** Turning Enable preheat (`EnablePreheat`) off makes the planner charge heat-up from standby, as it already does for PLA. On this printer that should barely change the real time, because the preheat leads the `M109` by only seconds (*Inferred*, untested). It is a way to get a truer estimate, not a speed lever.

## A time budget model per mode

**Real time ≈ heat-up + Σ over layers of (plastic motion + fibre strands + tool changes), with short layers stretched to the minimum layer time** (*Inferred* structure). Each term has its own levers.

### Plastic motion (Speedy, Reinforced)

- **Speed per move** = min(entity speed, volumetric cap, overhang slowdown, cooling slowdown). The cap is Max volumetric speed (`MaxVolumetricSpeed`), 25 mm³/s in every factory plastic, with **no UI field**. The composite head has no cap.
- **The cap is 1.4.0 behaviour:** *G-code*, 1.4.0: 58 % of moves at 24.5–25.3 mm³/s, none above. It is absent in 1.3.1, which ran up to 26–61 mm³/s ([#4](https://github.com/3ricj/FibreSeeker3/issues/4)).
- **Cap speed = 25 ÷ (width × height × flow multiplier).** This is established: the cap is computed from each move's extrusion (E), and E already includes the material and per-entity multipliers. With factory values (*Inferred* arithmetic):

| Feature | Line (mm) × multiplier | Cap | Factory speed | Capped? |
|---|---|---|---|---|
| R sparse infill, X-CCF (0.24 mm) | 0.45 × 0.24 × 1.0 | ≈ 231 mm/s | 300 | **Yes** |
| R sparse infill, X-CGF (0.30 mm) | 0.45 × 0.30 × 1.0 | ≈ 185 mm/s | 250–300 | **Yes** |
| R inner walls, X-CCF | 0.42 × 0.24 × 0.9 | ≈ 276 mm/s | 250 | No |
| S 0.2 sparse infill | 0.44 × 0.2 × 1.1 | ≈ 258 mm/s | 300 | **Yes** |
| S 0.25 sparse infill | 0.44 × 0.25 × 1.1 | ≈ 207 mm/s | 150–300 | Mostly |

- **Consequence:** once a feature is at the cap, its time is its **volume ÷ 25 mm³/s**, whatever the speed field, layer height or line width. Only less volume (lower density, fewer walls or skins) makes it faster (*Inferred*).
- **Accelerations:** 5000 mm/s² for every entity with its own field; travel is 500 mm/s. Entities without their own field use the printer's regular acceleration, 8000 mm/s²: gap infill in 1.4.0, overhang infill in 1.3.1 (*G-code*, 1.3.1 and 1.4.0). Klipper's minimum cruise ratio of 0.8 in R/F slows short moves further. See [Motion settings](Motion-Settings.md).

### Fibre strands (Reinforced, Fortified)

**Time per strand ≈ fixed overhead + length ÷ straight speed + a penalty for every corner.**

| Overhead step (factory X-CCF/PETG) | Approximate time (*Inferred*) |
|---|---|
| Restart: 55 mm of tow at 25 mm/s (CFC PA 10 mm/s) | ≈ 2 s (≈ 5.5 s) |
| Approach (1 mm lift), restart pause (factory 0 s) | small |
| Start phase: first 6–8 mm at ≤ 4 mm/s | ≈ 1.5–2 s |
| Cut (`M2800` + `M400`) | ≈ 0.2 s + sync |
| Finish phase: last 55.6 mm after the cut at 10–15 mm/s max (length *G-code*, 1.3.1) | ≈ 4–6 s |
| Ironing tail: 8 mm at about 6.5 mm/s | ≈ 1 s |
| **Total** | **≈ 9.5–11 s for these steps; ≈ 7–9 s more than the same ≈ 65 mm would take at 30 mm/s. Use ≈ 7–10 s per strand, regardless of length (CFC PA ≈ 3 s more)** |

- **What counts as a strand:**
  - Each contour's fibre loops form one strand. Each hole with F. Inner loops is another.
  - Each solid-infill serpentine is one, but a new strand starts across any gap over 4.8 mm. Each island starts its own strand.
  - Cellular ribs: on real 1.3.1 Benchys, Isogrid at 60–80 % linked into strands of roughly 70–230 mm (63–68 infill strands over 37 fibre layers; a stricter path measure gives 76–191 mm), while at 10–20 % no rib strand survived at all (*Inferred*: ribs farther apart than the 4.8 mm linking limit stay separate, and each is too short). See [Fibre paths](Fibre-Paths.md).
- **Straights:** Max. normal speed (`FiberNormalMaxSpeed`) is 30 mm/s for X-CCF and 15–20 mm/s for X-CGF. At best, a 0.8 × 0.24 mm X-CCF bead lays about 5.8 mm³/s, under a quarter of the plastic cap (*Inferred*).
- **Corners:** v = Vmax ÷ (1 + Rmin·(Vmax/Vmin − 1)/R), floored at Min. normal speed limit (`FiberNormalMinLimitSpeed`). A 90° corner drops to about 2 mm/s (R) or 3 mm/s (F), and the next Slowing length (`FiberSlowLength`, 5 mm) stays at that speed. That costs about 2.2 s (R) or 1.5 s (F) more per sharp corner than a straight (*Inferred*).
- **Serpentine turns** in solid infill are two sharp corners 0.8 mm apart: about 5.8 mm at the floor speed, so about +2.7 s (R) or +1.7 s (F) per line end (*Inferred*). On a 100 mm wide region that roughly doubles the time of each 3.3 s line.
- **Arcs:** an arc of Min. arc radius (`FiberMinRadius`, 10–12 mm) runs at Min. normal speed (5 mm/s), and the slicer holds that speed for the Slowing length after the last arc vertex.
  - A 90° fillet of R 12 mm therefore takes about 3.8 s on the arc plus about 0.8 s held after it, ≈ 4.6 s, against ≈ 3 s for a sharp corner over the same span (two 12 mm legs).
  - In general (factory R X-CCF) the fillet costs ≈ 3.1 + 0.052·R + 10/R s and the sharp corner ≈ 2.2 + 0.067·R s, so **rounding saves time only above roughly R 70 mm** (*Inferred*, arithmetic from the slicer's corner-speed behaviour).
  - The exception is a fillet tessellated so finely that each vertex turns less than the slicer's corner-angle threshold (not yet measured): it then runs at 30 mm/s (see [Open questions](Open-Questions.md)).
  - Rounded corners still help fibre lay-down (*Inferred*).

### Tool changes (Reinforced only)

- **Two changes per fibre layer.** Within a print layer, entities are grouped by head. In Reinforced the fibre goes last (Printing order, `FiberPrintOrder`, "Last in layer"). Each macro layer with fibre therefore costs **T1 → T0 and T0 → T1**.
- **Real cost per macro layer**, 1.4.0 factory PETG + CFC PETG: 24 + 37 s of heating, plus about 2 s of Z lift (5 mm up and down at 10 mm/s, twice), plus brushing ≈ **65 s or more** (*Inferred*). The slicer charges about 13 s (2 × ≈ 5.5 s plus the lift; *G-code*, 1.3.1). With the 1.3.1 files' warmer standby values the heating is ≈ 46 s.
- **Speedy** uses only the FFF head and never heats the composite head (*G-code*, 1.3.1 and 1.4.0).
- **Fortified** in 1.4.0 uses only the composite head (*G-code*, 1.4.0: one `T0 R`, no `T1`). The 1.3.1 Fortified Benchy made **271 tool changes** to print plastic fill. Part of the 1.4.0 saving comes from leaving out what fibre cannot fill ([#38](https://github.com/3ricj/FibreSeeker3/issues/38); see [Print modes](Print-Modes.md)).

### Layer-time slowdown

- **What it does:** with Enable minimum layer time slowdown (`EnableSlowDownAtShortPrintTimeLayer`) on, any printed layer planned under Minimum layer print time (`MinLayerTimeForSlowing`, factory 10 s) has its extruding moves clipped to one ceiling speed, with a floor of 10 mm/s. Travel is not slowed and no dwell is added.
- **It counts per printed (micro) layer.** In factory R PETG the outer wall prints at ÷ 2, so each macro layer has a lower micro layer holding little more than the outer walls. On small parts that layer can be stretched towards 10 s (*Inferred*). Whether the tool-change blocks at its start count towards the 10 s is not known.
- **1.3.1 bug:** the slowdown stopped at ≈ 40 mm/s, not 10 mm/s, so very short layers stayed short ([#5](https://github.com/3ricj/FibreSeeker3/issues/5)). 1.4.0 adds a minimum print speed setting; its output is untested.

## Levers ranked: mode, fibre and tool changes

**Ranked by expected effect on real time, largest first** (ranking *Inferred*). The plastic, support and layout levers follow in the next section.

| # | Lever | Settings (UI label, `key`) | Effect on time | Cost to strength or quality | Evidence |
|---|---|---|---|---|---|
| 1 | **Mode choice** | Print mode | Speedy removes all fibre and tool changes. Fortified removes tool changes (1.4.0; 1.3.1 still changed heads to print plastic fill) but lays all volume at about ≤ 5.8 mm³/s with slow turns. Reinforced pays about 65 s+ per fibre layer in changes | Speedy: no fibre. Fortified: stiffest, no plastic skin; in 1.4.0 thin features are left out entirely. Reinforced: fibre only where routed | Behaviour analysis + Inferred; G-code (1.3.1, 1.4.0) for head use |
| 2 | **Fewer macro layers with fibre** (Reinforced) | Layup rules (Z bands) with Generate fiber perimeters / infills off; there is **no "fibre every N layers" setting** | Each fibre-free macro layer saves both tool changes (about 1 min real) plus its strands. Alternating layers would need one rule per layer (*Inferred*) | Less fibre. Put it where bending stress is highest, away from the neutral axis (FFF practice). See [Masks and layups](Masks-and-Layups.md) | Behaviour analysis + Inferred |
| 3 | **Cheaper tool changes** | Extruder standby temperature (`TemperatureWait`, Plastic and Composite; factory PETG 120, CFC PETG 150 °C) ↑; Z-lift on tool change (`ZLiftOnToolchange`, printer, 5 mm effective) ↓ | Wait = (print − standby) ÷ rate. CFC PETG at 230 °C: about 12.5 s instead of 37 s; PETG at 200 °C: about 9 s instead of 24 s, so about 40 s saved per macro layer. Lift 5 → 2 mm saves under 1 s per change (lift is +5 at 10 mm/s in real G-code) | Ooze and stringing from the idle nozzle; longer time hot (FFF practice). Too little lift risks the tow or nozzle catching the part (untested) | Behaviour analysis + Inferred |
| 4 | **Fewer fibre strands** | F. Inner (`InsetFInnerCount`) ↓ or 0 for holes that don't need it (profile or layup; masks have no F. Inner field); fewer separate islands; Solid with gaps under 4.8 mm | 7–10 s overhead per strand per fibre layer, plus loop time. A 20 mm hole costs about 30–40 s per layer (Case C) | Unreinforced holes; bearing and bolt-hole strength drops | Behaviour analysis + Inferred |
| 5 | **Fibre infill amount** (Reinforced) | Fiber infill pattern (`InfillFType`); Isogrid density (`InfillFIsogridFillDensity`, factory 20 %) via sidebar Infill Density or Enhancement Magnitude (steps 10 / 30 / 60 / 80 %); Generate fiber infills off | Fibre length scales with density: 30 % ≈ 1.5×, 60 % ≈ 3×, 80 % ≈ 4× the 20 % length on large regions. On small parts low densities lay nothing: real 1.3.1 Benchys used 4.7 m of fibre (perimeters only) at 10 % and 20 %, 4.9 m at 30 %, 8.1 m at 60 % and 10.2 m at 80 % ([#43](https://github.com/3ricj/FibreSeeker3/issues/43)). Strand count rises too. The slider opens at step 1 without writing it, so move away and back ([#40](https://github.com/3ricj/FibreSeeker3/issues/40)) | In-plane stiffness and strength fall with density | Behaviour analysis + Inferred; G-code (1.3.1) for lengths |
| 6 | **Fibre perimeters vs infill** | F. Outer (`InsetFOuterCount`, 2) | An extra loop adds only its length at 30 mm/s and its corners, with no extra overhead: the cheapest fibre to add. Removing the second loop saves about half the perimeter time | Edge stiffness; fibre near the edge carries bending best (FFF practice) | Behaviour analysis + Inferred |
| 7 | **Fewer, gentler fibre turns** | Orientation of the part relative to Guide directions (`InfillFSolidAngleList`); simpler outlines | Solid lines along the long axis halve the turns, for example 121 vs 183 turns on a 150 × 100 plate (Case B) | Balanced layups ("0/90") cost time on long, narrow parts but are needed for in-plane balance | Inferred |
| 8 | **Fibre speed settings** | Max. normal speed (`FiberNormalMaxSpeed`) ↑ for straights; Min. normal speed limit (`FiberNormalMinLimitSpeed`) ↑, Slowing length (`FiberSlowLength`) ↓ and Min. arc radius (`FiberMinRadius`) ↓ for corners; Max. ending speed (`FiberFinishMaxSpeed`) ↑ for the finish phase | Floor 2 → 3 mm/s cuts each corner by about 0.8 s; slowing length 5 → 3 mm by about 1 s. The speed coefficients do **not** raise the floor | Fibre pull-off at corners, inaccurate corners, poor anchoring | Behaviour analysis + Inferred; effects untested |
| 9 | **Number of macro layers** | Part orientation (lower Z height); Macrolayer height (`MacroLayerHeight`) | Every macro layer carries its fixed tool-change and strand costs, so fewer layers save in proportion. Raising the X-CCF macro from 0.24 to 0.30 mm saves 20 % of layers, but the bead is then taller than the 0.25 mm tow | Orientation sets fibre direction: fibre lies only in XY. A 0.30 mm X-CCF bead is untested | Behaviour analysis + Inferred |

**Order of attack for a Reinforced job** (*Inferred*):

1. Is fibre needed on every layer? Use layups.
2. Raise both standby temperatures.
3. Drop F. Inner on non-critical holes.
4. Only then tune plastic.

## Levers ranked: plastic, support and layout

| # | Lever | Settings (UI label, `key`) | Effect on time | Cost to strength or quality | Evidence |
|---|---|---|---|---|---|
| 10 | **Print several parts together** | Plate layout | Tool changes are grouped per layer across all parts, so one change pair serves the whole plate (*Inferred* from per-layer head grouping). Short layers stop triggering the minimum layer time | Each part still has its own strands. Longer per-layer heat soak (FFF practice) | Behaviour analysis + Inferred |
| 11 | **Turn support off when not needed** (Reinforced) | Enable support (`GenerateSupport`): **on in every factory R profile**, off in S and F; Critical regions only (`TreeSupportCriticalRegionsOnly`); Threshold angle (`SupportThresholdAngleDegree`, 30°) | Removes the support volume and its travel (support 120 mm/s, interface 100 mm/s) | Overhang quality | Behaviour analysis |
| 12 | **Outer-wall micro height** | Outer wall layer height (`Inset0RatioToMacro`): factory R PETG ÷ 2 (0.12 mm) → ÷ 1 (0.24 mm) | Prints the outer-wall group once per macro layer, not twice, and removes the extra micro layer and its minimum-layer-time stretch on small parts (*Inferred*) | Coarser side surface (0.24 instead of 0.12 mm steps) | Behaviour analysis + Inferred |
| 13 | **Less plastic volume** | Plastic sparse density (`InfillPCellularFillDensity`) ↓; Top solid / Bottom solid (`InfillSTopLayerCount` / `InfillSBottomLayerCount`, 5 / 3) ↓; Outer wall (`Inset0Count`, 2), P. Outer / P. Inner (`InsetXPOuterWithFiberCount` / `InsetXPInnerWithFiberCount`, 1 / 1) | Capped features scale with volume (volume ÷ 25 mm³/s). Fewer walls also free room for fibre in thin sections | Surface quality, top-skin pillowing, plastic-shell strength | Behaviour analysis + Inferred |
| 14 | **Minimum layer time** | Minimum layer print time (`MinLayerTimeForSlowing`, 10 s) ↓; Minimum print speed (`MinPrintSpeedForSlowDownAtShortPrintTimeLayer`, 10 mm/s) ↑ | Large on small parts; none on large layers | Sagging and heat build-up on small features | Behaviour analysis |
| 15 | **Plastic speeds below the cap** | Outer wall speed (`Inset0Speed`, 200), top-most skin (`TopMostSkinSpeed`, 200), bridge (`BridgeSpeed`, 80), overhang speeds (`Percent75/100OverhangSpeed`, 10/10), support (`SupportSpeed`, 120) | Helps only features below the cap. Overhang speeds matter only where overhangs exist | Surface finish, sag | Behaviour analysis |
| 16 | **Travel and retraction** | Do retract only when crossing borders (`DoRetractOnlyWhenCrossingPerimeters`) on; Do Z-hop (`DoZHop`) off (S factory on, R off); keep Avoid crossing borders (`DoAvoidCrossingPerimeters`) on | Small: retracts are 0.3–1 mm at 15–25 mm/s; Z-hop costs Z moves at 10 mm/s (*Inferred*). In 1.3.1, Z-hops were emitted even with Do Z-hop off ([#29](https://github.com/3ricj/FibreSeeker3/issues/29)) | Internal stringing; nozzle scars without Z-hop | Behaviour analysis + Inferred |
| 17 | **Printer accelerations** | Printer accelerations (per-entity 5000 mm/s², regular 8000 for gap/overhang infill; emitted as `M204`, overriding `printer.cfg`) ↑ | Helps short moves; limited by Klipper's minimum cruise ratio (0.8 in R/F, set in profile Start G-code) | Ringing; machine limits unknown | Behaviour analysis; benefit untested |

**Speedy specifics** (*Inferred*):

- Speedy 0.25 mm already runs infill at the cap, so a thicker layer mainly saves wall and per-layer time, not infill time.
- For infill-heavy parts, lower density or a two-direction pattern beats any speed edit.
- Speedy never heats the composite head (*G-code*, 1.3.1 and 1.4.0), so that head costs no time.

## What not to bother with

**These look like speed controls but don't shorten real prints, or barely do.**

| Setting or action | Why it doesn't help | Evidence |
|---|---|---|
| Raising sparse infill (`InfillPCellularSpeed`) or inner-wall speed above about 185–275 mm/s (the cap depends on width × height × flow) | Silently clipped by the hidden 25 mm³/s cap. Factory R and S infill speeds already exceed it | Behaviour analysis + Inferred; G-code (1.4.0) for the cap |
| Sidebar "Printing Speed" | Writes only inner-wall speed (`InsetXPSpeed`), which is already near the cap | Behaviour analysis |
| Thicker plastic layers for capped features | At the cap, time = volume ÷ 25 mm³/s; layer height doesn't change it | Inferred |
| Picking a "0.25 mm" group to speed up R or F | The name sets only the Speedy height; R/F macro height is fixed by the fibre | Behaviour analysis |
| Printing speed (first layer) (`BottomMostSkinSpeed`) to speed up layer 0 | Covers only first-layer skin; walls and infill use a first-layer speed with no UI field (`FLSpeed` in the presets: 50 S / 100 R) | Behaviour analysis |
| Printing speed coefficient (perimeter / solid / cellular) ↑ to fix corners | Scales max and min fibre speeds but **not** the floors, so sharp corners stay at 2–3 mm/s | Behaviour analysis |
| Max. normal speed ↑ on small or curvy parts | Helps only long straights; small parts are dominated by overhead and corners | Behaviour analysis + Inferred |
| Raising `max_accel` in `printer.cfg` | The slicer's `M204` values (5000, and 8000 for gap or overhang infill) override it for the whole print | Behaviour analysis; G-code (1.3.1, 1.4.0) |
| Jerk fields | Not emitted (jerk control off); stock Klipper ignores `M205` | Behaviour analysis |
| Do coast before retract, Do wipe nozzle | Inert: coast and wipe lengths are 0 in every factory plastic | Behaviour analysis |
| Extra unretract on tool change | No effect unless "Do unretract before tool change" is on (factory off) | Behaviour analysis |
| Restart pause (`ZHopFPauseAdhesion`) | Already 0 s in every factory composite | Behaviour analysis |
| Correction move speed | Used only with "Override correction move speed" on (factory off) | Inferred |
| Enable preheat on/off for speed | On this printer the preheat leads `M109` by seconds only. Toggling it changes the estimate, not the wait | Behaviour analysis + Inferred |
| Generate wipe tower | Adds a tower print and clearing travel at every change; never saves time | Behaviour analysis |
| Enable arc fitting | No time effect established; it also tightens outline simplification | Behaviour analysis |
| Adaptive-wall tuning fields | Ignored by the slicer; switching to adaptive walls can abort the slice | Behaviour analysis |
| Lowering Minimum perimeter length (`MinimumPerimeterLength`) "to simplify" | Adds fibre to small holes (more strands, more time), and the 58 mm cut-distance floor still applies | Behaviour analysis |
| Trusting the print card after a tool-change edit | The estimate under-counts changes, so savings there barely show; check the real time | Behaviour analysis + Inferred |

## Worked cases (illustrative)

**These are illustrative, not measurements.** Geometry is invented to show the reasoning. Every rate comes from factory preset values, and all the arithmetic is *Inferred*. Plastic time is left qualitative because it depends on geometry details. Klipper's corner limits may add a little, although the real-file check found the slicer's motion time conservative.

### Case A: small bracket in Reinforced (PETG + CFC PETG X-CCF)

Part: a 60 × 30 mm footprint, 20 mm tall, two 6 mm bolt holes. Factory Reinforced.

- **Layers:** (20 − 0.2) ÷ 0.24 ≈ 83 macro layers, so about 166 tool changes.
- **Tool changes:** about 65 s real per macro layer (24 + 37 s heating, 2 s lift, plus brushing) ≈ **90 min**. The estimate counts about 13 s per macro layer ≈ 18 min, so it is about 70 min short here alone.
- **Fibre perimeters:** two outer loops ≈ 350 mm at 30 mm/s ≈ 12 s, plus about 8 sharp corners × 2 s, plus 7–10 s overhead ≈ 35–40 s per layer ≈ **50–55 min**.
- **Holes:** 6 mm holes get no fibre loop (loop under 55 mm), so they cost no fibre time.
- **Fibre infill:** the interior is about 53 × 23 mm, so few Isogrid ribs reach the 63 mm minimum strand. Most become FFF plastic, and fibre infill adds little time.
- **Total before plastic:** about 2.5 h, of which tool changes are the largest single item.

Levers, largest first:

| Lever | Saving |
|---|---|
| Print 4 brackets per plate | The ≈ 90 min of changes is shared: about 22 min per part. Perimeter strands are not shared |
| Fibre only in the bottom and top 5 mm (two layup bands) | About 42 fibre layers instead of 83: about 45–50 min of changes and about 25 min of fibre saved |
| Standby temperatures to 200 °C (PETG) and 230 °C (CFC PETG) | About 40 s per macro layer: ≈ 55 min |
| Z-lift on tool change 5 → 2 mm | About 1 s per macro layer: ≈ 1–2 min |
| Support off if the bracket does not need it | Factory R has it on |
| Speedy, if the fibre is not structurally needed | Removes changes and fibre entirely |

### Case B: large flat plate in Fortified (PETG + CFC PETG X-CCF)

Part: 150 × 100 × 3 mm, no holes. Factory Fortified: Guide directions "0/90/0", floor 3 mm/s, slowing length 5 mm.

- **Layers:** about 12 macro layers above the first. There are no tool changes in 1.4.0 (*G-code*, 1.4.0 Fortified Benchy; 1.3.1 would add plastic fill via the FFF head where fibre cannot reach).
- **Perimeter strand:** two loops ≈ 980 mm ≈ 33 s, plus 8 corners × 1.5 s, plus overhead ≈ 1 min per layer.
- **Solid infill:** the interior is about 147 × 97 mm, with lines at 0.8 mm pitch and about 17.8 m of line per layer ≈ 590 s at 30 mm/s.
  - Lines along the 150 mm side: about 121 turns × 1.7 s ≈ 3.4 min, so ≈ 13.3 min per layer.
  - Lines along the 100 mm side: about 183 turns ≈ 5.2 min, so ≈ 15 min per layer.
- **Total:** about 12–13 layers × 14–16 min ≈ **3–3.5 h** of fibre motion.

Levers:

| Lever | Effect |
|---|---|
| Orientation | Turn the plate so the most frequent Guide direction runs along its long side. Which bed axis 0° maps to is not established, so check the preview first |
| Unidirectional "0" | Removes the slower 90° layers, but gives poor transverse properties (see [#47](https://github.com/3ricj/FibreSeeker3/issues/47)) |
| Floor 3 → 4 mm/s and slowing length 5 → 3 mm | Cuts turn time by roughly a third (untested for lay-down quality) |
| Reinforced instead | About 12 × 65 s of changes, 1 min of perimeters per layer, Isogrid fibre, and 8 solid plastic skin layers that are volume-bound at 25 mm³/s (about 2.3 min each). Probably well under half the Fortified time, at lower stiffness. The Isogrid strand count is unknown, so the range is wide |

### Case C: plate with bolt holes in Reinforced

Part: a 4 mm plate (about 16 macro layers) with eight 20 mm holes.

- **Per hole:** each hole gets an F. Inner strand per fibre layer. The loops sit at radius ≈ 11.6 and 12.4 mm, so 151 mm at ≈ 5 mm/s (curvature near Min. arc radius 12 mm) ≈ 30 s, plus 7–10 s overhead ≈ **35–40 s per hole per layer**.
- **Total for the holes:** 8 holes × 16 layers ≈ 80 min, before the outer perimeter, infill and tool changes (about 17 min).
- **Levers:**
  - F. Inner 1 on non-critical holes roughly halves the loop time.
  - F. Inner 0 removes the hole strands entirely.
  - A layup band can give F. Inner only to the layers that bear the load. A mask cannot, because it has no F. Inner field.
  - **Cost:** bearing strength at the holes.
- **Caveat:** if arc segments fall below the corner-angle threshold and run at 30 mm/s, the loop time drops to about 5 s and only the overhead remains. This is why measuring a real print matters.

## Evidence

Real-file figures come from the repo's [Test_files](https://github.com/3ricj/FibreSeeker3/tree/main/Test_files) (ten 1.3.1.480 Benchys in all three modes; one 1.4.0.857 Plastic Only job) and from a 1.4.0.857 Fortified slice of the repo's `3DBenchy.stl` with the factory "PETG 0.2 mm | CFC PETG+X-CCF / PETG" profile (estimate 6 h 10 min, 374 strands, zero head changes; compared with the 1.3.1 `Benchy_fortified.gcode`). Related issues: [#4](https://github.com/3ricj/FibreSeeker3/issues/4), [#5](https://github.com/3ricj/FibreSeeker3/issues/5), [#29](https://github.com/3ricj/FibreSeeker3/issues/29), [#38](https://github.com/3ricj/FibreSeeker3/issues/38), [#41](https://github.com/3ricj/FibreSeeker3/issues/41), [#43](https://github.com/3ricj/FibreSeeker3/issues/43). Unanswered time questions (brush-macro duration, minimum-layer-time scope, multi-part grouping, safe standby temperatures) are on [Open questions](Open-Questions.md).

## See also

- [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)
- [Fibre paths](Fibre-Paths.md)
- [Motion settings](Motion-Settings.md)
- [Masks and layups](Masks-and-Layups.md)
- [Open questions](Open-Questions.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
