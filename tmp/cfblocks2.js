// Print the switch blocks from our own exports by locating the tool line and
// walking back to the previous "; LAYER" / "; FIBER" boundary.
const fs = require('fs');
const T = '/mnt/c/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/tmp';

function show(p, want, label) {
    const L = fs.readFileSync(p, 'latin1').split(/\r?\n/);
    const idx = [];
    for (let i = 0; i < L.length; i++) {
        const m = /^T\d\s*;?\s*switch extruder type to:(\w+)/i.exec(L[i].trim());
        if (m && m[1].toUpperCase() === want) idx.push(i);
    }
    if (!idx.length) { console.log('  (no ' + want + ' switch lines)'); return; }
    const i = idx[idx.length - 1];
    // walk back until a layer marker or M1002/M1001
    let a = i;
    for (let j = i - 1; j > Math.max(0, i - 40); j--) {
        if (/^; LAYER:/.test(L[j]) || /^M100[12]/.test(L[j])) { a = j + 1; break; }
        a = j;
    }
    let b = i;
    for (let j = i + 1; j < Math.min(L.length, i + 12); j++) {
        if (/^; LAYER:/.test(L[j])) break;
        b = j;
        if (/^G1 E/.test(L[j].trim())) break;
    }
    console.log('\n--- ' + label + '  (lines ' + (a + 1) + '..' + (b + 1) + ' of ' + idx.length + ' switches) ---');
    for (let j = a; j <= b; j++) if (L[j].trim()) console.log('  ' + L[j].trim());
}

for (const [tag, p] of [['BASE pristine 12205f3623', T + '/cf_base.gcode'], ['MODIFIED', T + '/cf_mod.gcode']]) {
    console.log('\n################ ' + tag + ' ################');
    show(p, 'FIBER', 'plastic -> fibre');
    show(p, 'PLASTIC', 'fibre -> plastic');
}
