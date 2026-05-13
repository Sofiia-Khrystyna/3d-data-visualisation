import { STATUS_COLORS } from "../../constants.js";

export function updateStatus(cyc) {
  const el = document.getElementById("status");
  const L = cyc.labels;
  const rows = [
    ["Cooler", L.cooler_label],
    ["Valve", L.valve_label],
    ["Pump", L.pump_label],
    ["Accumulator", L.accumulator_label],
    ["System", L.stable_label],
  ];
  el.innerHTML =
    `<div class="pl">Cycle ${cyc.cycle} — Health</div>` +
    rows
      .map(([k, v]) => {
        const col = STATUS_COLORS[v] || "#888";
        return `<div class="stat-row"><span class="stat-key">${k}</span><span class="stat-val" style="color:${col};border-color:${col}44;background:${col}18">${v.replace(/_/g, " ")}</span></div>`;
      })
      .join("");
}
