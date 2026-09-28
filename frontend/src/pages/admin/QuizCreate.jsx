import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { quizService } from '../../services/quizService';
import { courseService } from '../../services/courseService';
import { questionService } from '../../services/questionService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  ArrowLeft,
  CheckSquare,
  Sparkles,
  Lock,
  Clock,
  Shield,
  HelpCircle,
  Shuffle,
  AlertCircle,
} from 'lucide-react';

export const QuizCreate = () => {
  const [searchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';
  const initialWeekId = searchParams.get('weekId') || '';

  const [courses, setCourses] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [randomCount, setRandomCount] = useState('5');

  const [formData, setFormData] = useState({
    courseId: initialCourseId,
    weekId: initialWeekId,
    title: '',
    description: '',
    durationMinutes: 15,
    totalMarks: 50,
    passPercentage: 70,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    settings: {
      randomizeQuestions: true,
      randomizeOptions: true,
      negativeMarking: false,
      negativeMarkValue: 1,
      showScoreImmediate: true,
      showAnswerReview: true,
      requireFullscreen: true,
      tabSwitchDetection: true,
      tabSwitchLimit: 3,
    },
  });

  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const cList = courseService.getAllCourses();
    setCourses(cList);

    const activeCId = initialCourseId || cList[0]?.id;
    if (activeCId) {
      setFormData((prev) => ({ ...prev, courseId: activeCId }));
      const wList = courseService.getCurriculum(activeCId);
      setWeeks(wList);

      const targetWId = initialWeekId || wList[0]?.id;
      if (targetWId) {
        setFormData((prev) => ({
          ...prev,
          weekId: targetWId,
          title: `Week ${String(wList.find((w) => w.id === targetWId)?.weekNumber || 1).padStart(2, '0')} Technical Assessment`,
        }));
      }

      const qList = questionService.getQuestionsByCourse(activeCId);
      setAvailableQuestions(qList);
      // Select first 5 questions by default
      const defaultIds = qList.slice(0, 5).map((q) => q.id);
      setSelectedQuestionIds(defaultIds);
      setFormData((prev) => ({ ...prev, totalMarks: defaultIds.length * 10 }));
    }
  }, [initialCourseId, initialWeekId]);

  const handleCourseChange = (cId) => {
    const wList = courseService.getCurriculum(cId);
    setWeeks(wList);
    const qList = questionService.getQuestionsByCourse(cId);
    setAvailableQuestions(qList);

    const nextWeekId = wList[0]?.id || '';
    const initialIds = qList.slice(0, 5).map((q) => q.id);
    setSelectedQuestionIds(initialIds);

    setFormData((prev) => ({
      ...prev,
      courseId: cId,
      weekId: nextWeekId,
      title: `Week ${String(wList[0]?.weekNumber || 1).padStart(2, '0')} Technical Assessment`,
      totalMarks: initialIds.length * 10,
    }));
  };

  const handleToggleQuestion = (id) => {
    setSelectedQuestionIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      setFormData((f) => ({ ...f, totalMarks: next.length * 10 }));
      return next;
    });
  };

  const handleRandomizeSelection = () => {
    const count = parseInt(randomCount, 10) || 5;
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count).map((q) => q.id);
    setSelectedQuestionIds(picked);
    setFormData((f) => ({ ...f, totalMarks: picked.length * 10 }));
    success('Randomized', `Selected ${picked.length} random questions from course bank.`);
  };

  const handleSave = (publish = false) => {
    if (!formData.title.trim()) {
      error('Validation', 'Quiz title is required.');
      return;
    }
    if (!formData.courseId || !formData.weekId) {
      error('Validation', 'Course and Week must be selected.');
      return;
    }
    if (selectedQuestionIds.length === 0) {
      error('Validation', 'Select at least 1 question for the quiz.');
      return;
    }

    try {
      const payload = {
        ...formData,
        questionIds: selectedQuestionIds,
        status: publish ? 'published' : 'draft',
      };
      const created = quizService.createQuiz(payload);
      success(
        publish ? 'Quiz Published' : 'Quiz Saved',
        `"${created.title}" is now ${publish ? 'active for enrolled students' : 'saved as draft'}.`
      );
      navigate('/admin/quizzes');
    } catch (err) {
      error('Failed to create quiz', err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <Link
          to="/admin/quizzes"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Build Weekly Assessment</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure questions, timing limits, and anti-copy security deterrents.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Core Metadata */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-cyan-400">
            1. Course & Week Assignment
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Course *"
              value={formData.courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              options={courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` }))}
            />

            <Select
              label="Associated Week Module *"
              value={formData.weekId}
              onChange={(e) => {
                const wId = e.target.value;
                const weekObj = weeks.find((w) => w.id === wId);
                setFormData({
                  ...formData,
                  weekId: wId,
                  title: `Week ${String(weekObj?.weekNumber || 1).padStart(2, '0')} Technical Assessment`,
                });
              }}
              options={weeks.map((w) => ({
                value: w.id,
                label: `Week ${String(w.weekNumber).padStart(2, '0')}: ${w.title}`,
              }))}
            />
          </div>

          <Input
            label="Quiz Title *"
            placeholder="e.g. Week 05 Assessment: Python Functions & Closures"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Input
              label="Duration (Minutes) *"
              type="number"
              min="5"
              max="180"
              value={formData.durationMinutes}
              onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value, 10) || 15 })}
            />
            <Input
              label="Total Marks"
              type="number"
              value={formData.totalMarks}
              onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value, 10) || 50 })}
            />
            <Input
              label="Pass Percentage (%)"
              type="number"
              min="40"
              max="100"
              value={formData.passPercentage}
              onChange={(e) => setFormData({ ...formData, passPercentage: parseInt(e.target.value, 10) || 70 })}
            />
            <Input
              label="Submission Deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </Card>

        {/* Security & Deterrent Settings (Prompt Sections 31 & 67) */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            2. Quiz Delivery & Anti-Cheat Deterrent Policies
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={formData.settings.randomizeQuestions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, randomizeQuestions: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-cyan-500"
              />
              <div>
                <strong className="text-white block">Randomize Question Order</strong>
                <span className="text-[11px] text-slate-400">Shuffles questions uniquely per student</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={formData.settings.randomizeOptions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, randomizeOptions: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-cyan-500"
              />
              <div>
                <strong className="text-white block">Randomize Option Choices</strong>
                <span className="text-[11px] text-slate-400">Shuffles A, B, C, D choices while maintaining identity key</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={formData.settings.requireFullscreen}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, requireFullscreen: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-cyan-500"
              />
              <div>
                <strong className="text-white block">Enforce Fullscreen Mode</strong>
                <span className="text-[11px] text-slate-400">Prompts student into browser fullscreen before starting</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 cursor-pointer hover:border-slate-700">
              <input
                type="checkbox"
                checked={formData.settings.tabSwitchDetection}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, tabSwitchDetection: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-cyan-500"
              />
              <div>
                <strong className="text-white block">Tab Switch Detection & Warnings</strong>
                <span className="text-[11px] text-slate-400">Monitors visibility change with maximum 3 warnings</span>
              </div>
            </label>
          </div>
        </Card>

        {/* Question Selector & Randomizer (Prompt Section 30) */}
        <Card className="p-6 bg-slate-900/90 border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
                3. Question Selection ({selectedQuestionIds.length} Selected)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {availableQuestions.length} questions available in bank for this course.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max={availableQuestions.length || 10}
                className="w-16 text-center py-1.5"
                value={randomCount}
                onChange={(e) => setRandomCount(e.target.value)}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Shuffle}
                onClick={handleRandomizeSelection}
              >
                Auto Pick Random
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl bg-slate-950/80 p-2 border border-slate-800">
            {availableQuestions.map((q) => {
              const isSelected = selectedQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => handleToggleQuestion(q.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer flex items-start gap-3 transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                      : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white leading-relaxed">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">{q.topic}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        Ans: {q.correctAnswer}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link to="/admin/quizzes">
            <Button variant="ghost" size="md">
              Cancel
            </Button>
          </Link>
          <Button variant="secondary" size="md" onClick={() => handleSave(false)}>
            Save as Draft
          </Button>
          <Button variant="primary" size="md" onClick={() => handleSave(true)} icon={CheckSquare}>
            Save & Publish Assessment
          </Button>
        </div>
      </div>
    </div>
  );
};
