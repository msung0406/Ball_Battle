import { angleTo } from "./util.js";

const ICHIGO_RADIUS = 30;

const portrait = loadPortrait("../../assets/ichigo/ichigo.png?v=1");
const sword = loadPortrait("../../assets/ichigo/zangetsu.png?v=2");
const GRIP_X = 0.744;
const GRIP_Y = 0.875;
const TIP_ANG = Math.atan2(-813.743, 39.254);
const TIP_DIST = Math.hypot(39.254, 813.743) / 930;
const PULL = Math.PI / 3;
const SWING = (2 * Math.PI) / 3;
const PULL2 = (2 * Math.PI) / 3;
const SPIN2 = Math.PI * 3;
const FOLLOW2 = Math.PI / 3;
const portraitListeners = [];
let portraitReady = false;

function loadPortrait(file) {
  const img = new Image();
  img.onload = () => {
    portraitReady = true;
    for (const fn of portraitListeners) fn();
  };
  img.src = new URL(file, import.meta.url).href;
  return img;
}

export function onPortraits(fn) {
  portraitListeners.push(fn);
  if (portraitReady) fn();
}

export const ichigo = {
  id: "ichigo",
  name: "쿠로사키 이치고",
  en: "KUROSAKI ICHIGO",
  hp: 1000,
  speed: 200,
  radius: ICHIGO_RADIUS,
  color: "#ff6a1a",
  highlight: "#ffe0b0",
  shade: "#1a120e",
  /** ========== 공격 ========== */
  attackCharge: 0.5,
  attackCooldown: 2,
  attackDamage: 20,
  attackKnockbackSpeed: 600,
  attackRecoilTime: 0.2,
  attackTrack: true,
  /** 공격 사거리 */
  attackSwordSize: 3,
  /** 공격 모션 시간 */
  attackSwing: 0.1,
  attackHold: 0.2,
  attackRecover: 0.1,
  attackDashSpeed: 1200,
  attackDashTime: 0.1,
  /** ========== 공격2 ========== */
  attack2Charge: 1,
  attack2Cooldown: 6,
  attack2Damage: 40,
  attack2KnockbackSpeed: 1600,
  attack2RecoilTime: 0.5,
  attack2Track: true,
  /** 공격2 모션 시간 */
  attack2Swing: 0.2,
  attack2Hold: 0.2,
  attack2Recover: 0.2,
  initCds(ball) {
    ball.cds = { attack: 0, attack2: this.attack2Cooldown };
  },
  readySkill(ball) {
    if ((ball.cds.attack2 ?? 0) <= 0) return "attack2";
    if ((ball.cds.attack ?? 0) <= 0) return "attack";
    return null;
  },
  control(ball, _enemy, dt, api) {
    const slash = ball.slash;
    if (!slash || slash.kind !== "attack" || !(slash.dash > 0)) return;
    slash.dash = Math.max(0, slash.dash - dt);
    const speed = api.S(this.attackDashSpeed);
    ball.vx = Math.cos(slash.aim) * speed;
    ball.vy = Math.sin(slash.aim) * speed;
    return "lock";
  },
  release(ball, enemy) {
    const ang = ball.aim ?? angleTo(ball, enemy);
    ball.aim = ang;
    ball.mode = "slash";
    ball.slash = { kind: ball.attack, aim: ang, age: 0, hurt: [], swung: false };
  },
  afterMove(ball, enemy, dt, api) {
    const slash = ball.slash;
    if (!slash) return;
    if (ball.hp <= 0) {
      ball.slash = null;
      if (ball.mode === "slash") ball.mode = "idle";
      return;
    }
    slash.age += dt;
    if (slash.kind === "attack2") {
      tickAttack2(ball, enemy, api, slash);
      return;
    }
    tickAttack(ball, enemy, api, slash);
  },
  drawTelegraph(ctx, ball, api) {
    if (ball.mode !== "windup") return;
    const reach = swordReach(ball.r);
    const aim = ball.aim;
    if (!(reach > 0) || !Number.isFinite(aim)) return;
    const charge = ball.windupMax > 0 ? 1 - ball.modeT / ball.windupMax : 1;
    const filled = Math.max(0.01, reach * Math.min(1, Math.max(0, charge)));
    ctx.save();
    ctx.translate(ball.x, ball.y);
    if (ball.attack === "attack2") {
      ctx.beginPath();
      ctx.arc(0, 0, filled, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 106, 26, 0.28)";
      ctx.fill();
      ctx.lineWidth = Math.max(2, ball.r * 0.06);
      ctx.strokeStyle = "rgba(255, 214, 170, 0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, reach, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ball.attack === "attack") {
      const half = SWING / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, filled, aim - half, aim + half);
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 106, 26, 0.28)";
      ctx.fill();
      ctx.lineWidth = Math.max(2, ball.r * 0.06);
      ctx.strokeStyle = "rgba(255, 214, 170, 0.9)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, reach, aim - half, aim + half);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.restore();
  },
};

function tickAttack(ball, _enemy, api, slash) {
  if (!slash.swung) {
    slash.swung = true;
    slash.dash = ichigo.attackDashTime;
    api.sfx("shot");
  }
  if (slash.age < ichigo.attackSwing) {
    const reach = swordReach(ball.r);
    if (reach > 0) {
      for (const foe of api.foes(ball.i)) {
        if (slash.hurt.includes(foe) || !foeInCone(ball, foe, slash.aim, reach)) continue;
        slash.hurt.push(foe);
        const ang = Math.atan2(foe.y - ball.y, foe.x - ball.x) || 0;
        if (
          api.damage(foe, ichigo.attackDamage, ball.x, ball.y, 0, {
            ang,
            speed: api.S(ichigo.attackKnockbackSpeed),
            time: ichigo.attackRecoilTime,
            color: "#f4f4f4",
          })
        ) {
          api.shake(16);
        }
      }
    }
  }
  const total = ichigo.attackSwing + ichigo.attackHold + ichigo.attackRecover;
  if (slash.age < total) return;
  ball.slash = null;
  ball.mode = "idle";
}

function tickAttack2(ball, _enemy, api, slash) {
  if (!slash.swung) {
    slash.swung = true;
    api.sfx("shot");
  }
  if (slash.age < ichigo.attack2Swing) {
    const reach = swordReach(ball.r);
    if (reach > 0) {
      for (const foe of api.foes(ball.i)) {
        if (slash.hurt.includes(foe) || !foeInReach(ball, foe, reach)) continue;
        slash.hurt.push(foe);
        const ang = Math.atan2(foe.y - ball.y, foe.x - ball.x) || 0;
        if (
          api.damage(foe, ichigo.attack2Damage, ball.x, ball.y, 0, {
            ang,
            speed: api.S(ichigo.attack2KnockbackSpeed),
            time: ichigo.attack2RecoilTime,
            color: "#f4f4f4",
          })
        ) {
          api.shake(16);
        }
      }
    }
  }
  const total = ichigo.attack2Swing + ichigo.attack2Hold + ichigo.attack2Recover;
  if (slash.age < total) return;
  ball.slash = null;
  ball.mode = "idle";
}

function swordReach(r) {
  return r * (1 + 2 * TIP_DIST * ichigo.attackSwordSize);
}

function foeInCone(ball, foe, aim, reach) {
  const dx = foe.x - ball.x;
  const dy = foe.y - ball.y;
  const dist = Math.hypot(dx, dy);
  if (dist > reach + foe.r) return false;
  let delta = Math.atan2(dy, dx) - aim;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const slack = foe.r / Math.max(dist, 1);
  return Math.abs(delta) <= SWING / 2 + slack;
}

function foeInReach(ball, foe, reach) {
  return Math.hypot(foe.x - ball.x, foe.y - ball.y) <= reach + foe.r;
}

function smooth(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function lerpAngle(from, to, t) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}

export function ichigoSwordAlpha(slash, charge = 0, skillId = null) {
  if (slash) {
    const skill = slash.kind ?? skillId;
    const swing = skill === "attack2" ? ichigo.attack2Swing : ichigo.attackSwing;
    const hold = skill === "attack2" ? ichigo.attack2Hold : ichigo.attackHold;
    const recover = skill === "attack2" ? ichigo.attack2Recover : ichigo.attackRecover;
    const holdEnd = swing + hold;
    if (slash.age <= holdEnd) return 1;
    if (!(recover > 0)) return 0;
    return Math.max(0, 1 - (slash.age - holdEnd) / recover);
  }
  if (charge > 0) return Math.min(1, Math.max(0, charge));
  return 0;
}

export function ichigoSwordAngle(aim, slash, charge = 0, skillId = null) {
  const skill = slash?.kind ?? skillId;
  if (slash) {
    if (skill === "attack2") {
      const swingEnd = ichigo.attack2Swing;
      const holdEnd = swingEnd + ichigo.attack2Hold;
      const follow = slash.aim - FOLLOW2;
      if (slash.age <= swingEnd) {
        const t = swingEnd > 0 ? slash.age / swingEnd : 1;
        /** 끝에서 팡 하고 멈추도록 강한 ease-out */
        const e = 1 - (1 - Math.min(1, t)) ** 4;
        return slash.aim + PULL2 - SPIN2 * e;
      }
      if (slash.age <= holdEnd) return follow;
      const t = (slash.age - holdEnd) / ichigo.attack2Recover;
      return lerpAngle(follow, aim, smooth(t));
    }
    const swingEnd = ichigo.attackSwing;
    const holdEnd = swingEnd + ichigo.attackHold;
    const follow = slash.aim + PULL - SWING;
    if (slash.age <= swingEnd) {
      const t = swingEnd > 0 ? slash.age / swingEnd : 1;
      const e = 1 - (1 - Math.min(1, t)) ** 3;
      return slash.aim + PULL - SWING * e;
    }
    if (slash.age <= holdEnd) return follow;
    const t = (slash.age - holdEnd) / ichigo.attackRecover;
    return lerpAngle(follow, aim, smooth(t));
  }
  if (charge > 0) {
    const pull = skill === "attack2" ? PULL2 : PULL;
    return aim + pull * smooth(charge);
  }
  return aim;
}

export function drawIchigo(ctx, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  if (portrait.complete && portrait.naturalWidth > 0) {
    const sw = portrait.naturalWidth;
    const sh = portrait.naturalHeight;
    const side = sw * 0.52;
    const sx = (sw - side) / 2;
    const sy = sh * 0.045;
    ctx.drawImage(portrait, sx, sy, side, side, -r, -r, r * 2, r * 2);
  } else {
    ctx.fillStyle = "#ff6a1a";
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  const shade = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.15, 0, 0, r);
  shade.addColorStop(0, "rgba(255,255,255,.16)");
  shade.addColorStop(0.58, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.fillStyle = shade;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
  ctx.lineWidth = Math.max(2.5, r * 0.085);
  ctx.strokeStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, r - ctx.lineWidth * 0.35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.25, r * 0.035);
  ctx.strokeStyle = "rgba(0,0,0,.6)";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawIchigoSword(ctx, r, ang, alpha = 1) {
  if (!(alpha > 0) || !sword.complete || sword.naturalWidth <= 0 || !Number.isFinite(ang)) return;
  const len = r * 2 * ichigo.attackSwordSize;
  const scale = len / sword.naturalHeight;
  const w = sword.naturalWidth * scale;
  const h = len;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(Math.cos(ang) * r, Math.sin(ang) * r);
  ctx.rotate(ang - TIP_ANG);
  ctx.drawImage(sword, -GRIP_X * w, -GRIP_Y * h, w, h);
  ctx.restore();
}

export function drawGetsuga(ctx, p) {
  const fade = Math.max(0, p.life / (p.max || 1));
  const ang = Math.atan2(p.vy, p.vx);
  const reach = p.r * 2.5;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(ang);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = fade;
  const cuts = [
    [-0.95, 0.42, 0.15, -0.55, 1.25, 0.08, 0.34, "rgba(40, 120, 255, 0.45)"],
    [-0.9, 0.34, 0.2, -0.42, 1.2, 0.02, 0.2, "rgba(70, 210, 255, 0.82)"],
    [-0.72, 0.26, 0.28, -0.28, 1.05, -0.02, 0.08, "rgba(210, 250, 255, 0.95)"],
    [-0.55, 0.18, 0.35, -0.16, 0.9, -0.04, 0.03, "rgba(255, 255, 255, 1)"],
    [-0.35, -0.08, 0.45, -0.62, 1.05, -0.28, 0.045, "rgba(180, 245, 255, 0.7)"],
    [-0.2, 0.55, 0.55, 0.08, 1.15, 0.22, 0.04, "rgba(90, 190, 255, 0.65)"],
  ];
  for (const cut of cuts) {
    paintSlash(ctx, reach, cut[0], cut[1], cut[2], cut[3], cut[4], cut[5], reach * cut[6], cut[7]);
  }
  ctx.restore();
}

function paintSlash(ctx, reach, x0, y0, x1, y1, x2, y2, width, color) {
  const steps = 22;
  const left = [];
  const right = [];
  const p0 = [x0 * reach, y0 * reach];
  const p1 = [x1 * reach, y1 * reach];
  const p2 = [x2 * reach, y2 * reach];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
    const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    const dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const blade = Math.sin(Math.PI * t) ** 0.72 * width;
    left.push([x + nx * blade, y + ny * blade]);
    right.push([x - nx * blade, y - ny * blade]);
  }
  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i += 1) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i -= 1) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
