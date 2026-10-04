const fs=require('fs');
const T='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_export_identity.cpp';
let s=fs.readFileSync(T,'latin1');
let bad=[];
function rep(o,n,l){o=o.replace(/\n/g,'\r\n');n=n.replace(/\n/g,'\r\n');const c=s.split(o).length-1;if(c!==1){bad.push('HIT '+c+' '+l);return;}s=s.split(o).join(n);console.log('OK '+l);}

// enable_part_cooling removed: enable_fan / fan_mode / min_fan_speed are not
// registered options in this fork (the shipped preset key enable_fan is dead),
// so setting them throws. The cooling path is exercised anyway - see the
// fan-present assertion, which now documents the real mechanism.
rep('    make_bytes_comparable(config);\n    enable_part_cooling(config);',
    '    make_bytes_comparable(config);','remove enable_part_cooling call');

rep('void enable_part_cooling(DynamicPrintConfig& config)\n{\n    config.set_key_value("enable_fan", new ConfigOptionBool(true));\n    config.set_key_value("fan_mode", new ConfigOptionInt(2 /*FAN_MODE_PERIODIC*/));\n    config.set_key_value("initial_layer_fan_speed", new ConfigOptionInt(100));\n    config.set_key_value("min_fan_speed", new ConfigOptionInt(100));\n    config.set_key_value("max_fan_speed", new ConfigOptionInt(100));\n    config.set_key_value("slowdown_below_layer_time", new ConfigOptionInt(30));\n}\n\n',
    '', 'remove enable_part_cooling helper');

rep('    // The cooling path is in the compared bytes: at least one part-cooling\n    // command must have been emitted, or this case silently proves nothing about\n    // fan output. Counted rather than searched for a fixed value, because the\n    // value is the cooling system business, not this test\'s.\n',
    '    // The cooling path is genuinely in the compared bytes. This fork does not\n' +
    '    // register enable_fan / fan_mode / min_fan_speed at all (the shipped preset\n' +
    '    // carries a dead enable_fan key), so CoolingBuffer drives the fan from\n' +
    '    // fan_cooling_layer_time / fan_min_speed / fan_max_speed and emits varying\n' +
    '    // speeds. Asserting a non-zero count is what makes the byte comparison a\n' +
    '    // fan-output proof rather than a claim: if the cooling path ever stopped\n' +
    '    // emitting, this fails instead of quietly narrowing the comparison.\n',
    'fan assertion comment');

if(bad.length){bad.forEach(b=>console.log('FAIL '+b));process.exit(1);}
fs.writeFileSync(T,s,'latin1');
const t=fs.readFileSync(T,'latin1');
console.log('CRLF='+((t.match(/\r\n/g)||[]).length)+' LF='+((t.match(/(?<!\r)\n/g)||[]).length));
console.log('enable_part_cooling remaining: '+((t.match(/enable_part_cooling/g)||[]).length));
