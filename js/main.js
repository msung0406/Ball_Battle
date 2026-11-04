import { drawCharacter, getCharacter, onPortraits, roster } from "./character/index.js?v=94";
import { createMatch } from "./engine.js?v=125";
import { toggleMute, unlockAudio } from "./sfx.js?v=30";

const page = document.querySelector(".page");
const dock = document.querySelector(".dock");
const rosterEl = document.querySelector("#roster");
const info1 = document.querySelector("#info1");
const info2 = document.querySelector("#info2");
const fightBtn = document.querySelector("#fight");
const abortBtn = document.querySelector("#abort");
const reselectBtn = document.querySelector("#reselect");
const muteBtn = document.querySelector("#mute");
const debugToggle = document.querySelector("#debug-toggle");
const debugPanel = document.querySelector("#debug");
const banner = document.querySelector("#banner");
const bannerKicker = document.querySelector("#banner-kicker");
const bannerTitle = document.querySelector("#banner-title");
const bannerSub = document.querySelector("#banner-sub");
const toastEl = document.querySelector("#toast");
const canvas = document.querySelector("#arena");
const arenaWrap = document.querySelector(".arena-wrap");
const arenaOpts = document.querySelectorAll(".arena-opt");

let p1 = "naruto";
let p2 = "nova";
let toastTimer = 0;
let bannerKey = "";
let arenaSize = 600;

const engine = createMatch(canvas, { onChange });

document.body.addEventListener("pointerdown", () => unlockAudio());

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
}

function paintPortrait(node, char, look, flash = 0) {
  const ctx = node.getContext("2d");
  const w = node.width;
  ctx.clearRect(0, 0, w, w);
  drawCharacter(ctx, char, {
    x: w / 2,
    y: w / 2 + w * 0.03,
    r: w * 0.3,
    look,
    flash,
  });
}

function fitOneLine(el) {
  if (!el || el.clientWidth <= 0) return;
  el.style.fontSize = "";
  const max = parseFloat(getComputedStyle(el).fontSize);
  if (!Number.isFinite(max) || max <= 0) return;
  if (el.scrollWidth <= el.clientWidth + 0.5) return;
  let lo = 8;
  let hi = max;
  for (let n = 0; n < 18; n += 1) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = `${mid}px`;
    if (el.scrollWidth > el.clientWidth + 0.5) hi = mid;
    else lo = mid;
  }
  el.style.fontSize = `${Math.floor(lo * 10) / 10}px`;
}

function fitSelectNames() {
  for (const el of rosterEl.querySelectorAll(".t-name")) fitOneLine(el);
  for (const root of [info1, info2]) {
    const name = root.querySelector("h3");
    if (name) fitOneLine(name);
  }
}

function renderInfo(root, id, side) {
  const char = getCharacter(id);
  root.innerHTML = "";
  root.style.setProperty("--accent", char.color);
  const label = document.createElement("p");
  label.className = "side-label";
  label.textContent = side;
  const name = document.createElement("h3");
  name.textContent = char.name;
  const en = document.createElement("p");
  en.className = "en";
  en.textContent = char.en;
  const stats = document.createElement("dl");
  for (const [term, value] of [
    ["체력", char.hp],
    ["속도", char.speed],
  ]) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = String(value);
    row.append(dt, dd);
    stats.append(row);
  }
  root.append(label, name, en, stats);
  fitSelectNames();
}

function syncRoster() {
  for (const token of rosterEl.querySelectorAll(".token")) {
    const id = token.dataset.id;
    token.classList.toggle("is-p1", id === p1);
    token.classList.toggle("is-p2", id === p2);
    token.querySelector(".token-main").setAttribute("aria-pressed", String(id === p1));
  }
}

function select(id, player) {
  if (engine.getState() !== "preview") return;
  const other = player === 1 ? p2 : p1;
  if (id === other) {
    toast("같은 공은 선택할 수 없습니다");
    const token = rosterEl.querySelector(`[data-id="${id}"]`);
    token?.classList.remove("shake");
    void token?.offsetWidth;
    token?.classList.add("shake");
    return;
  }
  if (player === 1) p1 = id;
  else p2 = id;
  syncRoster();
  renderInfo(info1, p1, "1P");
  renderInfo(info2, p2, "2P");
  engine.setFighters(p1, p2);
}

function step(player, dir) {
  const ids = roster.map((c) => c.id);
  const current = player === 1 ? p1 : p2;
  const other = player === 1 ? p2 : p1;
  let index = ids.indexOf(current);
  for (let n = 0; n < ids.length; n += 1) {
    index = (index + dir + ids.length) % ids.length;
    if (ids[index] !== other) {
      select(ids[index], player);
      return;
    }
  }
}

function buildRoster() {
  for (const char of roster) {
    const token = document.createElement("div");
    token.className = "token";
    token.dataset.id = char.id;

    const main = document.createElement("button");
    main.type = "button";
    main.className = "token-main";
    main.setAttribute("aria-label", `${char.name}, 1P로 선택`);

    const face = document.createElement("canvas");
    face.width = 144;
    face.height = 144;
    paintPortrait(face, char, -0.4);

    const name = document.createElement("span");
    name.className = "t-name";
    name.textContent = char.name;
    main.append(face, name);

    const asP2 = document.createElement("button");
    asP2.type = "button";
    asP2.className = "as-p2";
    asP2.textContent = "2P";
    asP2.setAttribute("aria-label", `${char.name}, 2P로 선택`);

    main.addEventListener("click", (event) => select(char.id, event.shiftKey ? 2 : 1));
    main.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      select(char.id, 2);
    });
    asP2.addEventListener("click", () => select(char.id, 2));

    token.append(main, asP2);
    rosterEl.append(token);
  }
}

function setMeter(fill, meter, text, maxText, hp, maxHp) {
  const pct = maxHp <= 0 ? 0 : Math.max(0, Math.min(1, hp / maxHp));
  fill.style.transform = `scaleX(${pct})`;
  fill.classList.toggle("mid", pct <= 0.55 && pct > 0.28);
  fill.classList.toggle("low", pct <= 0.28);
  const shown = String(Math.round(hp));
  if (text.textContent !== shown) text.textContent = shown;
  const maxShown = `/ ${maxHp}`;
  if (maxText.textContent !== maxShown) maxText.textContent = maxShown;
  meter.setAttribute("aria-valuemax", String(maxHp));
  meter.setAttribute("aria-valuenow", shown);
}

function updateHud(snap) {
  const nodes = [
    {
      fighter: document.querySelector("#fighter1"),
      name: document.querySelector("#name1"),
      port: document.querySelector("#port1"),
      fill: document.querySelector("#hp1"),
      meter: document.querySelector("#meter1"),
      text: document.querySelector("#hptext1"),
      max: document.querySelector("#hpmax1"),
      look: 0.2,
    },
    {
      fighter: document.querySelector("#fighter2"),
      name: document.querySelector("#name2"),
      port: document.querySelector("#port2"),
      fill: document.querySelector("#hp2"),
      meter: document.querySelector("#meter2"),
      text: document.querySelector("#hptext2"),
      max: document.querySelector("#hpmax2"),
      look: Math.PI - 0.2,
    },
  ];
  snap.fighters.forEach((fighter, index) => {
    if (!fighter) return;
    const node = nodes[index];
    const char = getCharacter(fighter.id);
    if (node.name.textContent !== fighter.name) node.name.textContent = fighter.name;
    node.fighter.classList.toggle("is-out", snap.winner !== 0 && snap.winner !== fighter.player);
    node.fighter.style.setProperty("--ball", char.color);
    setMeter(node.fill, node.meter, node.text, node.max, fighter.hp, fighter.maxHp);
    paintPortrait(node.port, char, node.look, fighter.flash);
  });
}

function updateChrome(snap) {
  const key = `${snap.state}|${snap.banner?.title || ""}|${snap.banner?.sub || ""}`;
  const battling = snap.state === "countdown" || snap.state === "fight";
  page.classList.toggle("is-battle", battling);
  page.classList.toggle("is-standby", snap.state === "preview");
  dock.classList.toggle("is-hidden", battling);
  abortBtn.classList.toggle("is-hidden", !battling);
  rosterEl.inert = snap.state !== "preview";
  rosterEl.classList.toggle("is-locked", snap.state !== "preview");
  reselectBtn.classList.toggle("is-hidden", snap.state !== "ko");
  const arenaLocked = battling;
  for (const btn of arenaOpts) btn.disabled = arenaLocked;

  if (snap.state === "preview") {
    fightBtn.disabled = p1 === p2;
    fightBtn.textContent = "대결 시작";
  } else if (snap.state === "ko") {
    fightBtn.disabled = false;
    fightBtn.textContent = "리매치";
  } else {
    fightBtn.disabled = true;
    fightBtn.textContent = "전투 중";
  }

  if (key === bannerKey) return;
  bannerKey = key;
  if (!snap.banner) {
    banner.classList.add("is-hidden");
    banner.classList.remove("is-result");
    bannerTitle.textContent = "";
    bannerKicker.textContent = "";
    bannerSub.textContent = "";
    return;
  }
  banner.classList.remove("is-hidden");
  banner.classList.toggle("is-result", snap.state === "ko");
  bannerKicker.textContent = snap.banner.kicker;
  bannerTitle.textContent = snap.banner.title;
  bannerSub.textContent = snap.banner.sub;
  banner.classList.remove("pop");
  void banner.offsetWidth;
  banner.classList.add("pop");
}

function syncDebug(snap) {
  snap.fighters.forEach((fighter) => {
    if (!fighter) return;
    const btn = debugPanel.querySelector(`[data-player="${fighter.player}"] [data-act="god"]`);
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(fighter.god));
    btn.textContent = fighter.god ? "무적 해제" : "무적";
  });
}

function applyShake(amount) {
  if (!amount || amount < 0.5) {
    arenaWrap.style.transform = "";
    return;
  }
  const x = (Math.random() - 0.5) * amount * 2;
  const y = (Math.random() - 0.5) * amount * 2;
  arenaWrap.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
}

function onChange(snap) {
  updateHud(snap);
  updateChrome(snap);
  syncDebug(snap);
  applyShake(snap.shake);
}

function setArenaSize(size) {
  const mode = engine.getState();
  if (mode === "fight" || mode === "countdown") return;
  arenaSize = size === 300 ? 300 : 600;
  document.documentElement.style.setProperty("--arena", `${arenaSize}px`);
  engine.setArena(arenaSize);
  for (const btn of arenaOpts) {
    btn.setAttribute("aria-pressed", String(Number(btn.dataset.arena) === arenaSize));
  }
}

document.querySelector(".arena-pick")?.addEventListener("click", (event) => {
  const btn = event.target.closest(".arena-opt");
  if (!btn) return;
  setArenaSize(Number(btn.dataset.arena));
});

fightBtn.addEventListener("click", () => {
  unlockAudio();
  const mode = engine.getState();
  if (mode === "preview" || mode === "ko") engine.start();
});

reselectBtn.addEventListener("click", () => {
  engine.toPreview();
});

abortBtn.addEventListener("click", () => {
  if (engine.getState() === "countdown" || engine.getState() === "fight") engine.toPreview();
});

debugToggle.addEventListener("click", () => {
  const open = debugPanel.classList.toggle("is-hidden") === false;
  debugToggle.textContent = open ? "디버그 끄기" : "디버그";
  debugToggle.setAttribute("aria-pressed", String(open));
});

debugPanel.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-act]");
  if (!btn) return;
  const player = Number(btn.closest("[data-player]")?.dataset.player);
  if (player !== 1 && player !== 2) return;
  engine.debug(player, btn.dataset.act);
});

muteBtn.addEventListener("click", () => {
  const on = toggleMute();
  muteBtn.textContent = on ? "소리 켜짐" : "소리 꺼짐";
  muteBtn.setAttribute("aria-pressed", String(!on));
  if (on) unlockAudio();
});

window.addEventListener("keydown", (event) => {
  const mode = engine.getState();
  const key = event.key.toLowerCase();
  if ((key === "a" || key === "d") && mode === "preview") {
    step(1, key === "a" ? -1 : 1);
    event.preventDefault();
  }
  if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && mode === "preview") {
    step(2, event.key === "ArrowLeft" ? -1 : 1);
    event.preventDefault();
  }
  if (event.key === "Enter" && !event.target.closest?.(".token, button")) {
    if (mode === "preview" || mode === "ko") {
      event.preventDefault();
      fightBtn.click();
    }
  }
});

buildRoster();
const namesWatch = new ResizeObserver(() => fitSelectNames());
namesWatch.observe(rosterEl);
namesWatch.observe(info1);
namesWatch.observe(info2);
document.fonts.ready.then(fitSelectNames);
onPortraits(() => {
  for (const token of rosterEl.querySelectorAll(".token")) {
    const face = token.querySelector("canvas");
    const char = getCharacter(token.dataset.id);
    if (face && char) paintPortrait(face, char, -0.4);
  }
});
syncRoster();
renderInfo(info1, p1, "1P");
renderInfo(info2, p2, "2P");
engine.setFighters(p1, p2);
engine.startLoop();
