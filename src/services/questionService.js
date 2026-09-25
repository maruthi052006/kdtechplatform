// Question Bank Service
import { storageService, STORAGE_KEYS } from './storageService';

export const questionService = {
  getAllQuestions() {
    return storageService.getCollection(STORAGE_KEYS.QUESTIONS);
  },

  getQuestionById(id) {
    return storageService.getItemById(STORAGE_KEYS.QUESTIONS, id);
  },

  getQuestionsByCourse(courseId) {
    const list = this.getAllQuestions();
    return list.filter((q) => q.courseId === courseId);
  },

  createQuestion(qData) {
    if (!qData.question || !qData.question.trim()) {
      throw new Error('Question text is required.');
    }
    if (!qData.options || qData.options.length < 2) {
      throw new Error('At least 2 options are required.');
    }
    if (!qData.correctAnswer) {
      throw new Error('Correct answer key is required.');
    }

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
  },

  bulkCreateQuestions(questionsArray) {
    const existing = this.getAllQuestions();
    const prepared = questionsArray.map((q, idx) => ({
      id: q.id || `q_imp_${Date.now()}_${idx}`,
      courseId: q.courseId || 'course_py_fs',
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

  updateQuestion(id, updates) {
    return storageService.updateItem(STORAGE_KEYS.QUESTIONS, id, updates);
  },

  deleteQuestion(id) {
    return storageService.deleteItem(STORAGE_KEYS.QUESTIONS, id);
  },

  filterQuestions({ courseId, topic, difficulty, search } = {}) {
    let list = this.getAllQuestions();

    if (courseId && courseId !== 'all') {
      list = list.filter((q) => q.courseId === courseId);
    }
    if (topic && topic !== 'all') {
      list = list.filter((q) => q.topic.toLowerCase() === topic.toLowerCase());
    }
    if (difficulty && difficulty !== 'all') {
      list = list.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }
    if (search && search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.topic.toLowerCase().includes(query) ||
          q.options.some((o) => o.text.toLowerCase().includes(query))
      );
    }

    return list;
  },
};
