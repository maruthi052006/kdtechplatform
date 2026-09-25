import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { ArrowLeft, BookOpen, Check, Layers } from 'lucide-react';

export const CourseCreate = () => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'Full Stack Engineering',
    level: 'Intermediate',
    duration: '12 Weeks',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    status: 'published',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Course name is required';
    if (!formData.code.trim()) newErrors.code = 'Course code is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const created = courseService.createCourse(formData);
      success('Course Created Successfully', `"${created.name}" is now ready for curriculum configuration.`);
      navigate(`/admin/courses/${created.id}/curriculum`);
    } catch (err) {
      error('Creation Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/courses"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Create Technical Course</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define course metadata, target audience, and initial 12-week syllabus scaffold.
          </p>
        </div>
      </div>

      <Card className="p-6 sm:p-8 bg-slate-900/90 border-slate-800 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label="Course Name *"
              placeholder="e.g. Python Full Stack Development"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors.name}
              autoFocus
            />

            <Input
              label="Course Code *"
              placeholder="e.g. PY-FS-101"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              error={errors.code}
              helperText="Unique uppercase identifier"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              options={[
                { value: 'Full Stack Engineering', label: 'Full Stack Engineering' },
                { value: 'Frontend Engineering', label: 'Frontend Engineering' },
                { value: 'Data & Analytics', label: 'Data & Analytics' },
                { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
                { value: 'Cloud & DevOps', label: 'Cloud & DevOps' },
              ]}
            />

            <Select
              label="Difficulty Level"
              value={formData.level}
              onChange={(e) => handleChange('level', e.target.value)}
              options={[
                { value: 'Beginner', label: 'Beginner' },
                { value: 'Intermediate', label: 'Intermediate' },
                { value: 'Advanced', label: 'Advanced' },
                { value: 'Comprehensive', label: 'Comprehensive' },
              ]}
            />

            <Select
              label="Duration"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              options={[
                { value: '4 Weeks', label: '4 Weeks' },
                { value: '8 Weeks', label: '8 Weeks' },
                { value: '10 Weeks', label: '10 Weeks' },
                { value: '12 Weeks', label: '12 Weeks' },
                { value: '16 Weeks', label: '16 Weeks' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold tracking-wide text-slate-300">
              Course Description *
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Provide a comprehensive outline of competencies, prerequisites, and learning outcomes..."
              className={`w-full bg-slate-900/90 border ${
                errors.description ? 'border-rose-500' : 'border-slate-800 focus:border-cyan-500'
              } rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-4 focus:ring-cyan-500/20`}
            />
            {errors.description && (
              <span className="text-xs text-rose-400">{errors.description}</span>
            )}
          </div>

          <Input
            label="Thumbnail Image URL"
            value={formData.thumbnailUrl}
            onChange={(e) => handleChange('thumbnailUrl', e.target.value)}
            helperText="Unsplash or CDN image URL for course catalog card"
          />

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <Link to="/admin/courses">
              <Button variant="ghost" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              icon={Layers}
            >
              Create Course & Open Curriculum
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
