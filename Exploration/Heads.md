# FibreSeeker3 Extruder / Nozzle Naming Map

**Date:** 2026-09-28
**Scope:** current machine, firmware `fibreseek-sk3-2.2.42.831.32x`

---

## TL;DR table

| Klipper name | Physical thing | Head | Tool | Nozzle | Heater sensor | UI / slicer alias |
|---|---|---|---|---|---|---|
| `extruder` | Plastic (polymer) drive — **FFF** | **Left** | T0 | 0.7 mm | PT1000 (`toolhead:PC2`) | "V" motor; macro `ACTIVATE_LEFT_P_EXTRUDER` |
| `extruder1` | Plastic (polymer) drive — **FFF** | **Right** | T1 | 0.4 mm | Generic 3950 (`toolhead:PC1`) | "T1"; macro `ACTIVATE_RIGHT_P_EXTRUDER` applies calibrated `xoffset/yoffset/zoffset` |
| `extruder2` | **Dry-fiber feed — CFC** (Continuous Fiber Composite = 纤维 / "fibre" channel) | **Left head's fiber port** — *not* a separate tool | shares the left 0.7 mm nozzle (co-extrusion) | — | custom resistance ADC (`PC4`, main board; heater `PB11`) | "U" motor / "CFC" in GUI; `ACTIVATE_LEFT_F_EXTRUDER`; `ALIGN_FIBRE_LENGTH` calibrates its 37.5 `rotation_distance` |

## The mental model

- There are **two physical heads** (left, right). *FFF vs CFC is a material-channel distinction, not a third head.*
- The **left head has two feed motors**: `extruder` (plastic resin) and `extruder2` (dry carbon tow). A "CFC print" co-extrudes fiber + resin through the **same left nozzle**.
- The right head has one feed motor: `extruder1` (plastic only).
- `materials.json` encodes the split as `"material_type": "plastic"` (FFF spools) vs `"fibre"` (CFC spools).
- GUI temperature list labels ("Extruder", "Extruder 1", "Extruder 2") are just the Klipper object names. **"Extruder 2" = the fiber feeder on the left head**, which is why it has its own heater (fiber melt zone on the main board, `PB11`) but no T-number.

## Layering: five vocabularies for the same three motors

| Layer | Left plastic | Right plastic | Left fiber (CFC) |
|---|---|---|---|
| Klipper config/API | `extruder` | `extruder1` | `extruder2` |
| Tool change (G-code) | `T0` | `T1` | *(no tool; `ACTIVATE_EXTRUDER EXTRUDER=extruder2`)* |
| Anisotouch GUI | "Extruder" / Left | "Extruder 1" / Right | "Extruder 2" / **CFC** |
| Slicer E-axis / `SET_EXTRUDER_MODE` | **V** | — | **U** |
| Chinese cfg comments | 左塑料挤出 | 右塑料挤出 | 左喷嘴纤维挤出机 |

`SET_EXTRUDER_MODE` (`tool_switch.cfg:156`) modes:

| S | Mode | Active extruder | `extruder2` motion queue |
|---|---|---|---|
| 0 | U mode (fiber only) | `extruder2` | `extruder2` |
| 1 | Direct-drive UV | `extruder` | `extruder2` |
| 2 | V mode (plastic only) | `extruder` | synced to `extruder` queue |

`RESTORE_EXTRUDER2` undoes the sync and restores the calibrated rotation distance.

## Related hardware on the same names

- **Fans:** `fan3` = plastic part cooling, `fan4` = 纤维 fiber cooling (`fans_v2.2.cfg:33`); `SET_FAN_SPEED` macro index 1→fan3, 2→fan4.
- **Fiber cutter:** servo macro `M2800` (seen as `CUT` label in the GUI string dump); runout sensor for the fiber channel is `filament_sensor` (`^PG4`, "F" sensor).
- **Idiomatic "left head active" test** used throughout the cfg set (e.g. `base_control.cfg:114`, `nozzle_cleaning_station.cfg:44`, `print_control.cfg:231`):

  ```jinja
  {% if printer.toolhead.extruder == "extruder" or printer.toolhead.extruder == "extruder2" %}
  ```

  (`extruder2` is only ever "current" when the left head is in play, so this pair = "left head".)

## The version-skew trap (why old docs look wrong)

In **v1.1–v1.3** `printer_base_*.cfg`, the same Klipper names were wired to different hardware:

| Name | v1.1–v1.3 meaning | v2.x meaning (current box) |
|---|---|---|
| `extruder` | motor4 **纤维 fiber** extruder | **left plastic** |
| `extruder1` | right plastic | right plastic (unchanged) |
| `extruder2` | Motor6 **共挤 co-extruder** | **left-head fiber feed** |

Consequences:

- Stale error strings still carry the old meaning, e.g. `filament_switch_sensor.cfg:30`: *"extruder2 plastic filament ran out"* — in v2.x hardware that sensor message firing while `extruder2` is active is actually about the **fiber** channel. The `_v2.0` sensor config file matches current reality.
- **Rule of thumb:** trust only `printer.cfg` comments + `printer_base_v2.2.cfg` on this machine; treat v1.x comments and any error text sourced from them as suspect.

## Quick reference: who does what

| Task | Name to use |
|---|---|
| Heat left nozzle | `M104/M109 T0` (→ `extruder`) |
| Heat right nozzle | `M104/M109 T1` (→ `extruder1`) |
| Heat fiber melt zone | `M104 T2` (→ `extruder2`, main-board heater) |
| Select left head | `T0` |
| Select right head | `T1` (applies saved `xoffset/yoffset/zoffset`) |
| Feed fiber | `ACTIVATE_LEFT_F_EXTRUDER` or `SET_EXTRUDER_MODE S=0` |
| Calibrate fiber e-steps | `ALIGN_FIBRE_LENGTH L=nnn` / reset `RESET_FIBRE_EXTRUDER_DISTANCE` (→ 37.5) |
| Cool printed plastic | `SET_FAN_SPEED FAN=fan3` |
| Cool fiber line | `SET_FAN_SPEED FAN=fan4` |
| Cut fiber | `M2800` |

---

## Related documents

- [`FibreUsage.md`](FibreUsage.md) — how these channels appear in reference g-code (`T0` uses `U`/`V`, `T1` uses `E`).
- [`HardwareInfo.md`](HardwareInfo.md) §7–§8 — MCU pins, drivers, and heaters behind these names.
