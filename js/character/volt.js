import { angleTo } from "./util.js";

export const volt = {
  id: "volt",
  name: "볼트",
  en: "VOLT",
  attack: "삼연탄",
  desc: "상대를 향해 탄환 세 발을 퍼붓는다. 탄환은 벽에 튕기다가 수명이 다하면 사라진다.",
  hp: 86,
  speed: 215,
  radius: 17,
  windup: 0.14,
  cooldown: 1.22,
  aggression: 0.48,
  track: true,
  telegraph: true,
  color: "#ffd230",
  highlight: "#fff6c8",
  shade: "#a36b00",
  release(ball, enemy, api) {
    const base = ball.aim ?? angleTo(ball, enemy);
    const speed = api.S(390);
    for (const off of [-0.28, 0, 0.28]) {
      const ang = base + off;
      api.spawn({
        kind: "bullet",
        x: ball.x + Math.cos(ang) * (ball.r + api.S(8)),
        y: ball.y + Math.sin(ang) * (ball.r + api.S(8)),
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r: api.S(4.5),
        damage: 7,
        force: api.S(70),
        life: 2.15,
        bounces: 3,
        owner: ball.i,
        color: this.highlight,
        glow: this.color,
      });
    }
    api.sfx("shot");
    ball.mode = "idle";
    ball.cd = this.cooldown;
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
