import { drawHeldRasengan, drawNaruto, drawWeapon, naruto, onPortraits } from "./naruto.js?v=81";
import { nova } from "./nova.js?v=9";

export { drawWeapon, onPortraits };

export const roster = [nova, naruto];

const byId = new Map(roster.map((c) => [c.id, c]));

export function getCharacter(id) {
  return byId.get(id);
}

export function drawCharacter(ctx, char, o) {
  const { x, y, r } = o;
  const look = o.look ?? 0;
  const alpha = o.alpha ?? 1;
  const flash = o.flash ?? 0;
  const skill = o.skill ?? 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;

  if (o.skillOnly) {
    if (char.id === "naruto" && skill > 0) drawHeldRasengan(ctx, r, o.aim ?? 0, skill);
    ctx.restore();
    return;
  }

  if (char.id === "naruto") {
    drawNaruto(ctx, r, o.hideSkill ? 0 : skill, o.aim ?? 0);
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

    drawEyes(ctx, r, look);
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

function drawEyes(ctx, r, look) {
  const lx = Math.cos(look);
  const ly = Math.sin(look);
  const px = -ly;
  const py = lx;
  const fwd = r * 0.18;
  for (const s of [-1, 1]) {
    const ex = lx * fwd + px * r * 0.28 * s;
    const ey = ly * fwd * 0.75 + py * r * 0.28 * s + r * 0.02;
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
