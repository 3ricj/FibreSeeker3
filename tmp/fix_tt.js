const fs=require('fs');
const P='/mnt/c/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/src/libslic3r/Fiber/FiberStrandPlanner.cpp';
let s=fs.readFileSync(P,'latin1');
function rep(old,nw,label){
  if(!old.includes('\r\n')) old=old.replace(/\n/g,'\r\n');
  if(!nw.includes('\r\n')) nw=nw.replace(/\n/g,'\r\n');
  const n=s.split(old).length-1;
  if(n!==1){console.log('HIT '+n+' '+label);process.exit(1);}
  s=s.split(old).join(nw); console.log('OK '+label);
}

// --- fill path site -------------------------------------------------------
rep(
`                    const std::vector<size_t> tight0 =
                        tight_turn_joints(pts, false, params.min_turn_radius_mm);
                    if (!tight0.empty() && params.tight_turn_policy == FiberTightTurnPolicy::fttKeep)
                        fillet_path_turns(pts, false, params.min_turn_radius_mm);
                    const std::vector<size_t> tight =
                        tight_turn_joints(pts, false, params.min_turn_radius_mm);
                    res.tight_turns += tight.size();`,
`                    const std::vector<size_t> tight0 =
                        tight_turn_joints(pts, false, params.min_turn_radius_mm);
                    if (!tight0.empty() && params.tight_turn_policy == FiberTightTurnPolicy::fttKeep)
                        fillet_path_turns(pts, false, params.min_turn_radius_mm);
                    // Count the joints the policy had to deal with, measured BEFORE the
                    // fillet. A fillet replaces one corner with an arc, and the arc's own
                    // vertices are not turns: re-measuring the filleted path reports the
                    // tessellation of the fillet rather than the joint that prompted it,
                    // inflating the diagnostic by the arc's segment count (measured on the
                    // 60 x 40 rect at fs_fiber_min_radius 25: four trace corners reported
                    // as 54 joints, so 90 where the joints actually number 40). Under the
                    // split policy no fillet is applied, so this is the same set the split
                    // decision below uses.
                    const std::vector<size_t>& tight = tight0;
                    res.tight_turns += tight.size();`,
'fill site');

// --- closed loop site -----------------------------------------------------
rep(
`                if (params.min_turn_radius_mm > 0.0 &&
                    params.tight_turn_policy == FiberTightTurnPolicy::fttKeep) {
                    fillet_path_turns(closed, true, params.min_turn_radius_mm);
                    rotate_tail_off_tight(closed, params.tail_length_mm, params.min_turn_radius_mm);
                }
                const std::vector<size_t> tight =
                    tight_turn_joints(closed, true, params.min_turn_radius_mm);
                res.tight_turns += tight.size();`,
`                const std::vector<size_t> tight0 =
                    tight_turn_joints(closed, true, params.min_turn_radius_mm);
                if (params.min_turn_radius_mm > 0.0 &&
                    params.tight_turn_policy == FiberTightTurnPolicy::fttKeep) {
                    fillet_path_turns(closed, true, params.min_turn_radius_mm);
                    rotate_tail_off_tight(closed, params.tail_length_mm, params.min_turn_radius_mm);
                }
                // Pre-fillet count; see the fill-path site above for why.
                const std::vector<size_t>& tight = tight0;
                res.tight_turns += tight.size();`,
'loop site');

fs.writeFileSync(P,s,'latin1');
const t=fs.readFileSync(P,'latin1');
console.log('CRLF='+((t.match(/\r\n/g)||[]).length)+' LFonly='+((t.match(/(?<!\r)\n/g)||[]).length));
