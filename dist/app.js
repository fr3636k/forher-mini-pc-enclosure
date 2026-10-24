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
  let planningMode="internal",planningRoute="all";
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
      copy: "木盒掛左側，右側給病床。讀卡機固定在左側平台。",
      specs: [
        ["木盒外尺寸", "220 × 220 × 100 mm"],
        ["主機基準", "124 × 124 × 53.7 mm"],
        ["操作", "插卡錄影・拔卡存檔"],
      ],
    },
    box: {
      camera: [470, 320, 570],
      target: [45, 52, 0],
      caption: "02 / 前門維修",
      title: "開門即可操作電源",
      copy: "左鉸鏈、右把手、磁吸關門；上蓋以螺絲固定，可另行拆下維修。",
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
    internal:{camera:[450,350,520],target:[0,45,0],caption:"05 / 盒內設備",title:"主機與擷取卡收在盒內",copy:"上蓋與前門省略，方便看清設備與固定方式。",specs:[["小主機","124 × 124 × 53.7 mm"],["既有擷取卡","45 × 90 × 20 mm 示意"],["變壓器","外置，不佔盒內空間"]],detail:'<b>如何固定</b><p>主機：可調限位座＋束帶。<br>擷取卡：小托架＋束帶。<br>線身：固定座束線，接頭留餘線。</p><small>依原廠風口調整束帶位置；變壓器與擷取卡尺寸待實物確認。</small>'},
    mount:{camera:[480,300,510],target:[55,90,0],caption:"05 / 右側掛鉤",title:"盒體右側，掛住後方把手",copy:"兩只金屬 J 掛鉤跨在推車後方把手的側段，保留中間推握區。",specs:[["承掛","右側雙 J 掛鉤"],["盒壁固定","穿板螺栓＋內側背板"],["防鬆動","防脫束帶＋止擺軟墊"]],detail:'<b>暫定固定方式</b><p>金屬掛鉤承重；內側背板分散拉力。束帶防止向上脫落，軟墊減少晃動。</p><small>把手暫以 Ø24 mm 示意。實際把手外形、承重及掛鉤開口須現場確認。</small>'},
    io:{camera:[-1910,1390,-2260],target:[-270,655,-180],caption:"05 / 對外接線",title:"原擷取卡，改接小主機",copy:"供電與影像分開走線，保留原本 HDMI 擷取的概念。",specs:[["電源・橙色","插座 → 變壓器 → 主機 DC"],["影像・藍色","超音波 HDMI → 擷取卡"],["USB・青色","擷取卡／讀卡機 → 主機"]],detail:'<b>平板換成電腦即可？</b><p>原理可以沿用。擷取卡的 USB 接電腦，並以錄影程式選取其影像來源；不是接主機 HDMI 輸出孔。</p><small>先確認既有卡的 Windows 相容性與 USB 帶寬，再接實機測錄。電源由院內核可插座供應，不從超音波訊號孔取電。</small>'}
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
  addHotspot("左側主機盒", product.main, [0, 125, 0], ["overview"]);
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
  addHotspot("寬 14 cm",sizeView,[0,4,101],["size"]);
  addHotspot("深 14 cm",sizeView,[103,4,0],["size"]);
  addHotspot("高 6 cm",sizeView,[-100,45,65],["size"]);
  addHotspot("盒內 20.2 × 20.2 × 8.2 cm",sizeView,[0,108,-55],["size"]);
  addHotspot("小主機",planning.internal,[-42,85,-20],["plan-internal"]);
  addHotspot("沿用的擷取卡",planning.internal,[67,52,15],["plan-internal"]);
  addHotspot("限位座＋束帶",planning.internal,[-78,42,90],["plan-internal"]);
  addHotspot("盒體右側雙 J 掛鉤",planning.hook,[155,207,58],["plan-mount"]);
  addHotspot("推車後方把手側段",planning.hook,[143,180,-125],["plan-mount"]);
  addHotspot("止擺軟墊",planning.hook,[127,30,65],["plan-mount"]);
  addHotspot("院內核可插座",planning.io,[-760,680,-370],["plan-io"],"power");
  addHotspot("原廠變壓器・盒外固定",planning.io,[-185,475,-245],["plan-io"],"power");
  addHotspot("超音波 HDMI 輸出",planning.io,[-680,950,-186],["plan-io"],"video");
  addHotspot("HDMI → 擷取卡 → USB 主機",planning.io,[-430,740,-170],["plan-io"],"video");
  addHotspot("外接 USB 讀卡機",planning.io,[-271.25,935,147.25],["plan-io"],"allOnly");
  function updateHotspots() {
    const enabled = document.getElementById("labels").checked;
    hotspots.forEach((h) => {
      const p = h.owner.localToWorld(h.projected.copy(h.point)).project(camera);
      const visible =
        enabled &&
        h.views.includes(view === "planning" ? "plan-"+planningMode : view) &&
        (!h.route || planningRoute === "all" || planningRoute === h.route) &&
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
    const p = view === "planning" ? planningPresets[planningMode] : presets[view];
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
    const p = v === "planning" ? planningPresets[planningMode] : presets[v];
    cart.visible = v === "overview";
    sizeView.visible = v === "size";
    product.root.visible = v !== "size" && v !== "planning";
    planning.root.visible = v === "planning";planning.setMode(planningMode);planning.setRoute(planningRoute);
    externalIO.root.visible = v === "overview";
    document.getElementById('planning-controls').hidden = v !== 'planning';
    document.getElementById('meeting-notes').hidden = v !== 'planning';
    document.getElementById('planning-details').hidden = v !== 'planning';
    document.getElementById('planning-details').innerHTML = v === 'planning' ? p.detail : '';
    document.getElementById('route-filters').hidden = v !== 'planning' || planningMode !== 'io';
    stage.closest('.studio').classList.toggle('planning-mode',v === 'planning');
    document.querySelectorAll('[data-plan]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.plan===planningMode)));
    document.querySelectorAll('[data-route]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.route===planningRoute)));
    stage.closest('.studio').classList.toggle('size-mode',v === 'size');
    document.getElementById('size-fit').hidden = v !== 'size';
    document.getElementById('door-toggle').hidden = v === 'size' || v === 'planning';
    document.getElementById('explode').hidden = v === 'size' || v === 'planning';
    document.querySelector('.explode-label').hidden = v === 'size' || v === 'planning';
    product.layout(cart.visible);
    if(cart.visible)product.link.visible=false;
    setExplode(v === "inside" ? 100 : 0);
    if(cart.visible)product.link.visible=false;
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
        String(["overview", "box", "inside", "size", "planning"].indexOf(v)),
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
    document.getElementById("scale-caption").textContent = cart.visible
      ? "超音波機為通用情境示意"
      : view === "planning" ? (planningMode === "io" ? "橙：電源・藍：HDMI・青：USB" : "固定方式為配置示意") : view === "size" ? "驗證主機上限 14 × 14 × 6 cm" : "主機盒 220 × 220 × 100 mm";
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
  document.querySelectorAll('[data-plan]').forEach(b=>b.addEventListener('click',()=>{planningMode=b.dataset.plan;planningRoute='all';setView('planning');}));
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{planningRoute=b.dataset.route;planning.setRoute(planningRoute);document.querySelectorAll('[data-route]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.route===planningRoute)));invalidateGeometry();}));
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
    a.href = "./models/forher-recorder-v5-equipment.glb";
    a.download = "forher-recorder-v5-equipment.glb";
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
