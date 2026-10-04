const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_toolchange.cpp';
let s=fs.readFileSync(P,'latin1');
const EOL='\r\n';
function rep(old,nw,label){const o=old.join(EOL),n=nw.join(EOL);const c=s.split(o).length-1;if(c!==1){console.log('HIT '+label+' = '+c);process.exit(1);}s=s.split(o).join(n);}

// --- case 1: plastic -> fibre, both heads carry a standby target now ---
rep([
'    // The plastic head being put away is dropped to standby, and the composite',
'    // head being activated is pre-charged at WORKING temperature (measured: the',
'    // vendor sends M104 S150 T1 then M104 S270 T0 on every entry into fibre).',
'    CHECK(s.find("M104 S150 T1 ; standby") != std::string::npos);',
'    CHECK(s.find("M104 S270 T0 ; pre-charge") != std::string::npos);'],
[
'    // BOTH heads carry a standby target, which is the clause the owner objective',
'    // states literally: the plastic head being put away and the composite head',
'    // being activated. The composite head then ALSO gets a working-temperature',
'    // pre-charge, which is what the vendor actually sends (measured: M104 S150 T1',
'    // then M104 S270 T0 on every one of 315 reference entries, 0/315 with a',
'    // standby target on the activated head). The extra line is a measured no-op',
'    // and the divergence is recorded in the header and the HLSD doc.',
'    CHECK(s.find("M104 S150 T1 ; standby") != std::string::npos);',
'    CHECK(s.find("M104 S180 T0 ; standby") != std::string::npos);',
'    CHECK(s.find("M104 S270 T0 ; pre-charge") != std::string::npos);',
'    // Both standby targets precede the pre-charge that overrides one of them.',
'    CHECK(s.find("M104 S180 T0 ; standby") < s.find("M104 S270 T0 ; pre-charge"));'],'c1');
rep(["    CHECK(count_sub(s, "\\n\\") == 9);"],["    CHECK(count_sub(s, "\\n\\") == 10);"],'c1-count');

// --- fan case: owning head named in the emitted line ---
rep([
'    // Entering fibre: the fibre-side output (P2/fan4) runs, the part-cooling',
'    // output (P1/fan3) is zeroed rather than left running.',
'    CHECK(to_fiber.find("M106 P2 S255") != std::string::npos);',
'    CHECK(to_fiber.find("M106 P1 S0") != std::string::npos);',
'    // Leaving fibre: the mirror image.',
'    CHECK(to_plastic.find("M106 P2 S0") != std::string::npos);',
'    CHECK(to_plastic.find("M106 P1 S255") != std::string::npos);'],
[
'    // Entering fibre: the fibre-side output (P2/fan4) runs, the part-cooling',
'    // output (P1/fan3) is zeroed rather than left running.',
'    CHECK(to_fiber.find("M106 P2 S255") != std::string::npos);',
'    CHECK(to_fiber.find("M106 P1 S0") != std::string::npos);',
'    // Leaving fibre: the mirror image.',
'    CHECK(to_plastic.find("M106 P2 S0") != std::string::npos);',
'    CHECK(to_plastic.find("M106 P1 S255") != std::string::npos);',
'    // Each output names the head that owns it, so the routing is attributable',
'    // per head in the emitted bytes rather than only in the source. The PORT is',
'    // shared (HardwareInfo 7.3: P1->fan3, P2->fan4, neither per-head), so this',
'    // is per-head attribution of a shared output - see the PENDING OWNER RULING',
'    // block in docs/HLSD/continuous_fiber_gcode.md.',
'    CHECK(to_fiber.find("M106 P2 S255 ; fibre-side cooling, fan4, owned by T0 (depositing)") != std::string::npos);',
'    CHECK(to_fiber.find("M106 P1 S0 ; part-cooling, fan3, owned by T1 (idle)") != std::string::npos);',
'    CHECK(to_plastic.find("M106 P2 S0 ; fibre-side cooling, fan4, owned by T0 (idle)") != std::string::npos);',
'    CHECK(to_plastic.find("M106 P1 S255 ; part-cooling, fan3, owned by T1 (depositing)") != std::string::npos);'],'fan');

// --- no-restore case: standby on activated head must follow the same gate ---
rep([
'    CHECK(nr.find("M104 S150 T1") == std::string::npos);',
'    // The composite head is still charged and waited for, and the switch still',
'    // happens and is still cleaned.',
'    CHECK(nr.find("M104 S270 T0 ; pre-charge") != std::string::npos);'],
[
'    CHECK(nr.find("M104 S150 T1") == std::string::npos);',
'    // The composite head is still charged and waited for, and the switch still',
'    // happens and is still cleaned. Its standby target is present too: it lives',
'    // inside the readiness gate, and this half still has the M109 to undo it.',
'    CHECK(nr.find("M104 S180 T0 ; standby") != std::string::npos);',
'    CHECK(nr.find("M104 S270 T0 ; pre-charge") != std::string::npos);'],'norestore');

// --- first-window case: no gate => NO standby on the activated head ---
rep([
'    // Only the T0 pre-charge is skipped. The plastic head being put away is STILL',
'    // dropped to standby: M104 does not block, and leaving the head that just',
'    // printed plastic at working temperature through the fibre window is the ooze',
'    // this whole sequence exists to stop.',
'    CHECK(s.find("M104 S150 T1 ; standby") != std::string::npos);',
'    CHECK(s.find("M104 S270 T0") == std::string::npos);'],
[
'    // Only the T0 charge/wait pair is skipped. The plastic head being put away',
'    // is STILL dropped to standby: M104 does not block, and leaving the head that',
'    // just printed plastic at working temperature through the fibre window is the',
'    // ooze this whole sequence exists to stop.',
'    CHECK(s.find("M104 S150 T1 ; standby") != std::string::npos);',
'    CHECK(s.find("M104 S270 T0") == std::string::npos);',
'    // And the activated head gets NO standby target here either. This is the one',
'    // place the objective clause yields: with no M109 to bring the head back,',
'    // parking it would strand the composite head cold, which is worse than the',
'    // vendor and worse than not emitting the line at all.',
'    CHECK(s.find("M104 S180 T0") == std::string::npos);'],'first');
fs.writeFileSync(P,s,'latin1');console.log('OK test');
