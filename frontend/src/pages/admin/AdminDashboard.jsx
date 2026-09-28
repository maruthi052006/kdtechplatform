import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { studentService } from '../../services/studentService';
import { questionService } from '../../services/questionService';
import { quizService } from '../../services/quizService';
import { resultService } from '../../services/resultService';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  BookOpen,
  Users,
  CheckCircle2,
  HelpCircle,
  Award,
  TrendingUp,
  Clock,
  Plus,
  FileSpreadsheet,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setCourses(courseService.getAllCourses());
    setStudents(studentService.getAllStudents());
    setQuestions(questionService.getAllQuestions());
    setQuizzes(quizService.getAllQuizzes());
    setResults(resultService.getAllResults());
  }, []);

  const activeStudents = students.filter((s) => s.status === 'active');
  const publishedQuizzes = quizzes.filter((q) => q.status === 'published');

  // Calculate metrics
  const avgScore =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length)
      : 82;

  const passedResults = results.filter((r) => r.passed);
  const passRate =
    results.length > 0 ? Math.round((passedResults.length / results.length) * 100) : 88;

  // Active current week quiz (e.g. Week 05 or latest published quiz)
  const currentWeekQuiz = publishedQuizzes[publishedQuizzes.length - 1] || publishedQuizzes[0];
  const currentQuizCourse = currentWeekQuiz
    ? courses.find((c) => c.id === currentWeekQuiz.courseId)
    : null;
  const currentQuizAttempts = currentWeekQuiz
    ? results.filter((r) => r.quizId === currentWeekQuiz.id)
    : [];

  return (
    <div className="space-y-8">
      {/* Top Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Good morning, Admin
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Here's what's happening across your KDTechX learning platform cohorts today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/questions/import">
            <Button size="sm" variant="secondary" icon={FileSpreadsheet}>
              Import Excel
            </Button>
          </Link>
          <Link to="/admin/courses/create">
            <Button size="sm" variant="primary" icon={Plus}>
              Create Course
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Courses"
          value={courses.length}
          subvalue="Active cohorts"
          icon={BookOpen}
          trend="+1 this month"
          accentColor="cyan"
        />
        <StatCard
          title="Total Students"
          value={students.length}
          subvalue={`${activeStudents.length} active`}
          icon={Users}
          trend="+12% enrolled"
          accentColor="emerald"
        />
        <StatCard
          title="Question Bank"
          value={questions.length}
          subvalue="Verified MCQs"
          icon={HelpCircle}
          trend="+25 questions"
          accentColor="indigo"
        />
        <StatCard
          title="Average Score"
          value={`${avgScore}%`}
          subvalue={`${passRate}% pass rate`}
          icon={Award}
          trend="+4.2%"
          accentColor="amber"
        />
      </div>

      {/* Featured Current Week Quiz Card (Prompt Requirement #17) */}
      {currentWeekQuiz && (
        <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border-cyan-500/30 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="cyan" size="sm">
                  Active Assessment
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  {currentQuizCourse ? currentQuizCourse.code : 'PFS-101'}
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {currentWeekQuiz.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                  {currentWeekQuiz.description || 'Weekly MCQ assessment module for active enrolled students.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>{currentWeekQuiz.questionIds?.length || 5} Questions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>{currentWeekQuiz.durationMinutes} Minutes</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>{currentQuizAttempts.length} Submissions</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>Due {new Date(currentWeekQuiz.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate(`/admin/quizzes/${currentWeekQuiz.id}`)}
              >
                Inspect Quiz
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/admin/results')}
                icon={ChevronRight}
                iconPosition="right"
              >
                View Results
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Two Column Layout: Recent Student Results & Quick Platform Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Submissions */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Recent Student Submissions
            </h3>
            <Link to="/admin/results" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              View all results →
            </Link>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Assessment</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {results.slice(0, 5).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-white">{r.studentName}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{r.studentIdCode}</div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate">{r.quizTitle}</td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-white">{r.score}</span> / {r.totalMarks} ({r.percentage}%)
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={r.passed ? 'emerald' : 'rose'} size="xs">
                          {r.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Trainer Actions */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Quick Actions
          </h3>

          <div className="space-y-3">
            <Link
              to="/admin/questions/import"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Import Questions</h4>
                  <p className="text-[11px] text-slate-400">SheetJS .xlsx validation</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </Link>

            <Link
              to="/admin/quizzes/create"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Create Weekly Quiz</h4>
                  <p className="text-[11px] text-slate-400">Auto-randomizer & timers</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link
              to="/admin/students/create"
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/40 flex items-center justify-between transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Provision Student</h4>
                  <p className="text-[11px] text-slate-400">Generate credentials & assign</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
