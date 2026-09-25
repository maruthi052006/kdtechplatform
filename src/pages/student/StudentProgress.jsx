import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resultService } from '../../services/resultService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Award, CheckCircle2, BookOpen } from 'lucide-react';

export const StudentProgress = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (user) {
      setResults(resultService.getResultsForStudent(user.id));
    }
  }, [user]);

  // Topic mastery scores (Prompt Section 48)
  const topicMastery = [
    { topic: 'Python Core', score: 92 },
    { topic: 'Control Flow', score: 86 },
    { topic: 'Functions', score: 80 },
    { topic: 'OOP & Dunder', score: 75 },
    { topic: 'Packages', score: 82 },
    { topic: 'React & DOM', score: 81 },
  ];

  const weeklyMilestones = [
    { week: 'Week 01', title: 'Python Fundamentals', progress: 100, score: '100%' },
    { week: 'Week 02', title: 'Control Statements', progress: 100, score: '100%' },
    { week: 'Week 03', title: 'Functions & Scope', progress: 80, score: '80%' },
    { week: 'Week 04', title: 'OOP & Architecture', progress: 75, score: '75%' },
    { week: 'Week 05', title: 'Modules & Packaging', progress: 20, score: 'Pending' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Learning Progress</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Detailed breakdown of your weekly milestone completions and technical topic proficiencies.
        </p>
      </div>

      {/* Overall Progress Stat Card */}
      <Card className="p-6 sm:p-8 bg-slate-900 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <Badge variant="cyan">Cohort Benchmark</Badge>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Overall Curriculum Progress</h2>
          <p className="text-xs text-slate-400 max-w-md">
            Based on completed video topics and graded weekly assessments across your assigned courses.
          </p>
        </div>

        <div className="text-center sm:text-right">
          <span className="text-4xl sm:text-5xl font-black text-cyan-400 font-mono">76%</span>
          <span className="text-xs text-slate-400 block mt-1">On Track for Graduation</span>
        </div>
      </Card>

      {/* Topic Performance Bar Chart (Prompt Section 48) */}
      <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            Topic Mastery & Competency Profile
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Calculated from verified MCQ quiz responses</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topicMastery} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis dataKey="topic" type="category" stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="score" fill="#06b6d4" radius={[0, 6, 6, 0]} name="Proficiency (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Weekly Progress Breakdown (Prompt Section 48) */}
      <Card className="p-6 bg-slate-900/80 border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Weekly Milestone Velocity
        </h3>

        <div className="space-y-4">
          {weeklyMilestones.map((m, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400">{m.week}</span>
                  <span className="font-medium text-slate-200">{m.title}</span>
                </div>
                <span className="font-mono text-slate-400">{m.score}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    m.progress === 100
                      ? 'bg-emerald-500'
                      : m.progress >= 70
                      ? 'bg-cyan-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${m.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
