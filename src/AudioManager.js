import { Howl } from "howler";

export default class AudioManager {
  constructor() {
    this.song = new Audio();
    this.menuAudio = new Audio();
    this.menuAudio.loop = true;
    this.hitSoundsEnabled = false;
    this.hitSound = new Howl({
      src: ["/sounds/hit.ogg"],
    });
    this.releaseSound = new Howl({
      src: ["/sounds/release.ogg"],
    });
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
        this.analyser = this.audioCtx.createAnalyser();
        this.audioCtx
          .createMediaElementSource(this.song)
          .connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        this.audioData = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
  }

  getFrequencyData() {
    this.analyser.getByteFrequencyData(this.audioData);
  }

  loadSong(src) {
    this.song.src = src;
    this.song.load();
  }

  playHitSound() {
    if (this.hitSoundsEnabled) {
      this.hitSound.play();
    }
  }

  playReleaseSound() {
    if (this.hitSoundsEnabled) {
      this.releaseSound.play();
    }
  }
}
