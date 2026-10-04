const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/Fiber/FiberToolChange.cpp';
let s=fs.readFileSync(P,'latin1');
function rep(old,nw,label){
  const n=s.split(old).length-1;
  if(n!==1){console.log('HIT '+label+' = '+n);process.exit(1);}
  s=s.split(old).join(nw);
}
// ---- item 1: emit the incoming head's standby target too ----
const OLD1=[
'        if (p.emit_readiness_wait) {',
'            // Pre-charge at WORKING temperature, not standby: the vendor sends',
'            // M104 S<t0_temp> T0 here so the head is already climbing when the',
'            // blocking M109 below is reached. Charging it to standby and then',
'            // waiting for working temperature would only make the wait longer.',
'            put(s, "M104 S" + std::to_string(p.t0_temp_c) + " T0 ; pre-charge");',
'            put(s, "M109 S" + std::to_string(p.t0_temp_c) + " T0");',
'        }'].join('\r\n');
const NEW1=[
'        if (p.emit_readiness_wait) {',
'            // Standby target for the head being ACTIVATED, so that this block',
'            // carries a target for BOTH heads as the objective requires. It is a',
'            // measured no-op: the composite head is already parked at this exact',
'            // temperature, because the fibre->plastic half dropped it here on the',
'            // way out of the previous window, and 0/315 reference blocks send it.',
'            // It is harmless (M104 does not block) and it is overridden two lines',
'            // later by the working-temperature pre-charge below, so the vendor',
'            // thermal behaviour is unchanged. It sits INSIDE the readiness gate on',
'            // purpose: where no M109 follows, dropping the head to standby with no',
'            // way to bring it back would strand it cold, so the gate keeps the',
'            // clause satisfiable without ever making the print worse.',
'            append_standby(s, p.t0_standby_c, 0);',
'            // Pre-charge at WORKING temperature, not standby: the vendor sends',
'            // M104 S<t0_temp> T0 here so the head is already climbing when the',
'            // blocking M109 below is reached. Charging it to standby and then',
'            // waiting for working temperature would only make the wait longer.',
'            put(s, "M104 S" + std::to_string(p.t0_temp_c) + " T0 ; pre-charge");',
'            put(s, "M109 S" + std::to_string(p.t0_temp_c) + " T0");',
'        }'].join('\r\n');
rep(OLD1,NEW1,'standby-in');
// ---- item 2: name the owning head in the emitted P-word line ----
const OLD2=[
'    const int fiber_pct   = fiber_active ? demand : 0;',
'    const int plastic_pct = fiber_active ? 0 : demand;',
'    char buf[64];',
'    std::snprintf(buf, sizeof(buf), "M106 P2 S%d ; fibre-side cooling, fan4", (int)(255.0 * fiber_pct / 100.0));',
'    put(s, buf);',
'    std::snprintf(buf, sizeof(buf), "M106 P1 S%d ; part-cooling, fan3", (int)(255.0 * plastic_pct / 100.0));',
'    put(s, buf);'].join('\r\n');
const NEW2=[
'    const int fiber_pct   = fiber_active ? demand : 0;',
'    const int plastic_pct = fiber_active ? 0 : demand;',
'    // Name the head that owns each output, in the emitted line itself, so each',
'    // head\'s cooling output is attributable at the switch: fibre deposits from T0',
'    // (left composite head) and plastic from T1 (right plastic head). The PORT is',
'    // not per-head - HardwareInfo 7.3 maps P1 to fan3 and P2 to fan4 as shared',
'    // outputs - so this is per-head ATTRIBUTION of a shared output, which is the',
'    // reading of "routed explicitly per head" implemented here. See the PENDING',
'    // OWNER RULING block in docs/HLSD/continuous_fiber_gcode.md.',
'    const char* dep  = fiber_active ? "depositing" : "idle";',
'    const char* idle = fiber_active ? "idle" : "depositing";',
'    char buf[96];',
'    std::snprintf(buf, sizeof(buf), "M106 P2 S%d ; fibre-side cooling, fan4, owned by T0 (%s)",',
'                  (int)(255.0 * fiber_pct / 100.0), dep);',
'    put(s, buf);',
'    std::snprintf(buf, sizeof(buf), "M106 P1 S%d ; part-cooling, fan3, owned by T1 (%s)",',
'                  (int)(255.0 * plastic_pct / 100.0), idle);',
'    put(s, buf);'].join('\r\n');
rep(OLD2,NEW2,'fan-owner');
fs.writeFileSync(P,s,'latin1');
console.log('OK cpp');
