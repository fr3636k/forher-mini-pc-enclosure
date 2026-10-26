import fs from 'node:fs';import {pathToFileURL,fileURLToPath} from 'node:url';
const p=fileURLToPath(new URL('../',import.meta.url)).replaceAll('\\','/'),url=pathToFileURL(p+'dist/vendor/three.module.js').href;
const THREE=await import(url),data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const equipmentURL=data(fs.readFileSync(p+'dist/equipment-view.js','utf8').replace("from 'three'",`from '${url}'`));
const roundedURL=data(fs.readFileSync(p+'dist/vendor/RoundedBoxGeometry.js','utf8').replace(/from\s+(['"])three\1/g,`from '${url}'`));
const cartURL=data(fs.readFileSync(p+'dist/cart-view.js','utf8').replace("from 'three'",`from '${url}'`).replace("from './vendor/RoundedBoxGeometry.js'",`from '${roundedURL}'`).replace("from './equipment-view.js'",`from '${equipmentURL}'`));
// Headless geometry construction; raster labels remain browser-only in this export.
globalThis.document={createElement:()=>({width:1024,height:1024,getContext:()=>new Proxy({},{get:()=>()=>{}})})};
const source=fs.readFileSync(p+'dist/model.js','utf8').replace('from "three"',`from '${url}'`).replace('from "./vendor/RoundedBoxGeometry.js"',`from '${roundedURL}'`).replace('from "./equipment-view.js"',`from '${equipmentURL}'`).replace('from "./cart-view.js"',`from '${cartURL}'`);
const {buildProducts}=await import(data(source)),product=buildProducts();
const {buildUltrasoundCart}=await import(cartURL);
product.layout(false);product.setExplode(0);product.setDoor(0);product.main.updateMatrixWorld(true);
const back=product.boards.E.children.find(o=>o.name.startsWith('E rear open'));
const front=product.front.children.find(o=>o.name.startsWith('F fixed front'));
function rayHits(mesh,point,direction){return new THREE.Raycaster(new THREE.Vector3(...point),new THREE.Vector3(...direction)).intersectObject(mesh,false).length>0;}
if(rayHits(back,[45,85,-130],[0,0,1])||!rayHits(back,[0,85,-130],[0,0,1])||!rayHits(back,[45,25,-130],[0,0,1]))throw Error('U notch topology incorrect');
if(rayHits(front,[18,42,130],[0,0,-1])||!rayHits(front,[-20,42,130],[0,0,-1]))throw Error('Front access hole incorrect');
const fixed=product.front.matrixWorld.clone();let minLidY=Infinity;
for(let d=0;d<=95;d+=5){product.setDoor(d);product.main.updateMatrixWorld(true);const lidMesh=product.lid.children[0],b=new THREE.Box3().setFromObject(lidMesh);minLidY=Math.min(minLidY,b.min.y);if(d>0&&b.max.x>110.001)throw Error('Lid enters hook side');if(!product.front.matrixWorld.equals(fixed))throw Error('Front panel moves with lid');}
if(minLidY<90.99)throw Error('Lid enters case walls');
product.setDoor(95);product.main.updateMatrixWorld(true);const opened=new THREE.Box3().setFromObject(product.lid.children[0]);if(opened.max.y<300||opened.max.x> -100)throw Error('Lid does not swing left');
product.setExplode(1);if(product.front.position.z!==160||product.lid.position.y!==130)throw Error('Explosion transforms');product.setExplode(0);product.setDoor(0);
// The original short block must now miss the shell; the forward-end pads must touch it.
const cart=buildUltrasoundCart();cart.updateMatrixWorld(true);
const shell=cart.children.find(o=>o.name==='Rounded lower machine body');
product.layout(true);product.main.updateMatrixWorld(true);
const shellBox=new THREE.Box3().setFromObject(shell),caseFront=-260+110;
if(shellBox.min.z<=caseFront)throw Error('Shell falsely extends under hanging box');
const oldTouch=new THREE.Raycaster(new THREE.Vector3(-330,675,-180),new THREE.Vector3(1,0,0));
if(oldTouch.intersectObject(shell,false).length)throw Error('Old short spacer still appears to touch body');
let padCorners=0;let pads=0;product.boards.I.traverse(o=>{if(!o.isMesh)return;const b=new THREE.Box3().setFromObject(o),c=b.getCenter(new THREE.Vector3());
 const hit=new THREE.Raycaster(new THREE.Vector3(b.min.x-1,c.y,c.z),new THREE.Vector3(1,0,0)).intersectObject(shell,false)[0];
 if(!hit||Math.abs(hit.point.x-b.max.x)>.05||b.min.z<shellBox.min.z+12)throw Error('Forward pad misses flat shell');
 for(const y of [b.min.y+.1,b.max.y-.1])for(const z of [b.min.z+.1,b.max.z-.1]){const corner=new THREE.Raycaster(new THREE.Vector3(b.min.x-1,y,z),new THREE.Vector3(1,0,0)).intersectObject(shell,false)[0];if(!corner||Math.abs(corner.point.x-b.max.x)>.05)throw Error('Pad corner is unsupported');padCorners++;}pads++;});
if(pads!==2)throw Error('Need two forward pads');
const arm=product.boards.H.children.find(o=>o.name.startsWith('Forward support arm'));const armBox=new THREE.Box3().setFromObject(arm);
if(Math.abs(armBox.max.z-caseFront-100)>.01)throw Error('Forward overhang incorrect');
const armSize=armBox.getSize(new THREE.Vector3());if(Math.abs(armSize.z-150)>.01||Math.abs(armSize.x-10)>.01||Math.abs(armSize.y-30)>.01)throw Error('Support exceeds 150 x 10 x 30');
if(Math.abs(caseFront-armBox.min.z-50)>.01)throw Error('Fixed overlap incorrect');
const packing=new THREE.Box3().setFromObject(product.endPackingBlock),packingSize=packing.getSize(new THREE.Vector3());if(Math.abs(packingSize.x-20)>.01||Math.abs(packingSize.z-42)>.01||Math.abs(packing.min.x-armBox.max.x)>.01)throw Error('End block does not join thin arm');
product.boards.I.traverse(o=>{if(o.isMesh){const b=new THREE.Box3().setFromObject(o);if(Math.abs(b.min.x-packing.max.x)>.01||b.min.z<packing.min.z-.01||b.max.z>packing.max.z+.01)throw Error('Pad not backed by end block');}});
console.log(JSON.stringify({oldSpacerNowInVoid:true,newPadsTouchFlatShell:true,padCount:pads,padCornersChecked:padCorners,forwardOverhangMm:100}));

const {buildExternalIO}=await import(equipmentURL),io=buildExternalIO();let crossings=0;
io.root.traverse(o=>{if(!o.isMesh||!o.geometry.parameters.path||!(/DC -|HDMI -|Reader USB/.test(o.name)))return;
 const curve=o.geometry.parameters.path,r=o.geometry.parameters.radius;
 for(const plane of [-370,-361]){let prev=curve.getPoint(0);for(let i=1;i<=4000;i++){
  const now=curve.getPoint(i/4000);if((prev.z<plane&&now.z>=plane)||(prev.z>=plane&&now.z<plane)){
   const t=(plane-prev.z)/(now.z-prev.z),x=prev.x+(now.x-prev.x)*t,y=prev.y+(now.y-prev.y)*t;
   if(x>=-534&&x<=-332&&y>=659&&y<=741){if(Math.hypot(x+388,y-700)+r>22.5)throw Error('Cable clips rear opening: '+o.name);crossings++;}
  }prev=now;
 }}});
if(crossings!==6)throw Error('Expected six cable crossings');
console.log(JSON.stringify({threeRoutesClearRearOpening:true,rearPanelCrossings:crossings}));
const old=fs.readFileSync(p+'dist/models/forher-recorder-v9-photo-cart.glb'),jl=old.readUInt32LE(12),g=JSON.parse(old.subarray(20,20+jl));let bin=Buffer.from(old.subarray(28+jl,28+jl+old.readUInt32LE(20+jl)));
function accessor(a,size,type,target){bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);const bytes=Buffer.from(a.buffer,a.byteOffset,a.byteLength),offset=bin.length;bin=Buffer.concat([bin,bytes]);const view=g.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length,target})-1,x={bufferView:view,componentType:a instanceof Float32Array?5126:a instanceof Uint32Array?5125:5123,count:a.length/size,type};if(type==='VEC3'){x.min=Array(size).fill(Infinity);x.max=Array(size).fill(-Infinity);for(let i=0;i<a.length;i++){const k=i%size;x.min[k]=Math.min(x.min[k],a[i]);x.max[k]=Math.max(x.max[k],a[i]);}}return g.accessors.push(x)-1;}
const mats=new Map();function material(m){if(mats.has(m.uuid))return mats.get(m.uuid);const color=m.map?new THREE.Color('#caa375'):m.color;const x={name:m.map?'Natural plywood (solid export)':m.name||'V13 material',pbrMetallicRoughness:{baseColorFactor:[...color.toArray(),m.opacity??1],metallicFactor:m.metalness??0,roughnessFactor:m.roughness??.8}};if(m.transparent)x.alphaMode='BLEND';if(m.side===2)x.doubleSided=true;const id=g.materials.push(x)-1;mats.set(m.uuid,id);return id;}
function node(o){o.updateMatrix();const n={name:o.name,matrix:o.matrix.toArray()},id=g.nodes.push(n)-1;if(o.isMesh&&!(o.material.isMeshBasicMaterial&&o.material.map)){const geo=o.geometry,attrs={};for(const [key,size,type,gl] of [['position',3,'VEC3','POSITION'],['normal',3,'VEC3','NORMAL'],['uv',2,'VEC2','TEXCOORD_0']])if(geo.attributes[key])attrs[gl]=accessor(geo.attributes[key].array,size,type,34962);const prim={attributes:attrs,material:material(o.material),mode:4};if(geo.index)prim.indices=accessor(geo.index.array,1,'SCALAR',34963);n.mesh=g.meshes.push({name:o.name,primitives:[prim]})-1;}if(o.children.length)n.children=o.children.map(node);return id;}
const box=g.nodes.find(n=>n.name?.startsWith('Compact enclosure 220W'));if(!box)throw Error('Missing box root');box.matrix=product.main.matrix.toArray();box.children=product.main.children.map(node);const oldCart=g.nodes.find(n=>n.name?.startsWith('Ultrasound cart - photo-informed'));if(!oldCart)throw Error('Missing cart root');oldCart.children=cart.children.map(node);
const oldIO=g.nodes.find(n=>n.name==='External power adapter and three separate signal routes');if(!oldIO)throw Error('Missing I/O root');oldIO.children=io.root.children.map(node);
g.asset.generator='ForHer V13 source geometry - forward support across empty rear handle gap';g.buffers[0].byteLength=bin.length;
let jb=Buffer.from(JSON.stringify(g));jb=Buffer.concat([jb,Buffer.alloc((4-jb.length%4)%4,32)]);bin=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);const head=Buffer.alloc(20);head.writeUInt32LE(0x46546c67,0);head.writeUInt32LE(2,4);head.writeUInt32LE(28+jb.length+bin.length,8);head.writeUInt32LE(jb.length,12);head.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(p+'dist/models/forher-recorder-v13-1cm-support.glb',Buffer.concat([head,jb,bh,bin]));
console.log(JSON.stringify({rearUOpenToTop:true,frontPowerHoleClear:true,frontStaysFixed:true,lidOpensLeft95:true,lidBottomMinimumMm:minLidY,explosionCorrect:true,GLB:'V13 generated from current model source'}));
