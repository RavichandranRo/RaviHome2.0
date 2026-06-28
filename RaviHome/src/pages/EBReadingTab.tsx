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
  IonToolbar
} from '@ionic/react';
import { add, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, trashOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import PremiumDataGrid, { ColumnDef } from '../components/PremiumDataGrid';

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
  const { register, handleSubmit, reset, setValue } = useForm<EBForm>();
  const entries = useAppStore((state) => state.ebReadings);
  const addEBReading = useAppStore((state) => state.addEBReading);
  const updateEBReading = useAppStore((state) => state.updateEBReading);
  const deleteEBReading = useAppStore((state) => state.deleteEBReading);
  const addExpense = useAppStore((state) => state.addExpense);
  const showNotification = useNotificationStore(state => state.showNotification);
  const triggerAnimation = useNotificationStore(state => state.triggerAnimation);

  const [editingEntry, setEditingEntry] = useState<EBEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<EBEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const calculateTNBill = (prev: any, curr: any) => {
    const prevNum = Number(prev) || 0;
    const currNum = Number(curr) || 0;
    const units = Math.round(currNum - prevNum);
    let cost = 0;
    
    if (units <= 0 || isNaN(units)) return { units: 0, cost: 0 };

    if (units <= 100) {
      cost = 0;
    } else if (units <= 500) {
      cost += Math.max(0, Math.min(units - 100, 100)) * 2.25;
      cost += Math.max(0, Math.min(units - 200, 300)) * 4.50;
    } else {
      cost += Math.max(0, Math.min(units - 100, 300)) * 4.50;
      cost += Math.max(0, Math.min(units - 400, 100)) * 6.00;
      cost += Math.max(0, Math.min(units - 500, 100)) * 8.00;
      cost += Math.max(0, Math.min(units - 600, 200)) * 9.00;
      cost += Math.max(0, Math.min(units - 800, 200)) * 10.00;
      cost += Math.max(0, units - 1000) * 11.00;
    }
    
    return { units, cost: parseFloat(cost.toFixed(2)) };
  };

  const openAddForm = () => {
    setEditingEntry(null);
    let previousReading = 0;
    if (entries.length > 0) {
      previousReading = Math.max(...entries.map(e => Number(e.currentReading) || 0));
    }
    reset({ previousReading, currentReading: undefined as any });
    setValue('previousReading', previousReading);
    setValue('currentReading', undefined as any);
    setIsFormOpen(true);
  };

  const openEditForm = (entry: EBEntry) => {
    setEditingEntry(entry);
    reset({ previousReading: entry.previousReading, currentReading: entry.currentReading });
    setValue('previousReading', entry.previousReading);
    setValue('currentReading', entry.currentReading);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  const onSubmit = (data: EBForm) => {
    const prev = Number(data.previousReading) || 0;
    const curr = Number(data.currentReading) || 0;
    const { units, cost } = calculateTNBill(prev, curr);
    if (editingEntry) {
      updateEBReading(editingEntry.id, {
        previousReading: prev,
        currentReading: curr,
        units,
        amount: cost,
      });
    } else {
      addEBReading({
        previousReading: prev,
        currentReading: curr,
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

  // Define columns definition
  const columns: ColumnDef<EBEntry>[] = [
    {
      key: 'sno',
      label: 'S.No',
      render: (_, idx) => <span className="font-bold text-slate-400">{idx + 1}</span>,
      sortable: false
    },
    {
      key: 'date',
      label: 'Reading Date',
      sortable: true
    },
    {
      key: 'previousReading',
      label: 'Prev Reading',
      sortable: true
    },
    {
      key: 'currentReading',
      label: 'Current Reading',
      sortable: true
    },
    {
      key: 'units',
      label: 'Units Consumed',
      sortable: true,
      render: (item) => <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{item.units}</span>
    },
    {
      key: 'amount',
      label: 'Amount (Rs)',
      sortable: true,
      render: (item) => <span className="font-extrabold text-red-500">Rs. {item.amount.toFixed(2)}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex gap-1">
          <IonButton fill="clear" size="small" onClick={() => viewEntry(item)}>
            <IonIcon icon={eyeOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" size="small" onClick={() => openEditForm(item)}>
            <IonIcon icon={createOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" color="danger" size="small" onClick={() => deleteEBReading(item.id)}>
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
          <IonTitle><span className="app-page-title">EB Readings</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <PremiumDataGrid
            data={entries as EBEntry[]}
            columns={columns}
            searchPlaceholder="Search readings..."
            searchFields={['date', 'previousReading', 'currentReading', 'units', 'amount']}
            exportFilename="EB_Readings_Report"
            exportTitle="EB Electricity Readings Report"
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

        {/* Form Drawer */}
        <IonModal isOpen={isFormOpen} onDidDismiss={closeForm} className="entry-form-modal">
          <IonHeader className="ion-no-border border-b border-slate-200">
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white select-none">
              <button 
                onClick={closeForm}
                className="w-8 h-8 rounded-full border border-blue-200 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer outline-none bg-white shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
              <span className="text-[15px] font-bold text-slate-800 tracking-wide">{editingEntry ? 'Edit EB Reading' : 'Add EB Reading'}</span>
            </div>
          </IonHeader>
          <IonContent className="ion-padding ticket-modal-content bg-slate-50">
            <form onSubmit={handleSubmit(onSubmit)} className="modal-form-panel p-5 bg-white space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600">Previous Reading *</label>
                <input 
                  type="number" 
                  step="0.01"
                  readOnly={entries.length > 0 && !editingEntry}
                  {...register('previousReading', { required: true, valueAsNumber: true })} 
                  className={`w-full px-3 py-1.5 border rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 ${
                    entries.length > 0 && !editingEntry ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-300'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600">Current Reading *</label>
                <input 
                  type="number" 
                  step="0.01"
                  {...register('currentReading', { required: true, valueAsNumber: true })} 
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                />
              </div>

              <div className="form-actions mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 bg-white">
                <button 
                  type="button" 
                  onClick={closeForm} 
                  className="px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border-0 outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-white text-xs font-bold rounded-lg transition-colors shadow-sm border-0 outline-none flex items-center gap-1"
                  style={{ backgroundColor: 'var(--theme-primary)' }}
                >
                  <IonIcon icon={checkmarkCircleOutline} className="text-sm" />
                  Submit
                </button>
              </div>
            </form>
          </IonContent>
        </IonModal>

        {/* Details View */}
        <IonModal isOpen={!!viewingEntry} onDidDismiss={() => setViewingEntry(null)} breakpoints={[0, 0.6, 1]} initialBreakpoint={0.6}>
          <IonContent className="ion-padding bg-gray-50">
            {viewingEntry && (
              <div className="p-2">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Electricity Bill</h2>
                  <p className="text-gray-500">Recorded on {viewingEntry.date}</p>
                </div>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 text-xs">
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
