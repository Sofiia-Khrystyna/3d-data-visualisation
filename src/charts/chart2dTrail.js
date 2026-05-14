import { AL } from "../../constants.js";
import { dangerColor, dangerScore } from "./trail.js";
import { fmtTick } from "../utils/data.js";

const canvas = document.getElementById("chart2d");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth * devicePixelRatio;
  canvas.height = innerHeight * devicePixelRatio;

  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";

  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

resize();
addEventListener("resize", resize);

function gradientLine(xs, ys, rawVals, sensorKey, width = 2.5) {
  const plotW = innerWidth - 220;
  const plotH = innerHeight - 220;

  for (let i = 0; i < xs.length - 1; i++) {
    const x1 = 100 + (xs[i] / AL) * plotW;
    const y1 = innerHeight - 100 - (ys[i] / AL) * plotH;

    const x2 = 100 + (xs[i + 1] / AL) * plotW;
    const y2 = innerHeight - 100 - (ys[i + 1] / AL) * plotH;

    // ── Color at point i ───────────────────────────────────────────────
    const s1 = dangerScore(rawVals[i], sensorKey);
    const c1 = dangerColor(s1);

    // ── Color at point i+1 ─────────────────────────────────────────────
    const s2 = dangerScore(rawVals[i + 1], sensorKey);
    const c2 = dangerColor(s2);

    const col1 = `rgb(
      ${Math.floor(c1.r * 255)},
      ${Math.floor(c1.g * 255)},
      ${Math.floor(c1.b * 255)}
    )`;

    const col2 = `rgb(
      ${Math.floor(c2.r * 255)},
      ${Math.floor(c2.g * 255)},
      ${Math.floor(c2.b * 255)}
    )`;

    // ── Smooth gradient between points ────────────────────────────────
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);

    grad.addColorStop(0, col1);
    grad.addColorStop(1, col2);

    ctx.strokeStyle = grad;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

function axes() {
  ctx.strokeStyle = "#FFF";
  ctx.lineWidth = 1;

  ctx.beginPath();

  // Y axis
  ctx.moveTo(100, 80);
  ctx.lineTo(100, innerHeight - 100);

  // X axis
  ctx.lineTo(innerWidth - 80, innerHeight - 100);

  ctx.stroke();
}

function grid() {
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 10; i++) {
    const y = 80 + ((innerHeight - 180) / 10) * i;

    ctx.beginPath();
    ctx.moveTo(100, y);
    ctx.lineTo(innerWidth - 80, y);
    ctx.stroke();
  }
}

function ticks(YF, ZF, currentCycle) {
  const plotW = innerWidth - 220;
  const plotH = innerHeight - 220;

  ctx.font = "13px IBM Plex Mono";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;

  // ── X axis ticks (time) ───────────────────────────────────────────────
  for (let i = 0; i <= 5; i++) {
    const frac = i / 5;

    const x = 100 + frac * plotW;
    const y = innerHeight - 100;

    // tick mark
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + 8);
    ctx.stroke();

    // label
    const t = Math.round(frac * 59);

    ctx.fillText(String(t), x - 6, y + 24);
  }

  // ── Y axis ticks ──────────────────────────────────────────────────────
  for (let i = 0; i <= 5; i++) {
    const frac = i / 5;

    const x = 100;
    const y = innerHeight - 100 - frac * plotH;

    // tick mark
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    const val = fmtTick(YF, frac, currentCycle);

    ctx.fillText(val, 42, y + 4);
  }
}

export function draw2DTrail(xs, ys, zs, rawY, rawZ, YF, ZF, currentCycle) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  grid();
  axes();
  ticks(YF, ZF, currentCycle);

  // ── Sensor curves ───────────────────────────────────────────────
  gradientLine(xs, ys, rawY, YF, 2.5);
  gradientLine(xs, zs, rawZ, ZF, 2.5);

  // ── Labels next to line endings ─────────────────────────────────
  const plotW = innerWidth - 220;
  const plotH = innerHeight - 220;

  function endPoint(x, y) {
    return {
      px: 100 + (x / AL) * plotW,
      py: innerHeight - 100 - (y / AL) * plotH,
    };
  }

  const yEnd = endPoint(xs[xs.length - 1], ys[ys.length - 1]);
  const zEnd = endPoint(xs[xs.length - 1], zs[zs.length - 1]);

  ctx.font = "18px IBM Plex Mono";

  // Y label
  {
    const score = dangerScore(rawY[rawY.length - 1], YF);
    const c = dangerColor(score);

    ctx.fillStyle = `rgb(
      ${Math.floor(c.r * 255)},
      ${Math.floor(c.g * 255)},
      ${Math.floor(c.b * 255)}
    )`;

    ctx.fillText(YF, yEnd.px + 12, yEnd.py + 4);
  }

  // Z label
  {
    const score = dangerScore(rawZ[rawZ.length - 1], ZF);
    const c = dangerColor(score);

    ctx.fillStyle = `rgb(
      ${Math.floor(c.r * 255)},
      ${Math.floor(c.g * 255)},
      ${Math.floor(c.b * 255)}
    )`;

    ctx.fillText(ZF, zEnd.px + 12, zEnd.py - 8);
  }

  // X label
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Time", innerWidth - 120, innerHeight - 60);
}
