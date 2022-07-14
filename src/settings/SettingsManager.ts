import Setting from "./models/Setting";
import SettingsRepository from "./repositories/SettingsRepository";

export default class SettingsManager {
  settingsRepository: SettingsRepository;
  observers: Map<string, Array<(newValue: any) => void>>;

  constructor(settingsRepository: SettingsRepository) {
    this.settingsRepository = settingsRepository;
    this.observers = new Map();
  }

  addObserver(settingKey: string, observer: (newValue: any) => void) {
    if (!this.observers.has(settingKey)) {
      this.observers.set(settingKey, []);
    }
    this.observers.get(settingKey).push(observer);
  }

  updateSetting(key: string, value: any) {
    this.settingsRepository.insertOrUpdate(new Setting(key, value));
    if (this.observers.has(key)) {
      for (const observer of this.observers.get(key)) {
        observer(value);
      }
    }
  }

  getSettingValue(key: string) {
    return this.settingsRepository.get(key).value;
  }
}
