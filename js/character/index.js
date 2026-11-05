import { drawGetsuga, drawIchigo, ichigo, onPortraits as onIchigoPortraits } from "./ichigo.js?v=6";
import { drawHeldRasengan, drawNaruto, drawWeapon, naruto, onPortraits as onNarutoPortraits } from "./naruto.js?v=81";

export { drawGetsuga, drawWeapon };

export function onPortraits(fn) {
  onNarutoPortraits(fn);
  onIchigoPortraits(fn);
}

export const roster = [naruto, ichigo];

const byId = new Map(roster.map((c) => [c.id, c]));

export function getCharacter(id) {
  return byId.get(id);
}

export function drawCharacter(ctx, char, o) {
  const { x, y, r } = o;
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
  } else if (char.id === "ichigo") {
    drawIchigo(ctx, r);
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
