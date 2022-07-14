import Setting from "../models/Setting";

export default interface SettingsRepository {
  insertOrUpdate(setting: Setting<any>): void;
  get(key: string): Setting<any>;
  getAll(): Setting<any>[];
}
