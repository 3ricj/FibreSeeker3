# Evidence and Versions

This page explains how to read the rest of this wiki: what each evidence label means, which slicer and firmware versions the findings cover, which real G-code files back them, how the findings were checked and corrected, and how to send in a correction of your own. Read it once before relying on any number elsewhere, because a fact confirmed in 1.3.1 output is not automatically true of 1.4.0, and nothing here has yet been checked against a timed or measured physical print.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Evidence labels

**Every non-obvious fact carries one of six labels.** In prose they appear in italics, e.g. (*G-code*, 1.3.1); in tables they sit in an "Evidence" column. Unlabelled prose on a page is *Behaviour analysis* unless the page says otherwise.

| Label | What it means | How much to trust it |
|---|---|---|
| **G-code** | Confirmed in real exported G-code. The slicer version is always given: 1.3.1 (1.3.1.480) or 1.4.0 (1.4.0.857) | Strongest. Holds for that version and the profile used; another version may differ |
| **Official** | From the FibreSeek manual (1 Sep 2026), a quick-start guide or the [official wiki](https://wiki.fibreseek3d.com/en/home) | What the manufacturer says. Where real output disagrees, the page says so |
| **Community** | Reported in a GitHub issue on this repo (linked) | As good as the issue's evidence; check the thread for replies |
| **Behaviour analysis** | Established by analysing the slicer's behaviour and its factory preset files, not yet shown in an exported file | Usually reliable for mechanisms and factory values; several such claims were corrected once real G-code was checked (see below) |
| **Inferred** | Reasoned or calculated, not tested | A good starting estimate. Most time figures are in this class |
| **FFF practice** | General 3D-printing or composite experience, not specific to this slicer | A starting point only, not a finding about Rocket Slicer |

Combined labels such as "Behaviour analysis + Inferred" mean the mechanism is established but the size of the effect, or its link to a visible symptom, is an interpretation. The words **untested** or **needs a test print** mark claims nobody has run yet.

## Conventions used on every page

- **Settings** are given as the UI label, then the setting key in backticks, e.g. Max. normal speed (`FiberNormalMaxSpeed`). The keys are the names you see in every exported G-code's `; SESSION:` block and in the factory preset files. UI labels are spelt exactly as the app spells them ("Fiber infill"), even though the prose uses Australian spelling.
- **Dialogs** are named "Profile ›", "Plastic ›", "Composite ›" and "Printer ›". Text in brackets after a label, e.g. "Printing speed (outer wall)", is context added here, not part of the label.
- **Factory values** are from the baseline profile group "PETG 0.2 mm | CFC PETG+X-CCF / PETG" unless stated. S / R / F = Speedy / Reinforced / Fortified.
- **Factory range** columns give the spread over all 16 factory profiles of a mode, only where values differ. "no spread" means every factory profile of each visible mode has the baseline value. "–" means the field is not shown in that mode (absent, hidden or forced), or nothing notable.
- **The baseline group's macro layer is 0.2 mm in Speedy but 0.24 mm in Reinforced and Fortified.** The fibre sets that height, not the group name.
- **Layer-height divisors** are shown as "÷2 = 0.12" (stored divisor = height in mm). Booleans are on/off; option lists use the option name.
- **The value shown is the value used.** No factory profile carries an override value and the UI writes every edit to the base value, so what you see is what slices, unless a mode forces a value (see [How the slicer works](How-the-Slicer-Works.md)). The printer preset does hold a second set of override values, but real exports from both versions show its **base** values in use (Z travel 10 mm/s, tool-change Z-lift 5 mm, heated chamber on, regular acceleration 8000 mm/s²).
- **Factory templates are view-only** in the dialog. To change a setting, duplicate the profile group and edit the copy.
- ↑ means raise and ↓ means lower.
- **Troubleshooting pages:** find the symptom, check its evidence label, change one setting at a time and reslice. Before changing anything, make sure the edit will actually take effect ([Silent behaviours](Troubleshooting-Silent-Behaviours.md)).
- **Time pages:** judge changes by real print time, not the slicer's estimate, which omits most heating waits ([Print time](Print-Time.md)).

## Version coverage

| Component | Version | Coverage |
|---|---|---|
| Rocket Slicer | **1.4.0.857** | Primary target. Settings, factory presets and behaviour analysis are for this build. Real 1.4.0 G-code exists for a Plastic Only job and a Fortified Benchy; **no 1.4.0 Reinforced file has been checked**, so fibre and tool-change details for Reinforced are confirmed for 1.3.1 only |
| Rocket Slicer | **1.3.1.480** | Ten real test files in all three modes. Used to confirm fibre strands, tool changes, temperatures and fans, and to document 1.3.1-only bugs |
| Printer firmware | **2.2.42.831.320** | Release notes for 2.2.42 (31 Aug 2026) and 2.2.38 (21 Jul 2026) in [FIRMWARE.md](https://github.com/3ricj/FibreSeeker3/blob/main/FIRMWARE.md). The firmware's own handling of vendor commands (`M1001`, `M1002`, `M2800`, brush macros) is not documented; see [Open questions](Open-Questions.md) |

**Version differences that matter** (from the files and the community copy of the slicer changelog):

- **1.3.1:** separate plastic and fibre extrusion compensation ratios; no 25 mm³/s plastic cap (peaks 26–61 mm³/s, [#4](https://github.com/3ricj/FibreSeeker3/issues/4)); Z-hops emitted with Do Z-hop off ([#29](https://github.com/3ricj/FibreSeeker3/issues/29)); minimum-layer-time slowdown stops at about 40 mm/s ([#5](https://github.com/3ricj/FibreSeeker3/issues/5)); Fortified prints plastic fill with the FFF head where fibre cannot reach; fixed accelerations imported as ≈ 50 from legacy projects (check projects saved before 1.3.1).
- **1.3.2:** PA and PPS profiles added; plastic perimeters beyond the model boundary fixed.
- **1.4.0:** adaptive-width walls and gap infill; region ownership between skins, bridges and fibre reworked ([#30](https://github.com/3ricj/FibreSeeker3/issues/30)); 25 mm³/s cap present; Fortified uses only the composite head and silently leaves out what fibre cannot fill ([#38](https://github.com/3ricj/FibreSeeker3/issues/38)); comments may use the locale's decimal comma ([#46](https://github.com/3ricj/FibreSeeker3/issues/46)); 1024 × 1024 thumbnail (512 × 512 in 1.3.1).

## The real G-code behind the G-code label

**The repo's [Test_files](https://github.com/3ricj/FibreSeeker3/tree/main/Test_files) hold eleven sliced files.** Every one reports `Edition` 4 (the full licence edition) in its `; SESSION:` block.

| File(s) | Slicer | Mode and material | Notes |
|---|---|---|---|
| `Benchy_speedy_default_settings.gcode` (PETG), `Benchy_speedy_default_settings-pla.gcode` (PLA) | 1.3.1.480 | Speedy | Composite head never heated |
| `Benchy_renforced_level1` … `level5.gcode`, PETG, Isogrid 20 / 10 / 30 / 60 / 80 % (5 files) | 1.3.1.480 | Reinforced | 37 fibre macro layers, 74 tool changes each; at 10–20 % no fibre infill is laid ([#43](https://github.com/3ricj/FibreSeeker3/issues/43)) |
| `Benchy_renforced_level5-pla.gcode`, PLA, Isogrid 20 % | 1.3.1.480 | Reinforced | PLA standby and preheat behaviour |
| `Benchy_fortified.gcode`, PETG | 1.3.1.480 | Fortified | The only Fortified file with fibre; 271 tool changes, 103 of 240 layers plastic only |
| `Benchy_fortified-pla.gcode` | 1.3.1.480 | **Plastic Only** despite its name | Use as a Plastic Only PLA sample |
| `Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode` (the "Tinmorry" file) | **1.4.0.857** | Plastic Only | 1.86 million moves; confirms the 25 mm³/s cap, `M204` alternation, CRLF lines and 1.4.0 comment format |

Further 1.4.0.857 slices referred to on these pages, **not in Test_files**:

- **Fortified Benchy** sliced from the repo's `3DBenchy.stl` with the factory "PETG 0.2 mm | CFC PETG+X-CCF / PETG" profile: one `T0 R`, no `T1`, 374 strands, estimate 6 h 10 min, unfillable features left empty ([#38](https://github.com/3ricj/FibreSeeker3/issues/38)).
- **60 × 60 × 20 mm cube**, Fortified, factory PLA 0.2 mm group, Guide directions "0": 84 of 84 fibre-infill layers at 0° ([#47](https://github.com/3ricj/FibreSeeker3/issues/47)).
- **End G-code test** `M117 done` / `M117 fan` with no final newline, written as `M117 fa` ([#48](https://github.com/3ricj/FibreSeeker3/issues/48)).

Line numbers quoted on other pages refer to these public files.

## How the findings were checked

**Every concrete claim was re-checked against primary public evidence, and the pages were corrected where it disagreed.** Three passes were made:

1. **Against the factory preset files and the slicer's behaviour** (67 claims, weighted towards numbers, defaults, setting names and G-code). Factory values were read from the preset files shipped with the slicer, resolving each profile's group name and reporting both the baseline value and the spread across all 16 profiles per mode. Arithmetic (speed caps, strand overhead, worked time cases) was redone from scratch. 53 were confirmed; 13 were wrong or imprecise and were fixed.
2. **Against real exported G-code** (48 claims). Each figure was recomputed directly from the Test_files, the repo's [FIRMWARE.md](https://github.com/3ricj/FibreSeeker3/blob/main/FIRMWARE.md), the slicer changelog copy, the official manual and quick-start guides in the repo's `Documentation` folder, the G-code inspector's rules, and the presets. 36 were confirmed outright; 12 were wrong or imprecise and were fixed.
3. **Before filing community issues** [#38](https://github.com/3ricj/FibreSeeker3/issues/38)–[#48](https://github.com/3ricj/FibreSeeker3/issues/48): every bug report was re-checked against the test files, the 1.4.0.857 presets and fresh 1.4.0.857 slices. Two behaviours (Fortified "0" guide directions, the custom-field trailing character) were confirmed with purpose-made test slices. One figure posted in a comment on [#1](https://github.com/3ricj/FibreSeeker3/issues/1) (longest un-retracted travel "about 75 mm") was corrected by editing the comment to 51.8 mm, because the 75 mm move is the travel off the brush after a tool change.

**Kinds of corrections made:**

| Area | What changed |
|---|---|
| Plastic speed cap | The flow multiplier is part of the cap: cap speed = 25 ÷ (width × height × multiplier), e.g. ≈ 258 mm/s for Speedy 0.2 mm sparse infill, not ≈ 284 |
| Fibre corners | Rounded corners are **not** faster than sharp ones below about R 70 mm, because the slow speed is held for the slowing length after the arc |
| Strand overhead | ≈ 7–10 s per strand, restated on factory values (earlier figures used non-factory defaults) |
| Printer values | Real exports use the printer preset's base values (Z travel 10 mm/s, Z-lift 5 mm, chamber on, regular acceleration 8000), not its override values |
| G-code content | Chamber commands (`M141 S0` × 2, `M191 S0` × 1) **are** emitted; `M204` alternates 5000/8000; aux/exhaust fans are left on in nine files; 1.4.0 output has mixed CRLF line ends; 1.3.1 thumbnails are 512 × 512 |
| Measured ranges | Real tow use 1.24–1.98 × the reported fibre length (restart 20–50 % of feed); tension segments in 19 of 37 strands, not all; 1.3.1 flow peaks 26–61 mm³/s; initial heat-up charged 3.5–5.4 s |
| Presets and labels | Factory printing order is "Last in layer"; plastic line widths 0.35–0.45 mm; CFC PLA preheat 220 °C against print 230 °C; coast before retract on in 14 of 16 Speedy and 6 of 16 Reinforced profiles |

**Known soft spots** (figures used on these pages but not independently re-run): the ≈ 5–6 s slicer charge per tool change; the 8–31 % margin of the slicer's motion time over a Klipper-style model; Fortified guide-direction layer counts (60 at 0°, 40 at 90°); correction moves at 14–18 % of strand path; and Isogrid strand lengths of 70–230 mm (another path measure gives 76–191 mm). The fibre corner-angle threshold, the brush-macro durations and the exact tool-change charge are also not pinned down. **No claim has been checked against a physical print.**

## How to contribute a correction

**If your printer or slicer does something different from these pages, open an issue.** The most useful reports include:

1. The **G-code file** (zipped if large), or the `.3mf` project if the problem is in slicing.
2. The **slicer version** (it is written in the G-code header) and, for print-side problems, the **firmware version**.
3. The **page and section** you are correcting, and what you saw instead (line numbers in the G-code help).
4. For time or quality claims, what you measured on the printer (e.g. Moonraker's `print_stats` time).

Open it at https://github.com/3ricj/FibreSeeker3/issues. A finding confirmed in a shared file moves from *Behaviour analysis* or *Inferred* to *G-code*; a manufacturer answer becomes *Official* or *Community*. Questions still waiting for exactly that kind of evidence are listed on [Open questions](Open-Questions.md).

## See also

- [Home](README.md)
- [Open questions](Open-Questions.md)
- [Known bugs](Known-Bugs.md)
- [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md)
- [Settings overview](Settings-Overview.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
