import React, { useState, useEffect } from 'react';
import { batchService } from '../../services/batchService';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Layers,
  Plus,
  Users,
  Edit2,
  Archive,
  Trash2,
  Calendar,
} from 'lucide-react';

export const BatchManagement = () => {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchName, setBatchName] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [batchDescription, setBatchDescription] = useState('');

  const { success, error } = useToast();

  const loadData = () => {
    setBatches(batchService.getAllBatches());
    setStudents(studentService.getAllStudents());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingBatch(null);
    setBatchName('');
    setBatchCode('');
    setBatchDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    setBatchName(batch.name);
    setBatchCode(batch.code);
    setBatchDescription(batch.description || '');
    setIsModalOpen(true);
  };

  const handleSaveBatch = (e) => {
    e.preventDefault();
    if (!batchName.trim()) {
      error('Validation', 'Batch name is required.');
      return;
    }

    try {
      if (editingBatch) {
        batchService.updateBatch(editingBatch.id, {
          name: batchName.trim(),
          code: batchCode.trim().toUpperCase(),
          description: batchDescription.trim(),
        });
        success('Batch Updated', `"${batchName}" updated successfully.`);
      } else {
        batchService.createBatch({
          name: batchName.trim(),
          code: batchCode.trim().toUpperCase() || batchName.replace(/\s+/g, '-').toUpperCase(),
          description: batchDescription.trim(),
        });
        success('Batch Created', `"${batchName}" created.`);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      error('Failed', err.message);
    }
  };

  const handleArchive = (batchId, name) => {
    batchService.archiveBatch(batchId);
    success('Archived', `Batch "${name}" set to archived.`);
    loadData();
  };

  const handleDelete = (batchId, name) => {
    if (window.confirm(`Delete batch "${name}"? Students will remain in the system.`)) {
      batchService.deleteBatch(batchId);
      success('Deleted', `Batch "${name}" was deleted.`);
      loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Batch Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Organize student cohorts into dedicated training batches and track enrollment sizes.
          </p>
        </div>

        <Button variant="primary" size="md" icon={Plus} onClick={handleOpenCreate}>
          Create Cohort Batch
        </Button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches.map((batch) => {
          const batchStudents = students.filter((s) => s.batchId === batch.id);

          return (
            <Card key={batch.id} className="p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    {batch.code}
                  </span>
                  <Badge variant={batch.status === 'active' ? 'emerald' : 'slate'} size="xs">
                    {batch.status}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-white leading-tight">{batch.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {batch.description || 'Standard engineering cohort.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Users className="w-4 h-4" />
                  <span>{batchStudents.length} Students</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(batch)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Edit Batch"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {batch.status === 'active' && (
                    <button
                      onClick={() => handleArchive(batch.id, batch.name)}
                      className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Archive Batch"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(batch.id, batch.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Batch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBatch ? 'Edit Cohort Batch' : 'Create Cohort Batch'}
        subtitle="Group students by intake or course specialization."
      >
        <form onSubmit={handleSaveBatch} className="space-y-4">
          <Input
            label="Batch Name *"
            placeholder="e.g. Python Full Stack 2026"
            value={batchName}
            onChange={(e) => {
              setBatchName(e.target.value);
              if (!editingBatch && !batchCode) {
                setBatchCode(e.target.value.replace(/\s+/g, '-').toUpperCase());
              }
            }}
            autoFocus
          />

          <Input
            label="Batch Code"
            placeholder="e.g. PFS-2026-A"
            value={batchCode}
            onChange={(e) => setBatchCode(e.target.value.toUpperCase())}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={3}
              value={batchDescription}
              onChange={(e) => setBatchDescription(e.target.value)}
              placeholder="Cohort schedule, evening/weekend batch details, etc."
              className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:ring-4 focus:ring-cyan-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingBatch ? 'Save Changes' : 'Create Batch'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
