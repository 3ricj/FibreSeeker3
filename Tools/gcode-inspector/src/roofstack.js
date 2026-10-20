/*
 * FibreSeeker 3 G-code Inspector — roof-stack (missing deposition) analyser
 *
 * Answers one question and answers it honestly: *is there material where the
 * slicer said there would be, in the volume directly beneath a top skin?*
 *
 * Why this is a separate module rather than another pass in inspector.js: every
 * existing support check (C06) asks about the *previous layer index*. That is
 * the wrong question for a buried void. A top skin can sit on a perfectly sound
 * layer that is itself spanning a hole two layers down, and an index-based probe
 * reports "supported" while the material beneath is a bridge over open air. The
 * reference export demonstrates exactly that at Z15.0/L80 (finding C): 97.8%
 * immediate coverage, and nothing at all two planes down.
 *
 * The model, in order of the work:
 *
 *   1. Deposition is recorded as *physical planes*, keyed by the nozzle Z that
 *      actually laid the bead — not by layer index and not by macrolayer. Five
 *      support-only sublayer planes in the reference file sit between model
 *      planes at 0.067/0.133/0.15 mm steps; a support plane must never consume
 *      the model-layer depth budget, so support planes are tagged and skipped
 *      when counting depth.
 *   2. Each plane gets a swept XY footprint: every bead is the Minkowski sum of
 *      its centreline and a disc of half its own width (a round-capped buffer),
 *      rasterised by an exact point-to-segment distance test. No bounding boxes,
 *      no convex hulls.
 *   3. Top candidates are *connected components* of the dense-fill mask of a
 *      plane carrying a top role — so two islands are two candidates, and a hole
 *      inside a skin stays a hole.
 *   4. A candidate is grown by at most `closeMm` (default 0.05 mm, far under one
 *      bead width) purely to knit raster strokes that nearly touch. Coverage is
 *      then measured against the *original* deposited footprint clipped to that
 *      group, never against the grown rectangle.
 *   5. The stack under each candidate is walked downward plane by plane, and the
 *      missing masks are intersected through depth. A defect is a *common*
 *      missing region across a consecutive run of planes — not an average, which
 *      a large supported area would dilute away.
 *
 * Everything is read-only. Nothing here repairs, inserts or re-slices anything,
 * and no finding claims a slicer defect as established fact: geometry
 * confidence and cause confidence are separate fields, and "the export omits
 * deposition here" is stated as an observation about the export.
 */
(function (root) {
  'use strict';

  /*
   * Role vocabulary. The engine normalises each slicer's labels onto these
   * classes; the original label is always retained on the finding.
   *   dense   — continuous solid material that can act as a skin
   *   backing — real deposited material that is not a skin (wall, gap fill,
   *             sparse infill, support): physical backing, not a skin
   *   other   — skirt/brim/wipe/priming: outside the part
   */
  var ROLE_CLASS = {
    SOLID: 'dense', TOP: 'dense', BOTTOM: 'dense', BRIDGE: 'dense', OVERHANG: 'dense',
    WALL: 'backing', FILL: 'backing', SUPPORT: 'backing', GAPFILL: 'backing',
    SKIRT: 'other', BRIM: 'other', WIPE: 'other', PRIMING: 'other',
    CUSTOM: 'other', UNKNOWN: 'backing'
  };

  // Roles that make a plane a candidate roof, and roles that count as a skin.
  var ROOF_ROLES = { TOP: 1, BRIDGE: 1 };
  var DENSE_ROLES = { SOLID: 1, TOP: 1, BOTTOM: 1, BRIDGE: 1, OVERHANG: 1 };

  var DEFAULTS = {
    cell: 0.2,               // raster resolution, mm
    closeMm: 0.05,           // max gap closed to group a roof footprint (< 1 bead width)
    dilateMm: 0.0,           // extra tolerance applied to the roof region itself
    minRegionArea: 5,        // mm^2 of roof footprint worth analysing
    minMissingArea: 5,       // mm^2 of *common* missing area to call a defect
    maxCoverage: 0.10,       // all-material coverage below which a plane is "missing"
    minMissingPlanes: 2,     // consecutive missing planes for a stack gap
    foundationOverlap: 0.80, // coverage above which a plane counts as a foundation
    maxDepthPlanes: 8,       // bounded diagnostic search depth in model planes
    maxDepthMm: 2.0,         // ... and in millimetres
    minSpanMm: 16,           // unsupported-interval floor for a span finding
    // A void must be at least this wide (inscribed diameter) to read as an
    // omitted sheet rather than a channel between strands. Four nominal bead
    // widths: the reference defects measure 4.0/7.6/21.2 mm across, while the
    // inter-strand channels this gate exists to reject measure 0.8 mm.
    minVoidWidthMm: 1.6,
    maxPlanes: 4096,         // hard cap on retained planes
    maxSegsPerPlane: 4000000, // hard cap on retained segments per plane
    expectTop: null
  };

  // ---------------------------------------------------------------------------
  // Raster helpers. A mask is {cols, rows, x0, y0, cell, data} over world XY.
  // ---------------------------------------------------------------------------

  function emptyMask(cols, rows, x0, y0, cell) {
    return { cols: cols, rows: rows, x0: x0, y0: y0, cell: cell, data: new Uint8Array(cols * rows) };
  }

  /*
   * Stamp the Minkowski sum of a segment and a disc of radius `r` — the swept
   * footprint of a round-capped bead. Cell centres are tested against the exact
   * distance to the segment, so the footprint is correct at any grid resolution
   * and for any bead angle; this file's infill runs at 45 degrees, where a
   * bounding-box approximation would smear material into the voids it is meant
   * to measure.
   */
  function stampCapsule(mask, x0, y0, x1, y1, r) {
    var cell = mask.cell, cols = mask.cols, rows = mask.rows, data = mask.data;
    var dx = x1 - x0, dy = y1 - y0;
    var len2 = dx * dx + dy * dy;
    var c0 = Math.floor((Math.min(x0, x1) - r - mask.x0) / cell); if (c0 < 0) c0 = 0;
    var c1 = Math.floor((Math.max(x0, x1) + r - mask.x0) / cell); if (c1 > cols - 1) c1 = cols - 1;
    var r0 = Math.floor((Math.min(y0, y1) - r - mask.y0) / cell); if (r0 < 0) r0 = 0;
    var r1 = Math.floor((Math.max(y0, y1) + r - mask.y0) / cell); if (r1 > rows - 1) r1 = rows - 1;
    var r2 = r * r;
    for (var ry = r0; ry <= r1; ry++) {
      var py = mask.y0 + (ry + 0.5) * cell;
      var base = ry * cols;
      for (var cx = c0; cx <= c1; cx++) {
        var px = mask.x0 + (cx + 0.5) * cell;
        var t = len2 > 0 ? ((px - x0) * dx + (py - y0) * dy) / len2 : 0;
        if (t < 0) t = 0; else if (t > 1) t = 1;
        var qx = x0 + dx * t - px, qy = y0 + dy * t - py;
        if (qx * qx + qy * qy <= r2) data[base + cx] = 1;
      }
    }
  }

  function maskArea(mask) {
    var n = 0, d = mask.data;
    for (var i = 0; i < d.length; i++) if (d[i]) n++;
    return n * mask.cell * mask.cell;
  }

  function maskCount(mask) {
    var n = 0, d = mask.data;
    for (var i = 0; i < d.length; i++) if (d[i]) n++;
    return n;
  }

  /*
   * Fraction of `region`'s cells that `plane` covers. Both masks share `cell`
   * (enforced by the caller), so the lookup is an origin shift — no resampling,
   * no interpolation, no blur.
   *
   * Test each region cell's centre against the containing cell on the backing
   * plane. Sampling a cell's corner instead produces a half-cell shift; it can
   * also drift a whole cell after cropping because of floating-point rounding.
   */
  function coverageOf(region, plane) {
    if (!plane || !plane.mask || !plane.mask.data) return 0;
    var cell = region.cell;
    var rd = region.data, pd = plane.mask.data;
    var pc = plane.mask.cols, pr = plane.mask.rows;
    var ox = region.x0 - plane.mask.x0, oy = region.y0 - plane.mask.y0;
    var hit = 0;
    for (var ry = 0; ry < region.rows; ry++) {
      var prY = Math.floor(((ry + 0.5) * cell + oy) / cell);
      if (prY < 0 || prY >= pr) continue;
      var rbase = ry * region.cols, pbase = prY * pc;
      for (var cx = 0; cx < region.cols; cx++) {
        if (!rd[rbase + cx]) continue;
        var pcX = Math.floor(((cx + 0.5) * cell + ox) / cell);
        if (pcX < 0 || pcX >= pc) continue;
        if (pd[pbase + pcX]) hit++;
      }
    }
    var total = maskCount(region);
    return total ? hit / total : 0;
  }

  /*
   * The part of `region` that `plane` does NOT cover, as its own mask. Returned
   * even when empty so the caller can intersect it through depth.
   */
  function missingOf(region, plane) {
    var out = emptyMask(region.cols, region.rows, region.x0, region.y0, region.cell);
    var rd = region.data, od = out.data;
    var pd = plane && plane.mask ? plane.mask.data : null;
    var pc = pd ? plane.mask.cols : 0, pr = pd ? plane.mask.rows : 0;
    var cell = region.cell;
    var ox = region.x0 - plane.mask.x0, oy = region.y0 - plane.mask.y0;
    for (var ry = 0; ry < region.rows; ry++) {
      var rbase = ry * region.cols;
      var prY = pd ? Math.floor(((ry + 0.5) * cell + oy) / cell) : -1;
      var pbase = (pd && prY >= 0 && prY < pr) ? prY * pc : -1;
      for (var cx = 0; cx < region.cols; cx++) {
        if (!rd[rbase + cx]) continue;
        if (pbase < 0) { od[rbase + cx] = 1; continue; }
        var pcX = Math.floor(((cx + 0.5) * cell + ox) / cell);
        var covered = pcX >= 0 && pcX < pc && pd[pbase + pcX];
        if (!covered) od[rbase + cx] = 1;
      }
    }
    return out;
  }

  function intersectMasks(a, b) {
    var out = emptyMask(a.cols, a.rows, a.x0, a.y0, a.cell);
    var ad = a.data, bd = b.data, od = out.data;
    for (var i = 0; i < od.length; i++) if (ad[i] && bd[i]) od[i] = 1;
    return out;
  }

  /*
   * Intersection of two masks that may have different origins and extents, in
   * the frame of `a`. `growComponent` returns a cropped mask, so the grouped
   * region and the clipped region are not array-aligned even though they share a
   * cell size. Gates that read the grouped region need this; coverage that reads
   * the clipped region does not.
   */
  function intersectWorld(a, b) {
    var out = emptyMask(a.cols, a.rows, a.x0, a.y0, a.cell);
    if (a.cell !== b.cell) return out;      // not comparable; refuse rather than guess
    var ad = a.data, bd = b.data, od = out.data;
    var ox = Math.round((b.x0 - a.x0) / a.cell), oy = Math.round((b.y0 - a.y0) / a.cell);
    for (var y = 0; y < a.rows; y++) {
      var by = y - oy;
      if (by < 0 || by >= b.rows) continue;
      var arow = y * a.cols, brow = by * b.cols;
      for (var x = 0; x < a.cols; x++) {
        var bx = x - ox;
        if (bx < 0 || bx >= b.cols) continue;
        var i = arow + x;
        if (ad[i] && bd[brow + bx]) od[i] = 1;
      }
    }
    return out;
  }

  /*
   * Connected components of a mask, 8-connected.
   *
   * 8-connectivity is the conservative choice for *holes* and the permissive one
   * for *material*: two strokes touching corner-to-corner are one skin region,
   * which is what a printed skin actually is. Splitting disconnected islands is
   * the whole point — a component per island means infill on island B can never
   * vouch for the skin on island A.
   */
  function components(mask, minCells) {
    var cols = mask.cols, rows = mask.rows, d = mask.data;
    var seen = new Uint8Array(d.length);
    var out = [];
    var stack = [];
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var i0 = y * cols + x;
        if (!d[i0] || seen[i0]) continue;
        seen[i0] = 1;
        stack.length = 0; stack.push(i0);
        var cells = [], x0 = x, x1 = x, y0 = y, y1 = y, n = 0;
        while (stack.length) {
          var i = stack.pop();
          var cx = i % cols, cy = (i - cx) / cols;
          cells.push(i); n++;
          if (cx < x0) x0 = cx; if (cx > x1) x1 = cx;
          if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
          for (var oy = -1; oy <= 1; oy++) {
            var ny = cy + oy; if (ny < 0 || ny >= rows) continue;
            for (var ox = -1; ox <= 1; ox++) {
              var nx = cx + ox; if (nx < 0 || nx >= cols) continue;
              var j = ny * cols + nx;
              if (d[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
            }
          }
        }
        if (n >= minCells) {
          // Retain this island's grid, not another copy of the whole layer.
          // One empty cell of padding preserves boundary-distance measurements.
          var left = Math.max(0, x0 - 1), top = Math.max(0, y0 - 1);
          var width = Math.min(cols - 1, x1 + 1) - left + 1;
          var height = Math.min(rows - 1, y1 + 1) - top + 1;
          var m = emptyMask(width, height, mask.x0 + left * mask.cell, mask.y0 + top * mask.cell, mask.cell);
          for (var k = 0; k < cells.length; k++) {
            var px = cells[k] % cols, py = Math.floor(cells[k] / cols);
            m.data[(py - top) * width + px - left] = 1;
          }
          out.push({
            mask: m, cells: n,
            bbox: { x0: x0, x1: x1, y0: y0, y1: y1 },
            area: n * mask.cell * mask.cell
          });
        }
      }
    }
    return out;
  }

  /*
   * Grow a component by at most `maxGrow` cells, crossing empty cells only.
   *
   * This is a bounded dilation, not a fill: the BFS refuses to step further than
   * `maxGrow` from deposited material, so a real opening wider than the tolerance
   * is never bridged and a bounding box is never produced. It exists for one
   * reason — to group raster strokes of a single skin that stop a hair short of
   * each other, so the region is one roof rather than a hundred strokes.
   */
  function growComponent(mask, comp, maxGrow) {
    var cols = mask.cols, rows = mask.rows, d = mask.data;
    var pad = maxGrow + 1;
    var x0 = Math.max(0, comp.bbox.x0 - pad), x1 = Math.min(cols - 1, comp.bbox.x1 + pad);
    var y0 = Math.max(0, comp.bbox.y0 - pad), y1 = Math.min(rows - 1, comp.bbox.y1 + pad);
    var w = x1 - x0 + 1, h = y1 - y0 + 1;
    var dist = new Int32Array(w * h); dist.fill(-1);
    var qx = new Int32Array(w * h), qy = new Int32Array(w * h);
    var head = 0, tail = 0, truncated = false;
    var seed = comp.mask.data;
    var seedX = Math.round((comp.mask.x0 - mask.x0) / mask.cell);
    var seedY = Math.round((comp.mask.y0 - mask.y0) / mask.cell);
    for (var sy = comp.bbox.y0; sy <= comp.bbox.y1; sy++) {
      for (var sx = comp.bbox.x0; sx <= comp.bbox.x1; sx++) {
        if (!seed[(sy - seedY) * comp.mask.cols + sx - seedX]) continue;
        dist[(sy - y0) * w + (sx - x0)] = 0;
        qx[tail] = sx; qy[tail] = sy; tail++;
      }
    }
    while (head < tail) {
      var cx = qx[head], cy = qy[head]; head++;
      var cd = dist[(cy - y0) * w + (cx - x0)];
      for (var oy = -1; oy <= 1; oy++) {
        for (var ox = -1; ox <= 1; ox++) {
          if (!ox && !oy) continue;
          var nx = cx + ox, ny = cy + oy;
          if (nx < x0 || nx > x1 || ny < y0 || ny > y1) { truncated = true; continue; }
          var gi = (ny - y0) * w + (nx - x0);
          if (dist[gi] !== -1) continue;
          // Chebyshev step: one cell of growth in any direction costs one unit,
          // so the cap is a true square-dilation bound.
          var nd = cd + 1;
          if (nd > maxGrow) continue;
          dist[gi] = nd;
          qx[tail] = nx; qy[tail] = ny; tail++;
        }
      }
    }
    var out = emptyMask(w, h, mask.x0 + x0 * mask.cell, mask.y0 + y0 * mask.cell, mask.cell);
    var n = 0, bx0 = w, bx1 = -1, by0 = h, by1 = -1;
    for (var yy = 0; yy < h; yy++) {
      for (var xx = 0; xx < w; xx++) {
        if (dist[yy * w + xx] === -1) continue;
        out.data[yy * w + xx] = 1; n++;
        if (xx < bx0) bx0 = xx; if (xx > bx1) bx1 = xx;
        if (yy < by0) by0 = yy; if (yy > by1) by1 = yy;
      }
    }
    return {
      mask: out, cells: n, area: n * mask.cell * mask.cell, truncated: truncated,
      bbox: { x0: bx0, x1: bx1, y0: by0, y1: by1 }
    };
  }

  /*
   * Distance from a set cell to the nearest *unset* cell (or the mask edge), by
   * expanding square rings. On a common-missing mask this is the inscribed radius:
   * how far the point sits from the region boundary — and because the complement of
   * a common-missing mask contains every cell that any searched depth covers, it is
   * also how far the point is from deposited beads at every missing depth at once.
   */
  function inscribedRadius(mask, cx, cy) {
    var cols = mask.cols, rows = mask.rows, d = mask.data;
    for (var ring = 1; ring < 4000; ring++) {
      if (cy - ring < 0 || cy + ring >= rows || cx - ring < 0 || cx + ring >= cols) return ring * mask.cell;
      for (var oy = -ring; oy <= ring; oy++) {
        for (var ox = -ring; ox <= ring; ox++) {
          if (Math.abs(ox) !== ring && Math.abs(oy) !== ring) continue;
          if (!d[(cy + oy) * cols + (cx + ox)]) return ring * mask.cell;
        }
      }
    }
    return 4000 * mask.cell;
  }

  /*
   * Distance from any cell to the nearest *set* cell, by expanding square rings.
   * On a plane's all-material mask this is the clearance to the nearest deposited
   * bead. Reported as a floor: "at least N mm from any bead", never as an exact
   * distance to a bead edge.
   */
  function clearanceAt(mask, cx, cy) {
    var cols = mask.cols, rows = mask.rows, d = mask.data;
    if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) return null;
    if (d[cy * cols + cx]) return 0;
    for (var ring = 1; ring < 4000; ring++) {
      var found = null;
      for (var oy = -ring; oy <= ring; oy++) {
        var yy = cy + oy;
        if (yy < 0 || yy >= rows) continue;
        for (var ox = -ring; ox <= ring; ox++) {
          if (Math.abs(ox) !== ring && Math.abs(oy) !== ring) continue;
          var xx = cx + ox;
          if (xx < 0 || xx >= cols) continue;
          if (!d[yy * cols + xx]) continue;
          var dd = ox * ox + oy * oy;
          if (found === null || dd < found) found = dd;
        }
      }
      if (found !== null) return Math.sqrt(found) * mask.cell;
      if (cy - ring < 0 && cy + ring >= rows && cx - ring < 0 && cx + ring >= cols) return null;
    }
    return null;
  }

  /*
   * Representative point inside a missing region: the deepest interior cell, i.e.
   * the one with the largest inscribed radius. The stride bounds the work on a
   * large region. This is the point that best demonstrates "nowhere near any bead",
   * which is what the number is for.
   */
  function samplePoint(mask, cell) {
    var cols = mask.cols, rows = mask.rows, d = mask.data;
    var n = 0;
    for (var i = 0; i < d.length; i++) if (d[i]) n++;
    if (!n) return null;
    var stride = Math.max(1, Math.round(Math.sqrt(n / 20000)));
    var best = null, bestR = -1;
    for (var y = 0; y < rows; y += stride) {
      for (var x = 0; x < cols; x += stride) {
        if (!d[y * cols + x]) continue;
        var r = inscribedRadius(mask, x, y);
        if (r > bestR) {
          bestR = r;
          best = [mask.x0 + (x + 0.5) * cell, mask.y0 + (y + 0.5) * cell, r];
        }
      }
    }
    if (!best) {
      for (var y2 = 0; y2 < rows; y2++) for (var x2 = 0; x2 < cols; x2++) {
        if (!d[y2 * cols + x2]) continue;
        return [mask.x0 + (x2 + 0.5) * cell, mask.y0 + (y2 + 0.5) * cell, 0];
      }
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // The analyser
  // ---------------------------------------------------------------------------

  function RoofStack(opts) {
    opts = opts || {};
    var o = this.opts = {};
    Object.keys(DEFAULTS).forEach(function (k) {
      o[k] = opts[k] === undefined ? DEFAULTS[k] : opts[k];
    });
    this.planes = [];
    this.planesByZ = new Map();
    this.layerRecords = {};
    this.cur = null;
    this.notes = [];
    this.sectionSeq = 0;
    this.state = { unknownMacros: {}, arcs: 0, arcUnsupported: 0, widthWarnings: 0, heightWarnings: 0, toolOffsets: 0 };
  }

  RoofStack.prototype.warn = function (key, msg) {
    this.notes.push({ key: key, message: msg });
  };

  /*
   * Open a physical deposition plane. `info.layerId` is the reported layer index
   * and `info.macroId` the macrolayer — both are carried for provenance only.
   * The plane identity is its Z, because that is the only thing the nozzle
   * agrees about.
   */
  RoofStack.prototype.beginPlane = function (info) {
    this.recordLayer(info.layerId, info.headerZ, info.line);
    var existing = this.planesByZ.get(info.z);
    if (existing) { this.cur = existing; return; }
    if (this.planes.length >= this.opts.maxPlanes) {
      if (!this._planeCapWarned) { this.warn('plane_cap', 'plane retention capped at ' + this.opts.maxPlanes); this._planeCapWarned = true; }
      this.cur = null; return;
    }
    this.cur = {
      z: info.z, layerId: info.layerId === undefined ? null : info.layerId,
      macroId: info.macroId === undefined ? null : info.macroId,
      headerZ: info.headerZ === undefined ? null : info.headerZ,
      line: info.line || 0,
      segs: [], roles: {}, bbox: null, dense: false, roof: false, supportOnly: true,
      anyDeposition: false, firstLine: null, lastLine: null, firstRoofLine: null,
      hasSupport: false, hasModel: false
    };
    this.planes.push(this.cur);
    this.planesByZ.set(info.z, this.cur);
  };

  RoofStack.prototype.recordLayer = function (id, z, line) {
    if (id === null || id === undefined) return;
    if (!this.layerRecords[id]) this.layerRecords[id] = { z: z, firstLine: line };
  };

  /*
   * Record one deposited bead. `seg` is
   *   {x0,y0,x1,y1,width,height,role,label,tool,line}
   * with `role` the normalised class (see ROLE_CLASS inputs). Non-finite or
   * non-positive widths are refused rather than guessed: a made-up width turns an
   * unknown into a confident — and wrong — coverage number.
   */
  RoofStack.prototype.addSegment = function (seg) {
    var p = this.cur;
    if (!p) return;
    if (!isFinite(seg.x0) || !isFinite(seg.y0) || !isFinite(seg.x1) || !isFinite(seg.y1)) return;
    if (!(seg.width > 0) || !isFinite(seg.width)) {
      if (!this._widthWarned) { this.warn('bad_width', 'a deposition move carried no usable width'); this._widthWarned = true; }
      return;
    }
    if (!(seg.height > 0) || !isFinite(seg.height)) {
      if (!this._heightWarned) { this.warn('bad_height', 'a deposition move carried no usable bead height'); this._heightWarned = true; }
      return;
    }
    var dx = seg.x1 - seg.x0, dy = seg.y1 - seg.y0;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (!(len > 0)) return;                       // stationary prime, not a path
    if (p.segs.length >= this.opts.maxSegsPerPlane) {
      if (!this._segCapWarned) { this.warn('seg_cap', 'segment retention capped per plane'); this._segCapWarned = true; }
      return;
    }
    var cls = ROLE_CLASS[seg.role] || 'backing';
    p.segs.push({
      x0: seg.x0, y0: seg.y0, x1: seg.x1, y1: seg.y1,
      w: seg.width, h: seg.height, len: len,
      role: seg.role, cls: cls, label: seg.label || seg.role, tool: seg.tool || null,
      line: seg.line || 0, section: this.sectionSeq, path: seg.path || 0
    });
    p.anyDeposition = true;
    if (p.firstLine === null) p.firstLine = seg.line;
    p.lastLine = seg.line;
    // Support is its own category: a plane carrying only support is a support
    // plane, even though support is real physical backing.
    if (seg.role === 'SUPPORT') p.hasSupport = true;
    else if (cls !== 'other') p.hasModel = true;
    if (DENSE_ROLES[seg.role]) p.dense = true;
    if (ROOF_ROLES[seg.role]) {
      p.roof = true;
      if (p.firstRoofLine === null) p.firstRoofLine = seg.line;
      if (!p.roofLabels) p.roofLabels = {};
      p.roofLabels[seg.label] = true;
    }
    var r = p.roles[seg.role] || (p.roles[seg.role] = { label: seg.label || seg.role, count: 0, len: 0, vol: 0, lines: [] });
    r.count++; r.len += len; r.vol += len * seg.width * seg.height;
    if (r.lines.length < 3) r.lines.push(seg.line);
    var b = p.bbox;
    var half = seg.width * 0.5;
    var sx0 = Math.min(seg.x0, seg.x1) - half, sx1 = Math.max(seg.x0, seg.x1) + half;
    var sy0 = Math.min(seg.y0, seg.y1) - half, sy1 = Math.max(seg.y0, seg.y1) + half;
    if (!b) p.bbox = { x0: sx0, y0: sy0, x1: sx1, y1: sy1, h: seg.height };
    else {
      if (sx0 < b.x0) b.x0 = sx0; if (sx1 > b.x1) b.x1 = sx1;
      if (sy0 < b.y0) b.y0 = sy0; if (sy1 > b.y1) b.y1 = sy1;
    }
  };

  RoofStack.prototype.openSection = function () { this.sectionSeq++; };
  RoofStack.prototype.note = function (key) {
    this.state[key] = (this.state[key] || 0) + 1;
  };

  /*
   * Rasterise every plane. Two masks per plane: `mask` is all deposited material
   * (walls, gap fill, sparse infill and support included — physical backing) and
   * `dense` is the solid-skin subset. Keeping them separate is what lets a wall
   * count as backing without counting as a skin, and stops a sparse-infill layer
   * from being mistaken for an intact surface.
   */
  RoofStack.prototype.buildMasks = function () {
    var t0 = Date.now();
    var cell = this.opts.cell;
    this.planes.sort(function (a, b) { return a.z - b.z; });
    for (var i = 0; i < this.planes.length; i++) {
      var p = this.planes[i];
      p.index = i;
      if (!p.bbox) continue;
      var pad = cell;
      var x0 = p.bbox.x0 - pad, x1 = p.bbox.x1 + pad;
      var y0 = p.bbox.y0 - pad, y1 = p.bbox.y1 + pad;
      var cols = Math.max(1, Math.ceil((x1 - x0) / cell));
      var rows = Math.max(1, Math.ceil((y1 - y0) / cell));
      p.mask = emptyMask(cols, rows, x0, y0, cell);
      p.denseMask = emptyMask(cols, rows, x0, y0, cell);
      p.maxHalf = 0;
      var minHeight = Infinity, minRoofHeight = Infinity;
      for (var s = 0; s < p.segs.length; s++) {
        var seg = p.segs[s];
        minHeight = Math.min(minHeight, seg.h);
        if (ROOF_ROLES[seg.role]) minRoofHeight = Math.min(minRoofHeight, seg.h);
        var half = seg.w * 0.5;
        if (half > p.maxHalf) p.maxHalf = half;
        stampCapsule(p.mask, seg.x0, seg.y0, seg.x1, seg.y1, half);
        if (DENSE_ROLES[seg.role]) stampCapsule(p.denseMask, seg.x0, seg.y0, seg.x1, seg.y1, half);
      }
      p.area = maskCount(p.mask) * cell * cell;
      p.denseArea = maskCount(p.denseMask) * cell * cell;
      // A wall recorded first can be half the height of this plane's top skin.
      // Use the roof beads; the minimum is conservative for mixed heights.
      p.beadHeight = isFinite(minRoofHeight) ? minRoofHeight : minHeight;
      /*
       * A plane is support-only when it carries support material and no model
       * material. Support is real physical backing and is still measured, but it
       * must not consume the model-layer depth budget: support Z-separation is
       * designed behaviour, and letting a support sublayer count as a model plane
       * would hide a missing model plane behind material that is deliberately not
       * part of the part.
       */
      p.supportOnly = !!p.hasSupport && !p.hasModel;
    }
    this._maskMs = Date.now() - t0;
  };

  /*
   * Candidate roofs: connected components of the dense mask on any plane that
   * carries a top or bridge role. Topmost *and* intermediate-top planes are both
   * candidates — inspecting only the topmost skin is precisely what misses a
   * buried void, because the buried void's own roof is an intermediate layer.
   */
  RoofStack.prototype.candidates = function () {
    var out = [];
    var minCells = Math.max(1, Math.ceil(this.opts.minRegionArea / (this.opts.cell * this.opts.cell)));
    for (var i = 0; i < this.planes.length; i++) {
      var p = this.planes[i];
      if (!p.roof || !p.denseMask) continue;
      var comps = components(p.denseMask, minCells);
      for (var c = 0; c < comps.length; c++) {
        /*
         * The grouping tolerance is expressed in millimetres and converted to
         * cells, so a 0.05 mm close is sub-cell at the default 0.2 mm grid and
         * simply does nothing there — the raster already merges the strokes. It is
         * the reported, not the hidden, consequence of that: at a finer grid the
         * same 0.05 mm becomes a real number of cells, and the caller who goes
         * finer than the default should raise `closeMm` with it. The finding set at
         * the default and at a coarser grid is identical, which is the sensitivity
         * property this tool claims.
         */
        var want = this.opts.closeMm + this.opts.dilateMm;
        var grow = want > 0 ? Math.round(want / this.opts.cell) : 0;
        var grown = grow > 0 ? growComponent(p.denseMask, comps[c], grow) : comps[c];
        /*
         * The *gate* is on the grouped region: is this roof big enough to be worth
         * analysing. The *measurement* is on the grouped region clipped back to the
         * plane's original deposited footprint — real material only, never the
         * dilation halo and never a filled bounding rectangle. Separating the two
         * keeps coverage honest: a hatched skin whose raster has hairline gaps is
         * still one region, while every coverage number is computed against actual
         * material.
         */
        if (grown.area < this.opts.minRegionArea) continue;
        /*
         * `intersectWorld`, not `intersectMasks`: growComponent returns a mask
         * cropped to the grown extent, so its array is neither the same length nor
         * the same origin as the plane mask. Index-for-index intersection would
         * silently compare unrelated cells. The misalignment is invisible at the
         * default grid, where the 0.05 mm close is sub-cell and no cropping happens
         * at all, and corrupts the region as soon as growth is enabled — which is
         * precisely the fine-grid configuration this file claims to support.
         */
        var region = intersectWorld(grown.mask, p.mask);
        var area = maskCount(region) * this.opts.cell * this.opts.cell;
        if (area < this.opts.minRegionArea) continue;
        out.push({ plane: p, region: region, grown: grown.mask, area: area, truncated: grown.truncated });
      }
    }
    return out;
  };

  /*
   * Walk the stack beneath one candidate region.
   *
   * Returns the per-depth coverage rows, the runs of consecutive missing planes,
   * the first plane strong enough to be a foundation, and — separately — the first
   * strong foundation *below the last missing run*. The distinction matters: a
   * roof can rest on a sound layer and still have that layer spanning a void two
   * planes down, and reporting only the immediate contact is exactly the mistake
   * that misses a buried cavity.
   *
   * Support-only planes are reported but never consume the depth budget: a support
   * sublayer is not a model layer, and letting it count would hide a missing model
   * plane behind material that is deliberately not part of the part.
   */
  RoofStack.prototype.walkDown = function (cand, deep) {
    var o = this.opts;
    var plane = cand.plane, region = cand.region;
    var rows = [], runs = [], cur = null;
    var foundation = null, foundationBelow = null, contact = null, supportSeen = [];
    var stopAtFoundation = false;
    var depth = 0, prevZ = plane.z, aboveHeight = plane.beadHeight || 0.2;
    var zTop = plane.z;
    var maxMm = (deep ? Math.max(o.maxDepthMm, 2.4) : o.maxDepthMm) + (plane.beadHeight || 0.2);
    var maxPlanes = deep ? Math.max(o.maxDepthPlanes, 12) : o.maxDepthPlanes;
    for (var j = plane.index - 1; j >= 0; j--) {
      var q = this.planes[j];
      if (!q.mask) continue;
      if (zTop - q.z > maxMm) break;
      if (q.supportOnly) {
        supportSeen.push({ z: q.z, layerId: q.layerId, line: q.firstLine });
        continue;
      }
      var all = coverageOf(region, q);
      // A wall sublayer inside the spanning bead is not a gap when material
      // actually contacts the bead's underside. Require that contact before
      // skipping: a thick bead can still have a real gap below it.
      var bottom = prevZ - aboveHeight;
      if (all < o.maxCoverage && q.z > bottom + 1e-6) {
        var contactBacking = false;
        for (var k = j - 1; k >= 0 && this.planes[k].z >= bottom - 1e-6; k--) {
          if (this.planes[k].mask && coverageOf(region, this.planes[k]) >= o.maxCoverage) {
            contactBacking = true; break;
          }
        }
        if (contactBacking) continue;
      }
      var dense = coverageOf(region, { mask: q.denseMask });
      var miss = missingOf(region, q);
      var missArea = maskCount(miss) * o.cell * o.cell;
      depth++;
      var row = {
        depth: depth, plane: q, z: q.z, layerId: q.layerId, line: q.firstLine,
        all: all, dense: dense, missingArea: missArea, missing: miss,
        roles: Object.keys(q.roles).join(', ')
      };
      rows.push(row);
      if (all < o.maxCoverage) {
        if (!cur) {
          // The plane immediately above the run is the bead that spans the void.
          // For a roof whose first depth is already missing, that is the roof
          // itself; otherwise it is the row just walked.
          cur = { rows: [], foundation: null, aboveZ: prevZ };
          runs.push(cur);
        }
        cur.rows.push(row);
      } else {
        if (all >= o.foundationOverlap) {
          var f = {
            plane: q, z: q.z, layerId: q.layerId, line: q.firstLine,
            overlap: all, denseOverlap: dense, roles: Object.keys(q.roles)
          };
          if (!contact) contact = f;
          if (!foundation) foundation = f;
          if (cur && !cur.foundation) cur.foundation = f;
          /*
           * The search ends at a foundation: the requirement is to look far enough
           * down to cover the top-shell thickness *plus one foundation layer*, not
           * to the bed. Anything below a sound foundation is that foundation's own
           * story, and reporting it as a gap under *this* roof would be wrong.
           *
           * The stop applies only while nothing is missing yet. Once a missing run
           * has been seen the walk must continue until the foundation *under that
           * run* is found — otherwise a roof resting on a sound layer that is
           * itself spanning a void stops at the contact and the buried cavity is
           * invisible, which is the exact failure this analysis exists to catch.
           */
          if (!deep && runs.length === 0) stopAtFoundation = true;
        }
        cur = null;
      }
      prevZ = q.z;
      aboveHeight = q.beadHeight || 0.2;
      if (stopAtFoundation || depth >= maxPlanes) break;
    }
    // The foundation that actually underlies the deepest missing run: for a
    // buried void this is *not* the layer the roof rests on.
    var foundationBelow = null;
    for (var k = runs.length - 1; k >= 0; k--) {
      if (runs[k].foundation) { foundationBelow = runs[k].foundation; break; }
    }
    if (!foundationBelow) foundationBelow = foundation;
    return {
      rows: rows, runs: runs, foundation: foundation, contact: contact,
      foundationBelow: foundationBelow, supportSeen: supportSeen
    };
  };

  /*
   * Longest interval of a roof's own beads with no material on the plane directly
   * beneath, and the total open length. Measured along the path and broken at
   * travels and section changes, so the reported maximum is one continuous
   * interval the nozzle actually bridged rather than a sum of unrelated strokes.
   *
   * This is a geometric statement about lack of backing. It is not a measurement
   * of sag and it is not a prediction of failure.
   */
  RoofStack.prototype.unsupportedSpans = function (plane, region, backing) {
    if (!backing || !backing.mask) return { max: 0, total: 0, seg: null };
    var cell = this.opts.cell;
    var rd = region.data, cols = region.cols, rows = region.rows;
    var bm = backing.mask;
    var bd = bm.data, bc = bm.cols, br = bm.rows;
    function inRegion(x, y) {
      var cx = Math.floor((x - region.x0) / cell), cy = Math.floor((y - region.y0) / cell);
      if (cx < 0 || cx >= cols || cy < 0 || cy >= rows) return false;
      return !!rd[cy * cols + cx];
    }
    function backed(x, y) {
      var cx = Math.floor((x - bm.x0) / cell), cy = Math.floor((y - bm.y0) / cell);
      if (cx < 0 || cx >= bc || cy < 0 || cy >= br) return false;
      return !!bd[cy * bc + cx];
    }
    var best = { max: 0, total: 0, seg: null, segMax: 0, segSeg: null };
    var curSection = -1, open = false, openLen = 0, openSeg = null, previous = null;
    var moveOpen = 0, moveSeg = null;
    /*
     * An interval is *continuous*: it ends the moment a backed sample is seen.
     * Accumulating across backed strokes instead would report the summed open
     * length of a whole hatched skin as if it were one span — on the reference
     * fixture that inflated a 29 mm stroke into a 26.9 m "interval", which is
     * exactly the kind of overstated claim this module exists to avoid.
     */
    function flush() {
      if (openLen > best.max && openSeg) { best.max = openLen; best.seg = openSeg; }
      if (moveOpen > best.segMax && moveSeg) { best.segMax = moveOpen; best.segSeg = moveSeg; }
      openLen = 0; openSeg = null; open = false; moveOpen = 0; moveSeg = null;
    }
    for (var i = 0; i < plane.segs.length; i++) {
      var s = plane.segs[i];
      var isRoof = !!ROOF_ROLES[s.role];
      // A travel, a section change or a stroke outside this region all break the
      // interval: what is reported must be one continuous span of THIS roof.
      var disconnected = !previous || previous.path !== s.path ||
        Math.abs(previous.x1 - s.x0) > 1e-6 || Math.abs(previous.y1 - s.y0) > 1e-6;
      previous = s;
      if (!isRoof || s.section !== curSection || disconnected) {
        flush();
        curSection = s.section;
        if (!isRoof) continue;
      } else if (moveOpen > 0) {
        // New commanded move: close out the previous move's own length before
        // continuing an interval that runs across the junction.
        if (moveOpen > best.segMax && moveSeg) { best.segMax = moveOpen; best.segSeg = moveSeg; }
        moveOpen = 0; moveSeg = null;
      }
      var n = Math.max(1, Math.ceil(s.len / (cell * 0.5)));
      var dx = s.x1 - s.x0, dy = s.y1 - s.y0;
      var step = s.len / n;
      for (var k = 0; k < n; k++) {
        var t = (k + 0.5) / n, px = s.x0 + dx * t, py = s.y0 + dy * t;
        if (!inRegion(px, py) || backed(px, py)) { flush(); continue; }
        if (!open) { open = true; openSeg = { line: s.line, x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1 }; }
        if (!moveSeg) moveSeg = { line: s.line, x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1 };
        openLen += step; moveOpen += step; best.total += step;
        if (openLen > best.max && openSeg) { best.max = openLen; best.seg = openSeg; }
      }
    }
    flush();
    return best;
  };

  // ---------------------------------------------------------------------------
  // Finding assembly
  // ---------------------------------------------------------------------------

  function round(v, n) {
    if (v === null || v === undefined) return null;
    var p = Math.pow(10, n === undefined ? 3 : n);
    return Math.round(v * p) / p;
  }

  function roleSummary(plane) {
    var out = {};
    Object.keys(plane.roles).forEach(function (k) {
      out[k] = { label: plane.roles[k].label, count: plane.roles[k].count, lenMm: round(plane.roles[k].len, 1), lines: plane.roles[k].lines };
    });
    return out;
  }

  function bboxOf(mask) {
    var cols = mask.cols, rows = mask.rows, d = mask.data;
    var x0 = -1, y0 = -1, x1 = -1, y1 = -1;
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      if (!d[y * cols + x]) continue;
      if (x0 < 0 || x < x0) x0 = x;
      if (x1 < 0 || x > x1) x1 = x;
      if (y0 < 0 || y < y0) y0 = y;
      if (y1 < 0 || y > y1) y1 = y;
    }
    if (x0 < 0) return null;
    return {
      x0: round(mask.x0 + x0 * mask.cell, 3), x1: round(mask.x0 + (x1 + 1) * mask.cell, 3),
      y0: round(mask.y0 + y0 * mask.cell, 3), y1: round(mask.y0 + (y1 + 1) * mask.cell, 3)
    };
  }

  /*
   * Fraction of the smaller of two masks that they share. The masks may have
   * different origins and sizes — each region is sized to its own plane — so the
   * comparison maps coordinates rather than assuming a shared grid.
   */
  function overlapFraction(a, b) {
    var cell = a.cell;
    var ad = a.data, bd = b.data;
    var na = maskCount(a), nb = maskCount(b);
    var min = Math.min(na, nb);
    if (!min) return 0;
    var ox = a.x0 - b.x0, oy = a.y0 - b.y0;
    var hit = 0;
    for (var ry = 0; ry < a.rows; ry++) {
      var brY = Math.floor((ry * cell + oy) / cell);
      if (brY < 0 || brY >= b.rows) continue;
      var rbase = ry * a.cols, bbase = brY * b.cols;
      for (var cx = 0; cx < a.cols; cx++) {
        if (!ad[rbase + cx]) continue;
        var bx = Math.floor((cx * cell + ox) / cell);
        if (bx >= 0 && bx < b.cols && bd[bbase + bx]) hit++;
      }
    }
    return hit / min;
  }

  /*
   * Two defects are the same void when they share at least one missing physical
   * plane and their common missing regions are substantially the same area.
   * Without the Z test, two unrelated holes on the same roof would merge; without
   * the area test, a roof defect and the intermediate-skin defect one plane above
   * it would be reported twice for one cavity.
   */
  function sameVoid(analyser, existing, d) {
    var zs = existing._missingZs;
    var shared = false;
    for (var i = 0; i < d.walk.rows.length; i++) {
      var r = d.walk.rows[i];
      if (r.all >= analyser.opts.maxCoverage) continue;
      if (zs.indexOf(r.z) >= 0) { shared = true; break; }
    }
    if (!shared) return false;
    return overlapFraction(existing._common, d.common) >= 0.5;
  }

  /*
   * Merge a second observation into an existing defect: the void stays one
   * finding, and the newly affected roof layer is recorded against it. This is
   * what keeps a cavity from generating one alarm per raster stroke and one more
   * per roof that happens to span it.
   */
  function mergeObservation(f, d) {
    var roof = {
      layer_id: d.cand.plane.layerId, z_mm: round(d.cand.plane.z, 4),
      role: d.topRole, label: regionLabel(d.cand),
      line: d.cand.plane.firstLine, area_mm2: round(d.cand.area, 1)
    };
    if (!f.affected_roofs.some(function (r) { return r.z_mm === roof.z_mm; })) {
      f.affected_roofs.push(roof);
    }
    // Keep the strongest evidence: the largest common missing area seen.
    if (maskCount(d.common) > maskCount(f._common)) {
      f._common = d.common;
      f.region.missing_area_mm2 = round(d.area, 1);
      f.region.bbox = bboxOf(d.common);
    }
    // A foundation observed on any pass is still a foundation observed.
    if (!f.foundation && (d.run.foundation || d.walk.foundation)) {
      var w = d.run.foundation || d.walk.foundation;
      f.foundation = {
        layer_id: w.layerId, z_mm: round(w.z, 4), line: w.line,
        role: w.plane.roles.TOP ? 'top' : (w.plane.roles.BRIDGE ? 'bridge_solid' : 'dense_fill'),
        roles_present: w.roles,
        overlap: round(w.overlap, 5),
        dense_overlap: round(w.denseOverlap, 5)
      };
    }
    // Widen the missing-plane set, keeping it ordered and de-duplicated.
    d.run.rows.forEach(function (r) {
      if (f._missingZs.indexOf(r.z) < 0) {
        f._missingZs.push(r.z);
        f.missing_planes.push(missingRow(r));
      }
    });
    f._missingZs.sort(function (p, q) { return q - p; });
    f.missing_planes.sort(function (p, q) { return q.z_mm - p.z_mm; });
    f.missing_plane_count = f.missing_planes.length;
    f.highest_missing_z_mm = f.missing_planes[0].z_mm;
    f.run_count = countRuns(f._missingZs);
    /*
     * The headline vertical geometry always describes the *primary* observation —
     * the roof and foundation this finding was created from. A merged observation
     * is a different roof over the same cavity, and recomputing the gap from its
     * foundation would produce a number that belongs to neither roof (and, when
     * the merged roof sits higher, a negative gap).
     */
    if (d.run.rows.length >= 2) f.severity = 'error';
  }

  /*
   * Number of *consecutive* missing runs. The step is inferred from the missing
   * Z set itself (the smallest positive gap between them) rather than assumed to
   * be 0.20 mm, because adaptive layer heights and combined infill make a fixed
   * step wrong.
   */
  function countRuns(zs) {
    var sorted = zs.slice().sort(function (a, b) { return b - a; });
    var step = null;
    for (var i = 1; i < sorted.length; i++) {
      var g = sorted[i - 1] - sorted[i];
      if (g > 0.01 && (step === null || g < step)) step = g;
    }
    if (step === null) step = 0.2;
    var runs = 0, prev = null;
    for (var j = 0; j < sorted.length; j++) {
      if (prev === null || Math.abs((prev - sorted[j]) - step) > 0.05) runs++;
      prev = sorted[j];
    }
    return runs;
  }

  function roofLabel(plane) {
    /*
     * A plane can carry more than one top section (Rocket prints the intermediate
     * and the topmost skin of different islands inside one layer). The label that
     * names the *topmost* skin is the one that identifies the roof, so it wins.
     */
    if (plane.roofLabels) {
      if (plane.roofLabels['Top most solid infill']) return 'Top most solid infill';
      if (plane.roofLabels['Top surface']) return 'Top surface';
      var keys = Object.keys(plane.roofLabels);
      if (keys.length) return keys[0];
    }
    if (plane.roles.TOP) return plane.roles.TOP.label;
    if (plane.roles.BRIDGE) return plane.roles.BRIDGE.label;
    return Object.keys(plane.roles).map(function (k) { return plane.roles[k].label; })[0] || null;
  }

  function missingRow(r) {
    return {
      layer_id: r.layerId, z_mm: round(r.z, 4), line: r.line,
      all_material_coverage: round(r.all, 5), dense_coverage: round(r.dense, 5),
      missing_area_mm2: round(r.missingArea, 1), roles_present: r.roles
    };
  }

  /*
   * The label of the section that actually deposited *this* region. A plane can
   * carry several top sections — Rocket prints the intermediate skin of one island
   * and the topmost skin of another inside a single layer — so the plane-level
   * label would attribute the wrong role to the wrong island. Counting the labels
   * of the roof-role beads inside the region reports what was laid here.
   */
  function regionLabel(cand) {
    var plane = cand.plane, region = cand.region, cell = cand.region.cell;
    var counts = {};
    for (var i = 0; i < plane.segs.length; i++) {
      var s = plane.segs[i];
      if (!ROOF_ROLES[s.role]) continue;
      var mx = (s.x0 + s.x1) / 2, my = (s.y0 + s.y1) / 2;
      var cx = Math.floor((mx - region.x0) / cell), cy = Math.floor((my - region.y0) / cell);
      if (cx < 0 || cx >= region.cols || cy < 0 || cy >= region.rows) continue;
      if (!region.data[cy * region.cols + cx]) continue;
      counts[s.label] = (counts[s.label] || 0) + 1;
    }
    var best = null, n = 0;
    Object.keys(counts).forEach(function (k) { if (counts[k] > n) { n = counts[k]; best = k; } });
    return best || roofLabel(plane);
  }

  function buildFinding(id, d, o, analyser) {
    var plane = d.cand.plane, w = d.walk, run = d.run;
    var bh = plane.beadHeight || 0.2;
    /*
     * The foundation reported is the one *under this missing run*, not merely the
     * first strong plane encountered. For a buried void those differ: the roof
     * rests on a sound layer, and that layer is itself spanning the cavity.
     */
    var found = run.foundation || w.foundation;
    var spanAbove = run.aboveZ === null ? plane.z : run.aboveZ;
    var f = {
      finding_id: 'local-top-gap-' + id,
      type: 'LOCAL_TOP_STACK_GAP',
      severity: run.rows.length >= 2 ? 'error' : 'warning',
      geometry_confidence: d.area >= 4 * o.minMissingArea && found ? 'high' : 'medium',
      cause_confidence: 'observed_omission_in_export',
      file: null,
      roof: {
        layer_id: plane.layerId, z_mm: round(plane.z, 4), bead_height_mm: round(bh, 4),
        role: d.topRole, label: regionLabel(d.cand), line: plane.firstRoofLine || plane.firstLine,
        macrolayer_id: plane.macroId
      },
      region: {
        area_mm2: round(d.cand.area, 1),
        missing_area_mm2: round(d.area, 1),
        bbox: bboxOf(d.common),
        roof_footprint_bbox: bboxOf(candRegion(d))
      },
      representative_line: plane.firstRoofLine || plane.firstLine,
      missing_planes: run.rows.map(missingRow),
      missing_plane_count: run.rows.length,
      highest_missing_z_mm: round(run.rows[0].z, 4),
      run_count: 1,
      /*
       * Two different quantities, deliberately kept apart. The deposition-plane
       * separation is roof Z minus foundation Z; the empty vertical interval
       * excludes the roof bead's own height, so it is the air that is really
       * missing. For a 0.20 mm bead over a 0.80 mm separation, the gap is 0.60 mm.
       */
      deposition_plane_separation_mm: found ? round(spanAbove - found.z, 4) : null,
      empty_gap_mm: found ? round(spanAbove - spanBeadHeight(d) - found.z, 4) : null,
      foundation: null,
      stack: w.rows.map(function (r) {
        return {
          depth: r.depth, layer_id: r.layerId, z_mm: round(r.z, 4), line: r.line,
          all_material_coverage: round(r.all, 5), dense_coverage: round(r.dense, 5),
          roles_present: r.roles
        };
      }),
      support_planes_skipped: w.supportSeen.map(function (s) {
        return { layer_id: s.layerId, z_mm: round(s.z, 4), line: s.line };
      }),
      affected_roofs: [{
        layer_id: plane.layerId, z_mm: round(plane.z, 4), role: d.topRole,
        label: regionLabel(d.cand), line: plane.firstRoofLine || plane.firstLine, area_mm2: round(d.cand.area, 1)
      }],
      unsupported_span: d.span ? {
        length_mm: round(d.span.max, 2),
        total_open_length_mm: round(d.span.total, 2),
        longest_single_move_mm: round(d.span.segMax, 2),
        longest_single_move_line: d.span.segSeg ? d.span.segSeg.line : null,
        segment_line: d.span.seg ? d.span.seg.line : null,
        segment_from_xy: d.span.seg ? [round(d.span.seg.x0, 3), round(d.span.seg.y0, 3)] : null,
        segment_to_xy: d.span.seg ? [round(d.span.seg.x1, 3), round(d.span.seg.y1, 3)] : null,
        note: 'longest continuous interval of this roof with no backing on the plane directly beneath; geometric lack of support only, not measured sag and not a predicted failure'
      } : null,
      expected_top_shell_count: null,
      expected_top_shell_source: 'no profile or project setting in this export states the required top-shell thickness',
      thresholds: {
        min_region_area_mm2: o.minRegionArea, min_missing_area_mm2: o.minMissingArea,
        max_coverage: o.maxCoverage, min_missing_planes: o.minMissingPlanes,
        foundation_overlap: o.foundationOverlap, min_void_width_mm: o.minVoidWidthMm,
        cell_mm: o.cell, close_mm: o.closeMm
      },
      _common: d.common,
      _missingZs: run.rows.map(function (r) { return r.z; })
    };
    if (found) {
      f.foundation = {
        layer_id: found.layerId, z_mm: round(found.z, 4), line: found.line,
        role: found.plane.roles.TOP ? 'top' : (found.plane.roles.BRIDGE ? 'bridge_solid' : 'dense_fill'),
        roles_present: found.roles,
        overlap: round(found.overlap, 5),
        dense_overlap: round(found.denseOverlap, 5)
      };
    }
    return f;
  }

  function candRegion(d) { return d.cand.region; }

  /*
   * The height of the bead that actually spans the void. For a run that starts at
   * the roof itself that is the roof bead; for a run further down it is the bead of
   * the plane directly above the run. Using the roof bead for a deeper run would
   * report a gap that no single bead is bridging.
   */
  function spanBeadHeight(d) {
    var run = d.run;
    if (run.aboveZ === null || Math.abs(run.aboveZ - d.cand.plane.z) < 1e-6) {
      return d.cand.plane.beadHeight || 0.2;
    }
    for (var i = 0; i < d.walk.rows.length; i++) {
      if (Math.abs(d.walk.rows[i].z - run.aboveZ) < 1e-6) {
        return d.walk.rows[i].plane.beadHeight || 0.2;
      }
    }
    return d.cand.plane.beadHeight || 0.2;
  }

  function buildSpanFinding(id, s, o, analyser) {
    var plane = s.spanPlane || s.cand.plane;
    return {
      finding_id: 'unsupported-top-' + id,
      type: 'UNSUPPORTED_TOP_DEPOSITION',
      severity: s.span.max >= 2 * o.minSpanMm ? 'warning' : 'info',
      geometry_confidence: 'high',
      cause_confidence: 'geometric_lack_of_backing_only',
      roof: {
        layer_id: plane.layerId, z_mm: round(plane.z, 4),
        bead_height_mm: round(plane.beadHeight || 0.2, 4),
        role: s.topRole, label: roofLabel(plane), line: plane.firstLine
      },
      region: { area_mm2: round(s.cand.area, 1), missing_area_mm2: round(s.area, 1), bbox: bboxOf(s.common) },
      missing_planes: [missingRow(s.run.rows[0])],
      unsupported_span: {
        length_mm: round(s.span.max, 2),
        total_open_length_mm: round(s.span.total, 2),
        longest_single_move_mm: round(s.span.segMax, 2),
        longest_single_move_line: s.span.segSeg ? s.span.segSeg.line : null,
        note: 'geometric lack of backing along the commanded path; not a measured sag and not a predicted failure',
        segment_line: s.span.seg ? s.span.seg.line : null
      },
      affected_roofs: [{ layer_id: plane.layerId, z_mm: round(plane.z, 4), role: s.topRole }],
      thresholds: { min_span_mm: o.minSpanMm, max_coverage: o.maxCoverage, cell_mm: o.cell }
    };
  }

  /*
   * Global layer gap: an expected model deposition plane absent across the whole
   * part. This is a different claim from a local stack gap and must not be
   * confused with one — and it must not fire on the ordinary reasons a Z step is
   * uneven: support sublayers at fractional heights, adaptive layer heights,
   * combined infill passes, and travel Z-hops.
   *
   * The test is therefore on the *reported layer sequence*, not on Z spacing: a
   * layer index that appears nowhere in the file is a skipped model plane. Z
   * spacing is reported alongside as corroboration only, because a file is free to
   * number its layers however the slicer likes.
   */
  RoofStack.prototype.globalGaps = function () {
    var present = {}, maxId = 0, minId = 1e9;
    Object.keys(this.layerRecords).forEach(function (id) {
      var n = Number(id);
      present[n] = this.layerRecords[id];
      if (n > maxId) maxId = n;
      if (n < minId) minId = n;
    }, this);
    if (!maxId) return [];
    var missing = [];
    for (var n = minId; n <= maxId; n++) if (!present[n]) missing.push(n);
    if (!missing.length) return [];
    // Runs of consecutive missing indices.
    var runs = [], cur = null;
    missing.forEach(function (n) {
      if (cur && n === cur.last + 1) { cur.last = n; cur.count++; }
      else { cur = { first: n, last: n, count: 1 }; runs.push(cur); }
    });
    return runs.map(function (r) {
      var below = null, above = null;
      for (var n = r.first - 1; n >= minId; n--) if (present[n]) { below = present[n]; break; }
      for (var m = r.last + 1; m <= maxId; m++) if (present[m]) { above = present[m]; break; }
      return {
        type: 'GLOBAL_LAYER_GAP',
        severity: r.count >= 2 ? 'error' : 'warning',
        geometry_confidence: 'high',
        cause_confidence: 'observed_in_export_only',
        layer_ids: (function () { var a = []; for (var n = r.first; n <= r.last; n++) a.push(n); return a; })(),
        layer_count: r.count,
        z_below_mm: below ? round(below.z, 4) : null,
        z_above_mm: above ? round(above.z, 4) : null,
        expected_z_step_mm: (below && above) ? round((above.z - below.z) / (r.count + 1), 4) : null,
        note: 'an entire model layer index is absent from the file. This is a global observation and is distinct from a local stack gap; variable layer heights and support sublayers are accounted for by testing the layer sequence rather than Z spacing.'
      };
    });
  };

  /*
   * The bead that spans a void is the one directly above it: the roof itself when
   * the run starts at the first depth below the roof, otherwise the plane above
   * the run. Measuring the roof for a deeper run would attribute a span to a skin
   * that is properly backed.
   */
  RoofStack.prototype.spanningPlane = function (cand, run) {
    if (run.aboveZ === null || Math.abs(run.aboveZ - cand.plane.z) < 1e-6) return cand.plane;
    for (var i = 0; i < this.planes.length; i++) {
      if (Math.abs(this.planes[i].z - run.aboveZ) < 1e-6) return this.planes[i];
    }
    return cand.plane;
  };

  // Count locally contiguous top skins, including the roof being inspected.
  // A buried gap is not a thickness shortfall if the requested skins above it
  // are already present. Wall sublayers within a skin do not consume a skin.
  RoofStack.prototype.topShellCount = function (plane, region, required) {
    var count = 0, bottom = plane.z;
    for (var i = plane.index; i >= 0 && count < required; i--) {
      var q = this.planes[i];
      if (!q.mask || q.supportOnly) continue;
      if (count > 0 && q.z < bottom - 1e-6) break;
      var dense = coverageOf(region, { mask: q.denseMask });
      if (q.roles.TOP && dense >= this.opts.foundationOverlap) {
        count++;
        bottom = q.z - (q.beadHeight || 0.2);
      } else if (q.z <= bottom + 1e-6) break;
    }
    return count;
  };

  RoofStack.prototype.analyse = function () {
    var self = this, o = this.opts;
    this.buildMasks();
    var cands = this.candidates();
    var defects = [];
    var spans = [];
    var bridges = [];

    cands.forEach(function (cand) {
      var plane = cand.plane;
      var walk = self.walkDown(cand);
      var topRole = plane.roles.TOP ? 'TOP' : (plane.roles.BRIDGE ? 'BRIDGE' : Object.keys(plane.roles)[0]);

      // A declared bridge over open air is contextual information, not by itself
      // a missing-top defect: the slicer said it was bridging.
      if (plane.roles.BRIDGE && walk.rows.length && walk.rows[0].all < o.maxCoverage) {
        bridges.push({
          finding_id: 'explicit-bridge-' + (bridges.length + 1),
          type: 'EXPLICIT_BRIDGE_OVER_VOID',
          severity: 'info',
          geometry_confidence: 'high',
          cause_confidence: 'declared_by_slicer',
          roof: {
            layer_id: plane.layerId, z_mm: round(plane.z, 4),
            bead_height_mm: round(plane.beadHeight || 0.2, 4),
            role: 'BRIDGE', label: roofLabel(plane), line: plane.firstLine
          },
          region: { area_mm2: round(cand.area, 1), bbox: bboxOf(cand.region) },
          coverage_below: round(walk.rows[0].all, 5),
          note: 'the slicer labelled this geometry a bridge, so an unsupported first span is expected. A bridge label explains the span; it does not excuse a stack gap above the foundation, and it is not by itself a missing-top defect.'
        });
      }

      walk.runs.forEach(function (run) {
        var m = cand.region;
        /*
         * `mg` is the same common-void mask built from the *grouped* region
         * instead of the clipped one. The split is the one the method requires:
         * gates read the grouped region, measurements read the clipped one. At a
         * fine grid a hatched skin's raster has hairline gaps, so the clipped
         * region is a fragment of the skin rather than the skin, and a width
         * measured on it reports the raster's fragmentation instead of the void's
         * shape. Coverage and area stay on `m`, which is real material only.
         */
        var mg = cand.grown;
        run.rows.forEach(function (r) {
          m = intersectMasks(m, r.missing);
          mg = intersectWorld(mg, r.missing);
        });
        var area = maskCount(m) * o.cell * o.cell;
        if (area < o.minMissingArea) return;
        /*
         * A stack gap is defined by a foundation *below the void*. When the bounded
         * search never reaches one — a deep region over sparse infill, or a stack
         * thicker than the diagnostic window — the observation is "this skin spans
         * a long way with nothing solid under it", which is a span, not a missing
         * interior skin. Calling it a stack gap would assert a defect the file does
         * not actually demonstrate: top skin over deliberately sparse infill is
         * designed geometry, and the two look identical from coverage alone.
         */
        var hasFoundation = !!run.foundation;
        /*
         * A void narrower than a few bead widths is a channel, not a missing
         * sheet. Between deliberate strands — carbon-fibre reinforcement on the
         * Benchy samples, gap-fill between perimeters — the commanded footprint
         * legitimately has 0.8 mm gaps that are empty on every plane, and area
         * alone cannot tell that apart from an omitted skin: those channels cover
         * 7-11 mm^2, above the area floor. The inscribed width can, and the
         * reference defects are nowhere near the boundary (4.0-21.2 mm across).
         * Rejected cases are counted, not dropped silently.
         */
        var sp0 = samplePoint(mg, o.cell);
        var voidWidth = sp0 ? sp0[2] * 2 : 0;
        if (voidWidth < o.minVoidWidthMm) {
          self._narrowVoids = (self._narrowVoids || 0) + 1;
          return;
        }
        if (run.rows.length < o.minMissingPlanes || !hasFoundation) {
          /*
           * Without a foundation under the void this is top skin over deliberately
           * sparse infill, or a stack deeper than the diagnostic window — designed
           * geometry, not a missing interior skin. The C06 history is the warning:
           * a naive unsupported-run probe on this corpus produced 3,049 findings at
           * 4.5% agreement and then 451 on one file, all of them top skin over
           * infill. So the condition is counted once per file as a note rather than
           * emitted as a finding per region.
           */
          if (!hasFoundation) {
            self._noFoundationRuns = (self._noFoundationRuns || 0) + 1;
            return;
          }
          // One missing plane over a real foundation is not a stack gap, but it
          // must not be invisible: it surfaces as a span, evaluated independently
          // of the two-plane rule.
          var span = self.unsupportedSpans(self.spanningPlane(cand, run), cand.region, run.rows[0].plane);
          if (span.max >= o.minSpanMm) {
            spans.push({
              cand: cand, walk: walk, run: run, span: span, area: area, common: m,
              topRole: topRole, spanPlane: self.spanningPlane(cand, run)
            });
          }
          return;
        }
        defects.push({ cand: cand, walk: walk, run: run, area: area, common: m, topRole: topRole });
      });
    });

    // Largest void first, so a merged finding keeps its strongest instance.
    defects.sort(function (a, b) { return b.area - a.area; });

    var findings = [];
    defects.forEach(function (d) {
      /*
       * Unsupported-interval evidence for a stack gap: the longest continuous run
       * of this roof's own beads with nothing on the plane directly beneath. The
       * backing plane is the first missing plane of the run, so the measurement
       * answers "how far does this skin span with no preceding-plane backing",
       * which is the quantity a reader needs to judge whether the gap is inside a
       * width/rounding tolerance or not.
       */
      d.spanPlane = self.spanningPlane(d.cand, d.run);
      d.span = self.unsupportedSpans(d.spanPlane, d.cand.region, d.run.rows[0].plane);
      var f = buildFinding(findings.length + 1, d, o, self);
      for (var i = 0; i < findings.length; i++) {
        if (sameVoid(self, findings[i], d)) {
          mergeObservation(findings[i], d);
          return;
        }
      }
      findings.push(f);
    });

    spans.forEach(function (s) {
      /*
       * Spans are deduplicated exactly like stack gaps. The same cavity is seen
       * from every roof that happens to span it, and one alarm per roof per
       * raster pass is the "thousands of independent alarms" failure mode. A span
       * merges into an existing one when it is the same missing plane and the
       * same hole; the record keeps the longest interval and every roof involved.
       */
      var merged = null;
      for (var si = 0; si < findings.length; si++) {
        var ex = findings[si];
        if (ex.type !== 'UNSUPPORTED_TOP_DEPOSITION') continue;
        if (ex._missingZs.indexOf(s.run.rows[0].z) < 0) continue;
        if (overlapFraction(ex._common, s.common) < 0.5) continue;
        merged = ex; break;
      }
      if (merged) {
        var rf = { layer_id: s.cand.plane.layerId, z_mm: round(s.cand.plane.z, 4), role: s.topRole };
        if (!merged.affected_roofs.some(function (r) { return r.z_mm === rf.z_mm; })) merged.affected_roofs.push(rf);
        if (s.span.max > merged.unsupported_span.length_mm) {
          merged.unsupported_span.length_mm = round(s.span.max, 2);
          merged.unsupported_span.total_open_length_mm = round(s.span.total, 2);
          merged.unsupported_span.longest_single_move_mm = round(s.span.segMax, 2);
          merged.unsupported_span.longest_single_move_line = s.span.segSeg ? s.span.segSeg.line : null;
          merged.unsupported_span.segment_line = s.span.seg ? s.span.seg.line : null;
        }
        if (maskCount(s.common) > maskCount(merged._common)) {
          merged._common = s.common;
          merged.region.missing_area_mm2 = round(s.area, 1);
          merged.region.bbox = bboxOf(s.common);
        }
        return;
      }
      var built = buildSpanFinding(findings.length + 1, s, o, self);
      built._common = s.common;
      built._missingZs = [s.run.rows[0].z];
      findings.push(built);
    });

    /*
     * Attribution of roofs that *rest on* a defective roof. A topmost skin sitting
     * on an intermediate skin that itself spans a void is at the top of a stack
     * with a hole in it, even though its own immediate contact is sound — that is
     * the buried-void case. It is recorded as an affected roof of the same defect
     * rather than as a second defect.
     */
    findings.forEach(function (f) {
      var roofZ = f.roof.z_mm;
      if (!f._common || f.type !== 'LOCAL_TOP_STACK_GAP') return;
      cands.forEach(function (cand) {
        if (cand.plane.z <= roofZ) return;
        if (!cand.plane.roof) return;
        var already = f.affected_roofs.some(function (r) { return r.z_mm === round(cand.plane.z, 4); });
        if (already) return;
        var w = self.walkDown(cand);
        if (!w.contact || round(w.contact.z, 4) !== roofZ) return;
        if (overlapFraction(f._common, cand.region) < 0.5) return;
        f.affected_roofs.push({
          layer_id: cand.plane.layerId, z_mm: round(cand.plane.z, 4),
          role: cand.plane.roles.TOP ? 'TOP' : 'BRIDGE',
          label: roofLabel(cand.plane), line: cand.plane.firstLine,
          area_mm2: round(cand.area, 1),
          rests_on_roof_z_mm: roofZ
        });
      });
      f.affected_roofs.sort(function (a, b) { return b.z_mm - a.z_mm; });
    });

    findings.forEach(function (f) {
      if (o.expectTop > 0 && f.type === 'LOCAL_TOP_STACK_GAP') {
        var counts = [];
        f.affected_roofs.forEach(function (roof) {
          var p = self.planesByZ.get(roof.z_mm);
          if (!p || !p.roles.TOP) return;
          var count = self.topShellCount(p, f._common, o.expectTop);
          roof.observed_top_shell_count = count;
          counts.push(count);
        });
        f.expected_top_shell_count = o.expectTop;
        f.expected_top_shell_source = 'user configuration --expect-top';
        // Affected roofs are ordered highest first. Judge the completed stack
        // from its highest roof, not an earlier intermediate pass.
        f.observed_top_shell_count = counts.length ? counts[0] : null;
        if (counts.length && f.observed_top_shell_count < o.expectTop) {
          f.type = 'TOP_SHELL_THICKNESS_SHORTFALL';
        }
      }
      var sp = f._common ? samplePoint(f._common, o.cell) : null;
      if (sp) {
        f.region.sample_xy_mm = [round(sp[0], 3), round(sp[1], 3)];
        f.region.sample_inscribed_radius_mm = round(sp[2], 2);
        f._sampleXY = sp;
      }
      // Clearance from the sample point to the nearest bead on each missing
      // plane, measured against that plane's own all-material footprint. The
      // reported value is a floor: "at least N mm from any deposited bead".
      if (f._sampleXY && f.missing_planes) {
        f.missing_planes.forEach(function (mp) {
          var plane = null;
          for (var k = 0; k < self.planes.length; k++) {
            if (round(self.planes[k].z, 4) === mp.z_mm) { plane = self.planes[k]; break; }
          }
          if (!plane || !plane.mask) { mp.bead_edge_clearance_mm = null; return; }
          var cx = Math.floor((f._sampleXY[0] - plane.mask.x0) / o.cell);
          var cy = Math.floor((f._sampleXY[1] - plane.mask.y0) / o.cell);
          mp.bead_edge_clearance_mm = round(clearanceAt(plane.mask, cx, cy), 2);
        });
      }
      delete f._common; delete f._sampleXY; delete f._missingZs;
    });

    return {
      findings: findings.concat(bridges, self.globalGaps()),
      bridges: bridges,
      candidates: cands.length,
      candidateList: cands,
      planes: this.planes.length,
      modelPlanes: this.planes.filter(function (p) { return !p.supportOnly; }).length,
      supportPlanes: this.planes.filter(function (p) { return p.supportOnly; }).length,
      // Rejections are counted and reported, never dropped in silence: a reader
      // must be able to see what the gates turned away and decide otherwise.
      rejected: {
        narrow_voids: this._narrowVoids || 0,
        no_foundation_runs: this._noFoundationRuns || 0
      },
      notes: this.notes,
      state: this.state,
      opts: o
    };
  };

  root.FS3 = root.FS3 || {};
  root.FS3.RoofStack = RoofStack;
  root.FS3.RoofDefaults = DEFAULTS;
  root.FS3.ROLE_CLASS = ROLE_CLASS;
})(typeof self !== 'undefined' ? self : globalThis);
