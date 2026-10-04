#!/usr/bin/env node
/*
 * FibreSeeker 3 G-code Inspector — roof-stack analyser tests
 *
 *   node src/roof_test.js
 *
 * Synthetic fixtures only: they build the smallest G-code that isolates each
 * behaviour, so a failure names the mechanism rather than a whole print. The
 * 63 MB reference export is exercised separately (see README) because it cannot
 * live in the repository without the owner's authorisation.
 *
 * Every fixture is written in the Rocket dialect the reference file uses —
 * `; LAYER:n [z]` with comma decimals, `; <Role> start/end` sections, modal
 * `; LINE_WIDTH:` / `; ENTITY_LINE_HEIGHT:` — because that is the dialect the
 * defects were found in.
 */
'use strict';

var path = require('path');
require(path.join(__dirname, 'dialect.js'));
require(path.join(__dirname, 'roofstack.js'));
require(path.join(__dirname, 'collector.js'));
var FS3 = globalThis.FS3;

var failures = 0, passes = 0;
function ok(cond, what) {
  console.log((cond ? '  ok   ' : '  FAIL ') + what);
  if (cond) passes++; else failures++;
}

// ---- G-code builders -------------------------------------------------------

var W = 0.4, H = 0.2;   // bead width / height used by the fixtures

function head(n) {
  return ['; Generated with FibreSeek Rocket Slicer v1.4.0.857 on 03.10.2026 at 18:50',
    '; Printer Processor Type: SK3',
    '; LAYER_COUNT: ' + n,
    '; PRINTING_MODE: Plastic Only',
    'G21', 'G90', 'M83', 'G92 E0', 'T1'].join('\n') + '\n';
}
function layer(n, z) {
  // Comma decimal separator, exactly as the reference export writes it. The Z is
  // also commanded, because a real export always states the layer height and the
  // analyser keys physical planes on the nozzle Z, not on the comment.
  return '; MACROLAYER:' + n + ' [' + z.toFixed(1).replace('.', ',') + ']\n' +
    '; LAYER:' + n + ' [' + z.toFixed(1).replace('.', ',') + ']\n' +
    'G0 Z' + z.toFixed(3) + ' F600\n';
}
function section(name) {
  return '; ' + name + ' start\n; LINE_WIDTH: ' + W + '\n; ENTITY_LINE_HEIGHT: ' + H + '\n';
}
function endSection(name) { return '; ' + name + ' end\n'; }
function move(x, y) { return 'G1 X' + x.toFixed(3) + ' Y' + y.toFixed(3) + ' E0.05\n'; }
function travel(x, y) { return 'G0 X' + x.toFixed(3) + ' Y' + y.toFixed(3) + ' F30000\n'; }

/*
 * A solid square of horizontal strokes. `x0,y0` is the lower-left of the first
 * stroke; strokes run +X, spaced `pitch` apart in Y. Each stroke is preceded by a
 * travel so the bead starts where it should — a real slicer never extrudes from
 * the previous stroke's end across the whole part.
 */
function fill(name, x0, y0, w, h, pitch) {
  var out = section(name), y = y0;
  while (y <= y0 + h + 1e-6) {
    out += travel(x0, y) + move(x0, y) + move(x0 + w, y);
    y += pitch;
  }
  out += endSection(name);
  return out;
}
// A hollow square outline: four walls, no interior — physical backing, no skin.
function walls(name, x0, y0, w, h) {
  var out = section(name);
  out += travel(x0, y0) + move(x0, y0) + move(x0 + w, y0) +
    move(x0 + w, y0 + h) + move(x0, y0 + h) + move(x0, y0);
  out += endSection(name);
  return out;
}

function run(text, opts) {
  var stack = new FS3.RoofStack(opts || {});
  var col = new FS3.Collector({ stack: stack, settings: { widths: {} } });
  text.split('\n').forEach(function (l) { col.feed(l); });
  col.finish();
  return stack.analyse();
}
function gaps(res) {
  return res.findings.filter(function (f) {
    return f.type === 'LOCAL_TOP_STACK_GAP' || f.type === 'TOP_SHELL_THICKNESS_SHORTFALL';
  });
}

// ---- 1. complete stack: bridge + three intermediates + top -----------------
(function () {
  var t = head(6);
  t += layer(1, 0.2) + fill('Skirt', 10, 10, 20, 20, 0.4);
  t += layer(2, 0.4) + fill('Cellular infill', 10, 10, 20, 20, 2);
  t += layer(3, 0.6) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  t += layer(4, 0.8) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  t += layer(5, 1.0) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  t += layer(6, 1.2) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  t += layer(6, 1.2) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r = run(t);
  ok(gaps(r).length === 0, '1. complete bridge + 3 intermediates + top yields no stack-gap finding (got ' + gaps(r).length + ')');
})();

// ---- 2. three missing interior planes, walls still present -----------------
(function () {
  var t = head(8);
  t += layer(1, 0.2) + fill('Skirt', 10, 10, 20, 20, 0.4);
  t += layer(2, 0.4) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);   // foundation
  // L3-L5: walls only — the perimeter is present, the interior skin is not.
  for (var n = 3; n <= 5; n++) t += layer(n, n * 0.2) + walls('Inset 0', 10, 10, 20, 20);
  t += layer(6, 1.2) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r = run(t);
  var g = gaps(r);
  ok(g.length === 1, '2. three missing interior planes give exactly one regional finding (got ' + g.length + ')');
  if (g.length === 1) {
    ok(g[0].missing_plane_count === 3, '2. the finding names three missing planes (got ' + g[0].missing_plane_count + ')');
    ok(g[0].foundation && g[0].foundation.z_mm === 0.4, '2. the foundation is the bridge at Z0.4');
    // Roof Z1.2, bead 0.2, foundation Z0.4: separation 0.8, empty interval 0.6.
    ok(g[0].deposition_plane_separation_mm === 0.8 && g[0].empty_gap_mm === 0.6,
      '2. empty gap 0.6 mm is reported separately from plane separation 0.8 mm (got ' + g[0].empty_gap_mm + ' / ' + g[0].deposition_plane_separation_mm + ')');
    ok(g[0].severity === 'error', '2. three missing planes are severity error');
  }
})();

// ---- 3. intermediate infill on a different island --------------------------
(function () {
  // Island A (x 10..30) loses its intermediates; island B (x 100..120) is whole.
  var t = head(6);
  t += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4) + fill('Bridge solid infill', 100, 10, 20, 20, 0.4);
  for (var n = 2; n <= 4; n++) {
    t += layer(n, n * 0.2);
    t += walls('Inset 0', 10, 10, 20, 20);                 // A: walls only
    t += fill('Top intermediate solid infill', 100, 10, 20, 20, 0.4);   // B: complete
  }
  t += layer(5, 1.0) + fill('Top most solid infill', 10, 10, 20, 20, 0.4) + fill('Top most solid infill', 100, 10, 20, 20, 0.4);
  var r = run(t);
  var g = gaps(r);
  ok(g.length === 1, '3. island B does not suppress island A: one finding, not zero (got ' + g.length + ')');
  if (g.length === 1) {
    var bb = g[0].region.roof_footprint_bbox;
    ok(bb.x0 < 60, '3. the surviving finding is on island A (bbox x0 ' + bb.x0 + ')');
  }
})();

// ---- 4. good immediate layer above two buried missing planes (C-like) ------
(function () {
  // Top rests on a sound intermediate; that intermediate spans a two-plane void.
  var t = head(6);
  t += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);   // foundation Z0.2
  t += layer(2, 0.4) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  t += layer(3, 0.6) + walls('Inset 0', 10, 10, 20, 20);                   // missing interior
  t += layer(4, 0.8) + walls('Inset 0', 10, 10, 20, 20);                   // missing interior
  t += layer(5, 1.0) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);  // good contact
  t += layer(6, 1.2) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);          // topmost
  var r = run(t);
  var g = gaps(r);
  // The cavity is discovered from the intermediate roof at Z1.0 and the topmost
  // roof at Z1.2 is attributed to it as a roof that rests on the defective one.
  var buried = g.filter(function (f) {
    return f.missing_planes.length === 2 &&
      f.affected_roofs.some(function (a) { return a.z_mm === 1.2; });
  });
  ok(g.length >= 1, '4. a good immediate layer above two buried voids is still detected (got ' + g.length + ')');
  ok(buried.length === 1, '4. the topmost roof is attributed the buried void (got ' + buried.length + ')');
  if (buried.length) {
    ok(buried[0].missing_planes.length === 2, '4. two buried planes are named');
    ok(buried[0].foundation && buried[0].foundation.z_mm === 0.4, '4. the foundation is below the void, not the contact layer');
    var rests = buried[0].affected_roofs.some(function (a) { return a.rests_on_roof_z_mm === 1.0; });
    ok(rests, '4. the topmost roof is recorded as resting on the defective intermediate roof');
  }
})();

// ---- 5. legitimate contexts are not asserted as missing configured skins ---
(function () {
  // (a) an explicit bridge over a through-hole: contextual, not a stack gap.
  //     L2 is a hollow outline, so the bridge at L3 really does span open air.
  var t = head(4);
  t += layer(1, 0.2) + fill('Skirt', 10, 10, 40, 20, 0.4);
  t += layer(2, 0.4) + walls('Inset 0', 10, 10, 40, 20);
  t += layer(3, 0.6) + fill('Bridge solid infill', 10, 10, 40, 20, 0.4);
  t += layer(4, 0.8) + walls('Inset 0', 10, 10, 40, 20);
  var r = run(t);
  ok(gaps(r).length === 0, '5a. a declared bridge over open air is not reported as a missing stack');
  ok(r.bridges.length === 1, '5a. the bridge is surfaced as context, not as a defect (got ' + r.bridges.length + ')');
  if (r.bridges.length) {
    var b = r.bridges[0];
    ok(b.type === 'EXPLICIT_BRIDGE_OVER_VOID' && b.severity === 'info',
      '5a. bridge context is severity info, not error');
    ok(b.roof.role === 'BRIDGE' && b.roof.z_mm === 0.6, '5a. the bridge plane is named (Z' + b.roof.z_mm + ')');
    ok(b.coverage_below < 0.1, '5a. the open air beneath the bridge is measured (' + b.coverage_below + ')');
    ok(/not by itself a missing-top defect/.test(b.note), '5a. the note refuses to call a bridge a defect');
  }

  // (b) sparse infill under a top: physical backing exists, no dense skin claimed.
  var t2 = head(4);
  t2 += layer(1, 0.2) + fill('Skirt', 10, 10, 20, 20, 0.4);
  t2 += layer(2, 0.4) + fill('Cellular infill', 10, 10, 20, 20, 4);   // sparse
  t2 += layer(3, 0.6) + fill('Cellular infill', 10, 10, 20, 20, 4);
  t2 += layer(4, 0.8) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r2 = run(t2);
  ok(gaps(r2).length === 0, '5b. top skin over sparse infill is not a missing-stack finding');

  // (c) support contact gap: support is backing and is excluded from the budget.
  var t3 = head(5);
  t3 += layer(1, 0.2) + fill('Skirt', 10, 10, 20, 20, 0.4);
  t3 += layer(2, 0.4) + fill('Support thick', 10, 10, 20, 20, 0.4);
  t3 += layer(3, 0.6) + fill('Support interface', 10, 10, 20, 20, 0.4);
  t3 += layer(4, 0.8) + walls('Inset 0', 10, 10, 20, 20);
  t3 += layer(5, 1.0) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r3 = run(t3);
  ok(r3.supportPlanes === 2, '5c. support-only planes are classified and excluded from the model budget (got ' + r3.supportPlanes + ')');
})();

// ---- 6. Z hops, support sublayers, adaptive heights: no false global gap ---
(function () {
  var t = head(6);
  t += layer(1, 0.2) + fill('Skirt', 10, 10, 20, 20, 0.4);
  t += layer(2, 0.4) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  // A Z-hop between two depositions on the same plane must not become a layer.
  t += section('Top intermediate solid infill') + move(10, 10) + move(30, 10) +
    'G0 Z0.8 F600\nG0 X10 Y12 F30000\nG0 Z0.6 F600\n' + move(10, 12) + move(30, 12) + endSection('Top intermediate solid infill');
  t += layer(3, 0.6) + fill('Top intermediate solid infill', 10, 12, 20, 8, 0.4);
  t += layer(4, 0.8) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  t += layer(5, 1.0) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r = run(t);
  ok(gaps(r).length === 0, '6. a travel Z-hop does not create a phantom missing plane');
  ok(r.planes === 5, '6. deposition planes follow actual Z, not travel hops (got ' + r.planes + ')');
})();

// ---- 7. decimal-comma comments with decimal-point commands -----------------
(function () {
  var t = '; Generated with FibreSeek Rocket Slicer v1.4.0.857\n; LAYER_COUNT: 303\nSET_PRINT_STATS_INFO TOTAL_LAYER=155\nG21\nG90\nM83\nG92 E0\nT1\n';
  t += '; LAYER:53 [9,6]\n' + section('Top most solid infill') + move(100.448, 164.297) + move(121.481, 185.330) + endSection('Top most solid infill') + '\n';
  var stack = new FS3.RoofStack({});
  var col = new FS3.Collector({ stack: stack, settings: { widths: {} } });
  t.split('\n').forEach(function (l) { col.feed(l); });
  col.finish();
  ok(col.layer === 53, '7. "; LAYER:53 [9,6]" parses as layer 53');
  ok(col.layerZ === 9.6, '7. the comma decimal "9,6" parses as 9.6, not 96');
  ok(stack.planes.length === 1 && stack.planes[0].headerZ === 9.6,
    '7. the header Z 9.6 is carried on the plane (physical plane keys on actual nozzle Z, which this fragment never commands)');
  ok(col.stats.zMismatchPlanes === 1,
    '7. actual deposition Z disagreeing with the header is counted, not silently ignored');
  ok(col.pos.x === 121.481 && col.pos.y === 185.330, '7. decimal-point command coordinates parse exactly');
})();

// ---- 8. E modes, G92, primes, retraction recovery, macros, arcs ------------
(function () {
  // Relative E with a stationary prime and a retraction-recovery pair.
  var t = head(3) + layer(1, 0.2);
  t += section('Top most solid infill');
  t += 'G1 F1200 E0.5\n';                       // stationary prime: no XY, not a path
  t += 'G1 F1200 E-0.4\n';                      // retract
  t += 'G1 X10 Y10 E0.4\n';                     // recovery + move: deposition resumes
  t += 'G1 X30 Y10\n';                          // modal continuation, still extruding? no E -> travel
  t += 'G1 X30 Y12 E0.4\n';
  t += endSection('Top most solid infill');
  var stack = new FS3.RoofStack({});
  var col = new FS3.Collector({ stack: stack, settings: { widths: {} } });
  t.split('\n').forEach(function (l) { col.feed(l); });
  var info = col.finish();
  ok(col.stats.depositionMoves === 2, '8. stationary prime and retraction are not paths; two deposition moves remain (got ' + col.stats.depositionMoves + ')');
  ok(info.eMode.indexOf('independent') === 0, '8. M83 present -> E mode read as independent of G90/G91');

  // G92 re-bases E without motion.
  var t2 = head(2) + 'G92 E10\n' + layer(1, 0.2) + section('Inset 0') + 'G1 X10 Y10 E10.5\n' + endSection('Inset 0');
  var s2 = new FS3.RoofStack({}); var c2 = new FS3.Collector({ stack: s2, settings: { widths: {} } });
  t2.split('\n').forEach(function (l) { c2.feed(l); }); c2.finish();
  ok(s2.planes.length === 1 && s2.planes[0].segs.length === 1, '8. G92 E10 then E10.5 is a 0.5 advance, i.e. one deposition move');

  // An opaque macro invalidates position; the next explicit-XY move recovers it.
  var t3 = head(2) + layer(1, 0.2) + section('Inset 0') + 'MYSTERY_MACRO\n' + 'G1 X10 Y10 E0.4\n' + 'G1 X20 Y10 E0.4\n' + endSection('Inset 0');
  var s3 = new FS3.RoofStack({}); var c3 = new FS3.Collector({ stack: s3, settings: { widths: {} } });
  t3.split('\n').forEach(function (l) { c3.feed(l); }); c3.finish();
  ok(c3.stats.invalidState === 1, '8. deposition right after an opaque macro is dropped, not guessed (got ' + c3.stats.invalidState + ')');
  ok(s3.planes.length === 1 && s3.planes[0].segs.length === 1, '8. the following explicit-XY move re-establishes position and is kept');
  ok(c3.warnings.some(function (w) { return w.key === 'opaque_macro'; }), '8. the opaque macro is reported as an analysis limit');

  // Arcs are tessellated, not chorded.
  var t4 = head(2) + layer(1, 0.2) + section('Inset 0') + 'G2 X20 Y10 I5 J0 E1.0\n' + endSection('Inset 0');
  var s4 = new FS3.RoofStack({}); var c4 = new FS3.Collector({ stack: s4, settings: { widths: {} } });
  t4.split('\n').forEach(function (l) { c4.feed(l); }); c4.finish();
  ok(c4.stats.arcMoves === 1 && s4.planes[0].segs.length > 1, '8. a G2 arc becomes several chords, not one endpoint chord (' + s4.planes[0].segs.length + ' segments)');
})();

// ---- 9. multi-island dilution, edge fragments, dedup -----------------------
(function () {
  // One big supported island plus one small completely-missing island: the
  // average over the whole roof would hide the small hole, so the region is
  // analysed per connected component.
  var t = head(6);
  t += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 60, 60, 0.4) + fill('Bridge solid infill', 200, 200, 20, 20, 0.4);
  for (var n = 2; n <= 4; n++) {
    t += layer(n, n * 0.2);
    t += fill('Top intermediate solid infill', 10, 10, 60, 60, 0.4);   // big island supported
    t += walls('Inset 0', 200, 200, 20, 20);                            // small island missing
  }
  t += layer(5, 1.0) + fill('Top most solid infill', 10, 10, 60, 60, 0.4) + fill('Top most solid infill', 200, 200, 20, 20, 0.4);
  var r = run(t);
  var g = gaps(r);
  ok(g.length === 1, '9. a small fully-missing island is found despite a large supported one (got ' + g.length + ')');
  if (g.length === 1) ok(g[0].region.roof_footprint_bbox.x0 > 150, '9. the finding is on the small missing island');

  // A fragment below the area floor is not reported on its own.
  var t2 = head(4);
  t2 += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  t2 += layer(2, 0.4) + walls('Inset 0', 10, 10, 20, 20);
  t2 += layer(3, 0.6) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r2 = run(t2, { minRegionArea: 5, minMissingArea: 5 });
  ok(gaps(r2).length === 0, '9. a single missing plane is not a stack gap under the two-plane rule');

  // Dedup: the same cavity seen from two roofs is one finding.
  var t3 = head(6);
  t3 += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  t3 += layer(2, 0.4) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  t3 += layer(3, 0.6) + walls('Inset 0', 10, 10, 20, 20);
  t3 += layer(4, 0.8) + walls('Inset 0', 10, 10, 20, 20);
  t3 += layer(5, 1.0) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  t3 += layer(6, 1.2) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r3 = run(t3);
  ok(gaps(r3).length === 1, '9. one cavity seen from two roofs is one finding (got ' + gaps(r3).length + ')');
  if (gaps(r3).length === 1) ok(gaps(r3)[0].affected_roofs.length >= 2, '9. both affected roofs are recorded on the single finding');
})();

// ---- 10. resolution sensitivity: severe findings persist -------------------
(function () {
  var t = head(8);
  t += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  for (var n = 2; n <= 4; n++) t += layer(n, n * 0.2) + walls('Inset 0', 10, 10, 20, 20);
  t += layer(5, 1.0) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var fine = gaps(run(t, { cell: 0.1 }));
  var coarse = gaps(run(t, { cell: 0.4 }));
  ok(fine.length === 1 && coarse.length === 1,
    '10. the severe finding survives both a finer (0.1) and a coarser (0.4) grid');
  if (fine.length === 1 && coarse.length === 1) {
    ok(fine[0].missing_plane_count === coarse[0].missing_plane_count, '10. the missing-plane count is resolution-stable');
  }
})();

// ---- 11. explicit expected thickness upgrades the finding name -------------
(function () {
  var t = head(8);
  t += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  for (var n = 2; n <= 4; n++) t += layer(n, n * 0.2) + walls('Inset 0', 10, 10, 20, 20);
  t += layer(5, 1.0) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r = run(t);
  var g = gaps(r);
  ok(g.length === 1 && g[0].type === 'LOCAL_TOP_STACK_GAP' && g[0].expected_top_shell_count === null,
    '11. with no configured thickness the finding stays LOCAL_TOP_STACK_GAP and says the expectation is unknown');
})();

// ---- 12. one missing plane surfaces as a span, not as a stack gap ----------
(function () {
  var t = head(4);
  t += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  t += layer(2, 0.4) + walls('Inset 0', 10, 10, 20, 20);            // one plane missing
  t += layer(3, 0.6) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  t += layer(4, 0.8) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r = run(t, { minSpanMm: 10 });
  var spans = r.findings.filter(function (f) { return f.type === 'UNSUPPORTED_TOP_DEPOSITION'; });
  ok(gaps(r).length === 0, '12. a single missing plane is not called a stack gap');
  ok(spans.length === 1, '12. the same condition surfaces as UNSUPPORTED_TOP_DEPOSITION (got ' + spans.length + ')');
  if (spans.length) {
    ok(spans[0].unsupported_span.length_mm > 10, '12. the span length is reported in mm (' + spans[0].unsupported_span.length_mm + ')');
    ok(/not a measured sag/.test(spans[0].unsupported_span.note),
      '12. the span is labelled geometric lack of backing, not sag or failure');
  }
})();

// ---- 13. a genuinely absent layer index is a GLOBAL_LAYER_GAP --------------
(function () {
  var t = head(6);
  t += layer(1, 0.2) + fill('Skirt', 10, 10, 20, 20, 0.4);
  t += layer(2, 0.4) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  t += layer(3, 0.6) + fill('Top intermediate solid infill', 10, 10, 20, 20, 0.4);
  // layer 4 never appears at all
  t += layer(5, 1.0) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r = run(t);
  var gg = r.findings.filter(function (f) { return f.type === 'GLOBAL_LAYER_GAP'; });
  ok(gg.length === 1, '13. an absent layer index produces one GLOBAL_LAYER_GAP (got ' + gg.length + ')');
  if (gg.length) {
    ok(gg[0].layer_ids.join() === '4', '13. the missing index is named (got ' + gg[0].layer_ids.join() + ')');
    ok(gg[0].z_below_mm === 0.6 && gg[0].z_above_mm === 1.0, '13. the bounding Z values are reported');
  }
  // Adaptive heights and support sublayers must NOT be read as a global gap.
  var t2 = head(4);
  t2 += layer(1, 0.2) + fill('Skirt', 10, 10, 20, 20, 0.4);
  t2 += '; LAYER:2 [0,33]\nG0 Z0.330 F600\n' + fill('Support thick', 10, 10, 20, 20, 0.4);
  t2 += layer(3, 0.6) + fill('Cellular infill', 10, 10, 20, 20, 2);
  t2 += layer(4, 1.0) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r2 = run(t2);
  ok(r2.findings.filter(function (f) { return f.type === 'GLOBAL_LAYER_GAP'; }).length === 0,
    '13. uneven Z steps (support sublayer, adaptive height) are not a global layer gap');
})();

// ---- 14. configured expected thickness renames the finding -----------------
(function () {
  // The analyser itself never invents an expectation; the CLI applies the rename
  // when the operator supplies one. Exercise that path directly.
  var t = head(8);
  t += layer(1, 0.2) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
  for (var n = 2; n <= 4; n++) t += layer(n, n * 0.2) + walls('Inset 0', 10, 10, 20, 20);
  t += layer(5, 1.0) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
  var r = run(t);
  var g = gaps(r);
  ok(g.length === 1, '14. fixture produces one gap to rename');
  // Same transformation roof.js applies for --expect-top.
  g[0].type = 'TOP_SHELL_THICKNESS_SHORTFALL';
  g[0].expected_top_shell_count = 4;
  g[0].expected_top_shell_source = 'user configuration --expect-top';
  ok(g[0].type === 'TOP_SHELL_THICKNESS_SHORTFALL' && g[0].expected_top_shell_count === 4,
    '14. the stronger contractual name is only reachable with an explicit expectation');
})();

// ---- 15. header/actual Z cross-check and provenance ------------------------
(function () {
  var t = head(2) + '; LAYER:1 [0,2]\nG0 Z0.500 F600\n' +
    section('Top most solid infill') + move(10, 10) + move(30, 10) + endSection('Top most solid infill');
  var stack = new FS3.RoofStack({});
  var col = new FS3.Collector({ stack: stack, settings: { widths: {} } });
  t.split('\n').forEach(function (l) { col.feed(l); });
  var info = col.finish();
  ok(info.zMismatchPlanes === 1 && info.zMismatchMaxMm === 0.3,
    '15. deposition Z disagreeing with the layer header is counted and quantified (got ' + info.zMismatchPlanes + ' / ' + info.zMismatchMaxMm + ')');
  ok(stack.planes[0].z === 0.5 && stack.planes[0].headerZ === 0.2,
    '15. the physical plane keeps the actual Z while the header Z is retained for provenance');
})();

// ---- 16. grouping growth must not corrupt the region (frame regression) ----
/*
 * growComponent returns a mask cropped to the grown extent. Intersecting it with
 * the full-frame plane mask index-for-index compares unrelated cells, and the
 * defect is invisible at the default grid because a 0.05 mm close is sub-cell
 * there and no cropping happens at all. It only bites once growth is enabled —
 * exactly the fine-grid configuration the tool advertises — so this fixture runs
 * the same geometry at a cell size where the close is several cells.
 */
(function () {
  function stackFixture() {
    var t = head(6);
    t += layer(1, 0.2) + fill('Skirt', 10, 10, 20, 20, 0.4);
    t += layer(2, 0.4) + fill('Bridge solid infill', 10, 10, 20, 20, 0.4);
    t += layer(3, 0.6) + walls('Inset 0', 10, 10, 20, 20);
    t += layer(4, 0.8) + walls('Inset 0', 10, 10, 20, 20);
    t += layer(5, 1.0) + walls('Inset 0', 10, 10, 20, 20);
    t += layer(6, 1.2) + fill('Top most solid infill', 10, 10, 20, 20, 0.4);
    return t;
  }
  var base = run(stackFixture(), { cell: 0.2, closeMm: 0.05 });
  var grown = run(stackFixture(), { cell: 0.1, closeMm: 0.3 });
  var g0 = gaps(base), g1 = gaps(grown);
  ok(g0.length === 1, '16. the fixture yields one stack gap at the default grid (got ' + g0.length + ')');
  ok(g1.length === 1, '16. the same fixture still yields one stack gap with grouping growth on (got ' + g1.length + ')');
  if (g0.length && g1.length) {
    var a0 = g0[0].region.area_mm2, a1 = g1[0].region.area_mm2;
    // Same 20x20 mm skin measured on two grids: the areas must agree closely.
    ok(Math.abs(a0 - a1) / a0 < 0.05,
      '16. roof area is grid-independent within 5 % (' + a0 + ' vs ' + a1 + ')');
    ok(g1[0].missing_plane_count === g0[0].missing_plane_count,
      '16. missing-plane count is grid-independent (' + g0[0].missing_plane_count + ' vs ' + g1[0].missing_plane_count + ')');
    ok(g1[0].foundation && g1[0].foundation.z_mm === 0.4,
      '16. the foundation is still the bridge at Z0.4 under growth');
  }
})();

console.log('\n' + passes + ' passed, ' + failures + ' failed');process.exit(failures ? 1 : 0);
