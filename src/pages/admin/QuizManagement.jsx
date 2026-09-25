import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import { courseService } from '../../services/courseService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  HelpCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  Award,
} from 'lucide-react';

export const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { success, error } = useToast();
  const navigate = useNavigate();

  const loadData = () => {
    setQuizzes(quizService.getAllQuizzes());
    setCourses(courseService.getAllCourses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePublish = (quiz) => {
    if (quiz.status === 'published') {
      quizService.unpublishQuiz(quiz.id);
      success('Unpublished', `"${quiz.title}" set to draft. Students will no longer see it.`);
    } else {
      quizService.publishQuiz(quiz.id);
      success('Published', `"${quiz.title}" is now live for assigned students.`);
    }
    loadData();
  };

  const handleDelete = (quizId, title) => {
    if (window.confirm(`Delete assessment "${title}"?`)) {
      quizService.deleteQuiz(quizId);
      success('Deleted', 'Assessment removed.');
      loadData();
    }
  };

  const filtered = quizzes.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCourse = courseFilter === 'all' || q.courseId === courseFilter;
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Weekly Quizzes</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build weekly MCQ assessments, configure anti-copy deterrents, and publish for assigned cohorts.
          </p>
        </div>

        <Link to="/admin/quizzes/create">
          <Button variant="primary" size="md" icon={Plus}>
            Build Weekly Quiz
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search quizzes by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-48">
            <Select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Courses' },
                ...courses.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Quizzes List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No quizzes match criteria"
          description="Build a weekly quiz module to start assessing student understanding."
          actionLabel="Build Quiz"
          onAction={() => navigate('/admin/quizzes/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((quiz) => {
            const course = courses.find((c) => c.id === quiz.courseId);
            const isPublished = quiz.status === 'published';

            return (
              <Card key={quiz.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="cyan" size="xs">
                      {course ? course.code : 'Assessment'}
                    </Badge>
                    <Badge variant={isPublished ? 'emerald' : 'slate'} size="xs">
                      {quiz.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white leading-snug">{quiz.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {quiz.description || 'Weekly MCQ assessment module.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Questions</span>
                      <strong className="text-white font-semibold">
                        {quiz.questionIds?.length || 0}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Duration</span>
                      <strong className="text-cyan-400 font-semibold">{quiz.durationMinutes}m</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Pass Mark</span>
                      <strong className="text-indigo-400 font-semibold">{quiz.passPercentage}%</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Due: {new Date(quiz.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePublish(quiz)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isPublished
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isPublished ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Unpublish
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Publish
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <Link to={`/admin/quizzes/${quiz.id}`}>
                      <Button size="sm" variant="ghost" icon={Eye}>
                        Inspect
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                      title="Delete Quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
