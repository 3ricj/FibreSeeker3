// Before/after switch blocks + per-window counts, measured from the two real
// CF exports produced by the two builds.
const fs = require('fs');
const T = '/mnt/c/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/tmp';

function harvest(p) {
    const L = fs.readFileSync(p, 'latin1').split(/\r?\n/);
    const blocks = [];
    let cur = null;
    for (const line of L) {
        if (/^; Start change extruder/.test(line)) { cur = [line]; continue; }
        if (cur && /^; End change extruder/.test(line)) { cur.push(line); blocks.push(cur); cur = null; continue; }
        if (cur) cur.push(line);
    }
    return { L, blocks };
}
function dir_of(b) {
    for (const l of b) { const m = /^T\d\s*;?\s*switch extruder type to:(\w+)/i.exec(l.trim()); if (m) return m[1].toUpperCase(); }
    return 'none';
}

for (const [tag, p] of [['BASE (pristine 12205f3623)', T + '/cf_base.gcode'], ['MODIFIED', T + '/cf_mod.gcode']]) {
    const { L, blocks } = harvest(p);
    const toF = blocks.filter(b => dir_of(b) === 'FIBER');
    const toP = blocks.filter(b => dir_of(b) === 'PLASTIC');
    const cnt = (re) => L.filter(l => re.test(l)).length;
    console.log('\n################ ' + tag + ' ################');
    console.log('windows M1001=' + cnt(/^M1001/) + '  M1002=' + cnt(/^M1002/) +
        '  change-extruder blocks=' + blocks.length + ' (to-fibre ' + toF.length + ', to-plastic ' + toP.length + ')');
    console.log('E-10 withdrawal=' + cnt(/^G1 E-10\b|^G1 E-10(\s|;)/) +
        '   E10 recovery=' + cnt(/^G1 E10\b|^G1 E10(\s|;)/) +
        '   M104=' + cnt(/^M104 /) + '   M109=' + cnt(/^M109 /) +
        '   M400=' + cnt(/^M400$/) + '   CLEAN_NOZZLE=' + cnt(/CLEAN_NOZZLE/) +
        '   V-4 toolchange=' + cnt(/Toolchange matrix retract/) +
        '   M106 P=' + cnt(/^M106 P/) + '   M106 bare=' + cnt(/^M106 S/));
    if (toF.length) {
        console.log('\n--- first plastic->fibre block ---');
        for (const l of toF[toF.length - 1]) if (l.trim()) console.log('  ' + l.trim());
    }
    if (toP.length) {
        console.log('\n--- last fibre->plastic block ---');
        for (const l of toP[toP.length - 1]) if (l.trim()) console.log('  ' + l.trim());
    }
}
