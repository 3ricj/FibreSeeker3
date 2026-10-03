/*
 * FibreSeeker 3 G-code Inspector — dialect helpers
 *
 * Everything the Rocket Slicer emits that a generic G-code parser gets wrong is
 * centralised here (see GCODE_REFERENCE.md in this repository):
 *   - `U` / `V` are relative extrusion axes (a fiber move has no `E` word at all)
 *   - `P` on a G1 move is a fiber process parameter, not dwell/probe
 *   - layer markers are `; LAYER:<1-based> [<absolute Z>]` (space after `;`)
 *   - feature type comes from `; <Feature> start` comments, not `;TYPE:`
 *   - `M106 P<n> S<...>` is a multi-port fan selector
 *   - `; MATERIAL_PRINT_DATA:` is the slicer's declared per-tool material use
 *   - machine-assist features (AI detection, bed mesh, runout) can only appear
 *     as executable commands — see MACHINE_FLAGS
 *
 * OrcaSlicer / PrusaSlicer output is also recognised, because the same engine
 * has to read it: features come from `;TYPE:<role>` (TYPE_FEATURES), bead widths
 * from `; <role> extrusion width = <n>mm` header lines (TYPE_WIDTH_LINES), and
 * profile settings from a flat `; <key> = <value>` config dump (parseConfigDump
 * + flatSettings) instead of a `; SESSION:` JSON blob. The Rocket-only readers
 * are untouched, so a Rocket file never reaches the flat-config path.
 *
 * Loaded as a plain browser script (attaches to window.FS3) or via require() in Node.
 */
(function (root) {
  'use strict';

  // ---- verbs -------------------------------------------------------------
  var MOTION_VERBS = { G0: 1, G1: 1 };
  var STANDARD_G = {
    G0: 1, G1: 1, G4: 1, G10: 1, G11: 1, G21: 1, G28: 28, G90: 1, G91: 1, G92: 1
  };
  // M73 is universal progress reporting (Klipper and Marlin both implement it),
  // so flagging it as an undefined verb is noise rather than a contract finding.
  var STANDARD_M = {
    M82: 1, M83: 1, M104: 1, M106: 1, M107: 1, M109: 1, M112: 1, M115: 1, M118: 1,
    M140: 1, M141: 1, M190: 1, M191: 1, M203: 1, M204: 1, M205: 1, M220: 1, M221: 1,
    M400: 1, M600: 1, M605: 1, M73: 1, M1001: 1, M1002: 1, M2800: 1
  };
  // Macros the slicer/firmware contract documents as defined (GCODE_REFERENCE.md §3).
  var KNOWN_MACROS = {
    MOVE_TO_BRUSH_STATION: 1,
    CLEAN_NOZZLE: 1,
    MOVE_OUT_BRUSH_STATION: 1,
    SET_PRINT_STATS_INFO: 1,
    SET_PRINT_PREP_STAGE: 1,
    SET_PRESSURE_ADVANCE: 1,
    SET_VELOCITY_LIMIT: 1,
    SET_TOOL_CORNER_VELOCITY: 1,
    PRINT_START: 1,
    PRINT_RESUME: 1,
    PRINT_CANCEL: 1,
    GCODE: 1
  };

  // ---- feature sections --------------------------------------------------
  // name -> {type, entity key used for bead width, wall: is this a perimeter?}
  var FEATURES = {
    'Inset 0': { type: 'WALL', entity: 'INSET0', wall: true },
    'Inset XP': { type: 'WALL', entity: 'INSET_XP', wall: true },
    'Inset XF': { type: 'WALL', entity: 'INSET_XF', wall: true },
    'Cellular infill': { type: 'FILL', entity: 'INFILL_CELLULAR_P' },
    'Micro infill': { type: 'SOLID', entity: 'MICRO_INFILL_P' },
    'Solid infill': { type: 'SOLID', entity: 'INFILL_SOLID_P' },
    'Top most solid infill': { type: 'TOP', entity: 'INFILL_SOLID_P_TOP_MOST' },
    'Top intermediate solid infill': { type: 'TOP', entity: 'INFILL_SOLID_P_TOP_INTERMEDIATE' },
    'Bottom most solid infill': { type: 'BOTTOM', entity: 'INFILL_SOLID_P_BOTTOM_MOST' },
    'Bottom intermediate solid infill': { type: 'BOTTOM', entity: 'INFILL_SOLID_P_BOTTOM_INTERMEDIATE' },
    'Bridge solid infill': { type: 'BRIDGE', entity: 'BRIDGE_SOLID_INFILL' },
    'Overhang infill': { type: 'OVERHANG', entity: 'OVERHANG_INFILL' },
    'Overhang solid infill': { type: 'OVERHANG', entity: 'OVERHANG_SOLID_INFILL' },
    'Fiber infill': { type: 'FIBER', entity: 'INFILL_FIBER' },
    'Replace fiber plastic solid infill': { type: 'SOLID', entity: 'REPLACE_FIBER_PLASTIC_SOLID' },
    'Support thick': { type: 'SUPPORT', entity: 'SUPPORT_THICK' },
    'Support thin': { type: 'SUPPORT', entity: 'SUPPORT_THIN' },
    'Support interface': { type: 'SUPPORT', entity: 'SUPPORT_INTERFACE' },
    'Skirt': { type: 'SKIRT', entity: 'SKIRT' },
    'Brim': { type: 'BRIM', entity: 'BRIM' },
    'Priming line': { type: 'PRIMING', entity: 'FIBER_PREPARATION' },
    'Wipe tower': { type: 'WIPE', entity: 'WIPE_TOWER' }
  };

  // ---- OrcaSlicer / PrusaSlicer `;TYPE:` roles -----------------------------
  // Same contract as FEATURES: a type label plus the width key to look up in the
  // header's extrusion-width lines, and `wall` for the coverage raster. Without
  // this map every bead on an Orca file is UNKNOWN and falls back to the 0.4 mm
  // default instead of the header's declared 0.42 mm.
  var TYPE_FEATURES = {
    'Outer wall': { type: 'WALL', entity: 'INSET0', wall: true },
    'Inner wall': { type: 'WALL', entity: 'INSET_XP', wall: true },
    'Sparse infill': { type: 'FILL', entity: 'INFILL_CELLULAR_P' },
    'Internal solid infill': { type: 'SOLID', entity: 'INFILL_SOLID_P' },
    'Top surface': { type: 'TOP', entity: 'INFILL_SOLID_P_TOP_MOST' },
    'Bottom surface': { type: 'BOTTOM', entity: 'INFILL_SOLID_P_BOTTOM_MOST' },
    'Support': { type: 'SUPPORT', entity: 'SUPPORT_THICK' },
    'Support material': { type: 'SUPPORT', entity: 'SUPPORT_THICK' },
    'Support base': { type: 'SUPPORT', entity: 'SUPPORT_THICK' },
    'Support interface': { type: 'SUPPORT', entity: 'SUPPORT_INTERFACE' },
    'Support roof': { type: 'SUPPORT', entity: 'SUPPORT_INTERFACE' },
    'Skirt': { type: 'SKIRT', entity: 'SKIRT' },
    'Brim': { type: 'BRIM', entity: 'BRIM' },
    'Brim_EligibleSpace': { type: 'BRIM', entity: 'BRIM' },
    'Wipe tower': { type: 'WIPE', entity: 'WIPE_TOWER' },
    'Wipe tower purge': { type: 'WIPE', entity: 'WIPE_TOWER' },
    'Purge line': { type: 'PRIMING', entity: 'FIBER_PREPARATION' },
    // `;TYPE:Custom` brackets preamble/postamble and tool changes. It is not a
    // geometry role, so it maps to no printable feature — tracked here so it is
    // not reported as an unknown role.
    'Custom': { type: 'CUSTOM', entity: 'UNKNOWN' }
  };

  // Orca/Prusa header width lines, `; external perimeters extrusion width =
  // 0.42mm`, keyed by role text and mapped onto the FEATURES entity keys.
  var TYPE_WIDTH_LINES = {
    'external perimeters': 'INSET0',
    'perimeters': 'INSET_XP',
    'infill': 'INFILL_CELLULAR_P',
    'solid infill': 'INFILL_SOLID_P',
    'top infill': 'INFILL_SOLID_P_TOP_MOST',
    'first layer': 'FIRST_LAYER'
  };

  // Fallback bead widths (mm) when the SESSION echo has no EntitySizes entry.
  var DEFAULT_WIDTH = {
    INSET0: 0.4, INSET_XP: 0.4, INSET_XF: 0.8, INFILL_CELLULAR_P: 0.45,
    MICRO_INFILL_P: 0.4, INFILL_SOLID_P: 0.35, INFILL_SOLID_P_TOP: 0.4,
    INFILL_SOLID_P_TOP_MOST: 0.4, INFILL_SOLID_P_TOP_INTERMEDIATE: 0.4,
    INFILL_SOLID_P_BOTTOM: 0.4, INFILL_SOLID_P_BOTTOM_MOST: 0.4,
    INFILL_SOLID_P_BOTTOM_INTERMEDIATE: 0.4, BRIDGE_SOLID_INFILL: 0.4,
    OVERHANG_INFILL: 0.4, OVERHANG_SOLID_INFILL: 0.35, INFILL_FIBER: 0.8,
    REPLACE_FIBER_PLASTIC_SOLID: 0.4, SUPPORT_THICK: 0.4, SUPPORT_THIN: 0.4,
    SUPPORT_INTERFACE: 0.4, SKIRT: 0.54, BRIM: 0.4, FIBER_PREPARATION: 0.8,
    WIPE_TOWER: 0.4
  };

  // Comment-embedded numbers follow the slicer host's locale, so a file can
  // declare `; LAYER:1 [0,2]` and `; SEAM Plastic at X31,150` while the G-code
  // body still uses dots (`X81.634`). Every comment-side number goes through
  // num() so a comma decimal separator cannot silently drop a layer marker.
  var RE_LAYER = /^;\s*LAYER:(\d+)\s*\[([^\]]+)\]/;
  var RE_MACROLAYER = /^;\s*MACROLAYER:/;
  var RE_SEAM = /^;\s*SEAM\s+(Plastic|Fiber)\s+at\s+X([-\d.,]+)\s+Y([-\d.,]+)\s+Z([-\d.,]+)/;

  // Parse a comment-side number tolerating a comma decimal separator. When both
  // separators appear the comma is a thousands group, so it is simply dropped.
  function num(text) {
    if (typeof text === 'number') return text;
    var s = String(text).trim();
    if (s.indexOf(',') === -1) return parseFloat(s);
    if (s.indexOf('.') === -1) return parseFloat(s.replace(',', '.'));
    return parseFloat(s.replace(/,/g, ''));
  }
  var RE_SECTION = /^;\s*(.+?)\s+(start|end)\s*$/;
  // OrcaSlicer / PrusaSlicer markers and header lines.
  var RE_TYPE = /^;\s*TYPE:\s*(.+?)\s*$/;
  var RE_GEN_ORCA = /^;\s*generated by (.+)$/;
  // Orca writes `; total layer number: 32` in the header block and
  // `; total layers count = 32` in the summary block; Prusa writes the latter.
  var RE_LAYERCOUNT_ORCA = /^;\s*total (?:layer number|layers count)\s*[:=]\s*(\d+)/i;
  // `; <key> = <value>` config dump. Keys are lower snake_case in every
  // Orca/Prusa export; requiring that shape keeps `; filament used [g] = 0.94`
  // and `; thumbnail begin …` out of the parse.
  var RE_CONFIG_LINE = /^;\s*([a-z][a-z0-9_]*)\s*=\s*(.*)$/;
  var RE_EW_LINE = /^;\s*(.+?)\s+extrusion width\s*=\s*([\d.,]+)\s*mm/;
  var RE_SESSION = /^;\s*SESSION:\s*/;
  var RE_MATERIAL = /^;\s*MATERIAL_PRINT_DATA:\s*/;
  var RE_ENTITY = /^;\s*ENTITY_PRINT_DATA:\s*/;
  var RE_THUMB_START = /^;\s*thumbnail start/;
  var RE_GEN = /^;\s*Generated with (.+)$/;
  var RE_PROC = /^;\s*Printer Processor Type:\s*(.+)$/;
  var RE_MODE = /^;\s*PRINTING_MODE:\s*(.+)$/;
  var RE_LAYERCOUNT = /^;\s*LAYER_COUNT:\s*(\d+)/;

  // ---- line parsing ------------------------------------------------------
  function parseLine(line) {
    var semi = line.indexOf(';');
    var code = semi === -1 ? line : line.slice(0, semi);
    var comment = semi === -1 ? '' : line.slice(semi);
    var out = {
      verb: '', code: code.trim(), comment: comment, args: null,
      isComment: /^\s*;/.test(line)
    };
    if (!out.code) return out;

    var parts = out.code.split(/[\s,]+/);
    out.verb = parts[0].toUpperCase();
    var args = {};
    for (var i = 1; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      var k = p.charAt(0).toUpperCase();
      var v = parseFloat(p.slice(1));
      if (!isNaN(v)) args[k] = v;
      else if (/^[A-Z_]+$/.test(p)) args[p] = true;
    }
    out.args = args;
    return out;
  }

  // Extrusion axes: E (plastic), U (fiber), V (matrix). All relative (M83).
  function extrusionDeltas(args, absE, lastE) {
    var dE = 0, dU = 0, dV = 0;
    if (args.E !== undefined) dE = absE ? args.E - lastE : args.E;
    if (args.U !== undefined) dU = args.U;
    if (args.V !== undefined) dV = args.V;
    return { dE: dE, dU: dU, dV: dV };
  }

  function isCustomVerb(verb, extraDefined) {
    if (!verb) return false;
    if (MOTION_VERBS[verb]) return false;
    if (STANDARD_G[verb]) return false;
    if (STANDARD_M[verb]) return false;
    if (/^T\d+$/.test(verb)) return false;
    if (KNOWN_MACROS[verb]) return false;
    if (extraDefined && extraDefined[verb]) return false;
    return true;
  }

  // ---- SESSION metadata --------------------------------------------------
  function parseSession(text) {
    var m = RE_SESSION.exec(text);
    if (!m) return null;
    var start = text.indexOf('{', m.index + m[0].length - 1);
    if (start < 0) return null;
    // The SESSION echo is one JSON object on a single line; find its end by brace balance.
    var depth = 0, inStr = false, esc = false, end = -1;
    for (var i = start; i < text.length; i++) {
      var c = text.charAt(i);
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) return null;
    try { return JSON.parse(text.slice(start, end + 1)); } catch (e) { return null; }
  }

  // Flatten the interesting bits of the SESSION echo into one settings object.
  function sessionSettings(session) {
    var s = {
      material: null, filamentDiameter: 1.75, zhopP: null, doZHop: null,
      minLayerTime: null, coolingWindow: null, travelSpeedXY: 500, travelSpeedZ: 10, areaX: 305, areaY: 305,
      inset0Speed: null, inset0EWMM: null, macroLayerHeight: null,
      seamDistributionPlastic: null, seamStartPlastic: null,
      retractOnLayerChange: null, retractOnlyWhenCrossing: null,
      retractLenOnTravel: null, retractSpeed: 20, retractMinTravelNoCrossing: null,
      retractMinTravelOnCrossing: null, startGCode: '', endGCode: '',
      fanSchedule: null, widths: {}, slicerSaysPlasticOnly: false,
      // Fortified = the fibre is part of the part's own perimeters from the
      // bottom up, so it must be laid down on layer 1. `CurrentSliceType` 2 is
      // the slicer's "Composite Only" mode and `MustGenerateFiberPerimeters`
      // is the matching profile switch; both are true only on the fortified
      // fixture in this corpus.
      currentSliceType: null, mustGenerateFiberPerimeters: null, fortified: false,
      closeFanFirstLayers: null, settingsSource: 'none',
      // Which profile key each value came from, so evidence strings name the
      // dialect's authority that actually fired.
      minLayerTimeSource: 'Profile.MinLayerTimeForSlowing',
      minLayerTimeKey: 'MinLayerTimeForSlowing',
      doZHopKey: 'DoZHop',
      coolingWindowSource: 'Profile.LayerTimeForMaxCooling'
    };
    if (!session) return s;
    s.settingsSource = 'session';
    var P = session.Profile || {};
    var PR = session.Printer || {};
    s.doZHop = P.DoZHop === undefined ? null : !!P.DoZHop;
    s.minLayerTime = P.MinLayerTimeForSlowing === undefined ? null : P.MinLayerTimeForSlowing;
    s.coolingWindow = P.LayerTimeForMaxCooling === undefined ? null : P.LayerTimeForMaxCooling;
    s.inset0Speed = P.Inset0Speed === undefined ? null : P.Inset0Speed;
    s.inset0EWMM = P.Inset0EWMM === undefined ? null : P.Inset0EWMM;
    s.macroLayerHeight = P.MacroLayerHeight === undefined ? null : P.MacroLayerHeight;
    s.seamDistributionPlastic = P.EnableAdjustSeamDistributionPositionPlastic === undefined
      ? null : !!P.EnableAdjustSeamDistributionPositionPlastic;
    s.seamStartPlastic = P.EnableAdjustSeamStartPositionPlastic === undefined
      ? null : !!P.EnableAdjustSeamStartPositionPlastic;
    s.retractOnLayerChange = P.DoRetractOnLayerChange === undefined ? null : !!P.DoRetractOnLayerChange;
    s.retractOnlyWhenCrossing = P.DoRetractOnlyWhenCrossingPerimeters === undefined
      ? null : !!P.DoRetractOnlyWhenCrossingPerimeters;
    s.startGCode = String(P.StartGCode || '') + '\n' + String(PR.StartGCode || '');
    s.endGCode = String(P.EndGCode || '') + '\n' + String(PR.EndGCode || '');
    s.fanSchedule = P.LayersAndFanSpeedsArray || null;
    s.currentSliceType = session.CurrentSliceType === undefined ? null : session.CurrentSliceType;
    s.mustGenerateFiberPerimeters = P.MustGenerateFiberPerimeters === undefined
      ? null : !!P.MustGenerateFiberPerimeters;
    s.fortified = s.currentSliceType === 2 || s.mustGenerateFiberPerimeters === true;
    s.travelSpeedXY = PR.TravelSpeedXY === undefined ? 500 : PR.TravelSpeedXY;
    s.travelSpeedZ = PR.TravelSpeedZ === undefined ? 10 : PR.TravelSpeedZ;
    s.areaX = PR.AreaSizeX === undefined ? 305 : PR.AreaSizeX;
    s.areaY = PR.AreaSizeY === undefined ? 305 : PR.AreaSizeY;

    var keys = Object.keys(session);
    for (var i = 0; i < keys.length; i++) {
      if (!/Slot$/.test(keys[i])) continue;
      var slot = session[keys[i]] || {};
      var mat = slot.Plastic || slot.Composite || null;
      if (mat) {
        if (mat.PlasticType) s.material = s.material || mat.PlasticType;
        if (mat.FilamentDiameter) s.filamentDiameter = mat.FilamentDiameter;
        if (mat.ZhopP !== undefined && s.zhopP === null) s.zhopP = mat.ZhopP;
        if (mat.RetractionSpeed) s.retractSpeed = mat.RetractionSpeed;
      }
    }
    var es = session.EntitySizes || {};
    var ek = Object.keys(es);
    for (var j = 0; j < ek.length; j++) {
      var w = es[ek[j]].Width;
      if (w > 0) s.widths[ek[j]] = w;
    }
    return s;
  }

  function beadWidth(settings, entityKey) {
    if (settings.widths[entityKey]) return settings.widths[entityKey];
    return DEFAULT_WIDTH[entityKey] || 0.4;
  }

  // ---- OrcaSlicer / PrusaSlicer flat config dump ---------------------------
  /*
   * Orca and Prusa export the whole profile as `; <key> = <value>` comment lines
   * (716 of them in one Orca sample) instead of a `; SESSION:` JSON blob. Collect
   * them into a flat map. Requiring a lower snake_case key plus skipping the
   * thumbnail block keeps base64 payload lines out of the parse.
   */
  function parseConfigDump(lines) {
    var cfg = {}, thumb = false;
    for (var i = 0; i < lines.length; i++) {
      if (/^;\s*thumbnail (?:begin|start)/.test(lines[i])) { thumb = true; continue; }
      if (/^;\s*thumbnail end/.test(lines[i])) { thumb = false; continue; }
      if (thumb) continue;
      var m = RE_CONFIG_LINE.exec(lines[i]);
      if (!m) continue;
      if (cfg[m[1]] === undefined) cfg[m[1]] = m[2].trim();
    }
    return cfg;
  }

  function numOr(value, fallback) {
    if (value === undefined || value === null || value === '') return fallback;
    var n = parseFloat(String(value).replace(',', '.'));
    return isNaN(n) ? fallback : n;
  }

  // `bed_shape = 0x0,300x0,300x300,0x300` -> [300, 300]
  function bedExtent(value) {
    if (!value) return null;
    var maxX = 0, maxY = 0;
    String(value).split(',').forEach(function (pt) {
      var m = /^\s*([\d.]+)\s*x\s*([\d.]+)\s*$/.exec(pt);
      if (!m) return;
      maxX = Math.max(maxX, parseFloat(m[1]));
      maxY = Math.max(maxY, parseFloat(m[2]));
    });
    return maxX > 0 ? [maxX, maxY] : null;
  }

  /*
   * Flatten the flat dump into the same settings shape `sessionSettings`
   * returns, so every rule that reads a profile value works on both dialects.
   * Fields with no Orca/Prusa equivalent stay null rather than being guessed —
   * a rule with no authority for a file must say so, not invent one. The
   * `*Key` fields name the config key each value came from, so evidence strings
   * quote the dialect the file actually speaks.
   */
  function flatSettings(cfg) {
    var s = {
      material: null, filamentDiameter: 1.75, zhopP: null, doZHop: null,
      minLayerTime: null, coolingWindow: null, travelSpeedXY: 500, travelSpeedZ: 10, areaX: 305, areaY: 305,
      inset0Speed: null, inset0EWMM: null, macroLayerHeight: null,
      seamDistributionPlastic: null, seamStartPlastic: null,
      retractOnLayerChange: null, retractOnlyWhenCrossing: null,
      retractLenOnTravel: null, retractSpeed: 20, retractMinTravelNoCrossing: null,
      retractMinTravelOnCrossing: null, startGCode: '', endGCode: '',
      fanSchedule: null, widths: {}, slicerSaysPlasticOnly: false,
      currentSliceType: null, mustGenerateFiberPerimeters: null, fortified: false,
      closeFanFirstLayers: null, settingsSource: 'none',
      minLayerTimeSource: 'slow_down_layer_time', minLayerTimeKey: 'slow_down_layer_time',
      doZHopKey: 'z_hop', coolingWindowSource: 'fan_cooling_layer_time'
    };
    if (!cfg || !Object.keys(cfg).length) return s;

    s.settingsSource = 'flat-config';
    if (cfg.filament_type) s.material = String(cfg.filament_type).split(',')[0].trim();
    s.filamentDiameter = numOr(cfg.filament_diameter, 1.75);
    // `z_hop` is the on/off switch (0 = off); the lift height lives in the
    // per-filament `filament_z_hop`.
    if (cfg.z_hop !== undefined) {
      var zh = numOr(cfg.z_hop, 0);
      s.doZHop = zh > 0;
      if (zh > 0.05) s.zhopP = zh;
    }
    if (s.zhopP === null) s.zhopP = numOr(cfg.filament_z_hop, null);
    // Orca's slowdown floor is `slow_down_layer_time`; the window that governs
    // full fan speed is `fan_cooling_layer_time`.
    s.minLayerTime = numOr(cfg.slow_down_layer_time, null);
    s.coolingWindow = numOr(cfg.fan_cooling_layer_time, null);
    s.closeFanFirstLayers = numOr(cfg.close_fan_the_first_x_layers, null);
    s.macroLayerHeight = numOr(cfg.layer_height, null);
    s.retractSpeed = numOr(cfg.retraction_speed, 20);
    s.travelSpeedXY = numOr(cfg.travel_speed, 500) * 60;   // Orca mm/s -> mm/min
    var tz = numOr(cfg.travel_speed_z, 0);
    if (tz > 0) s.travelSpeedZ = tz;
    var bed = bedExtent(cfg.bed_shape);
    if (bed) { s.areaX = bed[0]; s.areaY = bed[1]; }
    // Start/end gcode arrive as one line with literal \n escapes. Unescaping
    // them keeps the C07 "header echo only" and C09 CASE_FAN rules working the
    // way they do on a Rocket SESSION blob.
    s.startGCode = String(cfg.machine_start_gcode || '').replace(/\\n/g, '\n');
    s.endGCode = String(cfg.machine_end_gcode || '').replace(/\\n/g, '\n');
    return s;
  }

  /*
   * `; MATERIAL_PRINT_DATA: [ ... ]` — the slicer's own per-extruder material
   * accounting, emitted near EOF. Shape:
   *
   *   [{"Type":0,"Extruder":{"Index":1,"Name":"FFF - 0.4 mm"},
   *     "Materials":[{"MaterialType":0,"Name":"PETG","Length":1.43,"Volume":3.4,
   *                   "Mass":4.4,"Cost":0.088}]}]
   *
   * `Type` 0 is the plastic (FFF) tool and 1 the composite (CFC) tool. Within a
   * tool, `MaterialType` 0 is the matrix filament and 1 the continuous fibre tow.
   * `Length` is in metres. This is the slicer's *declared* consumption, so it is
   * the independent cross-check for the U/E totals the engine measures directly.
   */
  function parseMaterialPrintData(text) {
    var m = RE_MATERIAL.exec(text);
    if (!m) return null;
    var start = text.indexOf('[', m.index + m[0].length - 1);
    if (start < 0) return null;
    var depth = 0, inStr = false, esc = false, end = -1;
    for (var i = start; i < text.length; i++) {
      var c = text.charAt(i);
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') { inStr = true; continue; }
      if (c === '[') depth++;
      else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) return null;
    try { return JSON.parse(text.slice(start, end + 1)); } catch (e) { return null; }
  }

  // Flatten MATERIAL_PRINT_DATA into { plastic: {..}, fiber: {..}, tow: {..} }
  // with length in metres. Missing blocks yield null, not zero — "the slicer
  // said nothing" and "the slicer said zero" are different findings.
  function materialSummary(data) {
    var out = { plastic: null, fiber: null, tow: null, entries: [] };
    if (!Array.isArray(data)) return out;
    data.forEach(function (grp) {
      var extruder = (grp.Extruder && grp.Extruder.Name) || '';
      (grp.Materials || []).forEach(function (mat) {
        var rec = {
          extruder: extruder, name: mat.Name || null,
          toolType: grp.Type, materialType: mat.MaterialType,
          lengthM: typeof mat.Length === 'number' ? mat.Length : null,
          volumeCm3: typeof mat.Volume === 'number' ? mat.Volume : null,
          massG: typeof mat.Mass === 'number' ? mat.Mass : null
        };
        out.entries.push(rec);
        if (mat.MaterialType === 1) {
          if (rec.lengthM && (!out.tow || out.tow.lengthM < rec.lengthM)) out.tow = rec;
          else if (!out.tow) out.tow = rec;
        } else if (grp.Type === 1) {
          if (!out.fiber || out.fiber.lengthM < rec.lengthM) out.fiber = rec;
        } else {
          if (!out.plastic || out.plastic.lengthM < rec.lengthM) out.plastic = rec;
        }
      });
    });
    return out;
  }

  /*
   * Machine-assist flags (issue-free owner request, 2026-10-03).
   *
   * The machine ships with AI/spaghetti detection, piezo bed mesh, resonance
   * testing, filament runout and Z-probing (Exploration/HardwareInfo.md,
   * ERROR_CODES.md 10072-10074 / 30001-30015). None of them are ever expressed
   * as a SESSION key — the exported Profile/Printer vocabulary is purely
   * slicing geometry and motion — so the only place a print can declare them is
   * as an executable command. Each entry below is the token that would have to
   * appear for the feature to be *active in this print*.
   *
   * `re` matches the command; `macro` means it is a firmware macro rather than
   * a G/M verb. `expect` is a one-line note on what the token means.
   *
   * Every macro token carries a trailing `\w*`: Klipper-style macro names are
   * underscore-joined, so `AI_DETECT` alone followed by `_START` has no word
   * boundary after it and a bare `\b`-terminated pattern silently misses the
   * very command it exists to find.
   */
  var MACHINE_FLAGS = [
    { key: 'home', label: 'Homing (G28)', re: /\bG28\b/, expect: 'G28 homes the axes before the print' },
    { key: 'bedMesh', label: 'Bed mesh / auto-leveling', re: /\b(G29\b|BED_MESH\w*|QUAD_GANTRY_LEVEL\w*|SCREWS_TILT_CALCULATE\w*|AUTO_LEVEL\w*)/, expect: 'G29 or BED_MESH_CALIBRATE runs a mesh before printing' },
    { key: 'probe', label: 'Z probe / probe calibration', re: /\b(PROBE\w*|CALIBRATE\w*|SET_GCODE_OFFSET\w*|Z_END_CALIBRATE\w*)/, expect: 'a probe verb establishes or applies the Z offset' },
    { key: 'aiDetect', label: 'AI / spaghetti detection', re: /\b(AI\w*DETECT\w*|AI_\w+|SPAGHETTI\w*|CAMERA\w*|MONITOR\w*|DETECT_(START|STOP)\w*)/, expect: 'an AI/camera detection macro is started by the print' },
    { key: 'filamentSensor', label: 'Filament runout / motion sensor', re: /\b(FILAMENT\w*SENSOR\w*|CHECK_FILAMENT\w*|M411\b|M412\b)/, expect: 'a filament sensor is enabled for the print' },
    { key: 'resonance', label: 'Resonance / input shaper calibration', re: /\b(RESONANCE\w*|SHAPER_CALIBRATE\w*|SET_INPUT_SHAPER\w*|INPUT_SHAPER\w*|ADXL\w*CONSULT\w*)/, expect: 'resonance or input-shaper calibration is invoked' },
    { key: 'powerLoss', label: 'Power-loss recovery', re: /\b(POWER_LOSS\w*|RECOVER\b|RESTORE\b)/, expect: 'a power-loss recovery hook is present' },
    { key: 'crashDetect', label: 'Crash detection', re: /\b(CRASH\w*|SET_CRASH\w*|STALLGUARD\w*|STEALTHBURNER\w*)/, expect: 'stallGuard/stealthBurner crash detection is enabled' },
    { key: 'pauseOnFail', label: 'Pause/cancel-on-failure hook', re: /\b(PAUSE\w*|CANCEL_OBJECT\w*|SET_PRINT_STATUS\w*|PRINT_START\b|PRINT_RESUME\b|PRINT_CANCEL\b)/, expect: 'a pause/cancel-on-failure hook is armed' }
  ];

  root.FS3 = root.FS3 || {};
  root.FS3.Dialect = {
    FEATURES: FEATURES,
    TYPE_FEATURES: TYPE_FEATURES,
    TYPE_WIDTH_LINES: TYPE_WIDTH_LINES,
    KNOWN_MACROS: KNOWN_MACROS,
    MACHINE_FLAGS: MACHINE_FLAGS,
    parseLine: parseLine,
    num: num,
    extrusionDeltas: extrusionDeltas,
    isCustomVerb: isCustomVerb,
    parseSession: parseSession,
    parseMaterialPrintData: parseMaterialPrintData,
    materialSummary: materialSummary,
    sessionSettings: sessionSettings,
    parseConfigDump: parseConfigDump,
    flatSettings: flatSettings,
    beadWidth: beadWidth,
    RE_LAYER: RE_LAYER,
    RE_MACROLAYER: RE_MACROLAYER,
    RE_SEAM: RE_SEAM,
    RE_SECTION: RE_SECTION,
    RE_TYPE: RE_TYPE,
    RE_GEN_ORCA: RE_GEN_ORCA,
    RE_LAYERCOUNT_ORCA: RE_LAYERCOUNT_ORCA,
    RE_CONFIG_LINE: RE_CONFIG_LINE,
    RE_EW_LINE: RE_EW_LINE,
    RE_SESSION: RE_SESSION,
    RE_MATERIAL: RE_MATERIAL,
    RE_ENTITY: RE_ENTITY,
    RE_THUMB_START: RE_THUMB_START,
    RE_GEN: RE_GEN,
    RE_PROC: RE_PROC,
    RE_MODE: RE_MODE,
    RE_LAYERCOUNT: RE_LAYERCOUNT
  };
})(typeof self !== 'undefined' ? self : globalThis);
