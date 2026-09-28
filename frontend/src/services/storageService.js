// Storage Abstraction Layer
// Encapsulates all persistence mechanisms. Components and domain services interact
// only through this interface. Future backends (Supabase/REST) replace this adapter.

import {
  initialAdmin,
  initialStudents,
  initialBatches,
  initialCourses,
  initialWeeks,
  initialQuestions,
  initialQuizzes,
  initialResults,
  initialAnnouncements,
  initialSettings,
} from '../data/demoData';

export const STORAGE_KEYS = {
  ADMIN: 'kdtechx_admin',
  STUDENTS: 'kdtechx_students',
  BATCHES: 'kdtechx_batches',
  COURSES: 'kdtechx_courses',
  WEEKS: 'kdtechx_weeks',
  QUESTIONS: 'kdtechx_questions',
  QUIZZES: 'kdtechx_quizzes',
  RESULTS: 'kdtechx_results',
  ANNOUNCEMENTS: 'kdtechx_announcements',
  SETTINGS: 'kdtechx_settings',
  SESSION: 'kdtechx_session',
  ATTEMPT_CACHE_PREFIX: 'kdtechx_attempt_',
};

class StorageService {
  constructor() {
    this.memoryCache = new Map();
    this.init();
  }

  init() {
    try {
      const existingAdmin = this.getRaw(STORAGE_KEYS.ADMIN);
      if (!existingAdmin || existingAdmin.username === 'admin' || !existingAdmin.password) {
        this.setRaw(STORAGE_KEYS.ADMIN, initialAdmin);
      }
      if (!this.getRaw(STORAGE_KEYS.STUDENTS)) {
        this.resetAllToDefault();
      }
    } catch (e) {
      console.warn('LocalStorage error during init, operating with in-memory fallback', e);
    }
  }


  resetAllToDefault() {
    this.setRaw(STORAGE_KEYS.ADMIN, initialAdmin);
    this.setRaw(STORAGE_KEYS.STUDENTS, initialStudents);
    this.setRaw(STORAGE_KEYS.BATCHES, initialBatches);
    this.setRaw(STORAGE_KEYS.COURSES, initialCourses);
    this.setRaw(STORAGE_KEYS.WEEKS, initialWeeks);
    this.setRaw(STORAGE_KEYS.QUESTIONS, initialQuestions);
    this.setRaw(STORAGE_KEYS.QUIZZES, initialQuizzes);
    this.setRaw(STORAGE_KEYS.RESULTS, initialResults);
    this.setRaw(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements);
    this.setRaw(STORAGE_KEYS.SETTINGS, initialSettings);
  }

  getRaw(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
      return this.memoryCache.get(key) || null;
    } catch (err) {
      console.error(`Error reading ${key} from storage:`, err);
      return this.memoryCache.get(key) || null;
    }
  }

  setRaw(key, value) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
      this.memoryCache.set(key, value);
    } catch (err) {
      console.error(`Error writing ${key} to storage:`, err);
      this.memoryCache.set(key, value);
    }
  }

  removeRaw(key) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      this.memoryCache.delete(key);
    } catch (err) {
      console.error(`Error removing ${key} from storage:`, err);
    }
  }

  // CRUD Collections
  getCollection(key) {
    const data = this.getRaw(key);
    return Array.isArray(data) ? data : [];
  }

  setCollection(key, items) {
    this.setRaw(key, Array.isArray(items) ? items : []);
    return items;
  }

  getItemById(key, id) {
    const list = this.getCollection(key);
    return list.find((item) => item.id === id) || null;
  }

  insertItem(key, item) {
    const list = this.getCollection(key);
    const updated = [item, ...list];
    this.setCollection(key, updated);
    return item;
  }

  updateItem(key, id, updates) {
    const list = this.getCollection(key);
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const updatedItem = { ...list[index], ...updates };
    list[index] = updatedItem;
    this.setCollection(key, list);
    return updatedItem;
  }

  deleteItem(key, id) {
    const list = this.getCollection(key);
    const filtered = list.filter((item) => item.id !== id);
    this.setCollection(key, filtered);
    return true;
  }

  // Session handling
  getSession() {
    return this.getRaw(STORAGE_KEYS.SESSION);
  }

  setSession(user) {
    this.setRaw(STORAGE_KEYS.SESSION, user);
  }

  clearSession() {
    this.removeRaw(STORAGE_KEYS.SESSION);
  }

  // Quiz attempt in-progress recovery cache
  getQuizAttempt(quizId, studentId) {
    return this.getRaw(`${STORAGE_KEYS.ATTEMPT_CACHE_PREFIX}${quizId}_${studentId}`);
  }

  setQuizAttempt(quizId, studentId, attemptData) {
    this.setRaw(`${STORAGE_KEYS.ATTEMPT_CACHE_PREFIX}${quizId}_${studentId}`, attemptData);
  }

  clearQuizAttempt(quizId, studentId) {
    this.removeRaw(`${STORAGE_KEYS.ATTEMPT_CACHE_PREFIX}${quizId}_${studentId}`);
  }
}

export const storageService = new StorageService();
