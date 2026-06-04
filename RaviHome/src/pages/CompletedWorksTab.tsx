import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent } from '@ionic/react';
import ExportMenu from '../components/ExportMenu';
import { useAppStore } from '../store/useAppStore';

const CompletedWorksTab: React.FC = () => {
  const allTasks = useAppStore(state => state.tasks);
  const tasks = allTasks.filter(t => t.status === 'COMPLETED');

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Completed Works</span></IonTitle>
          <div slot="end" className="export-actions">
            <ExportMenu data={tasks} filename="Completed_Tasks" title="Completed Tasks Report" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
       <div className="travel-shell">
        <div className="flex justify-between items-center mb-6 px-2 mt-4">
          <h3 className="text-xl font-bold text-gray-700">Completed Tasks</h3>
        </div>

        {tasks.length === 0 && (
           <p className="text-center text-gray-500 mt-10">No completed tasks yet.</p>
        )}

        <div className="ticket-grid">
        {tasks.map((task) => (
          <IonCard key={task.id} className="grid-card border-l-4 border-l-green-500">
            <IonCardContent className="flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800 line-through">{task.title}</p>
                <p className="text-sm text-gray-500">Planned Date: {task.date}</p>
              </div>
              <div>
                <span className="text-green-600 font-bold text-sm bg-green-100 px-2 py-1 rounded">COMPLETED</span>
              </div>
            </IonCardContent>
          </IonCard>
        ))}
        </div>
       </div>
      </IonContent>
    </IonPage>
  );
};

export default CompletedWorksTab;
