const fs=require('fs');
const PC='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/PrintConfig.cpp';
let p=fs.readFileSync(PC,'latin1');

// Replace within the [marker, next "def = this->add(" ) range only, so the
// degree-sign bytes (C2 B0 read as latin1) never have to be reproduced.
function patch_block(marker, newTooltip, newDefault, label){
  const i0=p.indexOf(marker);
  if(i0<0){console.log('MISS '+label);process.exit(1);}
  const i1=p.indexOf('def = this->add(', i0+marker.length);
  if(i1<0){console.log('NOEND '+label);process.exit(1);}
  let blk=p.slice(i0,i1);

  // tooltip: replace the text between the first L(" and its closing ");
  const tstart=blk.indexOf('def->tooltip = L("');
  if(tstart<0){console.log('NOTOOLT '+label);process.exit(1);}
  const q0=tstart+'def->tooltip = L("'.length;
  const q1=blk.indexOf('");',q0);
  if(q1<0){console.log('NOENDQ '+label);process.exit(1);}
  blk=blk.slice(0,q0)+newTooltip+blk.slice(q1);

  // default value
  const dstr='def->set_default_value(new ConfigOptionInt(';
  const d0=blk.indexOf(dstr);
  if(d0<0){console.log('NODEF '+label);process.exit(1);}
  const d1=blk.indexOf('));',d0);
  blk=blk.slice(0,d0)+dstr+newDefault+blk.slice(d1);

  p=p.slice(0,i0)+blk+p.slice(i1);
  console.log('OK '+label+' -> default '+newDefault);
}

patch_block('def = this->add("fs_t0_standby_temp", coInt);',
  'Nozzle temperature (degrees) the composite (T0) extruder is dropped to when a fiber window closes. Keeps the hotend ready without cooking matrix in the nozzle during the plastic pass. The vendor reference exports park at 180 degrees for a 270 degree working temperature and at 100 degrees for a 230 degree one, so this is a per-material number rather than a fixed offset. Emitted only when Composite nozzle temperature is set.',
  '180','t0_standby');

patch_block('def = this->add("fs_t1_standby_temp", coInt);',
  'Nozzle temperature (degrees) the plastic (T1) extruder is dropped to while a fiber window runs, and restored from when the window closes. The vendor reference exports park the plastic head at 150 degrees for every material sampled, so the default is a constant rather than a fraction of the working temperature. 0 leaves the plastic head on its working temperature through the fiber pass. Emitted only when Composite nozzle temperature is set.',
  '150','t1_standby');

fs.writeFileSync(PC,p,'latin1');
const t=fs.readFileSync(PC,'latin1');
console.log('CRLF='+((t.match(/\r\n/g)||[]).length)+' LFonly='+((t.match(/(?<!\r)\n/g)||[]).length));
const a=t.indexOf('fs_t0_standby_temp'), b=t.indexOf('fs_t1_standby_temp');
console.log('--- verify t0 block ---'); console.log(t.slice(a,a+700).replace(/\r/g,'').split('\n').slice(0,9).join('\n'));
console.log('--- verify t1 block ---'); console.log(t.slice(b,b+700).replace(/\r/g,'').split('\n').slice(0,9).join('\n'));
