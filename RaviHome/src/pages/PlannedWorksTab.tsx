import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonFab,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCheckbox
} from '@ionic/react';
import { add, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, micOutline, trashOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import { Task, useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { listenForVoiceInput } from '../utils/voiceInput';
import PremiumDataGrid, { ColumnDef } from '../components/PremiumDataGrid';

interface PlannedForm {
  title: string;
  date: string;
}

const PlannedWorksTab: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isListening, setIsListening] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm<PlannedForm>();
  
  const allTasks = useAppStore((state) => state.tasks);
  const tasks = allTasks.filter((task) => task.status === 'PLANNED');
  const addTask = useAppStore((state) => state.addTask);
  const updateTask = useAppStore((state) => state.updateTask);
  const deleteTask = useAppStore((state) => state.deleteTask);
  const updateTaskStatus = useAppStore((state) => state.updateTaskStatus);
  const showNotification = useNotificationStore(state => state.showNotification);
  const triggerAnimation = useNotificationStore(state => state.triggerAnimation);

  const handleCompleteTask = (id: string, title: string) => {
    updateTaskStatus(id, 'COMPLETED');
    triggerAnimation('COMPLETED_TASK');
    showNotification('success', 'Task Completed!', `Goal accomplished: "${title}"`);
    if (viewingTask?.id === id) {
      setViewingTask(null);
    }
  };

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
      showNotification('success', 'Task Updated', 'Planned task details updated.');
    } else {
      addTask(data);
      triggerAnimation('PLANNED_TASK');
      showNotification('success', 'Task Planned', `Successfully planned: "${data.title}"`);
    }
    closeForm();
  };

  const viewTask = (task: Task) => {
    setViewingTask(task);
  };

  // Define table column definitions
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
      sortable: true
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true
    },
    {
      key: 'status',
      label: 'Done',
      sortable: false,
      render: (item) => (
        <IonCheckbox
          checked={item.status === 'COMPLETED'}
          onIonChange={() => handleCompleteTask(item.id, item.title)}
          className="rounded-lg"
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex gap-1">
          <IonButton fill="clear" size="small" onClick={() => viewTask(item)}>
            <IonIcon icon={eyeOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" size="small" onClick={() => openEditForm(item)}>
            <IonIcon icon={createOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" color="danger" size="small" onClick={() => deleteTask(item.id)}>
            <IonIcon icon={trashOutline} slot="icon-only" />
          </IonButton>
        </div>
      )
    }
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Planned Works</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <PremiumDataGrid
            data={tasks}
            columns={columns}
            searchPlaceholder="Search planned tasks..."
            searchFields={['title', 'date']}
            exportFilename="Planned_Tasks_Report"
            exportTitle="Planned Tasks Report"
          />
        </div>

        {/* Styled Circle FAB Add Button */}
        <IonFab slot="fixed" vertical="bottom" horizontal="end" className="add-ticket-fab">
          <button
            onClick={openAddForm}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all border-0 outline-none"
            style={{ backgroundColor: 'var(--theme-primary)' }}
            title="Add New"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </IonFab>

        {/* Form sliding drawer */}
        <IonModal isOpen={isFormOpen} onDidDismiss={closeForm} className="entry-form-modal">
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>{editingTask ? 'Edit Planned Work' : 'Add Planned Work'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={closeForm}><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding ticket-modal-content bg-slate-50">
            <form onSubmit={handleSubmit(onSubmit)} className="entry-form modal-form-panel p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
              <div className="space-y-4">
                <IonInput fill="outline" label="Task Title" labelPlacement="floating" {...register('title', { required: true })}>
                  <IonButton slot="end" fill="clear" type="button" color={isListening ? 'danger' : 'primary'} onClick={() => listenForVoiceInput((text) => setValue('title', text), setIsListening)}>
                    <IonIcon icon={micOutline} className={isListening ? 'animate-pulse' : ''} />
                  </IonButton>
                </IonInput>
                <IonInput fill="outline" label="Date" labelPlacement="floating" type="date" {...register('date', { required: true })} />
              </div>
              <div className="form-actions mt-6">
                <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <IonButton type="submit"><IonIcon icon={checkmarkCircleOutline} slot="start" />Submit</IonButton>
              </div>
            </form>
          </IonContent>
        </IonModal>

        {/* View Details modal */}
        <IonModal isOpen={!!viewingTask} onDidDismiss={() => setViewingTask(null)} breakpoints={[0, 0.5, 1]} initialBreakpoint={0.5}>
          <IonContent className="ion-padding bg-gray-50">
            {viewingTask && (
              <div className="p-2">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 pr-4">{viewingTask.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 bg-yellow-100 text-yellow-700`}>
                    {viewingTask.status}
                  </span>
                </div>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Target Date</p>
                    <p className="font-semibold text-gray-900 text-lg">{new Date(viewingTask.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                <IonButton expand="block" className="mt-6 font-bold" color="success" onClick={() => handleCompleteTask(viewingTask.id, viewingTask.title)}>
                   Mark as Completed
                </IonButton>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default PlannedWorksTab;
