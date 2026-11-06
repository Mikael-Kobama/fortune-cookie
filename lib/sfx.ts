// Sons 8-bit gerados na hora com Web Audio (onda quadrada + ruído). Zero arquivo de áudio.

let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (typeof window === "undefined" || muted) return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, vol = 0.05, slideTo?: number) {
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = "square";
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(at: number, dur: number, vol = 0.1) {
  const c = audio();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);

  const src = c.createBufferSource();
  const gain = c.createGain();
  src.buffer = buffer;
  gain.gain.value = vol;
  src.connect(gain).connect(c.destination);
  src.start(c.currentTime + at);
}

export const sfx = {
  setMuted(value: boolean) {
    muted = value;
  },
  // tremidinha: seis "toc" alternando entre dois tons
  shake() {
    for (let i = 0; i < 6; i++) tone(170 + (i % 2) * 45, i * 0.14, 0.06, 0.035);
  },
  crack() {
    noise(0, 0.07, 0.09);
    tone(140, 0, 0.12, 0.04, 60);
  },
  snap() {
    noise(0, 0.2, 0.14);
    tone(520, 0, 0.14, 0.05, 110);
  },
  // arpejo subindo quando o papelzinho aparece
  jingle() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.13, 0.04));
  },
  tick() {
    tone(660, 0, 0.03, 0.015);
  },
};
