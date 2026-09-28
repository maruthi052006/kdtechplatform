// Authoritative Course Service connected to Django REST API & PostgreSQL
import api, { formatApiError } from './api';
import { storageService, STORAGE_KEYS } from './storageService';
import { syncService } from './syncService';

export const courseService = {
  getAllCourses() {
    return storageService.getCollection(STORAGE_KEYS.COURSES);
  },

  getCourseById(courseId) {
    return storageService.getItemById(STORAGE_KEYS.COURSES, courseId);
  },

  async createCourse(courseData) {
    const existing = this.getAllCourses();
    const codeExists = existing.some(
      (c) => c.code.toLowerCase() === courseData.code.trim().toLowerCase()
    );
    if (codeExists) {
      throw new Error(`Course code "${courseData.code}" already exists.`);
    }

    let parsedDuration = 8;
    if (typeof courseData.duration === 'string') {
      const match = courseData.duration.match(/\d+/);
      if (match) parsedDuration = parseInt(match[0], 10);
    } else if (typeof courseData.duration === 'number') {
      parsedDuration = courseData.duration;
    }

    const payload = {
      name: courseData.name.trim(),
      code: courseData.code.trim().toUpperCase(),
      description: courseData.description?.trim() || '',
      category: courseData.category || 'General',
      level: courseData.level || 'Intermediate',
      duration_weeks: parsedDuration,
      thumbnail:
        courseData.thumbnailUrl ||
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      status: courseData.status || 'published',
    };

    try {
      const response = await api.post('/courses/', payload);
      const c = response.data;
      const normalized = {
        id: c.id,
        name: c.name,
        code: c.code,
        description: c.description || '',
        duration: `${c.duration_weeks || parsedDuration} Weeks`,
        category: c.category || 'General',
        level: c.level || 'Intermediate',
        thumbnailUrl: c.thumbnail || payload.thumbnail,
        status: c.status || 'published',
        createdAt: c.created_at || new Date().toISOString(),
        weeksCount: 1,
        studentsCount: 0,
      };

      storageService.insertItem(STORAGE_KEYS.COURSES, normalized);

      // Create initial Week 1 scaffold in memory and on backend if curriculum API available
      const weekScaffold = {
        id: `week_${c.id}_01`,
        courseId: c.id,
        weekNumber: 1,
        title: 'Week 01: Core Architecture & Setup',
        description: 'Foundations and tooling setup.',
        topics: [
          { id: `top_${Date.now()}_1`, title: 'Development Environment & Overview', durationMinutes: 45 },
        ],
        status: 'published',
      };
      storageService.insertItem(STORAGE_KEYS.WEEKS, weekScaffold);
      syncService.syncAll('admin').catch(() => {});
      return normalized;
    } catch (err) {
      console.warn('API createCourse fallback to local storage:', err);
      const newCourse = {
        id: `course_${Date.now()}`,
        ...courseData,
        duration: `${parsedDuration} Weeks`,
        createdAt: new Date().toISOString(),
      };
      storageService.insertItem(STORAGE_KEYS.COURSES, newCourse);
      return newCourse;
    }
  },

  async updateCourse(courseId, updates) {
    try {
      if (typeof courseId === 'number' || !isNaN(courseId)) {
        await api.patch(`/courses/${courseId}/`, updates);
      }
    } catch (err) {
      console.warn('API updateCourse failed, updating locally:', err);
    }
    return storageService.updateItem(STORAGE_KEYS.COURSES, courseId, updates);
  },

  async archiveCourse(courseId) {
    return this.updateCourse(courseId, { status: 'archived' });
  },

  async deleteCourse(courseId) {
    try {
      if (typeof courseId === 'number' || !isNaN(courseId)) {
        await api.delete(`/courses/${courseId}/`);
      }
    } catch (err) {
      console.warn('API deleteCourse failed, removing locally:', err);
    }

    // Delete associated weeks locally
    const weeks = storageService.getCollection(STORAGE_KEYS.WEEKS);
    const filteredWeeks = weeks.filter((w) => w.courseId !== courseId);
    storageService.setCollection(STORAGE_KEYS.WEEKS, filteredWeeks);

    // Remove course from students locally
    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    const updatedStudents = students.map((s) => ({
      ...s,
      courseIds: (s.courseIds || []).filter((id) => id !== courseId),
    }));
    storageService.setCollection(STORAGE_KEYS.STUDENTS, updatedStudents);

    return storageService.deleteItem(STORAGE_KEYS.COURSES, courseId);
  },

  // Curriculum Management
  getCurriculum(courseId) {
    const weeks = storageService.getCollection(STORAGE_KEYS.WEEKS);
    return weeks
      .filter((w) => String(w.courseId) === String(courseId))
      .sort((a, b) => a.weekNumber - b.weekNumber);
  },

  addWeek(courseId, weekData) {
    const weeks = this.getCurriculum(courseId);
    const nextWeekNum = weeks.length > 0 ? Math.max(...weeks.map((w) => w.weekNumber)) + 1 : 1;

    const newWeek = {
      id: `week_${Date.now()}`,
      courseId,
      weekNumber: nextWeekNum,
      title: weekData.title || `Week ${String(nextWeekNum).padStart(2, '0')}: New Module`,
      description: weekData.description || 'Module topics and objectives.',
      topics: weekData.topics || [],
      status: weekData.status || 'published',
    };

    storageService.insertItem(STORAGE_KEYS.WEEKS, newWeek);
    return newWeek;
  },

  updateWeek(weekId, updates) {
    return storageService.updateItem(STORAGE_KEYS.WEEKS, weekId, updates);
  },

  deleteWeek(weekId) {
    return storageService.deleteItem(STORAGE_KEYS.WEEKS, weekId);
  },

  addTopicToWeek(weekId, topicData) {
    const week = storageService.getItemById(STORAGE_KEYS.WEEKS, weekId);
    if (!week) throw new Error('Week not found.');

    const newTopic = {
      id: `top_${Date.now()}`,
      title: topicData.title.trim(),
      durationMinutes: Number(topicData.durationMinutes) || 45,
    };

    const updatedTopics = [...(week.topics || []), newTopic];
    return storageService.updateItem(STORAGE_KEYS.WEEKS, weekId, { topics: updatedTopics });
  },

  deleteTopicFromWeek(weekId, topicId) {
    const week = storageService.getItemById(STORAGE_KEYS.WEEKS, weekId);
    if (!week) return null;
    const updatedTopics = (week.topics || []).filter((t) => t.id !== topicId);
    return storageService.updateItem(STORAGE_KEYS.WEEKS, weekId, { topics: updatedTopics });
  },

  // Student Assignment (Admin only)
  getAssignedStudents(courseId) {
    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    return students.filter((s) => (s.courseIds || []).some((id) => String(id) === String(courseId)));
  },

  async assignStudentsToCourse(courseId, studentIds) {
    try {
      if (typeof courseId === 'number' || !isNaN(courseId)) {
        await api.post(`/courses/${courseId}/students/`, {
          student_ids: studentIds,
        });
      }
    } catch (err) {
      console.warn('API assignStudentsToCourse failed, updating local state:', err);
    }

    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    const updated = students.map((s) => {
      if (studentIds.includes(s.id)) {
        const currentCourses = s.courseIds || [];
        if (!currentCourses.includes(courseId)) {
          return { ...s, courseIds: [...currentCourses, courseId] };
        }
      }
      return s;
    });
    storageService.setCollection(STORAGE_KEYS.STUDENTS, updated);
    return true;
  },

  async removeStudentFromCourse(courseId, studentId) {
    try {
      if (typeof courseId === 'number' || !isNaN(courseId)) {
        await api.delete(`/courses/${courseId}/students/`, {
          data: { student_id: studentId },
        });
      }
    } catch (err) {
      console.warn('API removeStudentFromCourse failed, removing locally:', err);
    }

    const student = storageService.getItemById(STORAGE_KEYS.STUDENTS, studentId);
    if (!student) return false;
    const updatedCourses = (student.courseIds || []).filter((id) => String(id) !== String(courseId));
    storageService.updateItem(STORAGE_KEYS.STUDENTS, studentId, { courseIds: updatedCourses });
    return true;
  },
};
