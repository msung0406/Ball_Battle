export const nova = {
  id: "nova",
  name: "노바",
  en: "NOVA",
  hp: 112,
  speed: 167.3,
  radius: 23.1,
  color: "#19d4ef",
  highlight: "#e9fdff",
  shade: "#065e78",
  laserCharge: 0.38,
  laserCooldown: 1.62,
  laserDamage: 16,
  laserTrack: false,
  laserTelegraph: true,
  /** 레이저가 맞았을 때 상대가 밀려나는 힘 */
  laserKnockback: 138.5,
  initCds(ball) {
    ball.cds = { laser: 0 };
  },
  readySkill(ball) {
    return (ball.cds.laser ?? 0) <= 0 ? "laser" : null;
  },
  release(ball, _enemy, api) {
    const ang = ball.aim ?? Math.random() * Math.PI * 2;
    const pts = api.castLaser(
      ball.x + Math.cos(ang) * (ball.r + api.S(4.6)),
      ball.y + Math.sin(ang) * (ball.r + api.S(4.6)),
      ang,
      5,
    );
    for (const foe of api.foes(ball.i)) {
      if (api.polylineHits(pts, foe, api.S(8.1))) {
        api.damage(foe, this.laserDamage, ball.x, ball.y, api.S(this.laserKnockback), { color: this.color });
      }
    }
    api.spawn({
      kind: "beam",
      pts,
      life: 0.22,
      max: 0.22,
      color: this.highlight,
      glow: this.color,
      owner: ball.i,
    });
    api.sfx("laser");
    ball.mode = "idle";
  },
};
