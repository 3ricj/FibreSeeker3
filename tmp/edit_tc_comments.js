// Final comment cleanups in FiberToolChange.cpp: drop the superseded copy of the
// return-half comment, and point the brush comment at a document that exists.
const fs = require('fs');
const file = process.argv[2];
const NL = '\r\n';
let t = fs.readFileSync(file, 'latin1');

const stale = [
    '    // Standby on the head being put away (T0), working temperature restored on',
    '    // the head being activated (T1). Nothing else does the T1 restore on this',
    '    // path: the fibre block bypasses the exporter\u2019s tool-change temperature',
    '    // handling entirely, and without the restore T1 would resume printing at',
    '    // its standby temperature.'
].join(NL) + NL;
if (t.split(stale).length - 1 !== 1) { console.error('ABORT: stale comment not found/uniquely matched'); process.exit(1); }
t = t.replace(stale, '');

const oldRef = '// callers arrange to be the head being put away. Macro-owned motion (machine\n' +
    '// contract s10): the slicer names the station, the firmware moves to it.';
const newRef = '// callers arrange to be the head being put away. The motion is macro-owned\n' +
    '// (FibreSeeker3 GCODE_REFERENCE.md: the brush macros are passed through uninterpreted),\n' +
    '// so the slicer only names the station and the firmware moves to it.';
const oldRefCRLF = oldRef.split('\n').join(NL);
if (t.split(oldRefCRLF).length - 1 !== 1) { console.error('ABORT: brush comment not found/uniquely matched'); process.exit(1); }
t = t.replace(oldRefCRLF, newRef.split('\n').join(NL));

fs.writeFileSync(file, Buffer.from(t, 'latin1'));
const t2 = fs.readFileSync(file, 'latin1');
console.log('OK  CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
