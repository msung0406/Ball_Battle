import { drawCharacter, drawWeapon, getCharacter } from "./character/index.js?v=94";
import { play } from "./sfx.js?v=30";

export function createMatch(canvas, { onChange }) {
  const ctx = canvas.getContext("2d");
  let design = 600;
  let W = 0;
  let dpr = 1;
  let f1 = null;
  let f2 = null;
  let balls = [];
  let projectiles = [];
  let particles = [];
  let texts = [];
  let smokeLayer = null;
  let smokeCtx = null;
  let state = "preview";
  let winner = 0;
  let countLeft = 0;
  let shownCount = "";
  let last = 0;
  let hitStop = 0;
  let shake = 0;
  let raf = 0;
  const SHAKE_MAX = 20;
  const god = { 1: false, 2: false };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function addShake(amount) {
    shake = Math.min(SHAKE_MAX, shake + amount);
  }

  const api = {
    S: (n) => n * (W / design),
    W: () => W,
    damage,
    shake: addShake,
    spawn(obj) {
      projectiles.push(obj);
      if (projectiles.length > 48) projectiles.splice(0, projectiles.length - 48);
    },
    cloneBurst,
    summonClone,
    clonesOf,
    foes,
    sfx: play,
    castLaser,
    polylineHits,
  };

  function S(n) {
    return n * (W / design);
  }

  function setArena(size) {
    const next = size === 300 ? 300 : 600;
    if (design === next) return;
    design = next;
    smokeLayer = null;
    if (state !== "fight" && state !== "countdown") {
      balls = [];
      W = 0;
    }
    emit();
  }

  function setFighters(a, b) {
    f1 = a;
    f2 = b;
    if (state === "fight" || state === "countdown") return;
    state = "preview";
    winner = 0;
    shownCount = "";
    clearFx();
    if (W > 0) buildBalls();
    emit();
  }

  function start() {
    if (!f1 || !f2 || f1 === f2) return;
    if (state === "fight" || state === "countdown") return;
    state = "countdown";
    countLeft = 3;
    shownCount = "3";
    winner = 0;
    hitStop = 0;
    clearFx();
    buildBalls();
    play("tick");
    emit();
  }

  function toPreview() {
    state = "preview";
    winner = 0;
    shownCount = "";
    hitStop = 0;
    clearFx();
    if (W > 0) buildBalls();
    emit();
  }

  function getState() {
    return state;
  }

  function clearFx() {
    projectiles = [];
    particles = [];
    texts = [];
    shake = 0;
  }

  function buildBalls() {
    if (!f1 || !f2 || W <= 0) {
      balls = [];
      return;
    }
    balls = [makeBall(f1, 1, 0), makeBall(f2, 2, 1)];
    standOnSide(balls[0], W * 0.25);
    standOnSide(balls[1], W * 0.75);
  }

  function standOnSide(ball, x) {
    refreshBody(ball);
    ball.x = x;
    ball.y = W * 0.5;
    ball.vx = 0;
    ball.vy = 0;
  }

  function launchDirection(ball) {
    const ang = Math.random() * Math.PI * 2;
    ball.vx = Math.cos(ang) * ball.baseSpeed;
    ball.vy = Math.sin(ang) * ball.baseSpeed;
  }

  function makeBall(id, player, index) {
    const char = getCharacter(id);
    const ball = {
      i: index,
      player,
      charId: id,
      hp: char.hp,
      maxHp: char.hp,
      designSpeed: char.speed,
      designRadius: char.radius,
      r: char.radius,
      baseSpeed: char.speed,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      mode: "idle",
      modeT: 0,
      windupMax: 0,
      cd: 0.28 + Math.random() * 0.55,
      cds: {},
      flash: 0,
      aim: null,
      dashAng: 0,
      recoil: 0,
      pop: 0,
      god: Boolean(god[player]),
    };
    char.initCds?.(ball);
    return ball;
  }

  function syncSize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const next = Math.min(rect.width, rect.height);
    if (next < 2) return;
    const prev = W;
    const bw = Math.max(1, Math.round(next * dpr));
    if (canvas.width !== bw || canvas.height !== bw) {
      canvas.width = bw;
      canvas.height = bw;
    }
    W = next;
    if (prev > 0 && Math.abs(W - prev) > 0.5) scaleWorld(W / prev);
    else if (prev === 0 && f1 && f2 && balls.length === 0) buildBalls();
  }

  function scaleWorld(k) {
    const scalePoint = (p) => {
      p.x *= k;
      p.y *= k;
    };
    for (const b of balls) {
      scalePoint(b);
      b.vx *= k;
      b.vy *= k;
      b.ghosts?.forEach(scalePoint);
    }
    for (const p of projectiles) {
      if (p.x != null) scalePoint(p);
      if (p.vx) p.vx *= k;
      if (p.vy) p.vy *= k;
      if (p.r) p.r *= k;
      if (p.born) p.born *= k;
      if (p.maxR) p.maxR *= k;
      if (p.grow) p.grow *= k;
      if (p.force) p.force *= k;
      if (p.pts) p.pts.forEach(scalePoint);
    }
    for (const t of texts) scalePoint(t);
    for (const q of particles) {
      scalePoint(q);
      q.vx *= k;
      q.vy *= k;
      q.r *= k;
      if (q.grow) q.grow *= k;
    }
  }

  function refreshBody(ball) {
    ball.r = S(ball.designRadius);
    ball.baseSpeed = S(ball.designSpeed);
  }

  function frame(t) {
    if (!last) {
      last = t;
      syncSize();
      draw();
      emit();
      raf = requestAnimationFrame(frame);
      return;
    }
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    syncSize();
    if (W > 0) {
      if (hitStop > 0) {
        hitStop = Math.max(0, hitStop - dt);
      } else {
        update(dt);
      }
      shake = Math.max(0, shake - 52 * dt);
      draw();
    }
    emit();
    raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    if (balls.length < 2) return;
    for (const ball of balls) refreshBody(ball);

    if (state === "countdown") {
      const label = countLabel(countLeft);
      if (label !== shownCount) {
        shownCount = label;
        play(label === "FIGHT" ? "fight" : "tick");
      }
      countLeft -= dt;
      if (countLeft <= 0) {
        state = "fight";
        shownCount = "";
        for (const ball of balls) launchDirection(ball);
      }
    }

    if (state === "preview" || state === "countdown") {
      standOnSide(balls[0], W * 0.25);
      standOnSide(balls[1], W * 0.75);
      return;
    }

    const fighting = state === "fight";
    for (const ball of balls) {
      if (ball.poofed) continue;
      const enemy = balls[1 - ball.i];
      const def = getCharacter(ball.charId);
      let lock = false;
      if (fighting && ball.hp > 0 && ball.cds) {
        for (const key of Object.keys(ball.cds)) {
          if (ball.cds[key] > 0) ball.cds[key] = Math.max(0, ball.cds[key] - dt);
        }
      }
      if (fighting && ball.recoil > 0) {
        ball.recoil = Math.max(0, ball.recoil - dt);
        const drag = Math.exp(-1.7 * dt);
        ball.vx *= drag;
        ball.vy *= drag;
        lock = true;
      } else if (fighting && ball.hp > 0 && enemy.hp > 0) {
        if (ball.mode === "idle") {
          if (ball.cd > 0) ball.cd -= dt;
          if (ball.cd <= 0) {
            const skill = def.readySkill?.(ball, enemy, api);
            if (skill) {
              ball.attack = skill;
              const charge = def[`${skill}Charge`] ?? 0;
              ball.aim = def[`${skill}Track`]
                ? Math.atan2(enemy.y - ball.y, enemy.x - ball.x)
                : Math.random() * Math.PI * 2;
              if (charge > 0) {
                ball.mode = "windup";
                ball.modeT = charge;
                ball.windupMax = charge;
              } else {
                ball.cds[skill] = def[`${skill}Cooldown`] ?? 0;
                def.release(ball, enemy, api);
              }
            }
          }
        } else if (ball.mode === "windup") {
          if (def[`${ball.attack}Track`]) ball.aim = Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
          ball.modeT -= dt;
          if (ball.modeT <= 0) {
            const skill = ball.attack;
            ball.cds[skill] = def[`${skill}Cooldown`] ?? 0;
            def.release(ball, enemy, api);
          }
        }
        if (ball.mode !== "idle" && ball.mode !== "windup" && def.control?.(ball, enemy, dt, api) === "lock") {
          lock = true;
        }
      }
      if (!lock && state === "fight" && !(ball.pop > 0)) {
        const scale = ball.mode === "windup" ? (def.moveScale?.(ball) ?? 1) : 1;
        holdCourse(ball, scale);
      }
      let wall = false;
      if (ball.pop > 0) {
        ball.vx = 0;
        ball.vy = 0;
        ball.pop += dt;
      } else {
        wall = moveAndBounce(ball, dt);
      }
      if (fighting && !(ball.pop > 0)) def.afterMove?.(ball, enemy, dt, api, { wall });
      ball.flash = Math.max(0, ball.flash - dt);
    }

    for (let i = 0; i < balls.length; i += 1) {
      for (let j = i + 1; j < balls.length; j += 1) {
        if (!canCollide(balls[i]) || !canCollide(balls[j])) continue;
        collide(balls[i], balls[j]);
      }
    }
    for (const ball of balls) {
      if (state !== "ko") clampSpeed(ball);
      noteDash(ball, dt);
    }

    for (const q of particles) {
      if (q.kind === "smoke") {
        const drag = Math.exp(-1.35 * dt);
        q.vx *= drag;
        q.vy *= drag;
        q.vy -= S(6.9) * dt;
        q.r += q.grow * dt;
      }
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.life -= dt;
    }
    particles = particles.filter((q) => q.life > 0);

    for (const text of texts) {
      text.y -= S(48.5) * dt;
      text.life -= dt;
    }
    texts = texts.filter((text) => text.life > 0);

    if (fighting) updateProjectiles(dt);
    else if (state === "ko") {
      for (const p of projectiles) if (p.kind === "shock") growShock(p, dt);
      projectiles = projectiles.filter((p) => p.life > 0);
      for (const ball of balls) {
        if (ball.pop > 0) continue;
        const drag = Math.exp(-0.72 * dt);
        ball.vx *= drag;
        ball.vy *= drag;
      }
    }

    if (balls.some((ball) => ball.poofed)) balls = balls.filter((ball) => !ball.poofed);
  }

  function holdCourse(ball, scale) {
    const speed = ball.baseSpeed * scale;
    const mag = Math.hypot(ball.vx, ball.vy);
    if (mag < 0.001) {
      const ang = Math.random() * Math.PI * 2;
      ball.vx = Math.cos(ang) * speed;
      ball.vy = Math.sin(ang) * speed;
      return;
    }
    ball.vx = (ball.vx / mag) * speed;
    ball.vy = (ball.vy / mag) * speed;
  }

  function moveAndBounce(ball, dt) {
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    let wall = false;
    if (ball.x < ball.r) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      wall = true;
    } else if (ball.x > W - ball.r) {
      ball.x = W - ball.r;
      ball.vx = -Math.abs(ball.vx);
      wall = true;
    }
    if (ball.y < ball.r) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      wall = true;
    } else if (ball.y > W - ball.r) {
      ball.y = W - ball.r;
      ball.vy = -Math.abs(ball.vy);
      wall = true;
    }
    return wall;
  }

  function collide(a, b) {
    let dx = b.x - a.x;
    let dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    const min = a.r + b.r;
    if (dist === 0) {
      dx = 1;
      dy = 0;
      dist = 1;
    }
    if (dist >= min) return;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = (min - dist) / 2;
    a.x -= nx * overlap;
    a.y -= ny * overlap;
    b.x += nx * overlap;
    b.y += ny * overlap;
    const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
    if (rel > 0) {
      const impulse = rel * 0.92;
      a.vx -= impulse * nx;
      a.vy -= impulse * ny;
      b.vx += impulse * nx;
      b.vy += impulse * ny;
    }
    for (const ball of [a, b]) {
      ball.x = clamp(ball.x, ball.r, W - ball.r);
      ball.y = clamp(ball.y, ball.r, W - ball.r);
    }
  }

  function canCollide(ball) {
    return ball.recoil <= 0 && !(ball.pop > 0) && ball.hp > 0 && !ball.poofed;
  }

  function clampSpeed(ball) {
    if (ball.recoil > 0) return;
    const max = ball.mode === "dash" ? ball.baseSpeed * 4.2 : ball.baseSpeed * 1.65;
    const sp = Math.hypot(ball.vx, ball.vy);
    if (sp > max) {
      ball.vx = (ball.vx / sp) * max;
      ball.vy = (ball.vy / sp) * max;
    }
  }

  function updateProjectiles(dt) {
    for (const p of projectiles) {
      if (state !== "fight" && p.kind !== "shock") {
        p.life = 0;
        continue;
      }
      if (p.kind === "beam" || p.kind === "shock") {
        if (p.kind === "shock") {
          growShock(p, dt);
          continue;
        }
        p.life -= dt;
        continue;
      }
      if (p.stuck) {
        if (p.stuckTo) {
          const enemy = balls.includes(p.stuckTo) && !p.stuckTo.poofed ? p.stuckTo : null;
          if (!enemy) {
            p.life = 0;
            continue;
          }
          p.x = enemy.x + p.stickNx * enemy.r * p.stickOut;
          p.y = enemy.y + p.stickNy * enemy.r * p.stickOut;
        }
        p.life -= dt;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.kind === "shuriken") p.spin = (p.spin || 0) + dt * 16;
      bounceProjectile(p);
      if (p.stuck || p.life <= 0) continue;
      const enemy = projectileTarget(p);
      if (!enemy) continue;
      if (enemy.hp <= 0) continue;
      const color = p.color || "#fff7f8";
      const landed = damage(
        enemy,
        p.damage,
        p.x,
        p.y,
        p.force ?? S(92.3),
        { color },
      );
      if (landed && (p.kind === "kunai" || p.kind === "shuriken")) addShake(8);
      if (state !== "fight") {
        p.life = 0;
        continue;
      }
      if ((p.kind === "kunai" || p.kind === "shuriken") && !enemy.clone && !enemy.poofed && balls.includes(enemy)) {
        lodgeWeapon(p, Math.atan2(p.vy, p.vx), enemy);
      } else {
        p.life = 0;
      }
    }
    projectiles = projectiles.filter((p) => p.life > 0);
  }

  function lodgeWeapon(p, ang, enemy) {
    p.stuck = true;
    p.stickAng = ang;
    p.vx = 0;
    p.vy = 0;
    p.life = 0.48;
    if (!enemy) return;
    p.stuckTo = enemy;
    p.stickNx = -Math.cos(ang);
    p.stickNy = -Math.sin(ang);
    p.stickOut = 0.35 + (p.r * 1.9) / enemy.r;
  }

  function bounceProjectile(p) {
    if (p.kind !== "kunai" && p.kind !== "shuriken") return;
    const ang = Math.atan2(p.vy, p.vx);
    let hit = false;
    if (p.x < p.r) {
      p.x = p.r;
      p.vx = Math.abs(p.vx);
      hit = true;
    } else if (p.x > W - p.r) {
      p.x = W - p.r;
      p.vx = -Math.abs(p.vx);
      hit = true;
    }
    if (p.y < p.r) {
      p.y = p.r;
      p.vy = Math.abs(p.vy);
      hit = true;
    } else if (p.y > W - p.r) {
      p.y = W - p.r;
      p.vy = -Math.abs(p.vy);
      hit = true;
    }
    if (!hit) return;
    lodgeWeapon(p, ang);
  }

  function projectileTarget(p) {
    let best = null;
    let bestDist = Infinity;
    for (const ball of balls) {
      if (ball.i === p.owner || ball.poofed || ball.pop > 0) continue;
      if (ball.hp <= 0) continue;
      const dist = Math.hypot(ball.x - p.x, ball.y - p.y);
      if (dist > ball.r + p.r || dist >= bestDist) continue;
      best = ball;
      bestDist = dist;
    }
    return best;
  }

  function damage(target, amount, sx, sy, force = 90, launch = null) {
    if (state !== "fight") return false;
    if (!target || target.god || target.hp <= 0) return false;
    target.hp = Math.max(0, target.hp - amount);
    target.flash = 0.22;
    const ang = launch?.ang ?? (Math.atan2(target.y - sy, target.x - sx) || 0);
    if (launch?.speed) {
      target.recoil = launch.time ?? 0.34;
      target.vx = Math.cos(ang) * launch.speed;
      target.vy = Math.sin(ang) * launch.speed;
    } else {
      target.vx += Math.cos(ang) * force;
      target.vy += Math.sin(ang) * force;
    }
    texts.push({
      x: target.x,
      y: target.y - target.r,
      text: String(amount),
      life: 0.7,
      max: 0.7,
    });
    const color = launch?.color || "#fff7f8";
    shockwave(target.x - Math.cos(ang) * target.r, target.y - Math.sin(ang) * target.r, color);
    play("hit");
    if (amount >= target.maxHp * 0.1) hitStop = 0.04;
    if (target.hp <= 0) ko(target);
    return true;
  }

  function debug(player, action) {
    const ball = balls.find((item) => item.player === player && !item.clone);
    if (!ball) return;
    if (action === "god") {
      god[player] = !god[player];
      ball.god = god[player];
    } else if (action === "heal") {
      ball.hp = Math.min(ball.maxHp, ball.hp + 20);
    } else if (action === "full") {
      ball.hp = ball.maxHp;
    } else {
      const loss = action === "zero" ? ball.hp : 20;
      ball.hp = Math.max(0, ball.hp - loss);
      ball.flash = 0.22;
      addShake(12);
      if (ball.hp <= 0 && state === "fight") ko(ball);
    }
    emit();
  }

  function ko(target) {
    if (state !== "fight" || !target || target.hp > 0) return;
    if (target.clone) {
      poofClone(target);
      return;
    }
    finish(target.player === 1 ? 2 : 1);
  }

  function pushParticle(q) {
    particles.push(q);
    if (particles.length > 520) particles.splice(0, particles.length - 520);
  }

  function shockwave(x, y, color = "#fff7f8") {
    const start = S(4.6);
    projectiles.push({
      kind: "shock",
      x,
      y,
      r: start,
      born: start,
      maxR: start + S(25.4),
      grow: S(161.5),
      life: 0.18,
      max: 0.18,
      color,
    });
    const shocks = projectiles.filter((item) => item.kind === "shock");
    if (shocks.length > 8) {
      const index = projectiles.indexOf(shocks[0]);
      if (index >= 0) projectiles.splice(index, 1);
    }
  }

  function puff(x, y, power = 1) {
    const scale = 0.92 + power * 0.1;
    for (let i = 0; i < 4; i += 1) {
      const life = 0.16 + Math.random() * 0.03;
      const shade = 198 + Math.floor(Math.random() * 28);
      pushParticle({
        kind: "smoke",
        x,
        y,
        vx: 0,
        vy: 0,
        life,
        max: life,
        r: S((34.6 + i * 8.1) * scale),
        grow: S(103.8),
        color: `${Math.min(255, shade + 8)}, ${shade}, ${Math.max(0, shade - 4)}`,
        alpha: 0.9 - i * 0.08,
        ox: x,
        oy: y,
      });
    }
    const count = Math.max(18, Math.round(24 * power));
    for (let i = 0; i < count; i += 1) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = S((126.9 + Math.random() * 80.8) * Math.sqrt(power));
      const life = 0.42 + Math.random() * 0.06;
      const shade = 186 + Math.floor(Math.random() * 36);
      pushParticle({
        kind: "smoke",
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life,
        max: life,
        r: S((25.4 + Math.random() * 11.5) * scale),
        grow: S(9.2 + Math.random() * 9.2),
        color: `${Math.min(255, shade + 6)}, ${shade}, ${Math.max(0, shade - 6)}`,
        alpha: 0.86 + Math.random() * 0.12,
        ox: x,
        oy: y,
      });
    }
  }

  function summonClone(master) {
    const char = getCharacter(master.charId);
    const clone = makeBall(master.charId, master.player, master.i);
    clone.clone = true;
    clone.master = master;
    clone.hp = 1;
    clone.maxHp = 1;
    clone.god = false;
    clone.r = master.r;
    clone.baseSpeed = master.baseSpeed;
    clone.designSpeed = char.speed;
    clone.designRadius = char.radius;
    clone.cd = 0.4 + Math.random() * 0.45;
    balls.push(clone);
    return clone;
  }

  function clonesOf(master) {
    return balls.filter((ball) => ball.clone && ball.master === master && !ball.poofed && ball.hp > 0);
  }

  function foes(owner) {
    return balls.filter(
      (ball) =>
        ball.i !== owner && !ball.poofed && ball.hp > 0 && !(ball.pop > 0),
    );
  }

  function cloneBurst(x, y, r = 26) {
    puff(x, y, 1);
    pushShock(x, y, Math.max(S(9.2), r * 0.45), S(85.4), S(369.2), 0.28, "#fffaf6", S(3));
  }

  function poofClone(target) {
    if (!target || target.poofed) return;
    target.poofed = true;
    target.hp = 0;
    target.vx = 0;
    target.vy = 0;
    cloneBurst(target.x, target.y, target.r);
    play("pulse");
    addShake(4);
  }

  function growShock(p, dt) {
    if (p.born == null) p.born = p.r;
    const span = Math.max(0.001, p.maxR - p.born);
    p.r = Math.min(p.maxR, p.r + (p.grow || span / (p.max || 0.3)) * dt);
    const grown = Math.min(1, (p.r - p.born) / span);
    p.life = (p.max || 1) * (1 - grown);
  }

  function pushShock(x, y, r, reach, grow, life, color, width) {
    projectiles.push({
      kind: "shock",
      x,
      y,
      r,
      born: r,
      maxR: r + reach,
      grow,
      life,
      max: life,
      color,
      width,
    });
  }

  function popBall(ball) {
    if (ball.pop > 0) return;
    ball.pop = 0.0001;
    ball.vx = 0;
    ball.vy = 0;
    const char = getCharacter(ball.charId);
    const color = char?.color || "#fff7f8";
    const highlight = char?.highlight || "#ffffff";
    const origin = Math.max(S(6.9), ball.r * 0.2);
    pushShock(ball.x, ball.y, origin, S(180), S(623.1), 0.36, "#fff8f4", S(8.1));
    pushShock(ball.x, ball.y, origin, S(129.2), S(357.7), 0.52, color, S(4.2));
    pushShock(ball.x, ball.y, origin * 0.5, S(78.5), S(253.8), 0.28, highlight, S(2.5));
  }

  function finish(winnerPlayer) {
    if (state === "ko") return;
    for (const ball of balls) if (ball.clone) ball.poofed = true;
    state = "ko";
    winner = winnerPlayer;
    play("ko");
    addShake(SHAKE_MAX);
    hitStop = 0;
    for (const p of projectiles) {
      if (p.kind !== "shock") p.life = 0;
    }
    for (const ball of balls) {
      ball.mode = "idle";
      ball.recoil = 0;
      if (ball.hp <= 0 && !ball.clone) popBall(ball);
    }
  }

  function castLaser(x, y, ang, maxBounces) {
    let cx = Math.max(1, Math.min(W - 1, x));
    let cy = Math.max(1, Math.min(W - 1, y));
    const pts = [{ x: cx, y: cy }];
    let dx = Math.cos(ang);
    let dy = Math.sin(ang);
    for (let i = 0; i <= maxBounces; i += 1) {
      const hits = [];
      if (dx > 1e-6) hits.push({ t: (W - cx) / dx, axis: "x", sign: -1 });
      if (dx < -1e-6) hits.push({ t: (0 - cx) / dx, axis: "x", sign: 1 });
      if (dy > 1e-6) hits.push({ t: (W - cy) / dy, axis: "y", sign: -1 });
      if (dy < -1e-6) hits.push({ t: (0 - cy) / dy, axis: "y", sign: 1 });
      hits.sort((a, b) => a.t - b.t);
      const hit = hits.find((h) => h.t > 1e-3 && Number.isFinite(h.t));
      if (!hit) break;
      cx += dx * hit.t;
      cy += dy * hit.t;
      pts.push({ x: cx, y: cy });
      if (i === maxBounces) break;
      if (hit.axis === "x") dx = -dx;
      else dy = -dy;
      if (hit.axis === "x") cx += hit.sign;
      else cy += hit.sign;
    }
    return pts;
  }

  function polylineHits(pts, target, pad) {
    const r = target.r + pad;
    for (let i = 0; i < pts.length - 1; i += 1) {
      if (segmentHits(pts[i], pts[i + 1], target.x, target.y, r)) return true;
    }
    return false;
  }

  function countLabel(left) {
    if (left > 2.2) return "3";
    if (left > 1.4) return "2";
    if (left > 0.6) return "1";
    return "FIGHT";
  }

  function bannerFor() {
    if (state === "countdown") return { kicker: "", title: shownCount, sub: "" };
    if (state === "ko" && balls.length >= 2) {
      const id = balls[winner - 1]?.charId;
      const char = id ? getCharacter(id) : null;
      return { kicker: "K.O.", title: `${winner}P 승리`, sub: char ? char.name : "" };
    }
    return null;
  }

  function emit() {
    const pack = (ball, id, player) => {
      const char = getCharacter(id);
      if (!char) return null;
      return {
        player,
        id,
        name: char.name,
        hp: ball ? ball.hp : char.hp,
        maxHp: ball ? ball.maxHp : char.hp,
        flash: ball ? ball.flash : 0,
        god: Boolean(ball?.god),
      };
    };
    onChange({
      state,
      winner,
      banner: bannerFor(),
      fighters: [pack(balls[0], f1, 1), pack(balls[1], f2, 2)],
      shake: reduce ? 0 : shake,
    });
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.save();
    drawArena();
    for (const p of projectiles) if (p.kind !== "shock") drawProjectile(p);
    if (balls.length >= 2) {
      for (const ball of balls) drawTelegraph(ball);
      for (const ball of balls) if (!(ball.pop > 0)) drawShadow(ball);
      for (const ball of balls) {
        const look = ballLook(ball);
        const char = getCharacter(ball.charId);
        const popT = ball.pop > 0 ? Math.min(1, ball.pop / 0.12) : 0;
        if (popT >= 1) continue;
        drawDashTrail(ball, char, look);
        drawCharacter(ctx, char, {
          x: ball.x,
          y: ball.y,
          r: ball.r * (1 + popT * 0.62),
          look,
          flash: ball.flash,
          alpha: 1 - popT,
          skill: ballSkill(ball),
          aim: ball.aim ?? look,
          hideSkill: true,
          ko: state === "ko" && ball.hp <= 0 && !(ball.pop > 0),
        });
        if (ball.god) {
          ctx.save();
          ctx.strokeStyle = "#e8c56b";
          ctx.lineWidth = Math.max(2, S(2.9));
          ctx.beginPath();
          ctx.arc(ball.x, ball.y, ball.r + S(6.9), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
      for (const ball of balls) {
        const popT = ball.pop > 0 ? Math.min(1, ball.pop / 0.12) : 0;
        if (popT >= 1) continue;
        const skill = ballSkill(ball);
        if (skill <= 0) continue;
        const look = ballLook(ball);
        drawCharacter(ctx, getCharacter(ball.charId), {
          x: ball.x,
          y: ball.y,
          r: ball.r * (1 + popT * 0.62),
          look,
          alpha: 1 - popT,
          skill,
          aim: ball.aim ?? look,
          skillOnly: true,
        });
      }
      drawFrontSmoke();
      for (const ball of balls) drawPopFlash(ball);
      for (const p of projectiles) if (p.kind === "shock") drawProjectile(p);
    }
    ctx.globalAlpha = 1;
    for (const text of texts) {
      ctx.globalAlpha = Math.max(0, text.life / text.max);
      ctx.font = `800 ${Math.round(S(18.5))}px "Noto Sans KR", sans-serif`;
      ctx.textAlign = "center";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#14080c";
      ctx.strokeText(text.text, text.x, text.y);
      ctx.fillStyle = "#fff";
      ctx.fillText(text.text, text.x, text.y);
    }
    ctx.restore();
  }

  function ballLook(ball) {
    const enemy = balls[1 - ball.i];
    return Math.atan2(enemy.y - ball.y, enemy.x - ball.x);
  }

  function ballSkill(ball) {
    if (state !== "fight" || ball.hp <= 0) return 0;
    if (ball.mode === "windup" && ball.attack !== "kunai" && ball.attack !== "clone") {
      return 1 - ball.modeT / (ball.windupMax || 1);
    }
    if (ball.mode === "dash") return 1;
    return 0;
  }

  function drawArena() {
    const g = ctx.createRadialGradient(W * 0.5, W * 0.4, W * 0.08, W * 0.5, W * 0.5, W * 0.72);
    g.addColorStop(0, "#202838");
    g.addColorStop(1, "#0c1018");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, W);

    ctx.strokeStyle = "rgba(255,255,255,.045)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const grid = 75;
    for (let p = grid; p < W - 0.5; p += grid) {
      ctx.moveTo(p, 0);
      ctx.lineTo(p, W);
      ctx.moveTo(0, p);
      ctx.lineTo(W, p);
    }
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,.16)";
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, W - 28, W - 28);
    ctx.beginPath();
    ctx.moveTo(W / 2, 14);
    ctx.lineTo(W / 2, W - 14);
    ctx.stroke();
  }

  function noteDash(ball, dt) {
    ball.ghosts = ball.ghosts || [];
    if (ball.mode === "dash") {
      const last = ball.ghosts[ball.ghosts.length - 1];
      if (!last || Math.hypot(ball.x - last.x, ball.y - last.y) > S(18.5)) {
        ball.ghosts.push({
          x: ball.x,
          y: ball.y,
          aim: ball.aim ?? ball.dashAng ?? 0,
          life: 0.34,
          max: 0.34,
        });
      }
    }
    for (const ghost of ball.ghosts) ghost.life -= dt;
    if (ball.ghosts.length > 6) ball.ghosts.splice(0, ball.ghosts.length - 6);
    ball.ghosts = ball.ghosts.filter((ghost) => ghost.life > 0);
  }

  function drawDashTrail(ball, char, look) {
    const ghosts = ball.ghosts;
    if (!ghosts?.length) return;
    for (const ghost of ghosts) {
      const fade = Math.max(0, ghost.life / ghost.max);
      drawCharacter(ctx, char, {
        x: ghost.x,
        y: ghost.y,
        r: ball.r,
        look,
        alpha: 0.08 + fade * 0.22,
        skill: char.id === "naruto" ? 1 : 0,
        aim: ghost.aim,
      });
    }
  }

  function drawShadow(ball) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.38)";
    ctx.beginPath();
    ctx.ellipse(ball.x, ball.y + ball.r * 0.78, ball.r * 0.78, ball.r * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTelegraph(ball) {
    if (ball.mode !== "windup") return;
    const def = getCharacter(ball.charId);
    const p = 1 - ball.modeT / (ball.windupMax || 1);
    ctx.save();
    ctx.strokeStyle = def.color;
    ctx.globalAlpha = 0.75;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r + S(10), -Math.PI / 2, -Math.PI / 2 + Math.max(0.01, p) * Math.PI * 2);
    ctx.stroke();
    if (def[`${ball.attack}Telegraph`] && Number.isFinite(ball.aim)) {
      ctx.globalAlpha = 0.45;
      ctx.setLineDash([S(5), S(5)]);
      ctx.beginPath();
      ctx.moveTo(ball.x, ball.y);
      ctx.lineTo(ball.x + Math.cos(ball.aim) * S(100), ball.y + Math.sin(ball.aim) * S(100));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawProjectile(p) {
    ctx.save();
    if (p.kind === "beam" && p.pts?.length > 1) {
      const alpha = Math.max(0, p.life / p.max);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = alpha * 0.4;
      ctx.strokeStyle = p.glow || p.color;
      ctx.lineWidth = S(13.8);
      strokePath(p.pts);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "#f5feff";
      ctx.lineWidth = S(2.8);
      strokePath(p.pts);
    } else if (p.kind === "kunai" || p.kind === "shuriken") {
      ctx.translate(p.x, p.y);
      const ang = p.stuck ? p.stickAng : p.kind === "shuriken" ? p.spin || 0 : Math.atan2(p.vy, p.vx);
      drawWeapon(ctx, p.kind, p.r, ang);
    } else if (p.kind === "shock") {
      const fade = Math.max(0, p.life / (p.max || 1));
      ctx.globalAlpha = fade;
      ctx.strokeStyle = p.color || "#fff7f8";
      ctx.lineWidth = p.width || Math.max(1.25, S(2));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPopFlash(ball) {
    if (!(ball.pop > 0) || ball.pop > 0.24) return;
    const t = ball.pop / 0.24;
    const char = getCharacter(ball.charId);
    const rad = ball.r * (0.85 + t * 2.8);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = (1 - t) * 0.9;
    const g = ctx.createRadialGradient(ball.x, ball.y, rad * 0.04, ball.x, ball.y, rad);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.28, char?.highlight || "#ffffff");
    g.addColorStop(0.62, char?.color || "#ffffff");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function ensureSmokeLayer() {
    const bw = canvas.width;
    const bh = canvas.height;
    if (!smokeLayer || smokeLayer.width !== bw || smokeLayer.height !== bh) {
      smokeLayer = document.createElement("canvas");
      smokeLayer.width = bw;
      smokeLayer.height = bh;
      smokeCtx = smokeLayer.getContext("2d");
    }
  }

  function drawFrontSmoke() {
    const fronts = particles.filter((q) => q.kind === "smoke");
    if (!fronts.length || W < 2) return;
    ensureSmokeLayer();
    smokeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    smokeCtx.clearRect(0, 0, W, W);
    for (const q of fronts) {
      const fade = Math.max(0, q.life / q.max);
      const age = 1 - fade;
      const hold = age < 0.5 ? 1 : Math.pow((1 - age) / 0.5, 1.25);
      const alpha = hold * q.alpha;
      paintRoundSmoke(smokeCtx, q, q.x, q.y, q.r, alpha);
    }
    const holes = new Map();
    for (const q of fronts) {
      if (q.ox == null || q.max < 0.2) continue;
      const age = 1 - q.life / q.max;
      const key = `${q.ox.toFixed(1)},${q.oy.toFixed(1)}`;
      const prev = holes.get(key);
      if (!prev || age < prev.age) holes.set(key, { x: q.ox, y: q.oy, age });
    }
    if (holes.size) {
      smokeCtx.save();
      smokeCtx.globalCompositeOperation = "destination-out";
      for (const hole of holes.values()) {
        if (hole.age < 0.26) continue;
        const open = Math.min(1, (hole.age - 0.26) / 0.42);
        const rad = S(20.8) + open * S(53.1);
        const g = smokeCtx.createRadialGradient(hole.x, hole.y, rad * 0.05, hole.x, hole.y, rad);
        g.addColorStop(0, `rgba(0,0,0,${0.82 + open * 0.18})`);
        g.addColorStop(0.42, `rgba(0,0,0,${0.4 + open * 0.35})`);
        g.addColorStop(0.78, `rgba(0,0,0,${0.06 + open * 0.1})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        smokeCtx.fillStyle = g;
        smokeCtx.beginPath();
        smokeCtx.arc(hole.x, hole.y, rad, 0, Math.PI * 2);
        smokeCtx.fill();
      }
      smokeCtx.restore();
    }
    ctx.save();
    ctx.filter = `blur(${Math.max(1.5, S(2.5))}px)`;
    ctx.drawImage(smokeLayer, 0, 0, W, W);
    ctx.restore();
  }

  function paintRoundSmoke(target, q, x, y, radius, alpha) {
    if (alpha < 0.008 || radius < 0.5) return;
    const g = target.createRadialGradient(x, y, radius * 0.05, x, y, radius);
    g.addColorStop(0, `rgba(${q.color}, ${alpha * 0.9})`);
    g.addColorStop(0.42, `rgba(${q.color}, ${alpha * 0.42})`);
    g.addColorStop(1, `rgba(${q.color}, 0)`);
    target.fillStyle = g;
    target.beginPath();
    target.arc(x, y, radius, 0, Math.PI * 2);
    target.fill();
  }

  function strokePath(pts) {
    ctx.beginPath();
    pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
    ctx.stroke();
  }

  function startLoop() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  return { setFighters, setArena, start, toPreview, getState, debug, startLoop };
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function segmentHits(a, b, cx, cy, r) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const len2 = vx * vx + vy * vy;
  if (len2 < 1) return Math.hypot(cx - a.x, cy - a.y) <= r;
  let t = ((cx - a.x) * vx + (cy - a.y) * vy) / len2;
  t = clamp(t, 0, 1);
  const px = a.x + vx * t;
  const py = a.y + vy * t;
  return Math.hypot(cx - px, cy - py) <= r;
}
