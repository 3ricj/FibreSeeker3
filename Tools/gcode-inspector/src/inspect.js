#!/usr/bin/env node
/*
 * FibreSeeker 3 G-code Inspector — CLI
 *
 *   node src/inspect.js <file.gcode ...> [--json out.json] [--md report.md]
 *                     [--no-coverage] [--cell 0.2] [--max-findings N]
 *
 * Loads the browser library files directly (they attach to globalThis.FS3), so
 * the CLI and the web UI run exactly the same engine.
 */
'use strict';

var fs = require('fs');
var path = require('path');

require(path.join(__dirname, 'dialect.js'));
require(path.join(__dirname, 'raster.js'));
require(path.join(__dirname, 'inspector.js'));

var FS3 = globalThis.FS3;
var D = FS3.Dialect;   // the libs attach to the global, not to module.exports
var ORDER = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11',
  'C12', 'C13', 'C14', 'C15'];

function parseArgs(processArgs) {
  var files = [], opts = { coverage: true, maxFindings: 500, cell: 0.2 };
  for (var i = 0; i < processArgs.length; i++) {
    var a = processArgs[i];
    if (a === '--json') opts.json = processArgs[++i];
    else if (a === '--md') opts.md = processArgs[++i];
    else if (a === '--cell') opts.cell = parseFloat(processArgs[++i]);
    else if (a === '--max-findings') opts.maxFindings = parseInt(processArgs[++i], 10);
    else if (a === '--no-coverage') opts.coverage = false;
    else if (a === '--help' || a === '-h') opts.help = true;
    else files.push(a);
  }
  return { files: files, opts: opts };
}

function fmt(n, d) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  d = d || 0;
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function sevOrder(s) { return s === 'critical' ? 0 : s === 'warning' ? 1 : 2; }

function topFindings(rep, check, n) {
  var out = rep.findings.filter(function (f) { return f.check === check; });
  out.sort(function (a, b) {
    var d = sevOrder(a.severity) - sevOrder(b.severity);
    return d ? d : a.line - b.line;
  });
  return out.slice(0, n);
}

function totalFindings(rep) {
  return ORDER.reduce(function (a, k) { return a + rep.byCheck[k].count; }, 0);
}

function summaryTable(reports) {
  var head = ['File', 'Tool', 'L1 fibre', 'Fibre m (fed/dep)', 'Cuts', 'Flags',
    'Layers', 'Moves', 'Travel', 'Unretr.', 'Void/Air', 'Unmit.',
    'Zhop#29', 'SeamRun', 'Gap mm', 'Flow mm3/s', 'MinLayer s', 'Unsup mm', 'M1001', 'Findings'];
  var rows = reports.map(function (r) {
    var s = r.stats, c = r.byCheck, t = s.tools || {}, fb = s.fiber || {}, mf = s.machineFlags || {};
    var L1LABEL = { violation: 'YES (violation)', 'permitted-fortified': 'yes (fortified)', 'sacrificial-only': 'priming only', none: 'no' };
    return [
      path.basename(r.file),
      t.observed === 'dual' ? 'dual' : t.observed === 'plastic-only' ? 'FFF' : t.observed || '?',
      L1LABEL[(s.firstLayerFiber || {}).verdict] || 'no',
      fmt((fb.fedMm || 0) / 1000, 2) + ' / ' + fmt((fb.depositedMm || 0) / 1000, 2),
      fmt(fb.cuts),
      mf.present ? mf.present.length + '/' + (mf.present.length + mf.absent.length) : '-',
      fmt(s.layers),
      fmt(s.moves),
      fmt(s.travelMoves),
      fmt(s.unretractedTravels),
      fmt(s.travelClass.void) + '/' + fmt(s.travelClass.air),
      fmt(s.unmitigatedTravels),
      fmt(s.zhopHopsAgainstSetting),
      c.C02.worst === null ? '0' : fmt(c.C02.worst),
      c.C03.worst === null ? '-' : fmt(c.C03.worst, 2),
      fmt(c.C04.worst === null ? s.maxFlow : c.C04.worst, 1),
      s.minLayerTime === null ? '-' : fmt(s.minLayerTime, 2),
      fmt(s.unsupportedNoFanMm),
      fmt(s.m1001),
      fmt(totalFindings(r))
    ];
  });
  return [head].concat(rows);
}

/*
 * The four print-contract answers the owner asked for (2026-10-03), rendered
 * straight from the C12–C15 stats rather than from the findings list, so the
 * block is always present even when a rule only produced an info line.
 */
function printContract(r) {
  var s = r.stats, o = [];
  var c12 = s.firstLayerFiber || {};
  var l1feats = Object.keys(s.fiberOnLayer1 || {});
  var l1mm = l1feats.reduce(function (a, k) { return a + s.fiberOnLayer1[k]; }, 0);
  var verdict = {
    'none': 'no fibre on layer 1',
    'permitted-fortified': 'fibre on layer 1 — PERMITTED (fortified print)',
    'violation': 'FIBRE ON LAYER 1 IN PART GEOMETRY — violates the no-carbon-on-layer-1 rule',
    'sacrificial-only': 'layer-1 fibre is sacrificial priming/skirt only — part first layer is plastic'
  }[c12.verdict] || 'unknown';

  o.push('### Print contract');
  o.push('');
  o.push('**1. Carbon on layer 1.** ' + verdict +
    (l1feats.length ? ' (' + fmt(l1mm, 1) + ' mm deposited; features: ' + l1feats.join(', ') + ')' : '') +
    '. Fortified = `CurrentSliceType=' + r.settings.currentSliceType +
    '`, `MustGenerateFiberPerimeters=' + r.settings.mustGenerateFiberPerimeters + '`.' +
    (s.firstFiberLayer === null ? '' : ' First fibre layer: ' + s.firstFiberLayer + '.'));

  var t = s.tools || {};
  o.push('');
  o.push('**2. Tool configuration.** ' +
    (t.observed === 'dual' ? '**Dual-tool** (FFF + CFC fibre)'
      : t.observed === 'fiber-only' ? '**Fibre-only** (CFC tool; plastic tool idle)'
      : t.observed === 'plastic-only' ? '**Single-tool FFF** (no fibre deposited)'
      : 'no deposition parsed') +
    ' — `T0`×' + fmt(t.t0) + ' / `T1`×' + fmt(t.t1) + ', plastic ' + fmt((t.plasticMm || 0) / 1000, 2) +
    ' m, fibre ' + fmt((t.fiberFedMm || 0) / 1000, 2) + ' m fed. Header `PRINTING_MODE: ' +
    (t.mode || 'absent') + '` declares ' + (t.declared || 'unknown') +
    (t.declared && t.declared !== t.observed ? ' — **contradicted by observed deposition**' : '') + '.');

  var fb = s.fiber || {};
  o.push('');
  o.push('**3. Fibre used / cuts.** ' + fmt((fb.fedMm || 0) / 1000, 2) + ' m fed · ' +
    fmt((fb.depositedMm || 0) / 1000, 2) + ' m deposited in the part · ' +
    fmt((fb.restartMm || 0) / 1000, 2) + ' m (' + fmt((fb.restartShare || 0) * 100) +
    ' %) air-primed through the head. **' + fmt(fb.cuts) + ' cuts** (`M2800`)' +
    (fb.tailMm ? ', constant ' + fmt(fb.tailMm, 1) + ' mm tail = ' +
      fmt((fb.tailTotalMm || 0) / 1000, 2) + ' m trimmed' : '') + '.' +
    (fb.declaredTowM !== null && fb.declaredTowM !== undefined
      ? ' Slicer `MATERIAL_PRINT_DATA` declares ' + fmt(fb.declaredTowM, 2) + ' m' +
        (fb.towName ? ' of ' + fb.towName : '') +
        (Math.abs((fb.depositedMm || 0) / 1000 - fb.declaredTowM) < 0.01 ? ' — measured deposition agrees.' : ' — **measured deposition disagrees.**')
      : ' Slicer declared no tow length.'));

  var mf = s.machineFlags || { present: [], absent: [] };
  o.push('');
  o.push('**4. Machine flags.** ' +
    (mf.present.length
      ? mf.present.length + ' present: ' + mf.present.map(function (p) {
        return p.label + ' ×' + p.count + ' @line ' + p.line;
      }).join(', ')
      : '**none present** — all ' + mf.absent.length + ' recognised assist commands are absent from the file') +
    '. Absent: ' + (mf.absent.length ? mf.absent.join(', ') : '—') +
    '. Absence means the *file* does not request the feature; homing and meshing normally run before the print starts, and none of these features are exported as SESSION settings.');
  o.push('');
  return o.join('\n');
}

function toMarkdown(reports, meta) {
  var out = [];
  out.push('# G-code Inspector — test results');
  out.push('');
  out.push('Produced by `Tools/gcode-inspector` (standalone HTML/JS/Node).');
  out.push('Generated: ' + new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
  out.push('');
  out.push('Engine settings: coverage raster cell **' + meta.cell + ' mm**, travel sampled at ' +
    '0.25 mm, gap search radius 6 mm, unsupported-run floor ' + meta.minUnsupported +
    ' mm, seam-run floor ' + meta.minSeamRun + ' layers, sustained-flow window ' +
    meta.sustainedWindow + ' s, coverage checks ' +
    (meta.coverage ? '**ON**' : '**OFF**') + '.');
  out.push('');
  out.push('## Per-file summary');
  out.push('');
  var t = summaryTable(reports);
  out.push('| ' + t[0].join(' | ') + ' |');
  out.push('|' + t[0].map(function () { return '---'; }).join('|') + '|');
  t.slice(1).forEach(function (r) { out.push('| ' + r.join(' | ') + ' |'); });
  out.push('');
  out.push('Column notes:');
  out.push('');
  out.push('- **Tool** — observed deposition: `dual` = FFF + CFC fibre, `FFF` = single-tool plastic.');
  out.push('- **L1 fibre** — whether fibre was deposited in part geometry on layer 1.');
  out.push('  `yes (fortified)` is permitted, `YES (violation)` is a C12 finding, `priming only`');
  out.push('  means the only layer-1 fibre is the sacrificial priming/skirt pass.');
  out.push('- **Fibre m (fed/dep)** — total metres leaving the spool / metres landing in the part.');
  out.push('  The difference is the `U55` air-prime that pushes the post-cut tail through the head.');
  out.push('- **Cuts** — `M2800` blade fires, one per fibre segment.');
  out.push('- **Flags** — machine-assist commands present / total recognised (see C15).');
  out.push('- **Unretr.** — plastic (`E`) travels with no retraction issued before the move.');
  out.push('- **Void/Air** — of *all* travels, how many crossed a void / flew over open air.');
  out.push('- **Unmit.** — void-or-air travels with neither retraction nor Z-hop: the issue #1 defect set.');
  out.push('- **Zhop#29** — plastic travel Z-hops emitted while the exported `Profile.DoZHop` was `false`.');
  out.push('- **SeamRun** — longest run of consecutive layers whose seam marker sits at the same XY.');
  out.push('- **Gap mm** — widest void measured between a deposition start point and the nearest deposited material.');
  out.push('- **Flow mm3/s** — worst sustained volumetric demand (or the header-derived wall demand).');
  out.push('- **Unsup mm** — unsupported printed length laid down with the part fan off.');
  out.push('');

  out.push('## Aggregate by check');
  out.push('');
  out.push('| Check | Issue | Description | Findings | Critical | Worst |');
  out.push('|---|---|---|---:|---:|---|');
  ORDER.forEach(function (c) {
    var tot = 0, crit = 0, worst = null;
    reports.forEach(function (r) {
      tot += r.byCheck[c].count;
      crit += r.byCheck[c].critical;
      var w = r.byCheck[c].worst;
      if (w !== null && (worst === null || w > worst)) worst = w;
    });
    var iss = FS3.CHECKS[c].issue;
    out.push('| ' + c + ' | ' + (iss ? '[#' + iss + '](https://github.com/3ricj/FibreSeeker3/issues/' + iss + ')' : '—') +
      ' | ' + FS3.CHECKS[c].title + ' | ' + fmt(tot) + ' | ' + fmt(crit) + ' | ' +
      (worst === null ? '—' : fmt(worst, 2)) + ' |');
  });
  out.push('');

  reports.forEach(function (r) {
    out.push('---');
    out.push('');
    out.push('## ' + path.basename(r.file));
    out.push('');
    var h = r.header, st = r.stats, se = r.settings;
    out.push('- Slicer `' + (h.slicer || '?') + '` · processor ' + (h.processor || '?') +
      ' · mode ' + (h.mode || '?') + ' · ' + fmt(st.lines) + ' lines');
    out.push('- Layers ' + fmt(st.layers) + ' (header `LAYER_COUNT` ' + (h.layerCount || '?') +
      ') · moves ' + fmt(st.moves) + ' (' + fmt(st.extrudeMoves) + ' extruding, ' +
      fmt(st.travelMoves) + ' travel) · tool changes ' + fmt(st.toolChanges));
    out.push('- Estimated print time ' + fmt(st.estPrintTimeSec / 60, 1) + ' min · plastic ' +
      fmt(st.plasticMm / 1000, 2) + ' m · fiber ' + fmt(st.fiberMm / 1000, 2) + ' m · bbox ' +
      fmt(st.bbox.minx, 1) + '–' + fmt(st.bbox.maxx, 1) + ' × ' +
      fmt(st.bbox.miny, 1) + '–' + fmt(st.bbox.maxy, 1) + ' mm');
    out.push('- Material ' + (se.material || '?') + ' · `' + se.doZHopKey + '`=' + se.doZHop + ' hop height=' + se.zhopP +
      ' · `' + se.minLayerTimeKey + '`=' + se.minLayerTime + ' · `Inset0Speed`=' + se.inset0Speed +
      ' · `Inset0EWMM`=' + se.inset0EWMM + ' · `MacroLayerHeight`=' + se.macroLayerHeight +
      ' · `EnableAdjustSeamDistributionPositionPlastic`=' + se.seamDistributionPlastic);
    out.push('- First `M204` at line ' + (st.m204FirstLine === null ? 'none' : st.m204FirstLine) +
      ' · `M205` ' + st.m205 + ' · `M203` ' + st.m203 + ' · `M1001`/`M1002` ' + st.m1001 + '/' + st.m1002 +
      ' · fan commands ' + st.fanEvents + ' · seam markers ' + st.seamMarkers +
      ' (' + st.seamClusters + ' clusters ≥3 layers)');
    out.push('');
    out.push(printContract(r));
    out.push('| Check | Issue | Findings | Critical | Worst |');
    out.push('|---|---|---:|---:|---|');
    ORDER.forEach(function (c) {
      var b = r.byCheck[c];
      out.push('| ' + c + ' | ' + (b.issue ? '#' + b.issue : '—') + ' | ' + fmt(b.count) +
        ' | ' + fmt(b.critical) + ' | ' + (b.worst === null ? '—' : fmt(b.worst, 2)) + ' |');
    });
    out.push('');

    ORDER.forEach(function (c) {
      var list = topFindings(r, c, 6);
      if (!list.length) return;
      out.push('### ' + c + ' — ' + FS3.CHECKS[c].title +
        (FS3.CHECKS[c].issue ? ' (issue #' + FS3.CHECKS[c].issue + ')' : ''));
      out.push('');
      list.forEach(function (f) {
        out.push('- `' + path.basename(r.file) + ':' + f.line + '`' +
          ((f.layer === null || f.layer === undefined) ? '' : ' layer ' + f.layer) +
          ' [' + f.severity + '] ' + f.message +
          (f.evidence ? ' — ' + f.evidence : ''));
      });
      if (r.byCheck[c].count > list.length) {
        out.push('- _… ' + fmt(r.byCheck[c].count - list.length) + ' more_');
      }
      out.push('');
    });
  });
  return out.join('\n') + '\n';
}

function main() {
  var a = parseArgs(process.argv.slice(2));
  if (a.help || !a.files.length) {
    console.log('usage: node inspect.js <file.gcode ...> [--json out.json] [--md report.md]' +
      ' [--no-coverage] [--cell 0.2] [--max-findings N]');
    process.exit(a.help ? 0 : 2);
  }
  var reports = [];
  a.files.forEach(function (f) {
    var text = fs.readFileSync(f, 'latin1');
    var ins = new FS3.Inspector({
      coverage: a.opts.coverage, cell: a.opts.cell, maxFindings: a.opts.maxFindings
    });
    var rep = ins.run(text, f);
    reports.push(rep);
    console.log(path.basename(f) + ': ' + rep.stats.layers + ' layers, ' +
      rep.stats.moves + ' moves, ' + totalFindings(rep) + ' findings');
  });

  if (a.opts.json) {
    fs.writeFileSync(a.opts.json, JSON.stringify({
      generated: new Date().toISOString(),
      engine: 'Tools/gcode-inspector',
      opts: { cell: a.opts.cell, coverage: a.opts.coverage, maxFindings: a.opts.maxFindings },
      checks: FS3.CHECKS,
      reports: reports
    }, null, 2));
    console.log('wrote ' + a.opts.json);
  }
  if (a.opts.md) {
    a.opts.minUnsupported = 16;
    a.opts.minSeamRun = 10;
    a.opts.sustainedWindow = 1.0;
    fs.writeFileSync(a.opts.md, toMarkdown(reports, a.opts));
    console.log('wrote ' + a.opts.md);
  }
}

main();
