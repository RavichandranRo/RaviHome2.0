import React, { useState, useRef } from 'react';
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
import { add, cameraOutline, checkmarkCircleOutline, closeOutline, createOutline, eyeOutline, micOutline, trashOutline, cloudUploadOutline, sparklesOutline, walletOutline, cashOutline } from 'ionicons/icons';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setIsScanning(true);
    try {
      const result = await Tesseract.recognize(selectedFile, 'eng');
      applyReceiptText(result.data.text);
      showNotification('success', 'Bill OCR Scanner', 'Bill file processed and details auto-populated.');
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      showNotification('failure', 'OCR Error', 'Failed to read bill details.');
    } finally {
      setIsScanning(false);
    }
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
              className={`pb-2.5 px-1 relative flex items-center gap-1.5 transition-colors ${
                type === 'DEBIT' ? 'theme-text font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IonIcon icon={walletOutline} className="text-base" />
              Expenses
              {type === 'DEBIT' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
            <button
              onClick={() => setType('CREDIT')}
              className={`pb-2.5 px-1 relative flex items-center gap-1.5 transition-colors ${
                type === 'CREDIT' ? 'theme-text font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IonIcon icon={cashOutline} className="text-base" />
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
          <IonHeader className="ion-no-border border-b border-slate-200">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white select-none">
              <div className="flex items-center gap-3">
                <button 
                  onClick={closeForm}
                  className="w-8 h-8 rounded-full border border-blue-200 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors cursor-pointer outline-none bg-white shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </button>
                <span className="text-[15px] font-bold text-slate-800 tracking-wide">{editingExpense ? 'Edit Entry' : 'Add Entry'}</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowFormAI(!showFormAI)} 
                className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors outline-none cursor-pointer"
                title="AI Auto-Fill"
                style={{ color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)' }}
              >
                <IonIcon icon={sparklesOutline} className="text-base animate-pulse" />
              </button>
            </div>
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
            <form onSubmit={handleSubmit(onSubmit, onError)} className="modal-form-panel p-5 bg-white space-y-4">
              {type === 'DEBIT' && (
                <div className="mb-4 space-y-4">
                  {/* Camera Scanner */}
                  <button 
                    type="button" 
                    onClick={scanReceipt} 
                    disabled={isScanning} 
                    className="w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-1.5 text-slate-700 text-xs font-extrabold transition-all active:scale-98"
                  >
                    {isScanning ? <IonSpinner name="dots" /> : <IonIcon icon={cameraOutline} className="text-base" />}
                    Scan Bill Receipt via Camera
                  </button>

                  {/* Drag and Drop File Upload Component */}
                  <div className="space-y-1.5 select-none">
                    <label className="text-xs font-bold text-slate-500 tracking-wide uppercase">File Name *</label>
                    <div 
                      className={`border rounded-2xl bg-white transition-all overflow-hidden ${
                        isDragActive ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'
                      }`}
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                    >
                      {/* Top action buttons row */}
                      <div className="p-3.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          accept="image/*" 
                          onChange={handleFileChange} 
                          className="hidden" 
                        />
                        <button
                          type="button"
                          onClick={triggerFileSelect}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-98 border-0 outline-none"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Choose file to Upload
                        </button>
                        <button
                          type="button"
                          disabled={!selectedFile || isScanning}
                          onClick={handleUploadSubmit}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-0 outline-none ${
                            selectedFile && !isScanning
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-98'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {isScanning ? (
                            <IonSpinner name="dots" className="w-4 h-4" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                          )}
                          Upload
                        </button>
                        <button
                          type="button"
                          disabled={!selectedFile || isScanning}
                          onClick={cancelSelection}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border-0 outline-none ${
                            selectedFile && !isScanning
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-98'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      </div>

                      {/* Bottom drag-and-drop info zone */}
                      <div className="p-5 flex items-center gap-3 bg-white">
                        <div className="text-slate-400 text-2xl shrink-0 p-2 bg-slate-50 rounded-xl">
                          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-[11px] font-bold text-slate-500 tracking-wide leading-relaxed">
                          {selectedFile ? (
                            <span className="text-emerald-600 block">
                              Selected: <strong className="font-extrabold">{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </span>
                          ) : (
                            <span>
                              Drag and drop a .PNG or .JPG or .JPEG or .WEBP file here or click
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-4 mt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Category *</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      {...register('category', { required: true })} 
                      className="w-full pl-3 pr-10 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800"
                      placeholder="Category"
                    />
                    <button
                      type="button"
                      onClick={() => listenForVoiceInput((text) => setValue('category', text), setIsListening)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <IonIcon icon={micOutline} className={`text-base ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Description</label>
                  <input 
                    type="text" 
                    {...register('description')} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                    placeholder="Description"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Amount *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    {...register('amount', { required: true, valueAsNumber: true })} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                    placeholder="0.00"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Date *</label>
                  <input 
                    type="date" 
                    {...register('date', { required: true })} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Payment Mode</label>
                  <select 
                    {...register('paymentMode')} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Paid Bank</label>
                  <input 
                    type="text" 
                    {...register('paidBank')} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                    placeholder="Paid Bank"
                  />
                </div>
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
