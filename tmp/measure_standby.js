// Measure, from the on-disk Rocket references, exactly which temperature lines
// appear in each tool-change block, per direction, and in which order.
// No assumptions: every distinct block is harvested and tallied verbatim.
const fs = require('fs');

const DIR = '/mnt/c/Users/3ricj/.openvibely/repos/b286adc9ffdb76b2fe4314806b97ad0a/.worktrees/task_d71213a54c246e952b54f607dae12df4/Test_files';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.gcode'));

// Harvest blocks delimited by the vendor's own markers.
const blocks = [];
for (const f of files) {
    const L = fs.readFileSync(DIR + '/' + f, 'latin1').split(/\r?\n/);
    let cur = null;
    for (const line of L) {
        if (/Start change extruder/i.test(line)) { cur = []; continue; }
        if (cur && /End change extruder/i.test(line)) { blocks.push({ file: f, b: cur }); cur = null; continue; }
        if (cur) cur.push(line);
    }
}
console.log('files scanned: ' + files.length + '   blocks harvested: ' + blocks.length);

// Classify by the tool line inside the block.
function dir_of(b) {
    for (const l of b) {
        const m = /^T(\d)\s*;?\s*switch extruder type to:(\w+)/i.exec(l.trim());
        if (m) return m[2].toUpperCase();
    }
    for (const l of b) {
        const m = /^T(\d)/.exec(l.trim());
        if (m) return 'T' + m[1];
    }
    return 'none';
}

const tally = {};
for (const { file, b } of blocks) {
    const d = dir_of(b);
    const temps = b.filter(l => /^M10[49]\b/.test(l.trim())).map(l => l.trim());
    const key = d + ' | ' + temps.join('  +  ');
    tally[key] = tally[key] || { n: 0, files: new Set(), sample: b.filter(l => l.trim()) };
    tally[key].n++;
    tally[key].files.add(file);
}

const rows = Object.entries(tally).sort((a, b) => b[1].n - a[1].n);
console.log('\n=== distinct temperature-line combinations per tool-change block ===');
for (const [k, v] of rows) {
    console.log('\n[' + v.n + 'x]  ' + k);
    console.log('         files: ' + [...v.files].map(s => s.slice(0, 26)).join(' | '));
}

// Per-direction: does EVERY block contain an M104 for BOTH heads?
console.log('\n=== per-direction coverage ===');
for (const want of ['FIBER', 'PLASTIC']) {
    const sel = blocks.filter(x => dir_of(x.b) === want);
    let both = 0, m400 = 0, brush = 0, m109 = 0, vneg = 0, eneg = 0, epos = 0, m106 = 0;
    for (const { b } of sel) {
        const t0 = b.some(l => /^M104\b.*\bT0\b/.test(l.trim()));
        const t1 = b.some(l => /^M104\b.*\bT1\b/.test(l.trim()));
        if (t0 && t1) both++;
        if (b.some(l => /^M400/.test(l.trim()))) m400++;
        if (b.some(l => /CLEAN_NOZZLE/.test(l))) brush++;
        if (b.some(l => /^M109\b/.test(l.trim()))) m109++;
        if (b.some(l => /^G1\b.*V-/.test(l.trim()))) vneg++;
        if (b.some(l => /^G1\b.*E-\d/.test(l.trim()))) eneg++;
        if (b.some(l => /^G1\b.*E\d/.test(l.trim()))) epos++;
        if (b.some(l => /^M106\s+P/.test(l.trim()))) m106++;
    }
    console.log('\n' + want + ' blocks: ' + sel.length);
    console.log('   M104 for BOTH heads : ' + both + '/' + sel.length);
    console.log('   M400                : ' + m400 + '/' + sel.length);
    console.log('   M109 (blocking)     : ' + m109 + '/' + sel.length);
    console.log('   CLEAN_NOZZLE        : ' + brush + '/' + sel.length);
    console.log('   V- move             : ' + vneg + '/' + sel.length);
    console.log('   E- withdrawal       : ' + eneg + '/' + sel.length);
    console.log('   E+ recovery         : ' + epos + '/' + sel.length);
    console.log('   M106 with P word    : ' + m106 + '/' + sel.length);
}

// Exact ordering of the first block of each direction, verbatim.
console.log('\n=== verbatim first block per direction ===');
for (const want of ['FIBER', 'PLASTIC']) {
    const sel = blocks.filter(x => dir_of(x.b) === want);
    if (!sel.length) continue;
    console.log('\n--- ' + want + '  (' + sel[0].file + ') ---');
    for (const l of sel[0].b) if (l.trim()) console.log('   ' + l.trim());
}
