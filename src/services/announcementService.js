// Announcement & Settings Services
import { storageService, STORAGE_KEYS } from './storageService';

export const announcementService = {
  getAllAnnouncements() {
    return storageService.getCollection(STORAGE_KEYS.ANNOUNCEMENTS);
  },

  getAnnouncementsForStudent(studentId) {
    const student = storageService.getItemById(STORAGE_KEYS.STUDENTS, studentId);
    if (!student) return [];
    const announcements = this.getAllAnnouncements();
    return announcements.filter(
      (a) => a.courseId === 'all' || (student.courseIds || []).includes(a.courseId)
    );
  },

  createAnnouncement(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Announcement title is required.');
    }
    const newAnnouncement = {
      id: `ann_${Date.now()}`,
      title: data.title.trim(),
      message: (data.message || '').trim(),
      courseId: data.courseId || 'all',
      priority: data.priority || 'normal',
      publishDate: new Date().toISOString(),
    };
    storageService.insertItem(STORAGE_KEYS.ANNOUNCEMENTS, newAnnouncement);
    return newAnnouncement;
  },

  deleteAnnouncement(id) {
    return storageService.deleteItem(STORAGE_KEYS.ANNOUNCEMENTS, id);
  },
};

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
