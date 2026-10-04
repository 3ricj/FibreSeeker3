// Add a test pinning the new gate: the plastic head is not parked unless the
// return half can restore it. Written as a script because this repo is CRLF.
const fs = require('fs');
const file = process.argv[2];
const NL = '\r\n';

const anchor = [
    '    // Zero tool-change withdrawal: the withdrawal line disappears, everything',
    '    // else is untouched.'
].join(NL);

const addition = [
    '    // Restore temperature unknown (no writer filament, so the caller cannot',
    '    // resolve it): the plastic head is NOT parked, because the return half has',
    '    // nothing to bring it back to. Parking it anyway would leave the head that',
    '    // prints plastic stranded at standby for the rest of the plate.',
    '    FiberToolChangeParams norestore = profile_params();',
    '    norestore.t1_working_c = 0;',
    '    const std::string nr = emit_toolchange_to_fiber(norestore);',
    '    CHECK(nr.find("M104 S120 T1") == std::string::npos);',
    '    // The composite head is still charged and waited for, and the switch still',
    '    // happens and is still cleaned.',
    '    CHECK(nr.find("M104 S150 T0 ; standby") != std::string::npos);',
    '    CHECK(nr.find("M109 S270 T0") != std::string::npos);',
    '    CHECK(count_sub(nr, "CLEAN_NOZZLE") == 1);',
    '    CHECK(nr.find("T0 ;") != std::string::npos);',
    '',
    anchor
].join(NL);

const txt = fs.readFileSync(file, 'latin1');
const hits = txt.split(anchor).length - 1;
if (hits !== 1) { console.error('ABORT: anchor occurs ' + hits + ' times'); process.exit(1); }
fs.writeFileSync(file, Buffer.from(txt.replace(anchor, addition), 'latin1'));
const t2 = fs.readFileSync(file, 'latin1');
console.log('OK  CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
