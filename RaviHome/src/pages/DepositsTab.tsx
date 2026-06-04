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
  IonLabel,
  IonModal,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  IonItem,
  IonCheckbox,
  IonSearchbar,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { addOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, trashOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import ExportMenu from '../components/ExportMenu';
import { Deposit, useAppStore } from '../store/useAppStore';

const INDIAN_BANK_RATES = [
  { bank: 'State Bank of India', fd: 6.85, rd: 6.75 },
  { bank: 'HDFC Bank', fd: 6.45, rd: 6.40 },
  { bank: 'ICICI Bank', fd: 7.10, rd: 6.75 },
  { bank: 'Axis Bank', fd: 7.10, rd: 7.00 },
  { bank: 'Kotak Mahindra Bank', fd: 7.25, rd: 7.00 },
  { bank: 'Punjab National Bank', fd: 7.00, rd: 6.80 },
  { bank: 'Bank of Baroda', fd: 7.15, rd: 6.85 },
  { bank: 'Canara Bank', fd: 7.25, rd: 6.85 },
  { bank: 'Union Bank of India', fd: 7.30, rd: 6.75 },
  { bank: 'Indian Bank', fd: 7.05, rd: 6.70 },
  { bank: 'Bank of India', fd: 7.30, rd: 6.75 },
  { bank: 'Central Bank of India', fd: 7.45, rd: 6.75 },
  { bank: 'Indian Overseas Bank', fd: 7.30, rd: 6.80 },
  { bank: 'UCO Bank', fd: 7.30, rd: 6.75 },
  { bank: 'Punjab & Sind Bank', fd: 7.45, rd: 7.00 },
  { bank: 'IDBI Bank', fd: 7.00, rd: 6.75 },
  { bank: 'Federal Bank', fd: 7.40, rd: 7.00 },
  { bank: 'South Indian Bank', fd: 7.40, rd: 7.00 },
  { bank: 'Yes Bank', fd: 7.75, rd: 7.25 },
  { bank: 'IndusInd Bank', fd: 7.75, rd: 7.25 },
];

type DepositForm = Omit<Deposit, 'id' | 'type'> & {
  autoRenewal?: boolean;
  startDate?: string;
  maturityDate?: string;
};

const emptyDeposit: DepositForm = {
  bank: '',
  amount: 0,
  durationDays: 365,
  roi: 0,
  autoRenewal: false,
  startDate: '',
  maturityDate: '',
};

const DepositsTab: React.FC = () => {
  const [type, setType] = useState<'FD' | 'RD'>('FD');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
  const { register, handleSubmit, reset, watch, setValue } = useForm<DepositForm>({ defaultValues: emptyDeposit });
  const deposits = useAppStore((state) => state.deposits);
  const addDeposit = useAppStore((state) => state.addDeposit);
  const updateDeposit = useAppStore((state) => state.updateDeposit);
  const deleteDeposit = useAppStore((state) => state.deleteDeposit);
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  // Data Grid States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredDeposits = deposits.filter((deposit) => deposit.type === type);

  const processedData = useMemo(() => {
    let data = [...filteredDeposits];
    if (searchTerm) {
      data = data.filter(d => d.bank.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (sortConfig) {
      data.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [filteredDeposits, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const amount = watch('amount', 0);
  const duration = watch('durationDays', 0);
  const roi = watch('roi', 0);

  const calculateMaturity = (amt: number, dur: number, rate: number) => {
    if (!amt || !dur || !rate) return 0;
    const months = dur / (365 / 12); // convert days to months for RD calculation
    return type === 'FD' ? amt * Math.pow(1 + rate / 100, dur / 365) : amt * months + (amt * months * (months + 1) / 2) * (rate / 100) / 12;
  };

  const openAddForm = () => {
    setEditingDeposit(null);
    reset(emptyDeposit);
    setIsFormOpen(true);
  };

  const openEditForm = (deposit: Deposit) => {
    setEditingDeposit(deposit);
    setType(deposit.type);
    const days = (deposit as any).durationDays || ((deposit as any).durationMonths ? (deposit as any).durationMonths * 30 : 0);
    reset({ 
      bank: deposit.bank, 
      amount: deposit.amount, 
      durationDays: days, 
      roi: deposit.roi,
      autoRenewal: (deposit as any).autoRenewal || false,
      startDate: (deposit as any).startDate || '',
      maturityDate: (deposit as any).maturityDate || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingDeposit(null);
    reset(emptyDeposit);
  };

  const setBankRate = (bankName: string) => {
    const found = INDIAN_BANK_RATES.find((item) => item.bank === bankName);
    if (found) setValue('roi', type === 'FD' ? found.fd : found.rd);
  };

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const onSubmit = (data: DepositForm) => {
    if (editingDeposit) {
      updateDeposit(editingDeposit.id, { ...data, type });
      presentToast({ message: 'Deposit updated successfully.', duration: 2000, color: 'success', position: 'top' });
    } else {
      addDeposit({ ...data, type });
      presentToast({ message: `${type} deposit saved successfully.`, duration: 2000, color: 'success', position: 'top' });
    }
    closeForm();
  };

  const viewDeposit = (deposit: Deposit) => {
    const days = (deposit as any).durationDays || ((deposit as any).durationMonths ? (deposit as any).durationMonths * 30 : 0);
    presentAlert({
      header: deposit.bank,
      message: `${deposit.type}\nAmount: Rs. ${deposit.amount}\nDuration: ${days} days\nInterest: ${deposit.roi}%\nStart Date: ${(deposit as any).startDate || 'N/A'}\nMaturity: ${(deposit as any).maturityDate || 'N/A'}\nAuto Renewal: ${(deposit as any).autoRenewal ? 'Yes' : 'No'}`,
      buttons: ['OK'],
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Deposits</span></IonTitle>
          <div slot="end" className="export-actions">
            <ExportMenu data={filteredDeposits} filename="Deposits" title="Deposits Report" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <IonSegment value={type} mode="ios" onIonChange={(event) => setType(event.detail.value as any)} className="mb-4 bg-gray-200 rounded-full p-1">
            <IonSegmentButton value="FD"><IonLabel>Fixed Deposit</IonLabel></IonSegmentButton>
            <IonSegmentButton value="RD"><IonLabel>Recurring Deposit</IonLabel></IonSegmentButton>
          </IonSegment>

          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => { setSearchTerm(e.detail.value!); setCurrentPage(1); }}
            placeholder="Search banks..."
            className="mb-4 px-0"
          />

          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-100">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-3 font-semibold text-gray-700 text-sm">S.No</th>
                  <th className="p-3 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('bank')}>
                    Bank {sortConfig?.key === 'bank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-gray-700 text-sm cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('amount')}>
                    Amount {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-gray-700 text-sm">Start Date</th>
                  <th className="p-3 font-semibold text-gray-700 text-sm">Maturity Date</th>
                  <th className="p-3 font-semibold text-gray-700 text-sm">Duration</th>
                  <th className="p-3 font-semibold text-gray-700 text-sm">ROI</th>
                  <th className="p-3 font-semibold text-gray-700 text-sm">Auto Renewal</th>
                  <th className="p-3 font-semibold text-gray-700 text-sm text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-500">No deposits found.</td>
                  </tr>
                ) : (
                  paginatedData.map((deposit, index) => (
                    <tr key={deposit.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-3 font-medium text-gray-800 text-sm">{deposit.bank}</td>
                      <td className="p-3 font-semibold text-gray-700 text-sm">Rs. {deposit.amount}</td>
                      <td className="p-3 text-sm text-gray-600">{(deposit as any).startDate || '-'}</td>
                      <td className="p-3 text-sm text-gray-600">{(deposit as any).maturityDate || '-'}</td>
                      <td className="p-3 text-sm text-gray-600">{(deposit as any).durationDays || ((deposit as any).durationMonths ? (deposit as any).durationMonths * 30 : 0)} days</td>
                      <td className="p-3 text-sm text-gray-600">{deposit.roi}%</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${(deposit as any).autoRenewal ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {(deposit as any).autoRenewal ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <IonButton fill="clear" size="small" onClick={() => viewDeposit(deposit)}><IonIcon icon={eyeOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" size="small" onClick={() => openEditForm(deposit)}><IonIcon icon={createOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" color="danger" size="small" onClick={() => deleteDeposit(deposit.id)}><IonIcon icon={trashOutline} slot="icon-only" /></IonButton>
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
              <IonTitle>{editingDeposit ? 'Edit Deposit' : 'Add Deposit'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={closeForm}><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding ticket-modal-content">
            <form onSubmit={handleSubmit(onSubmit)} className="entry-form modal-form-panel">
              <IonSelect fill="outline" label="Bank" labelPlacement="floating" {...register('bank', { required: true })} onIonChange={(event) => setBankRate(event.detail.value)}>
                {INDIAN_BANK_RATES.map((item) => <IonSelectOption key={item.bank} value={item.bank}>{item.bank}</IonSelectOption>)}
              </IonSelect>
              <IonInput fill="outline" label={type === 'RD' ? 'Monthly Amount' : 'Principal Amount'} labelPlacement="floating" type="number" {...register('amount', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Duration (Days)" labelPlacement="floating" type="number" {...register('durationDays', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Rate of Interest (%)" labelPlacement="floating" type="number" step="0.01" {...register('roi', { required: true, valueAsNumber: true })} />
              
              <IonInput fill="outline" label="Start Date" labelPlacement="floating" type="date" {...register('startDate')} />
              <IonInput fill="outline" label="Maturity Date" labelPlacement="floating" type="date" {...register('maturityDate')} />
              <IonItem lines="none" className="bg-gray-50 rounded-lg mb-4">
                <IonCheckbox labelPlacement="end" {...register('autoRenewal')}>Auto Renewal</IonCheckbox>
              </IonItem>

              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-blue-600 font-bold">Estimated Maturity Amount</p>
                <p className="text-2xl font-bold text-blue-800">Rs. {calculateMaturity(amount, duration, roi).toFixed(2)}</p>
              </div>
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

export default DepositsTab;
