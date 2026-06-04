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
import { ExportService } from '../services/ExportService';

const SettingsTab: React.FC = () => {
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();
  const store = useAppStore();

  // Custom Export States
  const [exportModule, setExportModule] = useState('Expenses');
  const [exportFormat, setExportFormat] = useState('CSV');
  const [exportDuration, setExportDuration] = useState('Today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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
                presentToast({ message: `Logs archived to: ${uri}`, duration: 4000, color: 'success' });
              } else {
                presentToast({ message: 'No logs are old enough to archive.', duration: 2000, color: 'medium' });
              }
            } catch (e) {
              presentToast({ message: 'Failed to archive logs.', duration: 2000, color: 'danger' });
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
        presentToast({ message: 'Please select both start and end dates.', duration: 2000, color: 'danger' });
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
      case 'AuditLogs': dataToExport = store.auditLogs; break;
    }

    // Filter based on the selected Date range
    const filteredData = dataToExport.filter(item => {
      let itemTime = 0;
      if (exportModule === 'AuditLogs') itemTime = new Date(item.date).getTime();
      else if (exportModule === 'Deposits') itemTime = new Date(item.startDate || Date.now()).getTime();
      else if (exportModule === 'Tickets') itemTime = new Date(item.time || Date.now()).getTime();
      else itemTime = new Date(item.date).getTime(); // Expenses, Tasks

      // Fallback for corrupted date items
      if (isNaN(itemTime)) return true; 
      return itemTime >= startTime && itemTime <= endTime;
    });

    if (filteredData.length === 0) {
      presentToast({ message: 'No records found for the selected range.', duration: 2000, color: 'warning' });
      return;
    }

    // Call Export Service - This natively prompts for Download/Save Path on supported browsers
    const filename = `${exportModule}_Report_${new Date().toISOString().split('T')[0]}`;
    try {
      if (exportFormat === 'CSV') ExportService.exportToCSV(filteredData, filename);
      else if (exportFormat === 'Excel') ExportService.exportToExcel(filteredData, filename);
      else if (exportFormat === 'PDF') ExportService.exportToPDF(filteredData, filename, `${exportModule} Report`);
      
      presentToast({ message: 'Export successful!', duration: 2000, color: 'success' });
      store.addAuditLog(`Exported ${filteredData.length} ${exportModule} records as ${exportFormat}`);
    } catch (e) {
      presentToast({ message: 'Failed to export file.', duration: 2000, color: 'danger' });
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
              {['Expenses', 'Deposits', 'Tasks', 'Tickets', 'AuditLogs'].map(mod => <IonSelectOption key={mod} value={mod}>{mod}</IonSelectOption>)}
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