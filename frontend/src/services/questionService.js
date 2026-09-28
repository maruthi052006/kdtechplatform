// Authoritative Question Bank Service connected to Django REST API & PostgreSQL
import api, { formatApiError } from './api';
import { storageService, STORAGE_KEYS } from './storageService';
import { syncService } from './syncService';

export const questionService = {
  getAllQuestions() {
    return storageService.getCollection(STORAGE_KEYS.QUESTIONS);
  },

  getQuestionById(id) {
    const list = this.getAllQuestions();
    return list.find((q) => String(q.id) === String(id)) || null;
  },

  getQuestionsByCourse(courseId) {
    const list = this.getAllQuestions();
    return list.filter((q) => String(q.courseId) === String(courseId));
  },

  async createQuestion(qData) {
    if (!qData.question || !qData.question.trim()) {
      throw new Error('Question text is required.');
    }
    if (!qData.options || qData.options.length < 2) {
      throw new Error('At least 2 options are required.');
    }
    if (!qData.correctAnswer) {
      throw new Error('Correct answer key is required.');
    }

    const optA = qData.options.find((o) => o.key === 'A')?.text || '';
    const optB = qData.options.find((o) => o.key === 'B')?.text || '';
    const optC = qData.options.find((o) => o.key === 'C')?.text || '';
    const optD = qData.options.find((o) => o.key === 'D')?.text || '';

    // Parse course id
    let parsedCourseId = qData.courseId;
    if (typeof parsedCourseId === 'string') {
      const match = parsedCourseId.match(/\d+/);
      if (match) parsedCourseId = parseInt(match[0], 10);
    }

    const payload = {
      course: parsedCourseId,
      question_text: qData.question.trim(),
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: qData.correctAnswer.toUpperCase(),
      difficulty: (qData.difficulty || 'medium').toLowerCase(),
      explanation: (qData.explanation || '').trim(),
      marks: qData.marks || 1.00,
    };

    try {
      const response = await api.post('/questions/', payload);
      const q = response.data;
      const normalized = {
        id: q.id,
        courseId: q.course,
        topicId: q.topic,
        topic: q.topic_name || qData.topic || 'General',
        question: q.question_text,
        options: [
          { key: 'A', text: q.option_a },
          { key: 'B', text: q.option_b },
          { key: 'C', text: q.option_c },
          { key: 'D', text: q.option_d },
        ],
        correctAnswer: q.correct_answer,
        difficulty: q.difficulty,
        explanation: q.explanation || '',
        marks: parseFloat(q.marks || 1),
        createdAt: q.created_at || new Date().toISOString(),
      };
      storageService.insertItem(STORAGE_KEYS.QUESTIONS, normalized);
      syncService.syncAll('admin').catch(() => {});
      return normalized;
    } catch (err) {
      console.warn('API createQuestion failed, persisting locally:', err);
      const newQuestion = {
        id: qData.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        courseId: qData.courseId || 'course_py_fs',
        topic: (qData.topic || 'General').trim(),
        question: qData.question.trim(),
        options: qData.options,
        correctAnswer: qData.correctAnswer.toUpperCase(),
        difficulty: qData.difficulty || 'Medium',
        explanation: (qData.explanation || '').trim(),
        createdAt: new Date().toISOString(),
      };
      storageService.insertItem(STORAGE_KEYS.QUESTIONS, newQuestion);
      return newQuestion;
    }
  },

  async bulkCreateQuestions(questionsArray, courseId = null) {
    // If courseId provided, attempt backend bulk commit
    let parsedCourseId = courseId;
    if (typeof parsedCourseId === 'string') {
      const match = parsedCourseId.match(/\d+/);
      if (match) parsedCourseId = parseInt(match[0], 10);
    }

    if (parsedCourseId && typeof parsedCourseId === 'number' && !isNaN(parsedCourseId)) {
      try {
        const rows = questionsArray.map((q) => ({
          question_text: q.question,
          option_a: q.optionA || q.options?.find((o) => o.key === 'A')?.text || '',
          option_b: q.optionB || q.options?.find((o) => o.key === 'B')?.text || '',
          option_c: q.optionC || q.options?.find((o) => o.key === 'C')?.text || '',
          option_d: q.optionD || q.options?.find((o) => o.key === 'D')?.text || '',
          correct_answer: (q.correctAnswer || q.answer || 'A').toUpperCase(),
          difficulty: (q.difficulty || 'medium').toLowerCase(),
          explanation: q.explanation || '',
          marks: q.marks || 1.00,
          topic_name: q.topic || 'General',
        }));

        await api.post('/questions/import-excel/', {
          course_id: parsedCourseId,
          rows,
        });
        await syncService.syncAll('admin');
        return this.getAllQuestions();
      } catch (err) {
        console.warn('API import-excel error, falling back locally:', err);
      }
    }

    const existing = this.getAllQuestions();
    const prepared = questionsArray.map((q, idx) => ({
      id: q.id || `q_imp_${Date.now()}_${idx}`,
      courseId: q.courseId || courseId || 'course_py_fs',
      topic: (q.topic || 'General').trim(),
      question: q.question.trim(),
      options: q.options || [
        { key: 'A', text: q.optionA || '' },
        { key: 'B', text: q.optionB || '' },
        { key: 'C', text: q.optionC || '' },
        { key: 'D', text: q.optionD || '' },
      ],
      correctAnswer: (q.correctAnswer || q.answer || 'A').toUpperCase(),
      difficulty: q.difficulty || 'Medium',
      explanation: (q.explanation || '').trim(),
      createdAt: new Date().toISOString(),
    }));

    const combined = [...prepared, ...existing];
    storageService.setCollection(STORAGE_KEYS.QUESTIONS, combined);
    return prepared;
  },

  async validateExcelFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/questions/validate-excel/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async commitExcelQuestions(courseId, rows) {
    let parsedCourseId = courseId;
    if (typeof parsedCourseId === 'string') {
      const match = parsedCourseId.match(/\d+/);
      if (match) parsedCourseId = parseInt(match[0], 10);
    }
    const response = await api.post('/questions/import-excel/', {
      course_id: parsedCourseId,
      rows,
    });
    await syncService.syncAll('admin');
    return response.data;
  },

  async updateQuestion(id, updates) {
    try {
      if (typeof id === 'number' || !isNaN(id)) {
        await api.patch(`/questions/${id}/`, updates);
      }
    } catch (err) {
      console.warn('API updateQuestion failed, updating locally:', err);
    }
    return storageService.updateItem(STORAGE_KEYS.QUESTIONS, id, updates);
  },

  async deleteQuestion(id) {
    try {
      if (typeof id === 'number' || !isNaN(id)) {
        await api.delete(`/questions/${id}/`);
      }
    } catch (err) {
      console.warn('API deleteQuestion failed, removing locally:', err);
    }
    return storageService.deleteItem(STORAGE_KEYS.QUESTIONS, id);
  },

  filterQuestions({ courseId, topic, difficulty, search } = {}) {
    let list = this.getAllQuestions();

    if (courseId && courseId !== 'all') {
      list = list.filter((q) => String(q.courseId) === String(courseId));
    }
    if (topic && topic !== 'all') {
      list = list.filter((q) => q.topic?.toLowerCase() === topic.toLowerCase());
    }
    if (difficulty && difficulty !== 'all') {
      list = list.filter((q) => q.difficulty?.toLowerCase() === difficulty.toLowerCase());
    }
    if (search && search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.question?.toLowerCase().includes(query) ||
          q.topic?.toLowerCase().includes(query) ||
          q.options?.some((o) => o.text.toLowerCase().includes(query))
      );
    }

    return list;
  },
};
