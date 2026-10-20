# How the Slicer Works

Rocket Slicer slices each job as a stack of thick macro layers: the continuous fibre is laid once per macro layer, and plastic prints in thinner micro layers inside each one. This page explains that layer model, how the slicer decides which value of a setting actually applies, what you can edit and where it is saved, and the order in which a slice is built.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unless marked otherwise, the behaviour on this page is *Behaviour analysis*: established by analysing the slicer and its preset files. Points checked in exported G-code are marked *G-code* with the version.

## How a setting's value is decided

**The effective value comes from the highest-ranked source that has one.**

| Rank | Source | Scope | Notes |
|---|---|---|---|
| 1 | Values forced at slice time | Whole job | See [Print modes](Print-Modes.md#values-forced-at-slice-time) |
| 2 | Mask rule | The volume of a mask mesh on one part | Lowest priority number wins where masks overlap |
| 3 | Layup rule | A Z band of one part | The first rule (lowest priority number) whose band contains the layer's Z wins. Bands are not merged. |
| 4 | Profile value | Job | The stored template value. A separate "override" value (keys ending in `…Over`) would beat it, but the UI never writes one (see below). |
| 5 | Built-in default | Load time | Used when a stored value is outside the slicer's allowed [min, max] range |

**Out-of-range values are replaced by the default, not clamped.** A stored value outside the allowed range becomes the built-in default, not the nearest limit. The settings dialog enforces the ranges, but the mask form has no limits at all, so an out-of-range mask value probably reaches the slice unchecked and is replaced by the default (*Inferred*).

**Printer, extruder and material settings never override profile settings.** They are combined instead:

- extrusion = the material's plastic flow × the profile's per-feature flow multiplier;
- line width = the profile width in mm, or coefficient × nozzle diameter when the mm value is 0.

**Edition and `…Over` values.** The slicer has licence editions; Rocket Slicer runs as the full edition. Every real export's `; SESSION:` block has `Edition` 4 (*G-code*, 1.3.1 and 1.4.0). The UI writes edits to the base value, never to an `…Over` value. The printer preset does ship some `…Over` values (Z travel 5 mm/s, Z-lift 10 mm, heated chamber off, regular acceleration 5000), but real exports carry the base values (10 / 5 / on / 8000), so those override values never take effect (*G-code* for the exported values; why they are skipped is *Inferred*).

### What you can edit, and where it is stored

| Template | Settings dialog | Sidebar quick fields | Persistence |
|---|---|---|---|
| Factory ("AP") | View only, no Apply | Editable | Held in the project in memory. On reopen the factory row is restored, so sidebar tweaks very probably do not survive a reload (untested) |
| Custom (duplicated group) | Editable, Apply | Editable | Written to the library template and the project |

**To keep changes, duplicate the group** with the copy icon and edit the copy. There is no "reset to factory" button; re-duplicate the factory group instead.

### Per-part overrides

Masks and layups are the only way to change settings for one part or one height band. They carry only wall counts, fibre switches, plastic sparse infill and fibre infill settings, not speeds, temperatures or support. A part has masks or layups, never both. Full detail is on [Masks and layups](Masks-and-Layups.md).

## Macro and micro layers

**The macro layer is the fibre layer pitch. Plastic features print at the macro height divided by a whole number.**

- Macrolayer height (`MacroLayerHeight`) sets the macro pitch.
- Each plastic feature has a divisor. The UI shows it as a layer height in mm, but it is stored as a whole number from 1 to 10:
  - Outer wall layer height (`Inset0RatioToMacro`);
  - Plastic perimeters layer height (`InsetXPRatioToMacro`);
  - Infill layer height (`InfillRatioToMacro`);
  - thick support layers have their own divisor with no UI field (`SupportThickRatioToMacro`, factory 1–2); normal support uses the outer-wall divisor.
- Inside each macro layer of height H, the slicer creates micro-layer tops at H ÷ divisor × i for every enabled feature. Each micro layer prints only the features scheduled at that height.
- **Fibre is laid once per macro layer, on its top micro layer.** A fibre bead is one full macro layer tall.

**The macro height must divide exactly (in µm) by the Outer wall and Plastic perimeters divisors**, or the slice aborts with:

> … layer schedule is invalid: macro height X um must be evenly divisible by ratio N

- At 0.30 mm, divisors 7, 8 and 9 fail.
- The dialog's stepper skips invalid divisors.
- Changing the macro height keeps the divisors, so every micro height rescales with it.

### Factory layer heights

Heights in mm. *Behaviour analysis* (factory preset files).

| Mode / material | Macro | Outer wall | Inner plastic walls | Sparse infill |
|---|---|---|---|---|
| Speedy | 0.1 / 0.2 / 0.25 | = macro | = macro | = macro |
| Reinforced, PETG (both fibres) and PET GF + X-CGF | 0.24 / 0.30 | macro ÷ 2 (0.12 / 0.15) | X-CCF = macro; X-CGF ÷ 2 (0.15) | = macro |
| Reinforced, PET GF + X-CCF, PA CF, PPS CF, PLA | 0.24 | = macro | = macro | = macro |
| Fortified | 0.24 / 0.30 | no plastic walls | no plastic walls | no plastic infill |

### First layer

- Without fibre, the first layer uses First layer height (`FLThickness`, factory 0.2 mm).
- When any fibre is generated, a separate fibre first-layer thickness applies. Its UI field is "Layer height" under First layer (`FiberFLThicknessMM`, factory 0.20 mm Reinforced / 0.15 mm Fortified).
- There is also a twin value with no UI field (`FiberFLThickness`, default 0.3 mm). Which of the two the slicer actually uses is not settled. Real 1.3.1 Reinforced exports hold `FiberFLThicknessMM` 0.2 and `FiberFLThickness` 0.24, with layer 1 at 0.2 mm (*G-code*, 1.3.1). See [Open questions](Open-Questions.md).
- After the first layer, layer tops are at first-layer height + n × macro.

**The sidebar "Layer Height" is read-only.** It shows macro ÷ Outer wall divisor, which is the outer-wall micro height, not the macro height.

**Don't lower the macro height much below the factory value in Reinforced or Fortified.** The 0.24 / 0.30 mm values sit just under the tow diameters (0.25 mm X-CCF / 0.35 mm X-CGF), so a thinner macro layer compresses the bead (*Inferred*). More on the materials in [Factory materials and profiles](Factory-Materials-and-Profiles.md).

## The slicing pipeline in plain terms

**The slicer builds a job in this order.** The order of the per-model sub-steps in step 5 is *Inferred* from the slicer's progress stages.

1. **Build the settings.** Profile, printer, materials and slots are combined and forced values applied; each layup rule and mask gets its own settings set.
2. **Import the meshes.** Parts too thin to slice are dropped.
3. **Slice the contours.** Build the layer schedule (checking divisibility), pick the layup rule for each Z, slice mask volumes.
4. **Prepare the input** (spiral-vase overrides) and **plan the outer walls**.
5. **Generate everything else, per model**, in roughly this order:
   1. classify top and bottom surfaces;
   2. inner plastic walls, phase 1 (outside the fibre);
   3. **fibre perimeters**;
   4. inner plastic walls, phase 2 (inside the fibre);
   5. merge adjacent walls;
   6. in Reinforced only, make the plastic under the next fibre layer solid;
   7. narrow-gap fill;
   8. assign solid regions;
   9. skins (top, bridge, bottom, overhang, ordinary solid);
   10. **sparse plastic infill and fibre infill**;
   11. micro-layer infill;
   12. copy the macro-planned paths down into the micro layers;
   13. mark overhanging wall segments.
6. **Generate support.**
7. **Merge models into print layers** and add brim, skirt and the fibre priming line.
8. **Precompute curled perimeters** for the curl/overhang slowdown.
9. **Write the G-code**, applying speed caps, cooling slowdown, retraction, the fibre cut/restart sequence and the time estimate.

**Walls are planned on the macro layer and copied down to the micro layers.** Holes, islands and fibre decisions are therefore made once per macro layer, not per micro layer.

**There is no warnings channel.** Anything that goes wrong either aborts the slice with "Slicing failed: {message}" or is quietly left out. See [Troubleshooting: slicer messages](Troubleshooting-Slicer-Messages.md) and [Troubleshooting: silent behaviours](Troubleshooting-Silent-Behaviours.md).

How the plastic and fibre paths themselves are planned is on [Plastic paths](Plastic-Paths.md) and [Fibre paths](Fibre-Paths.md). Settings that look editable but do nothing are on [Settings overview](Settings-Overview.md).

## See also

- [Print modes](Print-Modes.md)
- [Plastic paths](Plastic-Paths.md)
- [Fibre paths](Fibre-Paths.md)
- [Masks and layups](Masks-and-Layups.md)
- [Settings overview](Settings-Overview.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
