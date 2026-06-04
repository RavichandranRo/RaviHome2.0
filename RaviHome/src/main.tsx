import React from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

const initWebStore = async () => {
  if (Capacitor.getPlatform() === 'web') {
    jeepSqlite(window);
    const jeepSqliteEl = document.createElement('jeep-sqlite');
    document.body.appendChild(jeepSqliteEl);
    await customElements.whenDefined('jeep-sqlite');
    
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    await sqlite.initWebStore();
  }
};

initWebStore().then(async () => {
  // Dynamically import App AFTER the SQLite web store is initialized!
  // This prevents Zustand from attempting to read the DB before it's ready.
  const { default: App } = await import('./App');

  const container = document.getElementById('root');
  const root = createRoot(container!);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});