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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonSpinner,
  IonSelect,
  IonSelectOption,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { addOutline, cameraOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, micOutline, trashOutline, cloudUploadOutline, sparklesOutline } from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import Tesseract from 'tesseract.js';
import ExportMenu from '../components/ExportMenu';
import { useAppStore, Expense } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { listenForVoiceInput } from '../utils/voiceInput';
import { parseAICommand } from '../utils/aiCommandParser';

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
  const [presentToast] = useIonToast();
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

  // Data Grid States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredExpenses = expenses.filter((expense) => expense.type === type);

  const processedData = useMemo(() => {
    let data = [...filteredExpenses];
    if (searchTerm) {
      data = data.filter(e => e.category.toLowerCase().includes(searchTerm.toLowerCase()) || (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase())));
    }
    if (sortConfig) {
      data.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [filteredExpenses, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
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

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Payments</span></IonTitle>
          <div slot="end" className="export-actions">
            <ExportMenu data={filteredExpenses} filename="Payments" title="Payments Report" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <IonCard className={`app-card border-t-4 ${balance >= 0 ? 'border-t-green-500' : 'border-t-red-500'}`}>
            <IonCardContent className="text-center">
              <p className="text-gray-500 font-semibold">Current Balance</p>
              <h1 className={`text-4xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rs. {balance.toFixed(2)}</h1>
            </IonCardContent>
          </IonCard>

          <IonSegment value={type} mode="ios" onIonChange={(event) => setType(event.detail.value as any)} className="mb-4 bg-gray-200 rounded-full p-1">
            <IonSegmentButton value="DEBIT"><IonLabel>Expenses</IonLabel></IonSegmentButton>
            <IonSegmentButton value="CREDIT"><IonLabel>Income</IonLabel></IonSegmentButton>
          </IonSegment>

          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => { setSearchTerm(e.detail.value!); setCurrentPage(1); }}
            placeholder="Search entries..."
            className="mb-4 px-0"
          />

          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-100">
            <table className="data-grid-table w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-blue-500 text-white border-b-2 border-blue-600">
                <tr>
                  <th className="p-3 font-semibold text-sm border border-blue-600">S.No</th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('category')}>
                    Category {sortConfig?.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('date')}>
                    Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">Description</th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('amount')}>
                    Amount {sortConfig?.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm text-center border border-blue-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">No entries found.</td>
                  </tr>
                ) : (
                  paginatedData.map((expense, index) => (
                    <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-3 font-medium text-gray-800 text-sm">{expense.category}</td>
                      <td className="p-3 text-sm text-gray-600">{expense.date}</td>
                      <td className="p-3 text-sm text-gray-600">{expense.description || '-'}</td>
                      <td className={`p-3 font-semibold text-sm ${expense.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>Rs. {expense.amount}</td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <IonButton fill="clear" size="small" onClick={() => viewExpense(expense)}><IonIcon icon={eyeOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" size="small" onClick={() => openEditForm(expense)}><IonIcon icon={createOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" color="danger" size="small" onClick={() => confirmDelete(expense)}><IonIcon icon={trashOutline} slot="icon-only" /></IonButton>
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
          <IonFabButton onClick={openAddForm} title="Add payment"><IonIcon icon={addOutline} /></IonFabButton>
        </IonFab>

        <IonModal isOpen={isFormOpen} onDidDismiss={closeForm} className="entry-form-modal">
          <IonHeader className="ion-no-border">
            <IonToolbar className="bg-slate-50">
              <IonTitle>{editingExpense ? 'Edit Entry' : 'Add Entry'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowFormAI(!showFormAI)} title="AI Auto-Fill">
                <IonIcon icon={sparklesOutline} slot="icon-only" className="animate-pulse text-indigo-600" />
              </IonButton>
              <IonButton slot="end" fill="clear" onClick={closeForm}><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
            </IonToolbar>
            {showFormAI && (
              <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex gap-2 items-center">
                <IonInput 
                  placeholder="Say: spent 350 for dinner on UPI today..." 
                  value={formAIPrompt}
                  onIonInput={(e) => setFormAIPrompt(e.detail.value!)}
                  className="bg-white border border-indigo-200 rounded-xl px-3 text-xs focus-within:border-indigo-500 w-full"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleFormAIFill(); }}
                />
                <IonButton size="small" className="bg-indigo-600 rounded-xl text-white shadow-sm flex-shrink-0" onClick={handleFormAIFill}>
                  Auto-Fill
                </IonButton>
              </div>
            )}
          </IonHeader>
          <IonContent className="ion-padding ticket-modal-content">
            <form onSubmit={handleSubmit(onSubmit, onError)} className="entry-form modal-form-panel">
              {type === 'DEBIT' && (
                <div className="bill-upload">
                  <IonButton type="button" fill="outline" onClick={scanReceipt} disabled={isScanning}>
                    {isScanning ? <IonSpinner name="dots" /> : <IonIcon icon={cameraOutline} slot="start" />}
                    Scan Bill
                  </IonButton>
                  <label className="text-sm font-semibold text-gray-600">
                    <IonIcon icon={cloudUploadOutline} /> Upload bill image
                    <input type="file" accept="image/*" onChange={uploadBill} className="block mt-2 text-sm" />
                  </label>
                </div>
              )}
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
              <div className="form-actions">
                <IonButton fill="outline" type="button" onClick={closeForm}>Cancel</IonButton>
                <IonButton type="submit"><IonIcon icon={checkmarkCircleOutline} slot="start" />Submit</IonButton>
              </div>
            </form>
          </IonContent>
        </IonModal>

        {/* View Expense Bottom Sheet Modal */}
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

                <div className="bg-white p-5 rounded-b-3xl border-x border-b border-slate-200/50 space-y-4 shadow-sm relative">
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
