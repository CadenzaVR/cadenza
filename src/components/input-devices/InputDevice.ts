import { Object3D } from "three";
import AudioManager from "../../audio/AudioManager";
import InputProvider from "../../input/InputProvider";
import SettingsManager from "../../settings/SettingsManager";

export default class InputDevice {
  object3D: Object3D;
  inputProvider: InputProvider;
  audio: AudioManager;
  settings: SettingsManager;

  constructor(
    object3D: Object3D,
    inputProvider: InputProvider,
    audio: AudioManager,
    settings: SettingsManager
  ) {
    this.object3D = object3D;
    this.inputProvider = inputProvider;
    this.audio = audio;
    this.settings = settings;

    settings.addObserver("keyboardHeightOffset", (value) => {
      this.updateHeight(value);
    });
  }

  updateHeight(height: number): void {
    this.object3D.position.y = height / 100;
  }
}
