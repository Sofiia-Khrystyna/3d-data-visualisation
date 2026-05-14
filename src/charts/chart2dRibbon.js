import { AL, STATUS_COLORS, RIBBON_COMPONENTS } from "../../constants.js";

const canvas = document.getElementById("chart2d");
const ctx = canvas.getContext("2d");

function layout() {
  return {
    left: 100,
    right: 80,
    top: 80,
    bottom: 100,
    plotW: innerWidth - 180,
    plotH: innerHeight - 180,
  };
}

function axes() {
  const { left, top, bottom } = layout();

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.5;

  ctx.beginPath();

  ctx.moveTo(left, top);
  ctx.lineTo(left, innerHeight - bottom);

  ctx.lineTo(innerWidth - 80, innerHeight - bottom);

  ctx.stroke();
}

function grid() {
  const { left, plotW, plotH, top } = layout();

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 10; i++) {
    const y = top + (plotH / 10) * i;

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + plotW, y);
    ctx.stroke();
  }
}

function ribbon(xs, vals, color, offsetY) {
  const { left, plotW } = layout();

  const scale = 55;

  ctx.beginPath();

  xs.forEach((x, i) => {
    const px = left + (x / AL) * plotW;
    const py = offsetY - vals[i] * scale;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // fill ribbon
  ctx.lineTo(left + plotW, offsetY);
  ctx.lineTo(left, offsetY);
  ctx.closePath();

  ctx.fillStyle = color + "22";
  ctx.fill();
}

export function draw2DRibbons(xs, cyc, YF) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  grid();
  axes();

  const spacing = 120;

  RIBBON_COMPONENTS.forEach((comp, idx) => {
    const available = comp.sensors.filter(
      (s) => cyc.sensors[s]?.length > 0,
    );

    if (!available.length) return;

    const useYF = available.includes(YF) ? YF : null;

    const raw = Array.from({ length: 60 }, (_, ti) =>
      useYF
        ? cyc.sensors[useYF][ti]
        : available.reduce(
            (acc, s) => acc + (cyc.sensors[s][ti] || 0),
            0,
          ) / available.length,
    );

    const mn = Math.min(...raw);
    const mx = Math.max(...raw);
    const rng = mx - mn || 1;

    const vals = raw.map((v) => (v - mn) / rng);

    const health =
      cyc.labels[comp.key + "_label"];

    const color =
      STATUS_COLORS[health] || "#888";

    const offsetY =
      140 + idx * spacing;

    ribbon(xs, vals, color, offsetY);

    // labels
    ctx.fillStyle = color;
    ctx.font = "18px IBM Plex Mono";

    ctx.fillText(
      comp.label,
      innerWidth - 220,
      offsetY - 18,
    );

    ctx.font = "13px IBM Plex Mono";

    ctx.fillText(
      health.replaceAll("_", " "),
      innerWidth - 220,
      offsetY + 4,
    );
  });

  ctx.fillStyle = "#fff";
  ctx.font = "18px IBM Plex Mono";

  ctx.fillText(
    "Time",
    innerWidth - 120,
    innerHeight - 60,
  );
}