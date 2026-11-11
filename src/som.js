// Sons sintetizados na hora (Web Audio): sem arquivo, sem download.
let ctx;
const audio = () => (ctx ??= new AudioContext());
export function destravarSom() {
  audio().resume?.();
}

function ruido(seg, filtro = 2000, volume = 0.5, queda = 0.1, atraso = 0) {
  const a = audio();
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * seg), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / a.sampleRate / queda);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = filtro;
  const g = a.createGain();
  g.gain.value = volume;
  src.connect(f).connect(g).connect(a.destination);
  src.start(a.currentTime + atraso);
}

function tom(freq, seg, volume = 0.4, queda = 0.05, atraso = 0, desce = 0) {
  const a = audio();
  const o = a.createOscillator();
  const g = a.createGain();
  const t = a.currentTime + atraso;
  o.frequency.setValueAtTime(freq, t);
  if (desce) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq - desce), t + seg);
  g.gain.setValueAtTime(volume, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + seg);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + seg + 0.02);
}

export const som = {
  tapa() { tom(90, 0.3, 0.7, 0.08, 0, 50); ruido(0.25, 3500, 0.6, 0.03); },
  clack(atraso = 0) { tom(2300, 0.05, 0.25, 0.01, atraso); ruido(0.04, 6000, 0.25, 0.006, atraso); },
  tacada() { [0, 0.12, 0.2, 0.29, 0.41].forEach((t, i) => som.clack(t + i * 0.01)); },
  toc() { tom(950, 0.08, 0.35); ruido(0.02, 5000, 0.12, 0.004); },
  batida() { [0, 0.22, 0.42].forEach((t) => { tom(120, 0.12, 0.6, 0.03, t); ruido(0.06, 900, 0.35, 0.01, t); }); },
  cafe() { ruido(1.4, 900, 0.18, 1.2); },
  porta() { tom(180, 0.3, 0.3, 0.06, 0, 120); },
  passo() {},
};
