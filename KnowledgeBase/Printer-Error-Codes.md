# Printer Error Codes

This page explains which FibreSeeker 3 printer error codes trace back to the sliced file and what to change in Rocket Slicer, plus the machine-side checks from the official guides for the errors that are not slicer problems. It is not the full code list: every code and its meaning is in the community repo's [ERROR_CODES.md](https://github.com/3ricj/FibreSeeker3/blob/main/ERROR_CODES.md) (firmware 2.2.x). This page adds the slicer links, likely causes and fixes.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Error codes with a slicer link

**Some printer errors trace back to the sliced file; most others are machine checks.** Code meanings are from [ERROR_CODES.md](https://github.com/3ricj/FibreSeeker3/blob/main/ERROR_CODES.md). Links to slicer settings are *(inferred)* unless stated.

| Code / message | Meaning | Slicer link and fix | Evidence |
|---|---|---|---|
| 10057 → 10009 "Rotation distance can not be zero" | Comma decimals in G-code commands at the composite tool change (e.g. `P0,05`) | Caused by slicer 1.3.x on a Windows PC set to a comma-decimal locale; 1.4.0 writes commands with `.`. **Update the slicer** | Community ([ERROR_CODES.md](https://github.com/3ricj/FibreSeeker3/blob/main/ERROR_CODES.md)); G-code (1.4.0 commands clean) |
| 10054 "set temperature above … before extrusion" | Extrusion with a cold nozzle | Check the standby and preheat values and any custom tool-change G-code *(inferred)*. See [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md) | Community |
| 10055 "single extrusion length must be less than … mm"; 10056 "Move exceeds maximum extrusion" | Klipper's extrusion-length or extrusion cross-section limits | The 55 mm `U55` restart feed and the 5–10 mm tool-change retracts are the longest extrude-only moves in a file; very wide or tall custom lines raise the cross-section *(inferred)* | Community |
| 10026–10031 runout / clog per channel | Filament or fibre runout or clog. A message naming "extruder2 plastic" means the **fibre** channel | Not a slicer issue; see the clog rows in [Troubleshooting print quality](Troubleshooting-Print-Quality.md) and the official [Fibre unclogging in composite hotend](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/fibre-unclogging), [Plastic unclogging in composite hotend](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/composite-plastic-unclogging) and [Plastic hotend unclogging](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/plastic-hotend-unclogging) guides | Community |
| 10071 fibre tangling | Tow tangled at the spool or in the path | Check the spool and tow path | Community |
| 10072 platform not flat; 10052 Z out of range | Bed level or calibration | Level the bed hot; re-run calibration (10052 is reported fixed in firmware 2.2.38). See [First print failure](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/first-layer-print-failure) | Official; Community |
| 10076 material mismatch | Firmware 2.2.42 pre-check: the material in the sliced file ≠ the loaded roll | Match the slicer's materials to the loaded spools | Community |
| 10077 "chamber temperature too high" | Pause and alert from a sensor **inside the printhead housing**, at 53 °C (PLA) / 63 °C (PETG), to avoid clogs. The text is misleading and is to be fixed ([#10](https://github.com/3ricj/FibreSeeker3/issues/10); confirmed by the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35)) | Manufacturer's advice: for PLA / PETG in a warm room or on long prints, print with the door and top cover open; the in-chamber fans remove only limited heat. Not a slicer setting | Community; manufacturer statement in [#35](https://github.com/3ricj/FibreSeeker3/issues/35) |
| 10059–10062, 10075 door, chamber, louvre | Door open, or chamber louvre fault | Any `M106 P3` (the "Auxiliary cooling fan" column of the cooling table) opens the louvres and switches the chamber heater off (per the manufacturer in [#35](https://github.com/3ricj/FibreSeeker3/issues/35)); a link to louvre errors is *(inferred)* | Community; manufacturer statement |
| 30001–30015 | AI detection | A print started from the slicer over LAN carries the app's "skip foreign detect" flag | Behaviour analysis; Community |

Related slicer-side behaviours that can look like machine faults (chamber heater switching off, fans left running after a job, first layer printed on a bed still heating) are on [Troubleshooting silent behaviours](Troubleshooting-Silent-Behaviours.md).

## Machine-side checks

**These come from the official FibreSeek guides** (*Official*), plus FibreSeek engineers' replies in community issues where stated. For full procedures, see the [official wiki](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3).

- **Layer shift between heads** (plastic vs fibre offset): run nozzle-offset calibration; if it persists, measure the deviation and correct the printer's X/Y head offset; then check the belts (gauge 12–20) and for motor step loss. Do not use slicer head offsets (keep them at 0). Procedure: [Layer shifting](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/layer-shifting).
- **First layer:** level hot at the 7 retaining screws by paper drag; enable auto bed levelling; run a full calibration every 600 h and after hotend or collision-block work. Firmware 2.2.42 ignores Z-offset changes under 0.03 mm.
- **Plastic clogs:** heat to printing temperature (PETG 250 °C), extrude 50 mm, pull the PTFE tube, clear from the tip, then recalibrate the nozzle offset. Procedure: [Plastic hotend unclogging](https://wiki.fibreseek3d.com/en/printers/FibreSeeker3/troubleshooting/plastic-hotend-unclogging).
- **Environment and material:** 10–30 °C, 30–60 % RH; dry PETG, PC and PA CF before each print.
- **Logs for support** (per FibreSeek engineers in [#24](https://github.com/3ricj/FibreSeeker3/issues/24)): printer logs via Notifications → Export Logs; slicer logs via Settings (top right) → Export Logs. Send both with any report. The printer's web page at `http://anisoprint/` (or its IP address) also shows the console and logs.
- **Network upload stalls at a few per cent:** check the Wi-Fi signal and the printer's placement; copying the file to USB works as a fallback. In [#24](https://github.com/3ricj/FibreSeeker3/issues/24) the cause was the printer joining a distant access point.
- **FFF (right) head loading:** it is direct drive; feed the filament by hand up the tube to the extruder gear on the print head (per FibreSeek in [#24](https://github.com/3ricj/FibreSeeker3/issues/24)).
- **Maintenance:** wipe carbonised residue after each use (below 50 °C); grease, re-check the level and the PTFE tubes every 50 h; PID, vibration compensation and belts every 300 h.

For firmware versions and their changes, see [FIRMWARE.md](https://github.com/3ricj/FibreSeeker3/blob/main/FIRMWARE.md) and [Machine overview](Machine-Overview.md).

## See also

- [Troubleshooting slicer messages](Troubleshooting-Slicer-Messages.md)
- [Troubleshooting silent behaviours](Troubleshooting-Silent-Behaviours.md)
- [Machine overview](Machine-Overview.md)
- [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)
- [Known bugs](Known-Bugs.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
