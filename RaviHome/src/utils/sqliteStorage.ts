import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { StateStorage } from 'zustand/middleware';

const sqlite = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'ravihome_db';
const isWeb = () => Capacitor.getPlatform() === 'web';

const readBrowserFallback = (name: string): string | null => {
  if (!isWeb() || typeof window === 'undefined') return null;
  return window.localStorage.getItem(name);
};

const writeBrowserFallback = (name: string, value: string) => {
  if (!isWeb() || typeof window === 'undefined') return;
  window.localStorage.setItem(name, value);
};

const removeBrowserFallback = (name: string) => {
  if (!isWeb() || typeof window === 'undefined') return;
  window.localStorage.removeItem(name);
};
let dbInstance: SQLiteDBConnection | null = null;

// Simple asynchronous queue to prevent SQLite transaction collisions
// during rapid consecutive state updates from zustand.
class AsyncQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  enqueue(task: () => Promise<void>) {
    this.queue.push(task);
    this.process();
  }

  private async process() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try { await task(); } catch (e) { console.error('Queue task error:', e); }
      }
    }
    this.isProcessing = false;
  }
}

const dbQueue = new AsyncQueue();

const getDb = async (): Promise<SQLiteDBConnection> => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

    if (isConn) {
      dbInstance = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
      dbInstance = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    }

    await dbInstance.open();
    await dbInstance.execute(`CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT)`);
    return dbInstance;
  } catch (e) {
    console.error('Error getting DB connection', e);
    throw e;
  }
};

const saveToStoreIfWeb = async () => {
  if (isWeb()) {
    try {
      await sqlite.saveToStore(DB_NAME);
    } catch (e) {
      console.error('Failed to save to web store', e);
    }
  }
};

export const sqliteStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // 1. Fast-path: Prioritize synchronous localStorage for Web
      if (isWeb()) {
        const webData = readBrowserFallback(name);
        if (webData) return webData;
      }

      const db = await getDb();
      const res = await db.query(`SELECT value FROM kv_store WHERE key = ?`, [name]);
      if (res.values && res.values.length > 0) {
        return res.values[0].value;
      }
      return readBrowserFallback(name);
    } catch (e) {
      console.error('SQLite getItem error:', e);
      return readBrowserFallback(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    writeBrowserFallback(name, value);
    return new Promise((resolve) => {
      dbQueue.enqueue(async () => {
        try {
          const db = await getDb();
          // Passing 'false' skips wrapping the single statement in an internal transaction
          await db.run(`INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)`, [name, value], false);
          await saveToStoreIfWeb();
        } catch (e) {
          console.error('SQLite setItem error:', e);
        }
        resolve();
      });
    });
  },
  removeItem: async (name: string): Promise<void> => {
    removeBrowserFallback(name);
    return new Promise((resolve) => {
      dbQueue.enqueue(async () => {
        try {
          const db = await getDb();
          await db.run(`DELETE FROM kv_store WHERE key = ?`, [name], false);
          await saveToStoreIfWeb();
        } catch (e) {
          console.error('SQLite removeItem error:', e);
        }
        resolve();
      });
    });
  }
};