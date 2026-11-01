export const titan = {
  id: "titan",
  name: "타이탄",
  en: "TITAN",
  attack: "지진파",
  desc: "느리지만 단단하다. 몸을 중심으로 충격파를 펼쳐 닿는 상대를 밀어낸다.",
  hp: 170,
  speed: 92,
  radius: 28,
  windup: 0.52,
  cooldown: 2.75,
  aggression: 0.62,
  track: false,
  telegraph: false,
  color: "#8b97ab",
  highlight: "#f3f6fb",
  shade: "#2c3342",
  band: "#e6b84e",
  eyeShift: -0.36,
  release(ball, _enemy, api) {
    api.spawn({
      kind: "ring",
      x: ball.x,
      y: ball.y,
      radius: ball.r + api.S(6),
      prev: ball.r,
      grow: api.S(430),
      maxR: api.S(172),
      damage: 20,
      force: api.S(250),
      owner: ball.i,
      color: this.band,
      didHit: false,
      life: 1,
    });
    api.sfx("pulse");
    ball.mode = "idle";
    ball.cd = this.cooldown;
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
