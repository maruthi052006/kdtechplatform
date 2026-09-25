import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseService } from '../../services/courseService';
import { quizService } from '../../services/quizService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { BookOpen, ArrowRight, Layers, Award } from 'lucide-react';

export const StudentCourses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    if (!user) return;
    const all = courseService.getAllCourses();
    const enrolled = all.filter((c) => (user.courseIds || []).includes(c.id));
    setCourses(enrolled);
    setQuizzes(quizService.getActiveQuizzesForStudent(user.id));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">My Assigned Courses</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Courses assigned to you by your lead technical trainer.
        </p>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Courses Assigned Yet"
          description="Your trainer has not yet assigned your student account to an active training cohort. Please contact your administrator."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const weeks = courseService.getCurriculum(course.id);
            const courseQuizzes = quizzes.filter((q) => q.courseId === course.id);
            const completedCount = courseQuizzes.filter((q) => q.isCompleted).length;
            const progress =
              courseQuizzes.length > 0
                ? Math.round((completedCount / courseQuizzes.length) * 100)
                : 30;

            return (
              <Card key={course.id} hoverEffect className="p-0 overflow-hidden flex flex-col justify-between">
                <div className="relative h-44 w-full bg-slate-800">
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
                    <h3 className="text-base font-bold text-white">{course.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{course.description}</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-cyan-400 font-mono">{progress}% Complete</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>{weeks.length} Weeks Syllabus</span>
                    <Link to={`/student/courses/${course.id}`}>
                      <Button size="sm" variant="primary" icon={ArrowRight} iconPosition="right">
                        Continue Course
                      </Button>
                    </Link>
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
