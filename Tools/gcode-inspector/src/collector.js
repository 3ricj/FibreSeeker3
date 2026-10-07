/*
 * FibreSeeker 3 G-code Inspector — deposition collector
 *
 * Turns a G-code stream into the compact physical-plane records the roof-stack
 * analyser needs, without assuming anything the file does not actually say.
 *
 * What this gets right that a naive pass gets wrong:
 *
 *   - Modal state is honoured for real. Omitted X/Y/Z/F are resolved from the
 *     last commanded value; G90/G91, M82/M83 and G92 are tracked; G20/G21 is
 *     tracked and *refused* rather than silently treated as millimetres.
 *   - E-mode coupling is a dialect question, not an assumption. Where the file
 *     carries M82/M83 the extrusion mode is independent of G90/G91 (Klipper and
 *     Rocket behaviour). Where it does not, a Marlin-style file couples E to
 *     G90/G91, and that is what is applied. The interpretation used is reported.
 *   - Deposition is classified from *material advance plus path length*, never
 *     from the verb: a G1 with no positive extrusion is a travel, and a G0 that
 *     extrudes is deposition. Retractions, un-retractions and stationary primes
 *     are never paths.
 *   - An outstanding retraction is accounted for: the recovery line and the
 *     following XY move are separate commands, and a combined recovery-plus-move
 *     line is treated as the start of deposition, not as a continuation of a path
 *     that had not yet resumed.
 *   - Arcs are tessellated to a bounded chord error, not flattened to their
 *     endpoint chord. An unresolvable arc is reported as unanalysed rather than
 *     quietly wrong.
 *   - Planes are keyed by the *actual nozzle Z of the deposition*, so a travel
 *     Z-hop never becomes a layer, a support sublayer is its own plane, and two
 *     infill passes sharing a Z share a plane.
 *   - Opaque macros that can move the tool or change extrusion invalidate the
 *     position state until a move re-establishes it with explicit coordinates.
 *     No motion is invented.
 *   - Composite material mapping is explicit: U/V feed is fibre/matrix, not
 *     plastic support volume, and is never counted as a dense skin.
 */
(function (root) {
  'use strict';

  var D = root.FS3.Dialect;

  /*
   * Rocket section names that are real deposition but absent from the original
   * FEATURES table. `Gap infill` is physical backing but it is not a skin, so it
   * must not inherit the previous feature's role — the stale-role bug that
   * produced 451 bogus C06 findings on this corpus.
   */
  var EXTRA_FEATURES = {
    'Gap infill': { type: 'GAPFILL', entity: 'GAP_INFILL', wall: false }
  };

  var MOTION = { G0: 1, G1: 1 };
  var ARC = { G2: 1, G3: 1 };
  // Documented no-ops: they cannot move the tool or change extrusion state.
  var INERT = {
    G4: 1, M104: 1, M106: 1, M107: 1, M109: 1, M114: 1, M115: 1, M117: 1, M118: 1,
    M140: 1, M141: 1, M190: 1, M191: 1, M203: 1, M204: 1, M205: 1, M220: 1, M221: 1,
    M400: 1, M73: 1, M1001: 1, M1002: 1, M2800: 1, M600: 1, M605: 1,
    SET_PRINT_STATS_INFO: 1, SET_PRESSURE_ADVANCE: 1, SET_VELOCITY_LIMIT: 1,
    SET_TOOL_CORNER_VELOCITY: 1, SET_PRINT_PREP_STAGE: 1
  };
  // Known macros that DO move the tool. Position is unknown after one of these
  // until a command states X and Y explicitly.
  var MOVING_MACROS = {
    MOVE_TO_BRUSH_STATION: 1, CLEAN_NOZZLE: 1, MOVE_OUT_BRUSH_STATION: 1,
    G28: 1, 'G28.1': 1, G30: 1, G31: 1, PROBE: 1, PRINT_START: 1
  };

  function round3(v) { return Math.round(v * 1000) / 1000; }

  function Collector(opts) {
    opts = opts || {};
    this.opts = opts;
    this.stack = opts.stack;
    this.settings = opts.settings || { widths: {} };
    this.toleranceMm = opts.arcToleranceMm === undefined ? 0.02 : opts.arcToleranceMm;
    this.dialectE = opts.eMode || 'auto';   // 'auto' | 'independent' | 'coupled'
    this.reset();
  }

  Collector.prototype.reset = function () {
    this.pos = { x: 0, y: 0, z: 0, f: 0 };
    this.absXYZ = true;
    this.absE = null;            // null until the file says
    this.lastE = 0;
    this.retractionDebt = {};
    this.unitsKnown = true;      // G21 is the default; G20 refuses the analysis
    this.tool = null;
    this.retracted = true;
    this.lineWidth = null;       // modal `; LINE_WIDTH:`
    this.lineHeight = null;      // modal `; ENTITY_LINE_HEIGHT:`
    this.feature = null;
    this.featureName = null;
    this.layer = null;
    this.layerZ = null;
    this.macro = null;
    this.macroZ = null;
    this.lineNo = 0;
    this.positionValid = true;
    this.sawM82M83 = false;
    this.sawG91 = false;
    this.planeKey = null;
    this.pathSeq = 0;
    this.orcaBoundary = false;
    this.inThumb = false;
    this.lastWidthSource = null;
    this.lastHeightSource = null;
    this.stats = {
      lines: 0, depositionMoves: 0, travelMoves: 0, arcMoves: 0, arcUnsupported: 0,
      planeSwitches: 0, unknownMacros: 0, invalidState: 0, widthFallback: 0,
      heightFallback: 0, toolChanges: 0, unitRefusals: 0, zMismatchPlanes: 0
    };
    this.warnings = [];
    this._warned = {};
  };

  Collector.prototype.warn = function (key, msg) {
    if (this._warned[key]) return;
    this._warned[key] = true;
    this.warnings.push({ key: key, message: msg, line: this.lineNo });
    if (this.stack) this.stack.warn(key, msg);
  };

  Collector.prototype.eModeIndependent = function () {
    if (this.dialectE === 'independent') return true;
    if (this.dialectE === 'coupled') return false;
    return this.sawM82M83;   // auto: M82/M83 present means the file drives E mode
  };

  Collector.prototype.eIsAbsolute = function () {
    if (this.eModeIndependent()) return this.absE === true;
    return this.absXYZ;      // coupled dialect: G90 makes E absolute too
  };

  /*
   * Feed one line. Cheap by design: the first character decides whether the line
   * can be comment metadata or a command, and anything that is neither is dropped
   * without a regex.
   */
  Collector.prototype.feed = function (raw) {
    this.lineNo++;
    this.stats.lines++;
    if (!raw) return;
    var start = 0;
    while (start < raw.length && (raw.charCodeAt(start) === 32 || raw.charCodeAt(start) === 9)) start++;
    if (start >= raw.length) return;
    var ch = raw.charCodeAt(start);
    if (ch === 59) { this.onComment(raw.slice(start)); return; }
    if (ch < 65 || ch > 90) return;
    this.onCommand(raw.slice(start));
  };

  Collector.prototype.onComment = function (line) {
    var m;
    if ((m = D.RE_LAYER.exec(line))) {
      this.layer = +m[1];
      this.layerZ = D.num(m[2]);
      if (this.stack) this.stack.recordLayer(this.layer, this.layerZ, this.lineNo);
      return;
    }
    if ((m = /^;\s*MACROLAYER:(\d+)\s*\[([^\]]+)\]/.exec(line))) {
      this.macro = +m[1];
      this.macroZ = D.num(m[2]);
      return;
    }
    // OrcaSlicer / PrusaSlicer: the boundary is `;LAYER_CHANGE`, the Z follows it.
    if (/^;\s*LAYER_CHANGE\b/.test(line)) { this.orcaBoundary = true; return; }
    if ((m = /^;\s*Z:\s*([-\d.,]+)/.exec(line))) {
      if (this.orcaBoundary) {
        this.orcaBoundary = false;
        this.layer = (this.layer === null ? 0 : this.layer) + 1;
        this.layerZ = D.num(m[1]);
        if (this.stack) this.stack.recordLayer(this.layer, this.layerZ, this.lineNo);
      }
      return;
    }
    if ((m = D.RE_LINE_WIDTH.exec(line))) {
      var w = D.num(m[1]);
      if (w > 0 && isFinite(w)) this.lineWidth = w;
      else this.warn('bad_width', 'line ' + this.lineNo + ': ; LINE_WIDTH is not a positive finite number — width state unchanged');
      return;
    }
    if ((m = D.RE_ENTITY_LINE_HEIGHT.exec(line))) {
      var h = D.num(m[1]);
      if (h > 0 && isFinite(h)) this.lineHeight = h;
      else this.warn('bad_height', 'line ' + this.lineNo + ': ; ENTITY_LINE_HEIGHT is not a positive finite number');
      return;
    }
    if ((m = D.RE_SECTION.exec(line))) {
      var key = m[1], kind = m[2];
      var f = D.FEATURES[key] || EXTRA_FEATURES[key];
      if (kind === 'start') {
        if (f) { this.feature = f; this.featureName = key; }
        else {
          // Unknown section name: clear the role rather than inherit it, and say
          // so. A stale role across a boundary is how one island's skin label
          // ends up vouching for another island's infill.
          this.feature = null; this.featureName = null;
          this.warn('unknown_section', 'unknown section "' + key + '" — role cleared rather than inherited');
        }
        if (this.stack) this.stack.openSection();
      } else {
        this.feature = null; this.featureName = null;
      }
      return;
    }
    if ((m = D.RE_TYPE.exec(line))) {
      var role = m[1];
      var tf = D.TYPE_FEATURES[role];
      if (tf) { this.feature = tf; this.featureName = role; }
      else {
        this.feature = null; this.featureName = null;
        if (role !== 'Custom') this.warn('unknown_type', 'unknown ;TYPE: role "' + role + '" — role cleared');
      }
      return;
    }
    if (/^;\s*thumbnail (begin|start)/.test(line)) { this.inThumb = true; return; }
    if (/^;\s*thumbnail end/.test(line)) { this.inThumb = false; return; }
  };

  Collector.prototype.onCommand = function (text) {
    var semi = text.indexOf(';');
    var code = (semi === -1 ? text : text.slice(0, semi)).trim();
    if (!code) return;
    var parts = code.split(/[\s,]+/);
    var verb = (parts[0] || '').toUpperCase();
    if (!verb) return;
    var args = {};
    for (var i = 1; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      var k = p.charAt(0).toUpperCase();
      var v = parseFloat(p.slice(1));
      if (!isNaN(v)) args[k] = v;
      else if (/^[A-Z_]+$/.test(p)) args[p] = true;
    }

    if (verb === 'G90') { this.absXYZ = true; return; }
    if (verb === 'G91') { this.absXYZ = false; this.sawG91 = true; return; }
    if (verb === 'M82') { this.absE = true; this.sawM82M83 = true; return; }
    if (verb === 'M83') { this.absE = false; this.sawM82M83 = true; return; }
    if (verb === 'G21') { this.unitsKnown = true; return; }
    if (verb === 'G20') {
      this.unitsKnown = false;
      this.stats.unitRefusals++;
      this.warn('inch_units', 'G20 (inch units) — geometry analysis refused for this state rather than assuming millimetres');
      return;
    }
    if (verb === 'G92') {
      this.pathSeq++;
      if (args.E !== undefined) this.lastE = this.eIsAbsolute() ? args.E : 0;
      // G92 on a linear axis re-bases the coordinate system without any motion.
      ['X', 'Y', 'Z'].forEach(function (ax) {
        if (args[ax] !== undefined) this.pos[ax.toLowerCase()] = args[ax];
      }, this);
      return;
    }
    if (/^T\d+$/.test(verb)) {
      this.pathSeq++;
      this.tool = verb;
      this.stats.toolChanges++;
      // A tool change leaves the new extruder's load state unknown.
      this.retracted = true;
      return;
    }
    if (MOTION[verb] || ARC[verb]) return this.onMotion(verb, args);
    if (INERT[verb]) return;
    if (MOVING_MACROS[verb]) {
      this.pathSeq++;
      this.positionValid = false;
      this.stats.unknownMacros++;
      this.warn('moving_macro', 'line ' + this.lineNo + ': ' + verb + ' moves the tool — position unknown until a command states X and Y');
      return;
    }
    // Anything else is opaque: it may move the tool, change offsets or change
    // extrusion state. Report the uncertainty; never invent motion.
    this.stats.unknownMacros++;
    this.pathSeq++;
    this.positionValid = false;
    this.warn('opaque_macro', 'line ' + this.lineNo + ': "' + verb + '" is not a documented no-op — deposition state invalidated until re-established');
  };

  /*
   * Resolve one motion. `args` carries only the words actually present, so every
   * omitted axis comes from modal state — and the extrusion delta depends on the
   * E mode the dialect implies, not on a fixed assumption.
   */
  Collector.prototype.onMotion = function (verb, args) {
    if (!this.unitsKnown) return;
    var rel = !this.absXYZ;
    var x = args.X === undefined ? this.pos.x : (rel ? this.pos.x + args.X : args.X);
    var y = args.Y === undefined ? this.pos.y : (rel ? this.pos.y + args.Y : args.Y);
    var z = args.Z === undefined ? this.pos.z : (rel ? this.pos.z + args.Z : args.Z);
    var f = args.F === undefined ? this.pos.f : args.F;
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) { this.positionValid = false; return; }

    // A command that states X and Y re-establishes where the nozzle is — but only
    // for the *next* move. The bead drawn by this one starts wherever the opaque
    // macro left the tool, and that start is unknowable, so it is dropped below.
    var dE = 0;
    if (args.E !== undefined) {
      dE = this.eIsAbsolute() ? (args.E - this.lastE) : args.E;
      this.lastE = this.eIsAbsolute() ? args.E : this.lastE + args.E;
    }
    var dU = args.U === undefined ? 0 : args.U;
    var dV = args.V === undefined ? 0 : args.V;

    // Recovering previously withdrawn filament is not new material. Account
    // for it per tool, including recovery combined with XY motion.
    var debtKey = this.tool || 'default';
    var debt = this.retractionDebt[debtKey] || 0;
    var recovered = dE > 0 ? Math.min(debt, dE) : 0;
    this.retractionDebt[debtKey] = dE < 0 ? debt - dE : debt - recovered;
    var depositedE = dE - recovered;

    var material = null;
    if (depositedE > 1e-9) material = 'plastic';
    else if (dU > 1e-9) material = 'fiber';
    else if (dV > 1e-9) material = 'matrix';
    var extruding = material !== null;
    if (!extruding || recovered > 0) this.pathSeq++;
    if (dE < -1e-9 || dU < -1e-9 || dV < -1e-9) this.retracted = true;
    if (extruding) this.retracted = false;

    var dx = x - this.pos.x, dy = y - this.pos.y;
    var xyLen = Math.sqrt(dx * dx + dy * dy);
    if (xyLen > 0) {
      if (extruding) this.stats.depositionMoves++;
      else this.stats.travelMoves++;
    }

    if (ARC[verb]) {
      this.onArc(verb, args, x, y, z, f, material,
        material === 'plastic' ? recovered / dE : 0);
      return;
    }
    if (extruding && xyLen > 0) {
      if (!this.positionValid) {
        this.stats.invalidState++;
        this.warn('invalid_state', 'line ' + this.lineNo + ': deposition with an unresolved start position — segment dropped rather than guessed');
      } else {
        var fraction = material === 'plastic' ? recovered / dE : 0;
        this.emit(this.pos.x + dx * fraction, this.pos.y + dy * fraction, x, y, z, material);
      }
    }
    this.pos.x = x; this.pos.y = y; this.pos.z = z;
    if (args.F !== undefined) this.pos.f = f;
    // A command that states X and Y re-establishes where the nozzle is *from here
    // on*. The bead drawn by this very line started wherever the opaque macro left
    // the tool, so it was dropped above; the next one is knowable.
    if (!this.positionValid && args.X !== undefined && args.Y !== undefined) this.positionValid = true;
  };

  /*
   * G2/G3 with a bounded chord error.
   *
   * Chord count is derived from radius and tolerance — segments per quadrant =
   * ceil((π/2) / acos(1 − tol/r)) — so a large-radius arc gets more chords than a
   * small one and the deviation from the true arc never exceeds
   * `arcToleranceMm`. Endpoint chords are never substituted: flattening a quarter
   * arc to its chord throws away most of the footprint this analysis counts.
   */
  Collector.prototype.onArc = function (verb, args, x, y, z, f, material, startFraction) {
    var sx = this.pos.x, sy = this.pos.y;
    var ccw = verb === 'G3';
    var cx, cy, r;
    if (args.R !== undefined) {
      r = Math.abs(args.R);
      var dx = x - sx, dy = y - sy;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (!(r > 0) || d === 0 || d > 2 * r + 1e-9) {
        this.stats.arcUnsupported++;
        this.warn('arc_unsupported', 'line ' + this.lineNo + ': arc radius cannot span its chord — not analysed');
        this.pos.x = x; this.pos.y = y; this.pos.z = z;
        return;
      }
      var h = Math.sqrt(Math.max(0, r * r - (d / 2) * (d / 2)));
      var mx = (sx + x) / 2, my = (sy + y) / 2;
      var px = -dy / d, py = dx / d;      // unit perpendicular
      var cands = [[mx + px * h, my + py * h], [mx - px * h, my - py * h]];
      var wantMajor = args.R < 0;
      var best = null;
      for (var c = 0; c < 2; c++) {
        var sw = Math.abs(sweepBetween(sx, sy, x, y, cands[c][0], cands[c][1], ccw));
        var isMajor = sw > Math.PI + 1e-9;
        if (isMajor === wantMajor) { best = cands[c]; break; }
      }
      if (!best) best = cands[0];
      cx = best[0]; cy = best[1];
    } else {
      cx = sx + (args.I || 0);
      cy = sy + (args.J || 0);
      r = Math.sqrt((sx - cx) * (sx - cx) + (sy - cy) * (sy - cy));
      if (!(r > 0) || !isFinite(r)) {
        this.stats.arcUnsupported++;
        this.warn('arc_unsupported', 'line ' + this.lineNo + ': arc without a resolvable centre — not analysed');
        this.pos.x = x; this.pos.y = y; this.pos.z = z;
        return;
      }
    }
    var sweep = sweepBetween(sx, sy, x, y, cx, cy, ccw);
    var perQuad = Math.max(1, Math.ceil((Math.PI / 2) / Math.acos(Math.max(-1, Math.min(1, 1 - this.toleranceMm / r)))));
    var n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2)) * perQuad);
    this.stats.arcMoves++;
    var px2 = sx, py2 = sy;
    var a0 = Math.atan2(sy - cy, sx - cx);
    for (var i = 1; i <= n; i++) {
      var a = a0 + sweep * (i / n);
      var nx = cx + r * Math.cos(a), ny = cy + r * Math.sin(a);
      if (i === n) { nx = x; ny = y; }
      if (material && this.positionValid && i / n > startFraction) {
        var trim = Math.max(0, startFraction * n - (i - 1));
        this.emit(px2 + (nx - px2) * trim, py2 + (ny - py2) * trim, nx, ny, z, material, true);
      }
      px2 = nx; py2 = ny;
    }
    this.pos.x = x; this.pos.y = y; this.pos.z = z;
    if (args.F !== undefined) this.pos.f = f;
  };

  function sweepBetween(sx, sy, ex, ey, cx, cy, ccw) {
    var a0 = Math.atan2(sy - cy, sx - cx);
    var a1 = Math.atan2(ey - cy, ex - cx);
    var s = a1 - a0;
    if (ccw) { while (s <= 0) s += 2 * Math.PI; }
    else { while (s >= 0) s -= 2 * Math.PI; }
    return s;
  }

  /*
   * Record a resolved bead. The plane is keyed by the actual deposition Z, so the
   * layer index never decides what a physical plane is.
   *
   * Width and height come from the file's own modal metadata when it has any.
   * When it does not, the documented fallback is the profile's declared entity
   * width (Rocket `EntitySizes`, Orca header width lines) or the tool's width
   * table, and the finding records that the width was inferred — a footprint built
   * on an assumed width carries less certainty than one built on a declared one.
   * A matrix/fibre bead's area is never derived from fibre feed alone.
   */
  Collector.prototype.emit = function (x0, y0, x1, y1, z, material, isArc) {
    var key = round3(z);
    if (key !== this.planeKey) {
      this.planeKey = key;
      this.stats.planeSwitches++;
      this.stack.beginPlane({ z: key, layerId: this.layer, macroId: this.macro, line: this.lineNo, headerZ: this.layerZ });
      /*
       * Cross-check the commanded deposition Z against the layer header, once per
       * plane. The two should agree; when they do not, the physical plane is still
       * keyed on the actual Z (that is what the nozzle did) but the disagreement is
       * reported, because the reader needs to know which quantity the geometry was
       * measured on.
       */
      if (this.layerZ !== null && Math.abs(this.layerZ - z) > 0.0015) {
        this.stats.zMismatchPlanes++;
        var dz = Math.abs(this.layerZ - z);
        if (this.zMismatchMax === undefined || dz > this.zMismatchMax) {
          this.zMismatchMax = dz;
          this.zMismatchLine = this.lineNo;
        }
      }
    }
    var width = this.lineWidth;
    var widthSource = 'LINE_WIDTH';
    if (!(width > 0)) {
      var ent = this.feature ? this.feature.entity : 'UNKNOWN';
      var declared = this.settings.widths && this.settings.widths[ent] > 0 ? this.settings.widths[ent] : null;
      width = declared || D.DEFAULT_WIDTH[ent] || this.opts.fallbackWidth || 0.4;
      widthSource = declared ? 'profile_entity_width' : 'fallback_table';
      this.stats.widthFallback++;
    }
    var height = this.lineHeight;
    var heightSource = 'ENTITY_LINE_HEIGHT';
    if (!(height > 0)) {
      height = this.opts.fallbackHeight || 0.2;
      heightSource = 'assumed';
      this.stats.heightFallback++;
    }
    this.stack.addSegment({
      x0: x0, y0: y0, x1: x1, y1: y1,
      width: width, height: height,
      role: this.feature ? this.feature.type : 'UNKNOWN',
      label: this.featureName || (this.feature ? this.feature.type : 'unsectioned'),
      tool: this.tool, line: this.lineNo, arc: !!isArc, material: material, path: this.pathSeq,
      widthSource: widthSource, heightSource: heightSource
    });
    this.lastWidthSource = widthSource;
    this.lastHeightSource = heightSource;
  };

  Collector.prototype.finish = function () {
    return {
      stats: this.stats, warnings: this.warnings,
      eMode: this.eModeIndependent() ? 'independent (M82/M83 present)' : 'coupled to G90/G91 (no M82/M83 in file)',
      units: this.unitsKnown ? 'mm' : 'refused — inch units (G20) seen',
      widthSource: this.lastWidthSource || 'none — no deposition recorded',
      heightSource: this.lastHeightSource || 'none — no deposition recorded',
      zMismatchPlanes: this.stats.zMismatchPlanes,
      zMismatchMaxMm: this.zMismatchMax === undefined ? null : Math.round(this.zMismatchMax * 10000) / 10000,
      zMismatchLine: this.zMismatchLine || null,
      positionValid: this.positionValid
    };
  };

  root.FS3 = root.FS3 || {};
  root.FS3.Collector = Collector;
  root.FS3.EXTRA_FEATURES = EXTRA_FEATURES;
})(typeof self !== 'undefined' ? self : globalThis);
