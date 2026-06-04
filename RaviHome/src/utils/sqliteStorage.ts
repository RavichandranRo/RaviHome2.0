import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { StateStorage } from 'zustand/middleware';

const sqlite = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'ravihome_db';
let dbInstance: SQLiteDBConnection | null = null;

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
  if (Capacitor.getPlatform() === 'web') {
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
      const db = await getDb();
      const res = await db.query(`SELECT value FROM kv_store WHERE key = ?`, [name]);
      if (res.values && res.values.length > 0) {
        return res.values[0].value;
      }
      return null;
    } catch (e) {
      console.error('SQLite getItem error:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const db = await getDb();
      await db.run(`INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)`, [name, value]);
      await saveToStoreIfWeb();
    } catch (e) {
      console.error('SQLite setItem error:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await getDb();
      await db.run(`DELETE FROM kv_store WHERE key = ?`, [name]);
      await saveToStoreIfWeb();
    } catch (e) {
      console.error('SQLite removeItem error:', e);
    }
  }
};