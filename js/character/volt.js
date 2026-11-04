import { angleTo } from "./util.js";

export const volt = {
  id: "volt",
  name: "볼트",
  en: "VOLT",
  hp: 86,
  speed: 248.1,
  radius: 19.6,
  color: "#ffd230",
  highlight: "#fff6c8",
  shade: "#a36b00",
  burstCharge: 0.14,
  burstCooldown: 1.22,
  burstDamage: 7,
  burstThrowSpeed: 450,
  burstTrack: true,
  burstTelegraph: true,
  initCds(ball) {
    ball.cds = { burst: 0 };
  },
  readySkill(ball) {
    return (ball.cds.burst ?? 0) <= 0 ? "burst" : null;
  },
  release(ball, enemy, api) {
    const base = ball.aim ?? angleTo(ball, enemy);
    const speed = api.S(this.burstThrowSpeed);
    for (const off of [-0.28, 0, 0.28]) {
      const ang = base + off;
      api.spawn({
        kind: "bullet",
        x: ball.x + Math.cos(ang) * (ball.r + api.S(9.2)),
        y: ball.y + Math.sin(ang) * (ball.r + api.S(9.2)),
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r: api.S(5.2),
        damage: this.burstDamage,
        force: api.S(80.8),
        life: 2.15,
        bounces: 3,
        owner: ball.i,
        color: this.highlight,
        glow: this.color,
      });
    }
    api.sfx("shot");
    ball.mode = "idle";
  },
};

export function drawVolt(ctx, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,.92)";
  ctx.lineWidth = r * 0.13;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-r * 0.08, -r * 0.5);
  ctx.lineTo(r * 0.16, -r * 0.05);
  ctx.lineTo(-r * 0.1, -r * 0.05);
  ctx.lineTo(r * 0.12, r * 0.52);
  ctx.stroke();
  ctx.restore();
}
