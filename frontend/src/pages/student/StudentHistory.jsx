import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resultService } from '../../services/resultService';
import { courseService } from '../../services/courseService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { Award, ArrowRight, Clock, Calendar } from 'lucide-react';

export const StudentHistory = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseFilter, setCourseFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const userRes = resultService.getResultsForStudent(user.id);
    setResults(userRes);

    const allC = courseService.getAllCourses();
    const enrolled = allC.filter((c) => (user.courseIds || []).includes(c.id));
    setCourses(enrolled);
  }, [user]);

  const filtered = results.filter((r) => {
    return courseFilter === 'all' || r.courseId === courseFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Quiz History & Scorecards</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Historical log of all submitted weekly MCQ assessments and answer reviews.
          </p>
        </div>

        <div className="w-56">
          <Select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Assigned Courses' },
              ...courses.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No assessment records yet"
          description="Complete your weekly assessments from your course curriculum to view history."
          actionLabel="Go to Dashboard"
          onAction={() => navigate('/student/dashboard')}
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Assessment Title</th>
                  <th className="px-5 py-3.5">Course</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Time Taken</th>
                  <th className="px-5 py-3.5">Submitted Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{r.quizTitle}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{r.courseName}</td>
                    <td className="px-5 py-3.5">
                      <span className="font-extrabold text-white text-sm">{r.score}</span> / {r.totalMarks}
                      <span className="ml-1 text-[11px] text-cyan-400 font-bold">({r.percentage}%)</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={r.passed ? 'emerald' : 'rose'} size="xs">
                        {r.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {Math.floor(r.timeTakenSeconds / 60)}m {r.timeTakenSeconds % 60}s
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/student/result/${r.id}`}>
                        <Button size="sm" variant="secondary" icon={ArrowRight} iconPosition="right">
                          Scorecard
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
