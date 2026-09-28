// Authoritative Batch Service connected to Django REST API & PostgreSQL
import api, { formatApiError } from './api';
import { storageService, STORAGE_KEYS } from './storageService';
import { syncService } from './syncService';

export const batchService = {
  getAllBatches() {
    const batches = storageService.getCollection(STORAGE_KEYS.BATCHES);
    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    return batches.map((b) => ({
      ...b,
      studentCount: students.filter((s) => s.batchId === b.id).length,
    }));
  },

  getBatchById(batchId) {
    const batch = storageService.getItemById(STORAGE_KEYS.BATCHES, batchId);
    if (!batch) return null;
    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    return {
      ...batch,
      studentCount: students.filter((s) => s.batchId === batchId).length,
    };
  },

  async createBatch(batchData) {
    if (!batchData.name || !batchData.name.trim()) {
      throw new Error('Batch name is required.');
    }
    const payload = {
      name: batchData.name.trim(),
      code: (batchData.code || batchData.name.replace(/\s+/g, '-')).toUpperCase(),
      description: batchData.description || '',
      status: batchData.status || 'active',
    };

    try {
      const response = await api.post('/batches/', payload);
      const b = response.data;
      const normalized = {
        id: b.id,
        name: b.name,
        code: b.code,
        description: b.description || '',
        status: b.status || 'active',
        studentCount: 0,
        createdAt: b.created_at,
      };
      storageService.insertItem(STORAGE_KEYS.BATCHES, normalized);
      syncService.syncAll('admin').catch(() => {});
      return normalized;
    } catch (err) {
      // Fallback local persistence if offline
      const newBatch = {
        id: `batch_${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
      };
      storageService.insertItem(STORAGE_KEYS.BATCHES, newBatch);
      return newBatch;
    }
  },

  async updateBatch(batchId, updates) {
    try {
      if (typeof batchId === 'number' || !isNaN(batchId)) {
        await api.patch(`/batches/${batchId}/`, updates);
      }
    } catch (err) {
      console.warn('API updateBatch failed, applying locally:', err);
    }
    return storageService.updateItem(STORAGE_KEYS.BATCHES, batchId, updates);
  },

  async archiveBatch(batchId) {
    return this.updateBatch(batchId, { status: 'archived' });
  },

  async deleteBatch(batchId) {
    try {
      if (typeof batchId === 'number' || !isNaN(batchId)) {
        await api.delete(`/batches/${batchId}/`);
      }
    } catch (err) {
      console.warn('API deleteBatch failed, applying locally:', err);
    }
    return storageService.deleteItem(STORAGE_KEYS.BATCHES, batchId);
  },
};
