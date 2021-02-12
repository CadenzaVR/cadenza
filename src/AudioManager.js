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
