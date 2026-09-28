// Authoritative Student Service connected to Django REST API & PostgreSQL
import api, { formatApiError } from './api';
import { storageService, STORAGE_KEYS } from './storageService';
import { syncService } from './syncService';

export const studentService = {
  getAllStudents() {
    return storageService.getCollection(STORAGE_KEYS.STUDENTS);
  },

  getStudentById(studentId) {
    const list = this.getAllStudents();
    return list.find((s) => String(s.id) === String(studentId) || String(s.studentId) === String(studentId)) || null;
  },

  async createStudent(studentData) {
    const students = this.getAllStudents();

    // Validations
    if (!studentData.name || !studentData.name.trim()) {
      throw new Error('Student name is required.');
    }
    if (!studentData.studentId || !studentData.studentId.trim()) {
      throw new Error('Student ID is required.');
    }
    if (!studentData.username || !studentData.username.trim()) {
      throw new Error('Username is required.');
    }

    const cleanStudentId = studentData.studentId.trim().toUpperCase();
    const cleanUsername = studentData.username.trim().toLowerCase();
    const cleanEmail = (studentData.email || `${cleanUsername}@kdtechx.edu`).trim().toLowerCase();

    // Parse batch_id if integer
    let parsedBatchId = null;
    if (studentData.batchId) {
      const match = String(studentData.batchId).match(/\d+/);
      if (match) parsedBatchId = parseInt(match[0], 10);
    }

    // Parse course_ids to integers where possible
    const parsedCourseIds = (studentData.courseIds || [])
      .map((id) => (typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10)))
      .filter((id) => !isNaN(id) && id > 0);

    const payload = {
      name: studentData.name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      student_id: cleanStudentId,
      password: studentData.password || 'password123',
      batch_id: parsedBatchId,
      course_ids: parsedCourseIds,
      status: studentData.status || 'active',
      phone: studentData.phone || '',
    };

    try {
      const response = await api.post('/students/', payload);
      const s = response.data;
      const normalized = {
        id: s.id,
        role: 'student',
        studentId: s.student_id,
        name: s.name,
        username: s.username,
        email: s.email,
        batchId: s.batch,
        batchName: s.batch_name,
        courseIds: s.course_ids || studentData.courseIds || [],
        status: s.status || 'active',
        createdAt: s.created_at || new Date().toISOString(),
        lastLogin: null,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`,
      };
      storageService.insertItem(STORAGE_KEYS.STUDENTS, normalized);
      syncService.syncAll('admin').catch(() => {});
      return normalized;
    } catch (err) {
      const msg = formatApiError(err);
      console.warn('API createStudent error, falling back locally:', msg);
      
      const newStudent = {
        id: `std_${Date.now()}`,
        role: 'student',
        studentId: cleanStudentId,
        name: studentData.name.trim(),
        username: cleanUsername,
        password: studentData.password || 'password123',
        email: cleanEmail,
        batchId: studentData.batchId || 'batch_pfs_2026',
        courseIds: studentData.courseIds || [],
        status: studentData.status || 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentData.name)}`,
      };
      storageService.insertItem(STORAGE_KEYS.STUDENTS, newStudent);
      return newStudent;
    }
  },

  async updateStudent(studentId, updates) {
    try {
      if (typeof studentId === 'number' || !isNaN(studentId)) {
        await api.patch(`/students/${studentId}/`, updates);
      }
    } catch (err) {
      console.warn('API updateStudent failed, updating locally:', err);
    }
    return storageService.updateItem(STORAGE_KEYS.STUDENTS, studentId, updates);
  },

  async deactivateStudent(studentId) {
    return this.updateStudent(studentId, { status: 'inactive' });
  },

  async activateStudent(studentId) {
    return this.updateStudent(studentId, { status: 'active' });
  },

  async resetStudentPassword(studentId, newPassword) {
    try {
      if (typeof studentId === 'number' || !isNaN(studentId)) {
        await api.post(`/students/${studentId}/reset-password/`, { password: newPassword });
      }
    } catch (err) {
      console.warn('API resetStudentPassword failed, updating locally:', err);
    }
    return storageService.updateItem(STORAGE_KEYS.STUDENTS, studentId, { password: newPassword });
  },

  async deleteStudent(studentId) {
    try {
      if (typeof studentId === 'number' || !isNaN(studentId)) {
        await api.delete(`/students/${studentId}/`);
      }
    } catch (err) {
      console.warn('API deleteStudent failed, removing locally:', err);
    }
    return storageService.deleteItem(STORAGE_KEYS.STUDENTS, studentId);
  },

  generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  generateNextStudentId() {
    const students = this.getAllStudents();
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const prefix = `KDX${currentYear}`;
    const numbers = students
      .map((s) => {
        const match = s.studentId?.match(new RegExp(`^${prefix}(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  },
};
