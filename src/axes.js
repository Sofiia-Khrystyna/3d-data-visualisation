import * as THREE from "three";

export const AXIS_LENGTH = 10;
const TICK_COUNT = 5;

export function buildAxes(group, fieldStats, xField, yField, zField) {
  const mat = (color) =>
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 });

  const line = (from, to, color) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...from), new THREE.Vector3(...to),
    ]);
    return new THREE.Line(geo, mat(color));
  };

  group.add(line([0,0,0], [AXIS_LENGTH+0.5,0,0], 0xf87171));
  group.add(line([0,0,0], [0,AXIS_LENGTH+0.5,0], 0x4ade80));
  group.add(line([0,0,0], [0,0,AXIS_LENGTH+0.5], 0x60a5fa));

  // Floor grid
  const grid = new THREE.GridHelper(AXIS_LENGTH, 10, 0x1e3a5f, 0x1a2a3a);
  grid.position.set(AXIS_LENGTH/2, 0, AXIS_LENGTH/2);
  group.add(grid);

  // Back wall grids
  const wallMat = new THREE.LineBasicMaterial({ color: 0x151f2b, transparent: true, opacity: 0.35 });
  for (let i = 0; i <= 10; i++) {
    const t = (i / 10) * AXIS_LENGTH;
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(t,0,0), new THREE.Vector3(t,AXIS_LENGTH,0)]), wallMat));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,t,0), new THREE.Vector3(AXIS_LENGTH,t,0)]), wallMat));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,t,0), new THREE.Vector3(0,t,AXIS_LENGTH)]), wallMat));
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,t), new THREE.Vector3(0,AXIS_LENGTH,t)]), wallMat));
  }

  const tickMat = new THREE.LineBasicMaterial({ color: 0x2a4060, transparent: true, opacity: 0.8 });
  const TICK_SIZE = 0.18;

  const addTickLabel = (text, pos, color) => {
    const cv = document.createElement("canvas");
    cv.width = 256; cv.height = 48;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, 256, 48);
    ctx.font = '500 18px "DM Sans", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 128, 24);
    const tex = new THREE.CanvasTexture(cv);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(1.4, 0.26, 1);
    sprite.position.set(...pos);
    group.add(sprite);
  };

  const fmtTick = (field, frac) => {
    if (!fieldStats || !fieldStats[field]) return frac.toFixed(1);
    const { min, max } = fieldStats[field];
    const val = min + frac * (max - min);
    return Math.abs(val) >= 1000 ? (val/1000).toFixed(1)+"k" : val.toFixed(1);
  };

  for (let i = 0; i <= TICK_COUNT; i++) {
    const t = (i / TICK_COUNT) * AXIS_LENGTH;
    const frac = i / TICK_COUNT;
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(t,-TICK_SIZE,0), new THREE.Vector3(t,TICK_SIZE,0)]), tickMat));
    addTickLabel(fmtTick(xField, frac), [t, -0.55, 0], "#f87171");
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-TICK_SIZE,t,0), new THREE.Vector3(TICK_SIZE,t,0)]), tickMat));
    addTickLabel(fmtTick(yField, frac), [-1.1, t, 0], "#4ade80");
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-TICK_SIZE,0,t), new THREE.Vector3(TICK_SIZE,0,t)]), tickMat));
    addTickLabel(fmtTick(zField, frac), [0, -0.55, t], "#60a5fa");
  }
}

export function buildAxisLabels(group, [xLabel, yLabel, zLabel]) {
  const OFFSET = 1.4;
  const defs = [
    { text: xLabel, pos: [AXIS_LENGTH + OFFSET, -0.3, 0],    color: "#f87171" },
    { text: yLabel, pos: [-OFFSET * 1.2, AXIS_LENGTH + 1.0, 0], color: "#4ade80" },
    { text: zLabel, pos: [0, -0.3, AXIS_LENGTH + OFFSET],    color: "#60a5fa" },
  ];
  defs.forEach(({ text, pos, color }) => {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 64;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, 512, 64);
    ctx.font = 'bold 20px "DM Sans", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const short = text.length > 30 ? text.substring(0,28)+"…" : text;
    ctx.fillText(short, 6, 32);
    const tex = new THREE.CanvasTexture(cv);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sprite.scale.set(3.0, 0.38, 1);
    sprite.position.set(...pos);
    group.add(sprite);
  });
}
