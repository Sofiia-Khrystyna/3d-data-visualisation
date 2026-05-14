import { CYCLES } from "../../data-processing/loader.js";
import { AL } from "../../constants.js";

// ── Precompute global min/max per sensor key ──────────────────────────────────
const GLOBAL_RANGE = {};

function computeGlobalRanges() {
  if (Object.keys(GLOBAL_RANGE).length > 0) return; // already done
  for (const cyc of CYCLES) {
    for (const [key, vals] of Object.entries(cyc.sensors)) {
      if (!GLOBAL_RANGE[key]) GLOBAL_RANGE[key] = { mn: Infinity, mx: -Infinity };
      const mn = Math.min(...vals);
      const mx = Math.max(...vals);
      if (mn < GLOBAL_RANGE[key].mn) GLOBAL_RANGE[key].mn = mn;
      if (mx > GLOBAL_RANGE[key].mx) GLOBAL_RANGE[key].mx = mx;
    }
    // time is always 0–59
    GLOBAL_RANGE["time"] = { mn: 0, mx: 59 };
  }
}

function getVals(cyc, field) {
  if (field === "time") return cyc.time;
  return cyc.sensors[field] || Array(60).fill(0);
}

function normVals(vals, field) {
  computeGlobalRanges();
  const range = GLOBAL_RANGE[field];
  if (!range) {
    // fallback: local norm
    const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
    return vals.map((v) => ((v - mn) / rng) * AL);
  }
  const { mn, mx } = range;
  const rng = mx - mn || 1;
  return vals.map((v) => ((v - mn) / rng) * AL);
}

function fmtTick(field, frac, cyc) {
  computeGlobalRanges();
  const range = GLOBAL_RANGE[field];
  if (range) {
    const v = range.mn + frac * (range.mx - range.mn);
    return Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(1);
  }
  // fallback
  const vals = getVals(cyc, field);
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const v = mn + frac * (mx - mn);
  return Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(1);
}

function formatConditionLabel(label) {
  return label.replaceAll("_", " ");
}

export { getVals, normVals, fmtTick, formatConditionLabel };