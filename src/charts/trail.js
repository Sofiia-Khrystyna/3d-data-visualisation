import * as THREE from "three";

// ── Healthy baseline per sensor ───────────────────────────────────────────────
// Derived from Pearson correlation analysis (correlation_analysis.py).
// direction 'up'   = sensor rises as component degrades (e.g. temperature)
// direction 'down' = sensor drops as component degrades (e.g. efficiency)
// direction 'neutral' = weak/no correlation with health state
// healthyMean = mean value across all healthy cycles (full_efficiency + no_leakage)
const SENSOR_DIRECTION = {
  TS1: { direction: "up", healthyMean: 35.898, healthyStd: 0.884 },
  TS2: { direction: "up", healthyMean: 41.544, healthyStd: 0.909 },
  TS3: { direction: "up", healthyMean: 38.844, healthyStd: 0.945 },
  TS4: { direction: "up", healthyMean: 30.888, healthyStd: 0.651 },
  EPS1: { direction: "up", healthyMean: 2471.239, healthyStd: 75.916 },
  CE: { direction: "down", healthyMean: 46.905, healthyStd: 0.793 },
  CP: { direction: "down", healthyMean: 2.177, healthyStd: 0.087 },
  SE: { direction: "down", healthyMean: 58.891, healthyStd: 23.492 },
  PS5: { direction: "down", healthyMean: 9.904, healthyStd: 0.088 },
  PS6: { direction: "down", healthyMean: 9.786, healthyStd: 0.085 },
  FS1: { direction: "down", healthyMean: 0.165, healthyStd: 1.072 },
  FS2: { direction: "down", healthyMean: 10.16, healthyStd: 0.073 },
  PS1: { direction: "neutral", healthyMean: 167.007, healthyStd: 11.036 },
  PS2: { direction: "neutral", healthyMean: 20.284, healthyStd: 39.075 },
  PS3: { direction: "neutral", healthyMean: 0.299, healthyStd: 0.789 },
  PS4: { direction: "neutral", healthyMean: 5.722, healthyStd: 4.44 },
  VS1: { direction: "neutral", healthyMean: 0.553, healthyStd: 0.027 },
  time: { direction: "neutral", healthyMean: 30, healthyStd: 18 },
};

// ── Compute danger score for one raw sensor reading ───────────────────────────
// Returns 0.0 = perfectly healthy, 1.0 = maximally dangerous
// This is clamped to [0, 1] so extreme outliers don't break the color scale.
function dangerScore(rawValue, sensorKey) {
  const info = SENSOR_DIRECTION[sensorKey];
  if (!info || info.direction === "neutral") return 0.0;
  // console.log(sensorKey, rawValue, typeof rawValue);

  const { direction, healthyMean, healthyStd } = info;
  const deviation = (rawValue - healthyMean) / (healthyStd || 1);

  if (direction === "up") {
    // Higher than healthy = danger. e.g. TS4 above 31°C = getting worse
    return Math.min(1.0, Math.max(0.0, deviation));
  } else {
    // Lower than healthy = danger. e.g. CE below 47 = getting worse
    return Math.min(1.0, Math.max(0.0, -deviation));
  }
}

// ── Map danger score to color ──────────────────────────────────────────────────
// 0.0 = green (healthy), 0.5 = yellow (warning), 1.0 = red (critical)
// Uses HSL: hue 120° = green, 60° = yellow, 0° = red
function dangerColor(score) {
  const hue = ((1.0 - score) * 120) / 360; // 0.333 (green) → 0 (red)
  const sat = 0.85;
  const lit = 0.45 + score * 0.1; // slightly brighter when critical
  return new THREE.Color().setHSL(hue, sat, lit);
}

// ── Build trail ───────────────────────────────────────────────────────────────
// xs, ys, zs   — normalised [0, AL] arrays (60 values each)
// rawY, rawZ   — original sensor values before normalisation (for danger scoring)
// YF, ZF       — sensor keys (e.g. 'TS4', 'CE') used to look up direction
export function buildTrail(CG, xs, ys, zs, color, rawY, rawZ, YF, ZF) {
  const N = xs.length;
  const yUses = SENSOR_DIRECTION[YF]?.direction !== "neutral";
  const zUses = SENSOR_DIRECTION[ZF]?.direction !== "neutral";

  const useGradient = yUses || zUses;

  const yMin = Math.min(...rawY);
  const yMax = Math.max(...rawY);

  const zMin = Math.min(...rawZ);
  const zMax = Math.max(...rawZ);

  // // ── DEBUG ──
  // console.log("YF:", YF);
  // console.log("SENSOR_DIRECTION[YF]:", SENSOR_DIRECTION[YF]);
  // console.log("useGradient:", useGradient);
  // console.log("rawY sample (first 5):", rawY?.slice(0, 5));
  // console.log("flat color:", color);
  // const testScore = dangerScore(rawY?.[0], YF);
  // console.log("dangerScore for rawY[0]:", testScore);
  // console.log("dangerColor for that score:", dangerColor(testScore));
  // // ── END DEBUG ──

  const getColor = (i) => {
    if (!useGradient) return color;

    const yHealth = yUses ? dangerScore(rawY[i], YF) : 0;
    const zHealth = zUses ? dangerScore(rawZ[i], ZF) : 0;

    const yLocal = yUses ? (rawY[i] - yMin) / (yMax - yMin || 1) : 0;

    const zLocal = zUses ? (rawZ[i] - zMin) / (zMax - zMin || 1) : 0;

    // Blend global degradation + local variation
    const score =
      0.7 * Math.max(yHealth, zHealth) + 0.3 * Math.max(yLocal, zLocal);

    return dangerColor(score);
  };

  // ── Continuous gradient line ──────────────────────────────────────────────
  const positions = [];
  const lineColors = [];

  for (let i = 0; i < N; i++) {
    positions.push(xs[i], ys[i], zs[i]);

    const c = getColor(i);

    lineColors.push(c.r, c.g, c.b);
  }

  const lineGeo = new THREE.BufferGeometry();

  lineGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );

  lineGeo.setAttribute(
    "color",
    new THREE.Float32BufferAttribute(lineColors, 3),
  );

  const line = new THREE.Line(
    lineGeo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    }),
  );

  CG.add(line);

  // ── Dots (coloured by danger score, for hover raycasting) ─────────────────
  const pos = new Float32Array(xs.flatMap((x, i) => [x, ys[i], zs[i]]));
  const cols = new Float32Array(N * 3);

  for (let i = 0; i < N; i++) {
    const c = getColor(i);
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
      size: 0.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 1,
    }),
  );
  pts.userData.indices = Array.from({ length: N }, (_, i) => i);
  CG.add(pts);
}
