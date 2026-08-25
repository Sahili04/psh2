// Web Audio API Synthesizer for Real-Time Emergency SOS Beep / Siren

let audioCtx: AudioContext | null = null;
let isBeeping = false;
let beepIntervalId: any = null;

export function playEmergencyBeep() {
  if (isBeeping) return;
  isBeeping = true;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    audioCtx = new AudioContextClass();

    let highPitch = true;
    beepIntervalId = setInterval(() => {
      if (!audioCtx || !isBeeping) return;

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = highPitch ? 950 : 650;
      highPitch = !highPitch;

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    }, 450);
  } catch (err) {
    console.error('Audio Context Error:', err);
  }
}

export function stopEmergencyBeep() {
  isBeeping = false;
  if (beepIntervalId) {
    clearInterval(beepIntervalId);
    beepIntervalId = null;
  }
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (e) {
      // ignore
    }
    audioCtx = null;
  }
}
