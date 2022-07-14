import Setting from "../models/Setting";
import SettingsRepository from "./SettingsRepository";

export default class LocalStorageSettingsRepository
  implements SettingsRepository
{
  insertOrUpdate(setting: Setting<any>) {
    const storedSettings = localStorage.getItem("settings");
    let settings: Record<string, any> = {};
    if (storedSettings) {
      settings = JSON.parse(storedSettings);
    }
    settings[setting.key] = setting.value;
    localStorage.setItem("settings", JSON.stringify(settings));
  }

  get(key: string): Setting<any> {
    const storedSettings = localStorage.getItem("settings");
    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      return new Setting(key, settings[key]);
    }
    return new Setting(key, null);
  }

  getAll(): Setting<any>[] {
    const storedSettings = localStorage.getItem("settings");
    if (storedSettings) {
      return Object.entries(JSON.parse(storedSettings)).map(
        (entry) => new Setting(entry[0], entry[1])
      );
    }
    return [];
  }
}
