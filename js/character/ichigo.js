import { angleTo } from "./util.js";

const ICHIGO_RADIUS = 30;

const portrait = loadPortrait("../../assets/ichigo/ichigo.png?v=1");
const portraitListeners = [];
let portraitReady = false;

function loadPortrait(file) {
  const img = new Image();
  img.onload = () => {
    portraitReady = true;
    for (const fn of portraitListeners) fn();
  };
  img.src = new URL(file, import.meta.url).href;
  return img;
}

export function onPortraits(fn) {
  portraitListeners.push(fn);
  if (portraitReady) fn();
}

export const ichigo = {
  id: "ichigo",
  name: "쿠로사키 이치고",
  en: "KUROSAKI ICHIGO",
  hp: 200,
  speed: 160,
  radius: ICHIGO_RADIUS,
  color: "#ff6a1a",
  highlight: "#ffe0b0",
  shade: "#1a120e",
  /** ========== 월아천충 ========== */
  getsugaCharge: 0,
  getsugaCooldown: 3,
  getsugaDamage: 16,
  getsugaThrowSpeed: 780,
  getsugaKnockbackForce: 160,
  getsugaTrack: true,
  getsugaTelegraph: false,
  /** 월아천충이 맞히는 원의 기준 반지름. 그려지는 참격은 이 원보다 크다 */
  getsugaRadius: 36,
  initCds(ball) {
    ball.cds = { getsuga: 0 };
  },
  readySkill(ball) {
    return (ball.cds.getsuga ?? 0) <= 0 ? "getsuga" : null;
  },
  release(ball, enemy, api) {
    const ang = ball.aim ?? angleTo(ball, enemy);
    const dist = ball.r + api.S(this.getsugaRadius) * 0.35;
    const speed = api.S(this.getsugaThrowSpeed);
    api.spawn({
      kind: "getsuga",
      x: ball.x + Math.cos(ang) * dist,
      y: ball.y + Math.sin(ang) * dist,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      r: api.S(this.getsugaRadius),
      damage: this.getsugaDamage,
      force: api.S(this.getsugaKnockbackForce),
      life: 1.2,
      max: 1.2,
      owner: ball.i,
      color: "#7ef6ff",
    });
    api.sfx("shot");
    ball.mode = "idle";
  },
};

export function drawIchigo(ctx, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  if (portrait.complete && portrait.naturalWidth > 0) {
    const sw = portrait.naturalWidth;
    const sh = portrait.naturalHeight;
    const side = sw * 0.52;
    const sx = (sw - side) / 2;
    const sy = sh * 0.045;
    ctx.drawImage(portrait, sx, sy, side, side, -r, -r, r * 2, r * 2);
  } else {
    ctx.fillStyle = "#ff6a1a";
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  const shade = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.15, 0, 0, r);
  shade.addColorStop(0, "rgba(255,255,255,.16)");
  shade.addColorStop(0.58, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.fillStyle = shade;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
  ctx.lineWidth = Math.max(2.5, r * 0.085);
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, r - ctx.lineWidth * 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.25, r * 0.035);
  ctx.strokeStyle = "rgba(0,0,0,.6)";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawGetsuga(ctx, p) {
  const fade = Math.max(0, p.life / (p.max || 1));
  const ang = Math.atan2(p.vy, p.vx);
  const reach = p.r * 2.5;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(ang);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = fade;
  const cuts = [
    [-0.95, 0.42, 0.15, -0.55, 1.25, 0.08, 0.34, "rgba(40, 120, 255, 0.45)"],
    [-0.9, 0.34, 0.2, -0.42, 1.2, 0.02, 0.2, "rgba(70, 210, 255, 0.82)"],
    [-0.72, 0.26, 0.28, -0.28, 1.05, -0.02, 0.08, "rgba(210, 250, 255, 0.95)"],
    [-0.55, 0.18, 0.35, -0.16, 0.9, -0.04, 0.03, "rgba(255, 255, 255, 1)"],
    [-0.35, -0.08, 0.45, -0.62, 1.05, -0.28, 0.045, "rgba(180, 245, 255, 0.7)"],
    [-0.2, 0.55, 0.55, 0.08, 1.15, 0.22, 0.04, "rgba(90, 190, 255, 0.65)"],
  ];
  for (const cut of cuts) {
    paintSlash(ctx, reach, cut[0], cut[1], cut[2], cut[3], cut[4], cut[5], reach * cut[6], cut[7]);
  }
  ctx.restore();
}

function paintSlash(ctx, reach, x0, y0, x1, y1, x2, y2, width, color) {
  const steps = 22;
  const left = [];
  const right = [];
  const p0 = [x0 * reach, y0 * reach];
  const p1 = [x1 * reach, y1 * reach];
  const p2 = [x2 * reach, y2 * reach];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
    const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const blade = Math.sin(Math.PI * t) ** 0.72 * width;
    left.push([x + nx * blade, y + ny * blade]);
    right.push([x - nx * blade, y - ny * blade]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i += 1) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i -= 1) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
