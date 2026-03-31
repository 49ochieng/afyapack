/**
 * IndexedDB wrapper for offline state persistence.
 * Stores: UI state, cached encounters, offline queue.
 */
import { openDB } from 'idb';

const DB_NAME = 'afyapack-local';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Offline queue for sync when API comes back
        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
        }
        // UI state cache
        if (!db.objectStoreNames.contains('ui_state')) {
          db.createObjectStore('ui_state', { keyPath: 'key' });
        }
        // Encounter drafts cached locally
        if (!db.objectStoreNames.contains('encounter_drafts')) {
          db.createObjectStore('encounter_drafts', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveUIState(key, value) {
  const db = await getDB();
  await db.put('ui_state', { key, value, updated_at: new Date().toISOString() });
}

export async function getUIState(key) {
  const db = await getDB();
  const row = await db.get('ui_state', key);
  return row?.value ?? null;
}

export async function saveEncounterDraft(draft) {
  const db = await getDB();
  await db.put('encounter_drafts', { ...draft, saved_at: new Date().toISOString() });
}

export async function getEncounterDraft(id) {
  const db = await getDB();
  return db.get('encounter_drafts', id);
}

export async function deleteEncounterDraft(id) {
  const db = await getDB();
  await db.delete('encounter_drafts', id);
}

export async function getAllDrafts() {
  const db = await getDB();
  return db.getAll('encounter_drafts');
}

export async function queueOfflineAction(action) {
  const db = await getDB();
  await db.add('offline_queue', {
    ...action,
    queued_at: new Date().toISOString(),
    retries: 0,
  });
}

export async function getOfflineQueue() {
  const db = await getDB();
  return db.getAll('offline_queue');
}

export async function clearOfflineQueue() {
  const db = await getDB();
  await db.clear('offline_queue');
}
