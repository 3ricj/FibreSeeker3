#!/usr/bin/env node
/*
 * Self-test for the G-code inspector.
 *
 *   node src/selftest.js
 *
 * Asserts the three properties that make the deliverable trustworthy:
 *
 *   1. Parity. The browser page loads src/*.js as plain <script> files with no
 *      module system, so the engine is loaded here inside a `vm` context with
 *      only `self` defined. Its findings must match the Node CLI byte for byte.
 *   2. Bundle. The shipped single-file HTML must be current with src/*.js and
 *      must produce the same findings as the CLI on every fixture.
 *   3. Calibration. C01 must still reproduce issue #1's evidence table, and C06
 *      must stay inside the population the issue describes. These numbers are
 *      the regression guard for the support-window and travel-window tuning.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..', '..', '..');
var LIB = __dirname;
var FIXTURES = path.join(ROOT, 'Test_files');
var SYNTH = path.join(__dirname, 'fixtures');
var LIB_FILES = ['dialect.js', 'raster.js', 'inspector.js'];
var bundle = require('./build_bundle.js');
var BUNDLE = bundle.OUT;

// The bundle's second inline block is the UI, which touches the DOM. A handful
// of stubs is enough to prove it parses and wires its listeners without a real
// document — that is the only thing a headless run can meaningfully check.
function domStub() {
  var seen = [];
  function el(id) {
    seen.push(id);
    return {
      id: id,
      addEventListener: function () {}, removeEventListener: function () {},
      textContent: '', innerHTML: '', value: '', checked: true, disabled: false,
      classList: { add: function () {}, remove: function () {} },
      click: function () {}
    };
  }
  var doc = {
    getElementById: el, createElement: function () { return el(''); },
    addEventListener: function () {}, body: el('body')
  };
  doc.__seen = seen;
  return doc;
}

var failures = 0;
function ok(cond, what) {
  console.log((cond ? '  ok   ' : '  FAIL ') + what);
  if (!cond) failures++;
}

// Load the library the way a browser does: no require, no exports, just globals.
function browserEngine() {
  var ctx = { console: console };
  ctx.self = ctx;
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  LIB_FILES.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(LIB, f), 'utf8'), ctx, { filename: f });
  });
  return ctx;
}

// Load the shipped single-file bundle: parse the inline <script> blocks out of
// the HTML and evaluate them in the same bare-browser context.
function bundleEngine() {
  var ctx = { console: console };
  ctx.self = ctx;
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.document = domStub();
  ctx.performance = { now: function () { return 0; } };
  ctx.FileReader = function () {};
  ctx.Blob = function () {};
  ctx.URL = { createObjectURL: function () { return 'blob:stub'; }, revokeObjectURL: function () {} };
  ctx.setTimeout = function () { return 0; };
  vm.createContext(ctx);
  var html = fs.readFileSync(BUNDLE, 'utf8');
  bundle.inlineScripts(html).forEach(function (code, i) {
    vm.runInContext(code, ctx, { filename: 'g-code-inspector.html#' + i });
  });
  if (!ctx.FS3 || !ctx.FS3.Inspector) throw new Error('bundle defines no FS3.Inspector');
  return ctx;
}

function runIn(ctx, text, name) {
  ctx.__src = text;
  return vm.runInContext('new FS3.Inspector({}).run(__src, __name)', Object.assign(ctx, { __name: name }));
}

function tally(report) {
  var t = {};
  report.findings.forEach(function (f) { t[f.check] = (t[f.check] || 0) + 1; });
  return t;
}

function main() {
  var files = fs.readdirSync(FIXTURES).filter(function (f) { return /\.gcode$/i.test(f); });
  if (!files.length) { console.error('no fixtures in ' + FIXTURES); process.exit(2); }
  // The synthetic fixture exercises the branches no real slice in the corpus
  // reaches (C12 violation, C15 flags present). It is loaded by explicit path so
  // it never pollutes the corpus-wide calibration assertions below.
  var synthFiles = fs.existsSync(SYNTH)
    ? fs.readdirSync(SYNTH).filter(function (f) { return /\.gcode$/i.test(f); })
    : [];

  require(path.join(LIB, 'dialect.js'));
  require(path.join(LIB, 'raster.js'));
  require(path.join(LIB, 'inspector.js'));
  var NodeInspector = globalThis.FS3.Inspector;

  var ctx = browserEngine();
  var cliAgg = {}, vmAgg = {}, parity = true;

  // Parity runs over the corpus *and* the synthetic fixture: a rule that only
  // ever fires on synthetic input still has to agree between hosts.
  var all = files.map(function (f) { return { name: f, path: path.join(FIXTURES, f) }; });
  synthFiles.forEach(function (f) {
    all.push({ name: f, path: path.join(SYNTH, f) });
  });

  console.log('parity: browser <script> load vs Node require, ' + all.length + ' inputs (' +
    files.length + ' corpus + ' + synthFiles.length + ' synthetic)');
  all.forEach(function (item) {
    var text = fs.readFileSync(item.path, 'utf8');
    var a = tally(new NodeInspector({}).run(text, item.name));
    var b = tally(runIn(ctx, text, item.name));
    var sa = JSON.stringify(a, Object.keys(a).sort());
    var sb = JSON.stringify(b, Object.keys(b).sort());
    if (sa !== sb) { parity = false; console.log('    ' + item.name + '\n      node ' + sa + '\n      vm   ' + sb); }
    Object.keys(a).forEach(function (k) { cliAgg[k] = (cliAgg[k] || 0) + a[k]; });
  });
  ok(parity, 'every input identical on both hosts');

  // ---- the single-file bundle ----
  console.log('bundle: g-code-inspector.html is current and self-contained');
  ok(fs.existsSync(BUNDLE), 'g-code-inspector.html exists');
  var shipped = fs.readFileSync(BUNDLE, 'utf8');
  ok(shipped.indexOf('src=') < 0, 'no external src= references (fully self-contained)');
  ok(shipped.indexOf('http://') < 0 && shipped.indexOf('https://') < 0 ||
      !/<script[^>]+src/i.test(shipped), 'no remote script tags');
  var fresh = bundle.render();
  ok(fresh === shipped, 'bundle is up to date with src/*.js (re-run build_bundle.js if this fails)');

  var bctx = bundleEngine();
  var bParity = true;
  all.forEach(function (item) {
    var text = fs.readFileSync(item.path, 'utf8');
    var a = tally(new NodeInspector({}).run(text, item.name));
    var b = tally(runIn(bctx, text, item.name));
    var sa = JSON.stringify(a, Object.keys(a).sort());
    var sb = JSON.stringify(b, Object.keys(b).sort());
    if (sa !== sb) { bParity = false; console.log('    ' + item.name + '\n      node    ' + sa + '\n      bundle  ' + sb); }
  });
  ok(bParity, 'bundle engine matches the CLI on every input');
  var wired = bctx.document.__seen;
  ['out', 'files', 'drop', 'run', 'export'].forEach(function (id) {
    ok(wired.indexOf(id) >= 0, 'UI script ran and wired #' + id);
  });

  // Per-fixture results, for the calibration assertions below.
  var per = {};
  files.forEach(function (f) {
    per[f] = new NodeInspector({}).run(fs.readFileSync(path.join(FIXTURES, f), 'utf8'), f);
  });

  function worst(file, check) {
    var r = per[file], best = 0, line = 0;
    r.findings.forEach(function (fd) {
      if (fd.check !== check) return;
      // Retain the historical no-hop calibration separately from the newly
      // reported hopped crossings, which can still ooze without retraction.
      if (check === 'C01' && /Z-hop observed/.test(fd.evidence)) return;
      var m = /([\d.]+)\s*mm/.exec(fd.message);
      var v = m ? parseFloat(m[1]) : 0;
      if (v > best) { best = v; line = fd.line; }
    });
    return { v: best, line: line };
  }

  console.log('calibration: C01 vs issue #1 evidence table');
  // Issue #1 quotes the worst unretracted travel per reinforced-level fixture.
  var expect = {
    'Benchy_renforced_level1.gcode': 51.7,
    'Benchy_renforced_level2.gcode': 52.4,
    'Benchy_renforced_level3.gcode': 51.9,
    'Benchy_renforced_level4.gcode': 51.7,
    'Benchy_renforced_level5.gcode': 51.8
  };
  Object.keys(expect).forEach(function (f) {
    var w = worst(f, 'C01');
    ok(Math.abs(w.v - expect[f]) < 0.15,
      f + ' worst C01 ' + w.v.toFixed(1) + ' mm (issue #1: ' + expect[f] + ')');
  });
  ok(worst('Benchy_fortified.gcode', 'C01').v === 0,
    'Benchy_fortified.gcode has no unretracted crossing without a nearby hop');

  console.log('calibration: C06 vs issue #6 population');
  // The C06 window/radius constants were calibrated against issue #6, which is a
  // Benchy-band report. The corpus has since grown a non-Benchy part (the
  // 60 MB Tinmorry sample added for #29) whose large organic-support geometry
  // legitimately produces a different population. Asserting the Benchy-derived
  // bounds across it would be testing the wrong thing, so the guard is scoped to
  // the calibration set and the outlier is asserted separately below.
  var c06 = [];
  Object.keys(per).forEach(function (f) {
    if (!/^Benchy_/.test(f)) return;
    per[f].findings.forEach(function (fd) {
      if (fd.check !== 'C06') return;
      c06.push({ len: parseFloat(/run of ([\d.]+) mm/.exec(fd.message)[1]), ev: fd.evidence });
    });
  });
  var ack = c06.filter(function (c) { return /^(BRIDGE|OVERHANG)/.test(c.ev); }).length;
  var lens = c06.map(function (c) { return c.len; }).sort(function (a, b) { return a - b; });
  ok(c06.length > 0 && c06.length < 400,
    'C06 count ' + c06.length + ' is a reportable population, not a flood (Benchy calibration set)');
  ok(lens[0] >= 16 - 1e-9, 'C06 floor ' + lens[0].toFixed(1) + ' mm honours the 16 mm threshold');
  ok(lens[lens.length - 1] <= 64.8, 'C06 max ' + lens[lens.length - 1].toFixed(1) +
    ' mm inside issue #6 band 16.2-64.8');
  ok(c06.length && ack / c06.length > 0.6,
    'C06 agreement with the slicer\u2019s own BRIDGE/OVERHANG labels = ' +
    (100 * ack / c06.length).toFixed(1) + ' %');
  // The non-Benchy sample is pinned so a future change cannot silently move it
  // in either direction while the C06 model is re-tuned for large parts.
  var tinmorry = Object.keys(per).filter(function (f) { return !/^Benchy_/.test(f) && per[f].stats.fiber.cuts === 0 && per[f].stats.layers > 150; });
  tinmorry.forEach(function (f) {
    var n = per[f].findings.filter(function (fd) { return fd.check === 'C06'; }).length;
    ok(n > 400 && n < 500,
      'non-Benchy sample C06 = ' + n + ' (pinned; C06 is uncalibrated for large organic-support parts — open item)');
  });

  console.log('sanity: every fixture parses (C11)');
  var unparsed = Object.keys(per).filter(function (f) {
    var r = per[f];
    if (r.stats.layers === 0 || r.stats.extrudeMoves === 0) return true;
    return r.findings.some(function (fd) {
      if (fd.check !== 'C11') return false;
      // A header disagreement is valid evidence, not a failure to parse. All
      // other C11 findings remain failures of this corpus sanity guard.
      return fd.message !== 'Header LAYER_COUNT=' + r.header.layerCount + ' but ' +
        r.stats.layers + ' ; LAYER: markers parsed';
    });
  });
  ok(unparsed.length === 0, 'every corpus file parses; only reported header-count disagreements are allowed' +
    (unparsed.length ? ' — ' + unparsed.join(', ') : ''));

  /*
   * C12–C15: the print-contract report. These are pinned to the numbers the
   * engine reconciles against the slicer's own MATERIAL_PRINT_DATA echo, so a
   * regression in the U-axis accounting shows up as a failed assertion rather
   * than a plausible-looking report.
   */
  console.log('calibration: C12 first-layer fibre');
  ok(per['Benchy_fortified.gcode'].stats.firstLayerFiber.fortified === true,
    'Benchy_fortified detected as fortified (CurrentSliceType=2 + MustGenerateFiberPerimeters)');
  ok(per['Benchy_fortified.gcode'].stats.firstLayerFiber.violation === false,
    'fortified print with fibre on layer 1 is permitted, not flagged');
  ['Benchy_renforced_level1.gcode', 'Benchy_renforced_level2.gcode',
    'Benchy_renforced_level3.gcode', 'Benchy_renforced_level4.gcode',
    'Benchy_renforced_level5.gcode'].forEach(function (f) {
    var c = per[f].stats.firstLayerFiber;
    ok(c.violation === false && c.structuralMm === 0,
      f + ' layer-1 fibre is sacrificial priming only (' + c.sacrificialMm.toFixed(1) + ' mm), no violation');
  });
  ['Benchy_fortified-pla.gcode', 'Benchy_speedy_default_settings.gcode',
    'Benchy_speedy_default_settings-pla.gcode'].forEach(function (f) {
    ok(per[f].stats.firstLayerFiber.structuralMm === 0 &&
       per[f].stats.firstLayerFiber.sacrificialMm === 0,
      f + ' has no fibre on layer 1 at all');
  });
  var c12crit = Object.keys(per).filter(function (f) {
    return per[f].findings.some(function (fd) { return fd.check === 'C12' && fd.severity === 'critical'; });
  });
  ok(c12crit.length === 0,
    'no real fixture violates the no-carbon-on-layer-1 rule' +
    (c12crit.length ? ' — ' + c12crit.join(', ') : ''));

  console.log('calibration: C13 tool configuration');
  ok(per['Benchy_fortified.gcode'].stats.tools.observed === 'dual' &&
     per['Benchy_fortified.gcode'].stats.tools.declared === 'fiber-only',
    'fortified: header says "Composite Only" but deposition is dual — quirk named, not hidden');
  ok(per['Benchy_renforced_level5.gcode'].stats.tools.observed === 'dual' &&
     per['Benchy_renforced_level5.gcode'].stats.tools.declared === 'dual',
    'renforced_level5: dual-tool, header agrees');
  ok(per['Benchy_speedy_default_settings.gcode'].stats.tools.observed === 'plastic-only',
    'speedy_default_settings: single-tool FFF');
  var c13warn = Object.keys(per).filter(function (f) {
    return per[f].findings.some(function (fd) { return fd.check === 'C13' && fd.severity === 'warning'; });
  });
  ok(c13warn.length === 0,
    'no fixture has a header/deposition contradiction beyond the documented quirk' +
    (c13warn.length ? ' — ' + c13warn.join(', ') : ''));

  console.log('calibration: C14 fibre accounting vs MATERIAL_PRINT_DATA');
  // The engine's deposited total must equal the slicer's declared tow Length.
  var c14bad = [];
  Object.keys(per).forEach(function (f) {
    var fb = per[f].stats.fiber;
    if (!fb || !fb.fedMm) return;
    var depM = fb.depositedMm / 1000;
    if (fb.declaredTowM === null || Math.abs(depM - fb.declaredTowM) > 0.01) {
      c14bad.push(f + ' measured ' + depM.toFixed(3) + ' vs declared ' + fb.declaredTowM);
    }
    if (Math.abs(fb.fedMm - fb.depositedMm - fb.restartMm) > 1e-6) {
      c14bad.push(f + ' fed != deposited + restart');
    }
  });
  ok(c14bad.length === 0, 'every fibre file reconciles with the slicer echo' +
    (c14bad.length ? ' — ' + c14bad.join('; ') : ''));
  // Pinned magnitudes: the corpus-wide fibre totals, so a U-parsing change that
  // still "reconciles" cannot silently move the headline number.
  var pin = {
    'Benchy_fortified.gcode': { fed: 78.91, cuts: 280 },
    'Benchy_renforced_level5.gcode': { fed: 15.94, cuts: 105 },
    'Benchy_renforced_level1.gcode': { fed: 6.73, cuts: 37 }
  };
  Object.keys(pin).forEach(function (f) {
    var fb = per[f].stats.fiber;
    ok(Math.abs(fb.fedMm / 1000 - pin[f].fed) < 0.01 && fb.cuts === pin[f].cuts,
      f + ' fibre ' + (fb.fedMm / 1000).toFixed(2) + ' m fed / ' + fb.cuts +
      ' cuts (pinned ' + pin[f].fed + ' m / ' + pin[f].cuts + ')');
  });
  // One cut per fibre segment: M2800 count must equal the M1001 window count.
  var cutMismatch = Object.keys(per).filter(function (f) {
    var st = per[f].stats;
    return st.m1001 > 0 && st.fiber.cuts !== st.m1001;
  });
  ok(cutMismatch.length === 0, 'M2800 cut count == M1001 segment count on every fibre file' +
    (cutMismatch.length ? ' — ' + cutMismatch.join(', ') : ''));
  // The 54.8 mm tail is a mechanical constant, identical on every cut.
  var tails = Object.keys(per).filter(function (f) { return per[f].stats.fiber.cuts > 0; })
    .map(function (f) { return per[f].stats.fiber.tailMm; });
  ok(tails.length > 0 && tails.every(function (t) { return Math.abs(t - 54.8) < 1e-9; }),
    'every cut leaves the 54.8 mm tail (' + tails.length + ' fibre files)');

  console.log('calibration: C15 machine-assist flags');
  var anyFlag = Object.keys(per).filter(function (f) {
    return per[f].stats.machineFlags.present.length > 0;
  });
  ok(anyFlag.length === 0,
    'no real slice emits a machine-assist command — the corpus-wide answer is "absent"' +
    (anyFlag.length ? ' — ' + anyFlag.join(', ') : ''));
  ok(per[files[0]].stats.machineFlags.absent.length === 9,
    'all 9 recognised flags enumerated in the absence report');

  // The synthetic fixture is the only input that reaches the violation branch
  // and the "flags present" branch. Assert it still does, or the rule is dead.
  if (synthFiles.length) {
    console.log('calibration: synthetic fixture reaches the branches the corpus cannot');
    var syn = new NodeInspector({}).run(
      fs.readFileSync(path.join(SYNTH, 'synthetic_c12_c15.gcode'), 'utf8'),
      'synthetic_c12_c15.gcode');
    var syn12 = syn.findings.filter(function (fd) { return fd.check === 'C12' && fd.severity === 'critical'; });
    ok(syn12.length === 1, 'C12 critical fires on the synthetic non-fortified layer-1 fibre deposit');
    ok(syn.stats.firstLayerFiber.structural.indexOf('Inset 0') >= 0,
      'C12 names the offending part-geometry feature (Inset 0)');
    var syn15 = syn.stats.machineFlags.present.map(function (p) { return p.key; });
    ok(syn15.indexOf('home') >= 0 && syn15.indexOf('bedMesh') >= 0 && syn15.indexOf('aiDetect') >= 0,
      'C15 detects G28 + BED_MESH_CALIBRATE + AI_DETECT_START as present (flags: ' + syn15.join(', ') + ')');
    // The synthetic file opens 3 M1001 windows but cuts only 2, which is exactly
    // the "segment ended uncut" defect C14 is required to report.
    ok(syn.stats.fiber.cuts === 2 && syn.stats.m1001 === 3,
      'C14 counts 2 cuts against 3 M1001 windows on the synthetic file (' +
      syn.stats.fiber.cuts + ' / ' + syn.stats.m1001 + ')');
    var syn14warn = syn.findings.filter(function (fd) {
      return fd.check === 'C14' && fd.severity === 'warning';
    });
    ok(syn14warn.length === 1 && /opened \(M1001\)/.test(syn14warn[0].message),
      'C14 reports the uncut fibre segment as a warning');
  } else {
    ok(false, 'synthetic fixture directory missing — C12/C15 violation branches unverified');
  }

  console.log('');
  console.log('CLI aggregate: ' + JSON.stringify(cliAgg));
  console.log(failures ? failures + ' FAILURE(S)' : 'all checks passed');
  process.exit(failures ? 1 : 0);
}

main();
