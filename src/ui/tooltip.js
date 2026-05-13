import * as THREE from "three";
import { getVals } from "../utils/data.js";
import { SENSORS } from "../../constants.js";

const ray = new THREE.Raycaster();
ray.params.Points = { threshold: 0.18 };
const mouse = new THREE.Vector2();
const tt = document.getElementById("tt");

export function initTooltip(cam, CG, getCycle, getXF, getYF, getZF) {
  addEventListener("mousemove", (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(mouse, cam);
    const pts = CG.children.filter((c) => c.isPoints);
    let found = false;
    for (const m of pts) {
      const hits = ray.intersectObject(m);
      if (!hits.length) continue;
      const vi = hits[0].index;
      const ti = m.userData.indices ? m.userData.indices[vi] : vi;
      const cyc = getCycle();
      const xv = getVals(cyc, getXF())[ti];
      const yv = getVals(cyc, getYF())[ti];
      const zv = getVals(cyc, getZF())[ti];

      const xl =
        SENSORS.find((o) => o.v === getXF())
          ?.l.split("—")[0]
          .trim() || getXF();
      const yl =
        SENSORS.find((o) => o.v === getYF())
          ?.l.split("—")[0]
          .trim() || getYF();
      const zl =
        SENSORS.find((o) => o.v === getZF())
          ?.l.split("—")[0]
          .trim() || getZF();
          
      tt.className = "on";
      tt.style.left = e.clientX + 16 + "px";
      tt.style.top = e.clientY - 12 + "px";
      tt.innerHTML = `<div class="tth">t = ${ti}s</div>
      <div class="ttr"><span class="ttk">${xl}</span><span class="ttv">${typeof xv === "number" ? xv.toFixed(2) : xv}</span></div>
      <div class="ttr"><span class="ttk">${yl}</span><span class="ttv">${yv.toFixed(2)}</span></div>
      <div class="ttr"><span class="ttk">${zl}</span><span class="ttv">${zv.toFixed(2)}</span></div>`;
      found = true;
      break;
    }
    if (!found) tt.className = "";

    // Ribbon tooltip
    if (!found) {
      const surfacePts = CG.children.filter(
        (c) => c.isPoints && c.userData.isSurface,
      );
      for (const m of surfacePts) {
        const hits = ray.intersectObject(m);
        if (!hits.length) continue;
        const ti = hits[0].index;
        const comp = m.userData.component;
        const val = m.userData.avg[ti];
        const healthLabel = currentCycle.labels[comp.labelKey] || "";

        tt.className = "on";
        tt.style.left = e.clientX + 16 + "px";
        tt.style.top = e.clientY - 12 + "px";
        tt.innerHTML = `
      <div class="tth">t = ${ti}s — ${comp.label}</div>
      <div class="ttr"><span class="ttk">Sensors</span><span class="ttv">${comp.sensors.join(", ")}</span></div>
      <div class="ttr"><span class="ttk">Avg value</span><span class="ttv">${val.toFixed(2)}</span></div>
      <div class="ttr"><span class="ttk">Condition</span><span class="ttv">${healthLabel.replace(/_/g, " ")}</span></div>`;
        found = true;
        break;
      }
    }
  });
}
