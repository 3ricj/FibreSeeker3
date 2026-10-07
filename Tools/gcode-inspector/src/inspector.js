/*
 * FibreSeeker 3 G-code Inspector — analysis engine
 *
 * One streaming pass over a Rocket Slicer .gcode file. Rebuilds tool / extruder /
 * fan state, the layer structure, feature sections and a layer-coverage raster,
 * then runs the checks that map onto the repository issue tracker.
 *
 * Check ids (see REPORT.md for the issue mapping):
 *   C01 stringing          -> issue #1
 *   C02 seam-alignment     -> issue #2
 *   C03 perimeter-gap      -> issue #3
 *   C04 volumetric-flow    -> issue #4
 *   C05 layer-time         -> issue #5
 *   C06 unsupported-run    -> issue #6
 *   C07 motion-contract    -> issue #8
 *   C08 fiber-window       -> issue #9
 *   C09 firmware-contract  -> issues #10 / #11
 *   C10 zhop-vs-setting    -> issue #29
 *   C11 geometry-sanity    -> general
 *   C12 first-layer-fiber  -> owner rule: no carbon on layer 1 unless fortified
 *   C13 tool-configuration -> dual-tool (FFF + CFC) vs single-tool FFF
 *   C14 fiber-consumption  -> total fibre length fed and number of cuts
 *   C15 machine-flags      -> presence/absence of machine-assist commands
 */
(function (root) {
  'use strict';

  var D = root.FS3.Dialect;
  var Raster = root.FS3.Raster;

  // Generic melt-rate ceilings (mm^3/s) used when the profile does not export one.
  var GENERIC_CEILING = { PLA: 15, PETG: 12, ABS: 14, ASA: 14, TPU: 8, CFC: 8 };

  var CHECKS = {
    C01: { issue: 1, title: 'Un-retracted plastic travel across voids / open air (stringing)' },
    C02: { issue: 2, title: 'Aligned seams \u2014 perimeter start points stacked in Z' },
    C03: { issue: 3, title: 'Enclosed gaps wider than the deposited bead' },
    C04: { issue: 4, title: 'Volumetric flow demand above the material ceiling' },
    C05: { issue: 5, title: 'Layer time below the slicer\u2019s own minimum' },
    C06: { issue: 6, title: 'Long unsupported (bridging) printed runs' },
    C07: { issue: 8, title: 'Implicit motion contract \u2014 accel/jerk/max-feedrate not declared' },
    C08: { issue: 9, title: 'Fiber-feed window commands M1001/M1002 unimplemented in firmware' },
    C09: { issue: 11, title: 'Slicer/firmware command contract \u2014 undefined verbs' },
    C10: { issue: 29, title: 'Plastic travel Z-hop emitted against the exported DoZHop setting' },
    C11: { issue: null, title: 'Geometry / parse sanity' },
    C12: { issue: null, title: 'Carbon fibre deposited on the first layer of a non-fortified print' },
    C13: { issue: null, title: 'Tool configuration — dual-tool (FFF + CFC) vs single-tool FFF' },
    C14: { issue: null, title: 'Fibre consumption and cut count' },
    C15: { issue: null, title: 'Machine-assist flags (AI detection, bed mesh, runout) present or absent' }
  };

  function Inspector(opts) {
    opts = opts || {};
    this.cell = opts.cell || 0.2;
    this.maxFindings = opts.maxFindings || 500;
    this.coverage = opts.coverage !== false;
    this.gapRatio = opts.gapRatio || 1.5;        // void diameter > ratio * bead width
    this.gapCriticalRatio = opts.gapCriticalRatio || 2.5;
    this.minUnsupported = opts.minUnsupported || 16; // mm, the floor issue #6 reports at
    this.minSeamRun = opts.minSeamRun || 10;         // consecutive layers, issue #2
    this.minLayerTimeFloor = opts.minLayerTimeFloor || 5;
    this.flowCritical = opts.flowCritical || 1.25;   // x ceiling -> critical
    this.sustainedWindow = opts.sustainedWindow || 1.0; // s of continuous over-ceiling flow
    this.minTravel = opts.minTravel === undefined ? 2 : opts.minTravel; // mm, below this a travel is not a string risk
    this.flowMinDist = opts.flowMinDist || 15;       // mm, "physically sustained" = long moves only
    // C06 support probe radius. A bead-width disc distinguishes *bridging* from
    // *infill phase*: rotated infill leaves a sub-bead row gap on the layer below
    // but has material one bead-width away, whereas a real bridge has nothing
    // within any radius. Internal calibration constant, not a user knob.
    // C06 support-probe disc radius in mm. One bead width absorbs raster
    // quantisation without swallowing a real void: sweeping 0.2-1.0 mm on the
    // corpus peaks in agreement with the slicer's own BRIDGE labels at 0.4 mm
    // (76.7 %) and degrades at both ends. Internal calibration constant.
    this.supportRadius = opts.supportRadius || 0.4;
    // C06 support window in layers. Support is age-based: plastic deposited in
    // this column within the last N layers is a substrate. Calibrated against
    // the corpus by measuring agreement with the slicer's own BRIDGE/OVERHANG
    // feature labels (independent ground truth): N=1 gives 3025 findings at 4.5%
    // agreement — the naive "layer directly below" probe drowns in infill-phase
    // and top-skin-over-infill artefacts — while N=2 gives 114 findings at 76.3%
    // agreement. N>=3 loses recall (29 findings, 6.9%) because it starts
    // ignoring genuinely shallow voids. N=2 also matches Rocket Slicer's own
    // bridging clearance rule. Internal calibration constant.
    this.supportDepth = opts.supportDepth || 2;
    this.reset();
  }

  Inspector.prototype.reset = function () {
    this.findings = [];
    this.counts = {};
    this.worst = {};
    this.critByCheck = {};
    this.layers = [];
    this.seams = [];
    this.customVerbs = {};
    this.unknownTypes = {};
    this.headerWidths = {};
    this.klipperAccelLine = 0;
    this.fanEvents = 0;
    this.fan = { P0: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0 };
    this.m1001 = 0; this.m1002 = 0; this.m1001NoL = 0; this.m1001Open = 0;
    this.m204 = null; this.m205 = 0; this.m203 = 0;
    this.klipperMotionLines = 0;
    this.header = { slicer: null, processor: null, mode: null, layerCount: null };
    this.session = null;
    this.materialData = null;
    // C12/C13/C14/C15 bookkeeping.
    this.t0 = 0; this.t1 = 0;
    this.fiberFed = 0;        // every positive U word: what actually left the spool
    this.fiberRestart = 0;    // the U55 air-prime feed that never reaches the part
    this.fiberDeposited = 0;  // positive U on a move with XY motion: what was laid down
    this.fiberOnLayer1 = {};  // feature name -> mm of fibre deposited on layer 1
    this.fiberLayer1First = null;
    this.firstFiberLayer = null;
    this.cuts = 0;            // M2800 blade fires
    this.cutDistMm = 0;       // sum of ;CUT DISTANCE values tied to a real cut
    this.cutDistOrphan = 0;   // ;CUT DISTANCE comments with no preceding M2800
    this.cutDistCounted = 0;  // how many cuts a ;CUT DISTANCE has been consumed by
    this.cutDistLast = null;
    this.flagHits = {};       // machine-flag key -> {count, line}
    this.c12 = null; this.c13Verdict = null; this.c14 = null; this.c15 = null;
    this.stats = {
      lines: 0, bytes: 0, moves: 0, extrudeMoves: 0, travelMoves: 0, fiberMoves: 0,
      plasticMm: 0, fiberMm: 0, matrixMm: 0, plasticVolMm3: 0, printTimeSec: 0,
      toolChanges: 0, sections: {}, retractEvents: 0,
      bbox: { minx: 1e9, miny: 1e9, maxx: -1e9, maxy: -1e9 },
      maxFlow: 0, maxFlowLine: 0, minLayerTime: 1e9, minLayerTimeLayer: null,
      voidCells: 0, voidComps: 0, voidWallComps: 0, voidSkipped: 0, voidLayers: 0,
      voidWidest: 0, voidWidestWall: 0, voidArea: 0, voidHist: new Array(20).fill(0)
    };
    this.pos = { x: 0, y: 0, z: 0, f: 0 };
    this.absE = false;
    this.lastE = 0;
    this.tool = null;
    this.inToolChange = false;
    this.feature = null;
    this.featureName = null;
    this.layer = -1;
    this.orcaBoundary = false;
    this.layerZ = 0;
    this.layerLine = 0;
    this.layerTime = 0;
    this.layerExtrude = 0;
    this.layerMoves = 0;
    this.layerStart = null;
    this.retracted = true;
    this.lastAxis = null;
    this.prevWasExtrusion = false;
    this.unretractedImmediate = 0;
    this.hopArmed = false;
    this.pendingHop = null;
    this.hopCount = 0;
    this.hopCountDisabled = 0;
    this.hopDisabledFirst = null;
    this.hopNoRetract = 0;
    this.unretractedTravels = 0;
    this.unretractedImmediate = 0;
    this.travelClass = { solid: 0, void: 0, air: 0 };
    this.riskTravels = [];
    this.riskClass = { solid: 0, void: 0, air: 0 };
    this.riskZhop = { solid: 0, void: 0, air: 0 };
    this.riskZhopTotal = 0;
    this.riskDefects = 0;
    this.riskWorst = 0;
    this.riskWorstLine = 0;
    this.unmitigated = 0;
    this.orderDefects = 0;
    this.zMoveLines = [];
    this.retractLines = [];
    this.unsupRun = 0;
    this.unsupStartLine = 0;
    this.unsupStartLayer = 0;
    this.unsupFeature = '';
    this.unsupFanAtStart = false;
    this.unsupFeed = 0;
    this.unsupFanOff = 0;
    this.unsupMax = 0;
    this.unsupRuns = 0;
    this.sustained = { t: 0, v: 0 };
    this.raster = null;
    this.inThumbnail = false;
    this.lastTravel = null;
    this.seamClusterCount = 0;
  };

  Inspector.prototype.add = function (check, severity, lineNo, layer, message, evidence) {
    this.counts[check] = (this.counts[check] || 0) + 1;
    if (severity === 'critical') this.critByCheck[check] = (this.critByCheck[check] || 0) + 1;
    if (this.findings.length < this.maxFindings) {
      this.findings.push({
        check: check, issue: CHECKS[check].issue, severity: severity,
        line: lineNo, layer: layer, message: message, evidence: evidence || ''
      });
    }
  };

  Inspector.prototype.worstSet = function (check, value) {
    var w = this.worst[check];
    if (w === undefined || value > w) this.worst[check] = value;
  };

  // ---- main pass ---------------------------------------------------------
  Inspector.prototype.run = function (text, name) {
    this.reset();
    var lines = text.split(/\r\n|\n|\r/);
    this.stats.lines = lines.length;
    this.stats.bytes = text.length;

    // Pull the SESSION echo first so profile settings are known before motion.
    for (var i = 0; i < lines.length; i++) {
      if (D.RE_SESSION.test(lines[i])) {
        this.session = D.parseSession(lines[i]);
        break;
      }
    }
    this.settings = D.sessionSettings(this.session);
    /*
     * No `; SESSION:` blob means this is not Rocket output. OrcaSlicer and
     * PrusaSlicer export the same profile information as a flat
     * `; <key> = <value>` config dump, so read that instead and let C05/C06/C10
     * argue from the file's own declared settings rather than from nulls.
     */
    if (!this.session) this.settings = D.flatSettings(D.parseConfigDump(lines));
    if (this.coverage) {
      this.raster = new Raster(this.settings.areaX, this.settings.areaY, this.cell);
    }

    for (var n = 0; n < lines.length; n++) {
      this.lineNo = n + 1;
      this.feed(lines[n]);
    }
    this.finish();
    return this.report(name);
  };

  Inspector.prototype.feed = function (raw) {
    var line = raw.trim();
    if (!line) return;

    var m;
    if ((m = D.RE_GEN.exec(line))) { this.header.slicer = m[1]; return; }
    if ((m = D.RE_GEN_ORCA.exec(line))) { this.header.slicer = m[1]; return; }
    if ((m = D.RE_PROC.exec(line))) { this.header.processor = m[1].trim(); return; }
    if ((m = D.RE_MODE.exec(line))) { this.header.mode = m[1].trim(); return; }
    if ((m = D.RE_LAYERCOUNT.exec(line))) { this.header.layerCount = +m[1]; return; }
    if ((m = D.RE_LAYERCOUNT_ORCA.exec(line))) { this.header.layerCount = +m[1]; return; }
    if ((m = D.RE_EW_LINE.exec(line))) {
      // Header-declared bead width, e.g. `; external perimeters extrusion width
      // = 0.42mm`. Applied in beadWidthFor(); these lines trail the thumbnail,
      // so they cannot be folded into the settings object up front.
      var role = m[1].toLowerCase();
      if (D.TYPE_WIDTH_LINES[role]) this.headerWidths[D.TYPE_WIDTH_LINES[role]] = D.num(m[2]);
      return;
    }
    if (D.RE_THUMB_START.test(line)) { this.inThumbnail = true; return; }
    if (/^;\s*thumbnail end/.test(line)) { this.inThumbnail = false; return; }
    if (this.inThumbnail) return;
    if (D.RE_MATERIAL.test(line)) {
      if (!this.materialData) this.materialData = D.parseMaterialPrintData(line);
      return;
    }
    if (D.RE_ENTITY.test(line) || D.RE_SESSION.test(line)) return;
    if (D.RE_MACROLAYER.test(line)) return;

    if ((m = D.RE_LAYER.exec(line))) { this.onLayer(+m[1], D.num(m[2])); return; }
    if (/^;\s*LAYER_CHANGE\b/.test(line)) { this.orcaBoundary = true; return; }
    if ((m = /^;\s*Z:\s*([-\d.,]+)/.exec(line)) && this.orcaBoundary) {
      this.orcaBoundary = false;
      this.onLayer(this.layer < 0 ? 1 : this.layer + 1, D.num(m[1]));
      return;
    }
    if ((m = D.RE_TYPE.exec(line))) { this.onType(m[1]); return; }
    if ((m = D.RE_SEAM.exec(line))) {
      this.seams.push({ kind: m[1], x: D.num(m[2]), y: D.num(m[3]), z: D.num(m[4]), layer: this.layer, line: this.lineNo });
      return;
    }
    if (/^;\s*Start change extruder/.test(line)) { this.inToolChange = true; return; }
    if (/^;\s*End change extruder/.test(line)) { this.inToolChange = false; return; }
    // The slicer's own record of the trimmed length left between blade and nozzle.
    // It is a comment, so it must be read before the generic comment bail-out.
    if ((m = /^;\s*CUT DISTANCE\s+([-\d.,]+)/.exec(line))) {
      if (this.cuts > this.cutDistCounted) {
        this.cutDistMm += D.num(m[1]);
        this.cutDistCounted++;
        this.cutDistLast = D.num(m[1]);
      } else {
        this.cutDistOrphan++;
      }
      return;
    }

    if ((m = D.RE_SECTION.exec(line))) {
      this.flushUnsupRun();
      this.sustained.t = 0; this.sustained.v = 0;
      var key = m[1], kind = m[2];
      if (D.FEATURES[key]) {
        if (kind === 'start') {
          this.feature = D.FEATURES[key];
          this.featureName = key;
          this.stats.sections[key] = (this.stats.sections[key] || 0) + 1;
        } else {
          this.feature = null; this.featureName = null;
        }
      }
      return;
    }
    if (/^;/.test(line)) return;

    var p = D.parseLine(raw);
    if (!p.verb) return;
    // Machine-assist flags: the only way a print can declare them is as an
    // executable command, so scan the command text (not the comment) for them.
    for (var fi = 0; fi < D.MACHINE_FLAGS.length; fi++) {
      var flag = D.MACHINE_FLAGS[fi];
      if (flag.re.test(p.code)) {
        var hit = this.flagHits[flag.key] || (this.flagHits[flag.key] = { count: 0, line: this.lineNo });
        hit.count++;
      }
    }
    if (/^SET_(VELOCITY_LIMIT|PRESSURE_ADVANCE|TOOL_CORNER_VELOCITY)/.test(p.code)) this.klipperMotionLines++;
    // A Klipper motion contract is only a contract if it declares the limits.
    // `SET_VELOCITY_LIMIT … ACCEL=…` is the direct analogue of M204; Rocket's own
    // `SET_VELOCITY_LIMIT MINIMUM_CRUISE_RATIO=0.8` declares no acceleration at
    // all, so it must not count here.
    if (/^SET_VELOCITY_LIMIT\b/.test(p.code) && /\bACCEL\s*=/i.test(p.code) && this.klipperAccelLine === 0) {
      this.klipperAccelLine = this.lineNo;
    }
    if (D.isCustomVerb(p.verb, null)) {
      this.customVerbs[p.verb] = (this.customVerbs[p.verb] || 0) + 1;
      return;
    }

    switch (p.verb) {
      case 'G0': case 'G1': return this.onMotion(p);
      case 'G4': this.layerTime += (p.args.P || 0) / 1000; return;
      case 'G91':
        this.add('C11', 'warning', this.lineNo, this.layer,
          'Relative XYZ (G91) \u2014 this dialect is absolute XYZ', line);
        return;
      case 'G92': this.lastE = p.args.E || 0; return;
      case 'M82': this.absE = true; return;
      case 'M83': this.absE = false; return;
      case 'M106': case 'M107': return this.onFan(p);
      case 'M204':
        if (this.m204 === null) this.m204 = { line: this.lineNo, value: p.args.S };
        return;
      case 'M205': this.m205++; return;
      case 'M203': this.m203++; return;
      case 'M1001':
        this.m1001++;
        if (p.args.L === undefined) this.m1001NoL++;
        this.m1001Open++;
        return;
      case 'M1002':
        this.m1002++;
        if (this.m1001Open > 0) this.m1001Open--;
        else this.add('C08', 'warning', this.lineNo, this.layer,
          'M1002 without a matching M1001', line);
        return;
      case 'M2800':
        this.cuts++;
        return;
      case 'T0': case 'T1':
        this.tool = p.verb;
        this.stats.toolChanges++;
        if (p.verb === 'T0') this.t0++; else this.t1++;
        this.retracted = true;
        this.hopArmed = false;
        return;
      default: return;
    }
  };

  Inspector.prototype.onFan = function (p) {
    this.fanEvents++;
    if (p.verb === 'M107') { this.fan.P0 = 0; this.fan.P1 = 0; this.fan.P2 = 0; return; }
    var port = p.args.P === undefined ? 'P0' : 'P' + p.args.P;
    this.fan[port] = p.args.S === undefined ? 0 : p.args.S;
  };

  /*
   * Resolved part-fan speed — the one number C06 needs.
   *
   * `M106 S<n>` with no `P` word addresses the part fan directly; that is what
   * Marlin, Klipper and OrcaSlicer emit. Rocket Slicer instead uses `M106 P<n>`
   * as a multi-port selector with the part fans on P1/P2. Testing only P1/P2
   * therefore reads "fan off" on every non-Rocket file: on the OrcaSlicer sample
   * 13 of 15 C06 findings claimed the fan was off while it was at S51 (20 %).
   * Maxing the three part-fan ports is right for both dialects and
   * behaviour-identical on the Rocket corpus, which emits no bare `M106` at all
   * (measured: 0 bare vs 2,470 ported across the 11 fixtures).
   */
  Inspector.prototype.partFan = function () {
    return Math.max(this.fan.P0, this.fan.P1, this.fan.P2);
  };

  /*
   * OrcaSlicer / PrusaSlicer feature role. `;TYPE:<role>` is a single line that
   * stays in force until the next one, so it opens a feature and needs no
   * matching end line. An unrecognised role clears the feature rather than
   * letting the following geometry inherit the previous label — the same stale-
   * feature bug that produced 451 bogus C06 findings on the Tinmorry fixture —
   * and is reported at C11 so a dialect gap surfaces as a finding.
   */
  Inspector.prototype.onType = function (role) {
    this.flushUnsupRun();
    this.sustained.t = 0; this.sustained.v = 0;
    var f = D.TYPE_FEATURES[role];
    if (!f) {
      if (role !== 'Custom') this.unknownTypes[role] = (this.unknownTypes[role] || 0) + 1;
      this.feature = null; this.featureName = null;
      return;
    }
    this.feature = f;
    this.featureName = role;
    this.stats.sections[role] = (this.stats.sections[role] || 0) + 1;
  };

  /*
   * Bead width for a feature entity. A width the slicer declared in its own
   * header outranks the tool's fallback table, because it is the file's own
   * statement of what it laid down. Rocket files emit no such lines, so this is
   * a no-op there and the Rocket corpus is unaffected.
   */
  Inspector.prototype.beadWidthFor = function (entityKey) {
    var w = this.headerWidths[entityKey];
    if (w > 0) return w;
    return D.beadWidth(this.settings, entityKey);
  };

  Inspector.prototype.onLayer = function (num, z) {
    if (this.layer >= 0 && this.layerStart) this.closeLayer();
    this.flushUnsupRun();
    this.sustained.t = 0; this.sustained.v = 0;
    this.layer = num;
    this.layerZ = z;
    this.layerLine = this.lineNo;
    this.layerTime = 0;
    this.layerExtrude = 0;
    this.layerMoves = 0;
    this.layerStart = { num: num, z: z, line: this.lineNo };
    if (this.raster) { this.raster.nextLayer(); this.raster.setZ(z); }
  };

  Inspector.prototype.closeLayer = function () {
    var t = this.layerTime;
    /*
     * Issue #5: the layer floor. The profile's own `MinLayerTimeForSlowing` is
     * the authority, but `Benchy_fortified.gcode` exports 0 — which does not
     * license a 0.13 s layer, it just means the slowdown pass was disabled. When
     * the profile is silent we fall back to the profile's cooling window
     * (`LayerTimeForMaxCooling`), and failing that to the tool floor, and say so
     * in the evidence so the reader knows which rule fired.
     */
    var prof = this.settings.minLayerTime;
    var min = prof, source = this.settings.minLayerTimeSource;
    if (!(min > 0)) {
      min = this.settings.coolingWindow > 0 ? this.settings.coolingWindow : this.minLayerTimeFloor;
      source = this.settings.coolingWindow > 0
        ? this.settings.coolingWindowSource + ' (' + this.settings.minLayerTimeKey + '=' + prof + ')'
        : 'tool floor (profile declares no minimum)';
    }
    this.layers.push({
      num: this.layerStart.num, z: this.layerStart.z, line: this.layerStart.line,
      time: t, moves: this.layerMoves, extrude: this.layerExtrude
    });
    this.stats.printTimeSec += t;
    if (t < this.stats.minLayerTime) {
      this.stats.minLayerTime = t;
      this.stats.minLayerTimeLayer = this.layerStart.num;
    }
    if (min > 0 && t < min) {
      var sev = t < min * 0.25 ? 'critical' : 'warning';
      this.add('C05', sev, this.layerStart.line, this.layer,
        'Layer ' + this.layerStart.num + ' time ' + t.toFixed(2) + 's is below the ' +
        min + 's floor (' + (prof > 0 ? 'profile minimum' : 'profile declares no minimum') + ')',
        source + '=' + min + ' measured=' + t.toFixed(2) + 's');
      this.worstSet('C05', min - t);
    }

    // Issue #3: voids enclosed by this layer's deposited material. A gap only
    // matters once it is wider than the bead that was supposed to close it.
    if (this.raster) {
      var width = this.beadWidthFor('INSET0');
      var v = this.raster.enclosedVoids(width * this.gapRatio);
      if (v.comps > 0) {
        this.stats.voidCells += v.total;
        this.stats.voidComps += v.comps;
        this.stats.voidWallComps += v.wallComps;
        this.stats.voidArea += v.area;
        if (v.widest > this.stats.voidWidest) this.stats.voidWidest = v.widest;
        if (v.widestWall > this.stats.voidWidestWall) this.stats.voidWidestWall = v.widestWall;
        for (var hb = 0; hb < v.hist.length; hb++) this.stats.voidHist[hb] += v.hist[hb];
        if (v.widestWall > 0) {
          this.stats.voidLayers++;
          var sev = v.widestWall >= width * this.gapCriticalRatio ? 'critical' : 'warning';
          this.add('C03', sev, this.layerStart.line, this.layer,
            'Layer ' + this.layerStart.num + ' encloses ' + v.wallComps + ' perimeter-bounded gap(s); ' +
            'widest \u2248 ' + v.widestWall.toFixed(2) + ' mm across (' + v.area.toFixed(1) +
            ' mm\u00b2 total) \u2014 wider than the ' + width.toFixed(2) + ' mm bead',
            'enclosed empty area inside the layer footprint bounded by a perimeter bead');
          this.worstSet('C03', v.widestWall);
        }
      }
      this.stats.voidSkipped += v.skipped;
    }
  };

  Inspector.prototype.onMotion = function (p) {
    var a = p.args;
    var x = a.X === undefined ? this.pos.x : a.X;
    var y = a.Y === undefined ? this.pos.y : a.Y;
    var z = a.Z === undefined ? this.pos.z : a.Z;
    var f = a.F === undefined ? this.pos.f : a.F;
    if (!(f > 0)) f = 6000;
    var d = D.extrusionDeltas(a, this.absE, this.lastE);
    var extruding = d.dE > 1e-9 || d.dU > 1e-9 || d.dV > 1e-9;
    var retracting = d.dE < -1e-9 || d.dV < -1e-9;
    var dx = x - this.pos.x, dy = y - this.pos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var dz = z - this.pos.z;
    var axis = (a.E !== undefined) ? 'E' : ((a.U !== undefined || a.V !== undefined) ? 'UV' : null);
    var speed = f / 60;
    if (!extruding || dist === 0) {
      this.sustained.t = 0; this.sustained.v = 0;
    }

    this.stats.moves++;
    this.layerMoves++;
    if (dist > 0) this.layerTime += dist / speed;
    else if (Math.abs(dz) > 0) this.layerTime += Math.abs(dz) / (this.settings.travelSpeedZ * 60);
    else if (retracting) this.layerTime += Math.abs(d.dE || d.dV) / (this.settings.retractSpeed || 20);
    else if (extruding) this.layerTime += (Math.max(0, d.dE) + Math.max(0, d.dV)) / speed;

    var feature = this.feature || { type: 'UNKNOWN', entity: 'UNKNOWN' };
    var width = this.beadWidthFor(feature.entity);
    var height = this.layerHeight();

    // ---- Z-hop bookkeeping (issue #29) ----
    if (!extruding && !retracting && Math.abs(dz) > 0.05) {
      this.zMoveLines.push(this.lineNo);
      if (dz > 0.05 && this.hopArmed) {
        this.pendingHop = { line: this.lineNo, dz: dz, z0: this.pos.z, z1: z, noRetract: !this.retracted };
      } else if (dz < -0.05 && this.pendingHop) {
        this.completeHop(z);
      }
    }

    if (extruding) {
      var b = this.stats.bbox;
      if (x < b.minx) b.minx = x;
      if (x > b.maxx) b.maxx = x;
      if (y < b.miny) b.miny = y;
      if (y > b.maxy) b.maxy = y;

      this.stats.extrudeMoves++;
      this.hopArmed = true;
      this.retracted = false;
      this.lastAxis = axis;
      this.prevWasExtrusion = true;
      if (axis === 'E') {
        this.stats.plasticMm += d.dE;
        this.stats.plasticVolMm3 += d.dE * Math.PI * Math.pow(this.settings.filamentDiameter / 2, 2);
      } else {
        if (a.U !== undefined) {
          var du = Math.max(0, d.dU);
          this.stats.fiberMoves++;
          if (du > 0) {
            this.stats.fiberMm += du;
            // Every positive U word is fibre that left the spool, whether or not
            // it reached the part. A U feed with no XY motion is the air prime
            // (`G1 F1200 U55 ; Extrude restart`) that pushes the 54.8 mm tail
            // through the path: real consumption, zero deposition.
            this.fiberFed += du;
            if (dist > 0) {
              this.fiberDeposited += du;
              if (this.firstFiberLayer === null) this.firstFiberLayer = this.layer;
              if (this.layer === 1) {
                var fn = this.featureName || '(unsectioned)';
                this.fiberOnLayer1[fn] = (this.fiberOnLayer1[fn] || 0) + du;
                if (!this.fiberLayer1First) {
                  this.fiberLayer1First = { line: this.lineNo, feature: fn, mm: du };
                }
              }
            } else {
              this.fiberRestart += du;
            }
          }
        }
        if (a.V !== undefined) this.stats.matrixMm += Math.max(0, d.dV);
      }
      this.layerExtrude += Math.max(0, d.dE) + Math.max(0, d.dV);
      this.pendingHop = null;

      // Checks that need the pre-move coverage state run *before* stamping.
      if (dist > 0) {
        this.onExtrusionMove(p, feature, width, height, dist, speed, d, x, y);
      }
      if (this.raster && dist > 0) this.raster.stamp(this.pos.x, this.pos.y, x, y, width, !!feature.wall);
    } else if (retracting) {
      this.retracted = true;
      this.stats.retractEvents++;
      this.retractLines.push(this.lineNo);
      this.prevWasExtrusion = false;
    } else if (dist > 0) {
      this.onTravel(p, dist, x, y);
      this.prevWasExtrusion = false;
      // A travel ends the printed path, so it ends any unsupported run.
      this.flushUnsupRun();
    }

    if (a.E !== undefined) this.lastE = this.absE ? a.E : this.lastE + a.E;
    this.pos.x = x; this.pos.y = y; this.pos.z = z; this.pos.f = f;
  };

  Inspector.prototype.layerHeight = function () {
    if (this.layers.length && this.layerZ > this.layers[this.layers.length - 1].z) {
      var h = this.layerZ - this.layers[this.layers.length - 1].z;
      if (h > 0.02 && h < 2) return h;
    }
    return this.settings.macroLayerHeight || 0.2;
  };

  /*
   * Issue #1 post-pass: resolve the tiered classification over the collected
   * population, then emit the individually reportable defects.
   *
   * The historical Z-hop classification uses a ±3-line window. A hop alone
   * cannot stop ooze, so hopped crossings without retraction are also reported.
   * The same pass finds the emission-ordering defect: a
   * retraction written 1–3 lines *after* an unprotected risk travel means the
   * nozzle already crossed the gap loaded.
   */
  Inspector.prototype.c01Pass = function () {
    var zs = this.zMoveLines, rl = this.retractLines;
    var nz = zs.length, nr = rl.length;
    function inWindow(arr, n, line, lo, hi) {
      // binary search for the first entry >= lo, then scan while <= hi
      var a = 0, b = n;
      while (a < b) { var m = (a + b) >> 1; if (arr[m] < lo) a = m + 1; else b = m; }
      for (var i = a; i < n && arr[i] <= hi; i++) if (arr[i] >= lo) return true;
      return false;
    }
    var worst = 0, worstLine = 0, hoppedCount = 0, hoppedWorst = null;
    for (var i = 0; i < this.riskTravels.length; i++) {
      var t = this.riskTravels[i];
      var hop = inWindow(zs, nz, t.line, t.line - 3, t.line + 3);
      t.hop = hop;
      this.riskClass[t.cls]++;
      if (hop) this.riskZhop[t.cls]++;
      if (t.cls === 'solid') continue;
      this.riskDefects++;
      if (hop && t.dist >= this.minTravel) {
        hoppedCount++;
        if (!hoppedWorst || t.dist > hoppedWorst.dist) hoppedWorst = t;
      }
      if (!hop) {
        this.unmitigated++;
        if (t.dist > worst) { worst = t.dist; worstLine = t.line; }
        if (t.dist >= this.minTravel) {
          var sev = t.dist >= 20 ? 'critical' : (t.dist >= 8 ? 'warning' : 'info');
          this.add('C01', sev, t.line, t.layer,
            'Un-retracted plastic travel ' + (t.cls === 'air' ? 'over open air' : 'across void') +
            ' of ' + t.dist.toFixed(1) + ' mm (stringing risk)',
            t.code + ' at line ' + t.line + ' \u2014 no retraction, no Z-hop' +
            (t.feat ? ', ' + t.feat : ''));
          this.worstSet('C01', t.dist);
        }
        // Retraction written *after* the move: emitter ordering defect.
        if (inWindow(rl, nr, t.line, t.line + 1, t.line + 3)) {
          this.orderDefects++;
          if (this.orderDefects <= 40) {
            this.add('C01', 'warning', t.line, t.layer,
              'Retraction emitted AFTER the travel move (emitter ordering defect)',
              'travel at line ' + t.line + ' (' + t.dist.toFixed(1) + ' mm, ' + t.cls +
              ') is followed by a retraction within 3 lines');
          }
        }
      }
    }
    if (hoppedWorst) {
      this.add('C01', 'info', hoppedWorst.line, hoppedWorst.layer,
        hoppedCount + ' unretracted plastic crossing(s) with a nearby Z-hop; longest ' +
        hoppedWorst.dist.toFixed(1) + ' mm (stringing risk remains)',
        hoppedWorst.code + ' \u2014 Z-hop observed; a lift does not stop ooze; no prior retraction');
      this.worstSet('C01', hoppedWorst.dist);
    }
    this.riskZhopTotal = this.riskZhop.solid + this.riskZhop.void + this.riskZhop.air;
    this.riskWorst = worst;
    this.riskWorstLine = worstLine;
  };

  Inspector.prototype.completeHop = function (zBack) {
    var h = this.pendingHop;
    this.pendingHop = null;
    if (!h) return;
    if (Math.abs(zBack - h.z0) > 0.05) return;   // not a return-to-height hop
    if (h.dz > 2) return;                        // tool-change / clearance lift
    if (this.inToolChange) return;
    if (this.lastAxis !== 'E') return;           // plastic travel hops only
    this.hopCount++;
    if (h.noRetract) this.hopNoRetract++;
    if (this.settings.doZHop === false) {
      this.hopCountDisabled++;
      if (!this.hopDisabledFirst) {
        this.hopDisabledFirst = {
          line: h.line, layer: this.layer, dz: h.dz,
          z0: h.z0, z1: h.z1, z2: zBack, noRetract: h.noRetract
        };
      }
    }
  };

  /*
   * Issue #1 — the stringing-risk population.
   *
   * The report defines the population as plastic travels that *immediately*
   * follow a plastic extrusion with no retraction between them, then tiers the
   * result by what each path crosses. We use that definition with two
   * documented refinements:
   *
   *   - Support sections are excluded. Support is broken away and its travel is
   *     wiped by design; counting it inflates the total with moves nobody would
   *     call a stringing defect (20% of L1's travels).
   *   - Travels shorter than `minTravel` are tiered but not reported
   *     individually: a 0.3 mm hop between collinear wall segments cannot
   *     strand a visible thread.
   *
   * Z-hop classification uses the report's own window: a Z move greater than 0.05 mm
   * within three G-code lines before or after the travel. Because that window
   * extends forwards, classification is resolved in `c01Pass()` after the scan.
   */
  Inspector.prototype.onTravel = function (p, dist, x, y) {
    this.stats.travelMoves++;
    var cls = this.raster ? this.raster.classifyTravel(this.pos.x, this.pos.y, x, y) : 'solid';
    this.travelClass[cls]++;
    if (!this.retracted && this.lastAxis === 'E') this.unretractedTravels++;

    var immediate = this.prevWasExtrusion && this.lastAxis === 'E';
    var inSupport = this.feature && this.feature.type === 'SUPPORT';

    if (immediate) {
      this.unretractedImmediate++;
      if (!inSupport) {
        this.riskTravels.push({
          line: this.lineNo, layer: this.layer, dist: dist, cls: cls,
          code: p.code, feat: this.featureName
        });
      }
    }
    this.lastTravel = { line: this.lineNo, dist: dist, cls: cls };
  };

  Inspector.prototype.onExtrusionMove = function (p, feature, width, height, dist, speed, d, x, y) {
    // --- volumetric flow (issue #4) ---
    var matrix = feature.type === 'FIBER' || d.dU > 0 || d.dV > 0;
    var flow = D.flowSettings(this.settings, feature.entity, matrix);
    var ceiling = flow.maxVolumetricSpeed || GENERIC_CEILING[flow.material] || 12;
    var source = flow.maxVolumetricSpeed ? 'exported profile limit' : 'generic fallback ceiling';
    // E and V are filament length, not deposited bead length. U is fibre and
    // contributes no plastic volume. Convert using the feeding filament area.
    var feed = Math.max(0, matrix ? d.dV : d.dE);
    var feedMm3 = feed / dist * Math.PI * Math.pow(flow.filamentDiameter / 2, 2) * speed;
    if (feedMm3 > this.stats.maxFlow) { this.stats.maxFlow = feedMm3; this.stats.maxFlowLine = this.lineNo; }

    if (feedMm3 > ceiling) {
      var dt = dist / speed;
      this.sustained.t += dt;
      this.sustained.v += feedMm3 * dt;
      if (this.sustained.t >= this.sustainedWindow) {
        var avg = this.sustained.v / this.sustained.t;
        this.sustained.t = 0; this.sustained.v = 0;
        if (avg > ceiling) {
          var sev = avg >= ceiling * this.flowCritical ? 'critical' : 'warning';
          this.add('C04', sev, this.lineNo, this.layer,
            'Sustained volumetric demand ' + avg.toFixed(1) + ' mm\u00b3/s against a ' +
            ceiling + ' mm\u00b3/s ' + (flow.material || 'generic') + ' ' + source,
            p.code + ' F' + (p.args.F || Math.round(this.pos.f)) + ' \u2014 ' + feature.type +
            ', ' + width + 'x' + height.toFixed(2) + ' mm bead');
          this.worstSet('C04', avg);
        }
      }
    } else {
      this.sustained.t = 0; this.sustained.v = 0;
    }

    // --- unsupported runs (issue #6) ---
    //
    // A run is one *contiguous printed path*: it accumulates while the nozzle
    // keeps extruding without support and ends at the first supported segment,
    // travel, feature change or layer change. Reporting the *completed* length
    // (not the length at the moment the threshold is crossed) is what makes the
    // magnitudes comparable to issue #6, which quotes whole-run lengths.
    //
    // A closed loop laid over open space counts its whole perimeter — the
    // report's own convention, "16 mm unsupported runs" for a 17.5 x 13 mm
    // rectangle — while two separate bridges do not add up. Plastic only: fiber
    // deposition has its own mechanics.
    var skip = feature.type === 'SUPPORT' || feature.type === 'SKIRT' ||
               feature.type === 'BRIM' || feature.type === 'PRIMING' ||
               feature.type === 'WIPE';
    if (this.raster && this.layer > 1 && !skip && d.dE > 0) {
      if (this.segmentUnsupported(this.pos.x, this.pos.y, x, y,
                                  this.supportRadius, this.supportDepth)) {
        if (this.unsupRun === 0) {
          this.unsupStartLine = this.lineNo;
          this.unsupStartLayer = this.layer;
          this.unsupFeature = feature.type;
          this.unsupFanAtStart = this.partFan() > 0;
          this.unsupFeed = this.pos.f;
        }
        this.unsupRun += dist;
        if (this.unsupRun > this.unsupMax) this.unsupMax = this.unsupRun;
        if (!this.unsupFanAtStart) this.unsupFanOff += dist;
      } else {
        this.flushUnsupRun();
      }
    } else if (skip) {
      // Switching into support/skirt/brim/priming/wipe plastic interrupts the
      // printed path being measured, so it ends the run.
      this.flushUnsupRun();
    }
  };

  /*
   * Close the current unsupported run and raise the finding if it reached the
   * issue #6 floor. Called when the run is broken by supported plastic, a
   * travel, a feature change or a layer change.
   */
  Inspector.prototype.flushUnsupRun = function () {
    var len = this.unsupRun;
    if (len >= this.minUnsupported) {
      this.unsupRuns++;
      this.add('C06', len >= 40 ? 'critical' : 'warning', this.unsupStartLine, this.unsupStartLayer,
        'Unsupported printed run of ' + len.toFixed(1) + ' mm' +
        (this.unsupFanAtStart ? '' : ' with the part fan off'),
        this.unsupFeature + ' section at F' + Math.round(this.unsupFeed) +
        (this.unsupFanAtStart ? ', fan on' : ', part fan off'));
      this.worstSet('C06', len);
    }
    this.unsupRun = 0;
    this.unsupReported = false;
  };

  Inspector.prototype.segmentUnsupported = function (x0, y0, x1, y1, radius, depth) {
    var dx = x1 - x0, dy = y1 - y0;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return false;
    var n = Math.max(1, Math.ceil(len / 0.5)), bad = 0;
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      if (!this.raster.supported(x0 + dx * t, y0 + dy * t, radius, depth)) bad++;
    }
    return bad / (n + 1) > 0.9;
  };

  Inspector.prototype.finish = function () {
    this.flushUnsupRun();
    if (this.layerStart) this.closeLayer();
    if (this.m1001Open > 0) {
      this.add('C08', 'warning', 0, null,
        this.m1001Open + ' M1001 fiber window(s) never closed by M1002', '');
    }
    if (this.m1001 > 0) {
      this.add('C08', 'critical', 0, null,
        this.m1001 + ' \u00d7 M1001 / ' + this.m1002 + ' \u00d7 M1002 emitted \u2014 no firmware handler exists (issue #9)',
        'fiber-feed windows bracketed by unimplemented commands' +
        (this.m1001NoL ? '; ' + this.m1001NoL + ' M1001 without an L parameter' : ''));
    }
  };

  // ---- derived checks, after the pass ------------------------------------
  Inspector.prototype.postChecks = function () {
    var s = this.settings;

    // C01 tiered travel classification (issue #1)
    this.c01Pass();

    // C10 Z-hop against the exported setting (issue #29). One finding per file:
    // the defect is the disagreement itself, and the count is the magnitude.
    if (this.hopCountDisabled > 0) {
      var f10 = this.hopDisabledFirst;
      // Rocket keeps its original wording; a flat-config file names the key it
      // actually read, since `Profile.DoZHop` does not exist in that dialect.
      var hopSetting = s.settingsSource === 'session'
        ? 'Profile.DoZHop=false' : s.doZHopKey + '=off';
      var hopHeightLabel = s.settingsSource === 'session' ? 'ZhopP=' : 'hop height ';
      this.add('C10', 'critical', f10.line, f10.layer,
        this.hopCountDisabled + ' plastic travel Z-hops of ' + f10.dz.toFixed(2) +
        ' mm emitted while ' + hopSetting,
        'first at line ' + f10.line + ': Z' + f10.z0.toFixed(3) + ' \u2192 Z' + f10.z1.toFixed(3) +
        ' \u2192 Z' + f10.z2.toFixed(3) + ' (' + hopHeightLabel + this.settings.zhopP +
        (f10.noRetract ? ', no preceding retraction' : '') + ')');
      this.worstSet('C10', this.hopCountDisabled);
    }

    // C07 motion contract (issue #8)
    /*
     * Issue #8 is about Rocket Slicer leaning on firmware defaults. On a Klipper
     * target the contract is declared with `SET_VELOCITY_LIMIT`, not with Marlin
     * verbs, so demanding M204/M205/M203 there is a dialect assumption rather
     * than a finding. Suppression is keyed on a line that actually declares the
     * acceleration limit (`ACCEL=`), the M204 analogue: Rocket's own
     * `SET_VELOCITY_LIMIT MINIMUM_CRUISE_RATIO=0.8` declares no acceleration, so
     * Rocket files keep the findings they have always raised.
     */
    var klipperContract = this.klipperAccelLine > 0;
    if (klipperContract) {
      this.add('C07', 'info', this.klipperAccelLine, null,
        'Motion contract declared in Klipper form (SET_VELOCITY_LIMIT with ACCEL) \u2014 ' +
        'M204/M205/M203 are not the mechanism on this target',
        'SET_VELOCITY_LIMIT at line ' + this.klipperAccelLine + ' replaces the Marlin verbs');
    }
    if (this.m204 === null && !klipperContract) {
      this.add('C07', 'warning', 0, null, 'No M204 acceleration command anywhere in the file', '');
    } else if (this.m204 !== null && this.m204.line > 200) {
      this.add('C07', 'warning', this.m204.line, null,
        'First M204 (acceleration regime) appears at line ' + this.m204.line +
        ' \u2014 past the header/preamble, so generic tools parse default values',
        'M204 S' + this.m204.value);
    }
    if (this.m205 === 0 && !klipperContract) {
      this.add('C07', 'warning', 0, null, 'No M205 (jerk) command in the file', '');
    }
    if (this.m203 === 0 && !klipperContract) {
      this.add('C07', 'warning', 0, null, 'No M203 (max feedrate) command in the file', '');
    }
    if (/SET_VELOCITY_LIMIT|SET_PRESSURE_ADVANCE/.test(s.startGCode) && this.klipperMotionLines === 0) {
      this.add('C07', 'warning', 0, null,
        'Klipper motion limits (SET_VELOCITY_LIMIT / SET_PRESSURE_ADVANCE) exist only as a header echo, not as executable lines',
        'profile StartGCode contains them but no such command was emitted');
    }

    // C04 header-derived nominal wall flow (issue #4 corroboration)
    if (s.inset0Speed && s.inset0EWMM) {
      var wallFlow = D.flowSettings(s, 'INSET0');
      var ceiling = wallFlow.maxVolumetricSpeed || GENERIC_CEILING[wallFlow.material] || 12;
      var wallHeight = s.inset0Height || s.macroLayerHeight || 0.2;
      var nominal = s.inset0EWMM * wallHeight * s.inset0Speed;
      if (nominal > ceiling) {
        this.add('C04', 'warning', 0, null,
          'Header Inset0Speed=' + s.inset0Speed + ' mm/s on a ' + s.inset0EWMM + ' \u00d7 ' +
          wallHeight + ' mm bead = ' + nominal.toFixed(1) +
          ' mm\u00b3/s nominal wall demand vs a ' + ceiling + ' mm\u00b3/s ' +
          (wallFlow.maxVolumetricSpeed ? 'exported profile limit' : 'generic fallback ceiling'),
          'profile speed and rectangular bead estimate; actual emitted flow is checked separately');
        this.worstSet('C04', nominal);
      }
    }

    // C02 seam clustering (issue #2)
    var sc = this.seamClusters();
    this.seamClusterCount = sc.clusters;
    if (sc.run >= this.minSeamRun) {
      this.add('C02', sc.run >= 40 ? 'critical' : 'warning', sc.line, sc.layer,
        'Seam repeated at the same XY for ' + sc.run + ' consecutive layers at X' +
        sc.x.toFixed(3) + ' Y' + sc.y.toFixed(3),
        'EnableAdjustSeamDistributionPositionPlastic=' + s.seamDistributionPlastic);
      this.worstSet('C02', sc.run);
    }

    // C09 firmware contract (issues #10 / #11)
    Object.keys(this.customVerbs).forEach(function (v) {
      if (v === 'CASE_FAN') {
        this.add('C09', 'critical', 0, null,
          'CASE_FAN used ' + this.customVerbs[v] + ' time(s) but is not defined in the firmware contract (issue #11)', '');
      } else {
        this.add('C09', 'warning', 0, null,
          'Undefined command ' + v + ' used ' + this.customVerbs[v] +
          ' time(s) \u2014 not part of the documented dialect', '');
      }
    }, this);
    if (/CASE_FAN/.test(s.startGCode) || /CASE_FAN/.test(s.endGCode)) {
      this.add('C09', 'critical', 0, null,
        'CASE_FAN referenced by the exported start/end gcode but not defined (issue #11)', '');
    }
    if (/toolhead_temp/.test(s.startGCode)) {
      this.add('C09', 'warning', 0, null,
        'Start gcode references toolhead_temp where a chamber reading is expected (issue #10)', '');
    }

    // C11 geometry sanity
    var b = this.stats.bbox;
    if (b.minx <= b.maxx) {
      if (b.minx < 0 || b.miny < 0 || b.maxx > s.areaX || b.maxy > s.areaY) {
        this.add('C11', 'critical', 0, null,
          'Deposited geometry leaves the declared build area ' + s.areaX + '\u00d7' + s.areaY,
          'bbox X ' + b.minx.toFixed(1) + '\u2013' + b.maxx.toFixed(1) +
          ' Y ' + b.miny.toFixed(1) + '\u2013' + b.maxy.toFixed(1));
      }
    } else {
      this.add('C11', 'critical', 0, null, 'No extrusion moves found \u2014 file did not parse as G-code', '');
    }
    if (this.header.layerCount && this.layers.length && this.header.layerCount !== this.layers.length) {
      this.add('C11', 'warning', 0, null,
        'Header LAYER_COUNT=' + this.header.layerCount + ' but ' + this.layers.length +
        ' ; LAYER: markers parsed', 'layer markers are the authority (GCODE_REFERENCE \u00a74)');
    }
    if (this.layers.length === 0) {
      this.add('C11', 'critical', 0, null,
        'No ; LAYER: markers parsed \u2014 layer detection must tolerate the space after ";"', '');
    }
    // An Orca/Prusa role the map does not know must be reported, not silently
    // attributed to no feature: every geometry-dependent rule reads the label.
    var unknownTypes = Object.keys(this.unknownTypes);
    if (unknownTypes.length) {
      unknownTypes.sort(function (a, b) { return this.unknownTypes[b] - this.unknownTypes[a]; }.bind(this));
      this.add('C11', 'warning', 0, null,
        'Unrecognised ;TYPE: role(s) \u2014 geometry in them is attributed to no feature: ' +
        unknownTypes.slice(0, 5).map(function (k) {
          return k + ' (' + this.unknownTypes[k] + ')';
        }, this).join(', '),
        'extend Dialect.TYPE_FEATURES');
    }

    // C12 / C13 / C14 / C15 — the owner-requested print-contract report rules.
    this.c12Check();
    this.c13Check();
    this.c14Check();
    this.c15Check();
  };

  /*
   * C12 — carbon on the first layer.
   *
   * Owner rule (2026-10-03): "unless it's a fortified print, carbon should not
   * be the first layer". Fortified means the fibre *is* the part's own skin, so
   * it has to start at layer 1; everywhere else a first-layer fibre deposit is
   * a process defect — carbon at the bed interface gives poor adhesion and a
   * rough bottom face.
   *
   * The distinction that matters is structural vs sacrificial. A `Priming line`
   * or `Skirt`/`Brim`/`Wipe tower` fibre pass on layer 1 is the documented
   * head-loading dance: it is on the bed, but it is not the part's first layer.
   * Those are reported as info, not as violations. Fibre inside a wall or
   * infill feature on layer 1 of a non-fortified print is the violation.
   */
  Inspector.prototype.c12Check = function () {
    var feats = Object.keys(this.fiberOnLayer1);
    this.c12 = {
      fortified: !!this.settings.fortified,
      structuralMm: 0, sacrificialMm: 0, structural: [], sacrificial: [],
      firstLine: null, violation: false, verdict: 'none'
    };
    if (!feats.length) {
      this.add('C12', 'info', 0, 1, 'No fibre on layer 1 \u2014 first layer is plastic-only',
        'first fibre layer ' + (this.firstFiberLayer === null ? 'none' : this.firstFiberLayer));
      return;
    }
    var SACRIFICIAL = { SKIRT: 1, BRIM: 1, PRIMING: 1, WIPE: 1 };
    var structural = [], sacrificial = [];
    var sMm = 0, xMm = 0;
    feats.forEach(function (f) {
      var type = D.FEATURES[f] ? D.FEATURES[f].type : 'UNKNOWN';
      var mm = this.fiberOnLayer1[f];
      if (SACRIFICIAL[type]) { sacrificial.push(f + ' ' + mm.toFixed(1)); sMm += mm; }
      else { structural.push(f + ' ' + mm.toFixed(1)); xMm += mm; }
    }, this);
    function names(arr) { return arr.map(function (s) { return s.replace(/ [\d.]+$/, ''); }); }
    var violation = !this.settings.fortified && xMm > 0;
    this.c12 = {
      fortified: !!this.settings.fortified,
      structuralMm: xMm, sacrificialMm: sMm,
      structural: names(structural), sacrificial: names(sacrificial),
      firstLine: this.fiberLayer1First ? this.fiberLayer1First.line : null,
      violation: violation,
      // One verdict string shared by CLI, browser and report so the three can
      // never disagree. Precedence matters: a fortified *configuration* with no
      // structural fibre on layer 1 (Benchy_renforced_level5-pla) is not
      // "fortified fibre on L1" — it is simply a plastic first layer.
      verdict: violation ? 'violation'
        : (this.settings.fortified && xMm > 0) ? 'permitted-fortified'
        : 'sacrificial-only'
    };

    if (this.settings.fortified) {
      this.add('C12', 'info', this.fiberLayer1First.line, 1,
        'Fibre on layer 1 (' + xMm.toFixed(1) + ' mm deposited) \u2014 permitted: this is a fortified print',
        'CurrentSliceType=' + this.settings.currentSliceType +
        ' MustGenerateFiberPerimeters=' + this.settings.mustGenerateFiberPerimeters +
        '; ' + (structural.concat(sacrificial).join(', ') || 'none'));
      return;
    }
    if (structural.length) {
      this.add('C12', 'critical', this.fiberLayer1First.line, 1,
        xMm.toFixed(1) + ' mm of fibre deposited in part geometry on layer 1 of a non-fortified print',
        'features: ' + structural.join(', ') + '; first fibre move at line ' +
        this.fiberLayer1First.line + ' (' + this.fiberLayer1First.feature + ')' +
        (sacrificial.length ? '; also sacrificial: ' + sacrificial.join(', ') : '') +
        '; CurrentSliceType=' + this.settings.currentSliceType +
        ' MustGenerateFiberPerimeters=' + this.settings.mustGenerateFiberPerimeters);
      this.worstSet('C12', xMm);
    } else {
      this.add('C12', 'info', this.fiberLayer1First.line, 1,
        'Fibre on layer 1 is confined to the sacrificial priming/skirt pass (' +
        sMm.toFixed(1) + ' mm) \u2014 the part\u2019s first layer is plastic',
        sacrificial.join(', ') + '; first fibre move at line ' + this.fiberLayer1First.line);
    }
  };

  /*
   * C13 — dual-tool or single-tool?
   *
   * Three independent signals, reported together because they do not always
   * agree: the `; PRINTING_MODE:` header, the `T0`/`T1` commands actually
   * issued, and which extrusion axis (E vs U) actually deposited material.
   * `Benchy_fortified.gcode` is the instructive case: the header says
   * "Composite Only" yet the file issues 136 `T1` changes and deposits 2.87 m
   * of plastic, because the tool-change dance and the plastic wet-out matrix
   * still run. A header-only answer would be wrong in both directions, so the
   * verdict is derived from observed deposition and the header is reported as
   * corroboration or contradiction.
   */
  Inspector.prototype.c13Check = function () {
    var mode = this.header.mode || null;
    var usesPlastic = this.stats.plasticMm > 0;
    var usesFiber = this.fiberFed > 0;
    var observed = usesPlastic && usesFiber ? 'dual' : usesFiber ? 'fiber-only' : usesPlastic ? 'plastic-only' : 'none';
    var declared = !mode ? null
      : /and\s*Composite/i.test(mode) ? 'dual'
      : /Composite\s*Only/i.test(mode) ? 'fiber-only'
      : /Plastic\s*Only/i.test(mode) ? 'plastic-only' : null;

    this.c13Verdict = {
      mode: mode, declared: declared, observed: observed,
      t0: this.t0, t1: this.t1,
      plasticMm: this.stats.plasticMm, fiberFedMm: this.fiberFed
    };

    var label = observed === 'dual' ? 'dual-tool (FFF + CFC fibre)'
      : observed === 'fiber-only' ? 'fibre-only (CFC tool; plastic tool idle)'
      : observed === 'plastic-only' ? 'single-tool FFF (no fibre deposited)'
      : 'no deposition parsed';
    this.add('C13', 'info', 0, null,
      'Tool configuration: ' + label + ' \u2014 T0\u00d7' + this.t0 + ' / T1\u00d7' + this.t1 +
      ', plastic ' + (this.stats.plasticMm / 1000).toFixed(2) + ' m, fibre ' +
      (this.fiberFed / 1000).toFixed(2) + ' m fed',
      '; PRINTING_MODE: ' + (mode || 'absent') + ' (declares ' + (declared || 'unknown') + ')');

    if (declared && declared !== observed && !(declared === 'fiber-only' && observed === 'dual')) {
      this.add('C13', 'warning', 0, null,
        'Header ; PRINTING_MODE: "' + mode + '" declares ' + declared +
        ' but the file deposits ' + observed,
        'T0\u00d7' + this.t0 + ' T1\u00d7' + this.t1 + ' \u00b7 plastic ' +
        (this.stats.plasticMm / 1000).toFixed(2) + ' m \u00b7 fibre ' +
        (this.fiberFed / 1000).toFixed(2) + ' m');
    }
    // "Composite Only" that still drives the plastic tool is a documented
    // dialect quirk, not a defect: report it as info so the reader is not
    // misled by the header alone.
    if (declared === 'fiber-only' && observed === 'dual') {
      this.add('C13', 'info', 0, null,
        'Header says "Composite Only" but the plastic tool is used \u2014 the fibre wet-out matrix and tool-change dance still drive T1',
        'plastic ' + (this.stats.plasticMm / 1000).toFixed(2) + ' m deposited across ' + this.t1 + ' T1 changes');
    }
  };

  /*
   * C14 — fibre consumption and cut count.
   *
   * Three numbers, deliberately kept apart because they answer different
   * questions:
   *
   *   fed        every positive `U` word. What left the spool.
   *   deposited  positive `U` on a move with XY motion. What went into the part.
   *   restart    positive `U` with no XY motion (`G1 F1200 U55 ; Extrude
   *              restart`). Air prime that pushes the 54.8 mm post-cut tail
   *              through the path before deposition resumes.
   *
   * The slicer's own `MATERIAL_PRINT_DATA` tow `Length` reconciles with
   * `deposited` exactly (verified to 6 significant digits on every fibre file
   * in the corpus), which is what makes `fed - deposited` trustworthy as the
   * restart overhead rather than a parse error.
   *
   * Cuts are `M2800` blade fires. One per fibre segment, so the count is
   * cross-checked against the `M1001` windows that opened those segments.
   */
  Inspector.prototype.c14Check = function () {
    var fed = this.fiberFed, dep = this.fiberDeposited, rst = this.fiberRestart;
    var mat = D.materialSummary(this.materialData);
    var declaredM = mat.tow ? mat.tow.lengthM : null;
    this.c14 = {
      fedMm: fed, depositedMm: dep, restartMm: rst, restartShare: fed > 0 ? rst / fed : 0,
      cuts: this.cuts, tailMm: this.cutDistLast, tailTotalMm: this.cutDistMm,
      tailOrphans: this.cutDistOrphan, declaredTowM: declaredM,
      declaredPlasticM: mat.plastic ? mat.plastic.lengthM : null,
      towName: mat.tow ? mat.tow.name : null
    };

    if (fed <= 0) {
      this.add('C14', 'info', 0, null,
        'No fibre consumed \u2014 0 mm fed, 0 cuts' +
        (declaredM !== null ? ' (slicer declares ' + declaredM.toFixed(2) + ' m tow)' : ''),
        'single-tool FFF print; the CFC tool never fed');
      if (this.cuts > 0) {
        this.add('C14', 'warning', 0, null,
          this.cuts + ' M2800 cut(s) issued on a print that never fed fibre', '');
      }
      return;
    }

    this.add('C14', 'info', 0, null,
      'Fibre: ' + (fed / 1000).toFixed(2) + ' m fed \u2014 ' + (dep / 1000).toFixed(2) +
      ' m deposited in the part, ' + (rst / 1000).toFixed(2) + ' m (' +
      (100 * rst / fed).toFixed(0) + ' %) air-primed through the head' +
      (declaredM !== null ? '; slicer declares ' + declaredM.toFixed(2) + ' m' : ''),
      'fed=\u03a3U, deposited=\u03a3U on moves with XY motion, restart=\u03a3U with no XY motion' +
      (declaredM !== null ? '; MATERIAL_PRINT_DATA tow Length=' + declaredM.toFixed(6) + ' m' : ''));
    this.add('C14', 'info', 0, null,
      this.cuts + ' fibre cut(s) (M2800)' +
      (this.cutDistLast !== null ? ', tail constant ' + this.cutDistLast.toFixed(1) + ' mm' : '') +
      (this.cuts ? ' \u2014 ' + (this.cutDistMm / 1000).toFixed(2) + ' m of trimmed tail' : ''),
      'M2800 count; ;CUT DISTANCE sum ' + this.cutDistMm.toFixed(0) + ' mm' +
      (this.cutDistOrphan ? '; ' + this.cutDistOrphan + ' ;CUT DISTANCE comment(s) with no preceding M2800 (end-gcode echo)' : ''));
    this.worstSet('C14', fed / 1000);

    // Cross-checks: the slicer's declared consumption and the segment/cut parity.
    if (declaredM !== null) {
      var diff = Math.abs(dep / 1000 - declaredM);
      if (diff > 0.01) {
        this.add('C14', 'warning', 0, null,
          'Measured fibre deposition ' + (dep / 1000).toFixed(2) + ' m disagrees with the slicer\u2019s declared ' +
          declaredM.toFixed(2) + ' m by ' + diff.toFixed(2) + ' m',
          'expected \u03a3U(XY) == MATERIAL_PRINT_DATA tow Length');
      }
    }
    if (this.m1001 > 0 && this.cuts < this.m1001) {
      this.add('C14', 'warning', 0, null,
        this.m1001 + ' fibre segment(s) opened (M1001) but only ' + this.cuts +
        ' cut(s) issued \u2014 a segment ended uncut',
        'every fibre segment must close with M2800 (Exploration/FibreUsage.md \u00a75.7)');
      this.worstSet('C14', this.m1001 - this.cuts);
    }
  };

  /*
   * C15 — machine-assist flags.
   *
   * The machine has AI/spaghetti detection, a piezo bed-mesh front end,
   * resonance testing and filament runout sensors (Exploration/HardwareInfo.md;
   * ERROR_CODES.md 10072\u201310074 and the 30000-series). None of them are exported
   * in the SESSION echo \u2014 the exported profile vocabulary is slicing geometry
   * and motion only \u2014 so the only evidence a print can carry is an executable
   * command. Absence therefore means "not requested by this file", not "not
   * configured on the machine": homing and meshing normally happen before the
   * file starts. The finding says exactly that.
   */
  Inspector.prototype.c15Check = function () {
    var present = [], absent = [];
    D.MACHINE_FLAGS.forEach(function (f) {
      var h = this.flagHits[f.key];
      if (h) present.push(f.label + ' \u00d7' + h.count + ' @line ' + h.line);
      else absent.push(f.label);
    }, this);
    this.c15 = {
      present: D.MACHINE_FLAGS.filter(function (f) { return this.flagHits[f.key]; }, this)
        .map(function (f) { return { key: f.key, label: f.label, count: this.flagHits[f.key].count, line: this.flagHits[f.key].line }; }, this),
      absent: absent
    };
    if (present.length) {
      this.add('C15', 'info', 0, null,
        present.length + ' of ' + D.MACHINE_FLAGS.length + ' machine-assist flags present: ' +
        present.join('; '),
        'detected as executable commands, not header echoes');
    } else {
      this.add('C15', 'info', 0, null,
        'No machine-assist flag present \u2014 none of the ' + D.MACHINE_FLAGS.length +
        ' recognised commands appear as executable lines',
        'absent: ' + absent.join(', ') +
        '; absence means not requested by this file, not unconfigured on the machine' +
        ' (homing/meshing normally run before the print)');
    }
  };

  Inspector.prototype.seamClusters = function () {
    if (!this.seams.length) return { run: 0, clusters: 0, x: 0, y: 0, layer: 0, line: 0 };
    var byXY = {};
    for (var i = 0; i < this.seams.length; i++) {
      var s = this.seams[i];
      var k = s.kind + '|' + (Math.round(s.x * 2) / 2).toFixed(2) + '|' + (Math.round(s.y * 2) / 2).toFixed(2);
      (byXY[k] || (byXY[k] = [])).push(s);
    }
    var best = null, clusters = 0;
    Object.keys(byXY).forEach(function (k) {
      var arr = byXY[k].slice().sort(function (a, b) { return a.layer - b.layer; });
      var run = 1, runStart = 0;
      for (var j = 1; j <= arr.length; j++) {
        if (j < arr.length && arr[j].layer === arr[j - 1].layer + 1) {
          run++;
        } else {
          if (run >= 3) clusters++;
          if (!best || run > best.run) {
            best = { run: run, x: arr[runStart].x, y: arr[runStart].y,
                     layer: arr[runStart].layer, line: arr[runStart].line };
          }
          run = 1; runStart = j;
        }
      }
    });
    if (!best) best = { run: 0, x: 0, y: 0, layer: 0, line: 0 };
    best.clusters = clusters;
    return best;
  };

  Inspector.prototype.report = function (name) {
    this.postChecks();
    var b = this.stats.bbox;
    if (b.minx > b.maxx) b = { minx: 0, miny: 0, maxx: 0, maxy: 0 };
    var byCheck = {};
    Object.keys(CHECKS).forEach(function (c) {
      byCheck[c] = {
        id: c, title: CHECKS[c].title, issue: CHECKS[c].issue,
        count: this.counts[c] || 0,
        critical: this.critByCheck[c] || 0,
        worst: this.worst[c] === undefined ? null : this.worst[c]
      };
    }, this);
    var s = this.settings;
    return {
      file: name,
      header: this.header,
      settings: {
        source: s.settingsSource,
        material: s.material, doZHop: s.doZHop, zhopP: s.zhopP, minLayerTime: s.minLayerTime,
        filamentDiameter: s.filamentDiameter, maxVolumetricSpeed: s.maxVolumetricSpeed,
        flowBySlot: s.flowBySlot || {},
        doZHopKey: s.doZHopKey, minLayerTimeKey: s.minLayerTimeKey,
        inset0Speed: s.inset0Speed, inset0EWMM: s.inset0EWMM, macroLayerHeight: s.macroLayerHeight,
        seamDistributionPlastic: s.seamDistributionPlastic,
        retractOnLayerChange: s.retractOnLayerChange,
        retractOnlyWhenCrossing: s.retractOnlyWhenCrossing,
        travelSpeedXY: s.travelSpeedXY, buildArea: [s.areaX, s.areaY], fanSchedule: s.fanSchedule,
        currentSliceType: s.currentSliceType,
        mustGenerateFiberPerimeters: s.mustGenerateFiberPerimeters,
        fortified: !!s.fortified
      },
      stats: {
        lines: this.stats.lines, bytes: this.stats.bytes,
        layers: this.layers.length, moves: this.stats.moves,
        extrudeMoves: this.stats.extrudeMoves, travelMoves: this.stats.travelMoves,
        fiberMoves: this.stats.fiberMoves, toolChanges: this.stats.toolChanges,
        plasticMm: this.stats.plasticMm, fiberMm: this.stats.fiberMm,
        plasticVolMm3: this.stats.plasticVolMm3,
        estPrintTimeSec: this.stats.printTimeSec,
        minLayerTime: this.stats.minLayerTime > 1e8 ? null : this.stats.minLayerTime,
        minLayerTimeLayer: this.stats.minLayerTimeLayer,
        maxFlow: this.stats.maxFlow, maxFlowLine: this.stats.maxFlowLine,
        bbox: b, sections: this.stats.sections,
        unretractedTravels: this.unretractedTravels,
        unretractedAfterExtrusion: this.unretractedImmediate,
        travelClass: this.travelClass,
        riskTravels: this.riskTravels.length,
        riskClass: this.riskClass,
        riskZhop: this.riskZhop,
        riskZhopTotal: this.riskZhopTotal,
        riskDefects: this.riskDefects,
        riskWorst: this.riskWorst,
        riskWorstLine: this.riskWorstLine,
        unmitigatedTravels: this.unmitigated, retractOrderDefects: this.orderDefects,
        zhopHops: this.hopCount, zhopHopsAgainstSetting: this.hopCountDisabled,
        zhopWithoutRetract: this.hopNoRetract,
        voidCells: this.stats.voidCells, voidComps: this.stats.voidComps,
        voidWallComps: this.stats.voidWallComps, voidSkipped: this.stats.voidSkipped,
        voidLayers: this.stats.voidLayers, voidWidest: this.stats.voidWidest,
        voidWidestWall: this.stats.voidWidestWall, voidArea: this.stats.voidArea,
        voidHist: this.stats.voidHist,
        unsupportedMax: this.unsupMax, unsupportedRuns: this.unsupRuns, unsupportedNoFanMm: this.unsupFanOff,
        m1001: this.m1001, m1002: this.m1002,
        m204FirstLine: this.m204 ? this.m204.line : null, m205: this.m205, m203: this.m203,
        fanEvents: this.fanEvents, seamMarkers: this.seams.length,
        seamClusters: this.seamClusterCount, customVerbs: this.customVerbs,
        // C12 \u2014 first-layer fibre, split by feature so the report can name it.
        fiberOnLayer1: this.fiberOnLayer1,
        firstFiberLayer: this.firstFiberLayer,
        fortified: !!this.settings.fortified,
        firstLayerFiber: this.c12,
        // C13 \u2014 tool configuration, header vs observed.
        tools: this.c13Verdict,
        // C14 \u2014 fibre accounting and cuts.
        fiber: this.c14,
        // C15 \u2014 machine-assist flags.
        machineFlags: this.c15
      },
      byCheck: byCheck,
      findings: this.findings,
      layers: this.layers
    };
  };

  root.FS3 = root.FS3 || {};
  root.FS3.CHECKS = CHECKS;
  root.FS3.GENERIC_CEILING = GENERIC_CEILING;
  root.FS3.Inspector = Inspector;
})(typeof self !== 'undefined' ? self : globalThis);
