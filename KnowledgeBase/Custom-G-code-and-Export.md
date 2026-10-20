# Custom G code and Export

This page covers the custom G-code fields in Rocket Slicer — which fields exist, that they take no placeholders, where each one actually lands in the file, and the bug that strips a trailing `n` or backslash — and then how a sliced job leaves the slicer: Save To File, the default file name and thumbnail, sending over the LAN (Moonraker) and sending via the cloud.

*Applies to: Rocket Slicer 1.4.0.857 (1.3.1.480 where stated); printer firmware 2.2.42.831.320.*

## Custom G-code fields

**Fields:**

| Where in the app | Field (key) |
|---|---|
| Printer | Start G-code (`StartGCode`), End G-code (`EndGCode`), Code Before / After Extruder Change (`GCodeBefore/AfterExtruderChange`) |
| Profile | Start G-code (`StartGcode`), End G-code (`EndGCode`) |
| Composite extruder | Cut G-code (`CutCode`) |

**No placeholders are supported.** The text is written verbatim: no `{temperature}`-style variables and no templating. To pass values to the firmware, write literal numbers or call a `printer.cfg` macro with literal parameters. Klipper's Jinja templating works only inside `printer.cfg` macros. *Behaviour analysis*, consistent with every test file.

### Trailing-character bug: end every field with a newline

*G-code*, confirmed in 1.4.0.857; [#48](https://github.com/3ricj/FibreSeeker3/issues/48).

- A field whose **last character is a lowercase `n`** loses it. `SET_FAN_SPEED FAN=chamber_fan` becomes `…chamber_fa`.
- A trailing backslash is also stripped. Uppercase `N` is safe.
- Test case: a profile End G-code of `M117 done` / `M117 fan` with no final newline is stored as `"M117 done\nM117 fan"` in the file's `; SESSION:` but written as `M117 fa`.
- **Fix:** end every custom field with a real newline, or with a trailing comment such as ` ;`.
- No factory text ends in `n`, so factory output is unaffected.

### Where each field runs

| Field | Actual position |
|---|---|
| Profile Start G-code | **First**, after `SET_PRINT_STATS_INFO TOTAL_LAYER`, before any heating or tool select. Commands that need hot nozzles or a selected tool will not work here |
| Printer Start G-code | After the non-waiting `M104`/`M140` and `G21 G90 M83`, before `M190` and `M109`. Not "after homing": nothing homes |
| Before / after extruder change | Inside every change: after `; Start change extruder` / before `; End change extruder` |
| Profile End G-code | After the heads are set to 0 °C, before `M140 S0` |
| Printer End G-code | Last, before the trailer |

The full start and end sequences are on [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md); the tool-change routine is on [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md).

### Other details

- **The profile Start G-code runs before the initial `T0 R`/`T1 R`**, so a tool macro that re-applies stored per-tool settings can override it *(Inferred)*. Settings that must stick (pressure advance, velocity limits) may need to go after the tool select, or be checked in the console. See [Motion settings](Motion-Settings.md).
- **A space-only field counts as non-empty**: its comment wrappers are emitted, and a whitespace-only line is kept in the 1.4.0 file.
- **Windows line ends are harmless.** CRs from Windows line ends in custom fields do **not** reach the file: the Cut G-code's CRLFs are normalised and no 1.3.1 file contains a CR byte. The 1.4.0 file does have 320 lines ending in CRLF, all slicer-written (header, `; LAYER:`, `SET_PRINT_STATS_INFO CURRENT_LAYER`, trailer), so 1.4.0 output has mixed line ends; Klipper strips the CR *(Inferred, harmless)*.
- **A leading empty line** in the profile Start G-code is dropped (1.3.1).

## Export and send

### Save To File

**Save To File has no export options:** no binary G-code, no compression and no thumbnail size.

- **Flow:** (Fortified only: confirm "Make sure the CFC plastic is loaded on the machine…") → confirm the thumbnail → OS save dialog.
  - The prompt names only the CFC plastic. That is correct for 1.4.0 (the Fortified Benchy has no `T1`). The 1.3.1 Fortified Benchy also printed 1.43 m of FFF PETG, so **for 1.3.1 Fortified jobs load FFF plastic too**.
- **Default name:** `<project>_<plastic names joined by +>_<time>.gcode`, for example `bracket_PETG_3h12m.gcode`. The time is the slicer's estimate, which omits most heating waits (see [Print time](Print-Time.md)). Illegal file-name characters become `_`.
- **Thumbnail.** The slicer writes a placeholder line that the app replaces with a 1024 × 1024 PrusaSlicer-style block (`; thumbnail begin 1024x1024 …` / `; thumbnail end`) at the **end** of the file (*G-code*, 1.4.0; the 1.3.1 files carry a 512 × 512 block in the same place; no placeholder remains in any test file). It is rendered when slicing starts, so it shows the plate as it was then.

### LAN send (Moonraker)

*Behaviour analysis* of the app's send flow.

1. Bind the printer by IP (TCP test to port **7125**), then enter the PIN from the printer's Account page.
2. "Print Start" uploads with `POST http://<ip>:7125/server/files/upload` (`root=gcodes`). The file name is truncated to 255 bytes, and only one upload per printer runs at a time.
3. The app then calls JSON-RPC `printer.print.start` with `filename` and the FibreSeek-specific flags `auto_leveling` and `skip_foreign_detect`. Their values come from the printer's current auto-levelling and AI-detection state as last read *(Inferred: vendor extensions, not stock Moonraker)*.
4. Any failure shows "Failed to start print".

**Printer web page.** `http://anisoprint/` from a PC on the same LAN, or the printer's IP, opens the printer's own web homepage (*Community* notes; inferred to be the Moonraker-backed UI behind port 7125). Useful for checking a sent job, the console and logs — for example, to see "Unknown command" lines from custom G-code.

### Cloud send

- **Limits:** files under **200 MB**, and within the account quota. Over-limit files show the raw message `preview-view.gcodeTooLargeError`, which has no English text.
- **Steps:** create a source, create a job, then force-start it.
- The file sent is identical to the saved file, thumbnail included.

## See also

- [G-code structure and fibre strands](G-code-Structure-and-Fibre-Strands.md)
- [Motion settings](Motion-Settings.md)
- [Tool changes, temperatures and fans](Tool-Changes-Temperatures-and-Fans.md)
- [Troubleshooting: slicer messages](Troubleshooting-Slicer-Messages.md)
- [Known bugs](Known-Bugs.md)


---
Community reference, not affiliated with FibreSeek. Covers Rocket Slicer 1.4.0.857 (1.3.1.480 where stated) and firmware 2.2.42.831.320; last reviewed 20 October 2026. Evidence labels: see [Evidence and Versions](Evidence-and-Versions.md). Text licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Corrections welcome via [issues](https://github.com/3ricj/FibreSeeker3/issues).
