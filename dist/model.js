import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

// Geometry uses millimetres. The GLB exporter converts the product root to metres.
export const dimensions = { main: [300, 160, 280], pod: [200, 120, 160], screen: '3.5 inch placeholder' };
const mat = (color,roughness=.55,metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
const graphite=mat('#303939',.48),black=mat('#181f20',.45),rubber=mat('#27302d',.9),steel=mat('#a2aaa5',.28,.8),green=mat('#2f6f5e',.8),white=mat('#e6e9e4',.55);

function woodTexture(){
  const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#caa375';x.fillRect(0,0,1024,1024);
  for(let i=0;i<630;i++){
    const v=(Math.sin(i*12.9898)*43758.5453)%1;const a=.025+Math.abs(v)*.08;
    x.strokeStyle=`rgba(${v>0?93:245},${v>0?62:209},${v>0?32:160},${a})`;x.lineWidth=.4+Math.abs(v)*1.8;x.beginPath();
    const px=i*1.75;for(let y=0;y<=1024;y+=12){const k=px+5*Math.sin(y*.005+i*.12)+2*Math.sin(y*.013+i);y===0?x.moveTo(k,y):x.lineTo(k,y);}x.stroke();
  }
  for(let i=0;i<25;i++){x.strokeStyle='rgba(99,67,35,.035)';x.lineWidth=2;x.beginPath();x.ellipse(100+i*37,470+Math.sin(i)*180,4+i%5,170+i*3,.08,0,Math.PI*2);x.stroke();}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}
const oak=new THREE.MeshStandardMaterial({map:woodTexture(),roughness:.67,color:'#fff2dd'});
const edgeOak=mat('#c9a273',.72);
function group(parent,name){const g=new THREE.Group();g.name=name;parent?.add(g);return g;}
function block(parent,name,w,h,d,x,y,z,material=oak,r=1){
  const m=new THREE.Mesh(r?new RoundedBoxGeometry(w,h,d,2,r):new THREE.BoxGeometry(w,h,d),material);
  m.name=name;m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function roundPath(path,x,y,w,h,r){
  path.moveTo(x+r,y);path.lineTo(x+w-r,y);path.quadraticCurveTo(x+w,y,x+w,y+r);path.lineTo(x+w,y+h-r);path.quadraticCurveTo(x+w,y+h,x+w-r,y+h);path.lineTo(x+r,y+h);path.quadraticCurveTo(x,y+h,x,y+h-r);path.lineTo(x,y+r);path.quadraticCurveTo(x,y,x+r,y);
}
function panel(parent,name,w,h,t,holes,material=oak){
  const s=new THREE.Shape();roundPath(s,-w/2,-h/2,w,h,1);
  holes.forEach(([x,y,hw,hh,r=2])=>{const p=new THREE.Path();roundPath(p,x-hw/2,y-hh/2,hw,hh,r);s.holes.push(p);});
  const geo=new THREE.ExtrudeGeometry(s,{depth:t,steps:1,bevelEnabled:true,bevelThickness:.35,bevelSize:.35,bevelSegments:2});geo.translate(0,0,-t/2);
  const m=new THREE.Mesh(geo,material);m.name=name;m.castShadow=m.receiveShadow=true;parent.add(m);return m;
}
function screw(parent,x,y,z){
  const g=group(parent,'Removable panel screw');g.position.set(x,y,z);
  const m=new THREE.Mesh(new THREE.CylinderGeometry(2.5,2.5,1.2,16),steel);m.rotation.x=Math.PI/2;g.add(m);
  block(g,'Screw slot',3,.55,.4,0,0,.8,black,0);block(g,'Screw slot',.55,3,.4,0,0,.8,black,0);return g;
}
function planeText(parent,name,w,h,x,y,z,draw){
  const c=document.createElement('canvas');c.width=1024;c.height=Math.max(128,Math.round(1024*h/w));const ctx=c.getContext('2d');draw(ctx,c.width,c.height);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,toneMapped:false});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);p.position.set(x,y,z);p.name=name;parent.add(p);return {mesh:p,canvas:c,ctx,texture};
}
function label(parent,str,w,h,x,y,z,color='#b6c0b3'){
  return planeText(parent,str,w,h,x,y,z,(ctx,cw,ch)=>{ctx.clearRect(0,0,cw,ch);ctx.fillStyle=color;ctx.font=`500 ${ch*.7}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(str,cw/2,ch/2);});
}
function cable(parent,name,points,r=2,color='#3a443e'){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,r,8,false),mat(color,.8));m.name=name;m.castShadow=true;parent.add(m);return m;
}
function feet(parent,w,d){for(const x of [-w/2+15,w/2-15])for(const z of [-d/2+15,d/2-15])block(parent,'Non-slip rubber foot',17,5,17,x,-2.5,z,rubber,2);}

export function buildProducts(){
  const products=group(null,'ForHer ultrasound recorder concept V1.1');
  products.userData={units:'millimetres before export',design:'V1.1 HDMI display concept',manufacturingReady:false,mainEnvelopeMm:'300 x 280 x 160',podEnvelopeMm:'200 x 160 x 120'};
  const main=group(products,'Main enclosure 300W 280D 160H mm');
  feet(main,300,280);block(main,'12mm plywood bottom',300,12,280,0,6,0,oak,1);
  const lid=group(main,'Removable top cover');block(lid,'12mm plywood top',300,12,280,0,154,0,oak,1.2);
  for(const side of [-1,1]){
    const p=panel(main,'Ventilated plywood side',280,136,12,[-30,-18,-6,6,18,30].map(y=>[0,y,122,5,2]));p.rotation.y=Math.PI/2;p.position.set(side*144,80,0);
  }
  const back=panel(main,'Rear cable access panel',276,136,12,[[0,-33,100,26,5]]);back.position.set(0,80,-134);
  const front=group(main,'Removable front maintenance panel');block(front,'Front plywood cover',276,136,12,0,80,134,oak,.8);
  for(const x of [-120,120])for(const y of [26,134])screw(front,x,y,141);
  label(front,'FORHER',98,15,0,89,141.2,'#4b543e');label(front,'ULTRASOUND RECORDER',100,6,0,66,141.2,'#6d7158');
  for(const x of [-126,126])for(const z of [-112,112])block(main,'Internal fixing block',18,24,20,x,24,z,edgeOak,.5);
  block(main,'Removable equipment tray',262,3,240,0,15,0,steel,.7);
  const pc=group(main,'Replaceable mini PC placeholder 180 x 180 x 80 mm');
  block(pc,'Mini PC chassis',180,80,180,-30,59,-22,graphite,5);
  block(pc,'PC top trim',174,1,174,-30,100,-22,black,2);
  for(let i=0;i<12;i++)block(pc,'PC vent grille',2,1,110,-84+i*10,101,-30,black,.3);
  const power=new THREE.Mesh(new THREE.CylinderGeometry(5,5,2,24),steel);power.rotation.x=Math.PI/2;power.position.set(34,62,69);pc.add(power);
  for(const x of [-86,-61]){block(pc,'USB socket',14,7,2,x,61,69,black,.5);block(pc,'USB socket insert',10,2,2.2,x,61,70,mat('#3c7c94'),0);}
  block(main,'Adjustable left stop',6,19,200,-125,25,-20,steel,.7);block(main,'Adjustable right stop',6,19,200,67,25,-20,steel,.7);
  const capture=group(main,'USB video capture placeholder');block(capture,'Capture device',58,24,104,108,31,-8,black,3);
  label(capture,'CAPTURE',42,7,108,33,45,'#afb9ad');block(capture,'Capture front connector',20,10,12,108,31,50,steel,1);
  cable(main,'Internal USB service loop',[[108,32,-60],[110,28,-107],[50,25,-117],[30,40,-114]],2);
  for(const x of [-166,-162])block(main,'Hanging bracket illustrative',4,80,28,x,117,-50,steel,1);
  block(main,'Hanging bracket hook',30,6,28,-155,158,-50,steel,1);

  const pod=group(products,'Operator pod 200W 160D 120H mm');feet(pod,200,160);
  block(pod,'9mm plywood bottom',200,9,160,0,4.5,0,oak,1);
  const podLid=group(pod,'Removable reader deck');block(podLid,'9mm plywood reader deck',200,9,160,0,115.5,0,oak,1.2);
  for(const side of [-1,1]){
    const p=panel(pod,'Operator pod ventilated side',160,102,9,[-20,-10,0].map(y=>[0,y,62,4,1.5]));p.rotation.y=Math.PI/2;p.position.set(side*95.5,60,0);
  }
  const pb=panel(pod,'Pod rear cable panel',182,102,9,[[0,-23,42,18,4]]);pb.position.set(0,60,-75.5);
  const pf=panel(pod,'Plywood front display opening',182,102,9,[[0,2,136,88,3]]);pf.position.set(0,60,75.5);
  const screenAssembly=group(pod,'Replaceable display front assembly');
  const face=panel(screenAssembly,'3mm replaceable dark display plate',176,102,3,[[0,3,118,78,2]],graphite);face.position.set(0,60,82);
  for(const x of [-80,80])for(const y of [18,102])screw(screenAssembly,x,y,84);
  const bezel=panel(screenAssembly,'Display bezel placeholder',126,88,5,[[0,0,114,74,2]],black);bezel.position.set(0,63,84);
  const screen=planeText(screenAssembly,'Status display illustrative content',114,74,0,63,87,()=>{});
  const led=new THREE.Mesh(new THREE.SphereGeometry(2,16,8),new THREE.MeshStandardMaterial({color:'#87b382',emissive:'#295329',emissiveIntensity:.4}));led.position.set(69,30,84);screenAssembly.add(led);
  label(screenAssembly,'FORHER',34,6,-57,18,84.1,'#9aa99b');
  block(screenAssembly,'Display PCB placeholder',122,80,2,0,63,66,green,.5);
  for(const x of [-58,58])for(const y of [25,101])block(screenAssembly,'Insulating standoff',4,4,12,x,y,73,white,.5);
  const controller=block(pod,'USB control/interface space placeholder',50,12,32,52,24,-40,green,1);
  label(pod,'USB / HDMI',45,7,0,34,-81,'#78806c').mesh.rotation.y=Math.PI;
  const reader=group(podLid,'Removable health card reader and cradle');
  block(reader,'Reader cradle',116,5,88,0,122,-9,graphite,3);
  block(reader,'Health card reader placeholder',100,19,76,0,134,-9,black,4);
  block(reader,'Card insertion slot',61,2,1,0,133,29.5,rubber,.4);
  for(const x of [-55,55])block(reader,'Cradle fixing stop',5,10,40,x,126,-18,graphite,1);
  const rt=label(reader,'CARD READER',61,8,0,144,-16,'#b8c6b8');rt.mesh.rotation.x=-Math.PI/2;
  const card=group(reader,'Demo health card (fictional)');
  block(card,'Demo card body',54,.9,70,0,133,60,mat('#d8e6d8',.65),1);
  const cardFace=planeText(card,'Fictional demo card',53,69,0,133.6,60,(ctx,w,h)=>{
    ctx.fillStyle='#e4eadd';ctx.fillRect(0,0,w,h);ctx.fillStyle='#77977e';ctx.fillRect(0,0,w,h*.16);ctx.fillStyle='#fff';ctx.font=`${h*.075}px sans-serif`;ctx.fillText('DEMO CARD',w*.08,h*.115);
    ctx.fillStyle='#b5a36c';ctx.fillRect(w*.12,h*.28,w*.25,h*.2);ctx.strokeStyle='#867744';ctx.lineWidth=4;ctx.strokeRect(w*.12,h*.28,w*.25,h*.2);ctx.beginPath();ctx.moveTo(w*.24,h*.28);ctx.lineTo(w*.24,h*.48);ctx.moveTo(w*.12,h*.38);ctx.lineTo(w*.37,h*.38);ctx.stroke();
    ctx.fillStyle='#425c4a';ctx.font=`${h*.075}px sans-serif`;ctx.fillText('僅供模型展示',w*.1,h*.66);ctx.font=`${h*.065}px sans-serif`;ctx.fillText('A*****6789',w*.1,h*.8);
  });cardFace.mesh.rotation.x=-Math.PI/2;
  cable(pod,'Reader USB service loop',[[40,133,-48],[70,130,-69],[70,94,-85],[50,55,-85]],1.6);
  const link=group(products,'External connection cable');
  function drawLink(mounted){link.clear();
    if(mounted)cable(link,'Secured USB connection illustrative',[[2,704,-35],[140,630,-120],[155,400,-145],[250,260,-145]],2.6);
    else cable(link,'Secured USB connection illustrative',[[253,73,65],[280,30,5],[210,6,-150],[10,6,-210],[-130,45,-155]],2.4);
  }
  let explodeValue=0,state='ready';
  function setExplode(v){explodeValue=v;lid.position.y=v*150;front.position.z=v*130;podLid.position.y=v*95;screenAssembly.position.z=v*85;}
  function setState(v){state=v;card.visible=v==='record';
    const {ctx,canvas,texture}=screen;const w=canvas.width,h=canvas.height;
    ctx.fillStyle='#101f22';ctx.fillRect(0,0,w,h);ctx.fillStyle='#83b0a1';ctx.font=`500 ${h*.052}px sans-serif`;ctx.fillText('FORHER  /  ULTRASOUND',w*.07,h*.1);
    ctx.fillStyle='#415453';ctx.fillRect(w*.07,h*.15,w*.86,2);
    const color=v==='record'?'#f59b85':v==='saving'?'#e2c179':'#a6d0b0';
    ctx.fillStyle=color;ctx.font=`500 ${h*.117}px sans-serif`;ctx.fillText(v==='record'?'正在錄影':v==='saving'?'存檔中':'等待插卡',w*.07,h*.34);
    ctx.fillStyle='#edf4e9';ctx.font=`500 ${h*.19}px monospace`;ctx.fillText(v==='record'?'02:35':v==='saving'?'···':'READY',w*.065,h*.6);
    ctx.fillStyle='#aec4b9';ctx.font=`${h*.063}px sans-serif`;ctx.fillText(v==='ready'?'請插入健保卡':'範例 ID：A*****6789',w*.07,h*.76);
    ctx.fillStyle='#638477';ctx.font=`${h*.05}px sans-serif`;ctx.fillText(v==='record'?'影像訊號正常':v==='saving'?'請等待檔案完成保存':'設備已就緒',w*.07,h*.9);texture.needsUpdate=true;
    led.material.color.set(v==='record'?'#db705b':v==='saving'?'#d5ac62':'#87b382');
  }
  function layout(mounted=false){main.position.set(mounted?270:-130,mounted?200:0,mounted?-5:-15);pod.position.set(mounted?-50:205,mounted?570:0,mounted?15:150);drawLink(mounted);}
  setState('ready');layout();
  return {root:products,main,pod,card,lid,front,podLid,screenAssembly,setExplode,setState,layout,getExplode:()=>explodeValue,getState:()=>state};
}

export function buildCart(){
  const cart=group(null,'Ultrasound cart context only - not supplied equipment');const light=mat('#dce0d8',.6),dark=mat('#586660',.6);
  block(cart,'Cart platform',380,22,355,-50,559,0,light,10);
  block(cart,'Cart equipment body',270,340,220,-50,352,-25,light,12);
  block(cart,'Front equipment recess',220,255,5,-50,355,87,dark,8);
  block(cart,'Lower cart base',360,35,300,-50,111,0,light,12);
  for(const x of [-185,85])for(const z of [-110,110]){
    block(cart,'Wheel fork',15,38,20,x,67,z,steel,2);
    const wh=new THREE.Mesh(new THREE.CylinderGeometry(30,30,18,24),rubber);wh.rotation.z=Math.PI/2;wh.position.set(x,37,z);wh.castShadow=true;cart.add(wh);
  }
  block(cart,'Display stand',26,125,26,-50,640,-105,dark,3);
  const monitor=group(cart,'Existing ultrasound monitor context');monitor.position.set(-50,776,-90);monitor.rotation.x=-.06;
  block(monitor,'Existing screen housing',350,230,20,0,0,0,black,8);
  planeText(monitor,'Ultrasound screen schematic',323,200,0,4,11,(ctx,w,h)=>{
    ctx.fillStyle='#182223';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#72817b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(w*.5,h*.18);ctx.lineTo(w*.12,h*.84);ctx.quadraticCurveTo(w*.5,h*1.03,w*.88,h*.84);ctx.closePath();ctx.stroke();ctx.fillStyle='#495952';ctx.fill();ctx.fillStyle='#7e8c83';ctx.font='26px sans-serif';ctx.fillText('ULTRASOUND / 示意',30,42);
  });
  block(cart,'Approved accessory rail placeholder',12,25,210,147,523,0,steel,2);
  block(cart,'Bracket mounting backplate indicative',8,140,85,115,346,-55,steel,2);
  return cart;
}
