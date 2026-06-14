import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/react';
import { timeOutline, documentTextOutline } from 'ionicons/icons';
import { AuditLog, useAppStore } from '../store/useAppStore';
import PremiumDataGrid, { ColumnDef } from '../components/PremiumDataGrid';

const AuditLogsTab: React.FC = () => {
  const auditLogs = useAppStore((state) => state.auditLogs);

  const columns: ColumnDef<AuditLog>[] = [
    {
      key: 'sno',
      label: 'S.No',
      render: (_, idx) => <span className="font-bold text-slate-400">{idx + 1}</span>,
      sortable: false
    },
    {
      key: 'action',
      label: 'Action Description',
      render: (item) => (
        <div className="flex items-center gap-2">
          <IonIcon icon={documentTextOutline} className="text-slate-400 text-base" />
          <span className="font-semibold text-slate-700 whitespace-normal leading-relaxed">{item.action}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'date',
      label: 'Timestamp',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <IonIcon icon={timeOutline} className="text-xs" />
          <span>{item.date}</span>
        </div>
      ),
      sortable: true
    }
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">System Audit Logs</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <PremiumDataGrid
            data={auditLogs}
            columns={columns}
            searchPlaceholder="Search audit log entries..."
            searchFields={['action', 'date']}
            exportFilename="Audit_Logs_Report"
            exportTitle="System Audit Logs Report"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AuditLogsTab;