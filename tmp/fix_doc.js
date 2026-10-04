// Add the durable fan-clause flag beside the fan step, and correct the
// "matching the vendor" V claim, in docs/HLSD/continuous_fiber_gcode.md.
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
'6. `M106 P2 S<n>` / `M106 P1 S<n>` - the demand routed to the cooling output',
'   the depositing material needs (P2 -> fan4, fibre-side; P1 -> fan3',
'   part-cooling, per Exploration/HardwareInfo.md 7.3), the other output',
'   explicitly zeroed.',
]), C([
'6. `M106 P2 S<n>` / `M106 P1 S<n>` - the demand routed to the cooling output',
'   the depositing material needs (P2 -> fan4, fibre-side; P1 -> fan3',
'   part-cooling, per Exploration/HardwareInfo.md 7.3), the other output',
'   explicitly zeroed.',
'',
'   > **PENDING OWNER RULING - fan clause.** The objective asks for fan outputs',
'   > "routed explicitly per head". That wording is not satisfiable on this',
'   > machine and is superseded by the hardware documentation: P1 -> fan3 is',
'   > part-cooling and P2 -> fan4 is fibre-side (Exploration/HardwareInfo.md',
'   > 7.3 and its fans.cfg remap note), and **neither is documented as a',
'   > per-head output**, so there is no per-head fan output to route a signal',
'   > to. What the code does instead is route by which material is depositing -',
'   > the fibre-side output is driven during a fibre window and the',
'   > part-cooling output during a plastic window, with the unused one',
'   > explicitly zeroed - on both activation and deactivation, so no window',
'   > inherits a fan state from the previous one and the fibre path emits zero',
'   > bare `M106`. This is the substance of the clause, not its wording, and',
'   > the divergence is flagged rather than settled.',
]), 'fan-flag');

rep(C([
'Two consequences worth naming. The tool-change withdrawal in the return half is',
'a THIRD matrix quantity, issued on the way out and never recovered, so the net',
'commanded stationary V per fibre cycle goes from +3 mm to -1 mm, matching the',
'vendor; `Fiber::fiber_cycle_net_stationary_v_mm` exposes that ledger as a number',
'rather than a claim.',
]), C([
'Two consequences worth naming. The tool-change withdrawal in the return half is',
'a THIRD matrix quantity, issued on the way out and never recovered, so the net',
'commanded stationary V per fibre window goes from +3 mm to -1 mm;',
'`Fiber::fiber_cycle_net_stationary_v_mm` exposes that ledger as a number rather',
'than a claim. The vendor is NOT at -1 mm. Measured with one method across all',
'six reference exports in `Test_files`, Rocket nets **0.000 mm per window in',
'every file**: +5 restart/feed, -1 window retract, -4 tool-change withdrawal.',
'At the shipped `fs_prime_v` of 4 we net -1.000 mm, i.e. one millimetre MORE',
'withdrawn than the vendor, and the whole difference is the prime. Closing it is',
'`fs_prime_v` 4 -> 5, a profile value deliberately untouched here and reported',
'for ruling.',
]), 'v-claim');

fs.writeFileSync(P, s, 'latin1');
const b = fs.readFileSync(P);
let crlf = 0, lf = 0;
for (let i = 0; i < b.length; i++) if (b[i] === 0x0a) { if (i > 0 && b[i - 1] === 0x0d) crlf++; else lf++; }
console.log('written. CRLF=' + crlf + ' bareLF=' + lf);
