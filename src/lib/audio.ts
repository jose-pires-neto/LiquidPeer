type AudioContextConstructor = typeof AudioContext;

const getAudioContextClass = (): AudioContextConstructor | null => {
  return window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext ||
    null;
};

// Singleton AudioContext — browsers limit simultaneous contexts (~6 max).
// Reusing one context across all sound calls prevents silent failures after
// many transfers and avoids the "AudioContext was not allowed to start" warning.
let _sharedCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (_sharedCtx && _sharedCtx.state !== 'closed') return _sharedCtx;
  const AudioCtx = getAudioContextClass();
  if (!AudioCtx) return null;
  _sharedCtx = new AudioCtx();
  return _sharedCtx;
};

export const playDropletSound = (): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.error('Audio error', e);
  }
};

export const playBubbleSound = (): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.error('Audio error', e);
  }
};

export const playFlowSound = (): void => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    for (let i = 0; i < 4; i++) {
      const time = ctx.currentTime + i * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const startFreq = 200 + Math.random() * 80;
      const endFreq = 650 + Math.random() * 150;
      osc.frequency.setValueAtTime(startFreq, time);
      osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.07);

      gain.gain.setValueAtTime(0.1, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.07);
    }
  } catch (e) {
    console.error('Audio error', e);
  }
};
