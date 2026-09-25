import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { studentService } from '../../services/studentService';
import { batchService } from '../../services/batchService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  ArrowLeft,
  Users,
  Search,
  Check,
  UserPlus,
  UserMinus,
  ShieldAlert,
  Layers,
} from 'lucide-react';

export const CourseStudents = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);

  const { success, error } = useToast();

  const loadData = () => {
    const c = courseService.getCourseById(courseId);
    if (c) setCourse(c);
    setStudents(studentService.getAllStudents());
    setBatches(batchService.getAllBatches());
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  if (!course) {
    return (
      <div className="p-8 text-center text-slate-400">
        Course not found. <Link to="/admin/courses" className="text-cyan-400">Return to Courses</Link>
      </div>
    );
  }

  const assignedStudents = students.filter((s) => (s.courseIds || []).includes(course.id));

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase());
    const matchesBatch = batchFilter === 'all' || s.batchId === batchFilter;
    return matchesSearch && matchesBatch;
  });

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = () => {
    const unassignedVisible = filteredStudents
      .filter((s) => !(s.courseIds || []).includes(course.id))
      .map((s) => s.id);
    setSelectedIds(unassignedVisible);
  };

  const handleAssignSelected = () => {
    if (selectedIds.length === 0) return;
    try {
      courseService.assignStudentsToCourse(course.id, selectedIds);
      success('Students Assigned', `${selectedIds.length} student(s) successfully enrolled in ${course.code}.`);
      setSelectedIds([]);
      loadData();
    } catch (err) {
      error('Assignment Failed', err.message);
    }
  };

  const handleRemoveStudent = (studentId, studentName) => {
    if (window.confirm(`Remove ${studentName} from this course?`)) {
      courseService.removeStudentFromCourse(course.id, studentId);
      success('Student Removed', `${studentName} was unenrolled.`);
      loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/courses"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30">
                {course.code}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{course.name}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Admin Course Assignment & Cohort Enrollment Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="md">
            {assignedStudents.length} Students Assigned
          </Badge>
          <Link to={`/admin/courses/${course.id}/curriculum`}>
            <Button size="sm" variant="secondary" icon={Layers}>
              Curriculum
            </Button>
          </Link>
        </div>
      </div>

      {/* Info notice about student self-enrollment restriction */}
      <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center gap-3 text-xs text-cyan-300">
        <ShieldAlert className="w-4 h-4 shrink-0 text-cyan-400" />
        <span>
          <strong>Admin-Controlled Enrollment:</strong> Students cannot self-enroll or browse unassigned courses. Only students explicitly selected below can view this course and its weekly quizzes.
        </span>
      </div>

      {/* Action controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
          <div className="w-full sm:w-72">
            <Input
              icon={Search}
              placeholder="Search student by name, ID or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-48">
            <Select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Batches' },
                ...batches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Button variant="secondary" size="sm" onClick={handleSelectAllVisible}>
            Select Unassigned Visible
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={selectedIds.length === 0}
            onClick={handleAssignSelected}
            icon={UserPlus}
          >
            Assign Selected ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5 w-10">Select</th>
                <th className="px-5 py-3.5">Student</th>
                <th className="px-5 py-3.5">Batch</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Enrollment</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredStudents.map((s) => {
                const isAssigned = (s.courseIds || []).includes(course.id);
                const isChecked = selectedIds.includes(s.id);
                const batch = batches.find((b) => b.id === s.batchId);

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isAssigned ? 'bg-cyan-500/5' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isAssigned}
                        onChange={() => handleToggleSelect(s.id)}
                        className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30 w-4 h-4 cursor-pointer disabled:opacity-30"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{s.name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">
                        {s.studentId} • @{s.username}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {batch ? batch.name : 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={s.status === 'active' ? 'emerald' : 'slate'} size="xs">
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      {isAssigned ? (
                        <Badge variant="cyan" size="xs">
                          Assigned
                        </Badge>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Not Assigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {isAssigned ? (
                        <button
                          onClick={() => handleRemoveStudent(s.id, s.name)}
                          className="px-2.5 py-1 rounded-lg text-rose-400 hover:bg-rose-500/10 text-[11px] font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            courseService.assignStudentsToCourse(course.id, [s.id]);
                            success('Enrolled', `${s.name} assigned.`);
                            loadData();
                          }}
                          className="px-2.5 py-1 rounded-lg text-cyan-400 hover:bg-cyan-500/10 text-[11px] font-semibold transition-colors"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
