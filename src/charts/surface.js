import * as THREE from "three";
import { LABEL_COLORS } from "../main.js";

export function buildSurface(group, xs, ys, zs, labels, data) {
  const GRID = 44;

  const sorted = xs.map((x, i) => ({ x, y: ys[i], z: zs[i], lbl: labels[i], idx: i }))
    .sort((a, b) => a.x - b.x || a.z - b.z);

  const grid = Array.from({ length: GRID }, () => Array(GRID).fill(null));
  sorted.forEach(pt => {
    const gx = Math.min(Math.floor(pt.x / 10 * GRID), GRID - 1);
    const gz = Math.min(Math.floor(pt.z / 10 * GRID), GRID - 1);
    if (!grid[gx][gz]) grid[gx][gz] = pt;
  });

  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        if (!grid[i][j]) {
          grid[i][j] = grid[i][j-1] || grid[i-1]?.[j] || grid[i][j+1] || grid[i+1]?.[j] || null;
        }
      }
    }
  }

  const geo = new THREE.PlaneGeometry(10, 10, GRID - 1, GRID - 1);
  geo.rotateX(-Math.PI / 2);

  const pos      = geo.attributes.position;
  const colAttr  = new Float32Array(pos.count * 3);

  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const vertIdx = i * GRID + j;
      const cell = grid[i][j];
      pos.setY(vertIdx, cell ? cell.y : 0);
      const c = new THREE.Color(cell ? (LABEL_COLORS[cell.lbl] || 0x444466) : 0x1a2a3a);
      colAttr[vertIdx*3]   = c.r;
      colAttr[vertIdx*3+1] = c.g;
      colAttr[vertIdx*3+2] = c.b;
    }
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colAttr, 3));
  geo.computeVertexNormals();

  group.add(new THREE.Mesh(geo, new THREE.MeshPhongMaterial({
    vertexColors: true, shininess: 35,
    transparent: true, opacity: 0.86, side: THREE.DoubleSide,
  })));

  group.add(new THREE.Mesh(geo.clone(), new THREE.MeshBasicMaterial({
    color: 0x1e3a5f, wireframe: true, transparent: true, opacity: 0.10,
  })));

  // Hover dots
  const allPos = xs.map((x, i) => [x, ys[i], zs[i]]).flat();
  const ptColors = labels.flatMap(lbl => {
    const c = new THREE.Color(LABEL_COLORS[lbl] || 0x888888);
    return [c.r, c.g, c.b];
  });
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute("position", new THREE.Float32BufferAttribute(allPos, 3));
  ptGeo.setAttribute("color",    new THREE.Float32BufferAttribute(ptColors, 3));
  const pts = new THREE.Points(ptGeo, new THREE.PointsMaterial({
    vertexColors: true, size: 0.05, transparent: true, opacity: 0.45,
  }));
  pts.userData.indices = labels.map((_, i) => i);
  group.add(pts);
}
