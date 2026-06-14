import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButton,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { ExportService } from '../services/ExportService';

const SettingsTab: React.FC = () => {
  const [presentAlert] = useIonAlert();
  const store = useAppStore();
  const showNotification = useNotificationStore(state => state.showNotification);
  const triggerAnimation = useNotificationStore(state => state.triggerAnimation);

  // Custom Export States
  const [exportModule, setExportModule] = useState('Expenses');
  const [exportFormat, setExportFormat] = useState('CSV');
  const [exportDuration, setExportDuration] = useState('Today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    store.setTheme(newTheme);
    triggerAnimation('THEME');
    showNotification('success', 'Theme Updated', `Interface set to ${newTheme.toUpperCase()} mode.`);
  };

  const themes = [
    { id: 'indigo', name: 'Aura Indigo', color: '#6366f1' },
    { id: 'teal', name: 'Lara Teal', color: '#14b8a6' },
    { id: 'green', name: 'Lara Green', color: '#10b981' },
    { id: 'blue', name: 'Saga Blue', color: '#2196f3' },
    { id: 'orange', name: 'Vela Orange', color: '#f57c00' },
    { id: 'purple', name: 'Arya Purple', color: '#9c27b0' },
    { id: 'pink', name: 'Lara Pink', color: '#ec4899' },
    { id: 'amber', name: 'Lara Amber', color: '#f59e0b' }
  ] as const;

  const handleThemeColorChange = (color: typeof themes[number]['id']) => {
    store.setThemeColor(color);
    document.documentElement.setAttribute('data-theme-color', color);
    showNotification('success', 'Theme Color Updated', `Interface theme color set to ${themes.find(t => t.id === color)?.name}.`);
  };

  // Trigger Audit Logs Archive & Purge
  const handleArchive = () => {
    presentAlert({
      header: 'Archive & Purge Logs',
      message: 'Enter the number of days to keep. Older logs will be zipped and saved to your device.',
      inputs: [
        { name: 'days', type: 'number', placeholder: 'Days to keep (default: 30)', min: 0 }
      ],
      buttons: [
        'Cancel',
        {
          text: 'Archive',
          handler: async (data) => {
            const days = data.days !== '' ? parseInt(data.days, 10) : 30;
            try {
              const uri = await store.archiveAndPurgeAuditLogs(days);
              if (uri) {
                triggerAnimation('ARCHIVE');
                showNotification('success', 'Logs Backup Complete', `Audit logs compiled. File created.`);
              } else {
                showNotification('info', 'Backup Status', 'No audit logs exceed the duration limit.');
              }
            } catch (e) {
              showNotification('failure', 'Backup Failed', 'Archive zip compressor failed.');
            }
          }
        }
      ]
    });
  };

  // Custom Export Logic
  const handleExport = () => {
    const now = new Date();
    let startTime = 0;
    let endTime = now.getTime();

    // Time range calculations
    if (exportDuration === 'Today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startTime = today.getTime();
    } else if (exportDuration === 'Last Week') {
      startTime = now.getTime() - (7 * 24 * 60 * 60 * 1000);
    } else if (exportDuration === 'Last Month') {
      startTime = now.getTime() - (30 * 24 * 60 * 60 * 1000);
    } else if (exportDuration === 'Last Year') {
      startTime = now.getTime() - (365 * 24 * 60 * 60 * 1000);
    } else if (exportDuration === 'Custom Range') {
      if (!customStart || !customEnd) {
        showNotification('validation', 'Validation check', 'Please specify both start and end date boundaries.');
        return;
      }
      startTime = new Date(customStart).getTime();
      // Set the end time to the very end of the selected day
      endTime = new Date(customEnd).getTime() + (24 * 60 * 60 * 1000) - 1;
    }

    // Grab raw data from store
    let dataToExport: any[] = [];
    switch (exportModule) {
      case 'Expenses': dataToExport = store.expenses; break;
      case 'Deposits': dataToExport = store.deposits; break;
      case 'Tasks': dataToExport = store.tasks; break;
      case 'Tickets': dataToExport = store.tickets; break;
      case 'EBReadings': dataToExport = store.ebReadings; break;
      case 'AuditLogs': dataToExport = store.auditLogs; break;
    }

    // Filter based on the selected Date range
    const filteredData = dataToExport.filter(item => {
      let itemTime = 0;
      if (exportModule === 'AuditLogs') itemTime = new Date(item.date).getTime();
      else if (exportModule === 'Deposits') itemTime = new Date(item.startDate || Date.now()).getTime();
      else if (exportModule === 'Tickets') itemTime = new Date(item.time || Date.now()).getTime();
      else itemTime = new Date(item.date).getTime(); // Expenses, Tasks, EB readings

      // Fallback for corrupted date items
      if (isNaN(itemTime)) return true;
      return itemTime >= startTime && itemTime <= endTime;
    });

    if (filteredData.length === 0) {
      showNotification('validation', 'Validation check', 'No database entries found matching the filter range.');
      return;
    }

    // Call Export Service - This natively prompts for Download/Save Path on supported browsers
    const filename = `${exportModule}_Report_${new Date().toISOString().split('T')[0]}`;
    try {
      if (exportFormat === 'CSV') ExportService.exportToCSV(filteredData, filename);
      else if (exportFormat === 'Excel') ExportService.exportToExcel(filteredData, filename);
      else if (exportFormat === 'PDF') ExportService.exportToPDF(filteredData, filename, `${exportModule} Report`);

      showNotification('success', 'Export Success', `${exportModule} report compiled in ${exportFormat} format.`);
      store.addAuditLog(`Exported ${filteredData.length} ${exportModule} records as ${exportFormat}`);
    } catch (e) {
      showNotification('failure', 'Export Failure', 'Database report compilation failed.');
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Settings</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">

        <IonCard className="mb-6 shadow-sm border border-gray-100">
          <IonCardHeader><IonCardTitle className="text-lg">Advanced Export Builder</IonCardTitle></IonCardHeader>
          <IonCardContent>
            <IonSelect fill="outline" label="Data to Export" labelPlacement="floating" value={exportModule} onIonChange={e => setExportModule(e.detail.value)} className="mb-4">
              {['Expenses', 'Deposits', 'Tasks', 'Tickets', 'EBReadings', 'AuditLogs'].map(mod => <IonSelectOption key={mod} value={mod}>{mod}</IonSelectOption>)}
            </IonSelect>
            <IonSelect fill="outline" label="Export Format" labelPlacement="floating" value={exportFormat} onIonChange={e => setExportFormat(e.detail.value)} className="mb-4">
              {['CSV', 'Excel', 'PDF'].map(fmt => <IonSelectOption key={fmt} value={fmt}>{fmt}</IonSelectOption>)}
            </IonSelect>
            <IonSelect fill="outline" label="Duration" labelPlacement="floating" value={exportDuration} onIonChange={e => setExportDuration(e.detail.value)} className="mb-4">
              {['Today', 'Last Week', 'Last Month', 'Last Year', 'Custom Range'].map(dur => <IonSelectOption key={dur} value={dur}>{dur}</IonSelectOption>)}
            </IonSelect>

            {exportDuration === 'Custom Range' && (
              <div className="flex gap-2 mb-4">
                <IonInput fill="outline" label="Start Date" labelPlacement="floating" type="date" value={customStart} onIonChange={e => setCustomStart(e.detail.value!)} />
                <IonInput fill="outline" label="End Date" labelPlacement="floating" type="date" value={customEnd} onIonChange={e => setCustomEnd(e.detail.value!)} />
              </div>
            )}

            <IonButton expand="block" onClick={handleExport}>Export Data</IonButton>
          </IonCardContent>
        </IonCard>

        <IonCard className="mb-6 shadow-sm border border-gray-100">
          <IonCardHeader><IonCardTitle className="text-lg">Appearance</IonCardTitle></IonCardHeader>
          <IonCardContent>
            <IonSelect fill="outline" label="Theme Switcher" labelPlacement="floating" value={store.theme} onIonChange={e => handleThemeChange(e.detail.value)} className="mb-4">
              <IonSelectOption value="light">Light Mode</IonSelectOption>
              <IonSelectOption value="dark">Dark Mode</IonSelectOption>
            </IonSelect>

            <div className="mt-4">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-3">Color Accent Theme</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themes.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleThemeColorChange(t.id)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-3 flex flex-col justify-between h-[100px] transition-all bg-white hover:bg-slate-50 border-slate-200 ${
                      store.themeColor === t.id ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold text-slate-700">{t.name}</span>
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: t.color }}
                      >
                        {store.themeColor === t.id && (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>
                    </div>
                    {/* Visual color bar */}
                    <div className="w-full h-1.5 rounded-full mt-2" style={{ backgroundColor: t.color }} />
                  </div>
                ))}
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="mb-6 shadow-sm border border-gray-100">
          <IonCardHeader><IonCardTitle className="text-lg">System Management</IonCardTitle></IonCardHeader>
          <IonCardContent>
            <p className="text-sm text-gray-600 mb-4">Zips and removes audit logs older than a specified number of days to keep your local database fast and light.</p>
            <IonButton expand="block" color="danger" fill="outline" onClick={handleArchive}>Archive & Purge Old Logs</IonButton>
          </IonCardContent>
        </IonCard>

      </IonContent>
    </IonPage>
  );
};
export default SettingsTab;