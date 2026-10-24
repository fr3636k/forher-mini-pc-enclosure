import * as THREE from 'three';

// All dimensions are illustrative millimetres until the actual handle and shell are measured.
export const installation = {
  box: [-455, 650, -170], reader: [-271.25, 883.5, 147.25],
  handleDiameterMm: 24, adapterEnvelopeMm: [90, 35, 45], spacerDepthMm: 54,
};
const materials = {
  metal: new THREE.MeshStandardMaterial({color:'#a2aaa5',metalness:.65,roughness:.35}),
  rubber: new THREE.MeshStandardMaterial({color:'#252933',roughness:.9}),
  adapter: new THREE.MeshStandardMaterial({color:'#30343c',roughness:.65}),
  wood: new THREE.MeshStandardMaterial({color:'#d1ae78',roughness:.85}),
};
const group = name => { const g = new THREE.Group(); g.name = name; return g; };
function box(parent,name,size,position,material=materials.metal) {
  const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);
  m.name=name; m.position.set(...position); m.castShadow=m.receiveShadow=true; parent.add(m); return m;
}
function tube(parent,name,points,radius,color) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,8,false),new THREE.MeshStandardMaterial({color,roughness:.7}));
  m.name=name; m.castShadow=true; parent.add(m); return m;
}
function screw(parent,x,y,z) {
  const s=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,1.5,16),materials.metal);
  s.name='Through bolt and washer - size provisional'; s.rotation.z=Math.PI/2; s.position.set(x,y,z); parent.add(s);
}

export function buildFixings() {
  const mounting=group('Right-side twin J hooks - provisional rear-handle mounting');
  for(const z of [-20,70]) {
    box(mounting,'External load-spreading hook plate',[4,130,28],[114,115,z]);
    box(mounting,'J-hook top bridge',[49,5,28],[138.5,183,z]);
    box(mounting,'J-hook retaining lip',[4,32,28],[161,169,z]);
    box(mounting,'Hook rubber liner',[33,3,24],[140,179,z],materials.rubber);
    box(mounting,'Internal backing washer plate',[2,44,32],[100,67,z]);
    for(const y of [52,82]) screw(mounting,118,y,z);
    box(mounting,'Removable anti-lift screw stop - provisional',[43,4,5],[138.5,147,z]);
  }
  const spacer=group('Lower wooden standoff with two rubber contact pads');
  mounting.add(spacer);
  box(spacer,'Wood spacer - depth cut to measured gap',[54,24,120],[137,23,25],materials.wood);
  for(const z of [-20,70]) {
    box(spacer,'Rubber contact pad - verified shell contact only',[4,24,24],[166,23,z],materials.rubber);
    screw(spacer,109,23,z);
  }
  const restraints=group('Loose equipment on non-slip base pads');
  box(restraints,'PC non-slip base pad',[132,7,132],[-29,12.5,24],materials.rubber);
  box(restraints,'Capture non-slip base pad',[49,6,94],[67,12,15],materials.rubber);
  return {mounting,restraints};
}

export function buildRearHandle() {
  const g=group('Protruding rear push handle - geometry to verify on actual machine');
  tube(g,'Left protruding handle section',[[-312,813,-280],[-312,813,-60]],12,'#75817c');
  tube(g,'Rear grip kept free for pushing',[[-312,813,-280],[160,813,-280]],12,'#75817c');
  tube(g,'Right handle section',[[160,813,-280],[160,813,-60]],12,'#75817c');
  for(const x of [-312,160]) tube(g,'Handle support indicative',[[x,813,-60],[x,780,-65],[x*.82,760,-90]],8,'#75817c');
  return g;
}

export function buildExternalIO() {
  const root=group('External power adapter and three separate signal routes');
  const power=group('Power route - AC to external adapter to PC DC input'); root.add(power);
  box(power,'Clinic-approved outlet placeholder',[65,100,16],[-760,600,-370],new THREE.MeshStandardMaterial({color:'#f8f6fa',roughness:.8}));
  for(const x of [-770,-750]) box(power,'Outlet pin opening',[4,12,2],[x,620,-379],materials.rubber);
  box(power,'Plug body',[28,25,20],[-760,600,-391],materials.adapter);
  box(power,'Original external adapter - envelope assumed',[90,35,45],[-185,430,-245],materials.adapter);
  box(power,'Adapter cradle chassis fixing plate - provisional',[105,48,4],[-185,430,-213]);
  box(power,'External adapter cradle',[105,4,55],[-185,410,-245]);
  for(const x of [-235,-135]) box(power,'Adapter cradle side lip',[4,16,55],[x,420,-245]);
  tube(power,'AC - outlet to original adapter',[[-760,590,-401],[-680,480,-400],[-410,400,-370],[-230,430,-245]],3.1,'#cc8b32');
  // All three pass through the rear hole centre (-410,700,-280), with small separation.
  tube(power,'DC - adapter through rear hole to PC DC input',[[-140,430,-245],[-140,560,-315],[-340,650,-340],[-405,700,-280],[-470,693,-210]],2.4,'#cc8b32');
  box(power,'PC DC socket indicative',[9,8,4],[-470,693,-210],materials.rubber);
  const video=group('Video route - HDMI capture and its USB output'); root.add(video);
  tube(video,'HDMI - ultrasound to existing capture input',[[-306.9,759.5,-186],[-350,755,-330],[-450,735,-340],[-420,700,-280],[-388,675,-206]],3,'#3e7ed4');
  tube(video,'Video USB - capture to PC',[[-388,675,-108],[-365,674,-90],[-365,674,-245],[-520,680,-245],[-519,693,-83]],2,'#3e7ed4');
  const reader=group('Card reader USB route'); root.add(reader);
  tube(reader,'Reader USB - through rear hole to PC',[[-231.25,896.5,99.25],[-300,890,-140],[-425,850,-300],[-435,740,-315],[-410,700,-280],[-498,693,-83]],2.2,'#22988b');
  root.userData={units:'mm',adapterDimensionsAssumed:true,outletPositionAssumed:true,sharedMedicalPowerNotValidated:true};
  function setRoute(route) {
    power.visible=route==='all'||route==='power';
    video.visible=route==='all'||route==='video';
    reader.visible=route==='all'||route==='reader';
  }
  return {root,power,video,reader,setRoute};
}

function fadeCase(main) {
  for(const prefix of ['A Top','B Bottom','C Left','D Right','E Rear','Front door hinge']) {
    main.children.find(n=>n.name.startsWith(prefix))?.traverse(o=>{
      if(o.isMesh&&o.material?.isMeshStandardMaterial) {
        o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=.12;
        o.material.depthWrite=false; o.castShadow=false;
      }
    });
  }
}
export function buildPlanningView(product,cart) {
  const root=group('Equipment and size planning views');
  const internal=group('Interior equipment placed on base pads'); root.add(internal);
  const cutaway=product.main.clone(true); cutaway.position.set(0,0,0); fadeCase(cutaway);
  for(const prefix of ['A Top','Front door hinge','Right-side twin J']) cutaway.children.find(n=>n.name.startsWith(prefix)).visible=false;
  internal.add(cutaway);
  const hook=group('Upper hooks and lower anti-tilt wooden standoff'); root.add(hook);
  const hookedCase=product.main.clone(true); hookedCase.position.set(0,0,0); hook.add(hookedCase);
  tube(hook,'Protruding handle - diameter assumed',[[143,163,-130],[143,163,130]],12,'#75817c');
  tube(hook,'Handle attachment context',[[143,163,-130],[210,163,-130],[240,120,-130]],8,'#75817c');
  box(hook,'Machine shell contact plane - must verify load-bearing area',[24,142,200],[180,45,15],new THREE.MeshStandardMaterial({color:'#dce0d8',transparent:true,opacity:.32,depthWrite:false}));
  const io=group('Transparent enclosure with full route context'); root.add(io);
  const context=cart.clone(true); context.visible=true; context.traverse(o=>{if(o.name==='Probe cable')o.visible=false;}); io.add(context);
  const wiredCase=product.main.clone(true); wiredCase.position.set(...installation.box); fadeCase(wiredCase); io.add(wiredCase);
  const readerClone=product.reader.clone(true); readerClone.position.set(...installation.reader); io.add(readerClone);
  const external=buildExternalIO(); io.add(external.root);
  function setMode(mode) { internal.visible=mode==='internal'; hook.visible=mode==='mount'; io.visible=mode==='io'; }
  setMode('internal'); root.visible=false;
  return {root,internal,hook,io,setMode,setRoute:external.setRoute};
}
