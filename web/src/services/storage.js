/* ═══════════════════════════════════════════
   IndexedDB — Local-first chat storage
   Messages & Contacts never leave the device.
   ═══════════════════════════════════════════ */

const DB_NAME = 'skypulse_local';
const DB_VERSION = 1;
const MESSAGES = 'messages';
const CONTACTS = 'contacts';

let db = null;

const open = () =>
  new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };

    req.onupgradeneeded = (e) => {
      const d = e.target.result;

      if (!d.objectStoreNames.contains(MESSAGES)) {
        const s = d.createObjectStore(MESSAGES, { keyPath: 'id', autoIncrement: true });
        s.createIndex('chatId', 'chatId', { unique: false });
        s.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!d.objectStoreNames.contains(CONTACTS)) {
        d.createObjectStore(CONTACTS, { keyPath: 'stationId' });
      }
    };
  });

const tx = async (store, mode, fn) => {
  const d = await open();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, mode);
    const s = t.objectStore(store);
    const r = fn(s);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
};

/* ── Messages ── */
export const saveMessage = (msg) => tx(MESSAGES, 'readwrite', (s) => s.add(msg));

export const getMessages = async (chatId) => {
  const d = await open();
  return new Promise((resolve, reject) => {
    const t = d.transaction(MESSAGES, 'readonly');
    const r = t.objectStore(MESSAGES).index('chatId').getAll(chatId);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
};

export const clearMessages = async (chatId) => {
  const d = await open();
  return new Promise((resolve, reject) => {
    const t = d.transaction(MESSAGES, 'readwrite');
    const req = t.objectStore(MESSAGES).index('chatId').openCursor(chatId);
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    req.onerror = () => reject(req.error);
  });
};

/* ── Contacts ── */
export const saveContact = (c) => tx(CONTACTS, 'readwrite', (s) => s.put(c));
export const getContacts = () => tx(CONTACTS, 'readonly', (s) => s.getAll());
export const getContact = (id) => tx(CONTACTS, 'readonly', (s) => s.get(id));
export const deleteContact = (id) => tx(CONTACTS, 'readwrite', (s) => s.delete(id));
