#!/usr/bin/env node
/*
 * Drives the real upload -> inspect -> render flow of g-code-inspector.html
 * without a browser.
 *
 * A handful of DOM stubs is enough: the UI only ever touches getElementById,
 * addEventListener, FileReader and innerHTML. This loads the shipped bundle,
 * fires the change handler on the file input the way a real file picker would,
 * and then asserts the rendered HTML contains the expected results.
 *
 *   node uitest.js
 */
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');
var bundle = require('./build_bundle.js');

var FIXTURES = path.join(__dirname, '..', '..', '..', 'Test_files');
var failures = 0;
function ok(cond, what) {
  console.log((cond ? '  ok   ' : '  FAIL ') + what);
  if (!cond) failures++;
}

var DEFAULTS = { cell: '0.2', gapRatio: '1.5', minUnsup: '16', minSeam: '10' };

function makeDoc() {
  var els = {};
  function el(id) {
    var h = {};
    return {
      id: id,
      value: DEFAULTS[id] || '',
      checked: true,
      disabled: false,
      textContent: '',
      innerHTML: '',
      classList: { add: function () {}, remove: function () {} },
      addEventListener: function (t, fn) { (h[t] = h[t] || []).push(fn); },
      click: function () {},
      __fire: function (t, ev) { (h[t] || []).forEach(function (fn) { fn(ev); }); },
      __has: function (t) { return (h[t] || []).length > 0; }
    };
  }
  var doc = {
    getElementById: function (id) { return els[id] || (els[id] = el(id)); },
    createElement: function () { return el(''); },
    addEventListener: function () {},
    body: el('body')
  };
  doc.__el = function (id) { return els[id] || (els[id] = el(id)); };
  return doc;
}

function main() {
  var names = fs.readdirSync(FIXTURES).filter(function (f) { return /\.gcode$/i.test(f); });
  if (!names.length) { console.error('no fixtures'); process.exit(2); }

  var doc = makeDoc();
  var timers = [];
  var ctx = {
    console: console,
    document: doc,
    performance: { now: function () { return Date.now(); } },
    setTimeout: function (fn) { timers.push(fn); return timers.length; },
    URL: { createObjectURL: function () { return 'blob:x'; }, revokeObjectURL: function () {} },
    Blob: function () {}
  };
  ctx.self = ctx; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.FileReader = function () {
    var self = this;
    this.readAsText = function (file) {
      self.result = fs.readFileSync(path.join(FIXTURES, file.name), 'utf8');
      if (self.onload) self.onload();
    };
  };
  vm.createContext(ctx);

  var html = fs.readFileSync(bundle.OUT, 'utf8');
  bundle.inlineScripts(html).forEach(function (code, i) {
    vm.runInContext(code, ctx, { filename: 'bundle#' + i });
  });

  console.log('upload flow: ' + names.length + ' fixtures through the real file-input handler');
  var fileInput = doc.__el('files');
  ok(fileInput.__has('change'), 'file input has a change handler');
  ok(doc.__el('drop').__has('drop'), 'drop zone has a drop handler');

  var list = names.map(function (n) { return { name: n }; });
  fileInput.__fire('change', { target: { files: list } });

  // The UI defers the scan by one setTimeout so the status line paints first.
  var guard = 0;
  while (timers.length && guard++ < 200) {
    var queue = timers.splice(0, timers.length);
    queue.forEach(function (fn) { fn(); });
  }

  var out = doc.__el('out').innerHTML;
  ok(out.length > 1000, 'rendered ' + (out.length / 1024).toFixed(1) + ' KB of results HTML');
  ok(out.indexOf('Per-file results') >= 0, 'per-file results table rendered');
  ok(out.indexOf('Checks and what they found') >= 0, 'per-check summary rendered');
  ok(out.indexOf('Print contract') >= 0, 'print-contract panel rendered');
  ok(/carbon on layer 1/i.test(out), 'print contract states the layer-1 carbon verdict');
  ok(/single-tool FFF/.test(out), 'print contract names the single-tool configuration');
  ok(/dual-tool/.test(out), 'print contract names the dual-tool configuration');
  ok(/cuts \(M2800\)/.test(out), 'print contract reports the cut count');
  ok(/machine flags/i.test(out), 'print contract reports machine-assist flags');
  ok(/class="sev critical"/.test(out), 'critical findings rendered with severity styling');
  ok(out.indexOf('Benchy') >= 0, 'fixture names appear in the output');
  ok(out.indexOf('/issues/1') >= 0, 'findings link back to the issue tracker');
  var rows = (out.match(/class="row" data-f=/g) || []).length;
  ok(rows === names.length, 'one result row per uploaded file (' + rows + '/' + names.length + ')');
  ok(doc.__el('status').textContent.indexOf('file(s) in') >= 0,
    'status line reports timing: "' + doc.__el('status').textContent + '"');

  console.log(failures ? failures + ' FAILURE(S)' : 'all checks passed');
  process.exit(failures ? 1 : 0);
}

main();
