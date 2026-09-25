import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { studentService } from '../../services/studentService';
import { batchService } from '../../services/batchService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import {
  ArrowLeft,
  UserPlus,
  RefreshCw,
  Key,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';

export const StudentCreate = () => {
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    username: '',
    password: '',
    email: '',
    batchId: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [createdStudent, setCreatedStudent] = useState(null);
  const [copied, setCopied] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const bList = batchService.getAllBatches();
    setBatches(bList);
    const nextId = studentService.generateNextStudentId();
    const securePass = studentService.generateRandomPassword();
    setFormData((prev) => ({
      ...prev,
      studentId: nextId,
      password: securePass,
      batchId: bList[0]?.id || 'batch_pfs_2026',
    }));
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleAutoGenerateId = () => {
    const next = studentService.generateNextStudentId();
    handleChange('studentId', next);
  };

  const handleAutoGeneratePass = () => {
    const pass = studentService.generateRandomPassword();
    handleChange('password', pass);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const created = studentService.createStudent(formData);
      setCreatedStudent(created);
      success('Student Provisioned', `Account created for ${created.name} (${created.studentId}).`);
    } catch (err) {
      error('Creation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdStudent) return;
    const text = `KDTechX Student Credentials\nName: ${createdStudent.name}\nStudent ID: ${createdStudent.studentId}\nUsername: ${createdStudent.username}\nPassword: ${createdStudent.password}\nPortal Login: ${window.location.origin}/student/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetForAnother = () => {
    setCreatedStudent(null);
    const nextId = studentService.generateNextStudentId();
    const securePass = studentService.generateRandomPassword();
    setFormData({
      name: '',
      studentId: nextId,
      username: '',
      password: securePass,
      email: '',
      batchId: batches[0]?.id || 'batch_pfs_2026',
      status: 'active',
    });
    setErrors({});
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/students"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Provision Student Account</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create learner credentials and link to an engineering cohort batch.
          </p>
        </div>
      </div>

      {createdStudent ? (
        <Card className="p-8 text-center bg-slate-900 border-emerald-500/30 shadow-2xl space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white">Student Account Created Successfully</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Please copy these credentials and deliver them securely to the learner.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left font-mono text-xs space-y-2 text-slate-300">
            <div>
              <span className="text-slate-500">Name:</span> <strong className="text-white">{createdStudent.name}</strong>
            </div>
            <div>
              <span className="text-slate-500">Student ID:</span> <span className="text-cyan-400">{createdStudent.studentId}</span>
            </div>
            <div>
              <span className="text-slate-500">Username:</span> <span className="text-white">@{createdStudent.username}</span>
            </div>
            <div>
              <span className="text-slate-500">Temporary Password:</span>{' '}
              <span className="text-amber-400 font-bold">{createdStudent.password}</span>
            </div>
            <div>
              <span className="text-slate-500">Login URL:</span>{' '}
              <span className="text-cyan-400 underline">{window.location.origin}/student/login</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={handleCopyCredentials}
              icon={copied ? Check : Copy}
            >
              {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
            </Button>
            <Button variant="primary" size="md" onClick={handleResetForAnother}>
              Provision Another Student
            </Button>
            <Link to="/admin/students">
              <Button variant="outline" size="md">
                View All Students
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 bg-slate-900/90 border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Student Full Name *"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => {
                handleChange('name', e.target.value);
                if (!formData.username) {
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                  handleChange('username', slug);
                }
              }}
              error={errors.name}
              autoFocus
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Student ID *</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateId}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto
                  </button>
                </div>
                <Input
                  value={formData.studentId}
                  onChange={(e) => handleChange('studentId', e.target.value.toUpperCase())}
                  error={errors.studentId}
                />
              </div>

              <Input
                label="Username *"
                placeholder="e.g. rahul"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
                error={errors.username}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Password *</label>
                <button
                  type="button"
                  onClick={handleAutoGeneratePass}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <Key className="w-3 h-3" /> Generate Secure
                </button>
              </div>
              <Input
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                placeholder="e.g. rahul@kdtechx.edu"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />

              <Select
                label="Cohort Batch"
                value={formData.batchId}
                onChange={(e) => handleChange('batchId', e.target.value)}
                options={batches.map((b) => ({ value: b.id, label: b.name }))}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <Link to="/admin/students">
                <Button variant="ghost" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={loading}
                icon={UserPlus}
              >
                Provision Student Account
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};
