import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { quizService } from '../../services/quizService';
import { resultService } from '../../services/resultService';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  BookOpen,
  Award,
  PlayCircle,
  CheckCircle2,
  Clock,
  Layers,
  Lock,
} from 'lucide-react';

export const StudentCourseView = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Strict Guard: If student is not assigned to this course, redirect
    if (!(user.courseIds || []).includes(courseId)) {
      navigate('/student/courses');
      return;
    }

    const c = courseService.getCourseById(courseId);
    setCourse(c);
    setWeeks(courseService.getCurriculum(courseId));
    setQuizzes(quizService.getActiveQuizzesForStudent(user.id));
    setResults(resultService.getResultsForStudent(user.id));
  }, [courseId, user]);

  if (!course) {
    return (
      <div className="p-8 text-center text-slate-400">
        Course loading or not found...
      </div>
    );
  }

  const courseQuizzes = quizzes.filter((q) => q.courseId === course.id);
  const completedCount = courseQuizzes.filter((q) => q.isCompleted).length;
  const progress =
    courseQuizzes.length > 0 ? Math.round((completedCount / courseQuizzes.length) * 100) : 35;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Course Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <Link
          to="/student/courses"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Courses
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                {course.code}
              </span>
              <Badge variant="cyan">{course.duration}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">{course.name}</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Curriculum Progress</span>
            <span className="text-2xl font-extrabold text-cyan-400 font-mono">{progress}%</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
          {course.description}
        </p>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Sequential Weeks & Weekly Assessment Modules */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Weekly Curriculum & Assessments
        </h2>

        <div className="space-y-4">
          {weeks.map((week) => {
            const quiz = courseQuizzes.find((q) => q.weekId === week.id);
            const userResult = results.find((r) => r.quizId === quiz?.id);

            return (
              <Card key={week.id} className="p-6 bg-slate-900/70 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-extrabold px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Week {String(week.weekNumber).padStart(2, '0')}
                    </span>
                    <h3 className="text-base font-bold text-white">{week.title}</h3>
                  </div>

                  {userResult ? (
                    <Badge variant={userResult.passed ? 'emerald' : 'rose'} size="sm">
                      Score: {userResult.percentage}% ({userResult.passed ? 'PASSED' : 'RETAKE SUGGESTED'})
                    </Badge>
                  ) : quiz ? (
                    <Badge variant="cyan" size="sm">
                      Assessment Available
                    </Badge>
                  ) : (
                    <Badge variant="slate" size="sm">
                      Lecture Module
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{week.description}</p>

                {/* Topics List */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Topics & Concepts
                  </span>
                  {week.topics?.map((topic, i) => (
                    <div
                      key={topic.id}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between text-slate-300"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{topic.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {topic.durationMinutes}m
                      </span>
                    </div>
                  ))}
                </div>

                {/* Assessment Box */}
                {quiz && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-bold uppercase text-white tracking-wider">
                          Weekly MCQ Assessment
                        </h4>
                      </div>
                      <p className="text-sm font-semibold text-slate-200">{quiz.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{quiz.questionIds?.length} Questions</span>
                        <span>•</span>
                        <span>{quiz.durationMinutes} Minutes</span>
                        <span>•</span>
                        <span>{quiz.passPercentage}% Pass Mark</span>
                      </div>
                    </div>

                    <div>
                      {userResult ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/student/result/${userResult.id}`)}
                          icon={Award}
                        >
                          View Scorecard & Review
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                          icon={PlayCircle}
                        >
                          Start Quiz
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
