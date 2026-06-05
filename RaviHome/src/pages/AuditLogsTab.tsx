import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonIcon,
} from '@ionic/react';
import { timeOutline, documentTextOutline } from 'ionicons/icons';
import { useAppStore } from '../store/useAppStore';

const AuditLogsTab: React.FC = () => {
  const auditLogs = useAppStore((state) => state.auditLogs);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.date.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Audit Logs</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-gray-50">
        <div className="travel-shell">
          <IonSearchbar value={searchTerm} onIonInput={(e) => setSearchTerm(e.detail.value!)} placeholder="Search logs..." className="mb-2 px-4 mt-2" />
          <IonList inset className="mx-4 mb-8">
            {filteredLogs.map((log) => (
              <IonItem key={log.id}><IonIcon icon={documentTextOutline} slot="start" className="text-gray-400" /><IonLabel className="ion-text-wrap"><h3 className="font-semibold text-gray-800">{log.action}</h3><p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><IonIcon icon={timeOutline} /> {log.date}</p></IonLabel></IonItem>
            ))}
            {filteredLogs.length === 0 && <IonItem><IonLabel className="text-center text-gray-500">No logs found.</IonLabel></IonItem>}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};
export default AuditLogsTab;