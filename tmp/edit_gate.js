// Gate the plastic-head standby drop on the restore temperature being known.
// Written as a script (not the edit tool) because this repo's files are CRLF and
// the edit tool's whitespace-tolerant matching joins lines in them.
const fs = require('fs');
const file = process.argv[2];
const NL = '\r\n';

const oldLines = [
    '    // Standby target for the plastic head being put away: always emitted when',
    '    // the slicer owns thermals, because M104 does not block and a parked nozzle',
    '    // left at working temperature is the ooze source this sequence exists to',
    '    // remove. The composite head is charged and waited for only when the caller',
    '    // asks for the readiness wait; on the first window of a primed plate the head',
    '    // is provably hot, and dropping it to standby without an M109 to bring it',
    '    // back would make it print cold.',
    '    if (p.t0_temp_c > 0) {',
    '        append_standby(s, p.t1_standby_c, 1);',
    '        if (p.emit_readiness_wait) {'
];

const newLines = [
    '    // Standby target for the plastic head being put away: emitted when the',
    '    // slicer owns thermals, because M104 does not block and a parked nozzle left',
    '    // at working temperature is the ooze source this sequence exists to remove.',
    '    // Gated on the restore temperature being KNOWN: parking the head is only',
    '    // safe if the return half can put it back, and the caller passes 0 when the',
    '    // filament working temperature cannot be resolved. The composite head is',
    '    // charged and waited for only when the caller asks for the readiness wait; on',
    '    // the first window of a primed plate the head is provably hot, and dropping',
    '    // it to standby without an M109 to bring it back would make it print cold.',
    '    if (p.t0_temp_c > 0) {',
    '        if (p.t1_working_c > 0)',
    '            append_standby(s, p.t1_standby_c, 1);',
    '        if (p.emit_readiness_wait) {'
];

const oldText = oldLines.join(NL);
const newText = newLines.join(NL);
const txt = fs.readFileSync(file, 'latin1');
const hits = txt.split(oldText).length - 1;
if (hits !== 1) { console.error('ABORT: pattern occurs ' + hits + ' times in ' + file); process.exit(1); }
fs.writeFileSync(file, Buffer.from(txt.replace(oldText, newText), 'latin1'));
const t2 = fs.readFileSync(file, 'latin1');
console.log('OK ' + file + '  CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
