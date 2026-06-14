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
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  useIonAlert
} from '@ionic/react';
import { add, cameraOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, micOutline, trashOutline, cloudUploadOutline, sparklesOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import Tesseract from 'tesseract.js';
import { useAppStore, Expense } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { listenForVoiceInput } from '../utils/voiceInput';
import { parseAICommand } from '../utils/aiCommandParser';
import PremiumDataGrid, { ColumnDef } from '../components/PremiumDataGrid';

type ExpenseForm = Omit<Expense, 'id' | 'type'>;

const emptyExpense: ExpenseForm = {
  category: '',
  amount: 0,
  date: '',
  description: '',
  paymentMode: '',
  paidBank: 'Punjab National Bank',
};

const PaymentTab: React.FC = () => {
  const [type, setType] = useState<'CREDIT' | 'DEBIT'>('DEBIT');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showFormAI, setShowFormAI] = useState(false);
  const [formAIPrompt, setFormAIPrompt] = useState('');
  
  const { register, handleSubmit, reset, setValue } = useForm<ExpenseForm>({ defaultValues: emptyExpense });
  const expenses = useAppStore((state) => state.expenses);
  const addExpense = useAppStore((state) => state.addExpense);
  const updateExpense = useAppStore((state) => state.updateExpense);
  const deleteExpense = useAppStore((state) => state.deleteExpense);
  const [presentAlert] = useIonAlert();
  const showNotification = useNotificationStore(state => state.showNotification);
  const triggerAnimation = useNotificationStore(state => state.triggerAnimation);

  const handleFormAIFill = async () => {
    if (!formAIPrompt.trim()) return;
    const result = await parseAICommand(formAIPrompt);
    if (result.success && result.data) {
      const data = result.data;
      if (data.category) setValue('category', data.category);
      if (data.amount) setValue('amount', data.amount);
      if (data.description) setValue('description', data.description);
      if (data.paymentMode) setValue('paymentMode', data.paymentMode);
      showNotification('success', 'Form Auto-Filled', 'AI has populated the payment details.');
      setFormAIPrompt('');
      setShowFormAI(false);
    } else {
      showNotification('validation', 'AI Auto-Fill Check', 'Could not parse payment transaction properties.');
    }
  };

  const filteredExpenses = expenses.filter((expense) => expense.type === type);
  const balance = expenses.reduce((acc, curr) => (curr.type === 'CREDIT' ? acc + curr.amount : acc - curr.amount), 0);

  const openAddForm = () => {
    setEditingExpense(null);
    reset({ ...emptyExpense, date: new Date().toISOString().slice(0, 10) });
    setIsFormOpen(true);
  };

  const openEditForm = (expense: Expense) => {
    setEditingExpense(expense);
    setType(expense.type);
    reset({
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      description: expense.description,
      paymentMode: expense.paymentMode || '',
      paidBank: expense.paidBank || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
    reset(emptyExpense);
  };

  const applyReceiptText = (text: string) => {
    const amounts = text.match(/\b\d{1,7}(?:\.\d{2})?\b/g)?.map(Number).filter((value) => value > 0) || [];
    const dates = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/);
    const amount = amounts.length > 0 ? Math.max(...amounts) : 0;

    if (amount) setValue('amount', amount);
    if (dates?.[0]) setValue('date', dates[0]);
    setValue('category', 'Bills');
    setValue('description', text.split(/\r?\n/).filter(Boolean).slice(0, 2).join(' - ') || 'Uploaded bill');
  };

  const scanReceipt = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
      });

      if (image.webPath) {
        setIsScanning(true);
        const result = await Tesseract.recognize(image.webPath, 'eng');
        applyReceiptText(result.data.text);
        setIsScanning(false);
        showNotification('info', 'Scanner Active', 'Bill details detected.');
      }
    } catch (e) {
      setIsScanning(false);
      console.error('Camera or OCR failed', e);
    }
  };

  const uploadBill = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const result = await Tesseract.recognize(file, 'eng');
    applyReceiptText(result.data.text);
    setIsScanning(false);
    showNotification('info', 'Bill OCR Scanner', 'Uploaded bill parsed and details auto-populated.');
  };

  const onSubmit = (data: ExpenseForm) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, { ...data, type });
      showNotification('success', 'Entry Updated', 'Financial record updated successfully.');
    } else {
      addExpense({ ...data, type });
      triggerAnimation(type === 'CREDIT' ? 'PAYMENT_CREDIT' : 'PAYMENT_DEBIT');
      showNotification('success', `${type === 'CREDIT' ? 'Income' : 'Expense'} Logged`, `${data.category}: Rs. ${data.amount} recorded.`);
    }
    closeForm();
  };

  const onError = () => {
    showNotification('validation', 'Validation check', 'Please complete all required payment fields.');
  };

  const viewExpense = (expense: Expense) => {
    setViewingExpense(expense);
  };

  const confirmDelete = (expense: Expense) => {
    presentAlert({
      header: 'Delete Entry',
      message: `Delete ${expense.category} entry?`,
      buttons: ['Cancel', { text: 'Delete', role: 'destructive', handler: () => deleteExpense(expense.id) }],
    });
  };

  const columns: ColumnDef<Expense>[] = [
    {
      key: 'sno',
      label: 'S.No',
      render: (_, idx) => <span className="font-bold text-slate-400">{idx + 1}</span>,
      sortable: false
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true
    },
    {
      key: 'description',
      label: 'Description',
      render: (item) => <span>{item.description || '-'}</span>
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (item) => (
        <span className={`font-bold ${item.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
          Rs. {item.amount.toLocaleString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex gap-1">
          <IonButton fill="clear" size="small" onClick={() => viewExpense(item)}>
            <IonIcon icon={eyeOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" size="small" onClick={() => openEditForm(item)}>
            <IonIcon icon={createOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" color="danger" size="small" onClick={() => confirmDelete(item)}>
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
          <IonTitle><span className="app-page-title">Payments</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell space-y-6">
          <IonCard className={`app-card border-t-4 border-slate-200 ${balance >= 0 ? 'border-t-emerald-500' : 'border-t-rose-500'}`}>
            <IonCardContent className="text-center py-6 bg-white rounded-2xl">
              <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Current Balance</p>
              <h1 className={`text-4xl font-black mt-2 ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                Rs. {balance.toLocaleString()}
              </h1>
            </IonCardContent>
          </IonCard>

          {/* Sub-tabs row styled like the grids */}
          <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-bold select-none px-2 mb-4">
            <button
              onClick={() => setType('DEBIT')}
              className={`pb-2.5 px-1 relative transition-colors ${
                type === 'DEBIT' ? 'text-slate-800 font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Expenses
              {type === 'DEBIT' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
            <button
              onClick={() => setType('CREDIT')}
              className={`pb-2.5 px-1 relative transition-colors ${
                type === 'CREDIT' ? 'text-slate-800 font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Income
              {type === 'CREDIT' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
          </div>

          <PremiumDataGrid
            data={filteredExpenses}
            columns={columns}
            searchPlaceholder="Search payment category or description..."
            searchFields={['category', 'description', 'amount', 'date', 'paymentMode', 'paidBank']}
            exportFilename={`${type === 'CREDIT' ? 'Income' : 'Expenses'}_Report`}
            exportTitle={`${type === 'CREDIT' ? 'Income' : 'Expenses'} Statement`}
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

        {/* Form sliding Drawer */}
        <IonModal isOpen={isFormOpen} onDidDismiss={closeForm} className="entry-form-modal">
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>{editingExpense ? 'Edit Entry' : 'Add Entry'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowFormAI(!showFormAI)} title="AI Auto-Fill">
                <IonIcon icon={sparklesOutline} slot="icon-only" className="animate-pulse text-indigo-600" style={{ color: 'var(--theme-primary)' }} />
              </IonButton>
              <IonButton slot="end" fill="clear" onClick={closeForm}><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
            </IonToolbar>
            {showFormAI && (
              <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex gap-2 items-center">
                <input 
                  placeholder="Say: spent 350 for dinner on UPI today..." 
                  value={formAIPrompt}
                  onChange={(e) => setFormAIPrompt(e.target.value)}
                  className="bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 w-full"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleFormAIFill(); }}
                />
                <button className="bg-indigo-600 rounded-xl text-white shadow-sm px-4 py-2 text-xs font-semibold shrink-0" onClick={handleFormAIFill} style={{ backgroundColor: 'var(--theme-primary)' }}>
                  Auto-Fill
                </button>
              </div>
            )}
          </IonHeader>
          <IonContent className="ion-padding ticket-modal-content bg-slate-50">
            <form onSubmit={handleSubmit(onSubmit, onError)} className="entry-form modal-form-panel p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
              {type === 'DEBIT' && (
                <div className="bill-upload mb-4">
                  <button type="button" onClick={scanReceipt} disabled={isScanning} className="w-full py-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1.5 text-slate-600 text-xs font-bold transition-colors">
                    {isScanning ? <IonSpinner name="dots" /> : <IonIcon icon={cameraOutline} />}
                    Scan Bill Receipt
                  </button>
                  <label className="text-xs font-bold text-slate-500 flex flex-col gap-1.5 mt-3 select-none">
                    <span>Or Upload Bill File</span>
                    <input type="file" accept="image/*" onChange={uploadBill} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 file:cursor-pointer cursor-pointer" />
                  </label>
                </div>
              )}
              <div className="space-y-4">
                <IonInput fill="outline" label="Category" labelPlacement="floating" {...register('category', { required: true })}>
                  <IonButton slot="end" fill="clear" type="button" color={isListening ? 'danger' : 'primary'} onClick={() => listenForVoiceInput((text) => setValue('category', text), setIsListening)}>
                    <IonIcon icon={micOutline} className={isListening ? 'animate-pulse' : ''} />
                  </IonButton>
                </IonInput>
                <IonInput fill="outline" label="Description" labelPlacement="floating" {...register('description')} />
                <IonInput fill="outline" label="Amount" labelPlacement="floating" type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} />
                <IonInput fill="outline" label="Date" labelPlacement="floating" type="date" {...register('date', { required: true })} />
                <IonSelect fill="outline" label="Payment Mode" labelPlacement="floating" {...register('paymentMode')}>
                  <IonSelectOption value="Cash">Cash</IonSelectOption>
                  <IonSelectOption value="UPI">UPI</IonSelectOption>
                  <IonSelectOption value="Card">Card</IonSelectOption>
                  <IonSelectOption value="Net Banking">Net Banking</IonSelectOption>
                </IonSelect>
                <IonInput fill="outline" label="Paid Bank" labelPlacement="floating" {...register('paidBank')} />
              </div>
              <div className="form-actions mt-6">
                <button type="button" onClick={closeForm} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
                <IonButton type="submit"><IonIcon icon={checkmarkCircleOutline} slot="start" />Submit</IonButton>
              </div>
            </form>
          </IonContent>
        </IonModal>

        {/* View Details Modal */}
        <IonModal isOpen={!!viewingExpense} onDidDismiss={() => setViewingExpense(null)} breakpoints={[0, 0.65, 1]} initialBreakpoint={0.65}>
          <IonContent className="ion-padding bg-slate-50">
            {viewingExpense && (
              <div className="p-3">
                <div className={`p-5 rounded-t-3xl text-white flex justify-between items-center shadow-md ${viewingExpense.type === 'CREDIT' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-wider">{viewingExpense.category}</h2>
                    <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{viewingExpense.type} ENTRY</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-white/20 border border-white/30 text-white">
                    {viewingExpense.paymentMode || 'N/A'}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-b-3xl border-x border-b border-slate-200/50 space-y-4 shadow-sm relative text-xs">
                  <div className="flex justify-between border-b pb-3 items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Amount</span>
                    <span className={`font-black text-2xl ${viewingExpense.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                      Rs. {viewingExpense.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-b pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Logged</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingExpense.date}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Institution / Bank</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingExpense.paidBank || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description Details</span>
                    <p className="font-semibold text-slate-700 text-xs leading-relaxed mt-1">{viewingExpense.description || 'No additional notes logged.'}</p>
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

export default PaymentTab;
