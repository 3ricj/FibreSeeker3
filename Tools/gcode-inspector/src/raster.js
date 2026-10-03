/*
 * Layer-coverage raster.
 *
 * Grids over the build plate, all updated from extrusion moves:
 *   cur    — the portion of the *current* layer deposited so far
 *   below  — cumulative footprint of every completed layer
 *   wall   — cells laid down by a perimeter bead this layer
 *   last   — index of the layer that last deposited into each cell (0 = never)
 *
 * `cur` + `below` answer the travel-classification question the way issue #1
 * poses it: "all completed layers and the portion of the current layer already
 * printed".
 *
 * `last` answers the bridge question for issue #6. Support is a function of
 * *age*: a column is a substrate when plastic was deposited in it within the
 * last few layers, and a void otherwise. `supported()` reads this grid, and it
 * deliberately ignores `last == current layer`, because the rest of the current
 * layer is not support either — otherwise a bridge would support itself after
 * its first segment.
 *
 * `enclosedVoids()` answers issue #3: holes fully surrounded by deposited
 * material inside one layer are splits/voids the beads were supposed to close.
 *
 * Stamping is a distance test, not a radius in cells: a cell is covered when
 * its centre lies within width/2 of the bead path. That keeps the footprint
 * physically correct at any grid resolution, which matters because the whole
 * point of the coverage model is to decide what is *not* a void.
 */
(function (root) {
  'use strict';

  var MAX_VOID_MM = 6;      // wider than this is designed geometry, not a bead gap
  var MAX_GAP_MM = 4;       // widest perimeter separation worth reporting
  var GAP_BIN = 0.25;       // width histogram bin size (mm)
  var GAP_BINS = 20;        // width histogram length

  function Raster(areaX, areaY, cell) {
    this.cell = cell || 0.2;
    this.areaX = areaX || 305;
    this.areaY = areaY || 305;
    this.nx = Math.ceil(this.areaX / this.cell) + 2;
    this.ny = Math.ceil(this.areaY / this.cell) + 2;
    var n = this.nx * this.ny;
    this.below = new Uint8Array(n);
    this.cur = new Uint8Array(n);
    this.wall = new Uint8Array(n);
    // Layer index at which each cell was last deposited (0 = never). Storing the
    // index instead of a bitmap means the support window is a subtraction, so a
    // multi-layer probe costs nothing and needs no per-layer clearing pass.
    this.last = new Uint16Array(n);
    this.layerIndex = 1;
    this.mark = new Uint8Array(n);      // flood-fill scratch: 0 open, 1 exterior, 2 member
    this.stack = new Int32Array(n);
    this.comp = new Int32Array(n);
    this.z = 0;
    this.bb = null;
    this.maxVoidCells = Math.max(1, Math.round(MAX_VOID_MM / this.cell));
  }

  Raster.prototype.setZ = function (z) { this.z = z; };

  Raster.prototype._cell = function (x, y) {
    var cx = Math.floor(x / this.cell) + 1;
    var cy = Math.floor(y / this.cell) + 1;
    if (cx < 0) cx = 0; else if (cx >= this.nx) cx = this.nx - 1;
    if (cy < 0) cy = 0; else if (cy >= this.ny) cy = this.ny - 1;
    this._cx = cx; this._cy = cy;
    return cy * this.nx + cx;
  };

  Raster.prototype._grow = function (cx, cy) {
    var bb = this.bb;
    if (!bb) this.bb = { x0: cx, x1: cx, y0: cy, y1: cy };
    else {
      if (cx < bb.x0) bb.x0 = cx;
      if (cx > bb.x1) bb.x1 = cx;
      if (cy < bb.y0) bb.y0 = cy;
      if (cy > bb.y1) bb.y1 = cy;
    }
  };

  /*
   * Stamp a deposition segment of the given line width into the current-layer
   * bitmap. `isWall` additionally records the cells as perimeter material,
   * which is what issue #3 needs: a void is only a *perimeter* gap if a bead
   * bounds it.
   */
  Raster.prototype.stamp = function (x0, y0, x1, y1, width, isWall) {
    var dx = x1 - x0, dy = y1 - y0;
    var len = Math.sqrt(dx * dx + dy * dy);
    var cell = this.cell, cur = this.cur, wall = this.wall, nx = this.nx;
    var last = this.last, li = this.layerIndex;
    var half = width * 0.5;
    var r = Math.ceil(half / cell);
    var n = Math.max(1, Math.ceil(len / (cell * 0.5)));
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var px = x0 + dx * t, py = y0 + dy * t;
      this._cell(px, py);
      var cx = this._cx, cy = this._cy;
      this._grow(cx, cy);
      for (var oy = -r; oy <= r; oy++) {
        var yy = cy + oy;
        if (yy < 0 || yy >= this.ny) continue;
        var wy = (yy - 0.5) * cell - py;
        var base = yy * nx + cx;
        for (var ox = -r; ox <= r; ox++) {
          var xx = cx + ox;
          if (xx < 0 || xx >= this.nx) continue;
          var wx = (xx - 0.5) * cell - px;
          if (wx * wx + wy * wy > half * half) continue;
          var idx = base + ox;
          cur[idx] = 1;
          last[idx] = li;
          if (isWall) wall[idx] = 1;
        }
      }
    }
  };

  // Any deposited material within one cell of the point, from either grid.
  Raster.prototype._probe = function (x, y, a, b) {
    this._cell(x, y);
    var cx = this._cx, cy = this._cy, nx = this.nx;
    for (var oy = -1; oy <= 1; oy++) {
      var yy = cy + oy;
      if (yy < 0 || yy >= this.ny) continue;
      var base = yy * nx + cx;
      for (var ox = -1; ox <= 1; ox++) {
        var xx = cx + ox;
        if (xx < 0 || xx >= this.nx) continue;
        var i = base + ox;
        if (a[i] || b[i]) return true;
      }
    }
    return false;
  };

  Raster.prototype.covered = function (x, y) {
    return this._probe(x, y, this.cur, this.below);
  };


  // Classify a travel path against the issue #1 model: 'solid' | 'void' | 'air'.
  Raster.prototype.classifyTravel = function (x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return 'solid';
    var n = Math.max(1, Math.ceil(len / 0.25));
    var covered = 0;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      if (this.covered(x0 + dx * t, y0 + dy * t)) covered++;
    }
    if (covered === n + 1) return 'solid';
    if (covered === 0) return 'air';
    return 'void';
  };

  /*
   * Issue #3: gaps enclosed by deposited material inside the finished layer.
   *
   * Flood-fill the empty space inward from the padded bounding box; empty cells
   * the flood never reaches are holes/splits inside the part. Each enclosed
   * component gets its inscribed width from a distance transform running from
   * its boundary inward — a 1-cell split measures one cell wide, a 7-cell hole
   * on a 0.2 mm grid measures 1.4 mm.
   *
   * Only components at least `widthThreshold` wide are counted. Two ceilings
   * keep this measuring the reported bug rather than the part's geometry:
   *   MAX_GAP_MM — a wider enclosed hole is a designed opening (the Benchy
   *   cabin, the mast channel), not a bead that failed to close;
   *   MAX_VOID_MM — hard cap on the component search itself.
   *
   * Returns { comps, wallComps, total, area, widest, widestWall, hist, skipped }.
   */
  Raster.prototype.enclosedVoids = function (widthThreshold) {
    var bb = this.bb;
    if (!bb) return this._emptyVoids();
    var thr = widthThreshold || 0;
    var pad = 2, nx = this.nx, ny = this.ny;
    var x0 = Math.max(0, bb.x0 - pad), x1 = Math.min(nx - 1, bb.x1 + pad);
    var y0 = Math.max(0, bb.y0 - pad), y1 = Math.min(ny - 1, bb.y1 + pad);
    var mark = this.mark, stack = this.stack, cur = this.cur, wall = this.wall;
    var comp = this.comp, dist = this.dist;
    var sp = 0, i, xx, yy;

    // Clear the working region, then seed the flood from its border.
    for (yy = y0; yy <= y1; yy++) {
      var row = yy * nx;
      for (xx = x0; xx <= x1; xx++) mark[row + xx] = 0;
    }
    for (xx = x0; xx <= x1; xx++) {
      if (!cur[y0 * nx + xx] && !mark[y0 * nx + xx]) { mark[y0 * nx + xx] = 1; stack[sp++] = y0 * nx + xx; }
      if (!cur[y1 * nx + xx] && !mark[y1 * nx + xx]) { mark[y1 * nx + xx] = 1; stack[sp++] = y1 * nx + xx; }
    }
    for (yy = y0; yy <= y1; yy++) {
      if (!cur[yy * nx + x0] && !mark[yy * nx + x0]) { mark[yy * nx + x0] = 1; stack[sp++] = yy * nx + x0; }
      if (!cur[yy * nx + x1] && !mark[yy * nx + x1]) { mark[yy * nx + x1] = 1; stack[sp++] = yy * nx + x1; }
    }
    while (sp) {
      var p = stack[--sp];
      var px = p % nx, py = (p - px) / nx;
      if (px > x0 && !cur[p - 1] && !mark[p - 1]) { mark[p - 1] = 1; stack[sp++] = p - 1; }
      if (px < x1 && !cur[p + 1] && !mark[p + 1]) { mark[p + 1] = 1; stack[sp++] = p + 1; }
      if (py > y0 && !cur[p - nx] && !mark[p - nx]) { mark[p - nx] = 1; stack[sp++] = p - nx; }
      if (py < y1 && !cur[p + nx] && !mark[p + nx]) { mark[p + nx] = 1; stack[sp++] = p + nx; }
    }

    // Empty cells the flood never reached are enclosed.
    var cell = this.cell, cellArea = cell * cell;
    var maxCells = this.maxVoidCells;
    var total = 0, comps = 0, wallComps = 0, widest = 0, widestWall = 0, skipped = 0;
    var hist = new Array(GAP_BINS).fill(0);
    for (yy = y0 + 1; yy <= y1 - 1; yy++) {
      for (xx = x0 + 1; xx <= x1 - 1; xx++) {
        i = yy * nx + xx;
        if (cur[i] || mark[i]) continue;

        var nc = 0, boundedByWall = false;
        var mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
        stack[sp++] = i; mark[i] = 2;
        while (sp) {
          var q = stack[--sp];
          comp[nc++] = q;
          var qx = q % nx, qy = (q - qx) / nx;
          if (qx < mnx) mnx = qx;
          if (qx > mxx) mxx = qx;
          if (qy < mny) mny = qy;
          if (qy > mxy) mxy = qy;
          var nbs0 = q - 1, nbs1 = q + 1, nbs2 = q - nx, nbs3 = q + nx;
          var nbs = [nbs0, nbs1, nbs2, nbs3];
          for (var k = 0; k < 4; k++) {
            var r = nbs[k];
            if (cur[r]) { if (wall[r]) boundedByWall = true; continue; }
            if (!mark[r]) { mark[r] = 2; stack[sp++] = r; }
          }
        }
        if (nc > maxCells) { skipped++; continue; }   // designed opening, not a gap

        /*
         * Inscribed width, measured as the shorter of the component's longest
         * horizontal and longest vertical run of empty cells. A hairline split
         * between two walls has a long run one way and a run of 1 the other, so
         * it measures one cell; a round hole measures its diameter. A distance
         * transform would report the same for round holes but over-report thin
         * splits, and run length is what "gap a bead could not close" means.
         */
        var runH = 1, runV = 1;
        for (var ry = mny; ry <= mxy; ry++) {
          var run = 0, rowBase = ry * nx;
          for (var rx = mnx; rx <= mxx; rx++) {
            if (mark[rowBase + rx] === 2) { run++; if (run > runH) runH = run; }
            else run = 0;
          }
        }
        for (var cx2 = mnx; cx2 <= mxx; cx2++) {
          var run2 = 0;
          for (var cy2 = mny; cy2 <= mxy; cy2++) {
            if (mark[cy2 * nx + cx2] === 2) { run2++; if (run2 > runV) runV = run2; }
            else run2 = 0;
          }
        }
        var width = Math.min(runH, runV) * cell;
        if (width > MAX_GAP_MM) { skipped++; continue; }
        if (width < thr) continue;

        comps++;
        total += nc;
        hist[Math.min(GAP_BINS - 1, Math.floor(width / GAP_BIN))]++;
        if (width > widest) widest = width;
        if (boundedByWall) {
          wallComps++;
          if (width > widestWall) widestWall = width;
        }
      }
    }
    return {
      total: total, comps: comps, wallComps: wallComps,
      area: total * cellArea, widest: widest, widestWall: widestWall,
      skipped: skipped, hist: hist
    };
  };

  Raster.prototype._emptyVoids = function () {
    return {
      total: 0, comps: 0, wallComps: 0, area: 0, widest: 0, widestWall: 0,
      skipped: 0, hist: new Array(GAP_BINS).fill(0)
    };
  };

  /*
   * Advance the layer state. `below` accumulates and is never cleared; `last`
   * needs no clearing at all because the layer index it stores is what encodes
   * age. `cur`/`wall` are cleared over the extent of the layer just completed —
   * on a 0.2 mm grid a full fill would touch 2.3M cells per layer.
   */
  Raster.prototype.nextLayer = function () {
    var nx = this.nx, below = this.below, cur = this.cur, wall = this.wall;
    var bb = this.bb;
    if (bb) {
      // One pass: promote the finished layer into `below`, then clear the
      // working grids over the same extent.
      for (var y = bb.y0; y <= bb.y1; y++) {
        var row = y * nx;
        for (var x = bb.x0; x <= bb.x1; x++) {
          var i = row + x;
          if (cur[i]) below[i] = 1;
          cur[i] = 0;
          wall[i] = 0;
        }
      }
    }
    this.bb = null;
    this.layerIndex++;
  };

  /*
   * Issue #6: is there material *beneath* this point?
   *
   * Support is a function of *age*, not of a single layer. A point is supported
   * when plastic was deposited in that column within the last `depth` layers,
   * which is the physical condition for bridging: fresh material underneath is
   * a substrate, while a column that has been open for many layers is a void.
   *
   * This single rule kills both false-positive classes that a naive probe
   * produces:
   *
   *   - Rotating infill phase. A bead landing in the previous layer's row gap
   *     is one layer old, so it is supported regardless of phase.
   *   - Top skin over sparse infill. Infill a few layers down is still within
   *     the window, so ordinary top/bottom skin is not reported as bridging.
   *
   * A genuine bridge — a long run over a through-void — has nothing within the
   * window and still fires. `depth` is a layer count, `radius` a bead-width
   * disc in mm that absorbs quantisation.
   */
  Raster.prototype.supported = function (x, y, radius, depth) {
    this._cell(x, y);
    var cx = this._cx, cy = this._cy, nx = this.nx, last = this.last, cell = this.cell;
    var li = this.layerIndex;
    var minAge = li - (depth || 1);
    var rr = radius || cell;
    var r = Math.max(1, Math.ceil(rr / cell));
    var r2 = rr * rr;
    for (var oy = -r; oy <= r; oy++) {
      var yy = cy + oy;
      if (yy < 0 || yy >= this.ny) continue;
      var wy = oy * cell;
      var base = yy * nx + cx;
      for (var ox = -r; ox <= r; ox++) {
        var xx = cx + ox;
        if (xx < 0 || xx >= this.nx) continue;
        var wx = ox * cell;
        if (wx * wx + wy * wy > r2) continue;
        var a = last[base + ox];
        // `a < li` is essential: material deposited on the layer now being
        // printed is not support for itself, or a bridge would support itself
        // from its own first bead onward.
        if (a && a >= minAge && a < li) return true;
      }
    }
    return false;
  };

  root.FS3 = root.FS3 || {};
  root.FS3.MAX_GAP_MM = MAX_GAP_MM;
  root.FS3.GAP_BIN = GAP_BIN;
  root.FS3.GAP_BINS = GAP_BINS;
  root.FS3.Raster = Raster;
})(typeof self !== 'undefined' ? self : globalThis);
