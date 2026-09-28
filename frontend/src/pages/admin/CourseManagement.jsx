import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { quizService } from '../../services/quizService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  CheckSquare,
  Clock,
  Archive,
  Trash2,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { success, error } = useToast();
  const navigate = useNavigate();

  const loadData = () => {
    setCourses(courseService.getAllCourses());
    setQuizzes(quizService.getAllQuizzes());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleArchive = (courseId) => {
    courseService.archiveCourse(courseId);
    success('Course Archived', 'The course status has been set to archived.');
    loadData();
  };

  const handleDelete = (courseId, courseName) => {
    if (window.confirm(`Are you sure you want to delete "${courseName}"? This will also remove associated weeks.`)) {
      courseService.deleteCourse(courseId);
      success('Course Deleted', 'Course successfully removed from portal.');
      loadData();
    }
  };

  const filtered = courses.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Course Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build curriculum, organize multi-week modules, and assign student cohorts.
          </p>
        </div>

        <Link to="/admin/courses/create">
          <Button variant="primary" size="md" icon={Plus}>
            Create New Course
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search courses by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['all', 'published', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === status
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description="Create your first structured course with weekly assessments to begin training."
          actionLabel="Create Course"
          onAction={() => navigate('/admin/courses/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const assignedStudents = courseService.getAssignedStudents(course.id);
            const courseQuizzes = quizzes.filter((q) => q.courseId === course.id);
            const weeks = courseService.getCurriculum(course.id);

            return (
              <Card key={course.id} hoverEffect className="flex flex-col overflow-hidden p-0">
                {/* Thumbnail Image */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <Badge variant={course.status === 'published' ? 'emerald' : 'slate'}>
                      {course.status}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-4">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                      {course.code}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  {/* Metadata Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 text-center text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Duration</span>
                      <strong className="text-white font-semibold">{course.duration}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Students</span>
                      <strong className="text-cyan-400 font-semibold">{assignedStudents.length}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Quizzes</span>
                      <strong className="text-indigo-400 font-semibold">{courseQuizzes.length}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/admin/courses/${course.id}/curriculum`}>
                        <Button size="sm" variant="secondary" icon={Layers}>
                          Curriculum ({weeks.length})
                        </Button>
                      </Link>
                      <Link to={`/admin/courses/${course.id}/students`}>
                        <Button size="sm" variant="secondary" icon={Users}>
                          Students
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-1">
                      {course.status === 'published' && (
                        <button
                          onClick={() => handleArchive(course.id)}
                          className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl"
                          title="Archive Course"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(course.id, course.name)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
