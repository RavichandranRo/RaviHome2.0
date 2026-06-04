import React, { useState } from 'react';
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
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { addOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, trashOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import ExportMenu from '../components/ExportMenu';
import { useAppStore } from '../store/useAppStore';

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
  const [entries, setEntries] = useState<EBEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<EBEntry | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const addExpense = useAppStore((state) => state.addExpense);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const calculateTNBill = (prev: number, curr: number) => {
    const units = curr - prev;
    let cost = 0;
    if (units <= 100) cost = 0;
    else if (units <= 400) cost = Math.max(0, Math.min(units - 100, 100)) * 2.25 + Math.max(0, units - 200) * 4.5;
    else cost = Math.max(0, Math.min(units - 100, 300)) * 4.5 + Math.max(0, units - 400) * 6;
    return { units, cost };
  };

  const openAddForm = () => {
    setEditingEntry(null);
    reset({ previousReading: 0, currentReading: 0 });
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

    setEntries((current) => editingEntry ? current.map((item) => item.id === editingEntry.id ? entry : item) : [entry, ...current]);
    if (!editingEntry && cost > 0) {
      addExpense({ category: 'Electricity', amount: cost, date: new Date().toLocaleDateString(), description: `EB Bill for ${units} units`, type: 'DEBIT' });
    }
    presentToast({ message: 'EB bill saved.', duration: 2000, color: 'success', position: 'top' });
    closeForm();
  };

  const viewEntry = (entry: EBEntry) => {
    presentAlert({
      header: 'EB Reading',
      message: `Date: ${entry.date}\nPrevious: ${entry.previousReading}\nCurrent: ${entry.currentReading}\nUnits: ${entry.units}\nAmount: Rs. ${entry.amount.toFixed(2)}`,
      buttons: ['OK'],
    });
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
          <div className="ticket-grid">
            {entries.map((entry) => (
              <IonCard key={entry.id} className="grid-card border-l-4 border-l-blue-500">
                <IonCardContent>
                  <div className="ticket-card-header">
                    <div>
                      <p className="text-sm text-gray-500">{entry.date}</p>
                      <p className="font-bold text-gray-800">Units: {entry.units}</p>
                    </div>
                    <p className="text-lg font-bold text-red-600">Rs. {entry.amount.toFixed(2)}</p>
                  </div>
                  <div className="ticket-actions">
                    <IonButton className="icon-button" fill="clear" onClick={() => viewEntry(entry)}><IonIcon icon={eyeOutline} slot="icon-only" /></IonButton>
                    <IonButton className="icon-button" fill="clear" onClick={() => openEditForm(entry)}><IonIcon icon={createOutline} slot="icon-only" /></IonButton>
                    <IonButton className="icon-button" fill="clear" color="danger" onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}><IonIcon icon={trashOutline} slot="icon-only" /></IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
          {entries.length === 0 && <p className="empty-state">No EB readings yet.</p>}
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
              <IonInput fill="outline" label="Previous Reading" labelPlacement="floating" type="number" step="0.01" {...register('previousReading', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Current Reading" labelPlacement="floating" type="number" step="0.01" {...register('currentReading', { required: true, valueAsNumber: true })} />
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

export default EBReadingTab;
