#!/usr/bin/env node
'use strict';

// Independent numerical expectations, rather than agreement between two copies
// of the engine. Run these before the corpus/bundle calibration tests.
var assert = require('assert');
require('./dialect.js');
require('./raster.js');
require('./inspector.js');
var FS3 = globalThis.FS3;
var failures = 0, passes = 0;
function test(name, fn) {
  try { fn(); passes++; console.log('  ok   ' + name); }
  catch (e) { failures++; console.error('  FAIL ' + name + ': ' + e.message); }
}
function inspect(text, opts) { return new FS3.Inspector(opts || {}).run(text, 'synthetic.gcode'); }
function flowText(mode, words, session) {
  return (session ? '; SESSION: ' + JSON.stringify(session) + '\n' : '') +
    'G90\n' + mode + '\nG92 E0\nT1\n; LAYER:1 [0.2]\n' +
    '; Inset 0 start\nG0 X10 Y10\nG1 X110 Y10 ' + words + ' F6000\n';
}
test('plastic flow uses filament cross-sectional area in relative and absolute E modes', function () {
  var expected = Math.PI * Math.pow(1.75 / 2, 2) * 10;
  ['M83', 'M82'].forEach(function (mode) {
    var r = inspect(flowText(mode, 'E10'), { coverage: false });
    assert(Math.abs(r.stats.maxFlow - expected) < 1e-9);
    assert(r.findings.some(function (f) { return f.check === 'C04' && f.line > 0; }));
  });
});
test('Rocket profile limit replaces the generic PETG ceiling', function () {
  var s = { Inset0Slot: { Plastic: { PlasticType: 'PETG', FilamentDiameter: 1.75, MaxVolumetricSpeed: 25 } } };
  var r = inspect(flowText('M83', 'E10', s), { coverage: false });
  assert(r.stats.maxFlow > 24 && r.stats.maxFlow < 25);
  assert(!r.findings.some(function (f) { return f.check === 'C04'; }));
  s.Inset0Slot.Plastic.MaxVolumetricSpeed = 20;
  r = inspect(flowText('M83', 'E10', s), { coverage: false });
  assert(r.findings.some(function (f) { return f.check === 'C04' && /20 mm/.test(f.message); }));
});
test('Orca filament limit is honoured and a disabled limit uses the documented fallback', function () {
  var t = flowText('M83', 'E10') + '; filament_type = PETG\n; filament_max_volumetric_speed = 25\n';
  assert(!inspect(t, { coverage: false }).findings.some(function (f) { return f.check === 'C04'; }));
  assert(inspect(t.replace('speed = 25', 'speed = 0'), { coverage: false }).findings.some(function (f) { return f.check === 'C04'; }));
});
test('Orca layer-change markers produce two real layers', function () {
  var r = inspect('M83\n;LAYER_CHANGE\n;Z:0.2\nG0 X10 Y10 Z0.2\n;TYPE:Outer wall\nG1 X30 E1 F600\n' +
    ';LAYER_CHANGE\n;Z:0.4\nG0 Z0.4\nG1 Y30 E1\n', { coverage: false });
  assert.strictEqual(r.stats.layers, 2);
  assert.deepStrictEqual(r.layers.map(function (l) { return l.z; }), [0.2, 0.4]);
});
test('modal-axis extrusion is checked and an unsupported run at EOF is reported', function () {
  var r = inspect('M83\n; LAYER:1 [0.2]\n; Inset 0 start\nG0 X10 Y10\nG1 X20 Y10 E1 F600\n' +
    '; LAYER:2 [0.4]\nG0 X50 Y50\nG1 X70 E1\nG1 Y70 E1');
  var runs = r.findings.filter(function (f) { return f.check === 'C06'; });
  assert.strictEqual(runs.length, 1);
  assert(/run of 40.0 mm/.test(runs[0].message));
});
test('Z-hop without retraction still surfaces stringing risk', function () {
  var r = inspect('M83\n; LAYER:1 [0.2]\nG0 X10 Y10 Z0.2\n; Inset 0 start\n' +
    'G1 X20 Y10 E1 F600\nG0 Z0.6\nG0 X60 Y60\nG0 Z0.2\n');
  assert(r.findings.some(function (f) { return f.check === 'C01' && /Z-hop observed/.test(f.evidence); }));
});
test('slot-specific diameter and flow limit do not depend on slot order', function () {
  var s = { Inset0Slot: { Plastic: { PlasticType: 'PETG', FilamentDiameter: 2, MaxVolumetricSpeed: 40 } },
    SupportSlot: { Plastic: { PlasticType: 'PETG', FilamentDiameter: 1.75, MaxVolumetricSpeed: 5 } } };
  var r = inspect(flowText('M83', 'E10', s), { coverage: false });
  assert(Math.abs(r.stats.maxFlow - Math.PI * 10) < 1e-9);
  assert(!r.findings.some(function (f) { return f.check === 'C04'; }));
  r = inspect(flowText('M83', 'E10', s).replace('Inset 0 start', 'Support thick start'), { coverage: false });
  assert(r.findings.some(function (f) { return f.check === 'C04' && /5 mm/.test(f.message); }));
});
test('separate short high-flow strokes are not reported as continuous demand', function () {
  var t = 'M83\n; LAYER:1 [0.2]\n; Inset 0 start\nG0 X10 Y10\n' +
    'G1 X60 Y10 E5 F6000\nG0 X10 Y11\nG1 X60 Y11 E5\n';
  var r = inspect(t, { coverage: false });
  assert(r.stats.maxFlow > 24);
  assert(!r.findings.some(function (f) { return f.check === 'C04'; }));
});
test('matrix flow uses its own filament diameter and excludes fibre feed', function () {
  var s = { Inset0Slot: { Plastic: { PlasticType: 'PETG', FilamentDiameter: 1.75, MaxVolumetricSpeed: 25 } },
    InfillFiberSlot: { Composite: { PlasticDiameter: 2, MaxVolumetricSpeed: 40 } } };
  var t = flowText('M83', 'U100 V10', s).replace('Inset 0 start', 'Fiber infill start');
  var r = inspect(t, { coverage: false });
  assert(Math.abs(r.stats.maxFlow - Math.PI * 10) < 1e-9);
  assert(!r.findings.some(function (f) { return f.check === 'C04'; }));
});
console.log('\n' + passes + ' passed, ' + failures + ' failed');
process.exitCode = failures ? 1 : 0;
