import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { batchService } from '../../services/batchService';
import { courseService } from '../../services/courseService';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { User, Shield, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export const StudentProfile = () => {
  const { user } = useAuth();
  const [batch, setBatch] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    if (user) {
      if (user.batchId) {
        setBatch(batchService.getBatchById(user.batchId));
      }
      const allCourses = courseService.getAllCourses();
      setCourses(allCourses.filter((c) => (user.courseIds || []).includes(c.id)));
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Student Profile</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Learner credentials and cohort registration details.
        </p>
      </div>

      <Card className="p-6 sm:p-8 bg-slate-900 border-slate-800 space-y-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-2xl flex items-center justify-center shadow-inner">
            {user.name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <p className="text-xs text-cyan-400 font-mono mt-0.5">
              Student ID: {user.studentId} • @{user.username}
            </p>
            <div className="mt-2">
              <Badge variant="emerald" size="xs">Active Learner</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Email Address</span>
            <p className="text-slate-200 font-medium">{user.email || `${user.username}@kdtechx.edu`}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-semibold uppercase text-[10px]">Cohort Batch</span>
            <p className="text-slate-200 font-medium">{batch ? batch.name : 'General Cohort'}</p>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Enrolled Technical Courses ({courses.length})
          </span>
          <div className="space-y-2">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-white block">{c.name}</strong>
                  <span className="text-slate-400 text-[11px]">{c.duration} Syllabus</span>
                </div>
                <Badge variant="cyan" size="xs">{c.code}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Credential Security:</strong> Student credentials and course enrollments are managed directly by your Lead Trainer. To reset passwords or request batch transfer, please contact your course coordinator.
          </span>
        </div>
      </Card>
    </div>
  );
};
