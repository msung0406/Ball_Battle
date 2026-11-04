import { angleTo } from "./util.js";

export const blaze = {
  id: "blaze",
  name: "블레이즈",
  en: "BLAZE",
  hp: 104,
  speed: 201.9,
  radius: 23.1,
  color: "#ff4b1f",
  highlight: "#ffd27a",
  shade: "#7a1408",
  flameCharge: 0.34,
  flameCooldown: 2.05,
  flameDamage: 17,
  flameDashSpeed: 623.1,
  flameTrack: true,
  flameTelegraph: true,
  /** 화염 돌진이 유지되는 시간 */
  flameDashTime: 0.46,
  /** 화염 돌진이 맞았을 때 상대가 밀려나는 힘 */
  flameKnockback: 219.2,
  initCds(ball) {
    ball.cds = { flame: 0 };
  },
  readySkill(ball) {
    return (ball.cds.flame ?? 0) <= 0 ? "flame" : null;
  },
  release(ball, enemy, api) {
    ball.mode = "dash";
    ball.modeT = this.flameDashTime;
    ball.dashAng = ball.aim ?? angleTo(ball, enemy);
    ball.dashHit = false;
    api.sfx("dash");
  },
  control(ball, _enemy, _dt, api) {
    if (ball.mode !== "dash") return;
    const speed = api.S(this.flameDashSpeed);
    ball.vx = Math.cos(ball.dashAng) * speed;
    ball.vy = Math.sin(ball.dashAng) * speed;
    return "lock";
  },
  afterMove(ball, enemy, dt, api, info) {
    if (ball.mode !== "dash") return;
    const targets = api.foes ? api.foes(ball.i) : [enemy];
    for (const foe of targets) {
      if (Math.hypot(ball.x - foe.x, ball.y - foe.y) >= ball.r + foe.r) continue;
      const landed = api.damage(foe, this.flameDamage, ball.x, ball.y, api.S(this.flameKnockback), {
        color: this.color,
      });
      if (landed) {
        ball.mode = "idle";
        return;
      }
    }
    if (info.wall) {
      ball.mode = "idle";
      return;
    }
    ball.modeT -= dt;
    if (ball.modeT <= 0) ball.mode = "idle";
  },
};
