import { TONE_VOLUME_INPUT } from "../../game/TonoGameState";
import SimpleInputProvider from "../../input/SimpleInputProvider";

// 12 * log2(f/440) + 69
// 12 * (log2(f) - log2(440)) + 69
// 12(log2(f)) - 12(log2(440)) + 69
// 12log2(f) - 12(log2(8) + log2(55)) + 69
// 12log2(f) - 12log2(55) + 33
const FREQ_TO_MIDI_CONST = 33 - 12 * Math.log2(55) - 60;
const DEFAULT_PITCH = [0, 0];

function freqToMidi(frequency: number): number {
  return 12 * Math.log2(frequency) + FREQ_TO_MIDI_CONST;
}

AFRAME.registerComponent("microphone", {
  schema: {
    clarityThreshold: { type: "number", default: 0.5 },
    volumeThreshold: { type: "number", default: 15 },
    minFrequency: { type: "number", default: 50 },
  },

  init: function () {
    this.enabled = false;
    this.isKaraoke = false;
    this.input = { id: TONE_VOLUME_INPUT, value: 0 };
    this.inputProvider = new SimpleInputProvider([this.input]);
    this.el.sceneEl.systems.input.registerInputProvider(this.inputProvider);
    this.mousedown = false;
    this.mouseEnabled = true;

    this.volumeThreshold = this.data.volumeThreshold;

    this.audioContext = new AudioContext({
      latencyHint: 0,
    });

    this.el.sceneEl.addEventListener("enter-vr", () => {
      if (this.el.sceneEl.xrSession) {
        this.mouseEnabled = false;
        this.mousedown = false;
        this.audioContext.resume();
      }
    });

    this.el.sceneEl.addEventListener("exit-vr", () => {
      this.mouseEnabled = true;
      this.mousedown = false;
    });

    if (window.crossOriginIsolated) {
      this.audioContext.audioWorklet
        .addModule("/js/analyser-processor.js")
        .then(() => {
          this.analyser = new AudioWorkletNode(this.audioContext, "analyser");
          this.analyserDataBuffer = new Int32Array(new SharedArrayBuffer(32));
          this.analyser.port.postMessage({ buffer: this.analyserDataBuffer });
        })
        .catch((e: any) => {
          console.error(e);
        });
    }

    this.el.sceneEl.addEventListener("mousedown", (e: MouseEvent) => {
      if (this.enabled && this.mouseEnabled && e.button === 0) {
        this.input.value = 100;
        this.inputProvider.notifyListeners(this.input);
        this.mousedown = true;
      }
    });

    this.el.sceneEl.addEventListener("mouseup", (e: MouseEvent) => {
      if (this.enabled && this.mouseEnabled && e.button === 0) {
        this.input.value = 0;
        this.inputProvider.notifyListeners(this.input);
        this.mousedown = false;
      }
    });

    this.el.sceneEl.addEventListener("triggerdown", () => {
      if (this.enabled) {
        this.input.value = 100;
        this.inputProvider.notifyListeners(this.input);
        this.mousedown = true;
      }
    });

    this.el.sceneEl.addEventListener("triggerup", () => {
      if (this.enabled) {
        this.input.value = 0;
        this.inputProvider.notifyListeners(this.input);
        this.mousedown = false;
      }
    });
  },

  enableMic: async function () {
    if (!this.enabled) {
      // try {
      //   this.micAudioStream = await navigator.mediaDevices.getUserMedia({
      //     audio: {
      //       echoCancellation: false,
      //       noiseSuppression: false,
      //       autoGainControl: false,
      //       latency: 0,
      //     } as MediaTrackConstraints,
      //   });

      //   this.micAudioStreamNode = this.audioContext.createMediaStreamSource(
      //     this.micAudioStream
      //   );
      //   this.micAudioStreamNode.connect(this.analyser);
      // } catch (e) {
      //   console.error(e);
      // }
      this.enabled = true;
    }
  },

  disableMic: function () {
    if (this.enabled) {
      // this.micAudioStream
      //   .getTracks()
      //   .forEach((track: MediaStreamTrack) => track.stop());
      // this.micAudioStream = null;
      // this.micAudioStreamNode.disconnect();
      // this.micAudioStreamNode = null;
      this.input.value = 0;
      this.inputProvider.notifyListeners(this.input);
      this.enabled = false;
      this.mousedown = false;
    }
  },

  tick: function () {
    if (this.enabled) {
      let volume: number | bigint = 0;
      if (this.analyser) {
        volume = Atomics.load(this.analyserDataBuffer, 0);
      }

      const prevInputValue = this.input.value;
      if (volume > this.volumeThreshold) {
        this.input.value = volume;
        if (!prevInputValue) {
          this.inputProvider.notifyListeners(this.input);
        }
      } else if (!this.mousedown) {
        this.input.value = 0;
        if (prevInputValue) {
          this.inputProvider.notifyListeners(this.input);
        }
      }
    }
  },
});
