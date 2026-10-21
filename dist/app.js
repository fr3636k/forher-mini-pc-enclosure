import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { GLTFExporter } from './vendor/GLTFExporter.js';
import { buildProducts, buildCart } from './model.js';

const stage=document.getElementById('stage');
try {
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.domElement.setAttribute('aria-label','超音波機、單一主機木盒與 USB 讀卡機的 3D 模型');renderer.domElement.setAttribute('role','img');stage.prepend(renderer.domElement);
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
overview:{camera:[1938,1504,2248],target:[54,659,0],caption:'01 / 超音波旁配置',title:'一個盒子，一台讀卡機。',copy:'以 Cubi 12.4 公分主機為尺寸基準，縮為 22 公分木盒。超音波機平台暫按 58.9 公分寬、整機約 138 公分高示意，並非實際機型尺寸。',specs:[['主機盒','220 × 220 × 100 mm'],['主機尺寸','124 × 124 × 53.7 mm'],['原機比例','平台寬約 589 mm（假設）']]},
box:{camera:[470,320,570],target:[45,52,0],caption:'02 / 主機盒特寫',title:'外面簡單，裡面可維修。',copy:'9 mm 木板，內部幾何淨尺寸 202 × 202 × 82 mm。主機旁預留小型擷取器，主機後方預留約 63 mm 接線區；變壓器另放。',specs:[['外尺寸','220 × 220 × 100 mm'],['板厚','9 mm 示意'],['讀卡機','USB 連接電腦']]},
inside:{camera:[480,430,630],target:[35,92,10],caption:'03 / 打開盒蓋',title:'擷取器藏在盒內。',copy:'HDMI 先進入影像擷取器，再以 USB 傳給電腦。一般小主機的 HDMI 是輸出，不能直接接收超音波影像。',specs:[['主機占位','124 × 124 × 53.7 mm'],['擷取器假設','45 × 90 × 20 mm'],['維修方式','左鉸鏈前門；上蓋另拆']]},
wiring:{camera:[1705,1349,-2170],target:[47,682,-8],caption:'04 / HDMI 與 USB 接線',title:'影像與身分，各走一條線。',copy:'藍灰色：超音波 HDMI → 盒內擷取器。深灰色：讀卡機 USB → 電腦。線先固定再接設備，避免插孔承重。',specs:[['HDMI','影像輸出 → 擷取器'],['USB','讀卡機 → 電腦'],['另需','電源；上傳另需網路']]}
};
const hotspotRoot=document.getElementById('hotspots');const hotspots=[];
function addHotspot(text,owner,point,views){const el=document.createElement('span');el.className='hotspot';el.textContent=text;hotspotRoot.appendChild(el);hotspots.push({el,owner,point:new THREE.Vector3(...point),views});}
addHotspot('單一主機盒',product.main,[0,125,0],['overview']);
addHotspot('USB 讀卡機',product.reader,[0,62,0],['overview','box']);
addHotspot('超音波機（示意）',cart,[-50,920,-90],['overview']);
addHotspot('左側鉸鏈前門',product.front,[0,72,113],['box','inside']);
addHotspot('上蓋可拆',product.lid,[0,100,-10],['inside']);
addHotspot('迷你電腦',product.main,[-29,82,24],['inside']);
addHotspot('影像擷取器',product.main,[67,55,15],['inside']);
addHotspot('HDMI 影像輸入',cart,[180,390,-160],['wiring']);
addHotspot('USB 讀卡線',cart,[80,580,-150],['wiring']);
function updateHotspots(){
  const enabled=document.getElementById('labels').checked;
  hotspots.forEach(h=>{const p=h.owner.localToWorld(h.point.clone()).project(camera);const visible=enabled&&h.views.includes(view)&&p.z<1&&p.z>-1&&Math.abs(p.x)<.94&&Math.abs(p.y)<.86;h.el.hidden=!visible;if(visible){h.el.style.left=`${(p.x*.5+.5)*stage.clientWidth}px`;h.el.style.top=`${(-p.y*.5+.5)*stage.clientHeight}px`;}});
}
function setDoor(degrees){product.setDoor(degrees);const b=document.getElementById('door-toggle');b.setAttribute('aria-pressed',String(degrees>0));b.textContent=degrees>0?'關閉前門':'只開前門';}
function setExplode(value){product.setExplode(Number(value)/100);document.getElementById('explode').value=String(value);document.getElementById('explode-value').textContent=`${value}%`;}
function frame(){
  const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  const p=presets[view];const pos=new THREE.Vector3(...p.camera),target=new THREE.Vector3(...p.target);
  if(product.getDoor()>0&&!cart.visible)pos.sub(target).multiplyScalar(1.22).add(target);
  if(w/h<1.1)pos.sub(target).multiplyScalar(1.4).add(target);
  if(reduced){camera.position.copy(pos);controls.target.copy(target);}else transition={start:performance.now(),from:camera.position.clone(),to:pos,fromTarget:controls.target.clone(),toTarget:target};
}
function setView(v){
  view=v;const p=presets[v];cart.visible=v==='overview'||v==='wiring';product.layout(cart.visible);setExplode(v==='inside'?90:0);setDoor(v==='inside'?105:0);
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));
  document.getElementById('view-caption').textContent=p.caption;document.getElementById('detail-index').textContent=p.caption.slice(0,2);document.getElementById('detail-title').textContent=p.title;document.getElementById('detail-copy').textContent=p.copy;
  document.getElementById('specs').replaceChildren(...p.specs.map(([a,b])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=a;dd.textContent=b;row.append(dt,dd);return row;}));
  document.getElementById('scale-caption').textContent=cart.visible?'超音波機為通用情境示意':'主機盒 220 × 220 × 100 mm';frame();
}
function setState(s){lastState=s;product.setState(s);document.querySelectorAll('[data-state]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.state===s)));document.getElementById('state-note').textContent=s==='record'?'插卡示意：由電腦程式啟動錄影。讀卡機燈號不能當作錄影成功證明。':s==='saving'?'拔卡示意：先停止錄影並保存檔案，再安排上傳。':'無額外螢幕版本：等待插卡。下方狀態文字只屬於這個展示網頁。';}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.querySelectorAll('[data-state]').forEach(b=>b.addEventListener('click',()=>setState(b.dataset.state)));
document.getElementById('door-toggle').addEventListener('click',()=>{if(product.getDoor()>0){setDoor(0);}else{setExplode(0);setDoor(105);}frame();});
document.getElementById('explode').addEventListener('input',e=>setExplode(e.target.value));document.getElementById('reset').addEventListener('click',frame);
controls.addEventListener('start',()=>transition=null);
async function exportModel(fullScene=true){
  const prev=product.getExplode(),prevDoor=product.getDoor(),wasMounted=cart.visible;
  product.layout(fullScene);product.setExplode(0);product.setDoor(0);product.root.updateMatrixWorld(true);cart.updateMatrixWorld(true);
  const clone=new THREE.Group();clone.name=fullScene?'ForHer V3.1 - ultrasound and recorder scene':'ForHer V3.1 - recorder box and reader';
  clone.add(product.root.clone(true));if(fullScene){const context=cart.clone(true);context.visible=true;clone.add(context);}
  clone.scale.setScalar(.001);clone.updateMatrixWorld(true);product.layout(wasMounted);product.setExplode(prev);product.setDoor(prevDoor);
  return new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true,maxTextureSize:1024});
}
document.getElementById('download').addEventListener('click',async()=>{const button=document.getElementById('download');button.disabled=true;button.textContent='正在準備模型…';try{const data=await exportModel(),blob=new Blob([data],{type:'model/gltf-binary'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='forher-recorder-v3-compact.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}catch(e){console.error(e);document.getElementById('state-note').textContent='模型下載失敗，請重新整理後再試。';}finally{button.disabled=false;button.innerHTML='下載完整場景 <span>↓ GLB</span>';}});
new ResizeObserver(frame).observe(stage);document.getElementById('loading').hidden=true;setView('overview');
function animate(time){requestAnimationFrame(animate);if(transition){const f=Math.min(1,(time-transition.start)/650),t=1-Math.pow(1-f,3);camera.position.lerpVectors(transition.from,transition.to,t);controls.target.lerpVectors(transition.fromTarget,transition.toTarget,t);if(f===1)transition=null;}controls.update();updateHotspots();renderer.render(scene,camera);}requestAnimationFrame(animate);
// Local QA and source portability: no backend, accounts or patient data are used.
window.recorderDesign={setView,setState,setExplode,setDoor,exportModel,renderer,scene,product,get view(){return view;},get state(){return lastState;}};
} catch(error){console.error(error);document.getElementById('loading').hidden=true;document.getElementById('error').hidden=false;}
