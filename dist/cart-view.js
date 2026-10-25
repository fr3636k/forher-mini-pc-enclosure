import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { buildRearHandle } from './equipment-view.js';

// Photo-informed proportions only. All geometry uses mm, not surveyed machine dimensions.
export const cartDimensions={consoleWidth:620,consoleDepth:480,consolePitchDeg:14,bodyWidth:418.5,bodyHeight:527};
const mat=(color,roughness=.65,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const ivory=mat('#deded5'),panel=mat('#62778b'),rim=mat('#8899a5'),dark=mat('#242d34'),cream=mat('#eeeadb'),metal=mat('#a7adb0',.35,.55),screenMat=mat('#18232d',.3),green=mat('#8fae89');
function group(parent,name){const g=new THREE.Group();g.name=name;parent?.add(g);return g;}
function block(parent,name,size,pos,m=ivory,r=4){const geo=r?new RoundedBoxGeometry(...size,2,r):new THREE.BoxGeometry(...size);const o=new THREE.Mesh(geo,m);o.name=name;o.position.set(...pos);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
function tube(parent,name,points,r,m=metal){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const o=new THREE.Mesh(new THREE.TubeGeometry(path,32,r,8,false),m);o.name=name;o.castShadow=true;parent.add(o);return o;}
function cylinder(parent,name,r,h,pos,m=metal){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),m);o.name=name;o.position.set(...pos);o.castShadow=true;parent.add(o);return o;}
function ring(parent,name,r,pos,m=cream){const o=new THREE.Mesh(new THREE.TorusGeometry(r,5,8,24),m);o.name=name;o.rotation.x=Math.PI/2;o.position.set(...pos);parent.add(o);return o;}

export function buildUltrasoundCart(){
 const root=group(null,'Ultrasound cart - photo-informed shape, dimensions assumed');
 // Preserve the shell's left contact area used by the enclosure standoff.
 block(root,'Rounded lower machine body',[418.5,527,341],[-77.5,545.6,-38.75],ivory,12);
 block(root,'Lower skirt transition',[440,140,350],[-77.5,260,-8],ivory,22);
 block(root,'Wheeled pedestal',[535,55,440],[-77.5,173,25],ivory,22);
 block(root,'Front equipment bay',[305,220,14],[-77.5,565,136],dark,9);
 for(const y of [493,551,610]){block(root,'Front removable module face',[276,49,16],[-77.5,y,148],ivory,4);block(root,'Module slot',[155,5,3],[-92,y+6,158],dark,1);}
 for(const x of [-280,125])for(const z of [-145,195]){
  block(root,'Caster fork',[22,72,28],[x,115,z],metal,4);
  const wh=cylinder(root,'Caster wheel',51,26,[x,53,z],dark);wh.rotation.z=Math.PI/2;
 }
 // Broad, slightly sloping deck: rear higher, operator/front edge lower.
 block(root,'Operation deck pedestal',[260,150,230],[-77.5,850,-10],ivory,20);
 const console=group(root,'Photo-reference sloping operation deck');
 console.position.set(-77.5,940,25);console.rotation.x=THREE.MathUtils.degToRad(cartDimensions.consolePitchDeg);
 block(console,'Wide operation interface table',[620,46,480],[0,0,0],ivory,22);
 block(console,'Blue-grey operation fascia',[602,11,462],[0,28,0],panel,20);
 block(console,'Integrated central touch display surround',[346,10,190],[0,38,-100],rim,9);
 block(console,'Integrated central touch display',[314,3,161],[0,44,-100],screenMat,4);
 // Abstract menu tiles, no patient screen capture or identifying information.
 for(let row=0;row<3;row++)for(let col=0;col<4;col++)block(console,'Touch display menu tile',[66,1.5,35],[-112+col*75,46,-151+row*46],mat(row===1?'#344753':'#2a3946'),2);
 block(console,'Keyboard recess',[262,4,112],[-85,38,126],dark,6);
 for(let row=0;row<5;row++)for(let col=0;col<11;col++)block(console,'Cream keyboard key',[19,4,16],[-196+col*22,43,87+row*19],cream,1.5);
 block(console,'Keyboard space bar',[105,4,14],[-85,44,177],cream,1.5);
 const ball=new THREE.Mesh(new THREE.SphereGeometry(22,20,14),cream);ball.name='Trackball';ball.position.set(145,49,125);console.add(ball);
 for(const x of [111,145,179])block(console,'Trackball function key',[25,4,15],[x,40,171],dark,3);
 for(let i=0;i<7;i++){cylinder(console,'Display rotary knob',10,15,[-126+i*42,48,12],metal);ring(console,'Knob surround',13,[-126+i*42,39,12],dark);}
 for(const x of [195,225])for(let i=0;i<5;i++)cylinder(console,'Side control key',7,5,[x,39,-118+i*32],i===3?green:cream);
 for(let i=0;i<6;i++)block(console,'Function key',[24,4,14],[-135+i*40,40,48],i===2?green:cream,3);
 // Three probe wells on each side, echoing the curved white holders in the photos.
 for(const x of [-259,259])for(const z of [-150,-45,60]){
  cylinder(console,'Probe well dark interior',26,12,[x,24,z],dark);
  ring(console,'Cream circular probe well',31,[x,36,z]);
 }
 for(const x of [-259,259]){
  const z=-45;cylinder(console,'Probe grip',17,120,[x,95,z],cream);cylinder(console,'Probe head',22,35,[x,171,z],panel);
 }
 tube(console,'Curved front push handle',[[-270,4,198],[-257,4,275],[-166,4,319],[166,4,319],[257,4,275],[270,4,198]],14,rim);
 tube(console,'Front handle dark grip',[[-115,4,319],[0,4,323],[115,4,319]],14.5,panel);
 block(root,'External reader edge bracket placeholder',[80,10,90],[-385,924,185],ivory,5);
 // Screen arm behind the deck, rather than a flat shelf over the rear handle.
 cylinder(root,'Monitor arm vertical hinge',30,150,[-215,1060,-130],metal);
 block(root,'Monitor arm horizontal segment',[180,30,48],[-140,1123,-130],metal,10);
 cylinder(root,'Monitor arm display hinge',28,65,[-77.5,1123,-130],metal);
 const monitor=group(root,'Existing ultrasound monitor photo proportions');
 monitor.position.set(-77.5,1240,-95);monitor.rotation.x=-.08;
 block(monitor,'Blue-grey monitor bezel',[540,365,32],[0,0,0],panel,16);
 block(monitor,'Dark monitor glass',[494,319,5],[0,0,19],screenMat,3);
 const fan=new THREE.Shape();fan.moveTo(0,121);
 for(let i=0;i<=36;i++){const a=-.63+i/36*1.26;fan.lineTo(240*Math.sin(a),121-240*Math.cos(a));}fan.closePath();
 const sector=new THREE.Mesh(new THREE.ShapeGeometry(fan),mat('#353b39'));sector.name='Synthetic ultrasound fan - no patient data';sector.position.set(0,0,23);monitor.add(sector);
 for(let i=0;i<23;i++){
  const r=70+i*7.1,points=[];for(let j=0;j<=18;j++){const a=-.58+j/18*1.16,noise=Math.sin(j*1.8+i*.9)*3;points.push([(r+noise)*Math.sin(a),121-(r+noise)*Math.cos(a),24]);}
  tube(monitor,'Synthetic echo arc',points,.55,mat(i%4===0?'#b4b0a1':'#777c73'));
 }
 block(monitor,'Monitor lower blue status bar',[470,6,1],[0,-147,25],mat('#3c6c7a'),0);
 for(let i=0;i<7;i++)block(monitor,'Monitor side menu tile',[28,11,1],[218,95-i*22,25],mat('#3c5968'),1);
 // Keep the established rear handle and installation coordinates unchanged.
 root.add(buildRearHandle());
 block(root,'Ultrasound HDMI output placeholder',[4,12,22],[-306.9,759.5,-186],dark,1);
 root.userData={dimensionsAssumed:true,photoReferenceOnly:true,consoleRearHigherThanFront:true,noPatientImages:true};
 return root;
}
