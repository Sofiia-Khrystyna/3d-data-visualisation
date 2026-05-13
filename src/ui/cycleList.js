import { CYCLES } from "../../data-processing/loader.js";
import { conditionColor } from "../utils/colours.js";
import { formatConditionLabel } from "../utils/data.js";

export function buildCycleList(currentCycle, mode, onSelect) {
  const el = document.getElementById("cycle-list");
  el.innerHTML = "";
  CYCLES.forEach((cyc) => {
    const col = conditionColor(cyc.labels, mode).getStyle();
    const lbl = formatConditionLabel(cyc.labels[mode + "_label"]);
    const btn = document.createElement("button");
    btn.className = "cy-btn" + (cyc === currentCycle ? " active" : "");
    btn.innerHTML = `<span>#${cyc.cycle}</span><span style="display:flex;align-items:center;gap:4px;font-size:9px;color:${col}"><span class="cy-health" style="background:${col}"></span>${lbl}</span>`;
    btn.addEventListener("click", () => {
      onSelect(cyc);
      document
        .querySelectorAll(".cy-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
    el.appendChild(btn);
  });
}
