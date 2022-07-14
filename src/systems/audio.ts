import AudioManager from "../audio/AudioManager";

AFRAME.registerSystem("audio", {
  init: function () {
    this.audioManager = new AudioManager();
  },
});
