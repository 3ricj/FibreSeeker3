# Masks and Layups

This page explains masks and layups, the only way to change settings for part of a model in Rocket Slicer: which settings they can override (wall counts, fibre switches and infill patterns and densities only), how priority and precedence work, and the traps, including the silent change of fibre Guide directions to "0/45/-45/90" in every new mask or layup.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

Unmarked claims are *Behaviour analysis*.

## What they can and cannot override

**Masks and layups override only wall counts, the fibre on/off switches and infill patterns/densities.** They carry the wall counts, the fibre switches (Reinforced only), the plastic sparse infill pattern, density and angles, and the fibre infill type and parameters. A **full mask** also sets top/bottom solid layers; an **internal mask** changes only the interior; Support blocker and Support enforcer masks change no values.

They **cannot** override speeds, flows, widths, temperatures, layer heights or support settings. If you need a different speed or temperature for part of a model, it has to be a separate print or a change to the whole profile.

**Precedence, from highest:** the values the app and slicer force for the mode; then masks; then layups; then the profile.

| Setting | Full mask | Internal mask | Layup |
|---|---|---|---|
| Generate fiber perimeters / Generate fiber infills | Reinforced only | Reinforced only | Reinforced only |
| Outer wall (`Inset0Count`) | Yes | No | Yes |
| Top/bottom solid layers count (one field for both) | Yes | No | **No** |
| Plastic perimeters (`InsetXPCount`) | When fibre perimeters are off | Same | Same |
| Fibre outer loops (`InsetFOuterCount`; mask label "Fiber perimeters count") | When fibre perimeters are on | Same | Same (as F. Outer) |
| F. Inner (`InsetFInnerCount`) | **No field**: copied from the profile | Same | When fibre perimeters are on |
| P. Outer / P. Inner | When fibre perimeters are on | Same | Same |
| Plastic sparse Fill pattern, angle, angle offset, density | When fibre infill is off | Same | Same |
| Fiber infill pattern, Solid Guide directions, per-type density and angles | When fibre infill is on | Same | Same |
| Fibre density limit | 0–100 (Tetragrid 0–80); form unchecked | Same | 0–80, checked |

Support blocker and Support enforcer masks carry no values; they only add or remove support regions. There is no paint-on support.

**Mode forcing still wins.** Mask and layup fibre switches are forced off in Speedy and on in Fortified when the mode changes. In Fortified, mask wall counts are re-zeroed at slice time *(Inferred from the precedence order)*.

## Masks

- **One part each.** A mask belongs to one part.
- **Drawn masks span the full part height.** Drawn masks (hold Ctrl and drag) are boxes or cylinders spanning the **full part height**. Move or scale them in Z, or import a shaped mesh, to limit them. New drawn masks default to Internal.
- **Priority 1 is highest.** A new mask gets the **lowest** priority, so it loses any overlap until moved up.
- **Priorities must be unique within a part, or the slice aborts.**
- **No range checks.** The mask form has no limits at all. Out-of-range values are probably replaced by the built-in default rather than clamped to the nearest limit *(Inferred)*. The settings dialog does enforce ranges, so check mask values by hand.
- **No F. Inner field.** The mask form has no F. Inner (hole loops) field; it is copied from the profile.
- How the mask's single top/bottom count maps to separate top and bottom counts is not established ([Open questions](Open-Questions.md)).

## Layups

- **A layup is a Z band on one part.** It is created spanning the whole part at priority 1. The first rule containing the layer's Z wins, and bands are not merged.
- **Heights are stored as absolute Z.** Min/Max Z are shown relative to the part bottom but stored as absolute Z. They rescale when the part is scaled. Whether they follow a Z move has not been established ([Open questions](Open-Questions.md)).
- **Layups cannot set top/bottom solid layers** (full masks can).
- **Fibre density limit 0–80 %**, checked by the form.

## Rules for both

- **A part uses masks or layups, never both.** Entering Layup mode turns masks off on every part.
- **New masks and layups copy the profile, except Guide directions, which are set to "0/45/-45/90".** With Solid fibre infill this silently changes the fibre directions inside that region. Check and reset Guide directions (`InfillFSolidAngleList`) in every new mask or layup if you want the profile's directions.

## See also

- [Settings: fibre](Settings-Fibre.md)
- [Settings overview](Settings-Overview.md)
- [Print modes](Print-Modes.md)
- [Fibre paths](Fibre-Paths.md)
- [Troubleshooting: silent behaviours](Troubleshooting-Silent-Behaviours.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
