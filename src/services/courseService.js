// Course Service
import { storageService, STORAGE_KEYS } from './storageService';

export const courseService = {
  getAllCourses() {
    return storageService.getCollection(STORAGE_KEYS.COURSES);
  },

  getCourseById(courseId) {
    return storageService.getItemById(STORAGE_KEYS.COURSES, courseId);
  },

  createCourse(courseData) {
    const existing = this.getAllCourses();
    const codeExists = existing.some(
      (c) => c.code.toLowerCase() === courseData.code.trim().toLowerCase()
    );
    if (codeExists) {
      throw new Error(`Course code "${courseData.code}" already exists.`);
    }

    const newCourse = {
      id: `course_${Date.now()}`,
      name: courseData.name.trim(),
      code: courseData.code.trim().toUpperCase(),
      description: courseData.description.trim(),
      duration: courseData.duration || '8 Weeks',
      category: courseData.category || 'General',
      level: courseData.level || 'Intermediate',
      thumbnailUrl:
        courseData.thumbnailUrl ||
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      status: courseData.status || 'published',
      createdAt: new Date().toISOString(),
    };

    storageService.insertItem(STORAGE_KEYS.COURSES, newCourse);

    // Create initial Week 1 scaffold
    const weekScaffold = {
      id: `week_${Date.now()}_01`,
      courseId: newCourse.id,
      weekNumber: 1,
      title: 'Week 01: Core Architecture & Setup',
      description: 'Foundations and tooling setup.',
      topics: [
        { id: `top_${Date.now()}_1`, title: 'Development Environment & Overview', durationMinutes: 45 },
      ],
      status: 'published',
    };
    storageService.insertItem(STORAGE_KEYS.WEEKS, weekScaffold);

    return newCourse;
  },

  updateCourse(courseId, updates) {
    return storageService.updateItem(STORAGE_KEYS.COURSES, courseId, updates);
  },

  archiveCourse(courseId) {
    return storageService.updateItem(STORAGE_KEYS.COURSES, courseId, { status: 'archived' });
  },

  deleteCourse(courseId) {
    // Delete associated weeks
    const weeks = storageService.getCollection(STORAGE_KEYS.WEEKS);
    const filteredWeeks = weeks.filter((w) => w.courseId !== courseId);
    storageService.setCollection(STORAGE_KEYS.WEEKS, filteredWeeks);

    // Remove course from students
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
      .filter((w) => w.courseId === courseId)
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
    return students.filter((s) => (s.courseIds || []).includes(courseId));
  },

  assignStudentsToCourse(courseId, studentIds) {
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

  removeStudentFromCourse(courseId, studentId) {
    const student = storageService.getItemById(STORAGE_KEYS.STUDENTS, studentId);
    if (!student) return false;
    const updatedCourses = (student.courseIds || []).filter((id) => id !== courseId);
    storageService.updateItem(STORAGE_KEYS.STUDENTS, studentId, { courseIds: updatedCourses });
    return true;
  },
};
