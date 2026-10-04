const fs=require('fs');
const T='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_toolchange.cpp';
let s=fs.readFileSync(T,'latin1');
let fails=[];
function rep(old,nw,label,count){
  if(!old.includes('\r\n')) old=old.replace(/\n/g,'\r\n');
  if(!nw.includes('\r\n')) nw=nw.replace(/\n/g,'\r\n');
  const n=s.split(old).length-1;
  if(n!==(count||1)){fails.push('HIT '+n+' (want '+(count||1)+') '+label);return;}
  s=s.split(old).join(nw); console.log('OK '+label+' x'+n);
}

// profile_params now carries the measured vendor standby pair.
rep("    p.t0_standby_c            = 150;\r\n    p.t1_standby_c            = 120;",
    "    p.t0_standby_c            = 180;\r\n    p.t1_standby_c            = 150;",'profile_params standby pair');

// --- to-fiber block -------------------------------------------------------
rep('    // Standby targets for BOTH heads, before the switch.\r\n    CHECK(s.find("M104 S120 T1 ; standby") != std::string::npos);\r\n    CHECK(s.find("M104 S150 T0 ; standby") != std::string::npos);',
    '    // The block opens with a planner flush, as every vendor block does.\r\n' +
    '    CHECK(s.find("M400") == 0);\r\n' +
    '    // The plastic head being put away is dropped to standby, and the composite\r\n' +
    '    // head being activated is pre-charged at WORKING temperature (measured: the\r\n' +
    '    // vendor sends M104 S150 T1 then M104 S270 T0 on every entry into fibre).\r\n' +
    '    CHECK(s.find("M104 S150 T1 ; standby") != std::string::npos);\r\n' +
    '    CHECK(s.find("M104 S270 T0 ; pre-charge") != std::string::npos);','to-fiber thermal pair');

rep('    CHECK(count_sub(s, "\\n") == 9);','    CHECK(count_sub(s, "\\n") == 10);','to-fiber line count');

// --- to-plastic block -----------------------------------------------------
rep('    CHECK(s.find("M104 S150 T0 ; standby") != std::string::npos);\r\n    CHECK(s.find("M109 S250 T1") != std::string::npos);    // Cleaned on the way out, before the switch.',
    '    CHECK(s.find("M400") == 0);\r\n' +
    '    CHECK(s.find("M104 S180 T0 ; standby") != std::string::npos);\r\n' +
    '    CHECK(s.find("M104 S250 T1 ; pre-charge") != std::string::npos);\r\n' +
    '    CHECK(s.find("M109 S250 T1") != std::string::npos);    // Cleaned on the way out, before the switch.','to-plastic thermal pair');

rep('    CHECK(s.find("M104 S150 T0") < s.find("T1 ;"));','    CHECK(s.find("M104 S180 T0") < s.find("T1 ;"));','to-plastic ordering');

// --- no-restore case ------------------------------------------------------
rep('    CHECK(nr.find("M104 S120 T1") == std::string::npos);','    CHECK(nr.find("M104 S150 T1") == std::string::npos);','no-restore T1 absent');
rep('    CHECK(nr.find("M104 S150 T0 ; standby") != std::string::npos);','    CHECK(nr.find("M104 S270 T0 ; pre-charge") != std::string::npos);','no-restore T0 pre-charge');

// --- first-window case ----------------------------------------------------
rep('    CHECK(s.find("M104 S120 T1 ; standby") != std::string::npos);\r\n    CHECK(s.find("M104 S150 T0") == std::string::npos);',
    '    CHECK(s.find("M104 S150 T1 ; standby") != std::string::npos);\r\n    CHECK(s.find("M104 S270 T0") == std::string::npos);','first-window thermal pair');

// --- pairing counts -------------------------------------------------------
rep('    CHECK(count_sub(out, "M104") == 1);','    CHECK(count_sub(out, "M104") == 2);','to-plastic M104 count');

if(fails.length){fails.forEach(f=>console.log('FAIL '+f));process.exit(1);}
fs.writeFileSync(T,s,'latin1');
const t=fs.readFileSync(T,'latin1');
console.log('CRLF='+((t.match(/\r\n/g)||[]).length)+' LFonly='+((t.match(/(?<!\r)\n/g)||[]).length));
