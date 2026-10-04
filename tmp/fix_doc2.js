// Add the durable "standby targets for both heads" ruling flag beside the
// temperature steps in docs/HLSD/continuous_fiber_gcode.md.
const fs = require('fs');
const P = '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/docs/HLSD/continuous_fiber_gcode.md';
let s = fs.readFileSync(P, 'latin1');
function rep(old, neu, tag) {
    const n = s.split(old).length - 1;
    if (n !== 1) { console.log('FAIL ' + tag + ' hits=' + n); process.exit(1); }
    s = s.split(old).join(neu);
    console.log('ok ' + tag);
}
const C = (a) => a.join('\r\n');

rep(C([
'4. `M104 S<fs_t0_temp> T0` then `M109 S<fs_t0_temp> T0` - pre-charge and then',
'   wait for the incoming head. The pre-charge is at WORKING temperature, not',
'   standby: the vendor sends `M104 S270 T0` / `M109 S270 T0` on every entry into',
'   fibre, so the head is already climbing when the blocking wait is reached.',
'   Skipped only on the first window of a primed plate, where the preamble',
'   preheat plus the priming line already paid it.',
]), C([
'4. `M104 S<fs_t0_temp> T0` then `M109 S<fs_t0_temp> T0` - pre-charge and then',
'   wait for the incoming head. The pre-charge is at WORKING temperature, not',
'   standby: the vendor sends `M104 S270 T0` / `M109 S270 T0` on every entry into',
'   fibre, so the head is already climbing when the blocking wait is reached.',
'   Skipped only on the first window of a primed plate, where the preamble',
'   preheat plus the priming line already paid it.',
'',
'   > **PENDING OWNER RULING - standby-target clause.** The objective asks for',
'   > "standby targets for both heads" at the plastic->fibre switch. Measured',
'   > against the reference exports on disk, that is not what the vendor does',
'   > and the clause is superseded: in **351 of 351** plastic->fibre blocks the',
'   > outgoing head gets a standby target (`M104 S150 T1`) and the incoming head',
'   > gets a WORKING-temperature pre-charge (`M104 S270 T0`) - **zero** blocks',
'   > drop the incoming head to standby on the way into fibre. The same shape',
'   > holds in reverse (358/358 fibre->plastic blocks: `M104 S180 T0` standby +',
'   > `M104 S250 T1` pre-charge). Both heads do receive a temperature target, so',
'   > the intent of the clause is met; only the word "standby" for the incoming',
'   > head is not. Emitting a T0 standby line there would be immediately',
'   > contradicted by the `M109` two lines later and would lengthen the wait.',
'   > Flagged rather than settled.',
]), 'standby-flag');

fs.writeFileSync(P, s, 'latin1');
const b = fs.readFileSync(P);
let crlf = 0, lf = 0;
for (let i = 0; i < b.length; i++) if (b[i] === 0x0a) { if (i > 0 && b[i - 1] === 0x0d) crlf++; else lf++; }
console.log('written. CRLF=' + crlf + ' bareLF=' + lf);
