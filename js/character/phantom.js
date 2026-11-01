export const phantom = {
  id: "phantom",
  name: "팬텀",
  en: "PHANTOM",
  attack: "위상 잔상",
  desc: "그 자리에 따라붙는 영혼탄을 남기고, 다른 위치로 모습을 지운 채 이동한다.",
  hp: 96,
  speed: 188,
  radius: 18,
  windup: 0.2,
  cooldown: 2.05,
  aggression: 0.22,
  track: false,
  telegraph: false,
  color: "#a978ff",
  highlight: "#f4e9ff",
  shade: "#3a1878",
  release(ball, enemy, api) {
    const speed = api.S(168);
    const ang = Math.random() * Math.PI * 2;
    api.spawn({
      kind: "homing",
      x: ball.x,
      y: ball.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      speed,
      turn: 3.5,
      r: api.S(7),
      damage: 13,
      force: api.S(100),
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
    ball.phase = 0.3;
    ball.mode = "idle";
    ball.cd = this.cooldown;
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
