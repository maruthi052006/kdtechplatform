import React, { useState, useEffect } from 'react';
import { resultService } from '../../services/resultService';
import { courseService } from '../../services/courseService';
import { quizService } from '../../services/quizService';
import { exportResultsToExcel, exportResultsToCSV } from '../../utils/exportHelper';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Award,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';

export const ResultsOverview = () => {
  const [results, setResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { success } = useToast();

  const loadData = () => {
    setResults(resultService.getAllResults());
    setCourses(courseService.getAllCourses());
    setQuizzes(quizService.getAllQuizzes());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportExcel = () => {
    exportResultsToExcel(filtered, 'KDTechX_Assessment_Report');
    success('Export Initiated', 'Downloaded Excel report with student scores and violation records.');
  };

  const handleExportCSV = () => {
    exportResultsToCSV(filtered, 'KDTechX_Assessment_Report');
    success('Export Initiated', 'Downloaded CSV report.');
  };

  const filtered = results.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(search.toLowerCase()) ||
      r.studentIdCode.toLowerCase().includes(search.toLowerCase()) ||
      r.quizTitle.toLowerCase().includes(search.toLowerCase());

    const matchesCourse = courseFilter === 'all' || r.courseId === courseFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'passed' && r.passed) ||
      (statusFilter === 'failed' && !r.passed);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Assessment Results</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track student scorecards, evaluation breakdowns, security warnings, and export reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={FileSpreadsheet} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="primary" size="sm" icon={Download} onClick={handleExportExcel}>
            Export Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search student or assessment..."
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
                { value: 'passed', label: 'Passed Only' },
                { value: 'failed', label: 'Failed Only' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Results Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No results found"
          description="Student submissions will automatically appear here once quizzes are attempted."
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Assessment</th>
                  <th className="px-5 py-3.5">Score</th>
                  <th className="px-5 py-3.5">Breakdown</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Time Taken</th>
                  <th className="px-5 py-3.5">Security Log</th>
                  <th className="px-5 py-3.5">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{r.studentName}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{r.studentIdCode}</div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <div className="font-medium text-slate-200 truncate">{r.quizTitle}</div>
                      <div className="text-[10px] text-slate-400">{r.courseName}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-extrabold text-white text-sm">{r.score}</span> / {r.totalMarks}
                      <span className="ml-1 text-[11px] text-cyan-400 font-bold">({r.percentage}%)</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold">{r.correctCount}✓</span>{' '}
                      <span className="text-rose-400 font-bold">{r.wrongCount}✗</span>{' '}
                      <span className="text-slate-500 font-bold">{r.unansweredCount}—</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={r.passed ? 'emerald' : 'rose'} size="xs">
                        {r.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono">
                      {Math.floor(r.timeTakenSeconds / 60)}m {r.timeTakenSeconds % 60}s
                    </td>
                    <td className="px-5 py-3.5">
                      {r.securityLog?.tabSwitches > 0 ? (
                        <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          {r.securityLog.tabSwitches} tabs
                        </span>
                      ) : (
                        <span className="text-emerald-400">Clean</span>
                      )}
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
      )}
    </div>
  );
};
