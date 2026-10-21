import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFExporter } from './vendor/GLTFExporter.js';
import { buildProducts, buildCart } from './model.js';

const stage=document.getElementById('stage');
try {
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.domElement.setAttribute('aria-label','可旋轉的木作主機盒與螢幕讀卡操作座');renderer.domElement.setAttribute('role','img');stage.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#eeeee7');
const camera=new THREE.PerspectiveCamera(34,1,1,12000);camera.position.set(750,540,860);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,80,20);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=220;controls.maxDistance=4000;controls.maxPolarAngle=Math.PI*.49;
scene.add(new THREE.HemisphereLight('#fff9e9','#a3aca0',2.25));
const key=new THREE.DirectionalLight('#fff1d6',3.2);key.position.set(-450,900,650);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-900;key.shadow.camera.right=900;key.shadow.camera.top=1200;key.shadow.camera.bottom=-800;key.shadow.camera.near=10;key.shadow.camera.far=3000;key.shadow.normalBias=1;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
const fill=new THREE.DirectionalLight('#e0eaf0',1.65);fill.position.set(500,400,-450);scene.add(fill);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),new THREE.ShadowMaterial({color:'#5c6755',opacity:.16}));ground.rotation.x=-Math.PI/2;ground.position.y=-6;ground.receiveShadow=true;scene.add(ground);
const product=buildProducts();scene.add(product.root);const cart=buildCart();cart.visible=false;scene.add(cart);
let view='overview',transition=null,lastState='ready';
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const presets={
overview:{camera:[750,540,860],target:[0,75,20],caption:'01 / 整體外觀',title:'兩個盒子，一套流程。',copy:'主機與擷取器集中收納，讀卡與確認狀態在手邊完成。兩個盒子之間整理好連接線。',specs:[['主機盒','300 × 280 × 160 mm'],['操作座','200 × 160 × 120 mm'],['面板','3.5 吋小螢幕示意']]},
pod:{camera:[520,310,620],target:[205,84,150],caption:'02 / 操作座特寫',title:'插一張卡，就能開始。',copy:'上方固定讀卡機，正面小螢幕顯示病人識別與錄影狀態。深色面板以螺絲固定，可單獨更換。',specs:[['外尺寸','200 × 160 × 120 mm'],['木板厚度','9 mm 示意'],['顯示內容','中文、計時與錯誤提示']]},
inside:{camera:[690,600,860],target:[0,135,20],caption:'03 / 內部拆解',title:'打開，就能維修。',copy:'主機前蓋與上蓋可拆。內部擋塊固定主機，擷取器獨立收納；操作座的螢幕模組由背面支架固定。',specs:[['主機占位','180 × 180 × 80 mm'],['木板厚度','12 mm 示意'],['固定方式','螺絲、擋塊與支架']]},
mounted:{camera:[1300,950,1500],target:[65,435,10],caption:'04 / 側掛位置示意',title:'主機在側邊，操作在手邊。',copy:'操作座隨超音波推車一起移動。主機盒靠側掛架固定，線材沿機身整理；掛點與承重需依原機確認。',specs:[['操作座','平台上固定'],['主機盒','機側掛架固定'],['原機外形','通用情境示意，非指定機型']]}
};
const hotspotRoot=document.getElementById('hotspots');const hotspots=[];
function addHotspot(text,owner,point,views){const el=document.createElement('span');el.className='hotspot';el.textContent=text;hotspotRoot.appendChild(el);hotspots.push({el,owner,point:new THREE.Vector3(...point),views});}
addHotspot('可拆維修前蓋',product.front,[0,110,146],['overview','inside']);
addHotspot('上蓋可拆',product.lid,[0,160,-15],['inside']);
addHotspot('3.5 吋狀態小螢幕',product.screenAssembly,[0,93,90],['overview','pod']);
addHotspot('讀卡機獨立固定',product.podLid,[0,156,-20],['pod']);
addHotspot('主機與擷取器',product.main,[-5,108,30],['inside']);
addHotspot('隨車移動的操作座',product.pod,[0,155,0],['mounted']);
addHotspot('側掛盒／掛點待確認',product.main,[0,170,0],['mounted']);
function updateHotspots(){
  const enabled=document.getElementById('labels').checked;
  hotspots.forEach(h=>{const p=h.owner.localToWorld(h.point.clone()).project(camera);const visible=enabled&&h.views.includes(view)&&p.z<1&&p.z>-1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.86;h.el.hidden=!visible;if(visible){h.el.style.left=`${(p.x*.5+.5)*stage.clientWidth}px`;h.el.style.top=`${(-p.y*.5+.5)*stage.clientHeight}px`;}});
}
function setExplode(value){product.setExplode(Number(value)/100);document.getElementById('explode').value=String(value);document.getElementById('explode-value').textContent=`${value}%`;}
function frame(){
  const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  const p=presets[view];const pos=new THREE.Vector3(...p.camera),target=new THREE.Vector3(...p.target);
  if(w/h<1.1)pos.sub(target).multiplyScalar(1.4).add(target);
  if(reduced){camera.position.copy(pos);controls.target.copy(target);}else transition={start:performance.now(),from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),toTarget:target};
}
function setView(v){
  view=v;const p=presets[v];cart.visible=v==='mounted';product.layout(v==='mounted');setExplode(v==='inside'?90:0);
  product.main.visible=v!=='pod';product.root.children.find(n=>n.name==='External connection cable').visible=v!=='pod';
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));
  document.getElementById('view-caption').textContent=p.caption;document.getElementById('detail-index').textContent=p.caption.slice(0,2);document.getElementById('detail-title').textContent=p.title;document.getElementById('detail-copy').textContent=p.copy;
  document.getElementById('specs').replaceChildren(...p.specs.map(([a,b])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=a;dd.textContent=b;row.append(dt,dd);return row;}));
  document.getElementById('scale-caption').textContent=v==='pod'?'操作座 200 × 160 × 120 mm':v==='mounted'?'原機與掛點僅為情境示意':'主機盒 300 × 280 × 160 mm';frame();
}
function setState(s){lastState=s;product.setState(s);document.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.state===s)));document.getElementById('state-note').textContent=s==='record'?'錄影示意：讀卡成功，顯示病人末四碼與計時。':s==='saving'?'拔卡示意：先停止錄影並保存檔案，再安排上傳。':'待機：確認設備正常，等待插入健保卡。';}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('[data-state]').forEach(b=>b.addEventListener('click',()=>setState(b.dataset.state)));
document.getElementById('explode').addEventListener('input',e=>setExplode(e.target.value));document.getElementById('reset').addEventListener('click',frame);
controls.addEventListener('start',()=>transition=null);
async function exportModel(){
  const prev=product.getExplode(),wasMounted=view==='mounted';product.layout(false);product.setExplode(0);product.main.visible=true;product.root.children.find(n=>n.name==='External connection cable').visible=true;
  product.root.updateMatrixWorld(true);const clone=product.root.clone(true);clone.scale.setScalar(.001);clone.updateMatrixWorld(true);
  product.layout(wasMounted);product.setExplode(prev);product.main.visible=view!=='pod';product.root.children.find(n=>n.name==='External connection cable').visible=view!=='pod';
  return new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true,maxTextureSize:1024});
}
document.getElementById('download').addEventListener('click',async()=>{const button=document.getElementById('download');button.disabled=true;button.textContent='正在準備模型…';try{const data=await exportModel(),blob=new Blob([data],{type:'model/gltf-binary'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='forher-recorder-v1-1.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(e){console.error(e);document.getElementById('state-note').textContent='模型下載失敗，請重新整理後再試。';}finally{button.disabled=false;button.innerHTML='下載 3D 模型 <span>↓ GLB</span>';}});
new ResizeObserver(frame).observe(stage);document.getElementById('loading').hidden=true;setView('overview');
function animate(time){requestAnimationFrame(animate);if(transition){const f=Math.min(1,(time-transition.start)/650),t=1-Math.pow(1-f,3);camera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,t);if(f===1)transition=null;}controls.update();updateHotspots();renderer.render(scene,camera);}requestAnimationFrame(animate);
// Local QA and source portability: no backend, accounts or patient data are used.
window.recorderDesign={setView,setState,setExplode,exportModel,renderer,scene,product,get view(){return view;},get state(){return lastState;}};
} catch(error){console.error(error);document.getElementById('loading').hidden=true;document.getElementById('error').hidden=false;}
