// Authoritative Authentication Service connected to Django SimpleJWT & PostgreSQL
import api, { formatApiError } from './api';
import { storageService, STORAGE_KEYS } from './storageService';
import { syncService } from './syncService';

export const authService = {
  // Admin Login via Django REST Framework
  async loginAdmin(username, password) {
    try {
      const response = await api.post('/auth/login/', {
        username: username.trim(),
        password: password,
        portal: 'admin',
      });

      const { access, refresh, user } = response.data;
      localStorage.setItem('kdtechx_access_token', access);
      localStorage.setItem('kdtechx_refresh_token', refresh);

      const sessionUser = {
        id: user.id,
        role: 'admin',
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      };

      storageService.setSession(sessionUser);
      // Trigger background PostgreSQL sync for all admin collections
      syncService.syncAll('admin').catch(() => {});
      return sessionUser;
    } catch (err) {
      // If server error or offline fallback during initial build
      const msg = formatApiError(err, 'Invalid Admin credentials. Please verify your username and password.');
      throw new Error(msg);
    }
  },

  // Student Login via Django REST Framework
  async loginStudent(identifier, password) {
    try {
      const response = await api.post('/auth/login/', {
        username: identifier.trim(),
        password: password,
        portal: 'student',
      });

      const { access, refresh, user } = response.data;
      localStorage.setItem('kdtechx_access_token', access);
      localStorage.setItem('kdtechx_refresh_token', refresh);

      const profile = user.student_profile || {};
      const sessionUser = {
        id: profile.id || user.id,
        userId: user.id,
        role: 'student',
        studentId: profile.student_id || identifier,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        username: user.username,
        email: user.email,
        batchId: profile.batch_id,
        batchName: profile.batch_name,
        courseIds: profile.assigned_course_ids || [],
        status: profile.status || 'active',
        avatar: user.avatar,
      };

      storageService.setSession(sessionUser);
      // Trigger background sync for student collections
      syncService.syncAll('student').catch(() => {});
      return sessionUser;
    } catch (err) {
      const msg = formatApiError(err, 'Invalid student credentials. Please verify your Student ID/Username.');
      throw new Error(msg);
    }
  },

  getCurrentUser() {
    return storageService.getSession();
  },

  async refreshCurrentUser() {
    const session = storageService.getSession();
    if (!session) return null;

    try {
      const token = localStorage.getItem('kdtechx_access_token');
      if (token) {
        const response = await api.get('/auth/me/');
        const user = response.data;
        let updated = { ...session };
        if (user.role === 'STUDENT' && user.student_profile) {
          const profile = user.student_profile;
          updated = {
            ...session,
            courseIds: profile.assigned_course_ids || [],
            batchId: profile.batch_id,
            batchName: profile.batch_name,
            status: profile.status,
          };
        }
        storageService.setSession(updated);
        syncService.syncAll(user.role.toLowerCase()).catch(() => {});
        return updated;
      }
    } catch {
      // Retain existing session if network blip
    }
    return session;
  },

  async logout() {
    try {
      const refresh = localStorage.getItem('kdtechx_refresh_token');
      if (refresh) {
        await api.post('/auth/logout/', { refresh }).catch(() => {});
      }
    } finally {
      localStorage.removeItem('kdtechx_access_token');
      localStorage.removeItem('kdtechx_refresh_token');
      storageService.clearSession();
    }
  },
};
