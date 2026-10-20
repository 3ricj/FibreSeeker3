# FibreSeeker 3 and Rocket Slicer knowledge base

This is an independent, community-written reference for the **FibreSeeker 3 (SK3)** continuous-fibre printer and **Rocket Slicer**. It explains what the settings actually do, what the slicer writes into the G-code, why prints fail, how to cut print time, and which bugs are known, with the evidence for each claim. It complements FibreSeek's own [official wiki](https://wiki.fibreseek3d.com/en/home), which covers hands-on maintenance, unclogging and part replacement.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

> Not affiliated with or endorsed by FibreSeek. Facts are drawn from real exported G-code (the repo's [Test_files](https://github.com/3ricj/FibreSeeker3/tree/main/Test_files)), the factory preset files shipped with the slicer, FibreSeek's manual and guides, community issues, and analysis of the slicer's behaviour. Every claim carries an evidence label; read [Evidence and Versions](Evidence-and-Versions.md) first.

## Start here

| If you want to… | Read |
|---|---|
| Choose between Speedy, Reinforced and Fortified | [Print Modes](Print-Modes.md) |
| Fix a "Slicing failed" message or an app warning | [Troubleshooting: Slicer Messages](Troubleshooting-Slicer-Messages.md) |
| Find out why something is missing from a print with no message | [Troubleshooting: Silent Behaviours](Troubleshooting-Silent-Behaviours.md) |
| Fix a print-quality problem (fibre or plastic) | [Troubleshooting: Print Quality](Troubleshooting-Print-Quality.md) |
| Look up a printer error code | [Printer Error Codes](Printer-Error-Codes.md) |
| Check whether a problem is a known bug, and the workaround | [Known Bugs](Known-Bugs.md) |
| Make prints faster | [Print Time](Print-Time.md) |
| Look up a setting | [Settings Overview](Settings-Overview.md) |

## How the slicer works

- [How the Slicer Works](How-the-Slicer-Works.md): how a setting's value is decided, macro and micro layers, the slicing pipeline.
- [Plastic Paths](Plastic-Paths.md): walls, infill, skins, support.
- [Fibre Paths](Fibre-Paths.md): fibre perimeters and infill, the life of a strand, where plastic replaces fibre, what is dropped silently.
- [Masks and Layups](Masks-and-Layups.md): the only per-part overrides.

## Settings reference

- [Settings Overview](Settings-Overview.md): where settings live, sidebar controls, settings that don't do what they say.
- [Layers and Walls](Settings-Layers-and-Walls.md) · [Plastic Infill and Features](Settings-Plastic-Infill-and-Features.md) · [Fibre](Settings-Fibre.md) · [Support, Cooling and Other](Settings-Support-Cooling-and-Other.md) · [Material, Extruder and Printer](Settings-Material-Extruder-Printer.md)

## Machine and G-code

- [Machine Overview](Machine-Overview.md): the printer as the slicer sees it; hardware and firmware.
- [Factory Materials and Profiles](Factory-Materials-and-Profiles.md): factory values and known preset anomalies.
- [G-code Structure and Fibre Strands](G-code-Structure-and-Fibre-Strands.md): file layout, strand start, cut and restart.
- [Tool Changes, Temperatures and Fans](Tool-Changes-Temperatures-and-Fans.md)
- [Motion Settings](Motion-Settings.md): acceleration, pressure advance, corner velocity.
- [Custom G-code and Export](Custom-G-code-and-Export.md)
- Companion pages in the repo: [GCODE_REFERENCE.md](https://github.com/3ricj/FibreSeeker3/blob/main/GCODE_REFERENCE.md), [ERROR_CODES.md](https://github.com/3ricj/FibreSeeker3/blob/main/ERROR_CODES.md), [FIRMWARE.md](https://github.com/3ricj/FibreSeeker3/blob/main/FIRMWARE.md), [HardwareInfo.md](https://github.com/3ricj/FibreSeeker3/blob/main/Exploration/HardwareInfo.md).

## Known bugs and open questions

- [Known Bugs](Known-Bugs.md): every known defect with its issue link and workaround, and what real G-code confirmed or contradicted.
- [Open Questions](Open-Questions.md): what is still unknown and what test would settle it.

## Contributing

Found something wrong or new? Open an [issue](https://github.com/3ricj/FibreSeeker3/issues) with the slicer version, the profile you used and, ideally, the exported G-code (zip it: GitHub won't attach `.gcode`). See [Evidence and Versions](Evidence-and-Versions.md#how-to-contribute-a-correction).


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
