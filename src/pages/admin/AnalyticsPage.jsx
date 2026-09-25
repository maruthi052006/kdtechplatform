import React, { useState, useEffect } from 'react';
import { resultService } from '../../services/resultService';
import { questionService } from '../../services/questionService';
import { courseService } from '../../services/courseService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Award,
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    setResults(resultService.getAllResults());
    setQuestions(questionService.getAllQuestions());
    setCourses(courseService.getAllCourses());
  }, []);

  // 1. Weekly Average Trend Data
  const weeklyData = [
    { week: 'Week 01', avgScore: 84, passRate: 88 },
    { week: 'Week 02', avgScore: 88, passRate: 92 },
    { week: 'Week 03', avgScore: 78, passRate: 75 },
    { week: 'Week 04', avgScore: 72, passRate: 70 },
    { week: 'Week 05', avgScore: 82, passRate: 85 },
  ];

  // 2. Topic Performance Data
  const topicData = [
    { topic: 'Fundamentals', accuracy: 92 },
    { topic: 'Control Flow', accuracy: 86 },
    { topic: 'Functions', accuracy: 78 },
    { topic: 'OOP Design', accuracy: 68 },
    { topic: 'Packages', accuracy: 82 },
    { topic: 'React Hooks', accuracy: 74 },
  ];

  // 3. Completion & Pass Donut Data
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;
  const donutData = [
    { name: 'Passed', value: passedCount || 4, color: '#10b981' },
    { name: 'Needs Revision', value: failedCount || 1, color: '#f43f5e' },
  ];

  // 4. Score Distribution Data
  const scoreDistribution = [
    { range: '0-40%', count: 0 },
    { range: '41-60%', count: 1 },
    { range: '61-75%', count: 1 },
    { range: '76-90%', count: 2 },
    { range: '91-100%', count: 1 },
  ];

  // 5. Question Analytics Calculation (Prompt Section 50)
  const questionAnalytics = questions.slice(0, 10).map((q) => {
    let attempts = 0;
    let correct = 0;

    results.forEach((r) => {
      if (r.answers && r.answers[q.id] !== undefined) {
        attempts++;
        if (r.answers[q.id] === q.correctAnswer) {
          correct++;
        }
      }
    });

    // Provide baseline sample metrics if unattempted yet in demo
    const effectiveAttempts = attempts > 0 ? attempts : 5;
    const effectiveCorrect = attempts > 0 ? correct : q.difficulty === 'Hard' ? 2 : 4;
    const accuracy = Math.round((effectiveCorrect / effectiveAttempts) * 100);

    return {
      id: q.id,
      question: q.question,
      topic: q.topic,
      difficulty: q.difficulty,
      attempts: effectiveAttempts,
      correct: effectiveCorrect,
      wrong: effectiveAttempts - effectiveCorrect,
      accuracy,
      needsRevision: accuracy < 60,
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Performance Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Deep cohort assessment insights, question accuracy metrics, and revision identifiers.
        </p>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Line Chart */}
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Weekly Cohort Score Trend
              </h3>
              <p className="text-xs text-slate-400">Average assessment marks progression over time</p>
            </div>
            <Badge variant="cyan">Avg 81%</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" domain={[40, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="avgScore" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} name="Avg Score (%)" />
                <Line type="monotone" dataKey="passRate" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" name="Pass Rate (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Topic Accuracy Bar Chart */}
        <Card className="p-6 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                Curriculum Topic Accuracy
              </h3>
              <p className="text-xs text-slate-400">Mean accuracy percentages across technical topics</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="topic" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="accuracy" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Accuracy (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Two Column: Donut & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pass Rate Donut */}
        <Card className="p-6 bg-slate-900/80 border-slate-800 text-center flex flex-col justify-between">
          <h3 className="text-sm font-bold text-white mb-2">Overall Submission Pass Ratio</h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Passed (80%)
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Below Threshold (20%)
            </span>
          </div>
        </Card>

        {/* Score Distribution */}
        <Card className="p-6 bg-slate-900/80 border-slate-800 md:col-span-2">
          <h3 className="text-sm font-bold text-white mb-1">Score Distribution Histogram</h3>
          <p className="text-xs text-slate-400 mb-4">Cohort performance spread across percentage brackets</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Student Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Question Analytics Table (Prompt Section 50: Trainer Revision Identifiers) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              Question Accuracy & Revision Diagnostic Table
            </h3>
            <p className="text-xs text-slate-400">
              Identifies questions with low cohort accuracy so trainers can schedule live revision sessions.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Question Prompt</th>
                  <th className="px-5 py-3.5">Topic</th>
                  <th className="px-5 py-3.5">Difficulty</th>
                  <th className="px-5 py-3.5">Attempts</th>
                  <th className="px-5 py-3.5">Accuracy</th>
                  <th className="px-5 py-3.5">Revision Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {questionAnalytics.map((qa) => (
                  <tr key={qa.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 max-w-md font-medium text-white line-clamp-1">
                      {qa.question}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{qa.topic}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          qa.difficulty === 'Easy'
                            ? 'emerald'
                            : qa.difficulty === 'Medium'
                            ? 'amber'
                            : 'rose'
                        }
                        size="xs"
                      >
                        {qa.difficulty}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      {qa.attempts} ({qa.correct}✓ / {qa.wrong}✗)
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${qa.accuracy >= 70 ? 'bg-cyan-400' : 'bg-rose-500'}`}
                            style={{ width: `${qa.accuracy}%` }}
                          />
                        </div>
                        <span className="font-bold text-white font-mono">{qa.accuracy}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {qa.needsRevision ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Needs Revision
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">Mastered</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
