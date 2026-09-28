// System Settings Service
import { storageService, STORAGE_KEYS } from './storageService';

export const settingsService = {
  getSettings() {
    return storageService.getRaw(STORAGE_KEYS.SETTINGS) || {};
  },

  updateSettings(updates) {
    const current = this.getSettings();
    const merged = { ...current, ...updates };
    storageService.setRaw(STORAGE_KEYS.SETTINGS, merged);
    return merged;
  },

  resetAllData() {
    storageService.resetAllToDefault();
    return true;
  },
};
