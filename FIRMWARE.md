# Firmware Releases

Firmware files for the FibreSeeker 3 (SK3). These are downloaded directly from the official FibreSeeker OTA servers — this page simply indexes them for convenience.

> **Note:** Firmware is not mirrored in this repository. Use the official links below, and always verify you're downloading from `ota.fibreseek3d.com`.

| Version | File | Download |
|---------|------|----------|
| 2.2.42.831.320 | `fibreseek-sk3-2.2.42.831.320.fibrepack` | [Download](https://ota.fibreseek3d.com/firmware/fibreseek-sk3-2.2.42.831.320.fibrepack) |
| 2.2.30.613.256 | `fibreseek-sk3-2.2.30.613.256.fibrepack` | [Download](https://ota.fibreseek3d.com/firmware/fibreseek-sk3-2.2.30.613.256.fibrepack) |

---

## Changelog

### 2.2.42.831.320

#### New Features

- **Material type pre-check** — verifies the slicing file matches the material roll loaded on the machine; a pop-up prompts if they do not match (error code `10076`).
- **In-cabin temperature monitoring & exception reporting** — reports an exception when the in-cabin temperature exceeds 53°C for PLA or 63°C for PETG.
- **Enhanced pause-shift interface** — supports XY repositioning and switching print heads while paused.
- **Editing of loaded material channels** — added an editing entry for loaded material channels.
- **Built-in model updates** — new built-in models for PLA and PETG.
- **Door-open pause function** — disabled by default; can be enabled under *Settings → Print Settings*.

#### Printing Optimization

- **Z-offset compensation** — no compensation is applied when the value is less than 0.03, preventing excessive looseness.
- **Z motor operating current** — set to 0.5 A to prevent the motor from overheating.
- **Fiber clog detection** — sensitivity changed to issue continuous frames, making sensitivity settings more effective.
- **Piezoelectric ceramic repositioning** — added a 100 ms delay to improve repositioning stability.
- **Pause-recovery nozzle cleaning** — automatically cleans the nozzle before resuming a print.
- **Temperature fallback during continuation** — active nozzle temperature falls back to the preheating temperature during continuation.

#### Experience Optimization

- **Unified pause docking position** — parks at (50, 100) when paused.
- **Pause light cue** — red light flashes as a prompt during abnormal pauses.
- **Noodle detection threshold** — lowered to reduce false positives.
- **Stats logging** — records only once every 5 seconds during printing.
- **WiFi scanning** — optimized to prevent network connection conflicts.
- **Local/USB file browsing** — faster browsing when multiple files are present.

#### Bug Fixes

- Fixed occasional low-temperature extrusion error during pause recovery.
- Fixed mismatch between thumbnail and file name when changing files, causing display issues.
- Fixed occasional save error during heated-bed leveling.
- Fixed failure to save time-lapse photography.
- Fixed timeout when downloading update packages under poor network conditions (timeout extended from 3 minutes to 30 minutes).
- Fixed issue of not cleaning the installation directory after a failed update.
- Fixed failure to write the serial number file.

### 2.2.30.613.256

*No changelog available yet — community contributions welcome!*
