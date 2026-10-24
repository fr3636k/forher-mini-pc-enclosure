import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { buildProducts, buildCart } from "./model.js";
import { buildSizeView } from "./size-view.js";
import { buildPlanningView,buildExternalIO } from "./equipment-view.js";

const stage = document.getElementById("stage");
try {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, window.innerWidth < 750 ? 1.25 : 1.5),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.domElement.setAttribute(
    "aria-label",
    "超音波機、單一主機木盒與 USB 讀卡機的 3D 模型",
  );
  renderer.domElement.setAttribute("role", "img");
  stage.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f1edf5");
  const camera = new THREE.PerspectiveCamera(34, 1, 1, 12000);
  camera.position.set(750, 540, 860);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 80, 20);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.minDistance = 220;
  controls.maxDistance = 4000;
  controls.maxPolarAngle = Math.PI * 0.49;
  scene.add(new THREE.HemisphereLight("#fff9e9", "#a3aca0", 2.25));
  const key = new THREE.DirectionalLight("#fff1d6", 3.2);
  key.position.set(-450, 900, 650);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -900;
  key.shadow.camera.right = 900;
  key.shadow.camera.top = 1200;
  key.shadow.camera.bottom = -800;
  key.shadow.camera.near = 10;
  key.shadow.camera.far = 3000;
  key.shadow.normalBias = 1;
  key.shadow.bias = -0.0002;
  key.shadow.radius = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight("#e0eaf0", 1.65);
  fill.position.set(500, 400, -450);
  scene.add(fill);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.ShadowMaterial({ color: "#5c6755", opacity: 0.16 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -6;
  ground.receiveShadow = true;
  scene.add(ground);
  const product = buildProducts();
  scene.add(product.root);
  const sizeView = buildSizeView();
  scene.add(sizeView);
  const cart = buildCart();
  cart.visible = false;
  scene.add(cart);
  const planning=buildPlanningView(product,cart);scene.add(planning.root);
  const externalIO=buildExternalIO();scene.add(externalIO.root);
  let planningMode="internal",overviewRoute="all";
  let view = "overview",
    transition = null,
    lastState = "ready";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderRequest = 0,
    stageVisible = true;
  function requestRender() {
    if (!renderRequest && stageVisible && !document.hidden)
      renderRequest = requestAnimationFrame(animate);
  }
  function invalidateGeometry() {
    renderer.shadowMap.needsUpdate = true;
    requestRender();
  }
  const presets = {
    overview: {
      camera: [-1938, 1504, 2248],
      target: [-120, 659, 0],
      caption: "01 / 配置示意",
      title: "木盒裝在超音波機左側",
      copy: "木盒掛左側，右側給病床。讀卡機放在操作面板左側。",
      specs: [
        ["木盒外尺寸", "220 × 220 × 100 mm"],
        ["主機基準", "124 × 124 × 53.7 mm"],
        ["操作", "插卡錄影・拔卡存檔"],
      ],
    },
    box: {
      camera: [560, 340, 650],
      target: [90, 50, 45],
      caption: "02 / 前門維修",
      title: "開門即可操作電源",
      copy: "左鉸鏈、右把手、磁吸關門。讀卡機移到右前方，與支撐木條錯開。",
      specs: [
        ["門片", "198 × 78 × 9 mm"],
        ["門縫", "四邊各 2 mm"],
        ["板材", "9 mm 夾板"],
      ],
    },
    inside: {
      camera: [650, 480, 800],
      target: [0, 70, 0],
      caption: "03 / 六片木板爆炸圖",
      title: "六片矩形板，直切組裝",
      copy: "選取下方板件，可查看形狀與開孔位置。所有大圓孔均為 Ø45 mm，以同一支孔鋸加工。",
      specs: [
        ["板件", "上、下、左、右、後、前門"],
        ["組合", "平接＋內側木條固定"],
        ["拆解", "滑桿控制分離程度"],
      ],
    },
    size: {
      camera: [380,270,440],target: [0,35,0],caption: "04 / 主機尺寸",
      title: "主機本體放得下",
      copy: "深色為驗證主機，紫框為木盒內部空間。尺寸皆為寬 × 深 × 高。",
      specs: [
        ["最小參考", "約 7 × 7 × 4.5 cm"],
        ["平均參考", "約 13 × 13 × 5 cm"],
        ["最大參考", "約 18 × 18 × 6 cm"],
      ],
    },
  };
  const planningPresets={
    internal:{camera:[450,350,520],target:[0,45,0],caption:"04 / 盒內設備",title:"主機與擷取卡直接放入",copy:"設備放在防滑墊上；移除上蓋與前門，查看內部空間。",specs:[["小主機","124 × 124 × 53.7 mm"],["擷取卡","45 × 90 × 20 mm 示意"],["變壓器","盒外獨立托座"]],detail:'<b>盒內配置</b><p>主機與擷取卡直接放置，不加束帶。底部鋪防滑墊，接頭留餘線，保留原廠風口。</p><small>防滑墊不等於鎖固；推車移動時，須實測設備是否滑動。設備尺寸依實物確認。</small>'},
    size:{...presets.size,caption:"04 / 主機尺寸",detail:''},
    mount:{camera:[-1650,1350,600],target:[-270,760,-215],caption:"04 / 掛鉤與支撐",title:"木盒掛在後方把手左側",copy:"以操作面板正面為準：木盒在後方把手的左側，兩個掛鉤跨住把手左側段。",specs:[["上方","雙 J 掛鉤＋防脫螺栓"],["下方","支撐木條＋雙橡膠墊"],["木條長度","依掛好後的機身間距裁切"]],detail:'<b>為什麼要加木條？</b><p>木盒位於把手左邊外側，兩個上鉤跨在把手左側段。下方短支撐木條靠住機身左側，末端加軟墊止擺。</p><small>照片無法確認把手承重或外殼強度。下方須頂在確認可承壓的位置，避開風口、接頭與薄蓋板；不可靠硬木直接頂壓。尺寸仍為示意。</small>'}
  };
  const routeBase={camera:[-2300,1450,1600],target:[-180,670,-120],caption:"01 / 線路檢視"};
  const routePresets={
    all:{...routeBase,title:"三條線，各自看清楚",copy:"選擇單一線路，查看起點、穿線孔與主機接頭；木盒自動透明。",specs:[["影像・藍色","HDMI → 擷取卡 → USB"],["讀卡・青色","讀卡機 → 主機 USB"],["電源・橙色","插座 → 變壓器 → DC"]],detail:'<b>三條線分開辨識</b><p>影像線包含擷取卡轉出的 USB，整段同為藍色。讀卡線為青色；電源線為橙色。</p><small>三條線由木盒後板圓孔入盒，右側孔保留備用。孔位固定，實際接頭位置依主機調整。</small>'},
    video:{...routeBase,camera:[-1600,1150,-1350],target:[-350,780,-230],title:"影像線・藍色",copy:"超音波 HDMI 輸出 → 既有擷取卡 → 小主機 USB。",specs:[["起點","超音波 HDMI OUT"],["中間","擷取卡 HDMI IN → USB"],["終點","主機 USB 影像來源"]],detail:'<b>沿用原擷取概念</b><p>HDMI 經後孔入盒，接擷取卡；擷取卡再以 USB 接主機。兩段都以藍色表示同一條影像路徑。</p><small>主機 HDMI 通常是輸出，不能直接收影像；既有擷取卡的 Windows 相容性仍須實測。</small>'},
    reader:{...routeBase,camera:[-1700,1250,800],target:[-260,820,-110],title:"讀卡線・青色",copy:"外接讀卡機的 USB 線，沿把手後方進盒，接主機 USB。",specs:[["起點","操作面板左側讀卡機"],["入盒","木盒後板 Ø45 mm 圓孔"],["終點","主機另一個 USB 孔"]],detail:'<b>與影像線分開</b><p>讀卡機直接接主機 USB，不經 HDMI 擷取卡。插拔卡啟停錄影，由電腦上的程式處理。</p><small>走線保留彎曲與維修餘量，不讓接頭承受懸吊重量。</small>'},
    power:{...routeBase,camera:[-1750,1100,-1100],target:[-320,590,-320],title:"電源線・橙色",copy:"院內核可插座 → 原廠外接變壓器 → 小主機 DC 輸入。",specs:[["插座至變壓器","AC 電源線"],["變壓器位置","盒外獨立托座"],["變壓器至主機","低壓 DC 線穿後孔"]],detail:'<b>只有 DC 線進木盒</b><p>變壓器留在盒外保留散熱，低壓電源線經後孔接主機 DC 插孔。</p><small>變壓器電壓與插頭依實際主機原廠規格；插座與托座位置為示意。</small>'}
  };
  const hotspotRoot = document.getElementById("hotspots");
  const hotspots = [];
  function addHotspot(text, owner, point, views, route = null) {
    const el = document.createElement("span");
    el.className = "hotspot";
    el.textContent = text;
    hotspotRoot.appendChild(el);
    hotspots.push({
      el,
      owner,
      point: new THREE.Vector3(...point),
      projected: new THREE.Vector3(),
      views,route,
    });
  }
  addHotspot("把手左側主機盒", product.main, [0, 125, 0], ["overview"]);
  addHotspot("USB 讀卡機", product.reader, [0, 62, 0], ["overview", "box"]);
  addHotspot("超音波機（示意）", cart, [-50, 920, -90], ["overview"]);
  addHotspot("前門", product.front, [0, 72, 113], ["box"]);
  for (const [id, point] of Object.entries({
    A: [0, 110, 0],
    B: [0, 4.5, 110],
    C: [-110, 65, 0],
    D: [110, 65, 0],
    E: [0, 65, -110],
    F: [0, 65, 110],
  }))
    addHotspot(
      id +
        " " +
        { A: "上板", B: "底板", C: "左板", D: "右板", E: "後板", F: "前門" }[
          id
        ],
      product.boards[id],
      point,
      ["inside"],
    );
  addHotspot("寬 14 cm",sizeView,[0,4,101],["plan-size"]);
  addHotspot("深 14 cm",sizeView,[103,4,0],["plan-size"]);
  addHotspot("高 6 cm",sizeView,[-100,45,65],["plan-size"]);
  addHotspot("盒內 20.2 × 20.2 × 8.2 cm",sizeView,[0,108,-55],["plan-size"]);
  addHotspot("小主機",planning.internal,[-42,85,-20],["plan-internal"]);
  addHotspot("沿用的擷取卡",planning.internal,[67,52,15],["plan-internal"]);
  addHotspot("防滑墊，直接放置",planning.internal,[-78,42,90],["plan-internal"]);
  addHotspot("上方雙 J 掛鉤",planning.hook,[-335,850,-235],["plan-mount"]);
  addHotspot("向後突出的把手",planning.hook,[-150,925,-337],["plan-mount"]);
  addHotspot("下方支撐木條＋軟墊",planning.hook,[-285,700,-180],["plan-mount"]);
  addHotspot("院內核可插座",planning.io,[-760,680,-370],["plan-io"],"power");
  addHotspot("原廠變壓器・盒外固定",planning.io,[-185,475,-245],["plan-io"],"power");
  addHotspot("超音波 HDMI 輸出",planning.io,[-306.9,805,-186],["plan-io"],"video");
  addHotspot("HDMI → 擷取卡 → USB 主機",planning.io,[-433,785,-260],["plan-io"],"video");
  addHotspot("外接 USB 讀卡機",planning.io,[-150,990,80],["plan-io"],"reader");
  function updateHotspots() {
    const enabled = document.getElementById("labels").checked;
    hotspots.forEach((h) => {
      const p = h.owner.localToWorld(h.projected.copy(h.point)).project(camera);
      const visible =
        enabled &&
        h.views.includes(view === "overview" ? "plan-io" : view === "planning" ? "plan-"+planningMode : view) &&
        (!h.route || overviewRoute === "all" || overviewRoute === h.route) &&
        p.z < 1 &&
        p.z > -1 &&
        Math.abs(p.x) < 0.94 &&
        Math.abs(p.y) < 0.86;
      h.el.hidden = !visible;
      if (visible) {
        h.el.style.left = `${(p.x * 0.5 + 0.5) * stage.clientWidth}px`;
        h.el.style.top = `${(-p.y * 0.5 + 0.5) * stage.clientHeight}px`;
      }
    });
  }
  function setDoor(degrees) {
    product.setDoor(degrees);
    const b = document.getElementById("door-toggle");
    b.setAttribute("aria-pressed", String(degrees > 0));
    b.textContent = degrees > 0 ? "關門" : "開門";
    invalidateGeometry();
  }
  function setExplode(value) {
    if (Number(value) > 0) setDoor(0);
    product.setExplode(Number(value) / 100);
    product.link.visible=false;
    document.getElementById("explode").value = String(value);
    document.getElementById("explode-value").textContent = `${value}%`;
    invalidateGeometry();
  }
  function frame() {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const p = view === "planning" ? planningPresets[planningMode] : view === "overview" ? routePresets[overviewRoute] : presets[view];
    const pos = new THREE.Vector3(...p.camera),
      target = new THREE.Vector3(...p.target);
    if (product.getDoor() > 0 && !cart.visible)
      pos.sub(target).multiplyScalar(1.22).add(target);
    if (w / h < 1.1) pos.sub(target).multiplyScalar(1.4).add(target);
    if (reduced) {
      camera.position.copy(pos);
      controls.target.copy(target);
    } else
      transition = {
        start: performance.now(),
        from: camera.position.clone(),
        to: pos,
        fromTarget: controls.target.clone(),
        toTarget: target,
      };
    requestRender();
  }
  function setView(v) {
    view = v;
    const p = v === "planning" ? planningPresets[planningMode] : v === "overview" ? routePresets[overviewRoute] : presets[v];
    const isSize=v==='planning'&&planningMode==='size';
    const isWiring=v==='overview';
    cart.visible=v==='overview'&&!isWiring;
    sizeView.visible=isSize;
    product.root.visible=v!=='planning'&&!isWiring;
    planning.root.visible=(v==='planning'&&!isSize)||isWiring;
    planning.setMode(isWiring?'io':planningMode);planning.setRoute(overviewRoute);
    externalIO.root.visible=false;
    document.getElementById('route-controls').hidden=v!=='overview';
    document.getElementById('overview-controls').style.setProperty('--route-index',String(['all','video','reader','power'].indexOf(overviewRoute)));
    document.getElementById('planning-controls').hidden=v!=='planning';
    document.getElementById('meeting-notes').hidden=v!=='planning';
    document.getElementById('planning-details').hidden=!(isWiring||(v==='planning'&&!isSize));
    document.getElementById('planning-details').innerHTML=p.detail||'';
    stage.closest('.studio').classList.toggle('planning-mode',v==='planning'||isWiring);
    document.querySelectorAll('[data-plan]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.plan===planningMode)));
    document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===overviewRoute)));
    stage.closest('.studio').classList.toggle('size-mode',isSize);
    document.getElementById('size-fit').hidden=!isSize;
    document.getElementById('door-toggle').hidden=v==='planning'||isWiring;
    document.getElementById('explode').hidden=v==='planning'||isWiring;
    document.querySelector('.explode-label').hidden=v==='planning'||isWiring;
    product.layout(v==='overview');
    setExplode(v==='inside'?100:0);
    product.link.visible=false;
    setDoor(0);
    product.selectBoard(
      v === "inside"
        ? document.querySelector("[data-board][aria-pressed=true]")?.dataset
            .board
        : null,
    );
    document
      .querySelectorAll("[data-view]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.view === v)),
      );
    document
      .querySelector(".view-switch")
      .style.setProperty(
        "--view-index",
        String(["overview", "box", "inside", "planning"].indexOf(v)),
      );
    document.getElementById("view-caption").textContent = p.caption;
    document.getElementById("detail-index").textContent = p.caption.slice(0, 2);
    document.getElementById("detail-title").textContent = p.title;
    document.getElementById("detail-copy").textContent = p.copy;
    document.getElementById("specs").replaceChildren(
      ...p.specs.map(([a, b]) => {
        const row = document.createElement("div"),
          dt = document.createElement("dt"),
          dd = document.createElement("dd");
        dt.textContent = a;
        dd.textContent = b;
        row.append(dt, dd);
        return row;
      }),
    );
    document.getElementById("scale-caption").textContent=isWiring ? "透明木盒・藍：影像・青：讀卡・橙：電源" : isSize ? "主機本體與盒內空間對照" : v==='planning' ? "尺寸與支點位置待實機確認" : cart.visible ? "參照照片調整，實機尺寸待量測" : "主機盒 220 × 220 × 100 mm";
    frame();
  }
  function setState(s) {
    lastState = s;
    product.setState(s);
    invalidateGeometry();
  }
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
  document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{planningMode=b.dataset.plan;setView('planning');}));
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{overviewRoute=b.dataset.route;setView('overview');}));
  const routeButtons=[...document.querySelectorAll('[data-route]')];
  document.getElementById('overview-controls').addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    const i=routeButtons.indexOf(document.activeElement);if(i<0)return;
    const n=e.key==='ArrowRight'?(i+1)%4:e.key==='ArrowLeft'?(i+3)%4:e.key==='Home'?0:e.key==='End'?3:-1;
    if(n<0)return;e.preventDefault();routeButtons[n].focus();overviewRoute=routeButtons[n].dataset.route;setView('overview');
  });
  const viewButtons = [...document.querySelectorAll("[data-view]")];
  document.querySelector(".view-switch").addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const current = viewButtons.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (e.key === "ArrowRight") next = (current + 1) % viewButtons.length;
    else if (e.key === "ArrowLeft") next = (current + viewButtons.length - 1) % viewButtons.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = viewButtons.length - 1;
    else return;
    e.preventDefault();
    viewButtons[next].focus();
    setView(viewButtons[next].dataset.view);
  });

  document.getElementById("door-toggle").addEventListener("click", () => {
    if (view !== "box") {
      setView("box");
      setDoor(105);
    } else if (product.getDoor() > 0) {
      setDoor(0);
    } else {
      setExplode(0);
      setDoor(105);
    }
    frame();
  });
  document.getElementById("explode").addEventListener("input", (e) => {
    const value = e.target.value;
    if (view !== "inside") setView("inside");
    setExplode(value);
  });
  document.getElementById("reset").addEventListener("click", frame);
  controls.addEventListener("start", () => {
    transition = null;
    requestRender();
  });
  controls.addEventListener("change", requestRender);
  document.getElementById("labels").addEventListener("change", requestRender);
  async function exportModel(fullScene = true) {
    const { GLTFExporter } = await import("./vendor/GLTFExporter.js");
    const prev = product.getExplode(),
      prevDoor = product.getDoor(),
      wasMounted = cart.visible;
    product.layout(fullScene);
    product.setExplode(0);
    product.setDoor(0);
    product.link.visible=false;
    product.root.updateMatrixWorld(true);
    cart.updateMatrixWorld(true);
    const clone = new THREE.Group();
    clone.name = fullScene
      ? "ForHer V4 - ultrasound and recorder scene"
      : "ForHer V4 - recorder box and reader";
    const productsClone=product.root.clone(true);productsClone.visible=true;clone.add(productsClone);
    if (fullScene) {
      const context = cart.clone(true);
      context.visible = true;
      clone.add(context);
      const ioClone=externalIO.root.clone(true);ioClone.visible=true;clone.add(ioClone);
    }
    clone.scale.setScalar(0.001);
    clone.updateMatrixWorld(true);
    product.layout(wasMounted);
    product.setExplode(prev);
    product.setDoor(prevDoor);
    return new GLTFExporter().parseAsync(clone, {
      binary: true,
      onlyVisible: true,
      maxTextureSize: 1024,
    });
  }
  // The complete scene is pre-exported so downloads do not rebuild textures on the visitor's device.
  document.getElementById("download").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = "./models/forher-recorder-v8-handle-left.glb";
    a.download = "forher-recorder-v8-handle-left.glb";
    a.click();
  });
  new ResizeObserver(frame).observe(stage);
  document.getElementById("loading").hidden = true;
  setView("overview");
  function animate(time) {
    renderRequest = 0;
    if (!stageVisible || document.hidden) return;
    if (transition) {
      const f = Math.min(1, (time - transition.start) / 650),
        t = 1 - Math.pow(1 - f, 3);
      camera.position.lerpVectors(transition.from, transition.to, t);
      controls.target.lerpVectors(
        transition.fromTarget,
        transition.toTarget,
        t,
      );
      if (f === 1) transition = null;
    }
    const moving = controls.update();
    updateHotspots();
    renderer.render(scene, camera);
    if (transition || moving) requestRender();
  }
  new IntersectionObserver(
    (entries) => {
      stageVisible = entries[0].isIntersecting;
      if (stageVisible) requestRender();
      else if (renderRequest) {
        cancelAnimationFrame(renderRequest);
        renderRequest = 0;
      }
    },
    { rootMargin: "100px" },
  ).observe(stage);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && renderRequest) {
      cancelAnimationFrame(renderRequest);
      renderRequest = 0;
    } else requestRender();
  });
  requestRender();
  // Local QA and source portability: no backend, accounts or patient data are used.
  window.recorderDesign = {
    setView,
    setState,
    setExplode,
    setDoor,
    exportModel,
    renderer,
    scene,
    product,
    get view() {
      return view;
    },
    get state() {
      return lastState;
    },
  };
} catch (error) {
  console.error(error);
  document.getElementById("loading").hidden = true;
  document.getElementById("error").hidden = false;
}
