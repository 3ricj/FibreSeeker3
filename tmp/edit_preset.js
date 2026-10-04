// Add the five new paired-tool-change printer keys to s_Preset_printer_options,
// and split the joined fs_fiber_prime line for readability. Script form because
// this repo's files are CRLF and the edit tool's tolerant matching joins lines.
const fs = require('fs');
const file = process.argv[2];
const NL = '\r\n';

let txt = fs.readFileSync(file, 'latin1');

// 1. Split the joined line (cosmetic; already valid C++).
const joined = '    "fs_fiber_prime", "fs_fiber_prime_length",    "fs_fiber_wall_loops", "fs_fiber_wall_pitch",' + NL + '    "fs_t0_temp",' + NL;
const split  = '    "fs_fiber_prime", "fs_fiber_prime_length",' + NL +
               '    "fs_fiber_wall_loops", "fs_fiber_wall_pitch",' + NL +
               '    "fs_t0_temp",' + NL +
               '    // Paired composite tool-change sequence: standby targets, the tool-change' + NL +
               '    // matrix withdrawal and the brush visit. All printer-owned.' + NL +
               '    "fs_t0_standby_temp", "fs_t1_standby_temp",' + NL +
               '    "fs_toolchange_retract_v", "fs_toolchange_retract_v_speed",' + NL +
               '    "fs_brush_on_toolchange",' + NL;
if (txt.split(joined).length - 1 !== 1) { console.error('ABORT: joined anchor not unique'); process.exit(1); }
txt = txt.replace(joined, split);
fs.writeFileSync(file, Buffer.from(txt, 'latin1'));

const t2 = fs.readFileSync(file, 'latin1');
['fs_t0_standby_temp', 'fs_t1_standby_temp', 'fs_toolchange_retract_v', 'fs_toolchange_retract_v_speed', 'fs_brush_on_toolchange']
    .forEach(function (k) { console.log(k + ': ' + (t2.indexOf('"' + k + '"') >= 0 ? 'in printer list' : 'MISSING')); });
console.log('CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
