// Regenerate the composite (fibre) export from both trees, each in its own cwd,
// for the measured before/after switch blocks.
const fs = require('fs');
const cp = require('child_process');
const ROOT = '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf';
const EXE = {
  base: ROOT + '/ctrl1220/buildctrl/tests/libslic3r/Release/libslic3r_tests.exe',
  mod:  ROOT + '/buildfs/tests/libslic3r/Release/libslic3r_tests.exe'
};
const CASE = 'Composite export reaches the fibre window and emits the tool-change wrap';
const TMP = '/tmp/fsfib2';
fs.mkdirSync(TMP, { recursive: true });
['base', 'mod'].forEach(function (t) {
  const dir = TMP + '/' + t + '_' + Date.now();
  fs.mkdirSync(dir, { recursive: true });
  const r = cp.spawnSync(EXE[t], ['[FiberExport]', '-c', CASE], { cwd: dir, encoding: 'latin1', timeout: 180000 });
  const f = dir + '/fs_export_fiber.gcode';
  if (!fs.existsSync(f)) { console.log('NO OUTPUT ' + t); console.log(r.stdout.slice(-400)); process.exit(1); }
  fs.copyFileSync(f, TMP + '/fiber_' + t + '.gcode');
  console.log(t + ' -> ' + fs.statSync(TMP + '/fiber_' + t + '.gcode').size + ' bytes');
});
