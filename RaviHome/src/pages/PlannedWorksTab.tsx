import React, { useState, useMemo } from 'react';
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
  IonSearchbar,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { addOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, micOutline, trashOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import ExportMenu from '../components/ExportMenu';
import { Task, useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { listenForVoiceInput } from '../utils/voiceInput';

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
  const [presentToast] = useIonToast();
  const showNotification = useNotificationStore(state => state.showNotification);
  const triggerAnimation = useNotificationStore(state => state.triggerAnimation);

  const handleCompleteTask = (id: string, title: string) => {
    updateTaskStatus(id, 'COMPLETED');
    triggerAnimation('COMPLETED_TASK');
    showNotification('success', 'Task Completed!', `Goal accomplished: "${title}"`);
  };

  // Data Grid States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const processedData = useMemo(() => {
    let data = [...tasks];
    if (searchTerm) {
      data = data.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (sortConfig) {
      data.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [tasks, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => { setSearchTerm(e.detail.value!); setCurrentPage(1); }}
            placeholder="Search tasks..."
            className="mb-4 px-0"
          />

          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-100">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-blue-500 text-white border-b-2 border-blue-600">
                <tr>
                  <th className="p-3 font-semibold text-sm border border-blue-600">S.No</th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('title')}>
                    Task Title {sortConfig?.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('date')}>
                    Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">Status</th>
                  <th className="p-3 font-semibold text-sm text-center border border-blue-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">No planned tasks found.</td>
                  </tr>
                ) : (
                  paginatedData.map((task, index) => (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-3 font-medium text-gray-800 text-sm">{task.title}</td>
                      <td className="p-3 text-sm text-gray-600">{task.date}</td>
                      <td className="p-3 text-sm">
                        <IonCheckbox checked={task.status === 'COMPLETED'} onIonChange={() => handleCompleteTask(task.id, task.title)} />
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <IonButton fill="clear" size="small" onClick={() => viewTask(task)}><IonIcon icon={eyeOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" size="small" onClick={() => openEditForm(task)}><IonIcon icon={createOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" color="danger" size="small" onClick={() => deleteTask(task.id)}><IonIcon icon={trashOutline} slot="icon-only" /></IonButton>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 px-1">
              <span className="text-sm text-gray-600 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + (processedData.length > 0 ? 1 : 0)} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length}
              </span>
              <div className="flex gap-2">
                <IonButton disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} size="small" fill="outline" className="text-sm">Prev</IonButton>
                <IonButton disabled={currentPage === totalPages} onClick={() => setCurrentPage(c => c + 1)} size="small" fill="outline" className="text-sm">Next</IonButton>
              </div>
            </div>
          )}
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

        <IonModal isOpen={!!viewingTask} onDidDismiss={() => setViewingTask(null)} breakpoints={[0, 0.5, 1]} initialBreakpoint={0.5}>
          <IonContent className="ion-padding bg-gray-50">
            {viewingTask && (
              <div className="p-2">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 pr-4">{viewingTask.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${viewingTask.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {viewingTask.status}
                  </span>
                </div>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Target Date</p>
                    <p className="font-semibold text-gray-900 text-lg">{new Date(viewingTask.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {viewingTask.status === 'PLANNED' && (
                  <IonButton expand="block" className="mt-6" color="success" onClick={() => { handleCompleteTask(viewingTask.id, viewingTask.title); setViewingTask(null); }}>
                     Mark as Completed
                  </IonButton>
                )}
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default PlannedWorksTab;
