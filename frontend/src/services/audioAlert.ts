// Web Audio API Synthesizer for Real-Time Emergency SOS Siren / Alarm

let audioCtx: AudioContext | null = null;
let isBeeping = false;
let beepIntervalId: any = null;

// Initialize & unlock AudioContext on user interaction to comply with browser autoplay policies
export function initAudioOnUserGesture() {
  const unlock = () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    window.removeEventListener('click', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('click', unlock);
  window.addEventListener('keydown', unlock);
}

export function playEmergencyBeep() {
  isBeeping = true;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (beepIntervalId) {
      clearInterval(beepIntervalId);
    }

    let highPitch = true;

    // Trigger an immediate beep right away!
    const triggerTone = () => {
      if (!audioCtx || !isBeeping) return;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(highPitch ? 1050 : 750, audioCtx.currentTime);
      highPitch = !highPitch;

      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.38);
    };

    triggerTone();
    beepIntervalId = setInterval(triggerTone, 400);
  } catch (err) {
    console.error('Audio Context Alarm Error:', err);
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
      audioCtx.suspend();
    } catch (e) {
      // ignore
    }
  }
}
