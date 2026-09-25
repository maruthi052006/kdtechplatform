// Quiz Result & Evaluation Service
import { storageService, STORAGE_KEYS } from './storageService';

export const resultService = {
  getAllResults() {
    const results = storageService.getCollection(STORAGE_KEYS.RESULTS);
    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    const quizzes = storageService.getCollection(STORAGE_KEYS.QUIZZES);
    const courses = storageService.getCollection(STORAGE_KEYS.COURSES);

    return results.map((r) => {
      const student = students.find((s) => s.id === r.studentId);
      const quiz = quizzes.find((q) => q.id === r.quizId);
      const course = courses.find((c) => c.id === r.courseId);

      return {
        ...r,
        studentName: student ? student.name : 'Unknown Student',
        studentIdCode: student ? student.studentId : '',
        studentEmail: student ? student.email : '',
        quizTitle: quiz ? quiz.title : 'Assessment',
        courseName: course ? course.name : 'Course',
      };
    });
  },

  getResultById(id) {
    const list = this.getAllResults();
    return list.find((r) => r.id === id) || null;
  },

  getResultsForStudent(studentId) {
    const all = this.getAllResults();
    return all.filter((r) => r.studentId === studentId);
  },

  getResultsForQuiz(quizId) {
    const all = this.getAllResults();
    return all.filter((r) => r.quizId === quizId);
  },

  getResultsForCourse(courseId) {
    const all = this.getAllResults();
    return all.filter((r) => r.courseId === courseId);
  },

  // Submit and Automatically Evaluate Quiz Attempt
  submitQuizAttempt({ quizId, studentId, answers, timeTakenSeconds, securityLog }) {
    const quiz = storageService.getItemById(STORAGE_KEYS.QUIZZES, quizId);
    if (!quiz) throw new Error('Quiz not found.');

    const questions = storageService.getCollection(STORAGE_KEYS.QUESTIONS);
    const quizQuestions = questions.filter((q) => quiz.questionIds.includes(q.id));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const perQuestionMarks = quiz.totalMarks / (quiz.questionIds.length || 1);
    let calculatedScore = 0;

    quizQuestions.forEach((q) => {
      const selectedAnswer = answers[q.id];
      if (!selectedAnswer) {
        unansweredCount++;
      } else if (selectedAnswer.toUpperCase() === q.correctAnswer.toUpperCase()) {
        correctCount++;
        calculatedScore += perQuestionMarks;
      } else {
        wrongCount++;
        if (quiz.settings?.negativeMarking) {
          calculatedScore -= quiz.settings.negativeMarkValue || 0;
        }
      }
    });

    const finalScore = Math.max(0, Math.round(calculatedScore));
    const percentage = Math.round((finalScore / quiz.totalMarks) * 100);
    const passed = percentage >= quiz.passPercentage;

    const newResult = {
      id: `res_${Date.now()}`,
      studentId,
      quizId,
      courseId: quiz.courseId,
      weekId: quiz.weekId,
      answers, // Map of questionId -> selected key
      score: finalScore,
      totalMarks: quiz.totalMarks,
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

    // Clear saved attempt cache
    storageService.clearQuizAttempt(quizId, studentId);

    return newResult;
  },
};
