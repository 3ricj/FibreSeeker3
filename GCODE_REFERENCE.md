# FibreSeek Rocket Slicer — G-code Reference

**The G-code dialect emitted by the FibreSeek Rocket Slicer: custom axes, custom M-codes, and non-standard handling of otherwise-standard commands.**

This document describes the syntax and semantics of FibreSeeker gcode files as they are, for readers implementing or evaluating G-code support for FibreSeeker printers.

---

## 1. Format overview

| Property | Value |
|---|---|
| Slicer header | `; Generated with FibreSeek Rocket Slicer vX.Y.Z.NNN on <date>` |
| Processor | `; Printer Processor Type: SK3` |
| Layer declaration | `; LAYER_COUNT: <n>` in the header; one `; LAYER:` marker per layer |
| Coordinates | `G21` mm, `G90` **absolute XYZ**, `M83` **relative extrusion** (mixed-mode) |
| Motion commands | `G0` and `G1` only; arcs (`G2`/`G3`) are never emitted |
| Firmware dialect | Klipper-flavored: `SET_PRESSURE_ADVANCE`, `SET_VELOCITY_LIMIT`, `SET_TOOL_CORNER_VELOCITY`, custom macros |

The two toolheads are fundamentally asymmetric:

| Tool | Extruder | Material | Extrusion axes |
|---|---|---|---|
| `T0` | `CFC` | Continuous Fiber Composite (e.g. CFC PETG) | **`U`** (fiber) + **`V`** (matrix material) — **no `E` word** |
| `T1` | `FFF - 0.4 mm` | Plastic (e.g. PETG) | **`E`** (standard) |

---

## 2. Custom axes

### `U` — continuous-fiber feed axis
- Appears on `G1` moves while `T0` (the fiber tool) is active.
- **Always relative**, in the same sense as `M83` extrusion. Example: `G1 X108.700 V0.04032 U1.20000 P0.034 F300`.
- Positive `U` deposits fiber. A fiber move carries **no `E` word at all**, so a processor that recognizes extrusion only through `E` will classify every fiber move as travel — the entire composite structure becomes invisible.
- Priming uses a bare feed command with no XY motion: `G1 F1200 U55 ; Extrude restart`.

### `V` — secondary material feed axis (matrix / wet-out)
- Same rules as `U`: relative, positive = feed.
- **Negative `V` retracts**, e.g. `G1 X147.000 V-0.5 ; Retract`, with large pulls (`V-4`) at fiber-cut events.
- `V` magnitudes are small (≈0.04–0.5) relative to `U` (fiber lengths of 1–55).

### `P` on `G1` moves — **not** dwell, park, or probe
- Fiber deposition moves carry a constant `P0.034`. This is a fiber-process parameter (porosity/pressure coefficient), **not** a standard axis or dwell.
- It must be ignored when scanning a move for axis words; otherwise it will be misparsed as a positional parameter.

---

## 3. Custom M-codes and macros

### `M1001 L<n>` / `M1002` — fiber feed engagement
- Bracket the fiber-feed window: `M1001 L80` … `M1002`.
- `L` is a length/purge amount (values 80–2075) tied to fiber advance and the cutter.
- Every fiber section — priming and fiber infill alike — opens with `M1001` and closes with `M1002` after the cut sequence.

### `M2800` — fiber cutter
- Fires exactly once per fiber segment, preceded by a `; Start to cut` comment and followed by `M400` (synchronize). A `;CUT DISTANCE <n>` comment reports the trimmed length.
- Canonical end-of-segment sequence:
  ```gcode
  G1 X132.500 V0.46368 U13.80000 P0.034 F900   ; last fiber move
  ; Start to cut
  M2800                                        ; cut the fiber tow
  M400                                         ; wait for moves to finish
  ;CUT DISTANCE 54.8
  G0 X133.100 F120                             ; separation move
  G1 X143.100 V0.21840                         ; short matrix-only drag
  ; Cutting completed.
  G1 X147.000 V-0.5 ; Retract
  G0 X195.500 F480                             ; wipe/park
  M1002                                        ; feed engagement off
  ```

### `M106 P<n> S<0-255>` — multi-port fan syntax
- Non-standard `P` port selector: `P1`, `P2`, `P3`, `P5` select among the part fan, hotend fan, and chamber/blower channels.
- Fan control that assumes plain Marlin `M106 S` (single implicit fan) will misroute these commands. Correct channel attribution requires honoring `P`.
- Fan-off is expressed as `M106 P<n> S0`; plain `M107` is not used.

### `M141 S<n>` / `M191 S<n>` — chamber heater target / wait
- Chamber-temperature extensions; both appear in the print preamble (`M141 S0`, `M191 S0`).

### Tool changes: `T0` / `T1`
- `T0 [R] ; switch extruder type to:FIBER` and `T1 ; switch extruder type to:PLASTIC`.
- An optional trailing `R` requests filament reverse/retract during the swap.
- Tool changes are wrapped in `; Start change extruder` / `; End change extruder` comment blocks containing `M400`, `M104 S150 T1` (cool the plastic tool while the fiber tool heats), and `M109 S270 T0`.

### Custom purge macros
```gcode
MOVE_TO_BRUSH_STATION
CLEAN_NOZZLE
MOVE_OUT_BRUSH_STATION
```
These are firmware macros, not G/M-codes. A processor must skip them; they are never motion.

### `SET_PRINT_STATS_INFO TOTAL_LAYER=<n>` / `CURRENT_LAYER=N`
- Statistics-plugin lines. `CURRENT_LAYER` is bookkeeping only — layer truth lives exclusively in the `; LAYER:` markers (see §4).

### Preamble Klipper settings (emitted once)
```gcode
SET_PRESSURE_ADVANCE EXTRUDER=extruder1 SMOOTH_TIME=0.02
SET_PRESSURE_ADVANCE EXTRUDER=extruder1 ADVANCE=0.07
SET_VELOCITY_LIMIT MINIMUM_CRUISE_RATIO=0
SET_TOOL_CORNER_VELOCITY T=0 SCV=1     ; fiber tool: very low corner velocity
SET_TOOL_CORNER_VELOCITY T=1 SCV=5
```

### Standard M-codes, ordinary meanings
`M104`/`M109` (hotend, per-tool `T`), `M140`/`M190` (bed), `M204 S5000` (print accel), `M400` (synchronize), `M83` (relative extrusion), `G92 E0`. Files do not end with `M2`; the end of a print is marked by end-gcode comments and the thumbnail blob.

---

## 4. Standard codes requiring special handling

### Layer markers: `; LAYER:<1-based> [<absolute-Z>]`
- There is a **space after the `;`**, which defeats the common `/^;LAYER:(\d+)/` match and yields zero layers detected.
- Numbering is **1-based**.
- The bracketed value is the **absolute cumulative Z** at that layer, with variable layer heights (`[0.2]`, `[0.35]`, `[0.5]` … `[60.25]`). It must be used directly as the layer height; Z must **not** be derived from the first `Z` word within the layer.

### Comments that are not layer markers
| Comment | Meaning | Why it must be ignored |
|---|---|---|
| `; MACROLAYER:2 [0.5]` | grouped layer block | not an individual layer |
| `; LAYER_COUNT: 912` | header metadata | total count, not a marker |
| `SET_PRINT_STATS_INFO CURRENT_LAYER=N` | stats plugin | bookkeeping only |
| `; TIME LEFT: 57944.64 S` | per-layer timing estimate | metadata only |

The pattern `/^;\s*LAYER:(\d+)/` matches the true marker and provably cannot match `MACROLAYER` (the leading `M` blocks it) or `LAYER_COUNT:` (the underscore blocks it).

### Feature sections: `; <Feature Name> start`
There are no `;TYPE:` markers. Motion type is conveyed entirely by section comments:

| Comment | Mapped type |
|---|---|
| `; Inset 0 start` | `WALL-OUTER` (first per layer), else `WALL-INNER` |
| `; Inset XP start` | `WALL-OUTER` |
| `; Cellular infill start` | `FILL` |
| `; Micro infill start` | `SOLID` |
| `; Inset XF start` | `WALL-OUTER` |
| `; Support thick start` | `SUPPORT` |
| `; Skirt start`, `; Priming line start` | `SKIRT`, `PRIMING` |
| `; Fiber infill start` | `FIBER` (the composite deposition pass) |
| `; Top/Bottom (most\|intermediate) solid infill start` | `TOP` / `BOTTOM` |
| `; Overhang infill start` | `OVERHANG` |

Section comments may carry a trailing space (`; Skirt start `); matching must be trailing-space tolerant.

### Mixed unit mode: `G90` + `M83`
XYZ is absolute while extrusion — `E`, and by extension `U`/`V` — is relative. Any extrusion-delta logic must operate in relative mode; `U`/`V` feed values are `max(0, value)`, with negative `V` treated as retraction.

### Z jumps inside layers
Between feature sections the file emits safe-travel lifts (`G0 Z5.200`) and returns (`G0 Z0.200`). Layer Z must come from the `; LAYER:` marker, never from per-move Z values.

### `G4 P0`
Dwells are emitted with zero duration. They contribute no timing but must be tolerated as valid commands.

### Feedrates
Travel runs at `F30000` (500 mm/s). Fiber deposition is slow by nature at `F300`–`F900` (5–15 mm/s). Plastic extrusion is typically `F6000` (100 mm/s). Any motion-time estimation must honor per-move `F`.

---

## 5. Metadata & trailer blocks

These appear near end of file and must not be parsed as motion or features:

| Block | Notes |
|---|---|
| `; MATERIAL_PRINT_DATA: [JSON]` | per-extruder material length/volume/mass/cost |
| `; ENTITY_PRINT_DATA: {JSON}` | per-feature-type time/extrusion data |
| `; SESSION: {JSON}` | full slicer profile echo |
| `; thumbnail start` … base64 … `; thumbnail end` | the final block; thousands of base64 comment lines that must not be mistaken for feature content |

---

## 6. Support checklist

A G-code processor claiming FibreSeeker support must:

1. Recognize `U` and `V` as relative extrusion axes, and treat `U>0 || V>0` as an extruding move even with no `E` word present.
2. Ignore `P` on `G1` moves.
3. Match layer markers as `/^;\s*LAYER:(\d+)/` and take layer Z from the bracketed absolute value, not from moves.
4. Distinguish the decoy comments in §4 from real layer markers.
5. Derive feature type from `; <Feature> start` / `end` comment pairs, trailing-space tolerant.
6. Honor `M106 P<n>` port selectors and pass `M2800`, `M1001`/`M1002`, and the purge macros through without interpreting them as motion.
7. Operate extrusion accounting in mixed mode (`G90` + `M83`) across three axes (`E`, `U`, `V`).
8. Skip the metadata JSON blocks and thumbnail blob at EOF.
