import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Papa from "papaparse";
import { buildScatter } from "./charts/scatter.js";
import { buildTrail } from "./charts/trail.js";
import { buildSurface } from "./charts/surface.js";
import { buildAxes, buildAxisLabels } from "./axes.js";

export const LABEL_COLORS = {
  full_efficiency:    0x38bdf8,
  reduced_efficiency: 0xfbbf24,
  near_failure:       0xf87171,
  optimal:            0x34d399,
  small_lag:          0xa78bfa,
  severe_lag:         0xfb923c,
  no_leakage:         0x38bdf8,
  weak_leakage:       0xfbbf24,
  severe_leakage:     0xf87171,
  slightly_reduced:   0xa78bfa,
  severely_reduced:   0xfb923c,
  stable:             0x6ee7b7,
  unstable:           0xfca5a5,
};

export const SENSOR_OPTIONS = [
  { value: "cycle",      label: "Cycle (time)" },
  { value: "PS1_mean",   label: "PS1 — Pressure 1" },
  { value: "PS2_mean",   label: "PS2 — Pressure 2" },
  { value: "PS3_mean",   label: "PS3 — Pressure 3" },
  { value: "PS4_mean",   label: "PS4 — Pressure 4" },
  { value: "PS5_mean",   label: "PS5 — Pressure 5" },
  { value: "PS6_mean",   label: "PS6 — Pressure 6" },
  { value: "EPS1_mean",  label: "EPS1 — Motor power" },
  { value: "FS1_mean",   label: "FS1 — Flow 1" },
  { value: "FS2_mean",   label: "FS2 — Flow 2" },
  { value: "TS1_mean",   label: "TS1 — Temperature 1" },
  { value: "TS2_mean",   label: "TS2 — Temperature 2" },
  { value: "TS3_mean",   label: "TS3 — Temperature 3" },
  { value: "TS4_mean",   label: "TS4 — Temperature 4" },
  { value: "VS1_mean",   label: "VS1 — Vibration" },
  { value: "CE_mean",    label: "CE — Cooling efficiency" },
  { value: "CP_mean",    label: "CP — Cooling power" },
  { value: "SE_mean",    label: "SE — Efficiency factor" },
];

export const COLOR_OPTIONS = [
  { value: "cooler_label",      label: "Cooler condition" },
  { value: "valve_label",       label: "Valve condition" },
  { value: "pump_label",        label: "Pump condition" },
  { value: "accumulator_label", label: "Accumulator condition" },
  { value: "stable_label",      label: "System stability" },
];

export const AXIS_LENGTH = 10;
export const fieldStats  = {};

function extractField(field) {
  const raw = data.map(r => parseFloat(r[field]));
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  fieldStats[field] = { min, max };
  const range = max - min || 1;
  return raw.map(v => ((v - min) / range) * AXIS_LENGTH);
}

// ── Scene ─────────────────────────────────────────────────────────────────────
const canvas   = document.getElementById("three-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x080c12, 1);

const scene  = new THREE.Scene();
scene.fog    = new THREE.FogExp2(0x080c12, 0.013);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(14, 9, 14);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance   = 4;
controls.maxDistance   = 60;
controls.target.set(5, 3, 5);

scene.add(new THREE.AmbientLight(0x1a2a3a, 3));
const dir = new THREE.DirectionalLight(0x6699cc, 2);
dir.position.set(12, 20, 8);
scene.add(dir);

// ── State ─────────────────────────────────────────────────────────────────────
let data         = [];
let currentChart = "scatter";
const chartGroup = new THREE.Group();
const axesGroup  = new THREE.Group();
scene.add(chartGroup, axesGroup);

let xField     = "cycle";
let yField     = "PS1_mean";
let zField     = "TS1_mean";
let colorField = "cooler_label";

function populateSelects() {
  [["x-axis","cycle"],["y-axis","PS1_mean"],["z-axis","TS1_mean"]].forEach(([id,def]) => {
    const el = document.getElementById(id);
    SENSOR_OPTIONS.forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value; o.textContent = opt.label;
      if (opt.value === def) o.selected = true;
      el.appendChild(o);
    });
  });
  const cel = document.getElementById("color-by");
  COLOR_OPTIONS.forEach(opt => {
    const o = document.createElement("option");
    o.value = opt.value; o.textContent = opt.label;
    if (opt.value === "cooler_label") o.selected = true;
    cel.appendChild(o);
  });
}

function disposeGroup(group) {
  while (group.children.length) {
    const obj = group.children[0];
    group.remove(obj);
    obj.geometry?.dispose();
    if (obj.material) {
      Array.isArray(obj.material) ? obj.material.forEach(m => m.dispose()) : obj.material.dispose();
    }
  }
}

function buildChart() {
  disposeGroup(chartGroup);
  disposeGroup(axesGroup);

  const xs     = extractField(xField);
  const ys     = extractField(yField);
  const zs     = extractField(zField);
  const labels = data.map(r => r[colorField]);

  if (currentChart === "scatter") buildScatter(chartGroup, xs, ys, zs, labels, data);
  if (currentChart === "trail")   buildTrail(chartGroup, xs, ys, zs, labels, data);
  if (currentChart === "surface") buildSurface(chartGroup, xs, ys, zs, labels, data);

  const axisLabels = [xField,yField,zField].map(
    f => SENSOR_OPTIONS.find(o => o.value === f)?.label || f
  );
  buildAxes(axesGroup, fieldStats, xField, yField, zField);
  buildAxisLabels(axesGroup, axisLabels);

  updateLegend(labels);
  document.getElementById("info-points").textContent = `${data.length} cycles`;
  document.getElementById("info-chart").textContent =
    currentChart === "scatter" ? "3D Scatter" :
    currentChart === "trail"   ? "3D Trail"   : "3D Surface";
}

function updateLegend(labels) {
  const unique     = [...new Set(labels)].filter(Boolean);
  const colorLabel = COLOR_OPTIONS.find(o => o.value === colorField)?.label || colorField;
  const el = document.getElementById("legend");
  el.innerHTML = `<div class="legend-title">${colorLabel}</div>`;
  unique.forEach(lbl => {
    const color = "#" + (LABEL_COLORS[lbl]||0x888888).toString(16).padStart(6,"0");
    el.innerHTML += `<div class="legend-item"><span class="legend-dot" style="background:${color}"></span><span>${(lbl||"").replace(/_/g," ")}</span></div>`;
  });
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
raycaster.params.Points = { threshold: 0.15 };
const mouse   = new THREE.Vector2();
const tooltip = document.getElementById("tooltip");

window.addEventListener("mousemove", e => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const pts   = chartGroup.children.filter(c => c.isPoints);
  let found   = false;

  for (const mesh of pts) {
    const hits = raycaster.intersectObject(mesh);
    if (!hits.length) continue;
    const vertIdx = hits[0].index;
    const dataIdx = mesh.userData.indices ? mesh.userData.indices[vertIdx] : vertIdx;
    const row = data[dataIdx];
    if (!row) break;

    const hex   = "#" + (LABEL_COLORS[row[colorField]]||0x888888).toString(16).padStart(6,"0");
    const label = (row[colorField]||"").replace(/_/g," ");
    const xLbl  = SENSOR_OPTIONS.find(o=>o.value===xField)?.label.split("—")[0].trim()||xField;
    const yLbl  = SENSOR_OPTIONS.find(o=>o.value===yField)?.label.split("—")[0].trim()||yField;
    const zLbl  = SENSOR_OPTIONS.find(o=>o.value===zField)?.label.split("—")[0].trim()||zField;

    tooltip.className = "visible";
    tooltip.style.left = e.clientX + 16 + "px";
    tooltip.style.top  = e.clientY - 12 + "px";
    tooltip.innerHTML  = `
      <div class="tt-title">Cycle ${row.cycle}</div>
      <div class="tt-row"><span class="tt-key">${xLbl}</span><span>${(+row[xField]).toFixed(2)}</span></div>
      <div class="tt-row"><span class="tt-key">${yLbl}</span><span>${(+row[yField]).toFixed(2)}</span></div>
      <div class="tt-row"><span class="tt-key">${zLbl}</span><span>${(+row[zField]).toFixed(2)}</span></div>
      <div class="tt-badge" style="background:${hex}22;border-color:${hex}66;color:${hex}">${label}</div>
    `;
    found = true;
    break;
  }
  if (!found) tooltip.className = "";
});

// ── Events ────────────────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentChart = btn.dataset.chart;
    buildChart();
  });
});
document.getElementById("x-axis").addEventListener("change",  e => { xField     = e.target.value; buildChart(); });
document.getElementById("y-axis").addEventListener("change",  e => { yField     = e.target.value; buildChart(); });
document.getElementById("z-axis").addEventListener("change",  e => { zField     = e.target.value; buildChart(); });
document.getElementById("color-by").addEventListener("change",e => { colorField = e.target.value; buildChart(); });

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }

populateSelects();
Papa.parse("/hydraulic_data.csv", {
  download: true, header: true, dynamicTyping: false,
  complete: ({ data: rows }) => {
    data = rows.filter(r => r.cycle && r.PS1_mean);
    buildChart();
    animate();
  },
});
