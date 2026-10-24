import * as THREE from 'three';

export const installation={box:[-455,650,-170],reader:[-271.25,883.5,147.25],handleDiameterMm:24,adapterEnvelopeMm:[90,35,45]};
const materials={metal:new THREE.MeshStandardMaterial({color:'#a2aaa5',metalness:.65,roughness:.35}),strap:new THREE.MeshStandardMaterial({color:'#5d5870',roughness:.9}),rubber:new THREE.MeshStandardMaterial({color:'#252933',roughness:.9}),adapter:new THREE.MeshStandardMaterial({color:'#30343c',roughness:.65})};
const group=name=>{const g=new THREE.Group();g.name=name;return g;};
function box(parent,name,size,position,material=materials.metal){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material);m.name=name;m.position.set(...position);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function tube(parent,name,points,radius,color){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.Mesh(new THREE.TubeGeometry(curve,36,radius,8,false),new THREE.MeshStandardMaterial({color,roughness:.7}));m.name=name;m.castShadow=true;parent.add(m);return m;}
function screw(parent,x,y,z){const s=new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,1.5,16),materials.metal);s.name='Through bolt and washer - size provisional';s.rotation.z=Math.PI/2;s.position.set(x,y,z);parent.add(s);}

export function buildFixings(){
 const mounting=group('Right-side twin J hooks - provisional rear-handle mounting');
 for(const z of [-20,70]){
  box(mounting,'External load-spreading hook plate',[4,130,28],[114,115,z]);
  box(mounting,'J-hook top bridge',[49,5,28],[138.5,183,z]);
  box(mounting,'J-hook retaining lip',[4,32,28],[161,169,z]);
  box(mounting,'Hook rubber liner',[33,3,24],[140,179,z],materials.rubber);
  box(mounting,'Internal backing washer plate',[2,44,32],[100,67,z]);
  for(const y of [52,82])screw(mounting,118,y,z);
  box(mounting,'Anti-sway rubber pad',[8,24,32],[120,25,z],materials.rubber);
  tube(mounting,'Anti-lift retention strap',[[113,139,z],[124,151,z],[142,144,z],[164,151,z],[166,182,z],[140,190,z],[115,184,z]],2.3,'#5d5870');
 }
 const restraints=group('Equipment adjustable stops and reusable retention straps');
 // Straps sit near the front edge, away from the illustrative top vent grille.
 for(const [x,w,y,z] of [[-29,132,72,65],[67,51,37,35]]){
  box(restraints,'Reusable hook-and-loop strap across device',[w,1.5,10],[x,y,z],materials.strap);
  for(const side of [-1,1]){const sx=x+side*w/2;box(restraints,'Vertical strap leg',[1.5,y-14,10],[sx,(y+14)/2,z],materials.strap);box(restraints,'Screw-fixed strap anchor',[10,2,16],[sx,13,z],materials.rubber);}
 }
 box(restraints,'Capture device cradle base',[53,3,96],[67,13.5,15]);
 for(const x of [41,93])box(restraints,'Capture cradle locating edge',[2,8,96],[x,18,15]);
 return {mounting,restraints};
}

export function buildRearHandle(){
 const g=group('Rear push handle - generic dimensions, verify on actual machine');
 tube(g,'Left side section of rear push handle',[[-312,813,-280],[-312,813,-60]],12,'#75817c');
 tube(g,'Rear grip kept free for pushing',[[-312,813,-280],[160,813,-280]],12,'#75817c');
 tube(g,'Right side section of rear push handle',[[160,813,-280],[160,813,-60]],12,'#75817c');
 for(const x of [-312,160])tube(g,'Existing handle support illustrative',[[x,813,-60],[x,780,-65],[x*.82,760,-90]],8,'#75817c');
 return g;
}

export function buildExternalIO(){
 const root=group('External power adapter and HDMI USB routing');
 const power=group('Power route - AC to original external adapter to DC input');root.add(power);
 box(power,'Clinic-approved outlet placeholder',[65,100,16],[-760,600,-370],new THREE.MeshStandardMaterial({color:'#f8f6fa',roughness:.8}));
 for(const x of [-770,-750])box(power,'Outlet pin opening',[4,12,2],[x,620,-379],materials.rubber);
 box(power,'Plug body',[28,25,20],[-760,600,-391],materials.adapter);
 box(power,'Original external AC DC adapter - 90 x 35 x 45 mm assumed',[90,35,45],[-185,430,-245],materials.adapter);
 box(power,'Adapter cradle chassis fixing plate - position provisional',[105,48,4],[-185,430,-213]);
 box(power,'External adapter cradle',[105,4,55],[-185,410,-245]);
 for(const x of [-212,-158])box(power,'External adapter retention strap',[10,38,48],[x,430,-245],new THREE.MeshStandardMaterial({color:'#655178',wireframe:true}));
 tube(power,'AC power - outlet to original adapter',[[-760,590,-401],[-680,480,-400],[-410,400,-370],[-230,430,-245]],3.1,'#cc8b32');
 tube(power,'DC power - adapter to rear cable opening and PC',[[-140,430,-245],[-140,560,-315],[-340,650,-340],[-410,700,-280],[-470,693,-210]],2.4,'#cc8b32');
 const video=group('Video route - ultrasound HDMI to existing capture to USB PC');root.add(video);
 tube(video,'HDMI signal - ultrasound output to existing capture input',[[-306.9,759.5,-186],[-350,755,-330],[-450,735,-340],[-420,700,-280],[-388,675,-206]],3,'#3e7ed4');
 tube(video,'USB video - existing capture to PC',[[-388,675,-108],[-365,674,-90],[-365,674,-245],[-520,680,-245],[-519,693,-83]],2,'#22988b');
 const reader=group('Card reader USB route');root.add(reader);
 tube(reader,'USB - external card reader to PC',[[-231.25,896.5,99.25],[-300,890,-140],[-425,850,-300],[-435,740,-315],[-425,700,-280],[-498,693,-83]],2.2,'#22988b');
 root.userData={units:'mm',adapterDimensionsAssumed:true,outletPositionAssumed:true,sharedMedicalPowerNotValidated:true};
 return {root,power,video,reader};
}

function fadeCase(main){for(const prefix of ['A Top','C Left','D Right','E Rear']){const g=main.children.find(n=>n.name.startsWith(prefix));g?.traverse(o=>{if(o.isMesh&&o.material?.isMeshStandardMaterial){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=prefix==='A Top'?.08:.22;o.material.depthWrite=false;}});}}
export function buildPlanningView(product,cart){
 const root=group('Meeting equipment planning views');
 const internal=group('Interior layout with restraints');root.add(internal);
 const cutaway=product.main.clone(true);cutaway.position.set(0,0,0);fadeCase(cutaway);cutaway.children.find(n=>n.name.startsWith('A Top')).visible=false;cutaway.children.find(n=>n.name.startsWith('Front door hinge')).visible=false;cutaway.children.find(n=>n.name.startsWith('Right-side twin J')).visible=false;internal.add(cutaway);
 const hook=group('Right-side hooks shown on rear handle side segment');root.add(hook);
 const hookedCase=product.main.clone(true);hookedCase.position.set(0,0,0);hook.add(hookedCase);
 tube(hook,'Rear push handle side section - diameter 24 mm assumed',[[143,163,-130],[143,163,130]],12,'#75817c');
 tube(hook,'Handle attachment context',[[143,163,-130],[210,163,-130],[240,120,-130]],8,'#75817c');
 const io=group('Full power and video connection context');root.add(io);
 const context=cart.clone(true);context.visible=true;io.add(context);
 const wiredCase=product.main.clone(true);wiredCase.position.set(...installation.box);fadeCase(wiredCase);io.add(wiredCase);
 const readerClone=product.reader.clone(true);readerClone.position.set(...installation.reader);io.add(readerClone);
 const external=buildExternalIO();io.add(external.root);
 function setMode(mode){internal.visible=mode==='internal';hook.visible=mode==='mount';io.visible=mode==='io';}
 function setRoute(route){external.power.visible=route!=='video';external.video.visible=route!=='power';external.reader.visible=route==='all';}
 setMode('internal');root.visible=false;
 return {root,internal,hook,io,setMode,setRoute};
}
