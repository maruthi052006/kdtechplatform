import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { UserCheck, Lock, User, Eye, EyeOff, ArrowLeft, Info, Zap } from 'lucide-react';

export const StudentLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loginStudent } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Please enter your Student ID or username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const student = await loginStudent(identifier, password);
      success(`Welcome back, ${student.name}`, 'Successfully signed in to your assessment portal.');
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid student credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillStudent = (username, pass) => {
    setIdentifier(username);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Home
        </Link>

        <Card className="p-8 border-slate-800 bg-slate-900/90 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25 mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Student Assessment</h2>
            <p className="text-xs text-slate-400 mt-1">
              Access your assigned courses, weekly curriculum, and MCQ assessments.
            </p>
          </div>

          {/* Trainer Provisioned Banner */}
          <div className="mb-5 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-2.5 text-xs text-cyan-300">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Your login credentials are created by your trainer. Students cannot self-enroll.</span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Student ID or Username"
              icon={User}
              placeholder="e.g. arun or KDX26001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="Enter your student password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={loading}
            >
              Sign In to Student Portal
            </Button>
          </form>

          {/* Demo Students Quick Fill */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Test Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillStudent('arun', 'password123')}
                className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-left transition-colors border border-slate-700/60"
              >
                <strong className="block text-white font-medium">Arun Kumar</strong>
                <span className="text-[10px] text-cyan-400 font-mono">KDX26001</span>
              </button>
              <button
                type="button"
                onClick={() => fillStudent('priya', 'password123')}
                className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-left transition-colors border border-slate-700/60"
              >
                <strong className="block text-white font-medium">Priya Sharma</strong>
                <span className="text-[10px] text-cyan-400 font-mono">KDX26002</span>
              </button>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs">
              <Link to="/admin/login" className="text-slate-400 hover:text-cyan-400">
                ← Trainer Login
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
