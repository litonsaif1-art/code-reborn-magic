// Plays a Facebook Messenger-style notification sound for AI Advisor messages

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function playAdvisorNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Facebook Messenger-style "pop" sound — two quick tones
    const tones = [
      { freq: 880, start: 0, duration: 0.08, gain: 0.18 },
      { freq: 1174.66, start: 0.09, duration: 0.12, gain: 0.22 },
    ];

    tones.forEach(({ freq, start, duration, gain: vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });
  } catch (e) {
    console.warn("[AdvisorSound] Could not play:", e);
  }
}
