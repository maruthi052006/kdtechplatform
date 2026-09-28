// Authoritative Result Service connected to Django REST API & PostgreSQL
import api, { formatApiError } from './api';
import { storageService, STORAGE_KEYS } from './storageService';
import { syncService } from './syncService';

export const resultService = {
  getAllResults() {
    const results = storageService.getCollection(STORAGE_KEYS.RESULTS);
    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    const quizzes = storageService.getCollection(STORAGE_KEYS.QUIZZES);
    const courses = storageService.getCollection(STORAGE_KEYS.COURSES);

    return results.map((r) => {
      const student = students.find((s) => String(s.id) === String(r.studentId) || String(s.studentId) === String(r.studentId));
      const quiz = quizzes.find((q) => String(q.id) === String(r.quizId));
      const course = courses.find((c) => String(c.id) === String(r.courseId) || String(c.name) === String(r.courseName));

      return {
        ...r,
        studentName: r.studentName || (student ? student.name : 'KDTechX Student'),
        studentIdCode: r.studentId || (student ? student.studentId : ''),
        studentEmail: student ? student.email : '',
        quizTitle: r.quizTitle || (quiz ? quiz.title : 'Weekly Assessment'),
        courseName: r.courseName || (course ? course.name : 'Technical Course'),
      };
    });
  },

  getResultById(id) {
    const list = this.getAllResults();
    return list.find((r) => String(r.id) === String(id)) || null;
  },

  getResultsForStudent(studentId) {
    const all = this.getAllResults();
    const session = storageService.getSession();
    return all.filter(
      (r) =>
        String(r.studentId) === String(studentId) ||
        String(r.studentId) === String(session?.studentId) ||
        String(r.studentId) === String(session?.id)
    );
  },

  getResultsForQuiz(quizId) {
    const all = this.getAllResults();
    return all.filter((r) => String(r.quizId) === String(quizId));
  },

  getResultsForCourse(courseId) {
    const all = this.getAllResults();
    return all.filter((r) => String(r.courseId) === String(courseId));
  },

  // Authoritative Quiz Attempt Submission via Django Backend
  async submitQuizAttemptServer(attemptId, answersArray) {
    try {
      const response = await api.post(`/attempts/${attemptId}/submit/`, {
        answers: answersArray,
      });
      const data = response.data;
      const normalized = {
        id: data.id,
        quizId: data.quiz,
        quizTitle: data.quiz_title,
        courseName: data.course_name,
        studentId: data.student_id,
        studentName: data.student_name,
        score: parseFloat(data.score),
        totalMarks: parseFloat(data.total_marks),
        percentage: parseFloat(data.percentage),
        passPercentage: parseFloat(data.pass_percentage),
        passed: data.is_passed,
        correctCount: data.correct_count,
        wrongCount: data.wrong_count,
        unansweredCount: data.unanswered_count,
        timeTakenSeconds: data.time_taken_seconds,
        tabViolations: data.tab_violations,
        submittedAt: data.submitted_at || new Date().toISOString(),
        questionsReview: data.questions_review || [],
      };
      storageService.insertItem(STORAGE_KEYS.RESULTS, normalized);
      syncService.syncAll('student').catch(() => {});
      return normalized;
    } catch (err) {
      throw new Error(formatApiError(err, 'Failed to submit assessment to server.'));
    }
  },

  // Backward-compatible fallback evaluation
  submitQuizAttempt({ quizId, studentId, answers, timeTakenSeconds, securityLog }) {
    const quiz = storageService.getItemById(STORAGE_KEYS.QUIZZES, quizId);
    if (!quiz) throw new Error('Quiz not found.');

    const questions = storageService.getCollection(STORAGE_KEYS.QUESTIONS);
    const quizQuestions = questions.filter((q) => (quiz.questionIds || []).includes(q.id));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const perQuestionMarks = (quiz.totalMarks || 100) / (quiz.questionIds?.length || 1);
    let calculatedScore = 0;

    quizQuestions.forEach((q) => {
      const selectedAnswer = answers[q.id];
      if (!selectedAnswer) {
        unansweredCount++;
      } else if (selectedAnswer.toUpperCase() === q.correctAnswer?.toUpperCase()) {
        correctCount++;
        calculatedScore += perQuestionMarks;
      } else {
        wrongCount++;
        if (quiz.settings?.negativeMarking) {
          calculatedScore -= quiz.settings.negativeMarks || 0.25;
        }
      }
    });

    const finalScore = Math.max(0, Math.round(calculatedScore));
    const percentage = Math.round((finalScore / (quiz.totalMarks || 100)) * 100);
    const passed = percentage >= (quiz.passPercentage || 60);

    const newResult = {
      id: `res_${Date.now()}`,
      studentId,
      quizId,
      courseId: quiz.courseId,
      courseName: quiz.courseName,
      quizTitle: quiz.title,
      answers,
      score: finalScore,
      totalMarks: quiz.totalMarks || 100,
      percentage,
      passed,
      correctCount,
      wrongCount,
      unansweredCount,
      timeTakenSeconds: timeTakenSeconds || 0,
      submittedAt: new Date().toISOString(),
      securityLog: securityLog || {
        tabSwitches: 0,
        fullscreenExits: 0,
        copyAttempts: 0,
      },
    };

    storageService.insertItem(STORAGE_KEYS.RESULTS, newResult);
    storageService.clearQuizAttempt(quizId, studentId);
    return newResult;
  },
};
