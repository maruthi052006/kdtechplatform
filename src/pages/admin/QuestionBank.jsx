import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { questionService } from '../../services/questionService';
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
  HelpCircle,
  Plus,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Trash2,
  Edit3,
  Layers,
  Sparkles,
} from 'lucide-react';

export const QuestionBank = () => {
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Manual Question Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    courseId: '',
    topic: '',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    difficulty: 'Medium',
    explanation: '',
  });

  const { success, error } = useToast();

  const loadData = () => {
    setQuestions(questionService.getAllQuestions());
    const cList = courseService.getAllCourses();
    setCourses(cList);
    if (cList.length > 0 && !formData.courseId) {
      setFormData((prev) => ({ ...prev, courseId: cList[0].id }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setFormData({
      courseId: courses[0]?.id || 'course_py_fs',
      topic: 'General',
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      difficulty: 'Medium',
      explanation: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestion(q);
    setFormData({
      courseId: q.courseId,
      topic: q.topic,
      question: q.question,
      optionA: q.options[0]?.text || '',
      optionB: q.options[1]?.text || '',
      optionC: q.options[2]?.text || '',
      optionD: q.options[3]?.text || '',
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      explanation: q.explanation || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveQuestion = (e) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      error('Validation', 'Question text is required.');
      return;
    }
    if (!formData.optionA || !formData.optionB) {
      error('Validation', 'At least Options A and B are required.');
      return;
    }

    const payload = {
      courseId: formData.courseId,
      topic: formData.topic || 'General',
      question: formData.question.trim(),
      options: [
        { key: 'A', text: formData.optionA.trim() },
        { key: 'B', text: formData.optionB.trim() },
        { key: 'C', text: formData.optionC.trim() },
        { key: 'D', text: formData.optionD.trim() },
      ],
      correctAnswer: formData.correctAnswer,
      difficulty: formData.difficulty,
      explanation: formData.explanation.trim(),
    };

    try {
      if (editingQuestion) {
        questionService.updateQuestion(editingQuestion.id, payload);
        success('Question Updated', 'Question details saved.');
      } else {
        questionService.createQuestion(payload);
        success('Question Created', 'Added to question bank.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      error('Failed', err.message);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this question from the bank?')) {
      questionService.deleteQuestion(id);
      success('Question Removed', 'Question deleted.');
      loadData();
    }
  };

  const filtered = questionService.filterQuestions({
    courseId: courseFilter,
    difficulty: difficultyFilter,
    search,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Question Bank</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Central repository of technical MCQs with topic tagging, difficulty tiers, and answer rationales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/questions/import">
            <Button variant="secondary" size="md" icon={FileSpreadsheet}>
              Import Excel (.xlsx)
            </Button>
          </Link>
          <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
            Add Question
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <Input
            icon={Search}
            placeholder="Search questions or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="w-52">
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
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Difficulty' },
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Question Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No questions match filters"
          description="Create a question or import in bulk using an Excel spreadsheet."
          actionLabel="Add Question"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((q) => {
            const course = courses.find((c) => c.id === q.courseId);
            const difficultyBadge =
              q.difficulty === 'Easy'
                ? 'emerald'
                : q.difficulty === 'Medium'
                ? 'amber'
                : 'rose';

            return (
              <Card key={q.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="cyan" size="xs">
                        {course ? course.code : 'Technical'}
                      </Badge>
                      <Badge variant="slate" size="xs">
                        {q.topic}
                      </Badge>
                    </div>
                    <Badge variant={difficultyBadge} size="xs">
                      {q.difficulty}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-relaxed">{q.question}</h3>

                  {/* Options List */}
                  <div className="space-y-1.5 pt-1">
                    {q.options.map((opt) => {
                      const isCorrect = opt.key === q.correctAnswer;
                      return (
                        <div
                          key={opt.key}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-colors ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200 font-medium'
                              : 'bg-slate-950/60 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {opt.key}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
                      <strong className="text-slate-300 block mb-0.5">Rationale:</strong>
                      {q.explanation}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[10px]">{q.id}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Question"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'Create Question'}
        subtitle="Specify question prompt, 4 choices, correct answer key, and explanation."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Course"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              options={courses.map((c) => ({ value: c.id, label: c.name }))}
            />

            <Input
              label="Topic"
              placeholder="e.g. OOP Inheritance"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            />

            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              options={[
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Question Text *</label>
            <textarea
              rows={3}
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Type the MCQ prompt or code snippet question..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-4 focus:ring-cyan-500/20"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Option A *"
              value={formData.optionA}
              onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
            />
            <Input
              label="Option B *"
              value={formData.optionB}
              onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
            />
            <Input
              label="Option C"
              value={formData.optionC}
              onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
            />
            <Input
              label="Option D"
              value={formData.optionD}
              onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Correct Answer Key *"
              value={formData.correctAnswer}
              onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
              options={[
                { value: 'A', label: 'Option A' },
                { value: 'B', label: 'Option B' },
                { value: 'C', label: 'Option C' },
                { value: 'D', label: 'Option D' },
              ]}
            />

            <Input
              label="Explanation"
              placeholder="Brief rationale for the correct answer"
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Question
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
