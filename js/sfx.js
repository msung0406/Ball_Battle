let ac = null;
let enabled = true;

const presets = {
  tick: [520, 0.07, "square", 0.03],
  fight: [740, 0.12, "square", 0.04],
  dash: [170, 0.14, "sawtooth", 0.035],
  laser: [960, 0.1, "square", 0.028],
  shot: [640, 0.05, "square", 0.03],
  pulse: [90, 0.22, "sine", 0.05],
  blink: [720, 0.09, "triangle", 0.03],
  hit: [150, 0.07, "square", 0.04],
  ko: [210, 0.42, "sawtooth", 0.05],
  roar: [90, 0.38, "sawtooth", 0.05],
};

export function unlockAudio() {
  try {
    if (!ac) ac = new AudioContext();
    if (ac.state === "suspended") ac.resume();
  } catch {
    ac = null;
  }
}

export function toggleMute() {
  enabled = !enabled;
  return enabled;
}

export function play(name) {
  if (!enabled || !ac) return;
  const preset = presets[name];
  if (!preset) return;
  const [freq, dur, type, gain] = preset;
  const t = ac.currentTime;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (name === "ko") {
    o.frequency.exponentialRampToValueAtTime(70, t + dur);
  }
  if (name === "roar") {
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(240, t + 0.14);
    o.frequency.exponentialRampToValueAtTime(55, t + dur);
  }
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(ac.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}
