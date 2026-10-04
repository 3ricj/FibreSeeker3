// Correct the four stale statements in FiberToolChange.hpp to the measured
// on-disk Rocket ground truth. Exact latin1 replacements with hit-count
// assertions, CRLF preserved.
const fs = require('fs');
const P = '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/Fiber/FiberToolChange.hpp';
let s = fs.readFileSync(P, 'latin1');

function rep(old, neu, tag) {
    const n = s.split(old).length - 1;
    if (n !== 1) { console.log('FAIL ' + tag + ' hits=' + n); process.exit(1); }
    s = s.split(old).join(neu);
    console.log('ok ' + tag);
}
const C = (a) => a.join('\r\n');

// ---- 1. The "Rocket pairs both sides" block: replace with measured verbatim.
rep(C([
'// Rocket pairs both sides of every switch:',
'//',
'//   plastic -> fibre   G1 F1200 E-5 / M104 S120 T1 / M104 S150 T0 /',
'//                      M109 S270 T0 / brush / T0',
'//   fibre -> plastic   G1 F600 V-4 / M104 S150 T0 / brush / T1 / G1 F900 E5',
'//',
]), C([
'// Rocket pairs both sides of every switch. The two blocks below are copied',
'// verbatim from the reference exports in FibreSeeker3/Test_files (Rocket',
'// Slicer v1.3.1.480) and the coverage is measured, not remembered: across',
'// 720 harvested change-extruder blocks in 6 continuous-fiber references,',
'// 351/351 plastic->fibre blocks and 358/358 fibre->plastic blocks carry M400,',
'// an M104 for BOTH heads, a blocking M109, a brush visit and an M106 with an',
'// explicit P word.',
'//',
'//   plastic -> fibre   M400 / M104 S270 T0 / M104 S150 T1 / M106 P1 S229 /',
'//                      G1 F1200 E-5 / Z lift / brush / T0 / M106 P2 S255 /',
'//                      M109 S270 T0 / M106 P1 S0',
'//   fibre -> plastic   M400 / M104 S250 T1 / M104 S180 T0 / M106 P2 S204 /',
'//                      G1 F600 V-4 / Z lift / T1 / M106 P1 S255 / brush /',
'//                      M109 S250 T1 / M106 P2 S0',
'//',
'// Note which head gets which target. The head being PUT AWAY is dropped to',
'// STANDBY (T1 -> 150 going into fibre, T0 -> 180 coming out of it). The head',
'// being ACTIVATED is pre-charged at its WORKING temperature, not standby',
'// (T0 -> 270 going into fibre, T1 -> 250 coming out), because the blocking',
'// M109 for that head is two lines later and charging it to standby first',
'// would only make the wait longer. So "a standby target for both heads" is',
'// not what the vendor emits: it emits one standby target and one working-',
'// temperature pre-charge, in both directions, 351/351 and 358/358. See the',
'// note in docs/HLSD/continuous_fiber_gcode.md - this narrows the owner',
'// objective wording and is flagged there for ruling.',
'//',
]), 'seq-block');

// ---- 2. Ledger paragraph: the vendor is at 0.000, not -1.
rep(C([
'// The two withdrawals are what close the stationary-V ledger. emit_strand',
'// already ends a window at V-<fs_retract_v> and opens the next one by',
'// recovering that same amount plus any prime remainder, so within-window V is',
'// self-pairing. The tool-change withdrawal is a THIRD quantity, issued on the',
'// way out and never recovered, which is why the per-cycle net was +3 mm where',
'// the vendor sits at -1 mm.',
]), C([
'// The three V quantities are what close the stationary-V ledger. emit_strand',
'// already ends a window at V-<fs_retract_v> and opens the next one by',
'// recovering that same amount plus any prime remainder, so within-window V is',
'// self-pairing. The tool-change withdrawal is a THIRD quantity, issued on the',
'// way out and never recovered, and adding it is what moves the per-window net',
'// from +3 mm to -1 mm.',
'//',
'// The vendor number is NOT -1 mm. Measured with one method on all six',
'// reference exports, Rocket nets 0.000 mm per fibre window in every single',
'// file, decomposing as +5 restart/feed, -1 window retract, -4 tool-change',
'// withdrawal. Our canonical single-window ledger is +4 -1 -4 = -1 mm, i.e.',
'// one millimetre MORE withdrawn than the vendor, and the entire difference is',
'// the prime: fs_prime_v is 4 where the vendor primes 5. That is a profile',
'// value, deliberately untouched here, and reported for the owner to rule on.',
'// The -1 mm in the original brief is Rocket\'s two withdrawals without its',
'// prime, not Rocket\'s net.',
]), 'ledger-para');

// ---- 3. struct defaults: measured 180 / 150.
rep(C([
'    // Standby target dropped on the composite head when its window closes,',
'    // degrees. Keeps the hotend charged enough to come back fast without',
'    // cooking matrix in the nozzle. Vendor value 150.',
'    int t0_standby_c = 150;',
'    // Standby target dropped on the plastic head while fibre is running,',
'    // degrees. Vendor value 120.',
'    int t1_standby_c = 120;',
]), C([
'    // Standby target dropped on the composite head when its window closes,',
'    // degrees. Keeps the hotend charged enough to come back fast without',
'    // cooking matrix in the nozzle. Measured vendor value 180, for a working',
'    // temperature of 270; the PLA reference parks at 100 for a working 230,',
'    // so this tracks material rather than sitting at a fixed offset.',
'    int t0_standby_c = 180;',
'    // Standby target dropped on the plastic head while fibre is running,',
'    // degrees. Measured vendor value 150, constant across all six references',
'    // including the PLA one, so it is a fixed park rather than a fraction of',
'    // the working temperature.',
'    int t1_standby_c = 150;',
]), 'struct-defaults');

// ---- 4. Ledger function comment: vendor at 0.000.
rep(C([
'// `toolchange_retract_v_mm` out and is never recovered. Exposed so the ledger',
'// is a number the tests and the report can name rather than a claim: the',
'// vendor reference sits at -1 mm, a prime of 4 with a retract of 1 and no',
'// tool-change withdrawal sits at +3 mm.',
]), C([
'// `toolchange_retract_v_mm` out and is never recovered. Exposed so the ledger',
'// is a number the tests and the report can name rather than a claim. Measured',
'// vendor net is 0.000 mm per window in all six reference exports (+5 -1 -4).',
'// At the shipped fs_prime_v of 4 this returns -1.000 mm, one mm more withdrawn',
'// than the vendor; with no tool-change withdrawal it returns +3.000 mm.',
'// Closing the last millimetre is a prime change, i.e. a profile decision.',
]), 'ledger-fn');

fs.writeFileSync(P, s, 'latin1');
const b = fs.readFileSync(P);
let crlf = 0, lf = 0;
for (let i = 0; i < b.length; i++) if (b[i] === 0x0a) { if (i > 0 && b[i - 1] === 0x0d) crlf++; else lf++; }
console.log('written. CRLF=' + crlf + ' bareLF=' + lf);
