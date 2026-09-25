// Weekly Quiz Service
import { storageService, STORAGE_KEYS } from './storageService';

export const quizService = {
  getAllQuizzes() {
    return storageService.getCollection(STORAGE_KEYS.QUIZZES);
  },

  getQuizById(id) {
    return storageService.getItemById(STORAGE_KEYS.QUIZZES, id);
  },

  getQuizzesByCourse(courseId) {
    const list = this.getAllQuizzes();
    return list.filter((q) => q.courseId === courseId);
  },

  // Student specific: ONLY shows published quizzes for courses assigned to the student
  getActiveQuizzesForStudent(studentId) {
    const student = storageService.getItemById(STORAGE_KEYS.STUDENTS, studentId);
    if (!student || !student.courseIds || student.courseIds.length === 0) {
      return [];
    }

    const quizzes = this.getAllQuizzes();
    const results = storageService.getCollection(STORAGE_KEYS.RESULTS);
    const courses = storageService.getCollection(STORAGE_KEYS.COURSES);
    const weeks = storageService.getCollection(STORAGE_KEYS.WEEKS);

    // Filter to published and assigned courses only
    const accessible = quizzes.filter(
      (q) => q.status === 'published' && student.courseIds.includes(q.courseId)
    );

    return accessible.map((q) => {
      const course = courses.find((c) => c.id === q.courseId);
      const week = weeks.find((w) => w.id === q.weekId);
      const existingResult = results.find(
        (r) => r.quizId === q.id && r.studentId === studentId
      );

      return {
        ...q,
        courseName: course ? course.name : 'Technical Course',
        courseCode: course ? course.code : '',
        weekTitle: week ? week.title : `Week ${q.weekId}`,
        weekNumber: week ? week.weekNumber : 1,
        isCompleted: !!existingResult,
        userResult: existingResult || null,
      };
    });
  },

  createQuiz(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Quiz title is required.');
    }
    if (!data.courseId) {
      throw new Error('Course selection is required.');
    }
    if (!data.weekId) {
      throw new Error('Week module selection is required.');
    }
    if (!data.questionIds || data.questionIds.length === 0) {
      throw new Error('Quiz must contain at least 1 question.');
    }

    const newQuiz = {
      id: `quiz_${Date.now()}`,
      courseId: data.courseId,
      weekId: data.weekId,
      title: data.title.trim(),
      description: data.description || '',
      questionIds: data.questionIds,
      durationMinutes: Number(data.durationMinutes) || 15,
      totalMarks: Number(data.totalMarks) || data.questionIds.length * 10,
      passPercentage: Number(data.passPercentage) || 70,
      settings: {
        randomizeQuestions: data.settings?.randomizeQuestions ?? true,
        randomizeOptions: data.settings?.randomizeOptions ?? true,
        negativeMarking: data.settings?.negativeMarking ?? false,
        negativeMarkValue: Number(data.settings?.negativeMarkValue) || 0,
        showScoreImmediate: data.settings?.showScoreImmediate ?? true,
        showAnswerReview: data.settings?.showAnswerReview ?? true,
        allowRetake: data.settings?.allowRetake ?? false,
        maxAttempts: Number(data.settings?.maxAttempts) || 1,
        requireFullscreen: data.settings?.requireFullscreen ?? true,
        tabSwitchDetection: data.settings?.tabSwitchDetection ?? true,
        tabSwitchLimit: Number(data.settings?.tabSwitchLimit) || 3,
      },
      status: data.status || 'draft',
      startAt: data.startAt || new Date().toISOString(),
      deadline: data.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    storageService.insertItem(STORAGE_KEYS.QUIZZES, newQuiz);

    // Link quiz to week if week exists
    const week = storageService.getItemById(STORAGE_KEYS.WEEKS, data.weekId);
    if (week) {
      storageService.updateItem(STORAGE_KEYS.WEEKS, data.weekId, { quizId: newQuiz.id });
    }

    return newQuiz;
  },

  updateQuiz(id, updates) {
    return storageService.updateItem(STORAGE_KEYS.QUIZZES, id, updates);
  },

  publishQuiz(id) {
    return storageService.updateItem(STORAGE_KEYS.QUIZZES, id, { status: 'published' });
  },

  unpublishQuiz(id) {
    return storageService.updateItem(STORAGE_KEYS.QUIZZES, id, { status: 'draft' });
  },

  deleteQuiz(id) {
    // Unlink from week
    const weeks = storageService.getCollection(STORAGE_KEYS.WEEKS);
    const linkedWeek = weeks.find((w) => w.quizId === id);
    if (linkedWeek) {
      storageService.updateItem(STORAGE_KEYS.WEEKS, linkedWeek.id, { quizId: null });
    }
    return storageService.deleteItem(STORAGE_KEYS.QUIZZES, id);
  },
};
