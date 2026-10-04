const fs=require('fs');
const R='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/';
const files=[
 'src/libslic3r/PrintConfig.cpp','src/libslic3r/PrintConfig.hpp','src/libslic3r/Preset.cpp',
 'src/slic3r/GUI/Tab.cpp','src/libslic3r/GCode/CoolingBuffer.hpp',
 'src/libslic3r/Fiber/FiberStrandPlanner.cpp','src/libslic3r/Fiber/FiberToolChange.cpp',
 'src/libslic3r/Fiber/FiberToolChange.hpp','src/libslic3r/Fiber/FiberEmitter.cpp',
 'src/libslic3r/Fiber/FiberEmitter.hpp','src/libslic3r/Fiber/FiberModePlan.cpp',
 'src/libslic3r/Fiber/FiberModePlan.hpp','src/libslic3r/CMakeLists.txt',
 'tests/libslic3r/test_fiber_toolchange.cpp','tests/libslic3r/test_fiber_export_identity.cpp',
 'tests/libslic3r/test_fiber_3mf_roundtrip.cpp','tests/libslic3r/test_fiber_mode_plan.cpp',
 'tests/libslic3r/test_fiber_strand.cpp','tests/libslic3r/CMakeLists.txt',
 'tests/fibreseeker/fixtures/good_toolchange_pair.gcode','tests/fibreseeker/data/command_allowlist.json',
 'resources/profiles/FibreSeeker3.json',
 'resources/profiles/FibreSeeker3/machine/FibreSeeker3 SK3 CF nozzle.json',
 'resources/profiles/FibreSeeker3/machine/FibreSeeker3 SK3 FFF nozzle.json',
 'resources/profiles/FibreSeeker3/process/0.12mm Fortified @FibreSeeker3 SK3.json',
 'resources/profiles/FibreSeeker3/process/0.12mm Reinforced L1 @FibreSeeker3 SK3.json',
 'resources/profiles/FibreSeeker3/process/0.12mm Reinforced L2 @FibreSeeker3 SK3.json',
 'resources/profiles/FibreSeeker3/process/0.12mm Reinforced L3 @FibreSeeker3 SK3.json',
 'resources/profiles/FibreSeeker3/process/0.12mm Reinforced L4 @FibreSeeker3 SK3.json',
 'resources/profiles/FibreSeeker3/process/0.12mm Reinforced L5 @FibreSeeker3 SK3.json',
 'docs/HLSD/continuous_fiber.md','docs/HLSD/continuous_fiber_gcode.md',
 'localization/i18n/OrcaSlicer.pot'
];
let fixed=0, ok=0;
for(const f of files){
  const p=R+f;
  if(!fs.existsSync(p)){console.log('MISSING '+f);continue;}
  let t=fs.readFileSync(p,'latin1');
  const lf=(t.match(/(?<!\r)\n/g)||[]).length;
  if(lf>0){ t=t.replace(/\r\n/g,'\n').replace(/\n/g,'\r\n'); fs.writeFileSync(p,t,'latin1');
    console.log('NORMALISED '+f+'  (was '+lf+' LF-only)'); fixed++; }
  else ok++;
}
console.log('');
console.log('already CRLF-clean: '+ok+'   normalised now: '+fixed);
