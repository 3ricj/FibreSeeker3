// Document in the fixture header why the two caller-side E lines look the way
// they do, so a future reader does not "tidy" them and break the pin.
const fs = require('fs');
const REPO = process.argv[2];
const NL = '\r\n';
const f = REPO + '/tests/fibreseeker/fixtures/good_toolchange_pair.gcode';
let t = fs.readFileSync(f, 'latin1');
const anchor = '; The brush macros and M73 are allowlisted commands.' + NL;
const add = [
    '; The two caller-side E lines are the writer own shape, not a transcription:',
    '; the withdrawal is GCodeWriter::retract_for_toolchange(), so its feedrate is',
    '; filament_retraction_speed (the PETG profile carries 20, overriding the machine',
    '; 25) and its length is retract_length_toolchange = 10; the recovery is',
    '; GCodeWriter::unretract(), whose feedrate is deretraction_speed = 25 (no filament',
    '; override) and whose comment argument is already semicolon-led, so the formatter',
    '; emits the doubled separator seen below. use_relative_e_distances = 1 in the',
    '; shipped profile, so reset_e() emits no G92 line.',
    anchor
].join(NL);
const hits = t.split(anchor).length - 1;
if (hits !== 1) { console.error('ABORT hits=' + hits); process.exit(1); }
t = t.replace(anchor, add);
fs.writeFileSync(f, Buffer.from(t, 'latin1'));
console.log('OK; CRLF=' + (fs.readFileSync(f, 'latin1').match(/\r\n/g) || []).length);
