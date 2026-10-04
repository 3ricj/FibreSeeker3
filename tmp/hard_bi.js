const fs=require('fs');
const T='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_export_identity.cpp';
let s=fs.readFileSync(T,'latin1');
let bad=[];
function rep(o,n,l){o=o.replace(/\n/g,'\r\n');n=n.replace(/\n/g,'\r\n');const c=s.split(o).length-1;if(c!==1){bad.push('HIT '+c+' '+l);return;}s=s.split(o).join(n);console.log('OK '+l);}

// Shared hardening block, applied to BOTH export cases. Two settings:
//  - gcode_label_objects off removes the "; printing object <name> id:N"
//    diagnostic comments. Their id comes from a counter whose value is not
//    stable across processes for an identical slice (measured: the same single
//    test case in three fresh processes produced id 0, 15, 0), and the exporter
//    emits them from a sorted label list, so the id is not a slice result. They
//    are pure diagnostics and the printer ignores them; leaving them on makes a
//    byte comparison flaky for a reason that has nothing to do with the exporter
//    behaviour under test. Measured effect of the instability alone: 200 lines,
//    all of them object-id comments, zero behavioural lines.
//  - enable_fan / periodic fan cooling turns the cooling path on so the fan
//    lines are IN the compared bytes. Without it the shipped plastic preset
//    (enable_fan = 0) means the byte comparison never exercises a fan line, and
//    the fan-routing clause would be unproven by this test.
rep('    // Explicit rather than left at the registered default, so the proof does\n    // not silently become a fibre test if that default ever changes.\n    config.set_key_value("fs_fiber_enabled", new ConfigOptionBool(false));',
'    // Explicit rather than left at the registered default, so the proof does\n' +
'    // not silently become a fibre test if that default ever changes.\n' +
'    config.set_key_value("fs_fiber_enabled", new ConfigOptionBool(false));\n' +
'    make_bytes_comparable(config);\n' +
'    enable_part_cooling(config);',
'plastic case hardening');

rep('    config.set_key_value("fs_fiber_enabled", new ConfigOptionBool(true));',
'    config.set_key_value("fs_fiber_enabled", new ConfigOptionBool(true));\n' +
'    make_bytes_comparable(config);',
'fibre case hardening');

// helpers
rep('} // namespace\n\nTEST_CASE("Plastic-only export is deterministic and reaches the exporter"',
'// Pin the two settings that make a byte comparison meaningful. See the call\n' +
'// site for what each one is doing there.\nvoid make_bytes_comparable(DynamicPrintConfig& config)\n{\n    config.set_key_value("gcode_label_objects", new ConfigOptionBool(false));\n}\n\nvoid enable_part_cooling(DynamicPrintConfig& config)\n{\n    config.set_key_value("enable_fan", new ConfigOptionBool(true));\n    config.set_key_value("fan_mode", new ConfigOptionInt(2 /*FAN_MODE_PERIODIC*/));\n    config.set_key_value("initial_layer_fan_speed", new ConfigOptionInt(100));\n    config.set_key_value("min_fan_speed", new ConfigOptionInt(100));\n    config.set_key_value("max_fan_speed", new ConfigOptionInt(100));\n    config.set_key_value("slowdown_below_layer_time", new ConfigOptionInt(30));\n}\n\n} // namespace\n\nTEST_CASE("Plastic-only export is deterministic and reaches the exporter"',
'helpers');

// assert fan lines actually present, so the proof cannot pass on a fanless export
rep('    CHECK(body.size() > 1000);\n    CHECK(body.find("MOVE_TO_BRUSH_STATION") != std::string::npos);',
'    CHECK(body.size() > 1000);\n    CHECK(body.find("MOVE_TO_BRUSH_STATION") != std::string::npos);\n' +
'    // The cooling path is in the compared bytes: at least one part-cooling\n' +
'    // command must have been emitted, or this case silently proves nothing about\n' +
'    // fan output. Counted rather than searched for a fixed value, because the\n' +
'    // value is the cooling system business, not this test\'s.\n' +
'    {\n        size_t n = 0;\n        for (size_t p = body.find("M106"); p != std::string::npos; p = body.find("M106", p + 4))\n            ++n;\n        CHECK(n > 0);\n    }',
'fan-present assertion');

if(bad.length){bad.forEach(b=>console.log('FAIL '+b));process.exit(1);}
fs.writeFileSync(T,s,'latin1');
const t=fs.readFileSync(T,'latin1');
console.log('CRLF='+((t.match(/\r\n/g)||[]).length)+' LF='+((t.match(/(?<!\r)\n/g)||[]).length));
