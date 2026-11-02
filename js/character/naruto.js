import { angleTo } from "./util.js";

const NARUTO_RADIUS = 23;
const RASENGAN_R = 14;
const BOMB_SCALE = 1.5;

const AIM_SLIP = (5 * Math.PI) / 180;

const portraits = {
  naruto: loadPortrait("../../assets/naruto.png"),
  narutoBeast: loadPortrait("../../assets/naruto-phase2.png"),
  rasengan: loadPortrait("../../assets/rasengan.png"),
  bijudama: loadPortrait("../../assets/bijudama.png"),
  kunai: null,
  shuriken: null,
};
const portraitListeners = [];
let portraitsReady = false;

function loadPortrait(file) {
  const img = new Image();
  img.onload = checkPortraits;
  img.src = new URL(file, import.meta.url).href;
  return img;
}

loadCutout("../../assets/kunai.png", "kunai");
loadCutout("../../assets/shuriken.png", "shuriken");

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
  const w = Math.max(1, maxX - minX + 1);
  const h = Math.max(1, maxY - minY + 1);
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  out.getContext("2d").drawImage(src, minX, minY, w, h, 0, 0, w, h);
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
  attack: "나선환 · 수리검",
  desc: "손에 나선환을 모아 키운 뒤 함께 돌진해 맞춘다. 기본 상태에서는 나선환 사이에 쿠나이나 수리검을 던진다. 체력이 0이 되면 기를 모은 뒤 미수로 각성하고, 체력이 다시 찬다. 각성 중에는 더 빠르고 부딪히면 피해를 주며, 어두운 미수옥을 키워서 쏜다. 각성 후에도 쓰러지면 패배한다.",
  hp: 112,
  speed: 150,
  radius: NARUTO_RADIUS,
  windup: 0.72,
  cooldown: 2.15,
  aggression: 0.7,
  track: true,
  telegraph: false,
  color: "#ff7a1a",
  highlight: "#ffe7b0",
  shade: "#7a2208",
  awakenTime: 1.2,
  rasenganR: RASENGAN_R,
  rasenganWindup: 0.72,
  rasenganDamage: 16,
  rasenganCharge: 0.78,
  rasenganLaunch: 540,
  dashSpeed: 600,
  dashTime: 0.5,
  bombScale: BOMB_SCALE,
  bombWindup: 0.84,
  bombSpeed: 680,
  bombCharge: 0.38,
  bombLaunch: 1200,
  bombCooldown: 2.05,
  throwWindup: 0.24,
  throwCooldown: 1.05,
  throwSpeed: 620,
  phase2: {
    hp: 84,
    speed: 900,
    drain: 10,
    touch: 16,
    touchCd: 0.05,
  },
  canAttack(ball) {
    return ball.mode !== "awaken";
  },
  windupScale(ball) {
    if (ball.form === 2) return this.bombCharge;
    if (ball.attack === "rasengan") return this.rasenganCharge;
    return 1;
  },
  begin(ball, enemy) {
    ball.aim = angleTo(ball, enemy);
    if (ball.form === 2) {
      ball.attack = "bomb";
      ball.modeT = this.bombWindup;
      ball.windupMax = this.bombWindup;
      return;
    }
    if ((ball.rasenCd || 0) > 0) {
      ball.attack = Math.random() < 0.5 ? "kunai" : "shuriken";
      ball.modeT = this.throwWindup;
      ball.windupMax = this.throwWindup;
      return;
    }
    ball.attack = "rasengan";
    ball.modeT = this.rasenganWindup;
    ball.windupMax = this.rasenganWindup;
  },
  onDown(ball, api) {
    if (ball.form !== 1) return false;
    if (ball.mode !== "awaken") {
      ball.mode = "awaken";
      ball.modeT = this.awakenTime;
      ball.awakenMax = this.awakenTime;
      ball.anchorX = ball.x;
      ball.anchorY = ball.y;
      ball.vx = 0;
      ball.vy = 0;
      api.sfx("pulse");
    }
    return true;
  },
  control(ball, _enemy, dt, api) {
    if (ball.mode === "awaken") {
      ball.vx = 0;
      ball.vy = 0;
      return "lock";
    }
    if (ball.mode !== "dash") return;
    const speed = api.S(this.dashSpeed);
    ball.vx = Math.cos(ball.dashAng) * speed;
    ball.vy = Math.sin(ball.dashAng) * speed;
    return "lock";
  },
  release(ball, enemy, api) {
    const aim = ball.aim ?? angleTo(ball, enemy);
    const rasenganR = api.S(this.rasenganR);
    if (ball.form === 2) {
      const ang = slip(aim);
      const orbR = rasenganR * this.bombScale;
      const dist = ball.r * 0.1 + orbR * 0.85;
      api.spawn({
        kind: "bomb",
        x: ball.x + Math.cos(ang) * dist,
        y: ball.y + Math.sin(ang) * dist,
        vx: Math.cos(ang) * api.S(this.bombSpeed),
        vy: Math.sin(ang) * api.S(this.bombSpeed),
        r: orbR,
        damage: 22,
        force: api.S(260),
        launchSpeed: api.S(this.bombLaunch),
        launchTime: 0.42,
        life: 1.35,
        bounces: 0,
        owner: ball.i,
        color: "#1a0628",
        glow: "#7a32d6",
        shock: "#e4c6ff",
      });
      api.sfx("pulse");
      api.shake(6);
      ball.mode = "idle";
      ball.cd = this.bombCooldown;
      return;
    }
    if (ball.attack === "kunai" || ball.attack === "shuriken") {
      const ang = slip(aim);
      const dist = ball.r + api.S(8);
      const speed = api.S(this.throwSpeed);
      api.spawn({
        kind: ball.attack,
        x: ball.x + Math.cos(ang) * dist,
        y: ball.y + Math.sin(ang) * dist,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r: api.S(ball.attack === "kunai" ? 16 : 15),
        damage: ball.attack === "kunai" ? 8 : 7,
        force: api.S(100),
        life: 1.2,
        bounces: 0,
        owner: ball.i,
        color: "#d7dde6",
        shock: "#d7dde6",
        spin: 0,
      });
      ball.mode = "idle";
      ball.cd = this.throwCooldown;
      api.sfx("shot");
      return;
    }
    ball.mode = "dash";
    ball.modeT = this.dashTime;
    ball.dashAng = aim;
    ball.aim = aim;
    ball.dashHit = false;
    ball.rasenCd = this.cooldown * 3;
    ball.pendingCd = this.throwCooldown;
    api.sfx("dash");
  },
  afterMove(ball, enemy, dt, api, info) {
    if (ball.form === 1 && ball.rasenCd > 0) ball.rasenCd = Math.max(0, ball.rasenCd - dt);
    if (ball.touchCd > 0) ball.touchCd -= dt;
    if (ball.mode === "dash") {
      const orbR = api.S(this.rasenganR);
      const dist = ball.r * 0.84;
      const ox = ball.x + Math.cos(ball.dashAng) * dist;
      const oy = ball.y + Math.sin(ball.dashAng) * dist;
      const orbHit = Math.hypot(ox - enemy.x, oy - enemy.y) < orbR * 0.9 + enemy.r;
      const bodyHit = Math.hypot(ball.x - enemy.x, ball.y - enemy.y) < ball.r + enemy.r;
      if (!ball.dashHit && (orbHit || bodyHit)) {
        ball.dashHit = true;
        api.damage(enemy, this.rasenganDamage, ox, oy, api.S(220), {
          speed: api.S(this.rasenganLaunch),
          time: 0.34,
          ang: ball.dashAng,
          color: "#7adfff",
        });
        ball.mode = "idle";
        ball.cd = ball.pendingCd;
        return;
      }
      if (info?.wall) {
        ball.mode = "idle";
        ball.cd = ball.pendingCd;
        return;
      }
      ball.modeT -= dt;
      if (ball.modeT <= 0) {
        ball.mode = "idle";
        ball.cd = ball.pendingCd;
      }
      return;
    }
    if (ball.mode === "awaken") {
      ball.modeT -= dt;
      if (ball.modeT > 0) return;
      const next = this.phase2;
      ball.form = 2;
      ball.maxHp = next.hp;
      ball.hp = next.hp;
      ball.cd = 0.35;
      ball.designSpeed = next.speed;
      ball.baseSpeed = api.S(next.speed);
      ball.mode = "idle";
      ball.flash = 0.32;
      const ang = Math.random() * Math.PI * 2;
      ball.vx = Math.cos(ang) * ball.baseSpeed;
      ball.vy = Math.sin(ang) * ball.baseSpeed;
      api.shock(ball.x, ball.y, "#ff3044");
      api.sfx("roar");
      api.shake(11);
      return;
    }
    if (ball.form !== 2 || ball.hp <= 0) return;
    if (!ball.god) ball.hp = Math.max(0, ball.hp - this.phase2.drain * dt);
    api.smoke(ball.x, ball.y, ball.vx, ball.vy);
    if (!ball.god && ball.hp <= 0) api.ko(ball);
  },
  onTouch(ball, enemy, api) {
    if (ball.form !== 2 || ball.hp <= 0 || enemy.hp <= 0) return;
    if (ball.touchCd > 0) return;
    const hit = api.damage(enemy, this.phase2.touch, ball.x, ball.y, api.S(230), { color: "#ff4d6a" });
    if (hit) ball.touchCd = this.phase2.touchCd;
  },
};

export function drawNaruto(ctx, r, form, charge, skill = 0, aim = 0) {
  const img = form === 2 ? portraits.narutoBeast : portraits.naruto;

  if (form === 2) {
    ctx.save();
    ctx.globalAlpha = 0.55;
    const aura = ctx.createRadialGradient(0, 0, r * 0.45, 0, 0, r * 1.55);
    aura.addColorStop(0, "rgba(255,40,70,.8)");
    aura.addColorStop(1, "rgba(120,0,16,0)");
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (charge > 0) {
    ctx.save();
    const reach = r * (1.8 + charge * 2.8);
    const glow = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, reach);
    glow.addColorStop(0, `rgba(255, 42, 58, ${0.42 + charge * 0.38})`);
    glow.addColorStop(0.42, `rgba(186, 12, 32, ${0.2 + charge * 0.22})`);
    glow.addColorStop(1, "rgba(110, 0, 14, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, reach, 0, Math.PI * 2);
    ctx.fill();
    const wave = (performance.now() / 820) % 1;
    for (let i = 0; i < 2; i += 1) {
      const t = (wave + i * 0.5) % 1;
      ctx.globalAlpha = (1 - t) * (0.32 + charge * 0.48);
      ctx.strokeStyle = "#ff3044";
      ctx.lineWidth = Math.max(4, r * (0.2 - t * 0.1));
      ctx.beginPath();
      ctx.arc(0, 0, r * (1.05 + t * (1.1 + charge * 2.2)), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  if (img.complete && img.naturalWidth > 0) {
    const scale = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = form === 2 ? "#9a1028" : "#ff7a1a";
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  const shade = ctx.createRadialGradient(-r * 0.28, -r * 0.32, r * 0.15, 0, 0, r);
  shade.addColorStop(0, "rgba(255,255,255,.2)");
  shade.addColorStop(0.58, "rgba(255,255,255,0)");
  shade.addColorStop(1, "rgba(0,0,0,.4)");
  ctx.fillStyle = shade;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();

  if (form === 2) {
    ctx.lineWidth = Math.max(2.5, r * 0.085);
    ctx.strokeStyle = "#ff4d6a";
    ctx.beginPath();
    ctx.arc(0, 0, r - ctx.lineWidth * 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = Math.max(1.25, r * 0.035);
  ctx.strokeStyle = "rgba(0,0,0,.6)";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  if (form === 2 && skill > 0) {
    const rasenganR = r * (RASENGAN_R / NARUTO_RADIUS);
    const orb = rasenganR * BOMB_SCALE * (0.18 + 0.82 * skill);
    const dist = r * 0.1 + orb * 0.85;
    ctx.save();
    ctx.translate(Math.cos(aim) * dist, Math.sin(aim) * dist);
    drawBeastBomb(ctx, orb);
    ctx.restore();
  }

  if (form !== 2 && skill > 0) drawHeldRasengan(ctx, r, aim, skill);
}

function drawHeldRasengan(ctx, ballR, aim, skill) {
  const full = ballR * (RASENGAN_R / NARUTO_RADIUS);
  const orb = full * (0.18 + 0.82 * skill);
  ctx.save();
  ctx.translate(Math.cos(aim) * ballR * 0.84, Math.sin(aim) * ballR * 0.84);
  drawRasengan(ctx, orb);
  ctx.restore();
}

export function drawSkillOrb(ctx, kind, r) {
  if (kind === "bomb") drawBeastBomb(ctx, r);
  else drawRasengan(ctx, r);
}

export function drawWeapon(ctx, kind, r, ang) {
  const img = kind === "kunai" ? portraits.kunai : portraits.shuriken;
  ctx.save();
  ctx.rotate(kind === "kunai" ? ang - Math.PI / 2 : ang);
  if (img?.width > 0) {
    const side = Math.max(img.width, img.height);
    const scale = ((kind === "kunai" ? r * 1.9 : r * 1.65) * 2) / side;
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

function drawBeastBomb(ctx, r) {
  const img = portraits.bijudama;
  ctx.save();
  const glow = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r * 1.32);
  glow.addColorStop(0, "rgba(170, 50, 255, .4)");
  glow.addColorStop(1, "rgba(90, 0, 180, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.32, 0, Math.PI * 2);
  ctx.fill();

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
    ctx.fillStyle = "#6a18c8";
    ctx.fillRect(-r, -r, r * 2, r * 2);
  }
  ctx.restore();
}
