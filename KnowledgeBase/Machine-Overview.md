# Machine Overview

This page explains how Rocket Slicer models the FibreSeeker 3 (SK3): which head is T0 and which is T1, which G-code axes and fans belong to each, the build volume, why head offsets are zero, and the printer values the slicer uses. It then summarises the hardware, firmware and official specifications that the slicer does not model but that matter when you interpret a print or an error.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## The machine as the slicer sees it

**Two heads on one toolhead, addressed only by tool number.** The left composite head is T0 and lays continuous fibre in matrix plastic; the right FFF head is T1 and prints every plain-plastic feature.

| | Composite head (left, "CFC") | FFF head (right, "FFF - 0.4 mm") |
|---|---|---|
| Tool / slot | **T0** (slot 0, type composite) | **T1** (slot 1, type plastic) |
| Klipper extruder section | `[extruder]` (matrix drive) plus `[extruder2]` (fibre feed, own melt-zone heater, no T-number) | `[extruder1]`: the factory pressure-advance lines target `EXTRUDER=extruder1` |
| G-code axes | **V** = matrix filament, **U** = fibre tow | **E** |
| Nozzle | 0.7 mm (`NozzleCDiameter`) | 0.4 mm |
| Prints | Fibre perimeters and fibre infill (with their matrix) | Every plastic entity: walls, infill, skins, support, brim, skirt |
| Part fan | `M106 P2` (Cooling fan index (`FanIndex`) 2) | `M106 P1` (fan index 1) |

The Klipper section mapping comes from the community's printer-config exploration ([Exploration/HardwareInfo.md](https://github.com/3ricj/FibreSeeker3/blob/main/Exploration/HardwareInfo.md)); the axes, nozzles and fan indices are in every exported file.

### Which heads each mode uses

| Mode | Heads used | Evidence |
|---|---|---|
| Speedy | T1 only. T0 is never heated: no `M104 … T0` at all | G-code, 1.3.1 and 1.4.0 |
| Reinforced | Alternates T0 and T1, twice per macro layer that has fibre (74 changes, 37 each way, for 37 fibre macro layers on a Benchy; 73 of them with a Z lift) | G-code, 1.3.1 |
| Fortified (1.4.0) | T0 only: one `T0 R`, no further changes | G-code, 1.4.0 Fortified Benchy |
| Fortified (1.3.1) | Switches to T1 136 times and prints plastic where fibre cannot fill; 1.4.0 instead leaves those areas empty (see [Known bugs](Known-Bugs.md), [#38](https://github.com/3ricj/FibreSeeker3/issues/38)) | G-code, 1.3.1 |

More on the modes is in [Print modes](Print-Modes.md).

### Hardware the slicer does not model

- The composite head has a fibre cutter, a fibre-tension sensor (load cell) and piezo bed sensing. A mechanical **collision block** sets which head is lowered. *Community* ([HardwareInfo.md](https://github.com/3ricj/FibreSeeker3/blob/main/Exploration/HardwareInfo.md)); the collision block is also named in the official calibration instructions.
- The slicer emits nothing for the tension sensor or bed sensing. Head lowering happens inside the `T0`/`T1` firmware macros *(Inferred)*.
- The firmware exposes a `fibre_servo`, so the cutter is a servo macro *(Inferred)*.

### Build volume

- **Slicer: 305 × 305 × 245 mm** (`AreaSizeX/Y/Z`, printer data, no UI field). The official Quick Start Guide gives **300 × 300 × 245 mm**, so keep 2–3 mm clear of the slicer's edges *(Inferred)*.
- The app blocks Preview if an enabled part is outside the volume. After slicing it warns, without blocking, if extrusion goes more than 2 mm outside. *Behaviour analysis.* Placement rules and messages are in [Troubleshooting: slicer messages](Troubleshooting-Slicer-Messages.md).

### Head offsets are zero — do not set them in the slicer

- X, Y and Z offset (`OffsetX/Y/Z`) are 0 for both heads. The slicer subtracts the head's offset from XY when it writes moves, so with zero offsets it writes machine coordinates directly. *Behaviour analysis.*
- The physical offset between the nozzles must therefore be applied by the firmware's `T0`/`T1` macros *(Inferred)*.
- **Do not enter a head offset in the slicer.** It would probably be applied twice *(Inferred)*.
- The official layer-shift procedure supports this: after nozzle-offset calibration it corrects the **machine's** X/Y offset (on the printer), not a slicer field. *Official* ([layer shifting](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/layer-shifting)).

### No homing or levelling in the file

SK3 output has no `G28`, no bed mesh and no `M84` (*G-code*, 1.3.1 and 1.4.0). Homing and levelling happen in firmware: on job start (the LAN start request carries an auto-levelling flag, see [Custom G-code and export](Custom-G-code-and-Export.md)) or inside `T<n> R` *(Inferred)*.

### Printer values the slicer uses

| Setting | Value | Note |
|---|---|---|
| X/Y travel speed (`TravelSpeedXY`) | 500 mm/s | |
| Z travel speed (`TravelSpeedZ`) | **10 mm/s** (`F600`) | Every slicer-generated Z-only move is `F600` |
| Z-lift on tool change (`ZLiftOnToolChange`) | **5 mm** | |
| Has heated chamber (`HasHeatedChamber`) | **on** | Causes the `M141 S0` / `M191 S0` lines in every job (see [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)) |
| Regular acceleration (`RegularAcceleration`) | **8000 mm/s²** | Used by entities without their own acceleration (see [Motion settings](Motion-Settings.md)) |

These are the printer preset's base values. The preset file also holds `…Over` variants (5 mm/s, 10 mm, off, 5000), but every real export (1.3.1 and 1.4.0, two independent users) carries the base values in its `; SESSION:` block and the moves match them, so the `…Over` values are **not** applied. *G-code.* Why they exist is unknown (see [Open questions](Open-Questions.md)).

## Hardware, firmware and official specifications

**What the printer is, beyond what the slicer models.** Rows marked *Community* come from the community repo's printer-config exploration ([Exploration/HardwareInfo.md](https://github.com/3ricj/FibreSeeker3/blob/main/Exploration/HardwareInfo.md)) or from manufacturer statements in issues; *Official* rows come from the FibreSeeker manual (1 Sep 2026) and Quick Start Guide.

| Topic | Fact | Why it matters | Evidence |
|---|---|---|---|
| Heads | Left (composite) head = Klipper `extruder` (matrix drive "V", 0.7 mm, PT1000) + `extruder2` (fibre feed "U", own heater). Right head = `extruder1` (0.4 mm, NTC). `T0` → `extruder`, `T1` → `extruder1` | Pressure-advance lines on `extruder1` tune only the FFF head | Community |
| Version skew | In older printer-config versions the same section names meant other hardware; firmware messages about "extruder2 plastic filament ran out" refer to the **fibre** channel | Read firmware error text with care (see [Printer error codes](Printer-Error-Codes.md)) | Community |
| Sensors | Door hall sensor, louvre (blinds) position sensors, fibre runout sensor, cutter hall sensors, fibre-tension load cell, accelerometer, piezo bed sensing | Explains door, louvre, tangling and runout errors | Community |
| Fans | Part fans `fan3` (FFF) and `fan4` (composite); `fan5` filter; `fan6` chamber blower; `fan7` exhaust; head throat fans. `M106` ports: P0 filter, P1 FFF (right) nozzle, P2 composite (left) nozzle, P3 auxiliary cooling, P5 exhaust | See [fan mapping](Tool-Changes-Temperatures-and-Fans.md) | Community; ports per the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35) |
| Chamber | Active chamber heating, max 65 °C. A PTC heater with a cross-flow fan and louvres, sharing hardware with auxiliary cooling, so the two are mutually exclusive. Mains-AC bed and chamber heaters via SSRs *(Inferred)* | `M141`/`M191` and `M106 P3` both change chamber state | Official (65 °C); manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35) |
| Windows runtime | The app's slicing and model-import components need the Microsoft Visual C++ 2015–2022 x64 runtime (Visual C++ Redistributable), and the installer does not ship it | On a PC without it, import, repair and slicing fail *(Inferred)*; install the redistributable. See [#37](https://github.com/3ricj/FibreSeeker3/issues/37) and [Troubleshooting: slicer messages](Troubleshooting-Slicer-Messages.md) | Behaviour analysis |
| Specs | Build volume 300 × 300 × 245 mm; nozzles 350 °C; bed 120 °C; minimum layer 50 µm; max FFF speed 500 mm/s; "max CFC speed 20 cc/h"; breakage and clog sensors on plastic and fibre | Slicer volume is 5 mm larger in X/Y | Official |
| Environment | 10–30 °C ambient, 30–60 % RH; dry PETG, PC and PA CF before each print and keep them sealed | First thing to check for poor surfaces or fibre adhesion | Official |
| Loading order | Load composite plastic, then fibre, then FFF plastic | – | Official |
| Calibration | "Print Calibration" covers vibration compensation, nozzle offset, bed level and nozzle PID; full calibration every 600 h; re-run nozzle offset after any hotend or collision-block work | First step for layer shifts between heads | Official |

Hands-on repair and replacement procedures are on the [official FibreSeek wiki](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3).

### Firmware versions

Firmware versions are named like `2.2.42.831.320` (released 31 Aug 2026), `2.2.38.721.295` (21 Jul 2026) and `2.2.30.613.256`; the fourth field appears to encode the release month and day *(Inferred)*. The full list and release notes are in the repo's [FIRMWARE.md](https://github.com/3ricj/FibreSeeker3/blob/main/FIRMWARE.md). Points that bear on printing:

- **2.2.42:**
  - material pre-check against the loaded roll (error 10076);
  - a cabin-temperature alarm (PLA 53 °C, PETG 63 °C) that actually reads a sensor inside the printhead housing and pauses the print to avoid clogs. Its "chamber temperature too high" text is misleading and is to be fixed (error 10077; [#10](https://github.com/3ricj/FibreSeeker3/issues/10); confirmed by the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35));
  - optional door-open pause;
  - **Z-offset changes under 0.03 mm are not applied**;
  - fibre-clog detection sensitivity;
  - nozzle cleaning before resume.
- **2.2.38:**
  - fast levelling (run a full calibration after updating);
  - temperature editing during a print;
  - fibre length calibration reset;
  - exhaust, auxiliary and filter fan speeds adjustable from the printer UI.

Error numbers are explained in [Printer error codes](Printer-Error-Codes.md).

## See also

- [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)
- [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md)
- [Factory materials and profiles](Factory-Materials-and-Profiles.md)
- [Printer error codes](Printer-Error-Codes.md)
- [Evidence and versions](Evidence-and-Versions.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
