export const nova = {
  id: "nova",
  name: "노바",
  en: "NOVA",
  attack: "난사 레이저",
  desc: "무작위 방향으로 레이저를 쏜다. 빛은 경기장 벽에서 다섯 번 튕긴 뒤 사라진다.",
  hp: 112,
  speed: 145,
  radius: 20,
  windup: 0.38,
  cooldown: 1.62,
  aggression: 0.28,
  track: false,
  telegraph: true,
  color: "#19d4ef",
  highlight: "#e9fdff",
  shade: "#065e78",
  begin(ball) {
    ball.aim = Math.random() * Math.PI * 2;
  },
  release(ball, enemy, api) {
    const ang = ball.aim ?? Math.random() * Math.PI * 2;
    const pts = api.castLaser(
      ball.x + Math.cos(ang) * (ball.r + api.S(4)),
      ball.y + Math.sin(ang) * (ball.r + api.S(4)),
      ang,
      5,
    );
    for (const foe of api.foes(ball.i)) {
      if (api.polylineHits(pts, foe, api.S(7))) {
        api.damage(foe, 16, ball.x, ball.y, api.S(120), { color: this.color });
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
    ball.cd = this.cooldown;
  },
};
