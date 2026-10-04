// Pristine-base proof: classify every line added to GCode.cpp against the CF
// regions that gate it. A line is "CF-gated" if it sits inside one of the
// continuous-fiber regions, is a comment/blank, is an #include, or is a pure
// static helper. Anything else is a real risk to non-CF output and is named.
const fs = require('fs');
const { execFileSync } = require('child_process');

const REPO = process.argv[2];
const FILE = 'src/libslic3r/GCode.cpp';
const text = fs.readFileSync(REPO + '/' + FILE, 'latin1');
const lines = text.split(/\r?\n/);

function block_region(openRe) {
    for (let i = 0; i < lines.length; i++) {
        if (openRe.test(lines[i])) {
            let d = 0;
            for (let j = i; j < lines.length; j++) {
                for (const c of lines[j]) { if (c === '{') d++; else if (c === '}') d--; }
                if (j > i && d === 0) return [i + 1, j + 1];
            }
        }
    }
    return null;
}
function line_region(re) {           // single-line region (ban-list entries)
    for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) return [i + 1, i + 1];
    return null;
}

const regions = [];
const push = (name, r) => { if (r) { regions.push([name, r]); console.log('CF region "' + name + '": ' + r[0] + '..' + r[1]); } };
push('fibre block', block_region(/^\s*if \(fs_do_fiber\) \{/));
push('preamble T0 preheat', block_region(/^\s*if \(m_config\.fs_fiber_enabled\.value && m_config\.fs_t0_temp\.value > 0\) \{/));
push('preamble priming line', block_region(/^\s*if \(m_config\.fs_fiber_enabled\.value && m_config\.fs_fiber_prime\.value/));
push('per-layer fs_fiber_enabled gate', block_region(/^\s*if \(object_layer != nullptr && m_config\.fs_fiber_enabled\.value/));

const diff = execFileSync('/mnt/c/Program Files/Git/cmd/git.exe',
    ['diff', 'HEAD', '-U0', '--', FILE], { cwd: REPO, encoding: 'latin1', maxBuffer: 1 << 28 });
const added = [];
let cur = 0;
diff.split('\n').forEach(function (l) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(l);
    if (m) { cur = parseInt(m[1], 10) - 1; return; }
    if (/^\+/.test(l) && !/^\+\+\+/.test(l)) { cur++; added.push([cur, l.slice(1)]); }
    else if (/^ /.test(l)) cur++;
});

const isComment = s => /^\s*(\/\/|\*|\/\*)/.test(s) || s.trim() === '';
const inCF = n => regions.some(r => n >= r[1][0] && n <= r[1][1]);

// Pure static helpers added by this change: they compute, never emit.
const helpers = ['fs_first_print_z', 'fs_plastic_working_temp'];
const isHelper = n => {
    for (let i = n - 1; i >= 0 && i > n - 20; i--) {
        if (helpers.some(h => new RegExp('static .* ' + h + '\\(').test(lines[i]))) return true;
    }
    return false;
};
const isInclude = s => /^\s*#include/.test(s);
const isBanEntry = s => /"fs_[a-z0-9_]+"sv/.test(s);

const cats = { comment: 0, cf: 0, helper: 0, include: 0, ban: 0 };
const outside = [];
added.forEach(function (a) {
    const [n, s] = a;
    if (isComment(s)) { cats.comment++; return; }
    if (inCF(n)) { cats.cf++; return; }
    if (isInclude(s)) { cats.include++; return; }
    if (isHelper(n)) { cats.helper++; return; }
    if (isBanEntry(s)) { cats.ban++; return; }
    outside.push(a);
});

console.log('\nadded lines: ' + added.length);
console.log('  comments/blank:                       ' + cats.comment);
console.log('  code inside a CF region:              ' + cats.cf);
console.log('  pure static helper lines:             ' + cats.helper);
console.log('  #include lines (no emission):         ' + cats.include);
console.log('  config-dump ban-list entries:         ' + cats.ban + '  (only ADD keys to the ban list -> dump stays byte-identical)');
console.log('  UNCLASSIFIED (would touch non-CF):    ' + outside.length);
outside.forEach(a => console.log('    L' + a[0] + ': ' + a[1].trim().slice(0, 100)));
console.log(outside.length === 0 ? '\nRESULT: no added line can execute on a non-continuous-fiber export.' : '\nRESULT: review the unclassified lines above.');
