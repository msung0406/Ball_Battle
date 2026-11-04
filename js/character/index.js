/**
 * 공 목록.
 * 새 공은 이 폴더에 파일을 만들고 roster에 넣는다.
 * 수치는 경기장 한 변이 600px일 때의 기준값이다.
 * 기술 수치는 기술 이름에 붙인다.
 * 기술명Charge는 차지 시간(초), 기술명Cooldown은 쿨타임(초), 기술명Damage는 피해,
 * 기술명DashSpeed는 돌진 속도, 기술명ThrowSpeed는 투사체 속도다.
 * 기술명Track이 true면 차지하는 동안 적을 따라 조준하고, false면 무작위 방향으로 한 번 조준한다.
 * 기술명Telegraph가 true면 그 조준 방향을 점선으로 보여 준다.
 * 쿨타임은 적힌 초 그대로이고, 그 기술이 발동한 뒤부터 줄어든다.
 * 그 외 그 기술에만 쓰는 값에는 주석으로 뜻을 적는다.
 */

import { blaze } from "./blaze.js?v=40";
import { drawNaruto, drawSkillOrb, drawWeapon, naruto, onPortraits } from "./naruto.js?v=63";
import { nova } from "./nova.js?v=8";
import { drawPhantom, phantom } from "./phantom.js?v=5";
import { drawTitan, titan } from "./titan.js?v=5";
import { drawVolt, volt } from "./volt.js?v=5";

export { drawSkillOrb, drawWeapon, onPortraits };

export const roster = [blaze, nova, volt, titan, phantom, naruto];

const byId = new Map(roster.map((c) => [c.id, c]));

export function getCharacter(id) {
  return byId.get(id);
}

const marks = {
  volt: (ctx, r) => drawVolt(ctx, r),
  titan: (ctx, r, char) => drawTitan(ctx, r, char.band),
  phantom: (ctx, r) => drawPhantom(ctx, r),
};

export function drawCharacter(ctx, char, o) {
  const { x, y, r } = o;
  const look = o.look ?? 0;
  const alpha = o.alpha ?? 1;
  const flash = o.flash ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  if (o.squash) {
    ctx.rotate(o.squash.ang);
    ctx.scale(1 + o.squash.amount, 1 - o.squash.amount * 0.82);
    ctx.rotate(-o.squash.ang);
  }

  if (char.id === "naruto") {
    drawNaruto(ctx, r, o.skill ?? 0, o.aim ?? 0);
  } else {
    const body = ctx.createRadialGradient(-r * 0.38, -r * 0.42, r * 0.08, 0, 0, r);
    body.addColorStop(0, char.highlight);
    body.addColorStop(0.42, char.color);
    body.addColorStop(1, char.shade);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.055);
    ctx.strokeStyle = "rgba(0,0,0,.4)";
    ctx.stroke();

    marks[char.id]?.(ctx, r, char);
    drawEyes(ctx, r, look, (char.eyeShift ?? 0) * r);
    drawSpec(ctx, r);
  }

  if (flash > 0) {
    ctx.globalAlpha = alpha * Math.min(0.48, flash / 0.22 * 0.48);
    ctx.fillStyle = "#ff2438";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (o.ko) {
    ctx.globalAlpha = alpha * 0.45;
    ctx.fillStyle = "#12060a";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEyes(ctx, r, look, yShift = 0) {
  const lx = Math.cos(look);
  const ly = Math.sin(look);
  const px = -ly;
  const py = lx;
  const fwd = r * 0.18;
  for (const s of [-1, 1]) {
    const ex = lx * fwd + px * r * 0.28 * s;
    const ey = ly * fwd * 0.75 + py * r * 0.28 * s + r * 0.02 + yShift;
    ctx.fillStyle = "#1a1020";
    ctx.beginPath();
    ctx.ellipse(ex, ey, r * 0.15, r * 0.17, look, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(ex + r * 0.045, ey - r * 0.05, r * 0.045, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSpec(ctx, r) {
  const g = ctx.createRadialGradient(-r * 0.34, -r * 0.4, r * 0.02, -r * 0.2, -r * 0.28, r * 0.62);
  g.addColorStop(0, "rgba(255,255,255,.8)");
  g.addColorStop(0.45, "rgba(255,255,255,.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
}
