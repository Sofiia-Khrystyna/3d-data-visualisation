import * as THREE from "three";
import { LABEL_COLORS } from "../main.js";

export function buildTrail(group, xs, ys, zs, labels, data) {
  const n = xs.length;
  const order = Array.from({ length: n }, (_, i) => i)
    .sort((a, b) => +data[a].cycle - +data[b].cycle);

  let prevLabel = null;
  let segPositions = [];

  const flush = (lbl) => {
    if (segPositions.length < 6) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(segPositions, 3));
    group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: LABEL_COLORS[lbl] || 0x888888,
      transparent: true, opacity: 0.7,
    })));
    segPositions = [];
  };

  for (const i of order) {
    const lbl = labels[i];
    if (lbl !== prevLabel && prevLabel !== null) {
      const last = segPositions.slice(-3);
      flush(prevLabel);
      segPositions.push(...last);
    }
    segPositions.push(xs[i], ys[i], zs[i]);
    prevLabel = lbl;
  }
  flush(prevLabel);

  // Dots on top for hover — userData.indices maps vertex → data row
  const allPos = order.flatMap(i => [xs[i], ys[i], zs[i]]);
  const colors = order.flatMap(i => {
    const c = new THREE.Color(LABEL_COLORS[labels[i]] || 0x888888);
    return [c.r, c.g, c.b];
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(allPos, 3));
  geo.setAttribute("color",    new THREE.Float32BufferAttribute(colors, 3));

  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    vertexColors: true, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.9,
  }));
  pts.userData.indices = order;   // vertex k corresponds to data row order[k]
  group.add(pts);
}
