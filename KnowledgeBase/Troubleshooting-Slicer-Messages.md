# Troubleshooting Slicer Messages

This page answers "what does this Rocket Slicer message mean, and what do I change?". It starts with a short diagnostic order for any problem, then lists every known "Slicing failed: …" message and every app warning or blocked action, each with its cause, the fix and how well the link is established. Messages are quoted as the user sees them, including the ones that appear in Chinese or as untranslated text.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Diagnostic order

**Check the cheap, certain things first; tune print settings last.**

1. **Which mode and which profile?** Speedy never lays fibre. Each mode (Speedy, Reinforced, Fortified) is a separate profile, so an edit in Reinforced is invisible in Speedy and Fortified. The layer height in the group name (0.1 / 0.2 / 0.25 mm) applies only to Speedy. See [Print modes](Print-Modes.md).
2. **Did the slice fail?** Read the "Slicing failed: …" text and look it up under "Slicing errors" below. For the full error trace, use Global settings → log export (ZIP). There is no debug-report switch.
3. **Did the edit take effect?** Factory template (no Apply), project reopened, red field (Apply silently refused), wrong mode, a mask or layup overriding the profile, Fortified forcing values. See [Silent behaviours](Troubleshooting-Silent-Behaviours.md).
4. **Look at the preview, not the model.** Use the Line Type colour mode and "Show Fiber Only" to see where fibre actually is. Missing fibre on small features, holes and thin walls is normal behaviour, not a fault.
5. **Check the factory anomalies** for your group (malformed PET GF 0.1 start G-code, "0" Guide directions, PPS CF / CFC PA bed temperatures, cost placeholders). See [Factory materials and profiles](Factory-Materials-and-Profiles.md) and [Known bugs](Known-Bugs.md).
6. **Read the G-code.** The `; SESSION:` block at the end holds every effective setting; strand framing (`M1001` … `M1002`), `M2800` cuts and fan lines show what was actually sent. For a shared file this is the first thing to read. Check the slicer version on line 1 (line 2 in 1.4.0), because 1.3.1 and 1.4.0 behave differently. On the printer, the web page at `http://anisoprint/` (or the printer's IP address) shows the console and logs. See [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md).
7. **Printer error code?** See [Printer error codes](Printer-Error-Codes.md); several point back to slicer settings.
8. **Only then tune print quality**, one setting at a time, with [Troubleshooting print quality](Troubleshooting-Print-Quality.md). Prefer *Behaviour analysis* rows over *FFF practice* rows.

**Conventions on this page.** Settings are given as UI label (`SettingKey`). "Profile ›", "Plastic ›", "Composite ›" and "Printer ›" name the dialog. ↑ means raise, ↓ means lower. S / R / F = Speedy / Reinforced / Fortified. Factory templates are view-only in the dialog: to change a setting, duplicate the profile group and edit the copy.

## Slicing errors: "Slicing failed: …"

**The slicer has no warnings channel: a problem either aborts the slice or is dropped silently.** On abort the app shows "Slicing failed: {message}" with the slicing core's own text, which is often developer English and sometimes Chinese. With no text it shows "Slicing failed. Please check the logs for details." The existence and wording of every message below is *Behaviour analysis*; the "Evidence" column grades the link between the cause and the fix.

### Settings and geometry

| Message (start) | Cause | Fix | Evidence |
|---|---|---|---|
| "{Entity} layer schedule is invalid: macro height {H} um must be evenly divisible by ratio {N}." | The Outer wall layer height (`Inset0RatioToMacro`) or Plastic perimeters layer height (`InsetXPRatioToMacro`) divisor does not divide the macro height in µm exactly (at 0.30 mm, divisors 7, 8 and 9 fail) | Pick a divisor that divides exactly, or change Macrolayer height (`MacroLayerHeight`) | Behaviour analysis |
| "Adaptive wall planning failed for {family}, island {i} on layer {n}." | Use classic wall generator (`UseClassicWallGenerator`) is off and the adaptive wall planner failed. There is no fallback | Turn the classic generator back on (factory setting) | Behaviour analysis |
| "Classic wall flow produces a non-positive line spacing." / "Gap flow produces a non-positive nominal spacing." | A wall or gap width is too small for its layer height | Make widths clearly larger than the entity's layer height | Behaviour analysis + Inferred |
| "No models to slice or models are too small to be sliced" (or the Chinese "切片中止：无可用模型…") | Every part is thinner than the first layer, or the units are wrong (inch STL) | Scale the part or fix the units; make sure it sits on the bed | Behaviour analysis + Inferred |
| "Part '{name}' contains multiple masks with priority {N}…" | Two masks on one part share a priority | Give each mask a unique priority | Behaviour analysis |
| "ProfileSettings 数据不完整…" / "Error setting value for property…" | Profile imported from another version, or a corrupt value | Re-create it from a factory group (duplicate) | Behaviour analysis + Inferred |
| "min_width_top_surface must be…" | The `MinWidthTopSurface` string is malformed (it can only be set in a preset file) | Use a value such as "300%" | Behaviour analysis |
| "Invalid extrusion type in slot" / "Invalid slot index: … combination" / "Empty guid tags for Profile-Material" | Slot, extruder and material assignment mismatched | Re-select the printer, both materials and the profile | Behaviour analysis + Inferred |
| "Can't load mesh…", "Invalid path to model file", "Island must contain at least one polygon…", "Coordinates must be finite." | Damaged, moved or degenerate mesh | Model Repair; re-export from CAD; nudge the layer height | Behaviour analysis + Inferred |
| "Lost big overhang perimeter" | Overhang perimeters, a feature with no UI switch that is on in factory Reinforced profiles | No UI switch; change the orientation or the geometry *(inferred)* | Behaviour analysis + Inferred |

### Fibre and Fortified

| Message (start) | Cause | Fix | Evidence |
|---|---|---|---|
| "Cut length not enough" | A strand is shorter than Cut distance (`CutDistance`, 58 mm) minus the contact radius at the point where the cut is placed; usually tiny fibre islands | Raise Minimum perimeter length (`MinimumPerimeterLength`) or Minimum line length (`InfillF…MinSegmentLength`); turn fibre off in small regions with a mask | Behaviour analysis + Inferred |
| "FORTIFIED mode cannot materialize plastic entities on layer {n}" + a list | A plastic path survived in Fortified, for example a mask or layup re-adding walls, skins or infill (1.4.0). It did **not** fire on a factory 1.4.0 Fortified Benchy that lost whole features: small features are dropped silently instead (see [Silent behaviours](Troubleshooting-Silent-Behaviours.md) and [#38](https://github.com/3ricj/FibreSeeker3/issues/38)) | Remove such mask or layup rules; otherwise use Reinforced | Behaviour analysis + Inferred |
| "Invalid priming line length. Expected {L}." | Priming line geometry inconsistent; the priming line is placed automatically 10 mm in front of the parts | Move parts away from the front edge | Behaviour analysis + Inferred |
| "Invalid block in fiber polygon", "Unknow fiber infill" | Internal error | Try another fibre pattern; report it with the logs | Behaviour analysis |

### Support

| Message (start) | Cause | Fix | Evidence |
|---|---|---|---|
| "{SupportEWMM\|SupportInterfaceEWMM} ({w} mm) must be greater than MacroLayerHeight…" | Normal support line width ≤ macro height (the app usually blocks this first) | Support line width (`SupportEWMM`) ↑, or 0 = automatic; or use Tree support | Behaviour analysis |
| "Conventional-support {role} at Z=… has incompatible extrusion width…" | Independent support layer height produced a layer thicker than the line width allows | Max support layer height ↓ or support line width ↑ | Behaviour analysis + Inferred |
| "Minimum support layer height must not exceed maximum…" | Min > max | Fix the pair | Behaviour analysis |
| Chinese tree-support errors joined by "; " (e.g. 支撑角度 … 必须在 (0, 90) 范围内) | Out-of-range tree-support values (angle, width, radii, wall count 0–2, density) | Return the named value to its range | Behaviour analysis (which ones abort and which only warn is inferred) |
| "Tree-support … failed: {inner}" / "Tree-support extrusion at Z=…" | A wrapped inner error; the last one is usually line width ≤ layer height | Read the inner text; widen the support lines | Behaviour analysis + Inferred |
| "Organic tree support requires…" | Organic tree support combined with independent support layer height | Toggle independent support layer height | Behaviour analysis |

### Other

| Message | Cause | Fix | Evidence |
|---|---|---|---|
| "The selected profile has no supported print mode." | A custom group with every mode's "Enable profile" off | Re-enable a mode in the group | Behaviour analysis + Inferred |
| "Motion planning did not complete", "Preheat would modify committed G-code blocks", "Error while generating blocks for layer {n}" | Internal error | Export the logs; the layer number points to the geometry at fault | Behaviour analysis |
| "Too many temp project files. Please contact customer support (support@anisoprint.com)." | Over 100 files in the temporary project folder (the Anisoprint address is a leftover) | Clear the app's temporary project folder | Behaviour analysis |
| "Migration failed" / "File writing exception" | Old project or database; disk space or permissions | Re-create the project; check the disk | Behaviour analysis |
| "The generation service is already reporting an active run." | A second slice was started before the first finished | Wait, or cancel the first | Behaviour analysis |
| **Every model reported broken; Model Repair fails; slicing fails reporting `boostvoronoi_4x5x0.dll` as missing although the file is present** (Windows) | The Microsoft Visual C++ 2015–2022 x64 runtime is missing *(inferred)*. Parts of the slicer and the model importer depend on that runtime and the installer does not ship it; Windows reports a file as "not found" when one of *its* dependencies is missing. Most PCs already have the runtime from other software | Install the latest Visual C++ Redistributable for Visual Studio 2015–2022 (x64) from Microsoft, then restart Rocket Slicer | Behaviour analysis + Inferred; Community [#37](https://github.com/3ricj/FibreSeeker3/issues/37) |

## App warnings and blocked actions

**These come from the app itself, before or after slicing.** Failures in the settings forms are quiet: the field turns red and Apply does nothing, usually without any text.

| What the user sees | Cause | Fix | Evidence |
|---|---|---|---|
| "Model collisions detected, cannot enter preview mode"; panel badges "Model out of print area", "Brim/Skirt out of print area", "Model collides with wipe tower", "Collision between models" | An enabled part is outside 305 × 305 × 245 mm, the brim or skirt is outside the bed, a part touches another part, or a part hits the wipe tower (R/F with wipe tower on) | Move or scale; hide (disable) unwanted parts; touching parts are never merged | Behaviour analysis |
| "The G-code extrusion path exceeds the printable area on {axes}…" (8 s warning, after slicing) | Extrusion more than 2 mm outside the build volume; often the brim, skirt or priming line | Keep parts at least about 10 mm from the front edge in R/F *(inferred)*; the slice is not blocked | Behaviour analysis (priming-line link inferred) |
| "Normal support line width must be greater than the model layer height." / "Enabled normal support interfaces require…" / "Normal support requires a finite, positive model layer height." | Normal support with line width ≤ Macrolayer height | Support line width ↑ or 0 (automatic); or Tree support | Behaviour analysis |
| "Independent support minimum and maximum layer heights must be finite, positive…" / "The maximum support layer height must be greater than or equal to the minimum." / "The support line width is too small…" | The independent support layer-height pair is invalid | Fix min/max; widen the lines | Behaviour analysis |
| Mode, printer, material or profile switch does nothing | The support-geometry check fails and **blocks switching** until it is fixed | Fix the support fields above | Behaviour analysis |
| Field turns red, Apply does nothing (no text) | A comparison rule failed: support min/max layer heights, or the speed-limit heights (that one also shows "The speed limit end height must be greater than the start height.") | Correct the pair | Behaviour analysis |
| "The selected infill pattern doesn't support 100 % density. Switch to zigzag pattern?" | 100 % density with a pattern other than Line, Zigzag or Concentric | Yes → Zigzag. **No → the density resets to 50 % (the built-in default) in the sidebar**, while the dialog keeps the stored value | Behaviour analysis |
| "Automatic support line widths will be checked …" | Information only | None | Behaviour analysis |
| "Confirm — Make sure the CFC plastic is loaded on the machine…" | Save To File in Fortified | Load the CFC composite. In 1.4.0 that is all the job uses (Fortified Benchy: no `T1`). A **1.3.1** Fortified file also uses the FFF head (136 changes to `T1` in the `Benchy_fortified.gcode` test file) even though the prompt and the `Composite Only` header say otherwise: load FFF plastic too, or check the file for `T1` lines | Behaviour analysis; G-code (1.3.1, 1.4.0) |
| Untranslated text `preview-view.gcodeTooLargeError` | Cloud send of a file ≥ 200 MB, or over quota; the message has no English text | Send over LAN or USB; slice coarser | Behaviour analysis + Inferred |
| "Failed to start print" | LAN upload or start failed, or a cloud job error | Check the IP address, port 7125 and PIN; "Reconnect LAN" | Behaviour analysis |
| "Could not import "{file}". Check file format and integrity." | The profile JSON lacks the group or its four arrays | Re-export it from the source | Behaviour analysis |
| "This profile group is used by active projects and cannot be deleted." | The group is in use | Switch the projects to another group first | Behaviour analysis |
| `只能在同一个 Part 内重排 Mask` (Chinese toast: "masks can only be reordered within the same part") | A mask was dragged onto another part | Masks reorder only within their own part | Behaviour analysis |
| "Import repair did not complete. Try Model Repair." / "Error: {count} non-manifold edge(s)." | Mesh defects | Model Repair (full mode); fix in CAD | Behaviour analysis |

For support logs, FibreSeek engineers ask for both sets of logs: printer logs via Notifications → Export Logs, and slicer logs via Settings (top right) → Export Logs ([#24](https://github.com/3ricj/FibreSeeker3/issues/24)).

## See also

- [Troubleshooting silent behaviours](Troubleshooting-Silent-Behaviours.md)
- [Troubleshooting print quality](Troubleshooting-Print-Quality.md)
- [Printer error codes](Printer-Error-Codes.md)
- [Known bugs](Known-Bugs.md)
- [Settings overview](Settings-Overview.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
