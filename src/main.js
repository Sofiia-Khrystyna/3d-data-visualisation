import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CYCLES } from "../data-processing/loader.js";
import { SENSORS, STATUS_COLORS, AL, SENSOR_PRESETS } from "../constants.js";
import { getVals, normVals, fmtTick } from "./utils/data.js";
import { conditionColor } from "./utils/colours.js";
import { buildRibbons } from "./charts/ribbons.js";
import { buildTrail } from "./charts/trail.js";
import { draw2DTrail } from "./charts/chart2dTrail.js";
import { draw2DRibbons } from "./charts/chart2dRibbon.js";
import { buildAxes } from "./ui/axes.js";
import { initTooltip } from "./ui/tooltip.js";
import { buildCycleList } from "./ui/cycleList.js";
import { updateStatus } from "./ui/statusPanel.js";

let VIEW_MODE = "3d";

// MARK: Scene
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("c"),
  antialias: true,
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x080c12, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x080c12, 0.012);

const cam = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 200);
cam.position.set(13, 8, 13);

const orbit = new OrbitControls(cam, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.05;
orbit.minDistance = 3;
orbit.maxDistance = 50;
orbit.target.set(5, 3, 5);

scene.add(new THREE.AmbientLight(0x1a2a3a, 3));
const sun = new THREE.DirectionalLight(0x6699cc, 2);
sun.position.set(12, 20, 8);
scene.add(sun);

const CG = new THREE.Group(),
  AG = new THREE.Group();
scene.add(CG, AG);

// MARK: State
let MODE = "trail",
  XF = "time",
  YF = "PS1",
  ZF = "TS1",
  COLOR_MODE = "cooler";
let currentCycle = CYCLES[0];

// MARK: Helpers
function dispose(g) {
  while (g.children.length) {
    const o = g.children[0];
    g.remove(o);
    o.geometry?.dispose();
    if (o.material)
      Array.isArray(o.material)
        ? o.material.forEach((m) => m.dispose())
        : o.material.dispose();
  }
}

// MARK: Main build
function build() {
  const cyc = currentCycle;
  const rawY = getVals(cyc, YF);
  const rawZ = getVals(cyc, ZF);
  const xs = normVals(getVals(cyc, XF), XF);
  const ys = normVals(rawY, YF).map((v) => v * 1);
  const zs = normVals(rawZ, ZF).map((v) => v * 1);

  const color = conditionColor(cyc, COLOR_MODE);
  const axisPanel = document.getElementById("axis-panel"); // give your axes panel div this id
  if (axisPanel)
    axisPanel.style.display = MODE === "ribbons" ? "none" : "block";

  const statusPanel = document.getElementById("status");

  if (statusPanel) {
    statusPanel.style.display = MODE === "ribbons" ? "block" : "none";
  }

  if (VIEW_MODE === "3d") {
    dispose(CG);
    dispose(AG);
    if (MODE === "trail") buildTrail(CG, xs, ys, zs, color, rawY, rawZ, YF, ZF);
    else buildRibbons(CG, xs, ys, zs, cyc, YF);

    buildAxes(AG, XF, YF, ZF, cyc);
  } else {
    if (MODE === "trail") {
      draw2DTrail(xs, ys, zs, rawY, rawZ, YF, ZF, currentCycle);
    } else {
      draw2DRibbons(xs, currentCycle, YF);
    }
  }
  updateStatus(cyc);
  if (MODE !== "ribbons")
    document.getElementById("bpt").textContent =
      `Cycle ${cyc.cycle} · 60 time steps`;
  else
    document.getElementById("bpt").textContent =
      `Cycle ${cyc.cycle} · 16 sensors × 60 time steps`;

  document.getElementById("bct").textContent =
    MODE === "trail" ? "3D Trail Plot" : "3D Parallel Sensor Ribbons";
}

// MARK: Selects
function populateSelects() {
  const preset = SENSOR_PRESETS[COLOR_MODE];

  const allowed = preset.allowed;

  [
    ["sx", preset.x],
    ["sy", preset.y],
    ["sz", preset.z],
  ].forEach(([id, def]) => {
    const el = document.getElementById(id);

    el.innerHTML = "";

    SENSORS.filter((s) => allowed.includes(s.v)).forEach((s) => {
      const o = document.createElement("option");

      o.value = s.v;
      o.textContent = s.l;

      if (s.v === def) o.selected = true;

      el.appendChild(o);
    });
  });

  XF = preset.x;
  YF = preset.y;
  ZF = preset.z;
}

// MARK: Events
document.querySelectorAll(".tab").forEach((b) => {
  b.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    MODE = b.dataset.chart;
    build();
  });
});

document.querySelectorAll(".view-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".view-btn")
      .forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");

    VIEW_MODE = btn.dataset.view;

    renderer.domElement.style.display = VIEW_MODE === "3d" ? "block" : "none";

    document.getElementById("chart2d").style.display =
      VIEW_MODE === "2d" ? "block" : "none";

    build();
  });
});

document.getElementById("sx").addEventListener("change", (e) => {
  XF = e.target.value;
  build();
});
document.getElementById("sy").addEventListener("change", (e) => {
  YF = e.target.value;
  build();
});
document.getElementById("sz").addEventListener("change", (e) => {
  ZF = e.target.value;
  build();
});
document.getElementById("sc").addEventListener("change", (e) => {
  COLOR_MODE = e.target.value;

  populateSelects();
  buildCycleList(currentCycle, COLOR_MODE, (cyc) => {
    currentCycle = cyc;
    build();
  });
  build();
});
addEventListener("resize", () => {
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// MARK: Loop & init
(function loop() {
  requestAnimationFrame(loop);
  orbit.update();
  renderer.render(scene, cam);
})();

initTooltip(
  cam,
  CG,
  () => currentCycle,
  () => XF,
  () => YF,
  () => ZF,
);
populateSelects();
buildCycleList(currentCycle, COLOR_MODE, (cyc) => {
  currentCycle = cyc;
  build();
});
build();
