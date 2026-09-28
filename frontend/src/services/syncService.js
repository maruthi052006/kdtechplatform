import api from './api';
import { storageService, STORAGE_KEYS } from './storageService';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.lastSync = null;
  }

  /**
   * Authoritative data synchronization with Django / PostgreSQL backend.
   * Hydrates all domain collections in memory so components always reflect live server state.
   */
  async syncAll(role = 'admin') {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Common public / student accessible datasets
      const [coursesRes, quizzesRes, announcementsRes] = await Promise.allSettled([
        api.get('/courses/'),
        api.get('/quizzes/'),
        api.get('/announcements/'),
      ]);

      if (coursesRes.status === 'fulfilled' && coursesRes.value.data) {
        const rawCourses = coursesRes.value.data.results || coursesRes.value.data;
        const normalizedCourses = (Array.isArray(rawCourses) ? rawCourses : []).map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          description: c.description || '',
          duration: c.duration || '8 Weeks',
          category: c.category || 'General',
          level: c.level || 'Intermediate',
          thumbnailUrl: c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
          status: c.status || 'published',
          createdAt: c.created_at,
          weeksCount: c.weeks_count || 4,
          studentsCount: c.enrolled_students_count || 0,
        }));
        storageService.setCollection(STORAGE_KEYS.COURSES, normalizedCourses);
      }

      if (quizzesRes.status === 'fulfilled' && quizzesRes.value.data) {
        const rawQuizzes = quizzesRes.value.data.results || quizzesRes.value.data;
        const normalizedQuizzes = (Array.isArray(rawQuizzes) ? rawQuizzes : []).map((q) => ({
          id: q.id,
          title: q.title,
          courseId: q.course,
          courseName: q.course_name,
          weekId: q.week,
          description: q.description || '',
          durationMinutes: q.duration_minutes || 30,
          totalMarks: parseFloat(q.total_marks || 100),
          passPercentage: parseFloat(q.pass_percentage || 60),
          startAt: q.start_at,
          deadline: q.deadline,
          status: q.status || 'published',
          questionIds: q.question_ids || [],
          questionCount: q.question_count || (q.quiz_questions ? q.quiz_questions.length : 0),
          settings: {
            requireFullscreen: q.require_fullscreen ?? true,
            tabWarningLimit: q.tab_warning_limit ?? 3,
            preventCopy: q.prevent_copy ?? true,
            negativeMarking: q.negative_marking ?? false,
            negativeMarks: parseFloat(q.negative_marks || 0.25),
            randomizeQuestions: q.random_questions ?? false,
            randomizeOptions: q.random_options ?? false,
          },
        }));
        storageService.setCollection(STORAGE_KEYS.QUIZZES, normalizedQuizzes);
      }

      if (announcementsRes.status === 'fulfilled' && announcementsRes.value.data) {
        const rawAnn = announcementsRes.value.data.results || announcementsRes.value.data;
        const normalizedAnn = (Array.isArray(rawAnn) ? rawAnn : []).map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          type: a.announcement_type || 'INFO',
          isPinned: a.is_pinned ?? false,
          courseId: a.course,
          batchId: a.batch,
          createdAt: a.created_at,
          authorName: a.author_name || 'KDTechX Lead Trainer',
        }));
        storageService.setCollection(STORAGE_KEYS.ANNOUNCEMENTS, normalizedAnn);
      }

      // 2. Results
      const resultsRes = await api.get('/results/').catch(() => null);
      if (resultsRes?.data) {
        const rawResults = resultsRes.data.results || resultsRes.data;
        const normalizedResults = (Array.isArray(rawResults) ? rawResults : []).map((r) => ({
          id: r.id,
          quizId: r.quiz,
          quizTitle: r.quiz_title,
          courseName: r.course_name,
          studentId: r.student_id,
          studentName: r.student_name,
          score: parseFloat(r.score || 0),
          totalMarks: parseFloat(r.total_marks || 100),
          percentage: parseFloat(r.percentage || 0),
          passPercentage: parseFloat(r.pass_percentage || 60),
          passed: r.is_passed ?? false,
          correctCount: r.correct_count || 0,
          wrongCount: r.wrong_count || 0,
          unansweredCount: r.unanswered_count || 0,
          timeTakenSeconds: r.time_taken_seconds || 0,
          tabViolations: r.tab_violations || 0,
          submittedAt: r.submitted_at || r.started_at,
          questionsReview: r.questions_review || [],
        }));
        storageService.setCollection(STORAGE_KEYS.RESULTS, normalizedResults);
      }

      // 3. Admin-only datasets (Batches, Students, Question Bank)
      if (role === 'admin' || role === 'ADMIN') {
        const [batchesRes, studentsRes, questionsRes] = await Promise.allSettled([
          api.get('/batches/'),
          api.get('/students/'),
          api.get('/questions/'),
        ]);

        if (batchesRes.status === 'fulfilled' && batchesRes.value.data) {
          const rawBatches = batchesRes.value.data.results || batchesRes.value.data;
          const normalizedBatches = (Array.isArray(rawBatches) ? rawBatches : []).map((b) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            description: b.description || '',
            status: b.status || 'active',
            studentCount: b.student_count || 0,
            createdAt: b.created_at,
          }));
          storageService.setCollection(STORAGE_KEYS.BATCHES, normalizedBatches);
        }

        if (studentsRes.status === 'fulfilled' && studentsRes.value.data) {
          const rawStudents = studentsRes.value.data.results || studentsRes.value.data;
          const normalizedStudents = (Array.isArray(rawStudents) ? rawStudents : []).map((s) => ({
            id: s.id,
            userId: s.user_id,
            studentId: s.student_id,
            name: s.name,
            username: s.username,
            email: s.email,
            batchId: s.batch,
            batchName: s.batch_name,
            status: s.status || 'active',
            courseIds: s.assigned_course_ids || [],
            enrolledCoursesCount: (s.assigned_course_ids || []).length,
            createdAt: s.created_at,
            lastLogin: s.last_login,
          }));
          storageService.setCollection(STORAGE_KEYS.STUDENTS, normalizedStudents);
        }

        if (questionsRes.status === 'fulfilled' && questionsRes.value.data) {
          const rawQ = questionsRes.value.data.results || questionsRes.value.data;
          const normalizedQ = (Array.isArray(rawQ) ? rawQ : []).map((q) => ({
            id: q.id,
            courseId: q.course,
            topicId: q.topic,
            questionText: q.question_text,
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
          }));
          storageService.setCollection(STORAGE_KEYS.QUESTIONS, normalizedQ);
        }
      }

      this.lastSync = new Date();
    } catch (err) {
      console.warn('SyncService: Error during PostgreSQL sync, retaining local cache:', err);
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
