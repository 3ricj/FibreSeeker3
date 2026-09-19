# Error Codes

A community-maintained reference of FibreSeeker 3 error codes — what they mean, what causes them, and which firmware versions address them.

> **Note:** Where a fix is attributed to a firmware release, it's based on changelog analysis, not an official statement — treat it as the best available guidance. See [FIRMWARE.md](FIRMWARE.md) for firmware downloads.

## Entries with known fixes

| Code | Description | First fix to try |
|------|-------------|------------------|
| [`10052`](#10052--z-axis-out-of-range) | Z axis out of range | Update firmware to `2.2.38.721.295`+ |
| [`10057`](#10057--unhandled-exception-during-run) | Unhandled exception during run — comma-decimal G-code at the CFC tool change (`Rotation distance can not be zero` / `10009`) | Slicer bug, **not** fixed in firmware — re-slice with a period-decimal locale or use the drag-&-drop `Fixer.bat` |
| [`10065`](#10065--right-plastic-missing) | Right nozzle plastic filament missing | Update firmware to `2.2.38.721.295`+ |
| [`10072`](#10072--platform-not-flat) | Platform not flat | Level the heatbed — see the manual's *Heatbed Leveling* section |
| [`10077`](#10077--chamber-temperature-too-high-wrong-sensor) | "Chamber temperature too high" — but the check reads the **toolhead** sensor, not the chamber | Not fixed in firmware — see [issue #10](../../issues/10); community config workaround below |

---

## 10052 — Z axis out of range

**Example message:** `code 10052, z axis out of range -0.4050`

The reported Z position falls outside the machine's valid travel range. A small negative value such as `-0.4050` typically indicates a bad Z reading rather than a genuine crash into the travel bound.

**First thing to try:** update your firmware to **`2.2.38.721.295` or above**, because it includes the fix:

> *"Fixed Z-offset inaccuracies caused by key tilt affecting deviation calibration."*

A bad calibration reading producing a spurious `-0.405` Z value would trip the out-of-range check, so this fix removes the most likely root cause.

1. Update firmware (current release: `2.2.42.831.320` — see [FIRMWARE.md](FIRMWARE.md)).
2. After updating, run a full-process print calibration to reset Z-offset values.
3. If the error persists on current firmware, open an [issue](../../issues) with your firmware version, what you were doing when it appeared (print start vs. pause/resume), and whether recalibration cleared it.

---

## 10057 — Unhandled exception during run

> *Cause and fix contributed by Sébastien Seb — [Facebook post](https://www.facebook.com/groups/772897998822068/posts/1063285146450017/), Sept 7, 2026.*

**Example message:** `code 10057, Unhandled exception during run` — raised at the exact moment the tool change switches to the **CFC (fiber) extruder**, and accompanied on the Klipper side by `Rotation distance can not be zero` (code [`10009`](#full-error-code-reference)).

If the print dies right as the fiber head is engaged, **don't panic — your machine is fine.** This is a known software bug in Rocket Slicer, not a hardware fault.

### Cause: the comma error

Rocket Slicer generates its G-code using your PC's **local number format**. If Windows is set to a language that uses a comma as the decimal separator (French, German, and many others), the slicer writes decimal values with a comma instead of a dot — for example `P0,05` instead of `P0.05`.

Klipper's firmware does not understand that comma. It reads the value as `0`, which trips a mechanical safety check — *"rotation distance can not be zero"* — and shuts down immediately to protect the extruder motor. The UI surfaces this as the generic `10057 Unhandled exception during run`.

### Solution: the automatic fixer (drag & drop)

You don't have to dig into the G-code for every print, and you don't have to change your global Windows settings. A small script fixes any sliced file in about a second.

**1. Create the fix file.** On your desktop, right-click → **New → Text Document**, open it, and paste exactly this code inside:

```bat
@echo off
chcp 65001 >nul
echo ==========================================
echo G-code Fixer (Rocket Slicer Bug)
echo ==========================================
echo.
if "%~1"=="" (
    echo [ERROR] No file detected.
    echo Please DRAG AND DROP a .gcode file directly onto the icon of this .bat script
    echo.
    pause
    exit /b
)
set "fichier_entree=%~1"
set "dossier=%~dp1"
set "nom_fichier=%~n1"
set "extension=%~x1"
set "fichier_sortie=%dossier%%nom_fichier%_fixed%extension%"
echo Target file: "%nom_fichier%%extension%"
echo Replacing commas with dots in progress...
powershell -Command "(Get-Content -LiteralPath '%fichier_entree%' -Encoding UTF8) -replace '(\d),(\d)', '$1.$2' | Set-Content -LiteralPath '%fichier_sortie%' -Encoding UTF8"
echo.
echo Success! The cleaned file has been created here:
echo "%nom_fichier%_fixed%extension%"
echo.
pause
```

Then go to **File → Save As…**, choose **All Files (\*.\*)** in the *Save as type* dropdown, name the file **`Fixer.bat`**, and save it.

**2. Use it.** Grab the defective `.gcode` file produced by Rocket Slicer and **drag and drop it onto the `Fixer.bat` icon**. A console window opens briefly, and a new file with the `_fixed` suffix appears next to the original. Send **that** file to the printer.

> **Alternative — fix it at the source.** Set your Windows *Regional format* to one that uses a period as the decimal symbol (Control Panel → Region), then re-slice. This removes the root cause but affects your whole system, so most people prefer the script above.

> **Status:** No firmware release addresses this, and it is not in any changelog — the comma/decimal formatting lives in Rocket Slicer on your PC, not in the machine firmware (see [FIRMWARE.md](FIRMWARE.md) for the full changelog). Until the slicer emits locale-independent G-code, use the workaround above. If the crash still happens on a file you sliced with a period-decimal locale, open an [issue](../../issues) with your Rocket Slicer and firmware versions.

---

## 10065 — Right plastic missing

**Example message:** `code 10065, right nozzle plastic filament missing`

The machine reports the right-hand plastic filament channel as empty. If filament is in fact loaded, this is a phantom run-out reading from the filament-missing sensor/switch.

**First thing to try:** update your firmware to **`2.2.38.721.295` or above**, because it includes:

> *"Fixed conflict between material shortage and pause; occasional desynchronization of the material-shortage switch."*

The run-out sensor is a switch, and a desynchronized switch state makes the machine report "missing" on a channel that actually has filament. That release also tuned shortage detection to reduce false positives during printing.

1. Update firmware (current release: `2.2.42.831.320` — see [FIRMWARE.md](FIRMWARE.md)).
2. Re-seat the filament in the right plastic channel and clear the error.
3. If it recurs, check the run-out sensor physically — dust on an optical sensor mimics a run-out.
4. If the error persists on current firmware, open an [issue](../../issues) with details.

---

## 10072 — Platform not flat

**Example message:** `bed_mesh: platform not flat, range %1 mm > %2 mm`

The bed-mesh scan measured more variation across the build surface than the allowed limit — the print platform (heatbed) isn't flat within tolerance. This is a mechanical condition, not a firmware bug: **you need to adjust the flatness of the bed.**

**First thing to try:** level the heatbed. The step-by-step procedure is in the **[FibreSeeker Manual](Documentation/Fibreseeker%20Manual%201_Sep_2026.pdf)** — see the **"Heatbed Leveling"** section (page 44). Key points from that section:

1. **Preheat the heatbed before leveling** — the bed deforms when hot, so leveling it cold gives wrong results.
2. **Clean the heatbed surface** first; debris between bed and plate skews the reading.
3. Adjust the **leveling screws** at the points the mesh reports as low/high, then re-run the mesh scan to confirm the range is within tolerance.

Other guides in this repo that touch on leveling:

- [Quick Start Guide](Documentation/FibreSeeker%203%20Quick%20Start%20Guide.pdf) — "Bed Level" calibration step (p. 21) and re-verification of heatbed leveling after moving the machine (p. 31)
- [Troubleshooting First Layer Print Failure](Documentation/Troubleshooting%C2%A0First%20Layer%20Print%20Failure%20(1).pdf) — insufficient heatbed leveling as a first-layer failure cause

If the mesh still reports out-of-range after careful hot leveling, the bed surface or plate may be physically damaged — open an [issue](../../issues) with your mesh readings.

---

## 10077 — Chamber temperature too high (wrong sensor)

**Example message:** `code 10077, Chamber temperature too high: 63.8C (limit 63.0C for PETG)`

Introduced in firmware **`2.2.42.831.320`** as *"In-cabin temperature monitoring & exception reporting"* (see [FIRMWARE.md](FIRMWARE.md)): the machine is supposed to raise an exception when the in-cabin (chamber) temperature exceeds **53°C for PLA/PLA-CF** or **63°C for PETG**. **The check does not read the chamber sensor.** The implementing Moonraker component, `enclosure_temp_monitor`, ships configured to monitor **`temperature_sensor toolhead_temp`** — the sensor on the toolhead board — and reports that value as the chamber temperature.

### Evidence from the printer's own logs

The shipped Moonraker configuration and its startup logs name the sensor directly:

```text
[enclosure_temp_monitor]
enable = True
sensor = temperature_sensor toolhead_temp   # ← wrong sensor
check_interval = 5.0
```

```text
EnclosureTempMonitor: loaded (enable=True, sensor=temperature_sensor toolhead_temp,
  limits={'PLA': 53.0, 'PLA_CF': 53.0, 'PETG': 63.0}, interval=5.0s, ...)
EnclosureTempMonitor: subscribed to temperature_sensor toolhead_temp (temp=49.0)
```

And the alarm notification payload identifies it again at trigger time:

```text
notify_enclosure_temp_monitor_alarm: {'message': 'Chamber temperature too high: 63.8C
  (limit 63.0C for PETG)', 'temperature': 63.76, 'limit': 63.0, 'material': 'PETG',
  'sensor': 'temperature_sensor toolhead_temp', 'paused': True}
```

Meanwhile the machine's *actual* chamber sensor is a separate, properly configured device that was nowhere near the limit:

```ini
[heater_generic chamber]            # the real chamber sensor
sensor_type: Generic 3950
sensor_pin: PB0                     # ≈ 34.8°C at the moment of the alarm

[temperature_sensor toolhead_temp]  # the sensor the 10077 check actually reads
sensor_type: Generic 3950
sensor_pin: toolhead:PC3            # ≈ 63.8°C — exactly the value shown in error 10077
```

The reported value tracks the toolhead, not the chamber: the alarm fired when `toolhead_temp` hit ~63.8°C (chamber ~34.8°C), and it cleared ~8 minutes later at `temp=60.9` as the toolhead cooled. Full capture: [issue #10](../../issues/10).

### Why it matters

The toolhead sits beside the hotends and routinely reaches 60–70°C during normal PETG printing, so the check **pauses healthy prints for a condition that isn't occurring**. The accompanying guidance ("open the chamber door and top cover to ventilate") then sends users chasing chamber cooling while the dashboard's chamber reading contradicts the error. Conversely, a *genuine* chamber overheat is not what this check is protecting against.

### Workaround (community-suggested, unverified)

The monitored sensor is a configuration option in `[enclosure_temp_monitor]`:

1. In the Moonraker config (typically `~/printer_data/config/moonraker.cfg`), change `sensor = temperature_sensor toolhead_temp` to `sensor = heater_generic chamber` — or set `enable = False` to disable the check entirely.
2. Restart Moonraker.

> **Caveats:** this section is part of the firmware-supplied configuration — a later OTA update may overwrite the edit. This workaround has not been verified by the maintainers.

### Status

Open — tracked in [issue #10](../../issues/10). No firmware release fixes this as of `2.2.42.831.320`. If monitoring the toolhead sensor turns out to be intentional (as a proxy for cabin temperature), the error message and sensor labeling still need correcting — they currently report a toolhead reading as "chamber" temperature.

---

# Full Error Code Reference

The complete error code database, extracted from the firmware. Messages are shown as they appear on screen; `%1`, `%2`, etc. are placeholders filled in at runtime.

## 10000-series — Machine & firmware errors

| Code | Message |
|------|---------|
| 10001 | MCU '%1' shutdown: Timer too close |
| 10002 | Lost communication with MCU '%1' |
| 10003 | Serial connection closed |
| 10004 | mcu '%1': Unable to connect |
| 10005 | mcu '%1': Serial connection closed |
| 10006 | Failed automated reset of MCU |
| 10007 | Printer is not ready |
| 10008 | Exception in flush_handler |
| 10009 | Rotation distance can not be zero |
| 10010 | Exception in priming_handler |
| 10011 | Shutdown due to webhooks request |
| 10012 | Unable to read existing config on SAVE_CONFIG |
| 10013 | Unable to parse existing config on SAVE_CONFIG |
| 10014 | Unable to write config file during SAVE_CONFIG |
| 10015 | Error on '%1': missing %2 |
| 10016 | Error on '%1': unable to parse %2 |
| 10017 | Error on '%1': %2 must have minimum of %3 |
| 10018 | Error on '%1': %2 must have maximum of %3 |
| 10019 | Error on '%1': %2 must be above %3 |
| 10020 | Error on '%1': %2 must be below %3 |
| 10021 | The value '%1' is not valid for %2 |
| 10022 | Printer is already printing |
| 10023 | Printer is not supported command: %1 |
| 10024 | Unable to open file %1 |
| 10025 | Internal error on command:"%1" |
| 10026 | extruder fiber filament ran out! |
| 10027 | extruder fiber filament clogging in the extruder! |
| 10028 | extruder2 plastic filament ran out! |
| 10029 | plastic filament clogging in the extruder2! |
| 10030 | extruder1 plastic filament ran out! |
| 10031 | plastic filament clogging in the extruder1! |
| 10032 | Sensor '%1' temperature %2 not in range %3:%4 |
| 10033 | MCU 'toolhead' shutdown: ADC out of range |
| 10034 | Requested temperature (%1) out of range (%2:%3) |
| 10035 | pid_calibrate interrupted |
| 10036 | %1 center init failed |
| 10037 | Update xyz offset config file failed |
| 10038 | left print head throat fan malfunction, please check the hardware! |
| 10039 | Right print head throat fan malfunction, please check the hardware! |
| 10040 | Mainboard cooling fan malfunction, please check the hardware! |
| 10041 | Constant flow fan malfunction, please check the hardware! |
| 10042 | accelerometer 'adxl345' measured no data |
| 10043 | No accelerometer measurements found |
| 10044 | Failed to set ADXL345 register |
| 10045 | Invalid adxl345 id (got %1 vs %2). |
| 10046 | The homing sensor was triggered before the Z-axis moved. |
| 10047 | No trigger on %1 after full movement |
| 10048 | Endstop %1 still triggered after retract |
| 10049 | TMC '%1' reports error: %2 |
| 10050 | Heater %1 not heating at expected rate |
| 10051 | Homing failed due to printer shutdown |
| 10052 | Move out of range on %1 axis: %2 |
| 10053 | Must home axis first |
| 10054 | Please set the temperature to above %1℃ before extrusion. |
| 10055 | The single extrusion length must be less than %1mm |
| 10056 | Move exceeds maximum extrusion (%1mm^2 vs %2mm^2) |
| 10057 | Unhandled exception during run |
| 10058 | %1 detected missing filament |
| 10059 | Door is not closed with the chamber temperature |
| 10060 | Louver closing failure. Please inspect the drive unit. |
| 10061 | Louver opening failure. Please inspect the drive unit. |
| 10062 | Louver state exception. Please inspect the drive unit. |
| 10063 | Left fiber missing |
| 10064 | Left plastic missing |
| 10065 | Right plastic missing |
| 10066 | Left fiber missing and right plastic missing |
| 10067 | Left plastic missing and right plastic missing |
| 10068 | Left fiber missing and left plastic missing |
| 10069 | Left fiber missing, left plastic missing, and right plastic missing |
| 10070 | Z homing check failed: probe result %1 mm, expected %2 ±%3 mm (delta %4 mm) |
| 10071 | extruder fiber filament tangling in the extruder! |
| 10072 | bed_mesh: platform not flat, range %1 mm > %2 mm. |
| 10073 | bed_mesh: mesh z out of range, \|min\|=%1 \|max\|=%2 > %3 mm. |
| 10074 | bed_mesh: verify failed, delta %1 mm > %2 mm, mesh unreliable |
| 10075 | Chamber door is open. |
| 10076 | Material mismatch: %1 |
| 10077 | Chamber temperature too high: %1C (limit %2C for %3) |

## 20000-series — System & interface software errors

| Code | Message |
|------|---------|
| 20001 | Failed to create log directory |
| 20002 | Too many log files |
| 20003 | Failed to archive log file |
| 20004 | Failed to open log file |
| 20005 | Log stream not initialized |
| 20006 | NetworkError::InterfaceNotAvailable |
| 20007 | NetworkError::DBusError |
| 20008 | NetworkError::DeviceNotFound |
| 20009 | NetworkError::Timeout |
| 20010 | NetworkError::ScanFailed |
| 20011 | NetworkError::AuthenticationFailed |
| 20012 | NetworkError::ConnectionFailed |
| 20013 | NetworkError::InvalidParameter |
| 20014 | [AESCrypto] Encryption error |
| 20015 | [AESCrypto] Decryption error |
| 20016 | [AESCrypto] Decryption finalization failed |
| 20017 | Fixed IV size mismatch |
| 20018 | [AccountBindingModel] AES encryption returned empty payload |
| 20019 | [AccountBindingModel] QR code generation failed |
| 20020 | Failed to connect to UDisks2 service |
| 20021 | Device does not have filesystem interface |
| 20022 | Cannot access Properties interface |
| 20023 | Failed to get MountPoints property |
| 20024 | MountPoints variant is invalid |
| 20025 | Mount failed |
| 20026 | Failed to unmount device |
| 20027 | Failed to get managed objects |
| 20028 | Direct backlight control failed |
| 20029 | Failed to set backlight |
| 20030 | Please ensure [BACKLIGHT_PATH] exists and has proper permissions |
| 20031 | Or configure sudo to allow backlight control without password |
| 20032 | Cannot write to file |
| 20033 | Cannot read from file |
| 20034 | Invalid JSON format in settings file |
| 20035 | WebSocket error occurred: |
| 20036 | WebSocket max reconnect attempts reached |
| 20037 | [SystemModel] G-code error response received: |
| 20038 | Failed to open number keyboard for [input type] input |
| 20039 | [PowerLoss] Error in file detail response: |
| 20040 | [PowerLoss] No 'result' in file detail response |
| 20041 | [TimeModel] Failed to enable NTP sync |
| 20042 | [TimeModel] Failed to set system timezone |
| 20043 | Invalid timezone ID constructed: |
| 20044 | No system timezones found! |
| 20045 | Failed to decode MJPEG frame. |
| 20046 | MJPEG stream finished. |
| 20047 | Network error during stream: |
| 20048 | Timestamped errors with [AccountBindingModel] |
| 20049 | Failed to generate QR code for text: |
| 20050 | QR code data is null for text: |
| 20051 | Failed to open release info file: |
| 20052 | Failed to parse current version JSON: |
| 20053 | Failed to write to release info file: |
| 20054 | Install script not found: |
| 20055 | Install script is not executable: |
| 20056 | Install script crashed with exit code: |
| 20057 | Invalid delayMs for throttled deletions: |
| 20058 | Skipping empty filePath in throttled delete queue. |

## 30000-series — AI detection errors

| Code | Message |
|------|---------|
| 30001 | AI Detection component failed to load |
| 30002 | AI Detection service is not connected |
| 30003 | AI Detection: Build plate not detected |
| 30004 | AI Detection: Foreign object detected |
| 30005 | Defect detected: %1 |
| 30006 | Failed to load image, Maybe camera is not open |
| 30007 | defect detect error |
| 30008 | foreign object detect error |
| 30009 | machine status query error |
| 30010 | AI Detection connection timeout |
| 30011 | AI Detection connection refused |
| 30012 | AI Detection websocket handshake failed |
| 30013 | AI Detection websocket read loop error |
| 30014 | AI Detection: Printhead cover detached |
| 30015 | AI Detection: Hand detected |

---

*Know what a code means or how you resolved it? Contribute an entry — this page grows one code at a time.*
