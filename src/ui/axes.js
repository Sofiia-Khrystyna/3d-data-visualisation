import * as THREE from "three";
import { SENSORS, AL } from "../../constants.js";
import { fmtTick } from "../utils/data.js";

export function buildAxes(AG, XF, YF, ZF, cyc) {
  const lm = (c) =>
    new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.65 });
  const ln = (a, b, c) =>
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...a),
        new THREE.Vector3(...b),
      ]),
      lm(c),
    );
  AG.add(ln([0, 0, 0], [AL + 0.6, 0, 0], 0xf87171));
  AG.add(ln([0, 0, 0], [0, AL + 0.6, 0], 0x4ade80));
  AG.add(ln([0, 0, 0], [0, 0, AL + 0.6], 0x60a5fa));
  const gh = new THREE.GridHelper(AL, 10, 0x1e3a5f, 0x1a2a3a);
  gh.position.set(AL / 2, 0, AL / 2);
  AG.add(gh);
  const wm = new THREE.LineBasicMaterial({
    color: 0x141e2b,
    transparent: true,
    opacity: 0.25,
  });
  for (let i = 0; i <= 10; i++) {
    const t = (i / 10) * AL;
    const s = (a, b) =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(...a),
          new THREE.Vector3(...b),
        ]),
        wm,
      );
    AG.add(s([t, 0, 0], [t, AL, 0]));
    AG.add(s([0, t, 0], [AL, t, 0]));
    AG.add(s([0, t, 0], [0, t, AL]));
    AG.add(s([0, 0, t], [0, AL, t]));
  }
  const tm = new THREE.LineBasicMaterial({
    color: 0x2a4060,
    transparent: true,
    opacity: 0.8,
  });
  const T = 0.18;
  const tick = (a, b) =>
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...a),
        new THREE.Vector3(...b),
      ]),
      tm,
    );
  const mkSp = (text, pos, col) => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 48;
    const cx = cv.getContext("2d");
    cx.clearRect(0, 0, 256, 48);
    cx.font = '500 32px "IBM Plex Mono",monospace';
    cx.fillStyle = col;
    cx.textAlign = "center";
    cx.textBaseline = "middle";
    cx.fillText(text, 128, 24);
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthTest: false,
      }),
    );
    sp.scale.set(1.5, 0.28, 1);
    sp.position.set(...pos);
    AG.add(sp);
  };
  const mkLbl = (text, pos, col) => {
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 64;
    const cx = cv.getContext("2d");
    cx.clearRect(0, 0, 512, 64);
    cx.font = 'bold 40px "Outfit",sans-serif';
    cx.fillStyle = col;
    cx.textAlign = "left";
    cx.textBaseline = "middle";
    cx.fillText(text.length > 28 ? text.slice(0, 26) + "…" : text, 6, 32);
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthTest: false,
      }),
    );
    sp.scale.set(2.8, 0.36, 1);
    sp.position.set(...pos);
    AG.add(sp);
  };
  for (let i = 0; i <= 5; i++) {
    const t = (i / 5) * AL,
      f = i / 5;
    AG.add(tick([t, -T, 0], [t, T, 0]));
    mkSp(fmtTick(XF, f, cyc), [t, -0.65, 0], "#f87171");
    AG.add(tick([-T, t, 0], [T, t, 0]));
    mkSp(fmtTick(YF, f, cyc), [-1.3, t, 0], "#4ade80");
    AG.add(tick([-T, 0, t], [T, 0, t]));
    mkSp(fmtTick(ZF, f, cyc), [0, -0.65, t], "#60a5fa");
  }
  const xl = SENSORS.find((o) => o.v === XF)?.l || XF;
  const yl = SENSORS.find((o) => o.v === YF)?.l || YF;
  const zl = SENSORS.find((o) => o.v === ZF)?.l || ZF;
  mkLbl(xl, [AL + 1.6, -0.3, 0], "#f87171");
  mkLbl(yl, [-2.2, AL + 1.2, 0], "#4ade80");
  mkLbl(zl, [0, -0.3, AL + 1.6], "#60a5fa");
}
