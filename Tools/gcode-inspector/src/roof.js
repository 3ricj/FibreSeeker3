#!/usr/bin/env node
/*
 * FibreSeeker 3 G-code Inspector — roof-stack (missing deposition) CLI
 *
 *   node src/roof.js <file.gcode ...> [--json out.json] [--md report.md]
 *                    [--cell 0.2] [--close 0.05] [--depth 8] [--depth-mm 2]
 *                    [--min-area 5] [--max-coverage 0.10] [--min-planes 2]
 *                    [--tolerance 0.02] [--e-mode auto|independent|coupled]
 *                    [--expect-top N] [--quiet]
 *
 * Read-only. This tool parses and measures; it never rewrites, repairs or inserts
 * extrusion, and it never states a slicer's internal behaviour as fact.
 *
 * Streaming: the file is read as a byte stream and split into lines, so a 63 MB
 * export costs the same memory as a 63 kB one plus the retained deposition
 * records. Only what the analyser needs is kept — per-plane bead records and,
 * after them, two raster masks per plane.
 */
'use strict';

var fs = require('fs');
var path = require('path');

require(path.join(__dirname, 'dialect.js'));
require(path.join(__dirname, 'roofstack.js'));
require(path.join(__dirname, 'collector.js'));

var FS3 = globalThis.FS3;
var D = FS3.Dialect;

function parseArgs(argv) {
  var files = [], opts = {};
  for (var i = 0; i < argv.length; i++) {
    var a = argv[i];
    if (a === '--json') opts.json = argv[++i];
    else if (a === '--md') opts.md = argv[++i];
    else if (a === '--cell') opts.cell = parseFloat(argv[++i]);
    else if (a === '--close') opts.closeMm = parseFloat(argv[++i]);
    else if (a === '--dilate') opts.dilateMm = parseFloat(argv[++i]);
    else if (a === '--depth') opts.maxDepthPlanes = parseInt(argv[++i], 10);
    else if (a === '--depth-mm') opts.maxDepthMm = parseFloat(argv[++i]);
    else if (a === '--min-area') opts.minRegionArea = parseFloat(argv[++i]);
    else if (a === '--min-missing') opts.minMissingArea = parseFloat(argv[++i]);
    else if (a === '--max-coverage') opts.maxCoverage = parseFloat(argv[++i]);
    else if (a === '--min-planes') opts.minMissingPlanes = parseInt(argv[++i], 10);
    else if (a === '--foundation') opts.foundationOverlap = parseFloat(argv[++i]);
    else if (a === '--min-span') opts.minSpanMm = parseFloat(argv[++i]);
    else if (a === '--tolerance') opts.arcToleranceMm = parseFloat(argv[++i]);
    else if (a === '--e-mode') opts.eMode = argv[++i];
    else if (a === '--expect-top') opts.expectTop = parseInt(argv[++i], 10);
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else files.push(a);
  }
  return { files: files, opts: opts };
}

/*
 * Header scan. Rocket's `LAYER_COUNT` and Orca's `total layer number` are read,
 * plus the generator line and the slicer's own `SET_PRINT_STATS_INFO
 * TOTAL_LAYER`. Nothing here is treated as authority: the disagreement between
 * them is itself the finding.
 */
function scanHeader(file, cb) {
  var out = {
    generator: null, processor: null, mode: null, layerCountHeader: null,
    totalLayerStat: null, layerMarkers: 0, macroMarkers: 0, layerChangeMarkers: 0,
    firstLayerLine: null, bytes: 0
  };
  var rs = fs.createReadStream(file);
  var buf = '', lineNo = 0;
  rs.on('data', function (chunk) {
    out.bytes += chunk.length;
    buf += chunk.toString('latin1');
    var i;
    while ((i = buf.indexOf('\n')) >= 0) {
      var line = buf.slice(0, i).replace(/\r$/, '');
      buf = buf.slice(i + 1);
      lineNo++;
      if (lineNo > 4000000) break;
      var m;
      if ((m = D.RE_GEN.exec(line))) out.generator = m[1].trim();
      else if ((m = D.RE_GEN_ORCA.exec(line))) out.generator = m[1].trim();
      else if ((m = D.RE_PROC.exec(line))) out.processor = m[1].trim();
      else if ((m = D.RE_MODE.exec(line))) out.mode = m[1].trim();
      else if ((m = D.RE_LAYERCOUNT.exec(line))) out.layerCountHeader = +m[1];
      else if ((m = D.RE_LAYERCOUNT_ORCA.exec(line))) out.layerCountHeader = +m[1];
      else if ((m = /^SET_PRINT_STATS_INFO\s+TOTAL_LAYER\s*=\s*(\d+)/.exec(line.trim()))) out.totalLayerStat = +m[1];
      else if (D.RE_LAYER.test(line)) { out.layerMarkers++; if (out.firstLayerLine === null) out.firstLayerLine = lineNo; }
      else if (D.RE_MACROLAYER.test(line)) out.macroMarkers++;
      else if (/^;\s*LAYER_CHANGE\b/.test(line)) out.layerChangeMarkers++;
    }
  });
  rs.on('end', function () { if (buf) lineNo++; out.lines = lineNo; cb(out); });
  rs.on('error', cb);
}

/*
 * One streaming pass: feed every line to the collector, then let the analyser
 * build masks and walk the stacks.
 */
function analyseFile(file, opts, cb) {
  var stack = new FS3.RoofStack(opts);
  var collector = new FS3.Collector({
    stack: stack, settings: opts.settings || { widths: {} },
    arcToleranceMm: opts.arcToleranceMm, eMode: opts.eMode
  });
  var rs = fs.createReadStream(file);
  var crypto = require('crypto');
  var hash = crypto.createHash('sha256');
  var buf = '', t0 = Date.now();
  var bytes = 0;
  rs.on('data', function (chunk) {
    bytes += chunk.length;
    hash.update(chunk);
    buf += chunk.toString('latin1');
    var i;
    while ((i = buf.indexOf('\n')) >= 0) {
      var line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      if (line.length) collector.feed(line);
    }
  });
  rs.on('end', function () {
    if (buf.length) collector.feed(buf);
    var info = collector.finish();
    var res = stack.analyse();
    res.elapsedMs = Date.now() - t0;
    res.bytes = bytes;
    res.sha256 = hash.digest('hex');
    res.collector = info;
    res.file = path.basename(file);
    cb(null, res, stack);
  });
  rs.on('error', cb);
}

function fmt(n, d) {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
}
function pct(v) { return v === null || v === undefined ? '-' : (v * 100).toFixed(2) + '%'; }

/*
 * Human report. Every number in it is also in the JSON; nothing here requires the
 * reader to open an image or a second file to understand the finding.
 */
function markdown(reports, opts) {
  var D2 = FS3.RoofDefaults;
  function cfg(k) { return opts[k] === undefined ? D2[k] : opts[k]; }
  var L = [];
  L.push('# Roof-stack analysis — missing deposition beneath a top surface');
  L.push('');
  L.push('Read-only geometric analysis of the G-code **as exported**. It measures commanded');
  L.push('extrusion footprints, not CAD surfaces and not printed material. It does not repair');
  L.push('anything, and it does not assert why an omission happened.');
  L.push('');
  L.push('Configuration used: cell `' + cfg('cell') + ' mm`, grouping close `' + cfg('closeMm') +
    ' mm`, search depth `' + cfg('maxDepthPlanes') + ' model planes / ' + cfg('maxDepthMm') +
    ' mm`, region floor `' + cfg('minRegionArea') + ' mm²`, missing-area floor `' +
    cfg('minMissingArea') + ' mm²`, missing threshold `' + (cfg('maxCoverage') * 100).toFixed(0) +
    '%` coverage, foundation `' + (cfg('foundationOverlap') * 100).toFixed(0) +
    '%`, minimum void width `' + cfg('minVoidWidthMm') +
    ' mm`, arc tessellation tolerance `' + (cfg('arcToleranceMm') === undefined ? 0.02 : cfg('arcToleranceMm')) +
    ' mm` (the collector default).');
  if (opts.expectTop) {
    L.push('');
    L.push('Expected top-shell thickness: **' + opts.expectTop + ' layers, supplied by the user** — so gaps are reported as `TOP_SHELL_THICKNESS_SHORTFALL`.');
  } else {
    L.push('');
    L.push('Expected top-shell thickness: **unknown** — the export carries no profile or project setting that states it, so no finding claims a contractual shortfall.');
  }
  reports.forEach(function (r) {
    var h = r.header || {};
    L.push('');
    L.push('## ' + r.file);
    L.push('');
    L.push('| | |');
    L.push('|---|---|');
    L.push('| Generator | ' + (h.generator || '-') + ' |');
    L.push('| Printer processor | ' + (h.processor || '-') + ' |');
    L.push('| Printing mode | ' + (h.mode || '-') + ' |');
    L.push('| File size | ' + fmt(r.bytes) + ' bytes / ' + fmt(h.lines) + ' lines |');
    L.push('| SHA-256 | `' + r.sha256 + '` |');
    L.push('| Layer markers parsed | ' + fmt(h.layerMarkers) + ' (Rocket `; LAYER:`) + ' + fmt(h.layerChangeMarkers) + ' (`;LAYER_CHANGE`) |');
    L.push('| Macrolayer markers | ' + fmt(h.macroMarkers) + ' |');
    L.push('| Header `LAYER_COUNT` | ' + fmt(h.layerCountHeader) + ' |');
    L.push('| `SET_PRINT_STATS_INFO TOTAL_LAYER` | ' + fmt(h.totalLayerStat) + ' |');
    L.push('| Physical deposition planes | ' + fmt(r.planes) + ' (' + fmt(r.modelPlanes) + ' model, ' + fmt(r.supportPlanes) + ' support-only) |');
    L.push('| Deposition moves / travel moves | ' + fmt(r.collector.stats.depositionMoves) + ' / ' + fmt(r.collector.stats.travelMoves) + ' |');
    L.push('| Extrusion mode applied | ' + r.collector.eMode + ' |');
    L.push('| Units | ' + r.collector.units + ' |');
    L.push('| Bead width source | ' + r.collector.widthSource + ' |');
    L.push('| Bead height source | ' + r.collector.heightSource + ' |');
    L.push('| Roof candidates examined | ' + fmt(r.candidates) + ' |');
    if (r.rejected) {
      L.push('| Rejected by gates | ' + fmt(r.rejected.narrow_voids) + ' narrow voids, ' +
        fmt(r.rejected.no_foundation_runs) + ' runs with no observed foundation |');
    }
    L.push('| Parse + analyse time | ' + fmt(r.elapsedMs) + ' ms |');
    L.push('');
    (r.metadata || []).forEach(function (mm) {
      L.push('**' + mm.type + '** — ' + mm.detail);
      L.push('');
    });
    if (!r.findings.length) {
      L.push('No finding met the configured gates: no local top-stack gap, no severe unsupported span, and no absent model layer index.');
      L.push('');
    }
    r.findings.forEach(function (f, idx) {
      L.push('### Finding ' + (idx + 1) + ' — ' + f.type + ' (' + f.severity + ')');
      L.push('');
      L.push('- **Finding id:** `' + f.finding_id + '`');
      if (f.type === 'GLOBAL_LAYER_GAP') {
        L.push('- **Missing model layer indices:** ' + f.layer_ids.join(', ') + ' (' + f.layer_count + ' consecutive).');
        L.push('- **Bounding Z:** ' + f.z_below_mm + ' mm below to ' + f.z_above_mm + ' mm above; expected step ' + f.expected_z_step_mm + ' mm.');
        L.push('- ' + f.note);
        L.push('- **Confidence:** geometry *' + f.geometry_confidence + '*, cause *' + f.cause_confidence + '*.');
        L.push('');
        return;
      }
      if (f.type === 'EXPLICIT_BRIDGE_OVER_VOID') {
        L.push('- **Declared bridge** at layer ' + f.roof.layer_id + ', Z' + f.roof.z_mm + ' mm, footprint ' +
          fmt(f.region.area_mm2, 1) + ' mm², coverage directly below ' + pct(f.coverage_below) + '.');
        L.push('- ' + f.note);
        L.push('');
        return;
      }
      if (f.roof) {
        L.push('- **Roof:** layer ' + f.roof.layer_id + ' at Z' + f.roof.z_mm + ' mm, bead height ' +
          f.roof.bead_height_mm + ' mm, role `' + f.roof.label + '` (normalised `' + f.roof.role + '`), first deposition line ' + f.roof.line + '.');
      }
      if (f.region) {
        L.push('- **Region:** footprint ' + fmt(f.region.area_mm2, 1) + ' mm², common missing area ' +
          fmt(f.region.missing_area_mm2, 1) + ' mm², missing-mask bounds X ' + f.region.bbox.x0 + '–' +
          f.region.bbox.x1 + ' / Y ' + f.region.bbox.y0 + '–' + f.region.bbox.y1 + '.');
        if (f.region.sample_xy_mm) {
          L.push('- **Representative point inside the void:** X ' + f.region.sample_xy_mm[0] +
            ', Y ' + f.region.sample_xy_mm[1] + ' mm (machine coordinates).');
        }
      }
      if (f.missing_planes) {
        L.push('- **Missing planes (' + f.missing_plane_count + ', ' + f.run_count + ' consecutive run' + (f.run_count === 1 ? '' : 's') + '):**');
        L.push('');
        L.push('  | layer | Z mm | all-material coverage | dense coverage | missing area mm² | roles present | bead-edge clearance at sample |');
        L.push('  |---|---|---:|---:|---:|---|---:|');
        f.missing_planes.forEach(function (mp) {
          L.push('  | ' + mp.layer_id + ' | ' + mp.z_mm + ' | ' + pct(mp.all_material_coverage) + ' | ' +
            pct(mp.dense_coverage) + ' | ' + fmt(mp.missing_area_mm2, 1) + ' | `' + mp.roles_present + '` | ' +
            (mp.bead_edge_clearance_mm === null ? '-' : fmt(mp.bead_edge_clearance_mm, 2) + ' mm') + ' |');
        });
        L.push('');
      }
      if (f.foundation) {
        L.push('- **Underlying foundation:** layer ' + f.foundation.layer_id + ' at Z' + f.foundation.z_mm +
          ' mm, role `' + f.foundation.role + '`, overlap ' + pct(f.foundation.overlap) +
          ' (dense ' + pct(f.foundation.dense_overlap) + '), first line ' + f.foundation.line + '.');
      }
      if (f.deposition_plane_separation_mm !== undefined && f.deposition_plane_separation_mm !== null) {
        L.push('- **Vertical geometry:** deposition-plane separation ' + f.deposition_plane_separation_mm +
          ' mm; **empty vertical interval ' + f.empty_gap_mm + ' mm** (the two are different quantities: the gap excludes the roof bead\'s own height).');
      }
      if (f.affected_roofs && f.affected_roofs.length > 1) {
        L.push('- **Also affects roofs at:** ' + f.affected_roofs.map(function (r) { return 'Z' + r.z_mm + ' (L' + r.layer_id + ')'; }).join(', ') + ' — one cavity, reported once.');
      }
      if (f.unsupported_span) {
        L.push('- **Longest unsupported interval on this roof:** ' + f.unsupported_span.length_mm +
          ' mm continuous (segment starting at line ' + f.unsupported_span.segment_line +
          '); longest single commanded move within it ' + f.unsupported_span.longest_single_move_mm +
          ' mm at line ' + f.unsupported_span.longest_single_move_line +
          '; total open path length across the roof ' + f.unsupported_span.total_open_length_mm + ' mm.' +
          ' ' + f.unsupported_span.note.charAt(0).toUpperCase() + f.unsupported_span.note.slice(1) + '.');
      }
      L.push('- **Confidence:** geometry *' + f.geometry_confidence + '*, cause *' + f.cause_confidence + '*.');
      L.push('- **Expected top shell:** ' + (f.expected_top_shell_count === null ? 'unknown — ' + f.expected_top_shell_source : f.expected_top_shell_count + ' layers, from ' + f.expected_top_shell_source) + '.');
      if (f.stack && f.stack.length) {
        L.push('');
        L.push('<details><summary>Vertical stack under this roof</summary>');
        L.push('');
        L.push('| depth | layer | Z mm | all-material | dense | roles present locally |');
        L.push('|---:|---|---:|---:|---:|---|');
        f.stack.forEach(function (s) {
          L.push('| ' + s.depth + ' | ' + s.layer_id + ' | ' + s.z_mm + ' | ' + pct(s.all_material_coverage) +
            ' | ' + pct(s.dense_coverage) + ' | `' + s.roles_present + '` |');
        });
        if (f.support_planes_skipped && f.support_planes_skipped.length) {
          L.push('');
          L.push('Support-only planes skipped (they do not consume the model-depth budget): ' +
            f.support_planes_skipped.map(function (s) { return 'Z' + s.z_mm + ' (L' + s.layer_id + ')'; }).join(', '));
        }
        L.push('');
        L.push('</details>');
      }
      L.push('');
    });
    if (r.bridges && r.bridges.length) {
      L.push('### Declared bridge geometry over open air');
      L.push('');
      L.push('The slicer labelled these spans as bridges. A bridge label explains an unsupported');
      L.push('first span; it does not excuse a stack gap above that foundation, and it is not by');
      L.push('itself a missing-top defect. Listed for context.');
      L.push('');
      L.push('| layer | Z mm | coverage directly below | area mm² | first line |');
      L.push('|---|---:|---:|---:|---:|');
      r.bridges.slice(0, 40).forEach(function (b) {
        L.push('| ' + b.roof.layer_id + ' | ' + b.roof.z_mm + ' | ' + pct(b.coverage_below) + ' | ' + fmt(b.region.area_mm2, 1) + ' | ' + b.roof.line + ' |');
      });
      L.push('');
    }
    if (r.notes && r.notes.length) {
      L.push('### Analysis limits observed in this file');
      L.push('');
      r.notes.forEach(function (n) { L.push('- `' + n.key + '` — ' + n.message); });
      L.push('');
    }
    if (r.controls && r.controls.length) {
      L.push('### Healthy control stacks (complete intermediate skins above a foundation)');
      L.push('');
      L.push('| roof layer | roof Z | intermediate planes | min intermediate coverage | foundation Z |');
      L.push('|---|---:|---|---:|---:|');
      r.controls.forEach(function (c) {
        L.push('| ' + c.roof_layer + ' | ' + c.roof_z + ' | ' + c.planes.join(', ') + ' | ' + pct(c.min_coverage) + ' | ' + c.foundation_z + ' |');
      });
      L.push('');
      L.push('A complete stack is evidence that the omissions elsewhere are selective. It is not');
      L.push('evidence of what the required top-shell thickness was — only a project or profile');
      L.push('setting can establish that.');
      L.push('');
    }
  });
  return L.join('\n');
}

/*
 * Metadata findings: header statistics disagreeing with parsed entries is
 * informational, never proof of missing material.
 */
function metadataFindings(header, res) {
  var out = [];
  var parsed = header.layerMarkers || header.layerChangeMarkers;
  if (header.layerCountHeader !== null && parsed && header.layerCountHeader !== parsed) {
    out.push({
      type: 'LAYER_METADATA_MISMATCH',
      severity: 'warning',
      detail: 'header declares LAYER_COUNT ' + header.layerCountHeader + ' but the body carries ' +
        parsed + ' layer markers' + (header.totalLayerStat !== null ? ', and the file\'s own SET_PRINT_STATS_INFO TOTAL_LAYER=' + header.totalLayerStat + ' agrees with the markers' : '') +
        '. This is a metadata disagreement, not evidence that material is missing.'
    });
  }
  if (header.totalLayerStat !== null && parsed && header.totalLayerStat !== parsed) {
    out.push({
      type: 'LAYER_METADATA_MISMATCH', severity: 'warning',
      detail: 'SET_PRINT_STATS_INFO TOTAL_LAYER=' + header.totalLayerStat + ' disagrees with ' + parsed + ' parsed layer markers.'
    });
  }
  if (res.supportPlanes) {
    out.push({
      type: 'SUPPORT_SUBLAYER_PLANES', severity: 'info',
      detail: res.supportPlanes + ' deposition planes carry support material only and sit at non-uniform Z steps. They are excluded from the model-layer depth budget so they cannot mask a missing model plane.'
    });
  }
  return out;
}

/*
 * Control stacks: a roof whose whole intermediate stack is dense is reported as a
 * control. Its purpose is narrow and honest — it shows the omissions elsewhere are
 * *selective*. It is not evidence of what the required top-shell thickness was;
 * only a profile or project setting can establish that.
 */
function findControls(stackObj, cands) {
  var out = [];
  cands.forEach(function (cand) {
    var p = cand.plane;
    if (!p.roles.TOP) return;
    var walk = stackObj.walkDown(cand, true);
    var dense = walk.rows.filter(function (r) { return r.all >= 0.95; });
    if (dense.length < 3 || !walk.foundation) return;
    out.push({
      roof_layer: p.layerId, roof_z: p.z,
      planes: dense.map(function (r) { return r.z; }),
      min_coverage: Math.min.apply(null, dense.map(function (r) { return r.all; })),
      foundation_z: walk.foundation.z, foundation_layer: walk.foundation.layerId,
      area_mm2: Math.round(cand.area * 10) / 10
    });
  });
  // One row per roof Z, keeping the stack with the most complete coverage.
  var byRoof = {};
  out.forEach(function (c) {
    var k = c.roof_z;
    if (!byRoof[k] || c.min_coverage > byRoof[k].min_coverage) byRoof[k] = c;
  });
  return Object.keys(byRoof).map(function (k) { return byRoof[k]; })
    .sort(function (a, b) { return a.roof_z - b.roof_z; });
}

function main() {
  var a = parseArgs(process.argv.slice(2));
  if (a.help || !a.files.length) {
    console.log('usage: node src/roof.js <file.gcode ...> [--json out.json] [--md report.md] [--cell 0.2] [--close 0.05] [--depth 8] [--depth-mm 2] [--min-area 5] [--max-coverage 0.10] [--min-planes 2] [--tolerance 0.02] [--expect-top N]');
    process.exit(a.help ? 0 : 2);
  }
  var opts = a.opts;
  var results = [];
  var idx = 0;

  function next() {
    if (idx >= a.files.length) return done();
    var file = a.files[idx++];
    scanHeader(file, function (header) {
      analyseFile(file, opts, function (err, res, stack) {
        if (err) { console.error('ERROR ' + file + ': ' + err.message); return next(); }
        res.header = header;
        res.metadata = metadataFindings(header, res);
        // Stamp file identity onto every finding so a finding is self-describing
        // once it leaves the report it came from.
        res.findings.forEach(function (f) {
          f.file = {
            name: path.basename(file), sha256: res.sha256,
            generator: header.generator, processor: header.processor, mode: header.mode
          };
        });
        if (opts.expectTop) {
          res.findings.forEach(function (f) {
            if (f.type === 'LOCAL_TOP_STACK_GAP' && f.missing_plane_count >= 1) {
              f.type = 'TOP_SHELL_THICKNESS_SHORTFALL';
              f.expected_top_shell_count = opts.expectTop;
              f.expected_top_shell_source = 'user configuration --expect-top';
            }
          });
        }
        try { res.controls = findControls(stack, res.candidateList); } catch (e) { res.controls = []; }
        res._stack = stack;
        results.push(res);
        if (!opts.quiet) {
          console.log(res.file + ': ' + res.planes + ' planes, ' + res.candidates + ' roof candidates, ' +
            res.findings.length + ' findings, ' + res.elapsedMs + ' ms');
        }
        next();
      });
    });
  }

  function done() {
    if (opts.json) {
      fs.writeFileSync(opts.json, JSON.stringify({
        generated: new Date().toISOString(),
        tool: 'FibreSeeker 3 G-code Inspector — roof-stack analyser',
        mode: 'read-only',
        options: opts,
        reports: results.map(function (r) {
          return {
            file: r.file, sha256: r.sha256, header: r.header, metadata: r.metadata, bytes: r.bytes,
            elapsedMs: r.elapsedMs, collector: r.collector,
            planes: r.planes, modelPlanes: r.modelPlanes, supportPlanes: r.supportPlanes,
            candidates: r.candidates, rejected: r.rejected, notes: r.notes,
            bridges: r.bridges, controls: r.controls, findings: r.findings
          };
        })
      }, null, 2));
      if (!opts.quiet) console.log('wrote ' + opts.json);
    }
    if (opts.md) {
      fs.writeFileSync(opts.md, markdown(results, opts));
      if (!opts.quiet) console.log('wrote ' + opts.md);
    }
    if (!opts.quiet) {
      var total = results.reduce(function (n, r) { return n + r.findings.length; }, 0);
      var err = results.reduce(function (n, r) {
        return n + r.findings.filter(function (f) { return f.severity === 'error'; }).length;
      }, 0);
      console.log('total findings ' + total + ' (' + err + ' at error severity)');
    }
  }
  next();
}

if (require.main === module) main();
