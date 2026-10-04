const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/fibreseeker/fixtures/good_toolchange_pair.gcode';
let s=fs.readFileSync(P,'latin1');
const EOL='\r\n';
function rep(old,nw,label){const o=old.join(EOL),n=nw.join(EOL);const c=s.split(o).length-1;if(c!==1){console.log('HIT '+label+' = '+c);process.exit(1);}s=s.split(o).join(n);}
rep([
'; Temperature handling: BOTH heads get a standby target at every switch, which',
'; is what the owner objective asks for, and the head being ACTIVATED then also',
'; gets a WORKING-temperature pre-charge immediately before its blocking M109,'],
[
'; Temperature handling: at the plastic->fibre switch BOTH heads get a standby',
'; target, which is the clause the owner objective states literally, and the head',
'; being ACTIVATED then also gets a WORKING-temperature pre-charge immediately',
'; before its blocking M109,'],'prose');
fs.writeFileSync(P,s,'latin1');console.log('OK');
