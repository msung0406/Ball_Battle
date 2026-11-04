import { angleTo } from "./util.js";

const NARUTO_RADIUS = 30;
const RASENGAN_R = (15 / 30) * NARUTO_RADIUS;

const AIM_SLIP = (5 * Math.PI) / 180;

const portraits = {
  naruto: loadPortrait("../../assets/naruto/naruto.png?v=6"),
  rasengan: loadPortrait("../../assets/naruto/rasengan.png"),
  kunai: null,
};
const portraitListeners = [];
let portraitsReady = false;

function loadPortrait(file) {
  const img = new Image();
  img.onload = checkPortraits;
  img.src = new URL(file, import.meta.url).href;
  return img;
}

loadCutout("../../assets/naruto/kunai.png", "kunai");
loadCutout("../../assets/naruto/shuriken.png", "shuriken");

function slip(ang) {
  return ang + (Math.random() * 2 - 1) * AIM_SLIP;
}

function isReady(img) {
  if (!img) return false;
  if (img instanceof HTMLCanvasElement) return img.width > 0;
  return img.complete && img.naturalWidth > 0;
}
function loadCutout(file, key) {
  const img = new Image();
  img.onload = () => {
    portraits[key] = cutBackground(img);
    checkPortraits();
  };
  img.src = new URL(file, import.meta.url).href;
}

function cutBackground(img) {
  const src = document.createElement("canvas");
  src.width = img.naturalWidth;
  src.height = img.naturalHeight;
  const sctx = src.getContext("2d");
  sctx.drawImage(img, 0, 0);
  const image = sctx.getImageData(0, 0, src.width, src.height);
  const d = image.data;
  const kr = d[0];
  const kg = d[1];
  const kb = d[2];
  const tol = 36 * 36;
  let minX = src.width;
  let minY = src.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < src.height; y += 1) {
    for (let x = 0; x < src.width; x += 1) {
      const i = (y * src.width + x) * 4;
      const dr = d[i] - kr;
      const dg = d[i + 1] - kg;
      const db = d[i + 2] - kb;
      if (dr * dr + dg * dg + db * db < tol) d[i + 3] = 0;
      else if (d[i + 3] > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  sctx.putImageData(image, 0, 0);
  const cropW = Math.max(1, maxX - minX + 1);
  const cropH = Math.max(1, maxY - minY + 1);
  const out = document.createElement("canvas");
  out.width = cropW;
  out.height = cropH;
  out.getContext("2d").drawImage(src, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
  return out;
}

function checkPortraits() {
  if (!Object.values(portraits).every(isReady)) return;
  portraitsReady = true;
  for (const fn of portraitListeners) fn();
}

export function onPortraits(fn) {
  portraitListeners.push(fn);
  if (portraitsReady) fn();
}

export const naruto = {
  id: "naruto",
  name: "나루토",
  en: "NARUTO",
  hp: 200,
  speed: 180,
  radius: NARUTO_RADIUS,
  color: "#ff7a1a",
  highlight: "#ffe7b0",
  shade: "#7a2208",
  rasenganCharge: 2,
  rasenganCooldown: 2,
  rasenganDamage: 16,
  rasenganDashSpeed: 720,
  rasenganTrack: true,
  rasenganTelegraph: false,
  rasenganRadius: RASENGAN_R,
  /** 나선환 충전 중의 이동 속도 배율 */
  rasenganMoveScale: 0.75,
  /** 나선환 돌진 유지 시간 */
  rasenganDashTime: 0.5,
  kunaiCharge: 0.25,
  kunaiCooldown: 1,
  kunaiDamage: 8,
  kunaiThrowSpeed: 720,
  kunaiTrack: true,
  kunaiTelegraph: false,
  cloneCharge: 0.5,
  cloneCooldown: 8,
  cloneTrack: false,
  cloneTelegraph: false,
  initCds(ball) {
    ball.cds = {
      rasengan: 0,
      kunai: 0,
      clone: this.cloneCooldown,
    };
  },
  readySkill(ball, enemy, api) {
    if ((ball.cds.rasengan ?? 0) <= 0) return "rasengan";
    if ((ball.cds.kunai ?? 0) <= 0) return "kunai";
    if (!ball.clone && enemy.hp > 0 && (ball.cds.clone ?? 0) <= 0 && api.clonesOf(ball).length < 2) {
      return "clone";
    }
    return null;
  },
  start(ball, enemy, api) {
    if (ball.attack === "clone") {
      ball.mode = "kage";
      ball.modeT = this.cloneCharge;
      ball.vx = 0;
      ball.vy = 0;
      castShadowClone(ball, enemy, api);
    }
  },
  moveScale(ball) {
    if (ball.attack === "rasengan") return this.rasenganMoveScale;
    return 1;
  },
  control(ball, _enemy, _dt, api) {
    if (ball.mode === "kage") {
      ball.vx = 0;
      ball.vy = 0;
      return "lock";
    }
    if (ball.mode !== "dash") return;
    const speed = api.S(this.rasenganDashSpeed);
    ball.vx = Math.cos(ball.dashAng) * speed;
    ball.vy = Math.sin(ball.dashAng) * speed;
    return "lock";
  },
  release(ball, enemy, api) {
    const aim = ball.aim ?? angleTo(ball, enemy);
    if (ball.attack === "kunai") {
      const ang = slip(aim);
      const dist = ball.r + api.S(9.2);
      const speed = api.S(this.kunaiThrowSpeed);
      api.spawn({
        kind: "kunai",
        x: ball.x + Math.cos(ang) * dist,
        y: ball.y + Math.sin(ang) * dist,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r: api.S(18.5),
        damage: this.kunaiDamage,
        force: api.S(115.4),
        life: 1.2,
        bounces: 0,
        owner: ball.i,
        color: "#d7dde6",
        shock: "#d7dde6",
        spin: 0,
      });
      ball.mode = "idle";
      api.sfx("shot");
      return;
    }
    ball.mode = "dash";
    ball.modeT = this.rasenganDashTime;
    ball.dashAng = aim;
    ball.aim = aim;
    ball.dashHit = false;
    api.sfx("dash");
  },
  afterMove(ball, _enemy, dt, api, info) {
    if (ball.mode !== "dash") return;
    const orbR = api.S(this.rasenganRadius);
    const dist = ball.r * 0.84;
    const ox = ball.x + Math.cos(ball.dashAng) * dist;
    const oy = ball.y + Math.sin(ball.dashAng) * dist;
    const struck = api.foes(ball.i).find((foe) => {
      const orbHit = Math.hypot(ox - foe.x, oy - foe.y) < orbR * 0.9 + foe.r;
      const bodyHit = Math.hypot(ball.x - foe.x, ball.y - foe.y) < ball.r + foe.r;
      return orbHit || bodyHit;
    });
    if (!ball.dashHit && struck) {
      ball.dashHit = true;
      api.damage(struck, this.rasenganDamage, ox, oy, api.S(253.8), {
        speed: api.S(this.rasenganDashSpeed),
        time: 0.34,
        ang: ball.dashAng,
        color: "#7adfff",
      });
      ball.mode = "idle";
      return;
    }
    if (info?.wall) {
      ball.mode = "idle";
      return;
    }
    ball.modeT -= dt;
    if (ball.modeT <= 0) ball.mode = "idle";
  },
};

function castShadowClone(ball, enemy, api) {
  const need = 2 - api.clonesOf(ball).length;
  if (need <= 0) return;
  api.sfx("pulse");
  api.shake(5);
  const face = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
  const width = api.W();
  for (let n = 0; n < need; n += 1) {
    const side = need === 1 ? (Math.random() < 0.5 ? -1 : 1) : n === 0 ? -1 : 1;
    const ang = face + side * 1.2;
    const clone = api.summonClone(ball);
    const dist = ball.r * 2.45;
    clone.x = Math.max(clone.r, Math.min(width - clone.r, ball.x + Math.cos(ang) * dist));
    clone.y = Math.max(clone.r, Math.min(width - clone.r, ball.y + Math.sin(ang) * dist));
    const speed = clone.baseSpeed || ball.baseSpeed;
    clone.vx = Math.cos(ang) * speed;
    clone.vy = Math.sin(ang) * speed;
    api.cloneBurst(clone.x, clone.y, clone.r);
  }
}

export function drawNaruto(ctx, r, skill = 0, aim = 0) {
  const img = portraits.naruto;

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  const box = portraitBox(img);
  if (box) {
    const scale = Math.max((r * 2) / box.w, (r * 2) / box.h);
    const w = box.w * scale;
    const h = box.h * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = "#ff7a1a";
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  const shade = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.15, 0, 0, r);
  shade.addColorStop(0, "rgba(255,255,255,.2)");
  shade.addColorStop(0.58, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(0,0,0,.4)");
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

  if (skill > 0) drawHeldRasengan(ctx, r, aim, skill);
}
function portraitBox(img) {
  if (!img) return null;
  if (img instanceof HTMLCanvasElement) return img.width > 0 ? { w: img.width, h: img.height } : null;
  if (img.complete && img.naturalWidth > 0) return { w: img.naturalWidth, h: img.naturalHeight };
  return null;
}

function drawHeldRasengan(ctx, ballR, aim, skill) {
  const full = ballR * (RASENGAN_R / NARUTO_RADIUS);
  const orb = full * (0.18 + 0.82 * skill);
  ctx.save();
  ctx.translate(Math.cos(aim) * ballR * 0.84, Math.sin(aim) * ballR * 0.84);
  drawRasengan(ctx, orb);
  ctx.restore();
}

export function drawSkillOrb(ctx, _kind, r) {
  drawRasengan(ctx, r);
}
export function drawWeapon(ctx, _kind, r, ang) {
  const img = portraits.kunai;
  ctx.save();
  ctx.rotate(ang - Math.PI / 2);
  if (img?.width > 0) {
    const side = Math.max(img.width, img.height);
    const scale = (r * 1.9 * 2) / side;
    ctx.drawImage(img, (-img.width * scale) / 2, (-img.height * scale) / 2, img.width * scale, img.height * scale);
  } else {
    ctx.fillStyle = "#9aa3ad";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRasengan(ctx, r) {
  const img = portraits.rasengan;
  ctx.save();
  const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.28);
  glow.addColorStop(0, "rgba(210, 246, 255, .5)");
  glow.addColorStop(1, "rgba(70, 170, 255, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.rotate(performance.now() * 0.014);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  if (img.complete && img.naturalWidth > 0) {
    const side = Math.max(img.naturalWidth, img.naturalHeight);
    const scale = (r * 2) / side;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = "#8fdfff";
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  ctx.restore();
}
