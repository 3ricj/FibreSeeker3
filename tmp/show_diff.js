// Print the diff hunks for a file, filtered to the fibre block region, using
// node (sed line ranges are unreliable in this environment).
const { execFileSync } = require('child_process');
const REPO = process.argv[2];
const FILE = process.argv[3];
const FROM = process.argv[4]; // substring to start printing from
const diff = execFileSync('/mnt/c/Program Files/Git/cmd/git.exe',
    ['diff', 'HEAD', '--', FILE], { cwd: REPO, encoding: 'latin1', maxBuffer: 1 << 28 });
const lines = diff.split('\n');
let printing = false;
let count = 0;
for (const l of lines) {
    if (!printing && l.includes(FROM)) printing = true;
    if (printing) { console.log(l); if (++count > 200) break; }
}
