import * as THREE from "three";
import { LABEL_COLORS } from "../main.js";

export function buildScatter(group, xs, ys, zs, labels, data) {
  // Group points by label — one Points object per label for raycasting
  const byLabel = {};
  labels.forEach((lbl, i) => {
    if (!byLabel[lbl]) byLabel[lbl] = { positions: [], indices: [] };
    byLabel[lbl].positions.push(xs[i], ys[i], zs[i]);
    byLabel[lbl].indices.push(i);
  });

  Object.entries(byLabel).forEach(([lbl, { positions, indices }]) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: LABEL_COLORS[lbl] || 0x888888,
      size: 0.16,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.88,
    });

    const pts = new THREE.Points(geo, mat);
    // indices maps vertex position → original data row index
    pts.userData.indices = indices;
    group.add(pts);
  });
}
