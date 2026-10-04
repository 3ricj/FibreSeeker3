// Repair tests/fibreseeker/data/command_allowlist.json from the pristine HEAD
// version, inserting "M73" in its lexicographic place with CRLF endings, and
// verify no other line changed.
const { execFileSync } = require('child_process');
const fs = require('fs');

const REPO = process.argv[2];
const REL = 'tests/fibreseeker/data/command_allowlist.json';
const pristine = execFileSync('/mnt/c/Program Files/Git/cmd/git.exe',
    ['show', 'HEAD:' + REL], { cwd: REPO, encoding: 'latin1' });

const lines = pristine.split('\r\n');
const out = [];
let inserted = false;
lines.forEach(function (l) {
    if (!inserted && l.trim() === '"M82",') {
        out.push('  "M73",');
        inserted = true;
    }
    out.push(l);
});
if (!inserted) { console.error('anchor "M82", not found'); process.exit(1); }
fs.writeFileSync(REPO + '/' + REL, Buffer.from(out.join('\r\n'), 'latin1'));

// Verify: exactly one added line, nothing else.
const a = pristine.split('\r\n');
const b = out;
console.log('pristine lines=' + a.length + '  new lines=' + b.length);
let ai = 0, diffs = 0;
for (let bi = 0; bi < b.length; bi++) {
    if (b[bi] === '  "M73",') { continue; }
    if (b[bi] !== a[ai]) { console.log('UNEXPECTED DIFF at ' + ai + ': ' + JSON.stringify(a[ai]) + ' vs ' + JSON.stringify(b[bi])); diffs++; }
    ai++;
}
console.log('unexpected diffs (excluding the M73 insert): ' + diffs);
console.log('CRLF count=' + (out.length - 1) + '  trailing newline=' + (pristine.endsWith('\r\n') ? 'kept' : 'n/a'));
