// Authentication Service
import { storageService, STORAGE_KEYS } from './storageService';

export const authService = {
  // Admin Login
  loginAdmin(username, password) {
    const admin = storageService.getRaw(STORAGE_KEYS.ADMIN);
    const expectedUsername = (admin?.username || 'maruthi25').toLowerCase();
    const expectedPassword = admin?.password || 'maruthis@2529';

    if (username.trim().toLowerCase() === expectedUsername && password === expectedPassword) {
      const sessionUser = {
        id: admin?.id || 'admin_root',
        role: 'admin',
        name: admin?.name || 'KDTechX Lead Trainer',
        username: admin?.username || 'maruthi25',
        email: admin?.email || 'trainer@kdtechx.edu',
        avatar: admin?.avatar,
      };
      storageService.setSession(sessionUser);
      return sessionUser;
    }
    throw new Error('Invalid Admin credentials. Please verify your username and password.');
  },


  // Student Login
  loginStudent(identifier, password) {
    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    const cleanId = identifier.trim().toLowerCase();
    
    const student = students.find(
      (s) =>
        s.username.toLowerCase() === cleanId ||
        s.studentId.toLowerCase() === cleanId ||
        s.email.toLowerCase() === cleanId
    );

    if (!student) {
      throw new Error('Student account not found. Your login credentials must be created by your trainer.');
    }

    if (student.status !== 'active') {
      throw new Error('This student account is currently deactivated. Please contact your trainer.');
    }

    if (student.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials or ask your trainer for a reset.');
    }

    // Update lastLogin
    storageService.updateItem(STORAGE_KEYS.STUDENTS, student.id, {
      lastLogin: new Date().toISOString(),
    });

    const sessionUser = {
      id: student.id,
      role: 'student',
      studentId: student.studentId,
      name: student.name,
      username: student.username,
      email: student.email,
      batchId: student.batchId,
      courseIds: student.courseIds || [],
      avatar: student.avatar,
    };
    storageService.setSession(sessionUser);
    return sessionUser;
  },

  getCurrentUser() {
    return storageService.getSession();
  },

  refreshCurrentUser() {
    const session = storageService.getSession();
    if (!session) return null;
    if (session.role === 'student') {
      const student = storageService.getItemById(STORAGE_KEYS.STUDENTS, session.id);
      if (student) {
        const updated = {
          ...session,
          name: student.name,
          courseIds: student.courseIds || [],
          batchId: student.batchId,
          status: student.status,
        };
        storageService.setSession(updated);
        return updated;
      }
    }
    return session;
  },

  logout() {
    storageService.clearSession();
  },
};
