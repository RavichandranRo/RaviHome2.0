import React, { useState, useMemo } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonSearchbar,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { addOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, trashOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import ExportMenu from '../components/ExportMenu';
import { useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';

interface EBForm {
  previousReading: number;
  currentReading: number;
}

interface EBEntry extends EBForm {
  id: string;
  date: string;
  units: number;
  amount: number;
}

const EBReadingTab: React.FC = () => {
  const { register, handleSubmit, reset } = useForm<EBForm>();
  const entries = useAppStore(
    (state) => state.ebReadings
  );

  const addEBReading = useAppStore(
    (state) => state.addEBReading
  );

  const updateEBReading = useAppStore(
    (state) => state.updateEBReading
  );

  const deleteEBReading = useAppStore(
    (state) => state.deleteEBReading
  );
  const [editingEntry, setEditingEntry] = useState<EBEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<EBEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const addExpense = useAppStore((state) => state.addExpense);
  const [presentToast] = useIonToast();
  const showNotification = useNotificationStore(state => state.showNotification);
  const triggerAnimation = useNotificationStore(state => state.triggerAnimation);

  // Data Grid States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const processedData = useMemo(() => {
    let data = [...entries];
    if (searchTerm) {
      data = data.filter(d => d.date.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (sortConfig) {
      data.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [entries, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const calculateTNBill = (prev: number, curr: number) => {
    const units = curr - prev;
    let cost = 0;
    
    if (units <= 0) return { units: 0, cost: 0 };

    if (units <= 100) {
      cost = 0;
    } else if (units <= 500) {
      cost += Math.max(0, Math.min(units - 100, 100)) * 2.25;
      cost += Math.max(0, Math.min(units - 200, 200)) * 4.50;
      cost += Math.max(0, units - 400) * 6.00;
    } else {
      cost += Math.max(0, Math.min(units - 100, 300)) * 4.50;
      cost += Math.max(0, Math.min(units - 400, 100)) * 6.00;
      cost += Math.max(0, Math.min(units - 500, 100)) * 8.00;
      cost += Math.max(0, Math.min(units - 600, 200)) * 9.00;
      cost += Math.max(0, Math.min(units - 800, 200)) * 10.00;
      cost += Math.max(0, units - 1000) * 11.00;
    }
    
    return { units, cost };
  };

  const openAddForm = () => {
    setEditingEntry(null);
    let previousReading = 0;
    if (entries.length > 0) {
      const sortedEntries = [...entries].sort((a, b) => Number(b.id) - Number(a.id));
      previousReading = sortedEntries[0].currentReading;
    }
    reset({ previousReading, currentReading: undefined as any });
    setIsFormOpen(true);
  };

  const openEditForm = (entry: EBEntry) => {
    setEditingEntry(entry);
    reset({ previousReading: entry.previousReading, currentReading: entry.currentReading });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const onSubmit = (data: EBForm) => {
    const { units, cost } = calculateTNBill(data.previousReading, data.currentReading);
    const entry: EBEntry = {
      id: editingEntry?.id || Date.now().toString(),
      date: editingEntry?.date || new Date().toLocaleDateString(),
      previousReading: data.previousReading,
      currentReading: data.currentReading,
      units,
      amount: cost,
    };

    if (editingEntry) {
      updateEBReading(editingEntry.id, {
        previousReading: data.previousReading,
        currentReading: data.currentReading,
        units,
        amount: cost,
      });
    } else {
      addEBReading({
        previousReading: data.previousReading,
        currentReading: data.currentReading,
        units,
        amount: cost,
      });
    }
    if (!editingEntry && cost > 0) {
      addExpense({ category: 'Electricity', amount: cost, date: new Date().toLocaleDateString(), description: `EB Bill for ${units} units`, type: 'DEBIT' });
    }
    triggerAnimation('EB');
    showNotification('success', 'EB Reading Logged', `Electricity bill for ${units} units (Rs. ${cost.toFixed(2)}) has been calculated and saved.`);
    closeForm();
  };

  const viewEntry = (entry: EBEntry) => {
    setViewingEntry(entry);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">EB Reading</span></IonTitle>
          <div slot="end" className="export-actions">
            <ExportMenu data={entries} filename="EB_Readings" title="EB Readings Report" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => { setSearchTerm(e.detail.value!); setCurrentPage(1); }}
            placeholder="Search dates..."
            className="mb-4 px-0"
          />

          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-100">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-blue-500 text-white border-b-2 border-blue-600">
                <tr>
                  <th className="p-3 font-semibold text-sm border border-blue-600">S.No</th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('date')}>
                    Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('units')}>
                    Units {sortConfig?.key === 'units' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('amount')}>
                    Amount {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm text-center border border-blue-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">No EB readings found.</td>
                  </tr>
                ) : (
                  paginatedData.map((entry, index) => (
                    <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-3 font-medium text-gray-800 text-sm">{entry.date}</td>
                      <td className="p-3 text-sm text-gray-600">{entry.units}</td>
                      <td className="p-3 font-semibold text-red-600 text-sm">Rs. {entry.amount.toFixed(2)}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <IonButton fill="clear" size="small" onClick={() => viewEntry(entry)}><IonIcon icon={eyeOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" size="small" onClick={() => openEditForm(entry)}><IonIcon icon={createOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" color="danger" size="small" onClick={() => deleteEBReading(entry.id)}><IonIcon icon={trashOutline} slot="icon-only" /></IonButton>
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
              <IonTitle>{editingEntry ? 'Edit EB Reading' : 'Add EB Reading'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={closeForm}><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding ticket-modal-content">
            <form onSubmit={handleSubmit(onSubmit)} className="entry-form modal-form-panel">
              <IonInput fill="outline" label="Previous Reading" labelPlacement="floating" type="number" step="0.01" readonly={entries.length > 0 && !editingEntry} {...register('previousReading', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Current Reading" labelPlacement="floating" type="number" step="0.01" {...register('currentReading', { required: true, valueAsNumber: true })} />
              <div className="form-actions">
                <IonButton fill="outline" type="button" onClick={closeForm}>Cancel</IonButton>
                <IonButton type="submit"><IonIcon icon={checkmarkCircleOutline} slot="start" />Submit</IonButton>
              </div>
            </form>
          </IonContent>
        </IonModal>

        <IonModal isOpen={!!viewingEntry} onDidDismiss={() => setViewingEntry(null)} breakpoints={[0, 0.6, 1]} initialBreakpoint={0.6}>
          <IonContent className="ion-padding bg-gray-50">
            {viewingEntry && (
              <div className="p-2">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Electricity Bill</h2>
                  <p className="text-gray-500">Recorded on {viewingEntry.date}</p>
                </div>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Previous Reading</span><span className="font-bold">{viewingEntry.previousReading}</span></div>
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Current Reading</span><span className="font-bold">{viewingEntry.currentReading}</span></div>
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Units Consumed</span><span className="font-bold text-blue-600">{viewingEntry.units}</span></div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Calculated Cost</span>
                    <span className="font-bold text-red-600 text-lg">Rs. {viewingEntry.amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default EBReadingTab;
