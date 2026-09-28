import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { resultService } from '../../services/resultService';
import { quizService } from '../../services/quizService';
import { questionService } from '../../services/questionService';
import { courseService } from '../../services/courseService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

export const StudentResult = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const res = resultService.getResultById(resultId);
    if (res) {
      setResult(res);
      const q = quizService.getQuizById(res.quizId);
      setQuiz(q);
      if (q) {
        setCourse(courseService.getCourseById(q.courseId));
        const allQ = questionService.getAllQuestions();
        setQuestions(allQ.filter((item) => q.questionIds.includes(item.id)));
      }

      // Restrained celebration confetti if passed
      if (res.passed) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#3b82f6', '#10b981'],
          });
        } catch (e) {
          // ignore
        }
      }
    }
  }, [resultId]);

  if (!result) {
    return (
      <div className="p-8 text-center text-slate-400">
        Scorecard not found. <Link to="/student/dashboard" className="text-cyan-400">Return to Dashboard</Link>
      </div>
    );
  }

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}m ${String(s).padStart(2, '0')}s`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Result Card (Prompt Section 45) */}
      <Card className="p-8 sm:p-10 bg-slate-900 border-slate-800 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2">
          <Badge variant={result.passed ? 'emerald' : 'rose'} size="md">
            {result.passed ? 'ASSESSMENT PASSED' : 'MINIMUM THRESHOLD NOT REACHED'}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{quiz?.title}</h1>
          <p className="text-xs text-slate-400">{course?.name}</p>
        </div>

        {/* Animated Score Display */}
        <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800/80 max-w-sm mx-auto flex flex-col items-center justify-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block mb-1">
            Total Score
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-5xl sm:text-6xl font-black font-mono tracking-tight ${
                result.passed ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result.percentage}%
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1">
            {result.score} / {result.totalMarks} Marks
          </span>
        </div>

        {/* Breakdown Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-emerald-400 block font-bold text-lg font-mono">
              {result.correctCount}
            </span>
            <span className="text-slate-400 text-[11px]">Correct Answers</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-rose-400 block font-bold text-lg font-mono">
              {result.wrongCount}
            </span>
            <span className="text-slate-400 text-[11px]">Incorrect Answers</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block font-bold text-lg font-mono">
              {result.unansweredCount}
            </span>
            <span className="text-slate-500 text-[11px]">Unanswered</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-cyan-400 block font-bold text-lg font-mono">
              {formatTime(result.timeTakenSeconds)}
            </span>
            <span className="text-slate-400 text-[11px]">Time Taken</span>
          </div>
        </div>

        {/* Security Summary Badge */}
        {result.securityLog?.tabSwitches > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Note: {result.securityLog.tabSwitches} window unfocus events logged during session.</span>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-3">
          <Link to="/student/dashboard">
            <Button variant="secondary" size="md">
              Dashboard
            </Button>
          </Link>
          <Link to="/student/history">
            <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
              View History
            </Button>
          </Link>
        </div>
      </Card>

      {/* Answer Review Section (Prompt Section 46) */}
      {(quiz?.settings?.showAnswerReview || (result.questionsReview && result.questionsReview.length > 0) || questions.length > 0) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              Detailed Answer Review
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {result.correctCount} of {(result.questionsReview?.length || questions.length)} Correct
            </span>
          </div>

          <div className="space-y-4">
            {(result.questionsReview && result.questionsReview.length > 0
              ? result.questionsReview.map((item, idx) => ({
                  id: item.snapshot_id || idx,
                  question: item.question_text,
                  options: item.options || [],
                  studentAnswer: item.selected_option,
                  correctAnswer: item.correct_option,
                  isCorrect: item.is_correct,
                  explanation: item.explanation,
                  marksEarned: item.marks_earned,
                }))
              : questions.map((q) => {
                  const studentAnswer = result.answers ? result.answers[q.id] : null;
                  const isCorrect = studentAnswer === q.correctAnswer;
                  return {
                    id: q.id,
                    question: q.question,
                    options: q.options || [],
                    studentAnswer,
                    correctAnswer: q.correctAnswer,
                    isCorrect,
                    explanation: q.explanation,
                    marksEarned: isCorrect ? 10 : 0,
                  };
                })
            ).map((q, idx) => (
              <Card
                key={q.id}
                className={`p-5 space-y-3 border ${
                  q.isCorrect ? 'border-emerald-500/30 bg-slate-900/80' : 'border-rose-500/30 bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-400">
                    Question {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <Badge variant={q.isCorrect ? 'emerald' : 'rose'} size="xs">
                    {q.isCorrect ? `Correct (+${q.marksEarned})` : 'Incorrect (0)'}
                  </Badge>
                </div>

                <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>

                {/* Options with Selected & Correct highlights */}
                <div className="space-y-2 pt-1 text-xs">
                  {q.options.map((opt) => {
                    const isSelected = q.studentAnswer === opt.key;
                    const isTargetCorrect = q.correctAnswer === opt.key;

                    let optClass = 'bg-slate-950/60 border-slate-800 text-slate-400';
                    if (isTargetCorrect) {
                      optClass = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-semibold';
                    } else if (isSelected && !q.isCorrect) {
                      optClass = 'bg-rose-500/15 border-rose-500/50 text-rose-200 font-semibold';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border flex items-center justify-between ${optClass}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold font-mono">{opt.key}.</span>
                          <span>{opt.text}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              Your choice
                            </span>
                          )}
                          {isTargetCorrect && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {q.explanation && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <strong className="text-cyan-400 block mb-1">Explanation & Rationale:</strong>
                    {q.explanation}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
