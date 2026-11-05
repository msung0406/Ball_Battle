import { drawGetsuga, drawIchigo, drawIchigoSword, ichigo, ichigoSwordAlpha, ichigoSwordAngle, onPortraits as onIchigoPortraits } from "./ichigo.js?v=19";
import { drawHeldRasengan, drawNaruto, drawWeapon, naruto, onPortraits as onNarutoPortraits } from "./naruto.js?v=82";

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

  if (o.swordOnly) {
    if (char.id === "ichigo") {
      const swordA = ichigoSwordAlpha(o.slash, skill, o.attack);
      drawIchigoSword(ctx, r, ichigoSwordAngle(o.aim ?? 0, o.slash, skill, o.attack), swordA);
    }
    ctx.restore();
    return;
  }

  if (o.skillOnly) {
    if (char.id === "naruto" && skill > 0) drawHeldRasengan(ctx, r, o.aim ?? 0, skill);
    ctx.restore();
    return;
  }

  if (char.id === "naruto") {
    drawNaruto(ctx, r, o.hideSkill ? 0 : skill, o.aim ?? 0);
  } else if (char.id === "ichigo") {
    const face = o.aim ?? o.look;
    const swordA = ichigoSwordAlpha(o.slash, skill, o.attack);
    if (swordA > 0 && Number.isFinite(face)) {
      drawIchigoSword(ctx, r, ichigoSwordAngle(face, o.slash, skill, o.attack), swordA);
    }
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
