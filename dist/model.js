import * as THREE from "three";
import { RoundedBoxGeometry } from "./vendor/RoundedBoxGeometry.js";
import { buildFixings, installation } from "./equipment-view.js";

import { buildUltrasoundCart } from "./cart-view.js";

// Geometry uses millimetres. The GLB exporter converts the product root to metres.
export const dimensions = {
  main: [220, 100, 220],
  reader: [116, 24, 88],
  version: "11.0 forward support across rear handle void",
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
  const products = group(null, "ForHer ultrasound recorder concept V11");
  products.userData = {
    units: "millimetres before export",
    design: "V11 left hinged top lid with fixed front access hole",
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
  const doorPivot = group(main, "Top lid hinge pivot - rotate local Z to open left");
  doorPivot.position.set(-112, 100, 0);
  const lid = group(doorPivot, "A Top 220 x 220 x 9");
  block(lid, "A hinged top plywood", 220, 9, 220, 112, -4.5, 0, oak, 0);
  lid.userData={hingeSide:"left above ventilation",openingDegrees:95};
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
  // Open outline: the former diameter-45 hole now continues to the upper edge.
  const notch = new THREE.Shape();
  notch.moveTo(-101,-41);notch.lineTo(101,-41);notch.lineTo(101,41);
  notch.lineTo(67.5,41);notch.lineTo(67.5,0);
  notch.absarc(45,0,22.5,0,-Math.PI,true);
  notch.lineTo(22.5,41);notch.lineTo(-101,41);notch.closePath();
  const backGeometry=new THREE.ExtrudeGeometry(notch,{depth:9,steps:1,bevelEnabled:false});backGeometry.translate(0,0,-4.5);
  const back=new THREE.Mesh(backGeometry,oak);back.name="E rear open U notch - 45 wide 63.5 deep R22.5";
  back.position.set(0,50,-105.5);back.castShadow=back.receiveShadow=true;rear.add(back);
  // Soft U edge trim stays below the lid sweep, with no crosspiece across the opening.
  cable(rear,"Soft protective edging on U notch",[[22.5,90,-105.5],[22.5,50,-105.5],[29.1,34.1,-105.5],[45,27.5,-105.5],[60.9,34.1,-105.5],[67.5,50,-105.5],[67.5,90,-105.5]],1.1,"#555a57");
  const front=group(main,"F Fixed front 202 x 82 x 9 - power access diameter 30");
  const face=panel(front,"F fixed front power access diameter 30",202,82,9,[[18,-8,30,30,15]]);
  face.position.set(0,50,105.5);
  // Two surface hinges above the left ventilation holes. No inset joinery.
  for(const z of [-70,70]){
    const pin=new THREE.Mesh(new THREE.CylinderGeometry(2,2,24,16),steel);
    pin.name="Left top hinge pin - fixed Z axis";pin.rotation.x=Math.PI/2;pin.position.set(-112,100,z);left.add(pin);
    block(left,"Fixed top hinge leaf",1.5,16,24,-110.8,92,z,steel,0.3);
    block(lid,"Moving top hinge leaf",16,1.5,24,10,0.9,z,steel,0.3);
    block(left,"Hinge screw backing block",8,12,28,-97,84,z,edgeOak,0.3);
  }
  block(lid,"Top lid pull tab",16,6,24,202,5,65,graphite,1);
  block(right,"Top lid magnetic catch",8,6,18,96,86,50,graphite,1);
  block(lid,"Top lid magnetic strike plate",8,1,18,208,-9.5,50,steel,0.3);
  label(front,"FORHER",72,11,-40,65,110.2,"#4b543e");
  label(front,"ULTRASOUND RECORDER",79,5,-40,42,110.2,"#6d7158");
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
  const {mounting,restraints,parts:fixtureParts}=buildFixings();main.add(mounting);equipment.add(restraints);

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
    front.position.z = v * 160;
    mounting.visible = true;
    fixtureParts.G.position.set(v*170,v*90,0);
    fixtureParts.H.position.set(v*170,-v*65,v*45);
    fixtureParts.I.position.set(v*240,-v*65,v*45);
    equipment.visible = v === 0;
    reader.visible = v === 0;
    link.visible = v === 0;
  }
  const boards = { A: lid, B: bottom, C: left, D: right, E: rear, F: front, ...fixtureParts };
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
    doorPivot.rotation.z = THREE.MathUtils.degToRad(Math.min(95, Math.max(0, degrees)));
  }
  function setState(v) {
    state = v;
    card.visible = v === "record";
  }
  function layout(withCart = false) {
    mounted = withCart;
    main.position.set(
      withCart ? installation.box[0] : 0,
      withCart ? installation.box[1] : 0,
      withCart ? installation.box[2] : 0,
    );
    main.rotation.y=withCart?installation.rotationY:0;
    reader.position.set(
      withCart ? installation.reader[0] : 240,
      withCart ? installation.reader[1] : 0,
      withCart ? installation.reader[2] : 165,
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

export function buildCart() { return buildUltrasoundCart(); }
