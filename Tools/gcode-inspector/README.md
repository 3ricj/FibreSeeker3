# G-code Inspector

Standalone inspector for `.gcode` files emitted by **Rocket Slicer** for
FibreSeeker 3. OrcaSlicer / PrusaSlicer output is also read (`;TYPE:` roles,
`; <role> extrusion width` headers and the flat `; <key> = <value>` config dump).
No build step, no install, no dependencies, no network.

The deliverable is **`g-code-inspector.html`** — one self-contained ~81 KB file.
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
```

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

- **C01** reproduces issue #1's evidence table exactly — worst-case distances and
  line numbers `51.7 @589`, `52.4 @635`, `51.9 @606`, `51.7 @602`, `51.8 @615`,
  with `Benchy_fortified.gcode` fully mitigated.
- **C06** models support by *age* (material deposited within the last
  `supportDepth` layers, excluding the layer being printed). Sweeping that window
  against the slicer's own `BRIDGE`/`OVERHANG` feature labels — independent
  ground truth — gives 2 layers at 76.7 % agreement versus 1 layer at 4.5 %.
  A naive "is the layer directly below empty?" probe reports 3,025 findings; the
  calibrated model reports 116 at 16.0–41.5 mm, matching the issue's band.
