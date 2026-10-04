// Add the five new keys to both round-trip expectation lists. Script form: this
// repo is CRLF and the edit tool's tolerant matching joins lines.
const fs = require('fs');
const file = process.argv[2];
const NL = '\r\n';
let txt = fs.readFileSync(file, 'latin1');

const keys = [
    '    {"fs_t0_standby_temp", "150"}, {"fs_t1_standby_temp", "120"},',
    '    {"fs_toolchange_retract_v", "4"}, {"fs_toolchange_retract_v_speed", "600"},',
    '    {"fs_brush_on_toolchange", "1"},'
];

// 1. Vendor list (CF profile carries fs_fiber_prime = when_fiber / 90).
const vAnchor = ['    {"fs_fiber_prime", "when_fiber"}, {"fs_fiber_prime_length", "90"},', '};'].join(NL);
const vNew = ['    {"fs_fiber_prime", "when_fiber"}, {"fs_fiber_prime_length", "90"},',
    '    // Paired composite tool-change sequence. The shipped CF profile does not',
    '    // override these, so the vendor values ARE the declared defaults, picked to',
    '    // match the reference machine: standby 150/120, V-4 @ 600, brush on.',
].concat(keys, ['};']).join(NL);
if (txt.split(vAnchor).length - 1 !== 1) { console.error('ABORT vendor anchor'); process.exit(1); }
txt = txt.replace(vAnchor, vNew);

// 2. Defaults list (legacy: never / 80).
const dAnchor = ['    {"fs_fiber_prime", "never"}, {"fs_fiber_prime_length", "80"},', '};'].join(NL);
const dNew = ['    {"fs_fiber_prime", "never"}, {"fs_fiber_prime_length", "80"},',
    '    // And must not gain a paired tool-change sequence it never asked for: the',
    '    // defaults are inert unless fs_fiber_enabled and fs_t0_wrap are both on.',
].concat(keys, ['};']).join(NL);
if (txt.split(dAnchor).length - 1 !== 1) { console.error('ABORT defaults anchor'); process.exit(1); }
txt = txt.replace(dAnchor, dNew);

fs.writeFileSync(file, Buffer.from(txt, 'latin1'));
const t2 = fs.readFileSync(file, 'latin1');
console.log('fs_brush_on_toolchange occurrences: ' + (t2.split('fs_brush_on_toolchange').length - 1));
console.log('CRLF=' + (t2.match(/\r\n/g) || []).length + ' bareLF=' + (t2.match(/(^|[^\r])\n/g) || []).length);
