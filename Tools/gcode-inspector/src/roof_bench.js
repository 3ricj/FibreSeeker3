'use strict';
/*
 * Performance harness for the roof-stack analyser: wall time and peak heap on the
 * large reference export, plus a resolution-sensitivity sweep that must keep the
 * severe findings.
 */
const fs = require('fs');
const path = require('path');
require('./dialect.js'); require('./roofstack.js'); require('./collector.js');
const FS3 = globalThis.FS3;
const FILE = path.join(__dirname, '..', '..', '..', 'Test_files',
  'Fabulous Borwo-Waasa (9)_TINMORRY PETG ECO schwarz+CFC PETG_10h53m.gcode');

function runOnce(opts) {
  if (global.gc) global.gc();
  const heapBefore = process.memoryUsage().heapUsed;
  const stack = new FS3.RoofStack(opts);
  const col = new FS3.Collector({ stack, settings: { widths: {} } });
  const t0 = process.hrtime.bigint();
  return new Promise(resolve => {
    const rs = fs.createReadStream(FILE);
    let buf = '', bytes = 0;
    rs.on('data', c => {
      bytes += c.length;
      buf += c.toString('latin1');
      let i;
      while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); if (l.length) col.feed(l); }
    });
    rs.on('end', () => {
      if (buf.length) col.feed(buf);
      const parseNs = Number(process.hrtime.bigint() - t0);
      const t1 = process.hrtime.bigint();
      const res = stack.analyse();
      const analyseNs = Number(process.hrtime.bigint() - t1);
      const heapPeak = process.memoryUsage().heapUsed;
      resolve({
        opts, res, bytes,
        parseMs: Math.round(parseNs / 1e6),
        maskMs: stack._maskMs || 0,
        analyseMs: Math.round(analyseNs / 1e6),
        totalMs: Math.round((parseNs + analyseNs) / 1e6),
        heapDeltaMb: +((heapPeak - heapBefore) / 1048576).toFixed(1),
        segments: stack.planes.reduce((n, p) => n + p.segs.length, 0)
      });
    });
  });
}

(async () => {
  const base = { cell: 0.2 };
  const a = await runOnce(base);
  console.log('BASELINE cell=0.2 close=0.05');
  console.log('  bytes ' + a.bytes.toLocaleString() + '  segments ' + a.segments.toLocaleString());
  console.log('  parse ' + a.parseMs + ' ms   raster+analyse ' + a.analyseMs + ' ms   total ' + a.totalMs + ' ms');
  console.log('  heap delta ' + a.heapDeltaMb + ' MB');
  console.log('  planes ' + a.res.planes + '  candidates ' + a.res.candidates + '  findings ' + a.res.findings.length);
  const gaps = a.res.findings.filter(f => f.type === 'LOCAL_TOP_STACK_GAP');
  console.log('  stack gaps ' + gaps.length + ' at ' + gaps.map(f => 'Z' + f.roof.z_mm).join(', '));

  // Sensitivity: coarser grid, no grouping, tighter/looser missing gate, and a
  // finer grid paired with a proportionally larger close. Resolution and grouping
  // tolerance must move together: a 0.05 mm close is sub-cell at 0.2 mm and only
  // becomes real geometry once the grid is finer than it.
  const variants = [
    { cell: 0.4 },
    { closeMm: 0.0 },
    { maxCoverage: 0.05 },
    { maxCoverage: 0.15 },
    { cell: 0.1, closeMm: 0.1 },
    { cell: 0.1, closeMm: 0.3 }
  ];
  for (const o of variants) {
    const r = await runOnce(Object.assign({ cell: 0.2 }, o));
    const g = r.res.findings.filter(f => f.type === 'LOCAL_TOP_STACK_GAP');
    const cov = g.map(f => Math.max.apply(null, f.missing_planes.map(m => m.all_material_coverage)));
    console.log('VARIANT ' + JSON.stringify(o) + ' -> gaps ' + g.length +
      ' at ' + g.map(f => 'Z' + f.roof.z_mm).join(', ') +
      ' | max missing coverage ' + cov.map(c => (c * 100).toFixed(2) + '%').join(', ') +
      ' | ' + r.totalMs + ' ms, heap ' + r.heapDeltaMb + ' MB');
  }
})();
