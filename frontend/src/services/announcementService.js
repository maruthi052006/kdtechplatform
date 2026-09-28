// Authoritative Announcement Service connected to Django REST API & PostgreSQL
import api, { formatApiError } from './api';
import { storageService, STORAGE_KEYS } from './storageService';
import { syncService } from './syncService';

export const announcementService = {
  getAllAnnouncements() {
    return storageService.getCollection(STORAGE_KEYS.ANNOUNCEMENTS);
  },

  getAnnouncementsForStudent(studentId) {
    const student = storageService.getItemById(STORAGE_KEYS.STUDENTS, studentId);
    const session = storageService.getSession();
    const courseIds = student?.courseIds || session?.courseIds || [];
    const announcements = this.getAllAnnouncements();
    return announcements.filter(
      (a) => !a.courseId || a.courseId === 'all' || courseIds.some((cid) => String(cid) === String(a.courseId))
    );
  },

  async createAnnouncement(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Announcement title is required.');
    }

    let parsedCourseId = data.courseId;
    if (parsedCourseId && parsedCourseId !== 'all') {
      const match = String(parsedCourseId).match(/\d+/);
      if (match) parsedCourseId = parseInt(match[0], 10);
      else parsedCourseId = null;
    } else {
      parsedCourseId = null;
    }

    const payload = {
      title: data.title.trim(),
      content: (data.message || data.content || '').trim(),
      announcement_type: (data.priority === 'urgent' ? 'ALERT' : 'INFO'),
      is_pinned: data.priority === 'urgent',
      course: parsedCourseId,
    };

    try {
      const response = await api.post('/announcements/', payload);
      const a = response.data;
      const normalized = {
        id: a.id,
        title: a.title,
        message: a.content,
        content: a.content,
        courseId: a.course || 'all',
        priority: a.announcement_type === 'ALERT' ? 'urgent' : 'normal',
        publishDate: a.created_at || new Date().toISOString(),
        authorName: a.author_name || 'KDTechX Lead Trainer',
      };
      storageService.insertItem(STORAGE_KEYS.ANNOUNCEMENTS, normalized);
      syncService.syncAll('admin').catch(() => {});
      return normalized;
    } catch (err) {
      console.warn('API createAnnouncement failed, saving locally:', err);
      const newAnnouncement = {
        id: `ann_${Date.now()}`,
        title: data.title.trim(),
        message: (data.message || '').trim(),
        content: (data.message || '').trim(),
        courseId: data.courseId || 'all',
        priority: data.priority || 'normal',
        publishDate: new Date().toISOString(),
        authorName: 'KDTechX Lead Trainer',
      };
      storageService.insertItem(STORAGE_KEYS.ANNOUNCEMENTS, newAnnouncement);
      return newAnnouncement;
    }
  },

  async deleteAnnouncement(id) {
    try {
      if (typeof id === 'number' || !isNaN(id)) {
        await api.delete(`/announcements/${id}/`);
      }
    } catch (err) {
      console.warn('API deleteAnnouncement failed, removing locally:', err);
    }
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
