const fs=require('fs');
const T='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_toolchange.cpp';
let s=fs.readFileSync(T,'latin1');
let bad=[];
function rep(o,n,l){o=o.replace(/\n/g,'\r\n');n=n.replace(/\n/g,'\r\n');const c=s.split(o).length-1;if(c!==1){bad.push('HIT '+c+' '+l);return;}s=s.split(o).join(n);console.log('OK '+l);}

rep('    // The block opens with a planner flush, as every vendor block does.\n    CHECK(s.find("M400") == 0);',
    '    // No M400 inside this block: on this half the vendor flush precedes the\n' +
    '    // caller outgoing withdrawal, so the caller emits it (see GCode::process_layer).\n' +
    '    CHECK(s.find("M400") == std::string::npos);','to-fiber M400 absent');

// first-window return half: T0 standby is now 180
rep('    const std::string r = emit_toolchange_to_plastic(first);\n    CHECK(r.find("M104 S150 T0 ; standby") != std::string::npos);',
    '    const std::string r = emit_toolchange_to_plastic(first);\n    CHECK(r.find("M104 S180 T0 ; standby") != std::string::npos);','first-window return standby');

if(bad.length){bad.forEach(b=>console.log('FAIL '+b));process.exit(1);}
fs.writeFileSync(T,s,'latin1');
const t=fs.readFileSync(T,'latin1');
console.log('CRLF='+((t.match(/\r\n/g)||[]).length)+' LF='+((t.match(/(?<!\r)\n/g)||[]).length));
