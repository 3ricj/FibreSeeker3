# Firmware Releases

Firmware files for the FibreSeeker 3 (SK3). These are downloaded directly from the official FibreSeeker OTA servers — this page simply indexes them for convenience.

> **Note:** Firmware is not mirrored in this repository. Use the official links below, and always verify you're downloading from `ota.fibreseek3d.com`.

| Version | Release date | File | Download |
|---------|--------------|------|----------|
| 2.2.42.831.320 | 2026-08-31 | `fibreseek-sk3-2.2.42.831.320.fibrepack` | [Download](https://ota.fibreseek3d.com/firmware/fibreseek-sk3-2.2.42.831.320.fibrepack) |
| 2.2.38.721.295 | 2026-07-21 | `fibreseek-sk3-2.2.38.721.295.fibrepack` | [Download](https://ota.fibreseek3d.com/firmware/fibreseek-sk3-2.2.38.721.295.fibrepack) |
| 2.2.30.613.256 | 2026-06-13 | `fibreseek-sk3-2.2.30.613.256.fibrepack` | [Download](https://ota.fibreseek3d.com/firmware/fibreseek-sk3-2.2.30.613.256.fibrepack) |

---

## Changelog

### 2.2.42.831.320

> *Released 2026-08-31; changelog first observed in OTA rollout logs on 2026-09-11.*

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

### 2.2.38.721.295

> **Update note:** After the update completes, perform a full-process print calibration to ensure the fast leveling function is working properly.
>
> *Released 2026-07-21. Source: [factory_update.json](https://ota.fibreseek3d.com/firmware/factory_update.json) (official release manifest; minimum hardware version 2.2).*

#### New Features

- **Fast leveling** — new supported leveling mode.
- **In-print temperature adjustment** — temperature can be modified directly from the interface during printing.
- **LAN upload progress** — shows upload progress when sending files remotely over the LAN.
- **Material shortage recovery guide** — pop-up guidance on running out of material; printing automatically resumes after material is fed.
- **Expanded AI visual inspection** — ongoing enhancements including fried noodles, foreign objects, print platform installation, and casing fall-off detection.
- **More detection settings** — sensitivity and on/off settings for additional detection types.
- **Camera image cropping** — reduces privacy risks.
- **Fiber length calibration reset** — supports restoring default values.
- **Fan speed controls** — exhaust fan, auxiliary cooling fan, and filter fan speeds adjustable from the interface.
- **Built-in / demo model updates** — including PLA and PETG small boats.

#### Experience Optimization

- **Fiber clog / material shortage detection** — tuned detection and prompts to reduce false positives and missed alerts during printing.
- **Automatic material retraction** — material retracts automatically after a plastic-shortage pause for easier cleanup of residual material.
- **More precise leveling compensation** — bed center point alignment and automatic checks for abnormal data.
- **Automatic retry for accidental G28 triggers** — reduces homing interference.
- **Pause / resume / cancel** — improved state management.
- **UI consistency** — improvements to copy, translation, and interface interaction.
- **HMI startup** — optimized startup method for the human-computer interaction program, reducing the risk of occasional black screens on startup.

#### Bug Fixes

- Fixed PID calibration getting stuck.
- Fixed conflict between material shortage and pause; occasional desynchronization of the material-shortage switch.
- Fixed errors from rapidly and repeatedly clicking filament load/unload, and load state-machine errors.
- Fixed repeated print initiation after stopping a remote print, and errors from multiple print initiations on the web.
- Fixed resuming from pause when print height exceeds the travel limit.
- Fixed post-print errors such as "timer too close" after print completion.
- Fixed Z-offset inaccuracies caused by key tilt affecting deviation calibration.
- Fixed display errors in time-lapse photography and print thumbnails.
- Fixed machine name not synchronizing after remote modification.

### 2.2.30.613.256

*No changelog available yet — community contributions welcome!*
