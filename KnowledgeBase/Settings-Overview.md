# Settings Overview

This page explains how to read the settings tables in this wiki, where each Rocket Slicer setting lives, what the sidebar quick controls really write, which settings do not do what their label says, and which settings are hidden, ignored or have no UI field at all. Check the "don't do what they say" list before recommending any change. The detailed settings tables are on the pages listed under "Settings pages".

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Settings pages

The settings pages cover about 120 of the slicer's 526 UI fields (plus about 106 settings that have no UI field): the ones that matter when advising on FibreSeeker 3 prints.

| Page | Covers |
|---|---|
| [Settings: layers and walls](Settings-Layers-and-Walls.md) | Profile › Layer thickness, First layer, Walls |
| [Settings: plastic infill and features](Settings-Plastic-Infill-and-Features.md) | Profile › Plastic solid, micro and sparse infill; Brim, Skirt, Overhang, Bridge, Gap infill |
| [Settings: fibre](Settings-Fibre.md) | Profile › Fiber basics (strand speeds and phases), Fiber perimeter, Fiber infill |
| [Settings: support, cooling and other](Settings-Support-Cooling-and-Other.md) | Profile › Support, Ooze prevention, Wipe tower, Cooling, Other |
| [Settings: material, extruder, printer](Settings-Material-Extruder-Printer.md) | Plastic, Composite, Printer, Extruders dialogs |
| [Masks and layups](Masks-and-Layups.md) | The only per-part overrides, and what they can change |

## Reading the settings tables

**Each settings table row gives the label, the key, the factory value per mode, the factory spread, and the trap.** Evidence labels (*G-code*, *Official*, *Community*, *Behaviour analysis*, *Inferred*, *FFF practice*) are defined on [Evidence and versions](Evidence-and-Versions.md). Unmarked claims in the settings tables are *Behaviour analysis* (the slicer's behaviour and its factory preset files); claims checked in exported G-code say *G-code* with the version. G-code checks so far: ten community test files from 1.3.1.480, one Plastic Only file from 1.4.0.857, and one 1.4.0.857 Fortified Benchy sliced with a factory profile (it settles Fortified behaviour for 1.4.0). No 1.4.0 Reinforced file was available, and nothing here has yet been checked against physical prints.

| Column | Meaning |
|---|---|
| UI label | Verbatim English label. Text in brackets is context added here (for example "Printing speed (outer wall)"); it is not part of the label |
| Key | The setting's key as it appears in the exported G-code's `; SESSION:` block and in the factory preset files |
| Unit | Unit as shown in the UI |
| Factory S / R / F | Value in the profile group "PETG 0.2 mm \| CFC PETG+X-CCF / PETG" for Speedy / Reinforced / Fortified. "–" = the field is not shown in that mode (absent, hidden or forced) |
| Factory range | Spread over all 16 factory profiles of each mode, listed only where values differ. "no spread" = every factory profile of each visible mode has the baseline value |
| What it does / Gotcha | Direction of change and the trap, if any. "–" = nothing notable |

**Conventions.**

- Layer-height divisors are shown as "÷2 = 0.12" (stored divisor = height in mm). Booleans are on/off; enumerations use their option name.
- The baseline group has a 0.2 mm macro layer in Speedy but **0.24 mm in Reinforced and Fortified**. The fibre sets that height, not the group name.
- No factory profile carries a non-null `…Over` value, and the UI writes every edit to the base value. So the value shown is the value used, unless a mode forces it (see "Settings that don't do what they say" below). The printer preset does hold `…Over` values, but real exports (1.3.1 and 1.4.0) show its **base** values in use; see [Settings: material, extruder, printer](Settings-Material-Extruder-Printer.md).

How the slicer turns these values into paths is explained on [How the slicer works](How-the-Slicer-Works.md); the three modes are on [Print modes](Print-Modes.md).

## Where the settings live

**Most advice concerns the Profile dialog.** Each profile group holds three separate profiles (Speedy, Reinforced, Fortified), so an edit applies only to the mode that is active.

| Dialog | What it holds | Notes |
|---|---|---|
| Profile ("Template Settings" → More) | Layer thickness, First layer, Walls, plastic solid/micro/sparse infill, Fiber basics, Fiber perimeter, Fiber infill, Brim/Skirt, Overhang, Bridge, Gap Infill, Support, Ooze prevention, Wipe tower, Cooling, Other | The form differs per mode. **Fortified** has no Walls, plastic infill, Brim/Skirt, Overhang, Bridge, Gap or Ooze sections. **Speedy** has no fibre sections |
| Plastic | FFF filament: temperatures, fan, retraction, density, cost | Applies to the right (FFF) head |
| Composite | Fibre + matrix: temperatures, fan, matrix retraction, restart, cost | Applies to the left (CFC) head |
| Printer, with Extruders and Slots tabs | Travel, accelerations, features, G-code, kinematics; per-head offsets, nozzle, cut distance | Cut distance and restart length are hardware values |
| Mask rule / Layup rule | Per-part overrides | See [Masks and layups](Masks-and-Layups.md) |

**Rules that affect editing.**

- **Expert fields** are hidden until expert mode is on. The whole Wipe tower tab is expert-only.
- **The Support tab** always comes from the generic form. It is filtered by support type and style, so it looks the same in all three modes.
- **Factory ("AP") templates are view-only** in the dialog: there is no Apply. Duplicate the group (copy icon) and edit the copy. There is no "reset to factory"; re-duplicate the factory group instead.
- **Validation is quiet.**
  - Number fields enforce the slicer's allowed range.
  - A comparison rule failure (slowdown heights, support min/max layer heights) turns the field red, and Apply silently does nothing.
  - The support-geometry check runs on every sidebar change and Apply. While it fails, **mode, printer, material and profile switching are blocked**.
- **Integer fields** (densities, overhang and support speeds, layer time) truncate decimals.

| Template | Settings dialog | Sidebar quick fields | Persistence |
|---|---|---|---|
| Factory ("AP") | View only, no Apply | Editable | Held in the project in memory. On reopen the factory row is restored, so the tweaks very probably do not survive a reload *(untested)* |
| Custom (duplicated group) | Editable, Apply | Editable | Written to the library template and the project |

## Sidebar quick controls

**The sidebar writes single profile fields, and several are narrower than their labels suggest.** Each control writes the profile base value, then saves after a 400 ms pause. In Speedy only the plastic panel exists. In Reinforced a **Plastic/Fiber toggle** switches panels, and opens on Fiber. In Fortified only the fibre panel is shown.

| Control | Shown in | Writes | What to know |
|---|---|---|---|
| Layer Height (mm) | S; R Plastic tab | Nothing (read-only) | Shows Macrolayer height ÷ Outer wall divisor, i.e. the **outer-wall micro height**. Factory R PETG X-CCF shows 0.12 mm while fibre layers are 0.24 mm |
| Plastic Wall (loops) | S; R Plastic | Outer wall (`Inset0Count`) only | The outer-wall group, not total plastic walls |
| Plastic perimeter (loops) | S; R Plastic, when Shell is off | Plastic perimeters (`InsetXPCount`) | With fibre perimeters on, P. Outer/P. Inner apply instead |
| Printing Speed (mm/s) | S; R Plastic | Inner plastic wall speed (`InsetXPSpeed`) only | Outer wall, infill, skins and first layer are untouched |
| Infill Pattern | S; R Plastic | Sparse pattern (`InfillPCellularFillType`) | At 100 % density, a non Line/Zigzag/Concentric pattern triggers a prompt: Yes = Zigzag, No = density reset to the built-in default (50 %) |
| Infill Density (%) | S; R Plastic | Sparse density (`InfillPCellularFillDensity`) | Same prompt when 100 is typed |
| Support type (None/Normal/Tree) | S; R Plastic | Enable support + Type | Normal also forces style Grid |
| Support Styles | S; R Plastic | Normal: Grid only. Tree: Slim/Strong | Hybrid and Organic are not offered |
| Shell (switch) | R Fiber | Generate fiber perimeters | – |
| F. Outer / F. Inner loops | R and F Fiber, when fibre perimeters are on | `InsetFOuterCount` / `InsetFInnerCount` | – |
| P. Outer / P. Inner loops | R Fiber | `InsetXPOuterWithFiberCount` / `InsetXPInnerWithFiberCount` | Forced 0 in Fortified |
| Infill (switch) | R Fiber | Generate fiber infills | – |
| Infill Type | R (disabled in F) | Fiber infill pattern (`InfillFType`) | F is forced to Solid |
| Infill Density (%) | R; hidden for Solid | Density field of the current type | Min/max always come from the Rhombic limits (0–80) |
| Enhancement Magnitude | R only, when Infill Type ≠ Solid | Density of the current fibre infill type | See below |

**Fortified sidebar.** The fibre panel only, with no Shell or Infill switches and no P. loops. Infill Type and Density are disabled because Solid is forced. F. Outer/F. Inner appear only because every factory Fortified profile already has fibre perimeters on.

**Enhancement Magnitude** writes one field, the density of the selected fibre infill type. Nothing else changes: no loops, angles or other types.

| Step | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Density written | 0 % | 10 % | 30 % | 60 % | 80 % |
| Isogrid rib pitch at 0.8 mm width *(Inferred)* | undefined *(untested)* | 24 mm | 8 mm | 4 mm | 3 mm |

- It **opens at step 1 whatever the profile holds.** Factory Isogrid is 20 % (13 profiles) or 25 % (3), which no step reproduces.
- Re-picking the step last written does nothing. Move to another step and back. Keyboard Enter/Space moves the handle but writes nothing. Real 1.3.1 exports fit this: of six Reinforced Benchys sliced at "levels" 1–5, two kept the factory 20 % (*G-code*, 1.3.1; [#40](https://github.com/3ricj/FibreSeeker3/issues/40)).
- At the factory 20 % (and at 10 %) a Benchy-sized part gets **no fibre infill at all**; 30 % gave 5 strands, 60–80 % gave 63–68 (*G-code*, 1.3.1). Check the preview on small parts.
- It is still shown, and still writes, when the Infill switch is off; the density then has no effect *(Inferred)*.

**Persistence.** On a factory template, sidebar edits go to an in-memory project copy. On reopen the factory row is restored, so the edits very probably do not survive a reload *(untested)*. On a duplicated (custom) group they are written to the library template.

## Settings that don't do what they say

**Check this list before recommending a change.** Each row is established (*Behaviour analysis* or *G-code*) unless marked.

| Setting(s) | Looks like | Actually |
|---|---|---|
| Holes expansion (`HolesExpansion`), Outer contour expansion (`OuterContourExpansion`) | Dimensional compensation for holes and outer size | In 1.4.0 the slicing step never uses them, so they probably do nothing *(Inferred)*. Test: slice a plate with a 5 mm hole at 0 and at +0.3 mm and compare the hole perimeter coordinates in the G-code. Until confirmed, correct undersized holes in the CAD model |
| Wall transitioning threshold angle, Wall transitioning filter margin, Wall transition length, Wall distribution, Minimum wall width, Minimum feature size | Adaptive-wall tuning | **Ignored.** Adaptive walls use fixed values: 10°, and 0.25 / 1.0 / 0.85 / 0.25 × nozzle diameter. The field values are never passed to the slicing step |
| Four of those (filter margin, transition length, minimum wall width, minimum feature size) | Percentages | Stored as nozzle-diameter fractions (0.25, 1, 0.85, 0.25) with no ×100, so they probably display as "0.85 %" *(Inferred, untested)* |
| Outer wall / Plastic perimeters / Infill layer height; Gap fill flow ratio; Build plate only | mm heights; a percentage; a plain switch | Integer divisors of the macro layer (they rescale when it changes); a ratio 0.5–1.5 shown ×100; the inverse of stored `GenerateInternalSupport` (not inverted for the Hybrid twin) |
| Plastic walls, P. Outer/P. Inner, top/bottom solid, sparse density, spiral vase, fibre infill pattern | Editable in Fortified | **Forced** to 0 / Solid / off in Fortified, by the interface and again at slice time. The slice aborts if any plastic-head path survives; areas fibre cannot fill are dropped silently (*G-code*, 1.4.0) |
| Fortified preset rows lack `Inset0Count`, `InsetXPCount`, `InfillPSolidBottomTopLayerCount` and `IsSpiralVase` | – | The interface's forcing for those four is therefore not stored; the slicer's own forcing at slice time still applies *(Inferred)* |
| Generate fiber perimeters / infills, Generate wipe tower; Spiral vase mode | Editable | Fibre and wipe tower forced off in Speedy; spiral vase forced off in Reinforced and Fortified. Mask and layup fibre switches are forced off in Speedy and on in Fortified on a mode change |
| Fibre first-layer "Layer height" (`FiberFLThicknessMM`, R 0.2 / F 0.15 mm) | Sets the fibre first layer | The layer schedule appears to use a separate setting with no UI field, `FiberFLThickness` (default 0.3 mm, absent from presets but present in the export's SESSION block). If that is what is used, the UI field does nothing ([Open questions](Open-Questions.md)). 1.3.1 exports hold it at 0.24 (the macro height), not 0.3 |
| Sidebar edits on a factory template | Saved with the project | Held in memory; the factory row is restored on reopen, so they are very probably lost *(untested)* |
| Enhancement Magnitude | Shows the current density | Opens at step 1 (10 %) whatever the profile holds. Re-picking the last step writes nothing. Keyboard Enter/Space moves the handle but writes nothing. Consistent with 1.3.1 exports that kept the factory 20 % |
| Printer preset `…Over` values (Z travel 5 mm/s, Z-lift 10 mm, heated chamber off, regular acceleration 5000) | The printer values in use | Never applied: real exports (1.3.1 and 1.4.0) carry the base values 10 / 5 / on / 8000 |
| Do Z-hop when retract only (1.3.1) | Switches plastic Z-hop off | Hops still emitted with it off (*Community*, [#29](https://github.com/3ricj/FibreSeeker3/issues/29)) |
| Sidebar Printing Speed / Plastic Wall / Layer Height | Global speed / all walls / layer height | Inner-wall speed only / outer-wall group only / read-only outer-wall micro height |
| Plastic extrusion compensation ratio, Fiber extrusion compensation ratio | Plastic head and fibre | Composite head only; the FFF head uses 1.0 *(Inferred)* |
| Do coast before retract, Do wipe nozzle | Coast or wipe | **Inert**: coast length and wipe length are 0 in every factory plastic |
| Correction move speed (R PETG/PET GF X-CCF: 0.1 mm/s) | A slow-move defect | Used only when "Override correction move speed" is on, which is off in every factory profile, so it is inert *(Inferred; consistent with 1.3.1 output)* |
| Extra unretract on tool change | Tool-change prime | Used only if the printer's "Do unretract before tool change" is on (factory off) |
| Jerk X/Y/Z/E, Outer wall jerk, Regular jerk | Jerk limits | Not emitted: "Enable jerk control" is off |
| Fill pattern (Internal solid infill) | Tooltip says "bottom solid skin" | It is the Reinforced plastic substitute for rejected fibre |
| Contact radius / Extended contact radius | Fibre corner correction in all fibre modes | Shown only in Reinforced; Fortified presets lack them, so the value Fortified uses is unknown |
| Overhang slowdown, curl slowdown, speed smoothing, height-based speed limit | Profile settings | Passed to the slicer only in Speedy and Reinforced |
| Mask rule values | Range-checked like the profile | The mask form has no limits. Out-of-range values are probably replaced by the built-in default, not clamped *(Inferred)* |
| Seam brush panel text "Applies to plastic shell only" | Plastic only | The "Seam Fibers" brush is used for fibre seams too |

## Hidden and ignored settings

### UI fields with no effect, or less effect than they suggest

| UI field | What actually happens |
|---|---|
| Wall transitioning threshold angle, Wall transitioning filter margin, Wall transition length, Wall distribution, Minimum wall width, Minimum feature size (adaptive walls only) | **Ignored.** The slicer uses fixed values: 10°, and 0.25 / 1.0 / 0.85 / 0.25 × nozzle diameter. Several are also labelled "%" but stored as fractions |
| Plastic extrusion compensation ratio, Fiber extrusion compensation ratio | Affect only the **composite** head (matrix and tow). The FFF plastic head is unaffected *(Inferred)* |
| Plastic wall, infill and skin fields, and the fibre infill pattern, in Fortified | Forced off or to Solid at slice time |
| Fibre settings in Speedy | Forced off |
| Do coast before retract (`DoCoastAtEnd`, factory on in 14 of 16 Speedy and 6 of 16 Reinforced profiles) | Inert: the coast length is 0 in every factory plastic |
| Enhancement Magnitude via keyboard | Moves the handle but writes nothing |
| Mask form | Has no F. Inner field. F. Inner is copied from the profile |
| Fibre first-layer "Layer height" (`FiberFLThicknessMM`) | May be superseded by a twin with no UI field, `FiberFLThickness` (see [Open questions](Open-Questions.md)) |

### Settings with no UI field

These keys can't be edited in the app, but all of them appear in the `; SESSION:` block of 1.4.0.857 exports (several also in 1.3.1), so you can read the values used in any exported file.

| Setting | Effect |
|---|---|
| `AllowGenerateFiber` | Master fibre switch. Forced true by the app in the 1.3.1 files and fibre jobs; false in the 1.4.0 Plastic Only test file |
| `MaxVolumetricSpeed` | 25 mm³/s plastic cap (factory value in every plastic; new in 1.4.0, absent from 1.3.1 exports) |
| `FLSpeed` | First-layer speed for walls, infill and skins: 50 (Speedy) / 100 (Reinforced) mm/s |
| `FiberFLThickness` | Fibre first-layer thickness, default 0.3 mm; 0.24 in 1.3.1 exports. May be the value actually used instead of the UI's `FiberFLThicknessMM` |
| `SupportThickRatioToMacro` | Support layer divisor, factory 1–2 |
| `InfillPCellularMultiLineCount`, `InfillPCellularAnchorLengthMM`, `InfillPCellularAnchorMaximumLengthMM` | Filled in by the app with 1 / 2 / 20 mm if absent |
| `MinWidthTopSurface` | String, default "300%"; use not established |
| `Resolution` | 0.01 mm; path simplification is 10 µm regardless |
| About 40 `Hybrid…` support fields | Reachable only through presets |

Two behaviours have no setting at all: organic tree geometry uses fixed values (branch angle 40°, preferred angle 25°, branch diameter 2 mm, tip 0.8 mm, and others), and classic thin-wall detection has no switch and is probably off *(Inferred)*.

### Hidden options

- **Support styles.**
  - The slicer has tree styles Slim, Strong, Hybrid and Organic; the UI offers only Slim and Strong.
  - The normal styles are Default, Grid and Snug; the UI offers only Grid.
  - Organic fields still appear for tree support even though the Organic style cannot be chosen.
  - Tree support interface offers Zigzag only.
- **Infill patterns.** TPMS-FRD, TPMS-IWP and Shamrock exist in the slicer but have no option.
- **Debug reports** are not available in the shipped slicer. No setting or switch turns them on.

## See also

- [How the slicer works](How-the-Slicer-Works.md)
- [Print modes](Print-Modes.md)
- [Masks and layups](Masks-and-Layups.md)
- [Troubleshooting: silent behaviours](Troubleshooting-Silent-Behaviours.md)
- [Evidence and versions](Evidence-and-Versions.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
