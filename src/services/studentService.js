// Student Management Service
import { storageService, STORAGE_KEYS } from './storageService';

export const studentService = {
  getAllStudents() {
    return storageService.getCollection(STORAGE_KEYS.STUDENTS);
  },

  getStudentById(studentId) {
    return storageService.getItemById(STORAGE_KEYS.STUDENTS, studentId);
  },

  createStudent(studentData) {
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
    const cleanEmail = (studentData.email || '').trim().toLowerCase();

    if (students.some((s) => s.studentId === cleanStudentId)) {
      throw new Error(`Student ID "${cleanStudentId}" already exists.`);
    }

    if (students.some((s) => s.username.toLowerCase() === cleanUsername)) {
      throw new Error(`Username "${cleanUsername}" is already taken.`);
    }

    if (cleanEmail && students.some((s) => s.email && s.email.toLowerCase() === cleanEmail)) {
      throw new Error(`Email "${cleanEmail}" is already registered.`);
    }

    const newStudent = {
      id: `std_${Date.now()}`,
      role: 'student',
      studentId: cleanStudentId,
      name: studentData.name.trim(),
      username: cleanUsername,
      password: studentData.password || 'password123',
      email: cleanEmail || `${cleanUsername}@kdtechx.edu`,
      batchId: studentData.batchId || 'batch_pfs_2026',
      courseIds: studentData.courseIds || [],
      status: studentData.status || 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentData.name)}`,
    };

    storageService.insertItem(STORAGE_KEYS.STUDENTS, newStudent);
    return newStudent;
  },

  updateStudent(studentId, updates) {
    return storageService.updateItem(STORAGE_KEYS.STUDENTS, studentId, updates);
  },

  deactivateStudent(studentId) {
    return storageService.updateItem(STORAGE_KEYS.STUDENTS, studentId, { status: 'inactive' });
  },

  activateStudent(studentId) {
    return storageService.updateItem(STORAGE_KEYS.STUDENTS, studentId, { status: 'active' });
  },

  resetStudentPassword(studentId, newPassword) {
    return storageService.updateItem(STORAGE_KEYS.STUDENTS, studentId, { password: newPassword });
  },

  deleteStudent(studentId) {
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
        const match = s.studentId.match(new RegExp(`^${prefix}(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
    return `${prefix}${String(nextNum).padStart(3, '0')}`;
  },
};
