// Web Audio: төгөлдөр хуурын давталт + нийлэгжүүлсэн хуудас эргэх чимээ.
// HTMLAudioElement-ийн volume iOS дээр ажилладаггүй тул GainNode ашиглана.

const MUSIC_URL = "/audio/piano.mp3";
const MUSIC_VOLUME = 0.35;
const FADE_IN = 1.5;
const FADE_OUT = 0.6;

let ctx: AudioContext | null = null;
let musicBuffer: AudioBuffer | null = null;
let musicLoading: Promise<AudioBuffer | null> | null = null;
let musicSource: AudioBufferSourceNode | null = null;
let musicGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let enabled = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

function loadMusic(ac: AudioContext): Promise<AudioBuffer | null> {
  if (musicBuffer) return Promise.resolve(musicBuffer);
  musicLoading ??= fetch(MUSIC_URL)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
    .then((data) => ac.decodeAudioData(data))
    .then((buf) => (musicBuffer = buf))
    .catch(() => {
      musicLoading = null;
      return null;
    });
  return musicLoading;
}

/** Хэрэглэгчийн үйлдлийн дотроос дуудна (autoplay бодлого). */
export async function enableSound(): Promise<boolean> {
  const ac = getContext();
  if (!ac) return false;
  enabled = true;
  if (ac.state === "suspended") await ac.resume();
  const buf = await loadMusic(ac);
  if (!buf || !enabled || musicSource) return Boolean(buf);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(MUSIC_VOLUME, ac.currentTime + FADE_IN);
  gain.connect(ac.destination);

  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.connect(gain);
  src.start();

  musicSource = src;
  musicGain = gain;
  return true;
}

export function disableSound() {
  enabled = false;
  const ac = ctx;
  const src = musicSource;
  const gain = musicGain;
  musicSource = null;
  musicGain = null;
  if (!ac || !src || !gain) return;
  gain.gain.cancelScheduledValues(ac.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + FADE_OUT);
  src.stop(ac.currentTime + FADE_OUT + 0.05);
}

/** Богино шуугиантай noise burst, bandpass 1–4kHz, 120мс. Дуу асаалттай үед л. */
export function playPageTurn() {
  const ac = ctx;
  if (!enabled || !ac || ac.state !== "running") return;

  const duration = 0.12;
  if (!noiseBuffer) {
    const len = Math.floor(ac.sampleRate * duration);
    noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  const src = ac.createBufferSource();
  src.buffer = noiseBuffer;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;

  // 2kHz төв, Q≈0.67 → ойролцоогоор 1–4kHz зурвас
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 2000;
  band.Q.value = 0.67;

  const env = ac.createGain();
  const t = ac.currentTime;
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(0.22, t + 0.015);
  env.gain.exponentialRampToValueAtTime(0.001, t + duration);

  src.connect(band).connect(env).connect(ac.destination);
  src.start(t);
  src.stop(t + duration);
}
