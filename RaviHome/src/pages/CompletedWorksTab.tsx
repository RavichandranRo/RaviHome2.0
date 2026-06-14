import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import { Task, useAppStore } from '../store/useAppStore';
import PremiumDataGrid, { ColumnDef } from '../components/PremiumDataGrid';

const CompletedWorksTab: React.FC = () => {
  const allTasks = useAppStore(state => state.tasks);
  const tasks = allTasks.filter(t => t.status === 'COMPLETED');

  const columns: ColumnDef<Task>[] = [
    {
      key: 'sno',
      label: 'S.No',
      render: (_, idx) => <span className="font-bold text-slate-400">{idx + 1}</span>,
      sortable: false
    },
    {
      key: 'title',
      label: 'Task Title',
      render: (item) => <span className="line-through text-slate-400 font-medium">{item.title}</span>,
      sortable: true
    },
    {
      key: 'date',
      label: 'Planned Date',
      sortable: true
    },
    {
      key: 'status',
      label: 'Status',
      sortable: false,
      render: (item) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          {item.status}
        </span>
      )
    }
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Completed Works</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <PremiumDataGrid
            data={tasks}
            columns={columns}
            searchPlaceholder="Search completed tasks..."
            searchFields={['title', 'date']}
            exportFilename="Completed_Tasks_Report"
            exportTitle="Completed Tasks Report"
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CompletedWorksTab;
