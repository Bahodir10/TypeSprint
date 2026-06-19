import { state } from '../core/state.js';

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let isAudioUnlocked = false;

export function setMuteState(muted) {
    state.isMuted = muted;
    document.getElementById('muteBtn').textContent = muted ? '🔇' : '🔊';
    localStorage.setItem('typingTestMuted', state.isMuted);
}

export function playKeySound() {
    if (state.isMuted || !isAudioUnlocked) return;
    const now = audioContext.currentTime;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    gain.gain.setValueAtTime(1.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now); osc.stop(now + 0.12);
}

export function unlockAudio() {
    if (isAudioUnlocked) return;
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator();
    const g = audioContext.createGain();
    osc.connect(g); g.connect(audioContext.destination);
    g.gain.value = 0; osc.start(0); osc.stop(0.001);
    isAudioUnlocked = true;
}