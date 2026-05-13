import * as THREE from "three";
import { conditionColor } from "../utils/colours.js";

export function buildTrail(CG, xs, ys, zs) {
  const N = xs.length;
  for (let i = 0; i < N - 1; i++) {
    const c = conditionColor(i, N);
    const seg = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(xs[i], ys[i], zs[i]),
      new THREE.Vector3(xs[i + 1], ys[i + 1], zs[i + 1]),
    ]);
    CG.add(
      new THREE.Line(
        seg,
        new THREE.LineBasicMaterial({
          color: c,
          transparent: true,
          opacity: 0.85,
        }),
      ),
    );
  }
  const pos = new Float32Array(xs.flatMap((x, i) => [x, ys[i], zs[i]]));
  const cols = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const c = conditionColor(i, N);
    cols[i * 3] = c.r;
    cols[i * 3 + 1] = c.g;
    cols[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.14,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
    }),
  );
  pts.userData.indices = Array.from({ length: N }, (_, i) => i);
  CG.add(pts);
}
