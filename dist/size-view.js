import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

// Millimetres. This view validates the PC body only; it is not an equipment/cable clearance test.
export const sizeComparison={computer:[140,60,140],interior:[202,82,202]};
export function buildSizeView(){
 const root=new THREE.Group();root.name='PC body size comparison - not included in scene download';
 const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(...sizeComparison.interior)),new THREE.LineBasicMaterial({color:'#aa67d7',transparent:true,opacity:.7}));frame.position.y=41;root.add(frame);
 const floor=new THREE.Mesh(new THREE.BoxGeometry(202,2,202),new THREE.MeshStandardMaterial({color:'#e4d6ef',roughness:.85}));floor.position.y=-1;floor.receiveShadow=true;root.add(floor);
 const body=new THREE.Mesh(new RoundedBoxGeometry(...sizeComparison.computer,3,3),new THREE.MeshStandardMaterial({color:'#30343c',roughness:.48}));body.position.y=30;body.castShadow=body.receiveShadow=true;root.add(body);
 const top=new THREE.Mesh(new RoundedBoxGeometry(134,1,134,2,2),new THREE.MeshStandardMaterial({color:'#23242c',roughness:.6}));top.position.y=59;root.add(top);
 const ventMat=new THREE.MeshStandardMaterial({color:'#14151c',roughness:.8});
 for(let i=0;i<10;i++){const vent=new THREE.Mesh(new THREE.BoxGeometry(2,.6,85),ventMat);vent.position.set(-49+i*11,59.7,-5);root.add(vent);}
 const power=new THREE.Mesh(new THREE.CylinderGeometry(4,4,1,24),new THREE.MeshStandardMaterial({color:'#aa67d7',metalness:.2,roughness:.4}));power.rotation.x=Math.PI/2;power.position.set(43,27,69.5);root.add(power);
 for(const x of [-43,-21]){const usb=new THREE.Mesh(new THREE.BoxGeometry(13,5,1),ventMat);usb.position.set(x,27,69.5);root.add(usb);}
 function dimension(a,b){a=new THREE.Vector3(...a);b=new THREE.Vector3(...b);const v=b.clone().sub(a),length=v.length();root.add(new THREE.ArrowHelper(v.clone().normalize(),a,length,0x7a2cb0,5,2.5),new THREE.ArrowHelper(v.clone().negate().normalize(),b,length,0x7a2cb0,5,2.5));}
 dimension([-70,3,91],[70,3,91]);dimension([91,3,-70],[91,3,70]);dimension([-91,0,60],[-91,60,60]);
 root.visible=false;return root;
}
