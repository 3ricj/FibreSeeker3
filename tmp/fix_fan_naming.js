// Correct the fan naming in FiberToolChange.{cpp,hpp} and the fixture against the
// hardware doc. Exploration/HardwareInfo.md 7.3 maps P1 -> fan3 ("Part-cooling
// fan", PB5) and P2 -> fan4 ("Fiber-related fan", PC9), and marks both functions
// as carrying uncertainty. The emitted comments therefore name the port and the
// doc's own term rather than claiming a per-head fan. Routing is unchanged.
const fs = require('fs');
const REPO = process.argv[2];
const NL = '\r\n';
const A = String.fromCharCode(39);

function sub(file, pairs) {
    let t = fs.readFileSync(REPO + '/' + file, 'latin1');
    for (const p of pairs) {
        const hits = t.split(p[0]).length - 1;
        if (hits !== 1) {
            console.error('ABORT ' + file + ': pattern occurs ' + hits + ' times: ' + JSON.stringify(p[0].slice(0, 70)));
            process.exit(1);
        }
        t = t.replace(p[0], p[1]);
    }
    fs.writeFileSync(REPO + '/' + file, Buffer.from(t, 'latin1'));
    const t2 = fs.readFileSync(REPO + '/' + file, 'latin1');
    console.log('OK ' + file + '  CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
}
const L = arr => arr.join(NL);

sub('src/libslic3r/Fiber/FiberToolChange.cpp', [
    [
        L(['// Explicit per-head part-cooling at a switch. P1 is the plastic head fan,',
           '// P2 the fibre head fan (FibreSeeker3 Exploration/HardwareInfo.md 7.3: P1 ->',
           '// fan3 part-cooling, P2 -> fan4 fibre-related). The generic writer' + A + 's bare',
           '// M106 drives both at once, which is exactly the un-routed behaviour this',
           '// replaces on the fibre path; the plastic path keeps its own cooling logic.']),
        L(['// Explicit cooling-output routing at a switch. FibreSeeker3',
           '// Exploration/HardwareInfo.md 7.3 maps P1 -> fan3 (doc term: part-cooling fan,',
           '// PB5) and P2 -> fan4 (doc term: fiber-related fan, PC9), and marks both',
           '// functions as carrying uncertainty; neither is documented as a per-head fan, so',
           '// the emitted comments name the port and the doc term rather than a head.',
           '// Routing means: the fibre-side output runs while fibre deposits and the',
           '// part-cooling output while plastic does, and the output not in use is explicitly',
           '// zeroed. The generic writer' + A + 's bare M106 drives fan3 and fan4 together,',
           '// which is the un-routed behaviour this replaces on the fibre path; the plastic',
           '// path keeps its own cooling logic.'])
    ],
    [
        '    // The head about to deposit keeps the cooling demand; the head being put' + NL +
        '    // away has its fan explicitly zeroed rather than left running.',
        '    // The output the depositing material needs keeps the cooling demand; the' + NL +
        '    // other one is explicitly zeroed rather than left running.'
    ],
    ['std::snprintf(buf, sizeof(buf), "M106 P2 S%d ; fibre head fan"',
     'std::snprintf(buf, sizeof(buf), "M106 P2 S%d ; fibre-side cooling, fan4"'],
    ['std::snprintf(buf, sizeof(buf), "M106 P1 S%d ; plastic head fan"',
     'std::snprintf(buf, sizeof(buf), "M106 P1 S%d ; part-cooling, fan3"']
]);

sub('src/libslic3r/Fiber/FiberToolChange.hpp', [
    [
        L(['    // drives BOTH head fans at once (FibreSeeker3 Exploration/HardwareInfo.md',
           '    // 7.3: plain M106 sets fan3 + fan4 together, P1 -> fan3, P2 -> fan4), so a',
           '    // composite window cools a parked plastic nozzle and vice versa. The demand',
           '    // is routed to the fan of the head that is about to deposit and zeroed on',
           '    // the head being put away. Negative means "cooling demand not known yet":',
           '    // emit no fan commands at all.']),
        L(['    // drives fan3 AND fan4 at once (FibreSeeker3 Exploration/HardwareInfo.md',
           '    // 7.3 and its fans.cfg remap note: plain M106 sets both; P1 -> fan3,',
           '    // P2 -> fan4), so a fibre window also spins the part-cooling output and a',
           '    // plastic window also spins the fibre-side one. The demand is routed to the',
           '    // output the depositing material needs and the other one is zeroed. Negative',
           '    // means "cooling demand not known yet": emit no fan commands at all.'])
    ]
]);

sub('tests/fibreseeker/fixtures/good_toolchange_pair.gcode', [
    ['M106 P2 S255 ; fibre head fan', 'M106 P2 S255 ; fibre-side cooling, fan4'],
    ['M106 P1 S0 ; plastic head fan', 'M106 P1 S0 ; part-cooling, fan3'],
    ['M106 P2 S0 ; fibre head fan', 'M106 P2 S0 ; fibre-side cooling, fan4'],
    ['M106 P1 S255 ; plastic head fan', 'M106 P1 S255 ; part-cooling, fan3']
]);
