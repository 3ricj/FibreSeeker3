const fs=require('fs');
const R='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/';

// ---- helper: to_fiber no longer emits M400; the caller does, before its retract
const H=R+'src/libslic3r/Fiber/FiberToolChange.cpp';
let h=fs.readFileSync(H,'latin1');
function repH(old,nw,label){
  if(!old.includes('\r\n')) old=old.replace(/\n/g,'\r\n');
  if(!nw.includes('\r\n')) nw=nw.replace(/\n/g,'\r\n');
  const n=h.split(old).length-1;
  if(n!==1){console.log('HIT '+n+' '+label);process.exit(1);}
  h=h.split(old).join(nw); console.log('OK '+label);
}
repH(
"    std::string s;\r\n" +
"    // Flush the planner queue before anything touches temperatures, exactly as\r\n" +
"    // the vendor does: M400 leads EVERY tool-change block in all six reference\r\n" +
"    // exports (181 occurrences in Benchy_renforced_level5.gcode, present in\r\n" +
"    // 136/136 and 37/37 blocks in the others). Without it a queued extrusion can\r\n" +
"    // still be in flight when the standby M104 lands, so the withdrawal and the\r\n" +
"    // temperature change race.\r\n" +
"    put(s, \"M400\");",
"    std::string s;\r\n" +
"    // NOTE: no M400 here, unlike emit_toolchange_to_plastic below. The vendor\r\n" +
"    // leads every tool-change block with a planner flush (181 occurrences in\r\n" +
"    // Benchy_renforced_level5.gcode; present in 136/136 and 37/37 blocks in the\r\n" +
"    // other reference exports), and on this half the flush has to precede the\r\n" +
"    // caller's outgoing E withdrawal, so the caller emits it. See the call site\r\n" +
"    // in GCode::process_layer.",
'to_fiber M400 -> caller');
fs.writeFileSync(H,h,'latin1');

// ---- call site: emit M400 before the outgoing withdrawal --------------------
const G=R+'src/libslic3r/GCode.cpp';
let g=fs.readFileSync(G,'latin1');
function repG(old,nw,label){
  if(!old.includes('\r\n')) old=old.replace(/\n/g,'\r\n');
  if(!nw.includes('\n') && !nw.includes('\r\n')) nw=nw.replace(/\n/g,'\r\n');
  if(!nw.includes('\r\n')) nw=nw.replace(/\n/g,'\r\n');
  const n=g.split(old).length-1;
  if(n!==1){console.log('HIT '+n+' '+label);process.exit(1);}
  g=g.split(old).join(nw); console.log('OK '+label);
}
repG(
"            if (m_config.fs_t0_wrap.value) {\r\n" +
"                // Outgoing withdrawal of the plastic channel while T1 is still selected,",
"            if (m_config.fs_t0_wrap.value) {\r\n" +
"                // Planner flush ahead of everything, matching the vendor, whose\r\n" +
"                // tool-change blocks all lead with M400. It has to precede the\r\n" +
"                // withdrawal below, so it is emitted here rather than by the helper.\r\n" +
"                gcode += \"M400\\n\";\r\n" +
"                // Outgoing withdrawal of the plastic channel while T1 is still selected,",
'caller M400');
fs.writeFileSync(G,g,'latin1');

// ---- fixture: M400 already leads the block there, just fix the header note ---
const F=R+'tests/fibreseeker/fixtures/good_toolchange_pair.gcode';
let f=fs.readFileSync(F,'latin1');
const fo="G1 E-10 F1200 ; retract for toolchange\r\nM400\r\n";
const fn="M400\r\nG1 E-10 F1200 ; retract for toolchange\r\n";
if(f.split(fo).length-1!==1){console.log('FIXTURE HIT');process.exit(1);}
f=f.split(fo).join(fn);
fs.writeFileSync(F,f,'latin1');
console.log('OK fixture M400 leads');

for (const p of [H,G,F]){
  const t=fs.readFileSync(p,'latin1');
  console.log((t.match(/(?<!\r)\n/g)||[]).length===0 ? 'CRLF-OK '+p.split('/').pop() : 'EOL-MIX '+p);
}
