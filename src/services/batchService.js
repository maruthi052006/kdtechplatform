// Batch Service
import { storageService, STORAGE_KEYS } from './storageService';

export const batchService = {
  getAllBatches() {
    const batches = storageService.getCollection(STORAGE_KEYS.BATCHES);
    const students = storageService.getCollection(STORAGE_KEYS.STUDENTS);
    // Enrich with dynamic student counts
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

  createBatch(batchData) {
    if (!batchData.name || !batchData.name.trim()) {
      throw new Error('Batch name is required.');
    }
    const newBatch = {
      id: `batch_${Date.now()}`,
      name: batchData.name.trim(),
      code: (batchData.code || batchData.name.replace(/\s+/g, '-')).toUpperCase(),
      description: batchData.description || '',
      createdAt: new Date().toISOString(),
      status: batchData.status || 'active',
    };
    storageService.insertItem(STORAGE_KEYS.BATCHES, newBatch);
    return newBatch;
  },

  updateBatch(batchId, updates) {
    return storageService.updateItem(STORAGE_KEYS.BATCHES, batchId, updates);
  },

  archiveBatch(batchId) {
    return storageService.updateItem(STORAGE_KEYS.BATCHES, batchId, { status: 'archived' });
  },

  deleteBatch(batchId) {
    return storageService.deleteItem(STORAGE_KEYS.BATCHES, batchId);
  },
};
