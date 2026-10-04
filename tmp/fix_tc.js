const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/Fiber/FiberToolChange.cpp';
let s=fs.readFileSync(P,'latin1');
function rep(old,nw,label){
  if(!old.includes('\r\n')) old=old.replace(/\n/g,'\r\n');
  if(!nw.includes('\r\n')) nw=nw.replace(/\n/g,'\r\n');
  const n=s.split(old).length-1;
  if(n!==1){console.log('HIT '+n+' for '+label);process.exit(1);}
  s=s.split(old).join(nw); console.log('OK '+label);
}

// 1. M400 first in BOTH blocks (measured 100% of Rocket blocks: 181 in
//    Benchy_renforced_level5, 136/136 and 37/37 in the others).
rep(
"std::string emit_toolchange_to_fiber(const FiberToolChangeParams& p)\n{\n    std::string s;",
"std::string emit_toolchange_to_fiber(const FiberToolChangeParams& p)\n{\n    std::string s;\n" +
"    // Flush the planner queue before anything touches temperatures, exactly as\n" +
"    // the vendor does: M400 leads EVERY tool-change block in all six reference\n" +
"    // exports (181 occurrences in Benchy_renforced_level5.gcode, present in\n" +
"    // 136/136 and 37/37 blocks in the others). Without it a queued extrusion can\n" +
"    // still be in flight when the standby M104 lands, so the withdrawal and the\n" +
"    // temperature change race.\n" +
"    put(s, \"M400\");",
'M400 to_fiber');

rep(
"std::string emit_toolchange_to_plastic(const FiberToolChangeParams& p)\n{\n    std::string s;",
"std::string emit_toolchange_to_plastic(const FiberToolChangeParams& p)\n{\n    std::string s;\n" +
"    put(s, \"M400\"); // see emit_toolchange_to_fiber: leads every vendor block",
'M400 to_plastic');

// 2. Pre-charge the INCOMING head at WORKING temperature (non-blocking M104),
//    not at standby. Measured: Rocket emits M104 S270 T0 on every entry into
//    fibre and M104 S250 T1 on every exit.
rep(
"        if (p.emit_readiness_wait) {\n            append_standby(s, p.t0_standby_c, 0);\n            put(s, \"M109 S\" + std::to_string(p.t0_temp_c) + \" T0\");\n        }",
"        if (p.emit_readiness_wait) {\n" +
"            // Pre-charge at WORKING temperature, not standby: the vendor sends\n" +
"            // M104 S<t0_temp> T0 here so the head is already climbing when the\n" +
"            // blocking M109 below is reached. Charging it to standby and then\n" +
"            // waiting for working temperature would only make the wait longer.\n" +
"            put(s, \"M104 S\" + std::to_string(p.t0_temp_c) + \" T0 ; pre-charge\");\n" +
"            put(s, \"M109 S\" + std::to_string(p.t0_temp_c) + \" T0\");\n" +
"        }",
'pre-charge T0');

rep(
"    if (p.t0_temp_c > 0) {\n        append_standby(s, p.t0_standby_c, 0);\n        if (p.t1_working_c > 0)\n            put(s, \"M109 S\" + std::to_string(p.t1_working_c) + \" T1\");\n    }",
"    if (p.t0_temp_c > 0) {\n        append_standby(s, p.t0_standby_c, 0);\n        if (p.t1_working_c > 0) {\n" +
"            // Pre-charge the plastic head before waiting on it, matching the\n" +
"            // vendor's M104 S<working> T1 / M109 S<working> T1 pair.\n" +
"            put(s, \"M104 S\" + std::to_string(p.t1_working_c) + \" T1 ; pre-charge\");\n" +
"            put(s, \"M109 S\" + std::to_string(p.t1_working_c) + \" T1\");\n" +
"        }\n" +
"    }",
'pre-charge T1');

fs.writeFileSync(P,s,'latin1');
const t=fs.readFileSync(P,'latin1');
console.log('CRLF='+((t.match(/\r\n/g)||[]).length)+' LFonly='+((t.match(/(?<!\r)\n/g)||[]).length));
