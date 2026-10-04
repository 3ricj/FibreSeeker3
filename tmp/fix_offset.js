const fs=require('fs');
const OLD='    ModelObject* obj = model.add_object("cube", "", make_cube(20., 20., 20.));\r\n    obj->add_instance();\r\n    obj->set_offset(Vec3d(150., 150., 0.));\r\n';
const NEW='    ModelObject* obj = model.add_object("cube", "", make_cube(20., 20., 20.));\r\n    ModelInstance* inst = obj->add_instance();\r\n    inst->set_offset(Vec3d(150., 150., 0.));\r\n';
for(const f of ['C:/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/tests/libslic3r/test_fiber_export_identity.cpp','C:/Users/3ricj/.openvibely/repos/288e09695603e28b9fc187875ade9fdf/ctrl1220/tests/libslic3r/test_fiber_export_identity.cpp']){
  const p=f;
  let s=fs.readFileSync(p,'latin1');
  const n=s.split(OLD).length-1;
  if(n!==1){console.log('HIT '+n+' '+p);continue;}
  fs.writeFileSync(p,s.split(OLD).join(NEW),'latin1');
  console.log('OK '+p);
}
