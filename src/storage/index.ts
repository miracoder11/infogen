/**
 * InfoGen Trace Storage Module
 *
 * In-memory and file-based trace storage.
 */

export {
  TraceStorage,
  getTraceStorage,
  storeTrace,
  exportTracesToFile,
  clearTraceStorage,
  resetStorageForTesting,
  type StoredTrace,
  type StorageOptions,
} from './trace-storage.js';
