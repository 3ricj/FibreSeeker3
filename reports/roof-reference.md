# Roof-stack analysis — missing deposition beneath a top surface

Read-only geometric analysis of the G-code **as exported**. It measures commanded
extrusion footprints, not CAD surfaces and not printed material. It does not repair
anything, and it does not assert why an omission happened.

Configuration used: cell `0.2 mm`, grouping close `0.05 mm`, search depth `8 model planes / 2 mm`, region floor `5 mm²`, missing-area floor `5 mm²`, missing threshold `10%` coverage, foundation `80%`, minimum void width `1.6 mm`, arc tessellation tolerance `0.02 mm` (the collector default).

Expected top-shell thickness: **unknown** — the export carries no profile or project setting that states it, so no finding claims a contractual shortfall.

## Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode

| | |
|---|---|
| Generator | FibreSeek Rocket Slicer v1.4.0.857 on 03.10.2026 at 18:50 |
| Printer processor | SK3 |
| Printing mode | Plastic Only |
| File size | 63,147,678 bytes / 2,109,304 lines |
| SHA-256 | `c678c19266036437cb84d409b1afe3e872ed610fd9c05e93334848753460897a` |
| Layer markers parsed | 155 (Rocket `; LAYER:`) + 0 (`;LAYER_CHANGE`) |
| Macrolayer markers | 150 |
| Header `LAYER_COUNT` | 303 |
| `SET_PRINT_STATS_INFO TOTAL_LAYER` | 155 |
| Physical deposition planes | 155 (150 model, 5 support-only) |
| Deposition moves / travel moves | 1,875,322 / 139,982 |
| Extrusion mode applied | independent (M82/M83 present) |
| Units | mm |
| Bead width source | LINE_WIDTH |
| Bead height source | ENTITY_LINE_HEIGHT |
| Roof candidates examined | 26 |
| Rejected by gates | 0 narrow voids, 0 runs with no observed foundation |
| Parse + analyse time | 13,845 ms |

**LAYER_METADATA_MISMATCH** — header declares LAYER_COUNT 303 but the body carries 155 layer markers, and the file's own SET_PRINT_STATS_INFO TOTAL_LAYER=155 agrees with the markers. This is a metadata disagreement, not evidence that material is missing.

**SUPPORT_SUBLAYER_PLANES** — 5 deposition planes carry support material only and sit at non-uniform Z steps. They are excluded from the model-layer depth budget so they cannot mask a missing model plane.

### Finding 1 — LOCAL_TOP_STACK_GAP (error)

- **Finding id:** `local-top-gap-1`
- **Roof:** layer 53 at Z9.6 mm, bead height 0.2 mm, role `Top most solid infill` (normalised `TOP`), first deposition line 1622878.
- **Region:** footprint 9,748.3 mm², common missing area 9,345.7 mm², missing-mask bounds X 40.505–282.505 / Y 42.13–268.73.
- **Representative point inside the void:** X 201.805, Y 95.83 mm (machine coordinates).
- **Missing planes (3, 1 consecutive run):**

  | layer | Z mm | all-material coverage | dense coverage | missing area mm² | roles present | bead-edge clearance at sample |
  |---|---|---:|---:|---:|---|---:|
  | 52 | 9.4 | 2.16% | 0.00% | 9,538.0 | `FILL, WALL, GAPFILL, TOP` | 14.99 mm |
  | 51 | 9.2 | 2.30% | 0.00% | 9,524.3 | `FILL, WALL, BRIDGE, GAPFILL` | 14.71 mm |
  | 50 | 9 | 2.67% | 0.00% | 9,488.2 | `FILL, WALL, GAPFILL, SOLID` | 14.44 mm |

- **Underlying foundation:** layer 49 at Z8.8 mm, role `bridge_solid`, overlap 99.95% (dense 99.55%), first line 1528313.
- **Vertical geometry:** deposition-plane separation 0.8 mm; **empty vertical interval 0.6 mm** (the two are different quantities: the gap excludes the roof bead's own height).
- **Longest unsupported interval on this roof:** 4168.61 mm continuous (segment starting at line 1636305); longest single commanded move within it 29.85 mm at line 1636050; total open path length across the roof 26935.9 mm. Longest continuous interval of this roof with no backing on the plane directly beneath; geometric lack of support only, not measured sag and not a predicted failure.
- **Confidence:** geometry *high*, cause *observed_omission_in_export*.
- **Expected top shell:** unknown — no profile or project setting in this export states the required top-shell thickness.

<details><summary>Vertical stack under this roof</summary>

| depth | layer | Z mm | all-material | dense | roles present locally |
|---:|---|---:|---:|---:|---|
| 1 | 52 | 9.4 | 2.16% | 0.00% | `FILL, WALL, GAPFILL, TOP` |
| 2 | 51 | 9.2 | 2.30% | 0.00% | `FILL, WALL, BRIDGE, GAPFILL` |
| 3 | 50 | 9 | 2.67% | 0.00% | `FILL, WALL, GAPFILL, SOLID` |
| 4 | 49 | 8.8 | 99.95% | 99.55% | `FILL, WALL, GAPFILL, BRIDGE` |
| 5 | 48 | 8.6 | 39.55% | 1.24% | `FILL, WALL, GAPFILL, SOLID` |
| 6 | 47 | 8.4 | 38.85% | 0.00% | `FILL, WALL, GAPFILL` |
| 7 | 46 | 8.2 | 41.73% | 0.00% | `FILL, WALL, GAPFILL` |
| 8 | 45 | 8 | 37.75% | 0.00% | `FILL, WALL, GAPFILL` |

</details>

### Finding 2 — LOCAL_TOP_STACK_GAP (error)

- **Finding id:** `local-top-gap-2`
- **Roof:** layer 79 at Z14.8 mm, bead height 0.2 mm, role `Top intermediate solid infill` (normalised `TOP`), first deposition line 1847916.
- **Region:** footprint 158.3 mm², common missing area 151.3 mm², missing-mask bounds X 138.702–156.302 / Y 62.513–79.913.
- **Representative point inside the void:** X 148.802, Y 70.013 mm (machine coordinates).
- **Missing planes (2, 1 consecutive run):**

  | layer | Z mm | all-material coverage | dense coverage | missing area mm² | roles present | bead-edge clearance at sample |
  |---|---|---:|---:|---:|---|---:|
  | 78 | 14.6 | 4.02% | 0.00% | 152.0 | `FILL, WALL, GAPFILL, TOP` | 5.23 mm |
  | 77 | 14.4 | 4.02% | 0.00% | 152.0 | `FILL, WALL, GAPFILL, SOLID, TOP` | 5.23 mm |

- **Underlying foundation:** layer 76 at Z14.2 mm, role `top`, overlap 99.82% (dense 98.36%), first line 1824803.
- **Vertical geometry:** deposition-plane separation 0.6 mm; **empty vertical interval 0.4 mm** (the two are different quantities: the gap excludes the roof bead's own height).
- **Also affects roofs at:** Z15 (L80), Z14.8 (L79) — one cavity, reported once.
- **Longest unsupported interval on this roof:** 63.92 mm continuous (segment starting at line 1847968); longest single commanded move within it 15.46 mm at line 1854744; total open path length across the roof 711.84 mm. Longest continuous interval of this roof with no backing on the plane directly beneath; geometric lack of support only, not measured sag and not a predicted failure.
- **Confidence:** geometry *high*, cause *observed_omission_in_export*.
- **Expected top shell:** unknown — no profile or project setting in this export states the required top-shell thickness.

<details><summary>Vertical stack under this roof</summary>

| depth | layer | Z mm | all-material | dense | roles present locally |
|---:|---|---:|---:|---:|---|
| 1 | 78 | 14.6 | 4.02% | 0.00% | `FILL, WALL, GAPFILL, TOP` |
| 2 | 77 | 14.4 | 4.02% | 0.00% | `FILL, WALL, GAPFILL, SOLID, TOP` |
| 3 | 76 | 14.2 | 99.82% | 98.36% | `FILL, WALL, GAPFILL, BRIDGE, TOP` |
| 4 | 75 | 14 | 41.69% | 0.33% | `FILL, WALL, GAPFILL, TOP, BRIDGE, SOLID` |
| 5 | 74 | 13.8 | 40.98% | 0.00% | `FILL, WALL, GAPFILL, SOLID, TOP` |
| 6 | 73 | 13.6 | 44.54% | 0.00% | `FILL, WALL, GAPFILL` |
| 7 | 72 | 13.4 | 39.72% | 0.00% | `FILL, WALL, GAPFILL` |
| 8 | 71 | 13.2 | 42.70% | 0.00% | `FILL, WALL, GAPFILL` |

</details>

### Finding 3 — LOCAL_TOP_STACK_GAP (error)

- **Finding id:** `local-top-gap-3`
- **Roof:** layer 79 at Z14.8 mm, bead height 0.2 mm, role `Top most solid infill` (normalised `TOP`), first deposition line 1847916.
- **Region:** footprint 102.4 mm², common missing area 99.3 mm², missing-mask bounds X 249.502–275.502 / Y 23.113–38.913.
- **Representative point inside the void:** X 254.802, Y 29.213 mm (machine coordinates).
- **Missing planes (3, 1 consecutive run):**

  | layer | Z mm | all-material coverage | dense coverage | missing area mm² | roles present | bead-edge clearance at sample |
  |---|---|---:|---:|---:|---|---:|
  | 78 | 14.6 | 2.46% | 0.00% | 99.8 | `FILL, WALL, GAPFILL, TOP` | 2.04 mm |
  | 77 | 14.4 | 1.80% | 0.00% | 100.5 | `FILL, WALL, GAPFILL, SOLID, TOP` | 2.04 mm |
  | 76 | 14.2 | 1.80% | 0.00% | 100.5 | `FILL, WALL, GAPFILL, BRIDGE, TOP` | 2.04 mm |

- **Underlying foundation:** layer 75 at Z14 mm, role `top`, overlap 99.77% (dense 99.49%), first line 1816357.
- **Vertical geometry:** deposition-plane separation 0.8 mm; **empty vertical interval 0.6 mm** (the two are different quantities: the gap excludes the roof bead's own height).
- **Longest unsupported interval on this roof:** 140.17 mm continuous (segment starting at line 1854743); longest single commanded move within it 15.46 mm at line 1854744; total open path length across the roof 711.84 mm. Longest continuous interval of this roof with no backing on the plane directly beneath; geometric lack of support only, not measured sag and not a predicted failure.
- **Confidence:** geometry *high*, cause *observed_omission_in_export*.
- **Expected top shell:** unknown — no profile or project setting in this export states the required top-shell thickness.

<details><summary>Vertical stack under this roof</summary>

| depth | layer | Z mm | all-material | dense | roles present locally |
|---:|---|---:|---:|---:|---|
| 1 | 78 | 14.6 | 2.46% | 0.00% | `FILL, WALL, GAPFILL, TOP` |
| 2 | 77 | 14.4 | 1.80% | 0.00% | `FILL, WALL, GAPFILL, SOLID, TOP` |
| 3 | 76 | 14.2 | 1.80% | 0.00% | `FILL, WALL, GAPFILL, BRIDGE, TOP` |
| 4 | 75 | 14 | 99.77% | 99.49% | `FILL, WALL, GAPFILL, TOP, BRIDGE, SOLID` |
| 5 | 74 | 13.8 | 38.34% | 1.37% | `FILL, WALL, GAPFILL, SOLID, TOP` |
| 6 | 73 | 13.6 | 42.36% | 0.00% | `FILL, WALL, GAPFILL` |
| 7 | 72 | 13.4 | 38.77% | 0.00% | `FILL, WALL, GAPFILL` |
| 8 | 71 | 13.2 | 41.46% | 0.00% | `FILL, WALL, GAPFILL` |

</details>

### Analysis limits observed in this file

- `moving_macro` — line 28: MOVE_TO_BRUSH_STATION moves the tool — position unknown until a command states X and Y

### Healthy control stacks (complete intermediate skins above a foundation)

| roof layer | roof Z | intermediate planes | min intermediate coverage | foundation Z |
|---|---:|---|---:|---:|
| 54 | 9.8 | 9.6, 9.4, 9.2 | 99.45% | 9.6 |
| 55 | 10 | 9.8, 9.6, 9.4, 9.2 | 97.98% | 9.8 |
| 98 | 18.6 | 18.4, 18.2, 18 | 99.54% | 18.4 |
| 99 | 18.8 | 18.6, 18.4, 18.2, 18 | 99.42% | 18.6 |
| 104 | 19.8 | 19.6, 19.4, 19.2 | 99.35% | 19.6 |
| 105 | 20 | 19.8, 19.6, 19.4, 19.2 | 99.54% | 19.8 |

A complete stack is evidence that the omissions elsewhere are selective. It is not
evidence of what the required top-shell thickness was — only a project or profile
setting can establish that.
