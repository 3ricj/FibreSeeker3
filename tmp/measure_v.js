// Measure the stationary-V ledger of the on-disk Rocket references and of our
// own exports, with ONE method, so the numbers are comparable.
//
// Stationary V = a V word on a line with no X/Y (the head is not moving).
// Terms:
//   restart/feed  : the V recovery that opens a fibre window (after M1001)
//   window retract: the V withdrawal that closes it (before M1002)
//   toolchange    : the V withdrawal issued inside a change-extruder block
const fs = require('fs');

const DIR = '/mnt/c/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/Test_files';

function vword(line) {
    const m = /\bV(-?\d+(?:\.\d+)?)/.exec(line);
    return m ? parseFloat(m[1]) : null;
}
function is_stationary(line) {
    return /^G1\b/.test(line.trim()) && !/\bX/.test(line) && !/\bY/.test(line);
}

function analyse(path, label) {
    const L = fs.readFileSync(path, 'latin1').split(/\r?\n/);
    let restart = 0, retract = 0, tcv = 0;
    let n1001 = 0, n1002 = 0, nblocks = 0;
    let inBlock = false;
    for (let i = 0; i < L.length; i++) {
        const t = L[i].trim();
        if (/Start change extruder/i.test(t)) { inBlock = true; nblocks++; }
        if (/End change extruder/i.test(t)) { inBlock = false; }
        if (/^M1001/.test(t)) n1001++;
        if (/^M1002/.test(t)) n1002++;
        if (!/\bV/.test(t) || !is_stationary(t)) continue;
        const v = vword(t);
        if (v === null) continue;
        if (inBlock) { tcv += v; continue; }
        if (v > 0) restart += v; else retract += v;
    }
    const cycles = Math.max(n1001, 1);
    console.log('\n=== ' + label + ' ===');
    console.log('   windows (M1001)          : ' + n1001 + '   (M1002: ' + n1002 + ')');
    console.log('   change-extruder blocks   : ' + nblocks);
    console.log('   restart/feed V  (sum)    : +' + restart.toFixed(3));
    console.log('   window retract  (sum)    : ' + retract.toFixed(3));
    console.log('   toolchange V    (sum)    : ' + tcv.toFixed(3));
    const net = restart + retract + tcv;
    console.log('   NET                      : ' + net.toFixed(3));
    console.log('   per window               : ' + (net / cycles).toFixed(3));
    console.log('   per cycle (2 windows)    : ' + (net / (cycles / 2)).toFixed(3));
    // per-term per-window magnitudes, to name the individual moves
    console.log('   restart per window       : +' + (restart / cycles).toFixed(3));
    console.log('   retract per window       : ' + (retract / cycles).toFixed(3));
    console.log('   toolchange per window    : ' + (tcv / cycles).toFixed(3));
    return net;
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.gcode'));
for (const f of files) {
    const s = fs.readFileSync(DIR + '/' + f, 'latin1');
    if (!/^M1001/m.test(s)) continue; // only continuous-fiber exports
    analyse(DIR + '/' + f, 'ROCKET  ' + f);
}

for (const p of ['/mnt/c/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/tmp/cf_mod.gcode']) {
    if (fs.existsSync(p)) analyse(p, 'OURS (modified tree)  ' + p.split('/').pop());
}
