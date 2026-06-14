import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonFab,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  IonCheckbox
} from '@ionic/react';
import { add, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, trashOutline, walletOutline, cashOutline, listOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import { Deposit, useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import PremiumDataGrid, { ColumnDef } from '../components/PremiumDataGrid';

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
  
  // Custom Sub-Tabs State for Deposits
  const [activeDepositTab, setActiveDepositTab] = useState<'ALL' | 'FD' | 'RD'>('ALL');

  const { register, handleSubmit, reset, watch, setValue } = useForm<DepositForm>({ defaultValues: emptyDeposit });
  const deposits = useAppStore((state) => state.deposits);
  const addDeposit = useAppStore((state) => state.addDeposit);
  const updateDeposit = useAppStore((state) => state.updateDeposit);
  const deleteDeposit = useAppStore((state) => state.deleteDeposit);
  const showNotification = useNotificationStore(state => state.showNotification);
  const triggerAnimation = useNotificationStore(state => state.triggerAnimation);

  // Filter based on active Deposit sub-tab
  const filteredDeposits = deposits.filter((deposit) => {
    if (activeDepositTab === 'ALL') return true;
    return deposit.type === activeDepositTab;
  });

  const amount = watch('amount', 0);
  const duration = watch('durationDays', 0);
  const roi = watch('roi', 0);

  const getMaturity = (amt: number, dur: number, rate: number, depType: 'FD' | 'RD') => {
    if (!amt || !dur || !rate) return 0;
    const months = dur / (365 / 12);
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

  // Columns definition
  const columns: ColumnDef<Deposit>[] = [
    {
      key: 'sno',
      label: 'S.No',
      render: (_, idx) => <span className="font-bold text-slate-400">{idx + 1}</span>,
      sortable: false
    },
    {
      key: 'bank',
      label: 'Bank Name',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-700">{item.bank}</span>
    },
    {
      key: 'type',
      label: 'Deposit Type',
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
          item.type === 'FD' ? 'bg-purple-50 text-purple-600' : 'bg-teal-50 text-teal-600'
        }`}>
          {item.type}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount (Rs)',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-700">Rs. {item.amount.toLocaleString()}</span>
    },
    {
      key: 'startDate',
      label: 'Start Date',
      render: (item) => <span>{(item as any).startDate || '-'}</span>
    },
    {
      key: 'maturityDate',
      label: 'Maturity Date',
      render: (item) => <span>{(item as any).maturityDate || '-'}</span>
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (item) => <span>{(item as any).durationDays || 365} days</span>
    },
    {
      key: 'roi',
      label: 'ROI',
      sortable: true,
      render: (item) => <span>{item.roi}%</span>
    },
    {
      key: 'autoRenewal',
      label: 'Auto Renewal',
      render: (item) => (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          (item as any).autoRenewal ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'
        }`}>
          {(item as any).autoRenewal ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex gap-1">
          <IonButton fill="clear" size="small" onClick={() => viewDeposit(item)}>
            <IonIcon icon={eyeOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" size="small" onClick={() => openEditForm(item)}>
            <IonIcon icon={createOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" color="danger" size="small" onClick={() => deleteDeposit(item.id)}>
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
          <IonTitle><span className="app-page-title">Deposits</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell space-y-4">
          
          {/* Sub-tabs row styled like grid selector */}
          <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-bold select-none px-2 mb-2">
            <button
              onClick={() => setActiveDepositTab('ALL')}
              className={`pb-2.5 px-1 relative flex items-center gap-1.5 transition-colors ${
                activeDepositTab === 'ALL' ? 'text-slate-800 font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IonIcon icon={listOutline} className="text-base" />
              All Deposits
              {activeDepositTab === 'ALL' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
            <button
              onClick={() => setActiveDepositTab('FD')}
              className={`pb-2.5 px-1 relative flex items-center gap-1.5 transition-colors ${
                activeDepositTab === 'FD' ? 'text-slate-800 font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IonIcon icon={walletOutline} className="text-base" />
              Fixed Deposits (FD)
              {activeDepositTab === 'FD' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
            <button
              onClick={() => setActiveDepositTab('RD')}
              className={`pb-2.5 px-1 relative flex items-center gap-1.5 transition-colors ${
                activeDepositTab === 'RD' ? 'text-slate-800 font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IonIcon icon={cashOutline} className="text-base" />
              Recurring Deposits (RD)
              {activeDepositTab === 'RD' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
          </div>

          <PremiumDataGrid
            data={filteredDeposits}
            columns={columns}
            searchPlaceholder="Search deposits..."
            searchFields={['bank', 'amount', 'durationDays', 'roi', 'startDate', 'maturityDate']}
            exportFilename="Deposits_Report"
            exportTitle="Deposits Portfolio Statement"
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
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>{editingDeposit ? 'Edit Deposit' : 'Add Deposit'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={closeForm}><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding ticket-modal-content bg-slate-50">
            <form onSubmit={handleSubmit(onSubmit)} className="entry-form modal-form-panel p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm space-y-4">
              <IonSelect fill="outline" label="Bank" labelPlacement="floating" {...register('bank', { required: true })} onIonChange={(event) => setBankRate(event.detail.value)}>
                {INDIAN_BANK_RATES.map((item) => <IonSelectOption key={item.bank} value={item.bank}>{item.bank}</IonSelectOption>)}
              </IonSelect>
              <IonInput fill="outline" label={type === 'RD' ? 'Monthly Amount' : 'Principal Amount'} labelPlacement="floating" type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Duration (Days)" labelPlacement="floating" type="number" {...register('durationDays', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Rate of Interest (%)" labelPlacement="floating" type="number" step="0.01" {...register('roi', { required: true, valueAsNumber: true })} />
              <IonInput fill="outline" label="Start Date" labelPlacement="floating" type="date" {...register('startDate')} />
              <IonInput fill="outline" label="Maturity Date" labelPlacement="floating" type="date" {...register('maturityDate')} />
              
              <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl">
                <input 
                  type="checkbox" 
                  checked={!!watch('autoRenewal')}
                  onChange={(e) => setValue('autoRenewal', e.target.checked)}
                  id="autoRenewalCheckbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="autoRenewalCheckbox" className="text-xs font-bold text-slate-600 cursor-pointer select-none">Auto Renewal</label>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl text-center">
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Estimated Maturity Amount</p>
                <p className="text-2xl font-black text-blue-800 mt-1">Rs. {calculateMaturity(amount, duration, roi).toFixed(2)}</p>
              </div>
              
              <div className="form-actions mt-6">
                <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <IonButton type="submit"><IonIcon icon={checkmarkCircleOutline} slot="start" />Submit</IonButton>
              </div>
            </form>
          </IonContent>
        </IonModal>

        {/* View Details drawer modal */}
        <IonModal isOpen={!!viewingDeposit} onDidDismiss={() => setViewingDeposit(null)} breakpoints={[0, 0.75, 1]} initialBreakpoint={0.75}>
          <IonContent className="ion-padding bg-gray-50">
            {viewingDeposit && (
              <div className="p-2 text-xs">
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
