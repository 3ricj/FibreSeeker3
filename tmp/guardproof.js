// Prove that every G-code-emitting line added to GCode.cpp by this change is
// unreachable unless fs_fiber_enabled && fs_t0_wrap are both true.
//
// Method: for each added emission line, walk the NEW file backwards from that
// line, tracking brace depth, and collect every `if`/`else` condition that
// opened a block still enclosing the line. Print the guard chain.
const fs = require('fs');
const { execFileSync } = require('child_process');

const REPO = process.argv[2];
const FILE = 'src/libslic3r/GCode.cpp';
const text = fs.readFileSync(REPO + '/' + FILE, 'latin1');
const lines = text.split(/\r?\n/);

const diff = execFileSync('/mnt/c/Program Files/Git/cmd/git.exe',
    ['diff', '-U0', '--', FILE], { cwd: REPO, encoding: 'latin1', maxBuffer: 1 << 28 });

// Collect (newLineNumber, text) for added lines from the unified diff.
const added = [];
let curNew = 0;
diff.split('\n').forEach(function (l) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
    if (m) { curNew = parseInt(m[1], 10) - 1; return; }
    if (/^\+[^+]/.test(l) || l === '+') { curNew++; added.push([curNew, l.slice(1)]); }
    else if (/^[ -]/.test(l)) { /* context or deletion: only context advances */ if (/^ /.test(l)) curNew++; }
});

// Guard chain for a 1-based line number: scan backwards, maintaining brace depth.
function guardChain(lineno) {
    const chain = [];
    let depth = 0;
    for (let i = lineno - 1; i >= 0; i--) {
        const raw = lines[i];
        // count braces right-to-left for the scan direction
        let j = raw.length - 1;
        let hit = null;
        for (; j >= 0; j--) {
            const c = raw[j];
            if (c === '}') depth++;
            else if (c === '{') {
                depth--;
                if (depth < 0) { hit = raw.slice(0, j).trim(); break; }
            }
        }
        if (hit !== null) {
            // hit is the text preceding the '{'
            const m = /(?:^|\s)(if|else\s+if)\s*\((.*)$/.exec(hit) || /^(else)\b/.exec(hit);
            if (/^else$/.test(hit) || hit === 'else') chain.push('else');
            else if (m && m[1] === 'else') chain.push('else if (' + m[2].replace(/\)\s*$/, '') + ')');
            else if (m) chain.push('if (' + m[2].replace(/\)\s*$/, '') + ')');
            else if (/\bfor\b|\bwhile\b|struct|class|namespace|^\s*try\b/.test(hit)) chain.push('<' + hit.slice(-40) + '>');
            depth = 0;
        }
        if (chain.length >= 8) break;
    }
    return chain;
}

const emitters = added.filter(function (a) { return /gcode\s*\+=|file\.write|out\s*\+=/.test(a[1]); });
console.log('added lines: ' + added.length + '   G-code-emitting added lines: ' + emitters.length);
emitters.forEach(function (a) {
    console.log('\n  L' + a[0] + ': ' + a[1].trim().slice(0, 78));
    const chain = guardChain(a[0]);
    const flat = chain.join('  >>  ');
    const fiber = /fs_fiber_enabled|fs_do_fiber/.test(flat);
    const wrap = /fs_t0_wrap/.test(flat);
    console.log('    chain: ' + flat.slice(0, 300));
    console.log('    behind fs_fiber_enabled/fs_do_fiber: ' + fiber + '   behind fs_t0_wrap: ' + wrap);
});
