const SENSORS = [
  { v: "time", l: "Time (0–59 s)" },
  { v: "PS1", l: "PS1 — Pressure 1" },
  { v: "PS2", l: "PS2 — Pressure 2" },
  { v: "PS3", l: "PS3 — Pressure 3" },
  { v: "PS4", l: "PS4 — Pressure 4" },
  { v: "PS5", l: "PS5 — Pressure 5" },
  { v: "PS6", l: "PS6 — Pressure 6" },
  { v: "EPS1", l: "EPS1 — Motor power" },
  { v: "FS1", l: "FS1 — Flow 1" },
  { v: "FS2", l: "FS2 — Flow 2" },
  { v: "TS1", l: "TS1 — Temperature 1" },
  { v: "TS2", l: "TS2 — Temperature 2" },
  { v: "TS3", l: "TS3 — Temperature 3" },
  { v: "TS4", l: "TS4 — Temperature 4" },
  { v: "VS1", l: "VS1 — Vibration" },
  { v: "CE", l: "CE — Cooling efficiency" },
  { v: "CP", l: "CP — Cooling power" },
  { v: "SE", l: "SE — Efficiency factor" },
];

const STATUS_COLORS = {
  full_efficiency: "#4ade80",
  optimal: "#4ade80",
  no_leakage: "#4ade80",
  stable: "#4ade80",

  reduced_efficiency: "#facc15",
  small_lag: "#facc15",
  weak_leakage: "#facc15",
  slightly_reduced: "#facc15",

  severe_lag: "#fb923c",
  severely_reduced: "#fb923c",

  severe_leakage: "#f87171",
  near_failure: "#f87171",
  unstable: "#f87171",
};

const AL = 10;

const SENSOR_PRESETS = {
  cooler: {
    x: "time",
    y: "TS1",
    z: "CE",
    allowed: ["TS1", "TS2", "TS4", "PS5", "PS6", "CE", "CP", "time"],
  },

  pump: {
    x: "time",
    y: "SE",
    z: "FS1",
    allowed: ["SE", "FS1", "EPS1", "time"],
  },

  stable: {
    x: "time",
    y: "SE",
    z: "FS1",
    allowed: ["SE", "FS1", "time"],
  },

  accumulator: {
    x: "time",
    y: "CP",
    z: "EPS1",
    allowed: ["CP", "EPS1", "time"],
  },

  valve: {
    x: "time",
    y: "PS2",
    z: "FS2",
    allowed: ["PS2", "FS2", "time"],
  },
};

export { SENSORS, STATUS_COLORS, AL, SENSOR_PRESETS };
