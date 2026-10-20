# Print Modes

Rocket Slicer has three print modes: Speedy, Reinforced and Fortified. This page explains what each mode actually prints, which heads it uses, which settings the slicer forces at slice time (so editing them does nothing), how the factory profiles differ between modes, and which factory profile to start from for a given goal.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Each mode is its own profile

**Switching mode switches to a different, sibling profile. Nothing is copied between them.** A profile group such as "PETG 0.2 mm | CFC PETG+X-CCF / PETG" holds three separate profiles: Speedy, Reinforced and Fortified. An edit made in Reinforced is not seen in Speedy or Fortified. *Behaviour analysis.*

**The "0.1 / 0.2 / 0.25 mm" in a group name applies to Speedy only.** Every Reinforced and Fortified value depends only on the plastic and the composite. A "PETG 0.1 mm" group and a "PETG 0.25 mm" group therefore carry identical Reinforced and identical Fortified profiles. *Behaviour analysis* (from the factory preset files).

## What each mode prints

| | Speedy | Reinforced | Fortified |
|---|---|---|---|
| Heads used | FFF (right) only | FFF plastic plus CFC composite | 1.4.0: CFC composite only (*G-code*, 1.4.0: one `T0 R`, no `T1`). 1.3.1 also used the FFF head (see [Fibre paths](Fibre-Paths.md)) |
| Fibre | Off (forced) | Perimeters and/or infill | Perimeters plus **solid** fibre infill |
| Plastic walls, sparse infill, top/bottom skins | Yes | Yes | **None** (forced to zero) |
| Where plastic comes from | FFF head | FFF head, plus the composite matrix | Only the matrix plastic co-extruded with the fibre (*G-code*, 1.4.0) |
| Factory macro layer | 0.1 / 0.2 / 0.25 mm, as the group name says | **0.24 mm (X-CCF) or 0.30 mm (X-CGF)**, whatever the group name says | Same as Reinforced |
| Factory support | Off | **On** (tree) | Off |
| Priming line / wipe tower | Neither (wipe tower forced off) | Priming line shown (one fibre strand in 1.3.1 output); wipe tower only if enabled (factory off) | No priming line in 1.3.1 output; one fibre priming strand in a 1.4.0 Benchy; wipe tower only if enabled |

What the macro layer is, and why fibre modes use 0.24 / 0.30 mm, is explained in [How the slicer works](How-the-Slicer-Works.md).

## Values forced at slice time

**Some settings are overwritten every time you slice, so editing them has no effect.** The slicer's interface rewrites some values in the slice request, and some are forced again at slice time. *Behaviour analysis* unless marked.

| Mode | Forced by the interface | Forced again at slice time |
|---|---|---|
| Fibre modes | "Allow generate fiber" (`AllowGenerateFiber`) = true. This flag has no UI field. (The 1.4.0 Plastic Only test file has it false.) | – |
| Speedy | Generate fiber perimeters (`GenerateFiberPerimeters`), Generate fiber infills (`GenerateFiberInfill`) and Generate wipe tower (`GenerateWipeTower`) all set to false | – (no Speedy-specific check) |
| Reinforced | Spiral vase off | – |
| Fortified | Fiber infill pattern (`InfillFType`) = Solid; Outer wall (`Inset0Count`), Plastic perimeters (`InsetXPCount`), P. Outer, P. Inner and top/bottom solid layers = 0; spiral vase off | The same zeroing again, plus plastic sparse infill density = 0 and the plastic generate switches off. The slice **aborts** if any plastic-head path survives (*Behaviour analysis*, 1.4.0, untested). Areas fibre cannot fill are **dropped silently** (*G-code*, 1.4.0). 1.3.1 printed such areas with the FFF head instead. |

On a mode switch, the fibre switches inside masks and layups are also forced: off in Speedy, on in Fortified. See [Masks and layups](Masks-and-Layups.md).

**What this means in practice:**

- In **Fortified**, the plastic wall, infill and skin settings and the fibre infill pattern choice have no effect. The part's outer surface is the fibre bead itself.
- In **Speedy**, the fibre settings have no effect.
- In **1.4.0 Fortified**, thin features that fibre cannot fill are simply not printed, with no warning ([#38](https://github.com/3ricj/FibreSeeker3/issues/38)). Check the preview layer by layer. Details in [Fibre paths](Fibre-Paths.md).

A fuller list of settings that are ignored or hidden is on [Settings overview](Settings-Overview.md).

## Headline differences between modes

Factory values. *Behaviour analysis* (from the factory preset files).

| Setting | Speedy | Reinforced | Fortified |
|---|---|---|---|
| Fibre infill | – | Isogrid 20 % (25 % PETG + CGF) | Solid; Guide directions "0/90/0" or "0" |
| Fibre perimeters, outer / inner loops | – | 2 / 2 | 2 / 2 |
| Plastic sparse infill | Grid 15 % | Zigzag 20 % | none |
| Fibre max normal speed (`FiberNormalMaxSpeed`), mm/s | – | 30 X-CCF, 20 X-CGF | 30 X-CCF, 15–20 X-CGF |
| Enable support (`GenerateSupport`) | off | **on** (tree) | off |

Two of these are traps:

- **Reinforced turns tree support on.** Switching to Reinforced silently adds tree support. Turn it off if the part does not need it.
- **Fortified "0" Guide directions lays every fibre layer at 0°.** Seven of the sixteen Fortified profiles (PET GF + CGF, PA CF, PPS CF, PLA) ship with "0" (*G-code*, 1.4.0: a factory PLA 0.2 mm Fortified cube laid all 84 fibre-infill layers at 0°; [#47](https://github.com/3ricj/FibreSeeker3/issues/47)). Change it to "0/90" or "0/60/-60" for in-plane balance.

Other preset oddities are listed on [Factory materials and profiles](Factory-Materials-and-Profiles.md).

## Which profile to start from

*Inferred* from the factory values; not compared by test prints.

| Goal | Start from | Notes |
|---|---|---|
| Maximum stiffness and strength | Fortified, PETG or PET GF + X-CCF | Solid fibre at "0/90/0". For the PA CF, PPS CF, PLA and PET GF + CGF Fortified profiles, first change Guide directions from "0". In 1.4.0, check thin features survive (see above) |
| Strength with a plastic skin, sensible time | Reinforced, X-CCF | Isogrid fibre plus 2 + 2 fibre loops. Turn support off if not needed (factory on). Raise density with Enhancement Magnitude: the factory 20 % laid no fibre infill at all on a Benchy (*G-code*, 1.3.1), 30 % very little |
| Glass fibre (insulating, cheaper) | PETG or PET GF + CGF groups | 0.30 mm macro layer; slower fibre (15–20 mm/s) |
| Fastest plastic-only | Speedy 0.25 (PETG, PET GF, PLA) | Factory speeds already exceed the 25 mm³/s volumetric cap at 0.25 mm, so raising them gains nothing (see [Plastic paths](Plastic-Paths.md)) |
| Best Speedy surface | Speedy 0.1 (PETG, PET GF) | 9 top / 6 bottom layers, slower outer wall |
| High-temperature or stiff shell | PA CF or PPS CF groups (0.2 only) | Check PPS-to-PA bonding first: the PPS CF group pairs a PPS CF shell with the CFC PA matrix ([#45](https://github.com/3ricj/FibreSeeker3/issues/45)) |

## See also

- [How the slicer works](How-the-Slicer-Works.md)
- [Fibre paths](Fibre-Paths.md)
- [Plastic paths](Plastic-Paths.md)
- [Factory materials and profiles](Factory-Materials-and-Profiles.md)
- [Settings overview](Settings-Overview.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
