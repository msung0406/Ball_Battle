export const phantom = {
  id: "phantom",
  name: "팬텀",
  en: "PHANTOM",
  hp: 96,
  speed: 216.9,
  radius: 20.8,
  color: "#a978ff",
  highlight: "#f4e9ff",
  shade: "#3a1878",
  blinkCharge: 0.2,
  blinkCooldown: 2.05,
  blinkDamage: 13,
  blinkThrowSpeed: 193.8,
  blinkTrack: false,
  blinkTelegraph: false,
  /** 점멸한 뒤 유지되는 무적 시간 */
  blinkInvuln: 0.3,
  initCds(ball) {
    ball.cds = { blink: 0 };
  },
  readySkill(ball) {
    return (ball.cds.blink ?? 0) <= 0 ? "blink" : null;
  },
  release(ball, enemy, api) {
    const speed = api.S(this.blinkThrowSpeed);
    const ang = Number.isFinite(ball.aim) ? ball.aim : Math.random() * Math.PI * 2;
    api.spawn({
      kind: "homing",
      x: ball.x,
      y: ball.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed,
      turn: 3.5,
      r: api.S(8.1),
      damage: this.blinkDamage,
      force: api.S(115.4),
      life: 2.8,
      arm: 0.24,
      owner: ball.i,
      color: this.highlight,
      glow: this.color,
      hist: [],
    });
    const spot = api.randomPoint(ball.r, enemy);
    ball.x = spot.x;
    ball.y = spot.y;
    ball.vx *= 0.12;
    ball.vy *= 0.12;
    ball.phase = this.blinkInvuln;
    ball.mode = "idle";
    api.sfx("blink");
  },
};

export function drawPhantom(ctx, r) {
  ctx.save();
  ctx.globalAlpha *= 0.9;
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.beginPath();
  ctx.arc(-r * 0.12, -r * 0.08, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
