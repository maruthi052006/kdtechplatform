import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/announcementService';
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
  Bell,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Megaphone,
} from 'lucide-react';

export const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    courseId: 'all',
    priority: 'normal',
  });

  const { success, error } = useToast();

  const loadData = () => {
    setAnnouncements(announcementService.getAllAnnouncements());
    setCourses(courseService.getAllCourses());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Validation', 'Title is required.');
      return;
    }

    try {
      announcementService.createAnnouncement(formData);
      success('Broadcast Published', 'Students will see this announcement on their dashboard.');
      setIsModalOpen(false);
      setFormData({ title: '', message: '', courseId: 'all', priority: 'normal' });
      loadData();
    } catch (err) {
      error('Failed', err.message);
    }
  };

  const handleDelete = (id) => {
    announcementService.deleteAnnouncement(id);
    success('Deleted', 'Announcement removed.');
    loadData();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Announcements</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Broadcast assessment reminders, curriculum updates, and milestone deadlines.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Broadcast
        </Button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No announcements broadcast yet"
          description="Send timely notifications to all students or target specific courses."
          actionLabel="New Broadcast"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const course = courses.find((c) => c.id === ann.courseId);
            return (
              <Card key={ann.id} className="p-5 flex flex-col justify-between space-y-3 bg-slate-900/80 border-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={ann.priority === 'high' ? 'rose' : 'cyan'} size="xs">
                        {ann.priority.toUpperCase()}
                      </Badge>
                      <Badge variant="slate" size="xs">
                        {course ? course.code : 'All Cohorts'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-white">{ann.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {ann.message}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {new Date(ann.publishDate).toLocaleDateString()}
                  </span>
                  <span>Visible to student dashboard</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Broadcast Announcement"
        subtitle="Post a notification to student learning dashboards."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Announcement Title *"
            placeholder="e.g. Week 05 Python Quiz is Now Available"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Target Course"
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              options={[
                { value: 'all', label: 'All Courses & Batches' },
                ...courses.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <Select
              label="Priority Level"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High (Alert Banner)' },
                { value: 'low', label: 'Low (Informational)' },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Message Content</label>
            <textarea
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Provide deadline, instructions, or exam preparation tips..."
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-4 focus:ring-cyan-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={Megaphone}>
              Broadcast
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
