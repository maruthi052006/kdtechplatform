// Authoritative Weekly Quiz Service connected to Django REST API & PostgreSQL
import api, { formatApiError } from './api';
import { storageService, STORAGE_KEYS } from './storageService';
import { syncService } from './syncService';

export const quizService = {
  getAllQuizzes() {
    return storageService.getCollection(STORAGE_KEYS.QUIZZES);
  },

  getQuizById(id) {
    const list = this.getAllQuizzes();
    return list.find((q) => String(q.id) === String(id)) || null;
  },

  getQuizzesByCourse(courseId) {
    const list = this.getAllQuizzes();
    return list.filter((q) => String(q.courseId) === String(courseId));
  },

  // Student specific: ONLY shows published quizzes for courses assigned to the student
  getActiveQuizzesForStudent(studentId) {
    const student = storageService.getCollection(STORAGE_KEYS.STUDENTS).find(
      (s) => String(s.id) === String(studentId) || String(s.studentId) === String(studentId)
    );
    const session = storageService.getSession();
    const studentCourseIds = student?.courseIds || session?.courseIds || [];

    const quizzes = this.getAllQuizzes();
    const results = storageService.getCollection(STORAGE_KEYS.RESULTS);
    const courses = storageService.getCollection(STORAGE_KEYS.COURSES);
    const weeks = storageService.getCollection(STORAGE_KEYS.WEEKS);

    // Filter to published and assigned courses only
    const accessible = quizzes.filter(
      (q) => q.status === 'published' && studentCourseIds.some((cid) => String(cid) === String(q.courseId))
    );

    return accessible.map((q) => {
      const course = courses.find((c) => String(c.id) === String(q.courseId));
      const week = weeks.find((w) => String(w.id) === String(q.weekId));
      const existingResult = results.find(
        (r) => String(r.quizId) === String(q.id) && (String(r.studentId) === String(studentId) || String(r.studentId) === String(session?.studentId))
      );

      return {
        ...q,
        courseName: course ? course.name : (q.courseName || 'Technical Course'),
        courseCode: course ? course.code : '',
        weekTitle: week ? week.title : `Week Module`,
        weekNumber: week ? week.weekNumber : 1,
        isCompleted: !!existingResult,
        userResult: existingResult || null,
      };
    });
  },

  async createQuiz(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Quiz title is required.');
    }
    if (!data.courseId) {
      throw new Error('Course selection is required.');
    }
    if (!data.questionIds || data.questionIds.length === 0) {
      throw new Error('Quiz must contain at least 1 question.');
    }

    let parsedCourseId = data.courseId;
    if (typeof parsedCourseId === 'string') {
      const match = parsedCourseId.match(/\d+/);
      if (match) parsedCourseId = parseInt(match[0], 10);
    }

    let parsedWeekId = data.weekId;
    if (typeof parsedWeekId === 'string') {
      const match = parsedWeekId.match(/\d+/);
      if (match) parsedWeekId = parseInt(match[0], 10);
      else parsedWeekId = null;
    }

    const parsedQuestionIds = (data.questionIds || [])
      .map((id) => (typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10)))
      .filter((id) => !isNaN(id) && id > 0);

    const now = new Date();
    const deadlineDate = data.deadline ? new Date(data.deadline) : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const payload = {
      course: parsedCourseId,
      week: parsedWeekId,
      title: data.title.trim(),
      description: data.description || '',
      duration_minutes: Number(data.durationMinutes) || 15,
      total_marks: Number(data.totalMarks) || (data.questionIds.length * 10),
      pass_percentage: Number(data.passPercentage) || 60,
      start_at: data.startAt || now.toISOString(),
      deadline: deadlineDate.toISOString(),
      max_attempts: Number(data.settings?.maxAttempts) || 1,
      random_questions: data.settings?.randomizeQuestions ?? true,
      random_options: data.settings?.randomizeOptions ?? true,
      negative_marking: data.settings?.negativeMarking ?? false,
      negative_marks: Number(data.settings?.negativeMarkValue) || 0.25,
      require_fullscreen: data.settings?.requireFullscreen ?? true,
      tab_warning_limit: Number(data.settings?.tabSwitchLimit) || 3,
      prevent_copy: true,
      status: data.status || 'draft',
      question_ids: parsedQuestionIds,
    };

    try {
      const response = await api.post('/quizzes/', payload);
      const q = response.data;
      const normalized = {
        id: q.id,
        courseId: q.course,
        courseName: q.course_name,
        weekId: q.week,
        title: q.title,
        description: q.description || '',
        durationMinutes: q.duration_minutes,
        totalMarks: parseFloat(q.total_marks),
        passPercentage: parseFloat(q.pass_percentage),
        startAt: q.start_at,
        deadline: q.deadline,
        status: q.status,
        questionIds: data.questionIds,
        questionCount: data.questionIds.length,
        settings: {
          randomizeQuestions: q.random_questions,
          randomizeOptions: q.random_options,
          negativeMarking: q.negative_marking,
          negativeMarks: parseFloat(q.negative_marks),
          requireFullscreen: q.require_fullscreen,
          tabWarningLimit: q.tab_warning_limit,
          preventCopy: q.prevent_copy,
        },
      };
      storageService.insertItem(STORAGE_KEYS.QUIZZES, normalized);
      syncService.syncAll('admin').catch(() => {});
      return normalized;
    } catch (err) {
      console.warn('API createQuiz failed, saving locally:', err);
      const newQuiz = {
        id: `quiz_${Date.now()}`,
        ...data,
        createdAt: new Date().toISOString(),
      };
      storageService.insertItem(STORAGE_KEYS.QUIZZES, newQuiz);
      return newQuiz;
    }
  },

  async updateQuiz(id, updates) {
    try {
      if (typeof id === 'number' || !isNaN(id)) {
        await api.patch(`/quizzes/${id}/`, updates);
      }
    } catch (err) {
      console.warn('API updateQuiz failed, updating locally:', err);
    }
    return storageService.updateItem(STORAGE_KEYS.QUIZZES, id, updates);
  },

  async publishQuiz(id) {
    try {
      if (typeof id === 'number' || !isNaN(id)) {
        await api.post(`/quizzes/${id}/publish/`);
      }
    } catch (err) {
      console.warn('API publishQuiz failed, updating locally:', err);
    }
    const updated = storageService.updateItem(STORAGE_KEYS.QUIZZES, id, { status: 'published' });
    syncService.syncAll('admin').catch(() => {});
    return updated;
  },

  async unpublishQuiz(id) {
    return this.updateQuiz(id, { status: 'draft' });
  },

  async deleteQuiz(id) {
    try {
      if (typeof id === 'number' || !isNaN(id)) {
        await api.delete(`/quizzes/${id}/`);
      }
    } catch (err) {
      console.warn('API deleteQuiz failed, removing locally:', err);
    }
    return storageService.deleteItem(STORAGE_KEYS.QUIZZES, id);
  },
};
