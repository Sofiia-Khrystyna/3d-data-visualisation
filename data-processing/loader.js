async function loadHydraulicData() {
  const response = await fetch("./hydraulic_timeseries.csv");

  const text = await response.text();

  const rows = text
    .trim()
    .split("\n")
    .slice(1)
    .map((r) => r.split(","));

  const cycles = {};

  rows.forEach((row) => {
    const cycleId = Number(row[0]);

    if (!cycles[cycleId]) {
      cycles[cycleId] = {
        cycle: cycleId,

        time: [],

        sensors: {
          PS1: [],
          PS2: [],
          PS3: [],
          PS4: [],
          PS5: [],
          PS6: [],

          EPS1: [],

          FS1: [],
          FS2: [],

          TS1: [],
          TS2: [],
          TS3: [],
          TS4: [],

          VS1: [],

          CE: [],
          CP: [],
          SE: [],
        },

        labelVals: {
          cooler: Number(row[19]),
          valve: Number(row[20]),
          pump: Number(row[21]),
          accumulator: Number(row[22]),
          stable: Number(row[23]),
        },

        labels: {
          cooler_label: row[24],
          valve_label: row[25],
          pump_label: row[26],
          accumulator_label: row[27],
          stable_label: row[28],
        },
      };
    }

    const c = cycles[cycleId].sensors;

    cycles[cycleId].time.push(Number(row[1]));

    c.PS1.push(Number(row[2]));
    c.PS2.push(Number(row[3]));
    c.PS3.push(Number(row[4]));
    c.PS4.push(Number(row[5]));
    c.PS5.push(Number(row[6]));
    c.PS6.push(Number(row[7]));

    c.EPS1.push(Number(row[8]));

    c.FS1.push(Number(row[9]));
    c.FS2.push(Number(row[10]));

    c.TS1.push(Number(row[11]));
    c.TS2.push(Number(row[12]));
    c.TS3.push(Number(row[13]));
    c.TS4.push(Number(row[14]));

    c.VS1.push(Number(row[15]));

    c.CE.push(Number(row[16]));
    c.CP.push(Number(row[17]));
    c.SE.push(Number(row[18]));
  });

  return Object.values(cycles);
}

const CYCLES = await loadHydraulicData();

export { CYCLES };
