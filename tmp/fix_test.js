// Correct the false ledger comment + misleading test name, fix the stale
// S120 comment, and pin the measured struct defaults so they cannot silently
// regress to the brief's 150/120.
const fs = require('fs');
const P = '/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_toolchange.cpp';
let s = fs.readFileSync(P, 'latin1');
function rep(old, neu, tag) {
    const n = s.split(old).length - 1;
    if (n !== 1) { console.log('FAIL ' + tag + ' hits=' + n); process.exit(1); }
    s = s.split(old).join(neu);
    console.log('ok ' + tag);
}
const C = (a) => a.join('\r\n');

rep('    // Line-initial on purpose: "T1 ;" also occurs inside "M104 S120 T1 ; standby".',
    '    // Line-initial on purpose: "T1 ;" also occurs inside "M104 S150 T1 ; standby".',
    's120-comment');

rep(C([
'TEST_CASE("FiberToolChange: the stationary V ledger closes at the vendor net", "[Fiber][FiberToolChange]")',
'{',
'    // Prime 4 in, window retract 1 out, tool-change withdrawal 4 out and never',
'    // recovered: the vendor reference sits at -1 mm and so do we.',
]), C([
'TEST_CASE("FiberToolChange: the stationary V ledger is the measured arithmetic, not a claim", "[Fiber][FiberToolChange]")',
'{',
'    // Prime 4 in, window retract 1 out, tool-change withdrawal 4 out and never',
'    // recovered. The vendor is NOT at -1 mm: measured across all six reference',
'    // exports in Test_files, Rocket nets 0.000 mm per fibre window in every',
'    // file, decomposing as +5 restart/feed, -1 window retract, -4 tool-change.',
'    // At the shipped fs_prime_v of 4 we therefore net -1.000 mm, one millimetre',
'    // MORE withdrawn than the vendor, and the whole difference is the prime.',
'    // Closing it is fs_prime_v 4 -> 5, a profile value this change deliberately',
'    // does not touch. The -1 mm in the original brief is the vendor two',
'    // withdrawals without its prime, not the vendor net.',
]), 'ledger-test');

// Pin the struct defaults against the measured vendor values.
rep(C([
'TEST_CASE("FiberToolChange: the two halves are paired, not one-sided", "[Fiber][FiberToolChange]")',
]), C([
'TEST_CASE("FiberToolChange: the struct defaults are the measured vendor values", "[Fiber][FiberToolChange]")',
'{',
'    // The defaults are measurements off the reference exports in Test_files,',
'    // not numbers from the brief. The brief carried 150 / 120 for the standby',
'    // pair; the six exports on disk carry 180 / 150, and the 150 for the',
'    // plastic head is constant across all six including the PLA one, while the',
'    // composite park tracks material (180 at a 270 working temperature, 100 at',
'    // a 230 one). Pinned so a future edit cannot quietly restore the brief.',
'    FiberToolChangeParams d;',
'    CHECK(d.t0_standby_c == 180);',
'    CHECK(d.t1_standby_c == 150);',
'    CHECK(d.toolchange_retract_v_mm == Approx(4.0));',
'    CHECK(d.toolchange_retract_v_f == Approx(600.0));',
'    CHECK(d.brush_on_toolchange == true);',
'    // A default-constructed block must therefore carry the measured numbers.',
'    d.t0_temp_c      = 270;',
'    d.t1_working_c   = 250;',
'    d.part_cooling_pct = 0;',
'    const std::string in  = emit_toolchange_to_fiber(d);',
'    const std::string out = emit_toolchange_to_plastic(d);',
'    CHECK(in.find("M104 S150 T1 ; standby")  != std::string::npos);',
'    CHECK(in.find("M104 S120 T1")            == std::string::npos);',
'    CHECK(out.find("M104 S180 T0 ; standby") != std::string::npos);',
'    CHECK(out.find("M104 S150 T0")           == std::string::npos);',
'}',
'',
'TEST_CASE("FiberToolChange: the two halves are paired, not one-sided", "[Fiber][FiberToolChange]")',
]), 'defaults-pin');

fs.writeFileSync(P, s, 'latin1');
const b = fs.readFileSync(P);
let crlf = 0, lf = 0;
for (let i = 0; i < b.length; i++) if (b[i] === 0x0a) { if (i > 0 && b[i - 1] === 0x0d) crlf++; else lf++; }
console.log('written. CRLF=' + crlf + ' bareLF=' + lf);
