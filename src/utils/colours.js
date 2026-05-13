import * as THREE from "three";
import { STATUS_COLORS } from "../../constants.js";

export function conditionColor(cyc, mode) {
  let key = "";

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

  return new THREE.Color(STATUS_COLORS[key] || "#ffffff");
}
