export const titan = {
  id: "titan",
  name: "타이탄",
  en: "TITAN",
  hp: 170,
  speed: 106.2,
  radius: 32.3,
  color: "#8b97ab",
  highlight: "#f3f6fb",
  shade: "#2c3342",
  band: "#e6b84e",
  eyeShift: -0.36,
  shockCharge: 0.52,
  shockCooldown: 2.75,
  shockDamage: 20,
  shockTrack: false,
  shockTelegraph: false,
  initCds(ball) {
    ball.cds = { shock: 0 };
  },
  readySkill(ball) {
    return (ball.cds.shock ?? 0) <= 0 ? "shock" : null;
  },
  release(ball, _enemy, api) {
    api.spawn({
      kind: "ring",
      x: ball.x,
      y: ball.y,
      radius: ball.r + api.S(6.9),
      prev: ball.r,
      grow: api.S(496.2),
      maxR: api.S(198.5),
      damage: this.shockDamage,
      force: api.S(288.5),
      owner: ball.i,
      color: this.band,
      didHit: false,
      life: 1,
    });
    api.sfx("pulse");
    ball.mode = "idle";
  },
};

export function drawTitan(ctx, r, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(-r, -r * 0.18, r * 2, r * 0.36);
  ctx.fillStyle = "#2a2418";
  for (const x of [-0.55, 0, 0.55]) {
    ctx.beginPath();
    ctx.arc(x * r, 0, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
