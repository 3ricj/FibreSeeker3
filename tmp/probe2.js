// Measure the MSVC C1009 threshold for PRINT_CONFIG_CLASS_DEFINE(GCodeConfig, ...)
// by adding N dummy ((ConfigOptionBool, ...)) entries to a pristine PrintConfig.hpp
// (pristine = 12205f3623, GCodeConfig block = 224 entries) and compiling pristine
// GCode.cpp against it with the same flags the real build uses.
const fs = require('fs');
const cp = require('child_process');
const BASE = '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/ctrl1220';
const P = BASE + '/src/libslic3r/PrintConfig.hpp';
const pristine = fs.readFileSync('/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/ctrl1220_pristine.hpp', 'latin1');
const ANCHOR = '    ((ConfigOptionBool,                support_fast_purge_mode))\r\n';

function blockCount(s) {
  const L = s.split(/\r?\n/);
  let cur = null, best = 0, name = '';
  for (let i = 0; i < L.length; i++) {
    if (/^PRINT_CONFIG_CLASS_DERIVED_DEFINE0?\(|^PRINT_CONFIG_CLASS_DEFINE\(/.test(L[i])) { cur = { name: (L[i + 1] || '').trim().replace(/,$/, ''), n: 0 }; continue; }
    if (cur && /^\s+\(\(ConfigOption/.test(L[i])) cur.n++;
    if (cur && /^\)/.test(L[i])) { if (cur.name === 'GCodeConfig') best = cur.n; cur = null; }
  }
  return best;
}

function build(N) {
  let add = '';
  for (let i = 0; i < N; i++) add += '    ((ConfigOptionBool,                fs_dummy_' + i + '_x))\r\n';
  const n = pristine.split(ANCHOR).length - 1;
  if (n !== 1) throw new Error('anchor ' + n);
  fs.writeFileSync(P, pristine.split(ANCHOR).join(ANCHOR + add), 'latin1');
  const out = cp.execSync('cmd.exe /c "C:\\Users\\3ricj\\.openvibely\\repos\\b286adc9ffdb76b2fe4314806b97ad0a\\.worktrees\\task_d71213a54c246e952b54f607dae12df4\\tmp\\scbase.bat C:\\Users\\3ricj\\.openvibely\\repos\\288e09695603e28b9fc187875ade9fdf\\ctrl1220\\src\\libslic3r\\GCode.cpp"', { encoding: 'latin1', maxBuffer: 1 << 28 });
  const rc = /CL_RC=(\d+)/.exec(out);
  return { g: blockCount(pristine) + N, rc: rc ? +rc[1] : -1, c1009: /C1009/.test(out) };
}

for (const N of [2, 4, 6]) {
  const r = build(N);
  console.log('GCodeConfig=' + r.g + ' CL_RC=' + r.rc + ' C1009=' + (r.c1009 ? 'YES' : 'no'));
}
