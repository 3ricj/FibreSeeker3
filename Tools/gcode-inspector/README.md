# G-code Inspector

Standalone inspector for `.gcode` files emitted by **Rocket Slicer** for
FibreSeeker 3. OrcaSlicer / PrusaSlicer output is also read (`;TYPE:` roles,
`; <role> extrusion width` headers and the flat `; <key> = <value>` config dump).
No build step, no install, no dependencies, no network.

The deliverable is **`g-code-inspector.html`**: one self-contained browser file.
Double-click it, pick or drop `.gcode` files, read the results. It never makes a
network request and no file ever leaves the browser.

It adjudicates the G-code-related defects on the repository issue tracker. See
[`reports/ISSUE_COVERAGE.md`](../../reports/ISSUE_COVERAGE.md) for the rule →
issue mapping and the issues deliberately punted.

## Use it

**Browser** — open `g-code-inspector.html` (or drag it into a tab). Click
*Choose .gcode files* or drop files on the page; multiple files at once are fine.
Results appear immediately: headline counts, a per-file matrix, a per-rule
summary linking to each issue, and a drill-down per file with line numbers.
Tune the raster cell size, gap threshold, unsupported-run floor and seam-run
threshold from the toolbar; *Export JSON* writes the full machine-readable report.

**CLI**

```bash
node src/inspect.js ../../Test_files/*.gcode \
     --json ../../reports/corpus-results.json \
     --md   ../../reports/corpus-results.md
```

Options: `--cell 0.2` (raster mm/cell), `--max-findings N`, `--no-coverage`
(skip the raster, disabling the geometry-dependent rules C03/C06 and C01's
void/air classification).

**Rebuild the single-file bundle** after editing anything in `src/`:

```bash
node src/build_bundle.js
```

`g-code-inspector.html` is generated, not hand-edited. `src/selftest.js` fails if
the shipped file is stale, so it cannot silently drift from the engine.

**Regenerate the coverage report** from the rule manifest plus corpus results,
so the report cannot drift from the code:

```bash
node src/gen_report.js
```

**Self-test**

```bash
node src/selftest.js   # engine parity, bundle freshness, C01/C06 calibration
node src/uitest.js     # drives the real upload -> inspect -> render flow
node src/regression_test.js # numerical flow, profile limits, layer and travel cases
node src/roof_test.js  # physical contact, gaps, spans and CLI regression cases
```

`regression_test.js` checks flow against independently calculated filament
volumes and tests layer parsing, modal axes, unfinished runs and hopped travel.
`selftest.js` loads the engine inside a `vm` context with only `self` defined —
the way a browser does — and asserts the findings match the Node CLI on every
fixture, then does the same for the shipped bundle. It also re-renders the bundle
and diffs it against the file on disk, and pins the C01 and C06 calibration
numbers, so a tuning change that breaks agreement with the issue reports fails
loudly. `uitest.js` stubs a minimal DOM, fires the file-input `change` handler
with the real fixtures, and asserts the rendered HTML contains the results table,
severity styling and issue links.

## Layout

Only two files sit at the top level: the deliverable and this README. Everything
else is a part and lives in `src/`.

| Path | Role |
|---|---|
| **`g-code-inspector.html`** | **The deliverable.** Single self-contained file, generated. |
| `src/dialect.js` | Rocket Slicer dialect: `U`/`V` axes, the `SESSION` settings echo, feature/section markers, seam markers. |
| `src/raster.js` | Layer coverage raster: deposition stamping, enclosed-void flood fill, age-based support probe, travel classification. |
| `src/inspector.js` | One-pass analysis engine and the C01–C11 checks. |
| `src/rules.json` | Machine-readable rule manifest: predicate, issue number, severity, status. |
| `src/ui.template` | UI shell with a `<!--LIBS-->` marker — the source of the bundle's markup and styling. |
| `src/inspect.js` | CLI front end. |
| `src/build_bundle.js` | Inlines `src/*.js` into the bundle; also exports the parser used by the tests. |
| `src/gen_report.js` | Writes `reports/ISSUE_COVERAGE.md` from `src/rules.json` + corpus results. |
| `src/selftest.js` | Parity + freshness + calibration guards. |
| `src/uitest.js` | Headless upload → inspect → render flow test. |
| `src/precision.js` | The C06 support-window sweep that produced the calibration. |
| `src/roofstack.js` | Roof-stack analyser: physical deposition planes, swept bead footprints, per-depth coverage, missing-stack findings. |
| `src/collector.js` | Streaming deposition recorder feeding `roofstack.js` — modal state, provenance, role normalisation. |
| `src/roof.js` | Roof-stack CLI (`--help` for every knob). |
| `src/regression_test.js` | Independent numerical and parser regression tests. |
| `src/roof_test.js` | Synthetic geometry tests, including actual CLI invocations. |
| `src/roof_bench.js` | Performance + memory measurement and resolution-sensitivity check on a large export. |

The `src/` modules attach to `globalThis.FS3` (aliased to `self`/`window` in the
browser), which is why one copy serves both hosts and why bundling is pure
concatenation. `src/` is kept as real files because `src/inspect.js` `require`s
them directly; edit `src/`, then re-run `node src/build_bundle.js`.

## Checks

| Rule | Issue | Detects |
|---|---|---|
| C01 | #1 | Un-retracted plastic travel across voids or open air (stringing) |
| C02 | #2 | Perimeter seams stacked in Z across consecutive layers |
| C03 | #3 | Enclosed gaps wider than the deposited bead |
| C04 | #4 | Volumetric flow demand above the material ceiling |
| C05 | #5 | Layer time below the slicer's own declared minimum |
| C06 | #6 | Long unsupported (bridging) printed runs |
| C07 | #8 | Accel / jerk / max-feedrate never declared as executable lines |
| C08 | #9 | `M1001`/`M1002` fiber-feed window commands with no firmware handler |
| C09 | #10, #11 | Verbs outside the documented firmware contract |
| C10 | #29 | Plastic travel Z-hop emitted against the exported `DoZHop` setting |
| C11 | — | Parse and geometry sanity, so a file never passes by failing to parse |

## Calibration

Two rules are calibrated against evidence rather than guessed, and both are
documented in `reports/ISSUE_COVERAGE.md`:

- **C01** preserves issue #1's historical classification of crossings without a
  nearby hop: worst-case distances and
  line numbers `51.7 @589`, `52.4 @635`, `51.9 @606`, `51.7 @602`, `51.8 @615`,
  with none in `Benchy_fortified.gcode`. Hopped crossings without prior
  retraction are now reported separately: lifting the nozzle does not stop ooze.
- **C06** models support by *age* (material deposited within the last
  `supportDepth` layers, excluding the layer being printed). Sweeping that window
  against the slicer's own `BRIDGE`/`OVERHANG` feature labels — independent
  ground truth — gives 2 layers at 76.7 % agreement versus 1 layer at 4.5 %.
  A naive "is the layer directly below empty?" probe reports 3,025 findings; the
  calibrated model reports 116 at 16.0–41.5 mm, matching the issue's band.

## Roof-stack analysis — missing deposition under a top skin

C06 asks "is there material within the last *N* layer indices?" That is the
wrong question for a **buried** void: a top skin can rest on a sound layer
which is itself bridging a hole two planes down, and an index-based probe says
"supported". The roof-stack analyser asks the physical question instead — *is
there material in the volume directly beneath this skin, at each depth?*

Run it separately from the C-checks, because it is heavier and answers a
different question. It is **CLI-only**: it is not inlined into
`g-code-inspector.html`, whose bundle deliberately stays on the single-pass
C-check engine.

```bash
node src/roof.js ../../Test_files/*.gcode --json ../../reports/roof-reference.json --md ../../reports/roof-reference.md
node src/roof_test.js     # synthetic fixtures and temporary CLI inputs
node src/roof_bench.js    # timing + RSS + resolution sensitivity (needs a large file)
```

### Finding types

| Type | Meaning | Severity |
|---|---|---|
| `LOCAL_TOP_STACK_GAP` | A substantial XY region has near-zero deposition on consecutive physical planes beneath an intermediate/top skin, **with a lower foundation observed**. | error |
| `UNSUPPORTED_TOP_DEPOSITION` | Top/intermediate strokes with a long interval lacking backing on the plane that spans the void. Emitted independently of the two-plane rule so that one severe missing plane cannot be invisible. | warning / info |
| `TOP_SHELL_THICKNESS_SHORTFALL` | The contractual name, reachable **only** with `--expect-top N`. Without a stated requirement the finding stays `LOCAL_TOP_STACK_GAP` and says the expectation is unknown. | error |
| `GLOBAL_LAYER_GAP` | A reported layer index appears nowhere in the file. Keyed on the index sequence, not on Z spacing, so support sublayers, adaptive heights and Z-hops cannot fake one. | error |
| `LAYER_METADATA_MISMATCH` | Header statistics disagree with parsed entries. Informational — a metadata disagreement is not evidence of missing material. | warning |
| `EXPLICIT_BRIDGE_OVER_VOID` | The slicer labelled this geometry a bridge over open air. Context for a human, never a defect. | info |

Geometry confidence and cause confidence are **separate fields**. Cause is
reported as `observed_omission_in_export`, never as "the slicer's source code is
defective": the export demonstrates geometry, not intent and not implementation.

### Configuration

Every gate is a knob, not a printability law, and each finding embeds the values
that produced it, so a report is self-describing.

| Flag | Default | Notes |
|---|---|---|
| `--cell 0.2` | 0.2 mm | Raster resolution. Each region cell's centre is tested against the containing backing cell. |
| `--close 0.05` | 0.05 mm | Grouping tolerance, bounded well under one bead width. Sub-cell at the default grid, so it is a no-op there; raise it together with `--cell`. |
| `--dilate 0` | 0 mm | Extra grouping growth. Any halo is *excluded* from coverage: the gate uses the grouped region, the measurement uses the grouped region clipped back to real deposited material. |
| `--depth 8` / `--depth-mm 2` | 8 planes / 2 mm | Bounded diagnostic search when no profile states a top-shell thickness. Support-only planes never consume the plane budget. |
| `--min-area 5` / `--min-missing 5` | 5 mm² | Region and missing-area floors. |
| `--max-coverage 0.10` | 10 % | Below this a plane counts as missing. |
| `--min-planes 2` | 2 | Consecutive missing planes required for a *stack* gap. |
| `--foundation 0.8` | 80 % | Underlying-foundation overlap that strengthens the missing-interior-stack reading. |
| `--min-span 16` | 16 mm | Floor for a standalone unsupported-span finding. |
| `--min-void-width 1.6` | 1.6 mm | A void must be at least this wide (inscribed diameter) to read as an omitted sheet rather than a channel between strands — four nominal bead widths. The reference voids measure 4.0/7.6/21.2 mm across; the inter-strand channels this gate rejects measure 0.8 mm. |
| `--expect-top N` | unset | Names a thickness shortfall only when the observed contiguous top skins fall below N. A satisfied count keeps the geometric gap name. |
| `--e-mode auto` | auto | `auto` honours the firmware dialect's own `M82`/`M83`; `coupled` forces E to follow `G90`/`G91`. |

### What it refuses to do

- **Read-only.** No repair, no inserted extrusion, no temperature edits, no
  rewritten files.
- **No invented motion.** An opaque macro that can move the tool invalidates
  position until a command states X and Y again; the gap is reported as an
  analysis limit, not filled with a guess.
- **Parse limits are reported.** Invalid widths and heights are refused; moving
  macros and unresolved positions produce warnings. Review these warnings before
  treating a finding as reliable. Finding confidence does not yet account for
  every collector warning or inferred bead dimension.
- **Input streams; geometry is retained.** Memory still grows with deposition
  records and layer footprints. Small roof regions retain cropped grids.
  `roof_bench.js` reports timings and heap deltas; use process peak RSS to measure
  total peak memory.

Plastic flow is filament feed times filament cross-sectional area, divided by
move duration. Rocket checks use the relevant material slot's diameter and
`MaxVolumetricSpeed`; flat Orca/Prusa settings use
`filament_max_volumetric_speed`. An absent or disabled limit uses a labelled
generic fallback. Header wall estimates use the declared wall height when
available.

Roof analysis reuses a physical plane when deposition returns to the same Z.
Travel moves and retractions break unsupported intervals, even when the next
stroke starts at the previous endpoint. A wall sublayer within a roof bead's
height is skipped only when backing is observed at or above the bead's underside.
The minimum roof-bead height is used when a plane mixes heights; this remains a
conservative plane-level approximation, not a full volume simulation.

### Reference-export result

`reports/roof-reference.{json,md}` is generated from
`Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode`
(SHA-256 `c678c19266036437cb84d409b1afe3e872ed610fd9c05e93334848753460897a`,
63,147,678 bytes, 2,109,304 lines, Rocket Slicer v1.4.0.857). The export itself
is **not** copied into this repository.

- 155 consecutive layer IDs, 150 macrolayers, 5 support-only planes and
  1,875,322 positive-E deposition moves, all independently parsed.
- `LAYER_COUNT: 303` versus 155 markers is reported as `LAYER_METADATA_MISMATCH`,
  with the file's own `SET_PRINT_STATS_INFO TOTAL_LAYER=155` named as the
  corroborating authority. It is *not* reported as 148 missing layers.
- Three `LOCAL_TOP_STACK_GAP` findings at error severity — one per roof region —
  each with dense coverage exactly 0 % on every missing plane and a foundation
  above 99 % overlap. Named by footprint, since the roof layer reported is the
  plane where the missing run starts (the affected topmost layer is carried in
  `affected_roofs`):
  - **A** — X40.5–282.5 / Y42.1–268.7, roof Z9.6/L53, 9748 mm², three missing
    planes (L50/51/52) at 2.16 / 2.30 / 2.67 %, foundation L49 Z8.8 bridge_solid
    at 99.95 %, empty gap 0.60 mm over a 0.80 mm plane separation.
  - **B** — X249.5–275.5 / Y23.1–38.9, roof Z14.8/L79, 102 mm², three missing
    planes (L76/77/78) at 2.46 / 1.80 / 1.80 %, foundation L75 Z14.0 at 99.77 %,
    empty gap 0.60 mm.
  - **C** — X138.7–156.3 / Y62.5–79.9, roof Z14.8/L79 with the topmost at
    Z15.0/L80, 158 mm², **two** missing planes (L77/78) at 4.02 / 4.02 %,
    foundation L76 Z14.2 at 99.82 %, empty gap 0.40 mm.- The buried case is found: the roof at Z15.0/L80 has **97.8 % immediate
  coverage** and still sits above a two-plane void, because the analyser walks
  the whole stack under each topmost region instead of trusting the immediate
  plane.
- The three healthy stacks (Z10.0/L55, Z18.8/L99, Z20.0/L105) are recorded as
  controls with minimum intermediate coverage 97.9–99.5 %, which is what makes
  the omissions *selective* rather than a global mode error.
- No fibre windows and no cutter commands appear in this export, so nothing here
  is attributed to fibre-tail handling, and the header does not establish an
  OrcaSlicer origin.

### Corpus behaviour and cost

Run over all eleven checked-in samples, the analyser reports **three error-severity
findings in total, all of them in the reference export** — the ten Benchy samples
produce none. What it does report elsewhere is deliberately softer: 208
`UNSUPPORTED_TOP_DEPOSITION` findings at warning/info on the carbon-fibre Benchys,
which are real single-plane gaps between reinforcement strands, and 15
`EXPLICIT_BRIDGE_OVER_VOID` context notes. Two gates exist because of this corpus:

- **A stack gap requires an observed foundation.** Without one the observation is
  "skin spanning a long way with nothing solid under it", which is top skin over
  deliberately sparse infill — the exact class that produced 3,049 and then 451
  bogus C06 findings here. Such runs are counted in `rejected.no_foundation_runs`.
- **A void must be wide enough to be a missing sheet.** The five `LOCAL_TOP_STACK_GAP`
  findings this gate removed from `Benchy_renforced_level5-pla.gcode` were 0.8 mm
  channels between carbon strands, 7–11 mm² in area — above the area floor, so
  area alone could not reject them. Rejections are counted in `rejected.narrow_voids`,
  never dropped silently.

After cropping region grids, one run on the 63 MB reference export took
**6.2 s total** (2.0 s streaming parse, 4.1 s raster and analysis), retaining
1,875,322 deposition segments. The end-of-analysis heap delta was **478.5 MB**;
this is not a peak-memory measurement. The `--cell 0.4` variant took 2.7 s.
`roof_bench.js` prints these measurements and asserts the expected gap locations
across the tolerance sweep. Timings and heap deltas depend on the machine and
garbage collection between runs.

### Remaining inference limits

1. **Required top-shell thickness is unknown from this export.** No profile or
   project setting in it states one, so findings describe observed geometry.
   Only `--expect-top N` licenses the contractual name.
2. **Coverage is commanded footprint, not printed material.** Areas are buffered
   extrusion footprints, not CAD surfaces and not a measurement of a print.
3. **Grid and tolerance sensitivity is measured, not assumed.** `roof_bench.js`
   re-runs the reference export at `--cell 0.4`, with `--close 0`, with
   `--max-coverage` at 0.05 and 0.15, and at `--cell 0.1`. All three severe
   findings survive `--cell 0.4`, `--close 0`, and both coverage gates, and all
   three survive `--cell 0.1 --close 0.1` (coverage there reads up to 7.8 % on the
   two smaller regions, because a finer raster resolves edge tracks that a coarse
   one merges into the skin — the finding holds, its number moves). At
   `--cell 0.1 --close 0.3` only the largest region is reported: the grouping
   close is now 3 cells and merges the two smaller roofs into their neighbours, so
   they stop being separate candidates. Coverage values are expected to move with
   resolution; the finding set at the default and coarser grids is the property
   this tool claims, and it holds.
4. **Cause is inferred, geometry is measured.** Selective omission is strong
   evidence of a slicer-side defect; it is not proof of one, and CAD or project
   data would be needed to establish intent — a designed cavity, intended sparse
   infill, support Z-separation and a model ending all look similar.
5. **Unsupported spans are geometric.** They are intervals without backing, not
   measured sag and not a predicted mechanical failure.
6. **A dense-fill-free file yields no roof candidates.** `Benchy_fortified.gcode`
   is sliced as `Composite Only`: it contains no top or solid-infill section at
   all, so the analyser correctly reports zero candidates rather than inventing
   roofs from fibre beads. Zero candidates means "no roof to judge", and is
   reported as such — it is not a pass.
