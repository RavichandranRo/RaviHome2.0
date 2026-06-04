import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCheckbox,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonModal,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { addOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, micOutline, trashOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import ExportMenu from '../components/ExportMenu';
import { Task, useAppStore } from '../store/useAppStore';
import { listenForVoiceInput } from '../utils/voiceInput';

interface PlannedForm {
  title: string;
  date: string;
}

const PlannedWorksTab: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<PlannedForm>();
  const allTasks = useAppStore((state) => state.tasks);
  const tasks = allTasks.filter((task) => task.status === 'PLANNED');
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const openAddForm = () => {
    setEditingTask(null);
    reset({ title: '', date: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    reset({ title: task.title, date: task.date });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    reset({ title: '', date: '' });
  };

  const onSubmit = (data: PlannedForm) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
      presentToast({ message: 'Task updated successfully.', duration: 2000, color: 'success', position: 'top' });
    } else {
      addTask(data);
      presentToast({ message: 'Task planned successfully.', duration: 2000, color: 'success', position: 'top' });
    }
    closeForm();
  };

  const viewTask = (task: Task) => {
    presentAlert({ header: task.title, message: `Date: ${task.date}\nStatus: ${task.status}`, buttons: ['OK'] });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Planned Works</span></IonTitle>
          <div slot="end" className="export-actions">
            <ExportMenu data={tasks} filename="Planned_Tasks" title="Planned Tasks Report" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <div className="ticket-grid">
            {tasks.map((task) => (
              <IonCard key={task.id} className="grid-card border-l-4 border-l-yellow-500">
                <IonCardContent>
                  <div className="ticket-card-header">
                    <div>
                      <p className="font-bold text-gray-800">{task.title}</p>
                      <p className="text-sm text-gray-500">{task.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IonLabel className="text-sm font-semibold">Done</IonLabel>
                      <IonCheckbox onIonChange={() => updateTaskStatus(task.id, 'COMPLETED')} />
                    </div>
                  </div>
                  <div className="ticket-actions">
                    <IonButton className="icon-button" fill="clear" onClick={() => viewTask(task)}><IonIcon icon={eyeOutline} slot="icon-only" /></IonButton>
                    <IonButton className="icon-button" fill="clear" onClick={() => openEditForm(task)}><IonIcon icon={createOutline} slot="icon-only" /></IonButton>
                    <IonButton className="icon-button" fill="clear" color="danger" onClick={() => deleteTask(task.id)}><IonIcon icon={trashOutline} slot="icon-only" /></IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
          {tasks.length === 0 && <p className="empty-state">No planned tasks yet.</p>}
        </div>

        <IonFab slot="fixed" vertical="bottom" horizontal="end" className="add-ticket-fab">
          <IonFabButton onClick={openAddForm}><IonIcon icon={addOutline} /></IonFabButton>
        </IonFab>

        <IonModal isOpen={isFormOpen} onDidDismiss={closeForm} className="entry-form-modal">
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>{editingTask ? 'Edit Planned Work' : 'Add Planned Work'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={closeForm}><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding ticket-modal-content">
            <form onSubmit={handleSubmit(onSubmit)} className="entry-form modal-form-panel">
              <IonInput fill="outline" label="Task Title" labelPlacement="floating" {...register('title', { required: true })}>
                <IonButton slot="end" fill="clear" type="button" color={isListening ? 'danger' : 'primary'} onClick={() => listenForVoiceInput((text) => setValue('title', text), setIsListening)}>
                  <IonIcon icon={micOutline} className={isListening ? 'animate-pulse' : ''} />
                </IonButton>
              </IonInput>
              <IonInput fill="outline" label="Date" labelPlacement="floating" type="date" {...register('date', { required: true })} />
              <div className="form-actions">
                <IonButton fill="outline" type="button" onClick={closeForm}>Cancel</IonButton>
                <IonButton type="submit"><IonIcon icon={checkmarkCircleOutline} slot="start" />Submit</IonButton>
              </div>
            </form>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default PlannedWorksTab;
