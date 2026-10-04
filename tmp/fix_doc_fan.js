// Align the dialect doc's fan wording with the hardware doc (P2 -> fan4
// fibre-side, P1 -> fan3 part-cooling; not per-head fans).
const fs = require('fs');
const REPO = process.argv[2];
const NL = '\r\n';
const f = REPO + '/docs/HLSD/continuous_fiber_gcode.md';
let t = fs.readFileSync(f, 'latin1');
const old = ['5. `M106 P2 S<n>` / `M106 P1 S<n>` - the demand routed to the head about to',
             '   deposit, zeroed on the head being parked.'].join(NL);
const neu = ['5. `M106 P2 S<n>` / `M106 P1 S<n>` - the demand routed to the cooling output',
             '   the depositing material needs (P2 -> fan4, fibre-side; P1 -> fan3',
             '   part-cooling, per Exploration/HardwareInfo.md 7.3), the other output',
             '   explicitly zeroed.'].join(NL);
const hits = t.split(old).length - 1;
if (hits !== 1) { console.error('ABORT: hits=' + hits); process.exit(1); }
t = t.replace(old, neu);
fs.writeFileSync(f, Buffer.from(t, 'latin1'));
const t2 = fs.readFileSync(f, 'latin1');
console.log('OK doc; CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
