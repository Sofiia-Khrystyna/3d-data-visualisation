import * as THREE from "three";
import { STATUS_COLORS, AL } from "../../constants.js";

// Each component maps to its most diagnostic sensors
const COMPONENTS = [
  {
    key: "cooler",
    label: "Cooler",
    sensors: ["CE", "CP"],
    labelKey: "cooler",
  },
  {
    key: "valve",
    label: "Valve",
    sensors: ["PS2", "FS2"],
    labelKey: "valve",
  },
  {
    key: "pump",
    label: "Pump",
    sensors: ["PS1", "PS5", "PS6"],
    labelKey: "pump",
  },
  {
    key: "accumulator",
    label: "Accumulator",
    sensors: ["PS3", "PS4"],
    labelKey: "accumulator",
  },
  {
    key: "stable",
    label: "Stability",
    sensors: ["SE", "VS1"],
    labelKey: "stable",
  },
];

const T = 60;

export function buildRibbons(group, xs, ys, zs, cyc, YF) {
  const zStep = AL / (COMPONENTS.length - 1);

  COMPONENTS.forEach((comp, si) => {
    const available = comp.sensors.filter((s) => cyc.sensors[s]?.length > 0);
    if (available.length === 0) return;

    // If selected Y sensor belongs to this component, use it
    // Otherwise use component average — keeps ribbons distinct
    const useYF = available.includes(YF) ? YF : null;
    const raw = Array.from({ length: T }, (_, ti) =>
      useYF
        ? cyc.sensors[useYF][ti]
        : available.reduce((acc, s) => acc + (cyc.sensors[s][ti] || 0), 0) /
          available.length,
    );

    // Normalise to [0, AL]
    const mn = Math.min(...raw);
    const mx = Math.max(...raw);
    const rng = mx - mn || 1;
    const vals = raw.map((v) => ((v - mn) / rng) * AL);

    // X axis also uses selected XF
    const xVals = xs; // already normalised from build()

    const zPos = si * zStep;

    // Color by health state of this component
    const healthLabel = cyc.labels[comp.labelKey + "_label"] || "";
    const hexColor = STATUS_COLORS[healthLabel] || "#888888";
    const color = new THREE.Color(hexColor);

    // ── Filled ribbon mesh ────────────────────────────────────────────────
    const verts = [];
    const cols = [];

    for (let ti = 0; ti < T; ti++) {
      const xPos = (ti / (T - 1)) * AL;

      // top vertex — bright
      verts.push(xPos, vals[ti], zPos);
      const top = color.clone();
      cols.push(top.r, top.g, top.b);

      // bottom vertex — dimmed
      verts.push(xPos, 0, zPos);
      const bot = color.clone().multiplyScalar(0.25);
      cols.push(bot.r, bot.g, bot.b);
    }

    const indices = [];
    for (let ti = 0; ti < T - 1; ti++) {
      const a = ti * 2,
        b = ti * 2 + 1,
        c = ti * 2 + 2,
        d = ti * 2 + 3;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    group.add(
      new THREE.Mesh(
        geo,
        new THREE.MeshPhongMaterial({
          vertexColors: true,
          shininess: 25,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      ),
    );

    // ── Signal line on top ────────────────────────────────────────────────
    const linePos = [];
    for (let ti = 0; ti < T; ti++) {
      linePos.push((ti / (T - 1)) * AL, vals[ti], zPos);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(linePos, 3),
    );
    group.add(
      new THREE.Line(
        lineGeo,
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.95,
        }),
      ),
    );

    // ── Baseline (floor line for this ribbon) ─────────────────────────────
    const basePos = [0, 0, zPos, AL, 0, zPos];
    const baseGeo = new THREE.BufferGeometry();
    baseGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(basePos, 3),
    );
    group.add(
      new THREE.Line(
        baseGeo,
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.2,
        }),
      ),
    );

    // ── Label sprite ──────────────────────────────────────────────────────
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 48;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, 256, 48);

    // Component name
    ctx.font = "bold 18px 'IBM Plex Mono', monospace";
    ctx.fillStyle = hexColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(comp.label, 4, 16);

    // Health state below
    ctx.font = "13px 'IBM Plex Mono', monospace";
    ctx.fillStyle = hexColor;
    ctx.globalAlpha = 0.7;
    ctx.fillText(healthLabel.replace(/_/g, " "), 4, 34);

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthTest: false,
      }),
    );
    sprite.scale.set(2.2, 0.42, 1);
    sprite.position.set(AL + 1.2, vals[T - 1] * 0.5 + 0.5, zPos);
    group.add(sprite);

    // ── Invisible hover points for raycasting ─────────────────────────────
    const hoverPos = [];
    for (let ti = 0; ti < T; ti++) {
      hoverPos.push((ti / (T - 1)) * AL, vals[ti], zPos);
    }
    const hoverGeo = new THREE.BufferGeometry();
    hoverGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(hoverPos, 3),
    );
    const hoverPts = new THREE.Points(
      hoverGeo,
      new THREE.PointsMaterial({
        size: 0.001, // invisible but still raycasted
        transparent: true,
        opacity: 0,
      }),
    );
    hoverPts.userData.isSurface = true;
    hoverPts.userData.component = comp;
    hoverPts.userData.avg = raw; // raw averaged values before normalisation
    hoverPts.userData.indices = Array.from({ length: T }, (_, i) => i);
    group.add(hoverPts);
  });
}
