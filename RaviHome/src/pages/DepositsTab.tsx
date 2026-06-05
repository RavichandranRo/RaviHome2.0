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
  useIonToast,
} from '@ionic/react';
import { addOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, trashOutline, walletOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import ExportMenu from '../components/ExportMenu';
import { Deposit, useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';

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
  bank: 'Punjab National Bank',
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
  const [viewingDeposit, setViewingDeposit] = useState<Deposit | null>(null);
  const { register, handleSubmit, reset, watch, setValue } = useForm<DepositForm>({ defaultValues: emptyDeposit });
  const deposits = useAppStore((state) => state.deposits);
  const addDeposit = useAppStore((state) => state.addDeposit);
  const updateDeposit = useAppStore((state) => state.updateDeposit);
  const deleteDeposit = useAppStore((state) => state.deleteDeposit);
  const [presentToast] = useIonToast();
  const showNotification = useNotificationStore(state => state.showNotification);
  const triggerAnimation = useNotificationStore(state => state.triggerAnimation);

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

  const getMaturity = (amt: number, dur: number, rate: number, depType: 'FD' | 'RD') => {
    if (!amt || !dur || !rate) return 0;
    const months = dur / (365 / 12); // convert days to months for RD calculation
    return depType === 'FD' ? amt * Math.pow(1 + rate / 100, dur / 365) : amt * months + (amt * months * (months + 1) / 2) * (rate / 100) / 12;
  };
  const calculateMaturity = (amt: number, dur: number, rate: number) => getMaturity(amt, dur, rate, type);

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
    if (!data.startDate) data.startDate = new Date().toISOString().split('T')[0];
    if (!data.maturityDate) data.maturityDate = new Date(new Date(data.startDate).getTime() + data.durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (editingDeposit) {
      updateDeposit(editingDeposit.id, { ...data, type });
      triggerAnimation('DEPOSIT');
      showNotification('success', 'Deposit Updated', `${type} deposit at ${data.bank} updated successfully.`);
    } else {
      addDeposit({ ...data, type });
      triggerAnimation('DEPOSIT');
      showNotification('success', 'Deposit Opened', `${type} deposit of Rs. ${data.amount} opened at ${data.bank}.`);
    }
    closeForm();
  };

  const viewDeposit = (deposit: Deposit) => {
    setViewingDeposit(deposit);
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
              <thead className="bg-blue-500 text-white border-b-2 border-blue-600">
                <tr>
                  <th className="p-3 font-semibold text-sm border border-blue-600">S.No</th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('bank')}>
                    Bank {sortConfig?.key === 'bank' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('amount')}>
                    Amount {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">Start Date</th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">Maturity Date</th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">Duration</th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">ROI</th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">Auto Renewal</th>
                  <th className="p-3 font-semibold text-sm text-center border border-blue-600">Actions</th>
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
              <IonInput fill="outline" label={type === 'RD' ? 'Monthly Amount' : 'Principal Amount'} labelPlacement="floating" type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Duration (Days)" labelPlacement="floating" type="number" {...register('durationDays', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Rate of Interest (%)" labelPlacement="floating" type="number" step="0.01" {...register('roi', { required: true, valueAsNumber: true })} />
              
              <IonInput fill="outline" label="Start Date" labelPlacement="floating" type="date" {...register('startDate')} />
              <IonInput fill="outline" label="Maturity Date" labelPlacement="floating" type="date" {...register('maturityDate')} />
              <IonItem lines="none" className="bg-gray-50 rounded-lg mb-4">
                <IonCheckbox 
                  labelPlacement="end" 
                  checked={!!watch('autoRenewal')}
                  onIonChange={(e) => setValue('autoRenewal', e.detail.checked)}
                >
                  Auto Renewal
                </IonCheckbox>
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

        {/* View Deposit Bottom Sheet Modal */}
        <IonModal isOpen={!!viewingDeposit} onDidDismiss={() => setViewingDeposit(null)} breakpoints={[0, 0.75, 1]} initialBreakpoint={0.75}>
          <IonContent className="ion-padding bg-gray-50">
            {viewingDeposit && (
              <div className="p-2">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                      <IonIcon icon={walletOutline} className="text-2xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">{viewingDeposit.bank}</h2>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${viewingDeposit.type === 'FD' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                    {viewingDeposit.type}
                  </span>
                </div>
                
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4 mb-6">
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Principal Amount</span><span className="font-bold text-gray-800 text-lg">Rs. {viewingDeposit.amount.toFixed(2)}</span></div>
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Duration</span><span className="font-bold">{(viewingDeposit as any).durationDays || ((viewingDeposit as any).durationMonths ? (viewingDeposit as any).durationMonths * 30 : 0)} Days</span></div>
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Interest Rate (ROI)</span><span className="font-bold text-green-600">{viewingDeposit.roi}%</span></div>
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Start Date</span><span className="font-bold">{viewingDeposit.startDate || 'N/A'}</span></div>
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Maturity Date</span><span className="font-bold">{viewingDeposit.maturityDate || 'N/A'}</span></div>
                  <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Auto Renewal</span><span className="font-bold">{viewingDeposit.autoRenewal ? 'Yes' : 'No'}</span></div>
                  {viewingDeposit.lastRenewedDate && (
                     <div className="flex justify-between border-b pb-3"><span className="text-gray-500">Last Renewed</span><span className="font-bold">{viewingDeposit.lastRenewedDate}</span></div>
                  )}
                  <div className="flex justify-between pt-2">
                    <span className="text-gray-500 font-medium">Est. Maturity Amount</span>
                    <span className="font-bold text-blue-600 text-xl">Rs. {getMaturity(viewingDeposit.amount, (viewingDeposit as any).durationDays || ((viewingDeposit as any).durationMonths ? (viewingDeposit as any).durationMonths * 30 : 0), viewingDeposit.roi, viewingDeposit.type).toFixed(2)}</span>
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

export default DepositsTab;
