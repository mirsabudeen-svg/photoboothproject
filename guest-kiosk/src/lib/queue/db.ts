import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export type JobStatus =
  | 'captured'
  | 'creating'
  | 'created'
  | 'uploading'
  | 'uploaded'
  | 'completing'
  | 'done'
  | 'failed';

export interface CaptureJob {
  id: string;
  eventId: string;
  status: JobStatus;
  blob: Blob;
  contentType: 'image/jpeg';
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  captureId?: string;
  objectKey?: string;
  uploadUrl?: string;
  uploadUrlExpiresAt?: number;
  galleryUrl?: string;
  lastError?: string;
}

interface KioskDB extends DBSchema {
  captureQueue: {
    key: string;
    value: CaptureJob;
    indexes: { byStatus: JobStatus; byCreated: number };
  };
}

let dbInstance: Promise<IDBPDatabase<KioskDB>> | null = null;

export function dbPromise(): Promise<IDBPDatabase<KioskDB>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in the browser'));
  }
  if (!dbInstance) {
    dbInstance = openDB<KioskDB>('wpb-kiosk', 1, {
      upgrade(db) {
        const store = db.createObjectStore('captureQueue', { keyPath: 'id' });
        store.createIndex('byStatus', 'status');
        store.createIndex('byCreated', 'createdAt');
      },
    });
  }
  return dbInstance;
}
