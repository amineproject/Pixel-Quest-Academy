let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export type RetroSoundType =
  | 'blip'
  | 'confirm'
  | 'save'
  | 'error'
  | 'switch'
  | 'start'
  | 'coin'
  | 'fanfare'
  | 'logout';

export function playRetroSound(type: RetroSoundType, enabled: boolean): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const playTone = (
    freq: number,
    startTime: number,
    duration: number,
    wave: OscillatorType = 'square',
    gainLevel = 0.045
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(gainLevel, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  switch (type) {
    case 'blip':
      playTone(587.33, now, 0.055);
      break;
    case 'confirm':
      playTone(523.25, now, 0.06);
      playTone(783.99, now + 0.06, 0.09);
      break;
    case 'save':
      playTone(523.25, now, 0.06);
      playTone(659.25, now + 0.06, 0.06);
      playTone(1046.5, now + 0.12, 0.12);
      break;
    case 'switch':
      playTone(440, now, 0.05, 'triangle');
      playTone(660, now + 0.05, 0.08, 'triangle');
      break;
    case 'error':
      playTone(196, now, 0.11, 'sawtooth', 0.06);
      playTone(146.83, now + 0.11, 0.18, 'sawtooth', 0.06);
      break;
    case 'start':
      // Cheerful Mario-style game start fanfare
      playTone(523.25, now, 0.07);
      playTone(659.25, now + 0.07, 0.07);
      playTone(783.99, now + 0.14, 0.07);
      playTone(1046.5, now + 0.21, 0.18);
      break;
    case 'coin':
      // Retro golden coin ding
      playTone(987.77, now, 0.06);
      playTone(1318.51, now + 0.06, 0.18);
      break;
    case 'fanfare':
      // Victory / Level Up fanfare
      playTone(523.25, now, 0.08);
      playTone(523.25, now + 0.09, 0.08);
      playTone(523.25, now + 0.18, 0.08);
      playTone(659.25, now + 0.27, 0.24);
      break;
    case 'logout':
      playTone(660, now, 0.06, 'triangle');
      playTone(440, now + 0.06, 0.09, 'triangle');
      playTone(220, now + 0.13, 0.14, 'triangle');
      break;
  }
}
