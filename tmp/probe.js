// Probe the MSVC C1009 macro-nesting threshold by adding N dummy
// ((ConfigOptionBool, ...)) entries to a pristine PrintConfig.hpp and
// compiling pristine GCode.cpp against it.
const fs = require('fs');
const cp = require('child_process');
const TMPW = 'C:/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/tmp';
const TMP = '/mnt/c/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/tmp';
const P = TMP + '/ctrl/src/libslic3r/PrintConfig.hpp';
const pristine = fs.readFileSync(TMP + '/ctrl_pristine_PrintConfig.hpp', 'latin1');
const ANCHOR = '    ((ConfigOptionBool,                support_fast_purge_mode))\r\n';

function build(N) {
  let add = '';
  for (let i = 0; i < N; i++) add += '    ((ConfigOptionBool,                fs_dummy_' + i + '_x))\r\n';
  const n = pristine.split(ANCHOR).length - 1;
  if (n !== 1) throw new Error('anchor ' + n);
  fs.writeFileSync(P, pristine.split(ANCHOR).join(ANCHOR + add), 'latin1');
  const out = cp.execSync('cmd.exe /c "' + TMPW + '/scctrl.bat C:\\\\Users\\\\3ricj\\\\.openvibely\\\\repos\\\\b286adc9ffdb76b2fe4314806b97ad0a\\\\.worktrees\\\\task_d71213a54c246e952b54f607dae12df4\\\\tmp\\\\ctrl\\\\src\\\\libslic3r\\\\GCode.cpp"', { encoding: 'latin1', cwd: TMPW, maxBuffer: 1 << 28 });
  const rc = /CL_RC=(\d+)/.exec(out);
  const c1009 = /C1009/.test(out);
  return { n: pristine.split('((ConfigOption').length - 1 + N, rc: rc ? +rc[1] : -1, c1009 };
}

for (const N of [0, 1, 2, 3, 4, 5, 6, 7]) {
  const r = build(N);
  console.log('entries=' + r.n + ' CL_RC=' + r.rc + ' C1009=' + (r.c1009 ? 'YES' : 'no'));
}
