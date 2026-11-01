import { angleTo } from "./util.js";

export const blaze = {
  id: "blaze",
  name: "블레이즈",
  en: "BLAZE",
  attack: "화염 돌진",
  desc: "힘을 모은 뒤 상대를 향해 곧장 돌진한다. 부딪히면 크게 데고, 벽에 박으면 멈춘다.",
  hp: 104,
  speed: 175,
  radius: 20,
  windup: 0.34,
  cooldown: 2.05,
  aggression: 0.82,
  track: true,
  telegraph: true,
  color: "#ff4b1f",
  highlight: "#ffd27a",
  shade: "#7a1408",
  release(ball, enemy, api) {
    ball.mode = "dash";
    ball.modeT = 0.46;
    ball.dashAng = ball.aim ?? angleTo(ball, enemy);
    ball.dashHit = false;
    ball.pendingCd = this.cooldown;
    api.sfx("dash");
  },
  control(ball, _enemy, _dt, api) {
    if (ball.mode !== "dash") return;
    const speed = api.S(540);
    ball.vx = Math.cos(ball.dashAng) * speed;
    ball.vy = Math.sin(ball.dashAng) * speed;
    return "lock";
  },
  afterMove(ball, enemy, dt, api, info) {
    if (ball.mode !== "dash") return;
    const dist = Math.hypot(ball.x - enemy.x, ball.y - enemy.y);
    if (dist < ball.r + enemy.r) {
      const landed = api.damage(enemy, 17, ball.x, ball.y, api.S(190), { color: this.color });
      if (landed) {
        ball.mode = "idle";
        ball.cd = ball.pendingCd;
        return;
      }
    }
    if (info.wall) {
      ball.mode = "idle";
      ball.cd = ball.pendingCd;
      return;
    }
    ball.modeT -= dt;
    if (ball.modeT <= 0) {
      ball.mode = "idle";
      ball.cd = ball.pendingCd;
    }
  },
};

export function drawBlaze(ctx, r, color) {
  ctx.fillStyle = color;
  for (const i of [-0.34, 0, 0.34]) {
    ctx.beginPath();
    ctx.moveTo(i * r - r * 0.13, -r * 0.58);
    ctx.quadraticCurveTo(i * r, -r * 1.22, i * r + r * 0.13, -r * 0.58);
    ctx.closePath();
    ctx.fill();
  }
}
