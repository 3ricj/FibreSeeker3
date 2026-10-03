#!/usr/bin/env node
/*
 * Precision of the C06 support window against independent ground truth.
 *
 * Rocket Slicer labels its own bridging sections `BRIDGE` and overhang sections
 * `OVERHANG`. Those labels are emitted by the slicer's own geometry analysis and
 * are independent of this tool, so they are a usable proxy for "the slicer itself
 * agrees this plastic has nothing under it". We report the fraction of C06
 * findings that land in those sections for each support depth.
 */
var fs = require('fs');
var path = require('path');
require('./dialect.js');
require('./raster.js');
require('./inspector.js');
var Inspector = globalThis.FS3.Inspector;

var dir = path.join(__dirname, '..', '..', '..', 'Test_files');
var files = fs.readdirSync(dir).filter(function (f) { return /\.gcode$/i.test(f); })
  .map(function (f) { return path.join(dir, f); });

[1, 2, 3, 4].forEach(function (depth) {
  var tot = 0, ack = 0, worst = 0;
  files.forEach(function (f) {
    var ins = new Inspector({ supportDepth: depth, maxFindings: 20000 });
    var r = ins.run(fs.readFileSync(f, 'utf8'), path.basename(f));
    r.findings.forEach(function (fd) {
      if (fd.check !== 'C06') return;
      tot++;
      if (/^(BRIDGE|OVERHANG)/.test(fd.evidence || '')) ack++;
      var m = /run of ([\d.]+) mm/.exec(fd.message || '');
      if (m && parseFloat(m[1]) > worst) worst = parseFloat(m[1]);
    });
  });
  console.log('depth=' + depth + '  n=' + String(tot).padStart(5) +
    '  in slicer-labelled BRIDGE/OVERHANG=' + String(ack).padStart(4) +
    '  precision=' + (tot ? (100 * ack / tot).toFixed(1) : '0') + '%' +
    '  worst=' + worst.toFixed(1) + 'mm');
});
