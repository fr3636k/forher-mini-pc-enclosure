import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { buildProducts, buildCart } from './model.js';

const stage=document.getElementById('stage');
try {
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,window.innerWidth<750?1.25:1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.domElement.setAttribute('aria-label','超音波機、單一主機木盒與 USB 讀卡機的 3D 模型');renderer.domElement.setAttribute('role','img');stage.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#f1edf5');
const camera=new THREE.PerspectiveCamera(34,1,1,12000);camera.position.set(750,540,860);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,80,20);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=220;controls.maxDistance=4000;controls.maxPolarAngle=Math.PI*.49;
scene.add(new THREE.HemisphereLight('#fff9e9','#a3aca0',2.25));
const key=new THREE.DirectionalLight('#fff1d6',3.2);key.position.set(-450,900,650);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-900;key.shadow.camera.right=900;key.shadow.camera.top=1200;key.shadow.camera.bottom=-800;key.shadow.camera.near=10;key.shadow.camera.far=3000;key.shadow.normalBias=1;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
const fill=new THREE.DirectionalLight('#e0eaf0',1.65);fill.position.set(500,400,-450);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),new THREE.ShadowMaterial({color:'#5c6755',opacity:.16}));ground.rotation.x=-Math.PI/2;ground.position.y=-6;ground.receiveShadow=true;scene.add(ground);
const product=buildProducts();scene.add(product.root);const cart=buildCart();cart.visible=false;scene.add(cart);
let view='overview',transition=null,lastState='ready';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderRequest=0,stageVisible=true;
function requestRender(){if(!renderRequest&&stageVisible&&!document.hidden)renderRequest=requestAnimationFrame(animate);}
function invalidateGeometry(){renderer.shadowMap.needsUpdate=true;requestRender();}
const presets={
overview:{camera:[-1938,1504,2248],target:[-120,659,0],caption:'01 / 配置示意',title:'木盒配置於超音波機左側',copy:'以面對操作面板的方向為準：木盒掛左側，右側保留給病床。讀卡機固定在左側平台。',specs:[['木盒外尺寸','220 × 220 × 100 mm'],['主機基準','124 × 124 × 53.7 mm'],['操作','插卡錄影・拔卡存檔']]},
box:{camera:[470,320,570],target:[45,52,0],caption:'02 / 前門維修',title:'開門即可操作電源',copy:'左鉸鏈、右把手、磁吸關門；上蓋以螺絲固定，可另行拆下維修。',specs:[['門片','198 × 78 × 9 mm'],['門縫','四邊各 2 mm'],['板材','9 mm 夾板']]},
inside:{camera:[650,480,800],target:[0,70,0],caption:'03 / 六片木板爆炸圖',title:'六片矩形板，直切組裝',copy:'選取下方板件，可查看形狀與開孔位置。所有大圓孔均為 Ø45 mm，以同一支孔鋸加工。',specs:[['板件','上、下、左、右、後、前門'],['組合','平接＋內側木條固定'],['拆解','滑桿控制分離程度']]},
wiring:{camera:[420,300,-540],target:[0,50,-10],caption:'04 / 後側與右側開孔',title:'兩個方向都能出線',copy:'後側與右側各留 Ø45 mm 穿線孔。從正面面對前門，右手邊即為右側板。',specs:[['後側','HDMI／USB／電源穿線'],['右側','備用出線方向'],['接頭固定','盒內留餘線並固定線身']]}
};
const hotspotRoot=document.getElementById('hotspots');const hotspots=[];
function addHotspot(text,owner,point,views){const el=document.createElement('span');el.className='hotspot';el.textContent=text;hotspotRoot.appendChild(el);hotspots.push({el,owner,point:new THREE.Vector3(...point),projected:new THREE.Vector3(),views});}
addHotspot('左側主機盒',product.main,[0,125,0],['overview']);
addHotspot('USB 讀卡機',product.reader,[0,62,0],['overview','box']);
addHotspot('超音波機（示意）',cart,[-50,920,-90],['overview']);
addHotspot('前門',product.front,[0,72,113],['box']);
for(const [id,point] of Object.entries({A:[0,110,0],B:[0,4.5,110],C:[-110,65,0],D:[110,65,0],E:[0,65,-110],F:[0,65,110]}))addHotspot(id+' '+({A:'上板',B:'底板',C:'左板',D:'右板',E:'後板',F:'前門'}[id]),product.boards[id],point,['inside']);
addHotspot('後側 Ø45',product.main,[45,75,-111],['wiring']);
addHotspot('右側 Ø45',product.main,[111,75,-70],['wiring']);
function updateHotspots(){
  const enabled=document.getElementById('labels').checked;
  hotspots.forEach(h=>{const p=h.owner.localToWorld(h.projected.copy(h.point)).project(camera);const visible=enabled&&h.views.includes(view)&&p.z<1&&p.z>-1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.86;h.el.hidden=!visible;if(visible){h.el.style.left=`${(p.x*.5+.5)*stage.clientWidth}px`;h.el.style.top=`${(-p.y*.5+.5)*stage.clientHeight}px`;}});
}
function setDoor(degrees){product.setDoor(degrees);const b=document.getElementById('door-toggle');b.setAttribute('aria-pressed',String(degrees>0));b.textContent=degrees>0?'關閉前門':'只開前門';invalidateGeometry();}
function setExplode(value){if(Number(value)>0)setDoor(0);product.setExplode(Number(value)/100);document.getElementById('explode').value=String(value);document.getElementById('explode-value').textContent=`${value}%`;invalidateGeometry();}
function frame(){
  const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  const p=presets[view];const pos=new THREE.Vector3(...p.camera),target=new THREE.Vector3(...p.target);
  if(product.getDoor()>0&&!cart.visible)pos.sub(target).multiplyScalar(1.22).add(target);
  if(w/h<1.1)pos.sub(target).multiplyScalar(1.4).add(target);
  if(reduced){camera.position.copy(pos);controls.target.copy(target);}else transition={start:performance.now(),from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),toTarget:target};requestRender();
}
function setView(v){
  view=v;const p=presets[v];cart.visible=v==='overview';product.layout(cart.visible);setExplode(v==='inside'?100:0);setDoor(0);product.selectBoard(v==='inside'?document.querySelector('[data-board][aria-pressed=true]')?.dataset.board:null);
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));
  document.getElementById('view-caption').textContent=p.caption;document.getElementById('detail-index').textContent=p.caption.slice(0,2);document.getElementById('detail-title').textContent=p.title;document.getElementById('detail-copy').textContent=p.copy;
  document.getElementById('specs').replaceChildren(...p.specs.map(([a,b])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=a;dd.textContent=b;row.append(dt,dd);return row;}));
  document.getElementById('scale-caption').textContent=cart.visible?'超音波機為通用情境示意':'主機盒 220 × 220 × 100 mm';frame();
}
function setState(s){lastState=s;product.setState(s);invalidateGeometry();}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

document.getElementById('door-toggle').addEventListener('click',()=>{if(view!=='box'){setView('box');setDoor(105);}else if(product.getDoor()>0){setDoor(0);}else{setExplode(0);setDoor(105);}frame();});
document.getElementById('explode').addEventListener('input',e=>{const value=e.target.value;if(view!=='inside')setView('inside');setExplode(value);});document.getElementById('reset').addEventListener('click',frame);
controls.addEventListener('start',()=>{transition=null;requestRender();});controls.addEventListener('change',requestRender);document.getElementById('labels').addEventListener('change',requestRender);
async function exportModel(fullScene=true){
  const {GLTFExporter}=await import('./vendor/GLTFExporter.js');
  const prev=product.getExplode(),prevDoor=product.getDoor(),wasMounted=cart.visible;
  product.layout(fullScene);product.setExplode(0);product.setDoor(0);product.root.updateMatrixWorld(true);cart.updateMatrixWorld(true);
  const clone=new THREE.Group();clone.name=fullScene?'ForHer V4 - ultrasound and recorder scene':'ForHer V4 - recorder box and reader';
  clone.add(product.root.clone(true));if(fullScene){const context=cart.clone(true);context.visible=true;clone.add(context);}
  clone.scale.setScalar(.001);clone.updateMatrixWorld(true);product.layout(wasMounted);product.setExplode(prev);product.setDoor(prevDoor);
  return new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true,maxTextureSize:1024});
}
// The complete scene is pre-exported so downloads do not rebuild textures on the visitor's device.
document.getElementById('download').addEventListener('click',()=>{const a=document.createElement('a');a.href='./models/forher-recorder-v4-1-left.glb';a.download='forher-recorder-v4-1-left.glb';a.click();});
new ResizeObserver(frame).observe(stage);document.getElementById('loading').hidden=true;setView('overview');
function animate(time){renderRequest=0;if(!stageVisible||document.hidden)return;if(transition){const f=Math.min(1,(time-transition.start)/650),t=1-Math.pow(1-f,3);camera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,t);if(f===1)transition=null;}const moving=controls.update();updateHotspots();renderer.render(scene,camera);if(transition||moving)requestRender();}
new IntersectionObserver(entries=>{stageVisible=entries[0].isIntersecting;if(stageVisible)requestRender();else if(renderRequest){cancelAnimationFrame(renderRequest);renderRequest=0;}},{rootMargin:'100px'}).observe(stage);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&renderRequest){cancelAnimationFrame(renderRequest);renderRequest=0;}else requestRender();});
requestRender();
// Local QA and source portability: no backend, accounts or patient data are used.
window.recorderDesign={setView,setState,setExplode,setDoor,exportModel,renderer,scene,product,get view(){return view;},get state(){return lastState;}};
} catch(error){console.error(error);document.getElementById('loading').hidden=true;document.getElementById('error').hidden=false;}
