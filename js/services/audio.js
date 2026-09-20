export class AudioService {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.audioCtx = null;
  }

  speakLetter(letter) {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
    utterance.lang = "es-ES";
    utterance.rate = 0.85;
    utterance.pitch = 1.2;
    this.synth.speak(utterance);
  }

  speakPhrase(phrase) {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = "es-ES";
    utterance.rate = 0.9;
    this.synth.speak(utterance);
  }

  _getAudioContext() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.audioCtx = new AudioContext();
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playPop() {
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.07);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  playCelebration() {
    const ctx = this._getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + (idx * 0.1);

      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }
}
