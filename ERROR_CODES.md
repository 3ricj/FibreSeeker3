# Error Codes

A community-maintained reference of FibreSeeker 3 error codes — what they mean, what causes them, and which firmware versions address them.

> **Note:** Where a fix is attributed to a firmware release, it's based on changelog analysis, not an official statement — treat it as the best available guidance. See [FIRMWARE.md](FIRMWARE.md) for firmware downloads.

## Entries with known firmware fixes

| Code | Description | Update to at least |
|------|-------------|--------------------|
| [`10052`](#10052--z-axis-out-of-range) | Z axis out of range | `2.2.38.721.295` |
| [`10065`](#10065--right-plastic-missing) | Right nozzle plastic filament missing | `2.2.38.721.295` |

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
