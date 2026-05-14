import * as THREE from "three";
import { STATUS_COLORS } from "../../constants.js";

export function conditionColor(cyc, mode) {
  // console.log("conditionColor called with labels:", cyc, "mode:", mode);
  let key = cyc[mode + "_label"];

  // console.log("key resolved to:", key);

  switch (mode) {
    case "cooler":
      key = cyc.cooler_label;
      break;

    case "valve":
      key = cyc.valve_label;
      break;

    case "pump":
      key = cyc.pump_label;
      break;

    case "accumulator":
      key = cyc.accumulator_label;
      break;

    case "stable":
      key = cyc.stable_label;
      break;
  }
  const result = STATUS_COLORS[key] || "#ffffff";
  // console.log("color result:", result);
  return new THREE.Color(result);
}
