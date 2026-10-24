import * as THREE from "three";
import { RoundedBoxGeometry } from "./vendor/RoundedBoxGeometry.js";
import { buildFixings, buildRearHandle } from "./equipment-view.js";

// Geometry uses millimetres. The GLB exporter converts the product root to metres.
export const dimensions = {
  main: [220, 100, 220],
  reader: [116, 24, 88],
  version: "5.0 equipment and rear-handle mounting",
};
const mat = (color, roughness = 0.55, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const graphite = mat("#303939", 0.48),
  black = mat("#181f20", 0.45),
  rubber = mat("#27302d", 0.9),
  steel = mat("#a2aaa5", 0.28, 0.8),
  green = mat("#2f6f5e", 0.8),
  white = mat("#e6e9e4", 0.55);

function woodTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const x = c.getContext("2d");
  x.fillStyle = "#caa375";
  x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 630; i++) {
    const v = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const a = 0.025 + Math.abs(v) * 0.08;
    x.strokeStyle = `rgba(${v > 0 ? 93 : 245},${v > 0 ? 62 : 209},${v > 0 ? 32 : 160},${a})`;
    x.lineWidth = 0.4 + Math.abs(v) * 1.8;
    x.beginPath();
    const px = i * 1.75;
    for (let y = 0; y <= 1024; y += 12) {
      const k =
        px + 5 * Math.sin(y * 0.005 + i * 0.12) + 2 * Math.sin(y * 0.013 + i);
      y === 0 ? x.moveTo(k, y) : x.lineTo(k, y);
    }
    x.stroke();
  }
  for (let i = 0; i < 25; i++) {
    x.strokeStyle = "rgba(99,67,35,.035)";
    x.lineWidth = 2;
    x.beginPath();
    x.ellipse(
      100 + i * 37,
      470 + Math.sin(i) * 180,
      4 + (i % 5),
      170 + i * 3,
      0.08,
      0,
      Math.PI * 2,
    );
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
const oak = new THREE.MeshStandardMaterial({
  map: woodTexture(),
  roughness: 0.67,
  color: "#fff2dd",
});
const edgeOak = mat("#c9a273", 0.72);
function group(parent, name) {
  const g = new THREE.Group();
  g.name = name;
  parent?.add(g);
  return g;
}
function block(parent, name, w, h, d, x, y, z, material = oak, r = 1) {
  const m = new THREE.Mesh(
    r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d),
    material,
  );
  m.name = name;
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}
function roundPath(path, x, y, w, h, r) {
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
}
function panel(parent, name, w, h, t, holes, material = oak) {
  const s = new THREE.Shape();
  roundPath(s, -w / 2, -h / 2, w, h, 1);
  holes.forEach(([x, y, hw, hh, r = 2]) => {
    const p = new THREE.Path();
    if (hw === hh && r === hw / 2) p.absarc(x, y, r, 0, Math.PI * 2, true);
    else roundPath(p, x - hw / 2, y - hh / 2, hw, hh, r);
    s.holes.push(p);
  });
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: t,
    steps: 1,
    bevelEnabled: false,
  });
  geo.translate(0, 0, -t / 2);
  const m = new THREE.Mesh(geo, material);
  m.name = name;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function screw(parent, x, y, z) {
  const g = group(parent, "Removable panel screw");
  g.position.set(x, y, z);
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(2.5, 2.5, 1.2, 16),
    steel,
  );
  m.rotation.x = Math.PI / 2;
  g.add(m);
  block(g, "Screw slot", 3, 0.55, 0.4, 0, 0, 0.8, black, 0);
  block(g, "Screw slot", 0.55, 3, 0.4, 0, 0, 0.8, black, 0);
  return g;
}
function planeText(parent, name, w, h, x, y, z, draw) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = Math.max(128, Math.round((1024 * h) / w));
  const ctx = c.getContext("2d");
  draw(ctx, c.width, c.height);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  p.position.set(x, y, z);
  p.name = name;
  parent.add(p);
  return { mesh: p, canvas: c, ctx, texture };
}
function label(parent, str, w, h, x, y, z, color = "#b6c0b3") {
  return planeText(parent, str, w, h, x, y, z, (ctx, cw, ch) => {
    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = color;
    ctx.font = `500 ${ch * 0.7}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(str, cw / 2, ch / 2);
  });
}
function cable(parent, name, points, r = 2, color = "#3a443e") {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 40, r, 8, false),
    mat(color, 0.8),
  );
  m.name = name;
  m.castShadow = true;
  parent.add(m);
  return m;
}
function feet(parent, w, d) {
  for (const x of [-w / 2 + 15, w / 2 - 15])
    for (const z of [-d / 2 + 15, d / 2 - 15])
      block(parent, "Non-slip rubber foot", 17, 5, 17, x, -2.5, z, rubber, 2);
}

export function buildProducts() {
  const products = group(null, "ForHer ultrasound recorder concept V4");
  products.userData = {
    units: "millimetres before export",
    design: "V4 compact enclosure with independent hinged front door",
    manufacturingReady: false,
    mainEnvelopeMm: "220 x 220 x 100",
    computerEnvelopeMm: "124 x 124 x 53.7",
    plywoodMm: 9,
    cartPlatformWidthMm: 589,
    cartHeightMm: 1382,
    cartDimensionsAreAssumed: true,
  };
  const main = group(products, "Compact enclosure 220W 220D 100H mm");
  const bottom = group(main, "B Bottom 220 x 220 x 9");
  feet(bottom, 220, 220);
  block(bottom, "B bottom plywood", 220, 9, 220, 0, 4.5, 0, oak, 0);
  const lid = group(main, "A Top 220 x 220 x 9");
  block(lid, "A top plywood", 220, 9, 220, 0, 95.5, 0, oak, 0);
  const left = group(main, "C Left 220 x 82 x 9");
  const right = group(main, "D Right 220 x 82 x 9");
  for (const side of [-1, 1]) {
    const holes =
      side === 1
        ? [[70, 0, 45, 45, 22.5]]
        : [
            [-40, 0, 45, 45, 22.5],
            [40, 0, 45, 45, 22.5],
          ];
    const p = panel(
      side === 1 ? right : left,
      side === 1
        ? "D right cable hole diameter 45"
        : "C left ventilation diameter 45 x 2",
      220,
      82,
      9,
      holes,
    );
    p.rotation.y = Math.PI / 2;
    p.position.set(side * 105.5, 50, 0);
  }
  const rear = group(main, "E Rear 202 x 82 x 9");
  const back = panel(rear, "E rear cable hole diameter 45", 202, 82, 9, [
    [45, 0, 45, 45, 22.5],
  ]);
  back.position.set(0, 50, -105.5);
  const doorPivot = group(
    main,
    "Front door hinge pivot - rotate local Y to open",
  );
  doorPivot.position.set(-100, 0, 111);
  const front = group(doorPivot, "Hinged front maintenance door 198 x 78 mm");
  front.position.set(100, 0, -111);
  block(
    front,
    "Front plywood door - 2mm edge clearance",
    198,
    78,
    9,
    0,
    50,
    105.5,
    oak,
    0,
  );
  block(
    left,
    "Hinge mounting backing strip",
    8,
    72,
    8,
    -97,
    50,
    95,
    edgeOak,
    0.5,
  );
  for (const y of [28, 72]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 14, 16), steel);
    pin.name = "Fixed vertical hinge pin";
    pin.position.set(-100, y, 111);
    left.add(pin);
    block(left, "Fixed hinge leaf", 7, 13, 1.2, -105, y, 110.8, steel, 0.3);
    block(front, "Moving hinge leaf", 7, 13, 1.2, -95, y, 110.8, steel, 0.3);
    screw(front, -95, y, 112);
  }
  block(front, "Front door handle", 6, 23, 8, 78, 50, 115, graphite, 1.5);
  block(right, "Magnetic catch backing", 7, 12, 8, 94, 50, 96, graphite, 1);
  block(
    front,
    "Magnetic catch strike plate",
    7,
    12,
    1,
    93,
    50,
    100.5,
    steel,
    0.3,
  );
  label(front, "FORHER", 72, 11, 0, 56, 110.2, "#4b543e");
  label(front, "ULTRASOUND RECORDER", 79, 5, 0, 39, 110.2, "#6d7158");
  const equipment = group(main, "Internal equipment");
  for (const x of [-94, 94])
    for (const z of [-93, 93])
      block(
        equipment,
        "Internal fixing cleat 10 x 10 x 82",
        10,
        82,
        10,
        x,
        50,
        z,
        edgeOak,
        0.5,
      );

  const pc = group(
    equipment,
    "MSI Cubi N ADL size reference 124 x 124 x 53.7 mm - form illustrative",
  );
  block(
    pc,
    "Mini PC chassis 124x124x53.7",
    124,
    53.7,
    124,
    -29,
    42.85,
    24,
    graphite,
    3,
  );
  block(pc, "PC top trim", 120, 1, 120, -29, 70.2, 24, black, 1.5);
  for (let i = 0; i < 9; i++)
    block(
      pc,
      "PC vent grille illustrative",
      1.6,
      0.6,
      75,
      -73 + i * 11,
      71,
      19,
      black,
      0.3,
    );
  const power = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 4, 1.5, 24),
    steel,
  );
  power.rotation.x = Math.PI / 2;
  power.position.set(18, 42, 87);
  pc.add(power);
  for (const x of [-64, -43]) {
    block(pc, "USB socket illustrative", 13, 6, 2, x, 43, 87, black, 0.5);
    block(pc, "USB socket insert", 9, 2, 2.2, x, 43, 88, mat("#3c7c94"), 0);
  }
  for (const x of [-94, 36])
    block(equipment, "Adjustable stop", 4, 12, 134, x, 18, 24, steel, 0.5);
  const capture = group(
    equipment,
    "Small USB capture placeholder 45W 90D 20H mm",
  );
  block(
    capture,
    "Capture device - size assumption",
    45,
    20,
    90,
    67,
    25,
    15,
    black,
    2,
  );
  const ct = label(capture, "CAPTURE", 32, 6, 67, 35.5, 15, "#afb9ad");
  ct.mesh.rotation.x = -Math.PI / 2;
  block(
    capture,
    "HDMI connector faces rear",
    18,
    8,
    12,
    67,
    25,
    -36,
    steel,
    0.7,
  );
  cable(
    equipment,
    "Internal USB service loop",
    [
      [67, 25, 62],
      [90, 24, 62],
      [91, 22, -65],
      [-5, 30, -74],
      [-15, 40, -40],
    ],
    1.8,
  );
  const {mounting,restraints}=buildFixings();main.add(mounting);equipment.add(restraints);

  const reader = group(products, "Removable health card reader and cradle");
  block(reader, "Reader cradle", 116, 5, 88, 0, 2.5, -9, graphite, 3);
  block(
    reader,
    "Health card reader placeholder",
    100,
    19,
    76,
    0,
    14,
    -9,
    black,
    4,
  );
  block(reader, "Card insertion slot", 61, 2, 1, 0, 13, 29.5, rubber, 0.4);
  for (const x of [-55, 55])
    block(reader, "Cradle fixing stop", 5, 10, 40, x, 6, -18, graphite, 1);
  const rt = label(reader, "CARD READER", 61, 8, 0, 24, -16, "#b8c6b8");
  rt.mesh.rotation.x = -Math.PI / 2;
  const card = group(reader, "Demo health card (fictional)");
  block(
    card,
    "Demo card body",
    54,
    0.9,
    70,
    0,
    13,
    60,
    mat("#d8e6d8", 0.65),
    1,
  );
  const cardFace = planeText(
    card,
    "Fictional demo card",
    53,
    69,
    0,
    13.6,
    60,
    (ctx, w, h) => {
      ctx.fillStyle = "#e4eadd";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#77977e";
      ctx.fillRect(0, 0, w, h * 0.16);
      ctx.fillStyle = "#fff";
      ctx.font = `${h * 0.075}px sans-serif`;
      ctx.fillText("DEMO CARD", w * 0.08, h * 0.115);
      ctx.fillStyle = "#b5a36c";
      ctx.fillRect(w * 0.12, h * 0.28, w * 0.25, h * 0.2);
      ctx.strokeStyle = "#867744";
      ctx.lineWidth = 4;
      ctx.strokeRect(w * 0.12, h * 0.28, w * 0.25, h * 0.2);
      ctx.beginPath();
      ctx.moveTo(w * 0.24, h * 0.28);
      ctx.lineTo(w * 0.24, h * 0.48);
      ctx.moveTo(w * 0.12, h * 0.38);
      ctx.lineTo(w * 0.37, h * 0.38);
      ctx.stroke();
      ctx.fillStyle = "#425c4a";
      ctx.font = `${h * 0.075}px sans-serif`;
      ctx.fillText("僅供模型展示", w * 0.1, h * 0.66);
      ctx.font = `${h * 0.065}px sans-serif`;
      ctx.fillText("A*****6789", w * 0.1, h * 0.8);
    },
  );
  cardFace.mesh.rotation.x = -Math.PI / 2;
  // HDMI is received by a capture device, not the PC's HDMI output.
  cable(
    equipment,
    "HDMI internal service loop",
    [
      [67, 25, -36],
      [64, 40, -70],
      [45, 50, -110],
    ],
    2.6,
    "#455b65",
  );
  const link = group(products, "External connection cables");
  let mounted = false,
    explodeValue = 0,
    doorAngle = 0,
    state = "ready";
  function drawLink() {
    link.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
    link.clear();
    if (mounted) {
      cable(
        link,
        "USB - card reader to computer",
        [
          [-231.25, 896.5, 99.25],
          [-300, 890, -140],
          [-425, 870, -245],
          [-470, 630, -230],
          [-420, 480, -120],
        ],
        2.4,
      );
      cable(
        link,
        "HDMI - ultrasound output to capture input",
        [
          [-306.9, 759.5, -186],
          [-387, 730, -257],
          [-435, 550, -245],
          [-410, 480, -120],
        ],
        3,
        "#455b65",
      );
    } else {
      cable(
        link,
        "USB - card reader to computer",
        [
          [250, 13, 22],
          [282, 10, -20],
          [225, 5, -155],
          [40, 5, -155],
          [35, 50, -110],
        ],
        2.4,
      );
      cable(
        link,
        "HDMI input to enclosure",
        [
          [45, 50, -110],
          [98, 25, -148],
          [150, 5, -165],
        ],
        3,
        "#455b65",
      );
    }
  }
  function setExplode(v) {
    explodeValue = v;
    lid.position.y = v * 130;
    bottom.position.y = -v * 65;
    left.position.x = -v * 135;
    right.position.x = v * 135;
    rear.position.z = -v * 135;
    doorPivot.position.z = 111 + v * 160;
    mounting.visible = v === 0;
    equipment.visible = v === 0;
    reader.visible = v === 0;
    link.visible = v === 0;
  }
  const boards = { A: lid, B: bottom, C: left, D: right, E: rear, F: front };
  function selectBoard(id) {
    Object.entries(boards).forEach(([key, g]) =>
      g.traverse((o) => {
        if (!o.isMesh || !o.material?.isMeshStandardMaterial) return;
        if (!o.userData.originalMaterial)
          o.userData.originalMaterial = o.material;
        if (o.material !== o.userData.originalMaterial) o.material.dispose();
        o.material = o.userData.originalMaterial;
        if (key === id) {
          o.material = o.material.clone();
          o.material.emissive.set("#7a2cb0");
          o.material.emissiveIntensity = 0.22;
        }
      }),
    );
  }
  function setDoor(degrees) {
    doorAngle = degrees;
    doorPivot.rotation.y = -THREE.MathUtils.degToRad(degrees);
  }
  function setState(v) {
    state = v;
    card.visible = v === "record";
  }
  function layout(withCart = false) {
    mounted = withCart;
    main.position.set(
      withCart ? -455 : 0,
      withCart ? 650 : 0,
      withCart ? -170 : 0,
    );
    reader.position.set(
      withCart ? -271.25 : 210,
      withCart ? 883.5 : 0,
      withCart ? 147.25 : 70,
    );
    drawLink();
  }
  setState("ready");
  layout();
  return {
    boards,
    selectBoard,
    root: products,
    main,
    reader,
    card,
    lid,
    front,
    doorPivot,
    capture,
    link,
    setExplode,
    setDoor,
    setState,
    layout,
    getExplode: () => explodeValue,
    getDoor: () => doorAngle,
    getState: () => state,
  };
}

export function buildCart() {
  const cart = group(
    null,
    "Ultrasound cart context only - not supplied equipment",
  );
  const light = mat("#dce0d8", 0.6),
    dark = mat("#586660", 0.6);
  block(cart, "Cart platform", 380, 22, 355, -50, 559, 0, light, 10);
  block(cart, "Cart equipment body", 270, 340, 220, -50, 352, -25, light, 12);
  block(cart, "Front equipment recess", 220, 255, 5, -50, 355, 87, dark, 8);
  block(cart, "Lower cart base", 360, 35, 300, -50, 111, 0, light, 12);
  for (const x of [-185, 85])
    for (const z of [-110, 110]) {
      block(cart, "Wheel fork", 15, 38, 20, x, 67, z, steel, 2);
      const wh = new THREE.Mesh(
        new THREE.CylinderGeometry(30, 30, 18, 24),
        rubber,
      );
      wh.rotation.z = Math.PI / 2;
      wh.position.set(x, 37, z);
      wh.castShadow = true;
      cart.add(wh);
    }
  block(cart, "Display stand", 26, 125, 26, -50, 640, -105, dark, 3);
  const monitor = group(cart, "Existing ultrasound monitor context");
  monitor.position.set(-50, 776, -90);
  monitor.rotation.x = -0.06;
  block(monitor, "Existing screen housing", 350, 230, 20, 0, 0, 0, black, 8);
  planeText(
    monitor,
    "Ultrasound screen schematic",
    323,
    200,
    0,
    4,
    11,
    (ctx, w, h) => {
      ctx.fillStyle = "#182223";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#72817b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, h * 0.18);
      ctx.lineTo(w * 0.12, h * 0.84);
      ctx.quadraticCurveTo(w * 0.5, h * 1.03, w * 0.88, h * 0.84);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = "#495952";
      ctx.fill();
      ctx.fillStyle = "#7e8c83";
      ctx.font = "26px sans-serif";
      ctx.fillText("ULTRASOUND / 示意", 30, 42);
    },
  );
  block(
    cart,
    "Approved accessory rail placeholder",
    12,
    25,
    210,
    -247,
    523,
    0,
    steel,
    2,
  );
  block(
    cart,
    "Bracket mounting backplate indicative",
    8,
    140,
    85,
    -215,
    346,
    -55,
    steel,
    2,
  );
  // Generic ultrasound console, keyboard, trackball and probe holder.
  const console = group(cart, "Ultrasound control console");
  console.position.set(-15, 579, -12);
  console.rotation.x = 0.06;
  block(console, "Control panel housing", 240, 16, 190, 0, 0, 0, light, 7);
  block(console, "Keyboard inset", 148, 2, 68, -26, 9, -14, dark, 3);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 12; col++)
      block(
        console,
        "Keyboard key",
        9,
        2,
        10,
        -91 + col * 11,
        11,
        -39 + row * 14,
        white,
        1,
      );
  block(console, "Keyboard spacebar", 60, 2, 9, -25, 11, 16, white, 1);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(13, 24, 16), dark);
  ball.position.set(77, 14, 35);
  console.add(ball);
  for (const x of [45, 77, 105])
    for (const z of [-52, -17]) {
      const k = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 9, 20), steel);
      k.position.set(x, 14, z);
      console.add(k);
    }
  for (let i = 0; i < 6; i++)
    block(console, "Function button", 13, 3, 10, -88 + i * 25, 11, 61, dark, 2);
  const probeGroup = group(cart, "Ultrasound probes and holder");
  block(probeGroup, "Probe holder", 35, 15, 125, -260, 526, -8, light, 4);
  for (const z of [-43, 32]) {
    block(probeGroup, "Probe handle", 18, 70, 21, -260, 565, z, white, 7);
    block(probeGroup, "Probe head", 33, 26, 18, -260, 611, z, dark, 6);
    cable(
      probeGroup,
      "Probe cable",
      [
        [-260, 526, z],
        [-295, 365, z + 20],
        [-270, 288, z + 5],
        [-210, 365, z],
      ],
      2.4,
    );
  }
  const hdmiPort = block(
    cart,
    "Ultrasound HDMI output placeholder",
    4,
    12,
    22,
    -198,
    490,
    -120,
    black,
    0.7,
  );
  label(cart, "ULTRASOUND", 170, 15, -50, 434, 91, "#c1cbc0");
  block(
    cart,
    "Bracket stand-off support - illustrative",
    40,
    70,
    60,
    -200,
    346,
    -55,
    steel,
    2,
  );
  const rearHandle=buildRearHandle();rearHandle.scale.setScalar(1/1.55);cart.add(rearHandle);
  cart.scale.setScalar(1.55);
  cart.userData = {
    platformWidthMm: 589,
    overallHeightMm: 1382,
    dimensionsAssumed: true,
  };
  return cart;
}
