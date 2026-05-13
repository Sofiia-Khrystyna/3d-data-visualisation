import { AL } from "../../constants.js";

function getVals(cyc, field) {
  if (field === "time") return cyc.time;
  return cyc.sensors[field] || Array(60).fill(0);
}

function normVals(vals) {
  const mn = Math.min(...vals),
    mx = Math.max(...vals),
    rng = mx - mn || 1;
  return vals.map((v) => ((v - mn) / rng) * AL);
}

function fmtTick(field, frac, cyc) {
  const vals = getVals(cyc, field);
  const mn = Math.min(...vals),
    mx = Math.max(...vals);
  const v = mn + frac * (mx - mn);
  return Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(1);
}

function formatConditionLabel(label) {
  return label.replaceAll("_", " ");
}

export { getVals, normVals, fmtTick, formatConditionLabel };
