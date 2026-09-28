import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { quizService } from '../../services/quizService';
import { resultService } from '../../services/resultService';
import { announcementService } from '../../services/announcementService';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  BookOpen,
  CheckCircle2,
  Award,
  TrendingUp,
  Clock,
  Calendar,
  ArrowRight,
  Bell,
  Sparkles,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [activeQuizzes, setActiveQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const allCourses = courseService.getAllCourses();
    const studentCourses = allCourses.filter((c) => (user.courseIds || []).includes(c.id));
    setAssignedCourses(studentCourses);

    const quizzes = quizService.getActiveQuizzesForStudent(user.id);
    setActiveQuizzes(quizzes);

    const userResults = resultService.getResultsForStudent(user.id);
    setResults(userResults);

    const ann = announcementService.getAnnouncementsForStudent(user.id);
    setAnnouncements(ann);
  }, [user]);

  // Compute stats
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
      : 0;

  // Find next pending quiz
  const nextPendingQuiz = activeQuizzes.find((q) => !q.isCompleted) || activeQuizzes[0];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-blue-950/30 border border-slate-800 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Student Assessment Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Ready for today's engineering challenge? Review your weekly curriculum, practice concepts, and complete scheduled assessments.
          </p>
        </div>
      </div>

      {/* Announcements Bar */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs">
          <Bell className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="text-white block font-semibold">{announcements[0].title}</strong>
            <p className="text-slate-400 mt-0.5">{announcements[0].message}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Assigned Courses"
          value={assignedCourses.length}
          subvalue="Active cohorts"
          icon={BookOpen}
          accentColor="cyan"
        />
        <StatCard
          title="Quizzes Taken"
          value={results.length}
          subvalue={`${activeQuizzes.length} total assigned`}
          icon={Award}
          accentColor="emerald"
        />
        <StatCard
          title="Average Score"
          value={results.length > 0 ? `${avgScore}%` : 'N/A'}
          subvalue="Assessment mean"
          icon={TrendingUp}
          accentColor="amber"
        />
        <StatCard
          title="Milestone Progress"
          value={`${Math.min(100, results.length * 20)}%`}
          subvalue="Weekly milestones"
          icon={CheckCircle2}
          accentColor="indigo"
        />
      </div>

      {/* Main Focus: Current Week Assessment Card (Prompt Section 33) */}
      {nextPendingQuiz ? (
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900 border-cyan-500/40 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={nextPendingQuiz.isCompleted ? 'emerald' : 'cyan'}>
                  {nextPendingQuiz.isCompleted ? 'Completed' : 'Current Week Assessment'}
                </Badge>
                <span className="text-xs font-mono text-cyan-400">
                  {nextPendingQuiz.courseCode} • {nextPendingQuiz.weekTitle}
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {nextPendingQuiz.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                  {nextPendingQuiz.description || 'Weekly MCQ assessment module for your enrolled course.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>{nextPendingQuiz.questionIds?.length || 5} Questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{nextPendingQuiz.durationMinutes} Minutes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Due {new Date(nextPendingQuiz.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {nextPendingQuiz.isCompleted ? (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => navigate(`/student/result/${nextPendingQuiz.userResult.id}`)}
                  icon={Award}
                >
                  View Scorecard ({nextPendingQuiz.userResult.percentage}%)
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate(`/student/quiz/${nextPendingQuiz.id}`)}
                  icon={PlayCircle}
                >
                  Start Assessment
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      {/* Assigned Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">My Enrolled Courses</h3>
            <p className="text-xs text-slate-400">Courses assigned by your trainer.</p>
          </div>
          <Link to="/student/courses" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold">
            View All Courses →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignedCourses.map((course) => {
            const weeks = courseService.getCurriculum(course.id);
            const courseQuizzes = activeQuizzes.filter((q) => q.courseId === course.id);
            const completedCount = courseQuizzes.filter((q) => q.isCompleted).length;
            const progress =
              courseQuizzes.length > 0
                ? Math.round((completedCount / courseQuizzes.length) * 100)
                : 25;

            return (
              <Card key={course.id} hoverEffect className="p-0 overflow-hidden flex flex-col justify-between">
                <div className="relative h-36 w-full bg-slate-800">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge variant="cyan" size="xs">
                      {course.duration}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-950/80 text-cyan-300 border border-cyan-500/30">
                      {course.code}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-white">{course.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Course Progress</span>
                      <span className="text-cyan-400 font-mono">{progress}% Complete</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {completedCount} of {courseQuizzes.length} Quizzes Completed
                    </span>
                    <Link to={`/student/courses/${course.id}`}>
                      <Button size="sm" variant="secondary" icon={ArrowRight} iconPosition="right">
                        Continue
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
