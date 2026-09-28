import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { batchService } from '../../services/batchService';
import { courseService } from '../../services/courseService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Users,
  UserPlus,
  Search,
  Key,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react';

export const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Reset Password Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const { success, error } = useToast();

  const loadData = () => {
    setStudents(studentService.getAllStudents());
    setBatches(batchService.getAllBatches());
    setCourses(courseService.getAllCourses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = (student) => {
    if (student.status === 'active') {
      studentService.deactivateStudent(student.id);
      success('Deactivated', `${student.name} account set to inactive.`);
    } else {
      studentService.activateStudent(student.id);
      success('Activated', `${student.name} account is now active.`);
    }
    loadData();
  };

  const handleOpenReset = (student) => {
    setSelectedStudent(student);
    const generated = studentService.generateRandomPassword();
    setNewPassword(generated);
    setCopied(false);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    studentService.resetStudentPassword(selectedStudent.id, newPassword);
    success('Password Reset', `Password updated for ${selectedStudent.name}.`);
    setIsResetModalOpen(false);
    loadData();
  };

  const handleCopyCredentials = () => {
    const text = `KDTechX Student Credentials\nName: ${selectedStudent.name}\nStudent ID: ${selectedStudent.studentId}\nUsername: ${selectedStudent.username}\nPassword: ${newPassword}\nPortal: ${window.location.origin}/student/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteStudent = (studentId, studentName) => {
    if (window.confirm(`Permanently remove ${studentName}? All quiz records will be decoupled.`)) {
      studentService.deleteStudent(studentId);
      success('Student Deleted', `${studentName} was removed.`);
      loadData();
    }
  };

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()));

    const matchesBatch = batchFilter === 'all' || s.batchId === batchFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesBatch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Student Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Provision student credentials, assign cohort batches, and manage account statuses.
          </p>
        </div>

        <Link to="/admin/students/create">
          <Button variant="primary" size="md" icon={UserPlus}>
            Provision New Student
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search by name, ID, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-44">
            <Select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Batches' },
                ...batches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Provision student accounts so they can access their assigned courses."
          actionLabel="Provision Student"
          onAction={() => navigate('/admin/students/create')}
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Username / Email</th>
                  <th className="px-5 py-3.5">Batch</th>
                  <th className="px-5 py-3.5">Enrolled Courses</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filtered.map((s) => {
                  const batch = batches.find((b) => b.id === s.batchId);
                  const enrolledCount = (s.courseIds || []).length;

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{s.name}</div>
                            <div className="text-[10px] text-cyan-400 font-mono">{s.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-slate-300">@{s.username}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        {batch ? batch.name : 'None'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={enrolledCount > 0 ? 'cyan' : 'slate'} size="xs">
                          {enrolledCount} Courses
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={s.status === 'active' ? 'emerald' : 'rose'} size="xs">
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenReset(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                            title="Reset Credentials"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title={s.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {s.status === 'active' ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {selectedStudent && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title={`Reset Credentials for ${selectedStudent.name}`}
          subtitle={`Student ID: ${selectedStudent.studentId}`}
        >
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <Input
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Generated or manual password"
              autoFocus
            />

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">{newPassword}</span>
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-sans font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Full Credentials'}
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsResetModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save & Apply Password
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
