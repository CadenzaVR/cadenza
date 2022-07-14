import LocalStorageSettingsRepository from "../settings/repositories/LocalStorageSettingsRepository";
import SettingsManager from "../settings/SettingsManager";

AFRAME.registerSystem("setting", {
  schema: {}, // System schema. Parses into `this.data`.

  init: function () {
    this.settingsManager = new SettingsManager(
      new LocalStorageSettingsRepository()
    );
  },

  registerSetting: function (
    settingName: string,
    settingEl: any,
    settingComponent: string
  ) {
    settingEl.addEventListener("change", (e: CustomEvent) => {
      this.settingsManager.updateSetting(settingName, e.detail.value);
    });

    const storedValue = this.settingsManager.getSettingValue(settingName);
    if (storedValue) {
      settingEl.addEventListener("loaded", () => {
        settingEl.setAttribute(settingComponent, "value", storedValue);
      });
    } else {
      //trigger update to save initial values
      settingEl.addEventListener("loaded", () => {
        settingEl.components[settingComponent].update();
      });
    }
  },
});
