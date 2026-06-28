import React, { useState, useRef } from 'react';
import {
  IonButton,
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
  IonSpinner,
  useIonAlert,
  useIonLoading
} from '@ionic/react';
import {
  add,
  busOutline,
  closeOutline,
  checkmarkCircleOutline,
  createOutline,
  eyeOutline,
  locateOutline,
  micOutline,
  trainOutline,
  trashOutline,
  sparklesOutline,
  listOutline
} from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import Tesseract from 'tesseract.js';
import { parseAICommand } from '../utils/aiCommandParser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useAppStore, Ticket } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { listenForVoiceInput } from '../utils/voiceInput';
import PremiumDataGrid, { ColumnDef } from '../components/PremiumDataGrid';

type TicketFormValues = Omit<Ticket, 'id' | 'status'>;

const emptyTicket: TicketFormValues = {
  type: 'TRAIN',
  pnr: '',
  time: '',
  seatType: '',
  seatNumber: '',
  coachNumber: '',
  fare: 0,
  paymentMode: '',
  paidBank: 'Punjab National Bank',
  ticketFileUrl: '',
  ticketFileName: '',
};

const TravelTicketsTab: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [showFormAI, setShowFormAI] = useState(false);
  const [formAIPrompt, setFormAIPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom Tabs State for Travel Tickets
  const [activeTravelTab, setActiveTravelTab] = useState<'ALL' | 'TRAIN' | 'BUS'>('ALL');

  const { register, handleSubmit, reset, setValue, watch } = useForm<TicketFormValues>({ defaultValues: emptyTicket });
  const tickets = useAppStore((state) => state.tickets);
  const addTicket = useAppStore((state) => state.addTicket);
  const updateTicket = useAppStore((state) => state.updateTicket);
  const deleteTicket = useAppStore((state) => state.deleteTicket);
  const updateTicketStatus = useAppStore((state) => state.updateTicketStatus);
  const addExpense = useAppStore((state) => state.addExpense);
  const [presentAlert] = useIonAlert();
  const [presentLoading, dismissLoading] = useIonLoading();
  const showNotification = useNotificationStore((state) => state.showNotification);
  const triggerAnimation = useNotificationStore((state) => state.triggerAnimation);

  const handleFormAIFill = async () => {
    if (!formAIPrompt.trim()) return;
    const result = await parseAICommand(formAIPrompt);
    if (result.success && result.data) {
      const data = result.data;
      if (data.type) setValue('type', data.type);
      if (data.pnr) setValue('pnr', data.pnr);
      if (data.fare) setValue('fare', data.fare);
      if (data.coachNumber) setValue('coachNumber', data.coachNumber);
      if (data.seatNumber) setValue('seatNumber', data.seatNumber);
      showNotification('success', 'Form Auto-Filled', 'AI has populated the travel ticket values.');
      setFormAIPrompt('');
      setShowFormAI(false);
    } else {
      showNotification('validation', 'AI Auto-Fill Check', 'Could not parse travel ticket properties.');
    }
  };

  const applyTicketText = (text: string) => {
    const pnrMatch = text.match(/\b\d{10}\b/);
    if (pnrMatch) setValue('pnr', pnrMatch[0]);

    const amounts = text.match(/\b\d{2,5}(?:\.\d{2})?\b/g)?.map(Number).filter(v => v > 0) || [];
    if (amounts.length > 0) {
      const fareVal = Math.max(...amounts);
      setValue('fare', fareVal);
    }

    const coachMatch = text.match(/\b([A-Z]\d{1,2})\b/);
    if (coachMatch) setValue('coachNumber', coachMatch[0]);

    const seatMatch = text.match(/Seat\s*(\d{1,2})|Seat\s*No\.?\s*(\d{1,2})/i);
    if (seatMatch) setValue('seatNumber', seatMatch[1] || seatMatch[2]);

    if (/train/i.test(text)) setValue('type', 'TRAIN');
    else if (/bus/i.test(text)) setValue('type', 'BUS');
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

  const handleUploadSubmit = () => {
    if (!selectedFile) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setValue('ticketFileUrl', dataUrl);
      setValue('ticketFileName', selectedFile.name);
      showNotification('success', 'Ticket Attached', `Successfully attached: "${selectedFile.name}"`);
      setSelectedFile(null);
      setIsScanning(false);
    };
    reader.onerror = () => {
      showNotification('failure', 'Upload Error', 'Failed to read file.');
      setIsScanning(false);
    };
    reader.readAsDataURL(selectedFile);
  };

  const cancelSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Filter based on active Travel sub-tab
  const filteredTickets = tickets.filter((ticket) => {
    if (activeTravelTab === 'ALL') return true;
    return ticket.type === activeTravelTab;
  });

  const openAddForm = () => {
    setEditingTicket(null);
    reset(emptyTicket);
    setIsFormOpen(true);
  };

  const openEditForm = (ticket: Ticket) => {
    setEditingTicket(ticket);
    reset({
      type: ticket.type,
      pnr: ticket.pnr,
      time: ticket.time,
      seatType: ticket.seatType || '',
      seatNumber: ticket.seatNumber || ticket.seat || '',
      coachNumber: ticket.coachNumber || '',
      fare: ticket.fare,
      paymentMode: ticket.paymentMode || '',
      paidBank: ticket.paidBank || '',
      ticketFileUrl: ticket.ticketFileUrl || '',
      ticketFileName: ticket.ticketFileName || '',
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTicket(null);
    reset(emptyTicket);
  };

  const scheduleReminder = async (data: TicketFormValues) => {
    try {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        perm = await LocalNotifications.requestPermissions();
      }

      const travelDate = new Date(data.time);
      const reminderDate = new Date(travelDate.getTime() - 2 * 60 * 60 * 1000);

      if (perm.display === 'granted' && reminderDate > new Date()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Upcoming Trip Reminder',
              body: `Your ${data.type} trip (PNR: ${data.pnr || 'N/A'}) is scheduled for ${travelDate.toLocaleTimeString()}.`,
              id: Math.floor(Math.random() * 100000),
              schedule: { at: reminderDate },
            },
          ],
        });
      }
    } catch (e) {
      console.error('Failed to schedule notification', e);
    }
  };

  const onSubmit = async (data: TicketFormValues) => {
    if (editingTicket) {
      updateTicket(editingTicket.id, data);
      triggerAnimation(data.type);
      showNotification('success', 'Ticket Updated', 'Ticket details updated successfully.');
    } else {
      addTicket(data);
      addExpense({
        category: 'Travel',
        amount: data.fare,
        date: new Date().toLocaleDateString(),
        description: `${data.type} Ticket Booking - Coach: ${data.coachNumber || 'N/A'}, Seat: ${data.seatNumber || 'N/A'}, Type: ${data.seatType || 'N/A'}`,
        type: 'DEBIT',
        paymentMode: data.paymentMode,
        paidBank: data.paidBank,
      });
      await scheduleReminder(data);
      triggerAnimation(data.type);
      showNotification('success', 'Ticket Saved', `${data.type} ticket saved successfully.`);
    }
    closeForm();
  };

  const onError = () => {
    showNotification('validation', 'Validation Check', 'Please fill in all required ticket fields.');
  };

  const handleCancel = (ticket: Ticket) => {
    presentAlert({
      header: 'Refund Amount',
      inputs: [{ name: 'refund', type: 'number', placeholder: 'Enter refund amount' }],
      buttons: [
        'Dismiss',
        {
          text: 'Process Refund',
          handler: (alertData) => {
            updateTicketStatus(ticket.id, 'CANCELLED');
            addExpense({
              category: 'Travel',
              amount: Number(alertData.refund),
              date: new Date().toLocaleDateString(),
              description: `Refund for ${ticket.type} Ticket`,
              type: 'CREDIT',
              paymentMode: ticket.paymentMode,
              paidBank: ticket.paidBank,
            });
            showNotification('success', 'Ticket Cancelled', 'Ticket cancelled and refund processed.');
          },
        },
      ],
    });
  };

  const confirmDelete = (ticket: Ticket) => {
    presentAlert({
      header: 'Delete Ticket',
      message: `Delete ${ticket.type} ticket ${ticket.pnr || ticket.seatNumber || ticket.seat || ''}?`,
      buttons: [
        'Cancel',
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            deleteTicket(ticket.id);
            showNotification('success', 'Ticket Deleted', 'Ticket has been permanently removed.');
          },
        },
      ],
    });
  };

  const viewTicket = (ticket: Ticket) => {
    setViewingTicket(ticket);
  };

  const fetchStatus = async (pnr: string) => {
    if (!pnr) {
      presentAlert({ header: 'Invalid PNR', message: 'Please enter a valid PNR number before checking status.', buttons: ['OK'] });
      return;
    }

    await presentLoading({ message: 'Fetching PNR Status from Railway Network...' });

    try {
      const apiUrl = import.meta.env.VITE_PNR_STATUS_URL || 'https://irctc1.p.rapidapi.com/api/v3/getPNRStatus';
      const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
      const apiHost = import.meta.env.VITE_RAPIDAPI_HOST || 'irctc1.p.rapidapi.com';

      if (!apiKey) {
        await dismissLoading();
        presentAlert({
          header: 'PNR API Key Required',
          message: 'Set VITE_RAPIDAPI_KEY in the app environment to fetch live PNR status.',
          buttons: ['OK'],
        });
        return;
      }

      const response = await fetch(`${apiUrl}?pnrNumber=${encodeURIComponent(pnr)}`, {
        method: 'GET',
        headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': apiHost },
      });

      const result = await response.json();
      await dismissLoading();

      if (result && result.status && result.data) {
        const passengers = result.data.PassengerStatus?.map((p: any, i: number) => `Passenger ${i + 1}: ${p.CurrentStatus}`).join('\n') || 'Status available';
        const chartStatus = result.data.ChartPrepared ? 'PREPARED' : 'NOT PREPARED';

        presentAlert({
          header: 'Current Status',
          message: `PNR: ${pnr} \nTrain: ${result.data.TrainNo}\nChart: ${chartStatus}\n\n${passengers}`,
          buttons: ['OK'],
        });
      } else {
        presentAlert({ header: 'Status Unavailable', message: result.error || 'Could not fetch status. Please check your PNR.', buttons: ['OK'] });
      }
    } catch (e) {
      await dismissLoading();
      presentAlert({ header: 'Network Error', message: 'Failed to connect to the Railway API. Please check your connection or API Key.', buttons: ['OK'] });
    }
  };

  const openTicketFile = (fileDataUrl: string, fileName?: string) => {
    try {
      if (fileDataUrl.startsWith('data:')) {
        const arr = fileDataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || '';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.title = fileName || 'Travel Ticket';
          if (mime.includes('pdf')) {
            newWindow.document.body.innerHTML = `<iframe src="${blobUrl}" style="width:100%; height:100vh; border:none; margin:0; padding:0;"></iframe>`;
          } else {
            newWindow.document.body.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:#0f172a;"><img src="${blobUrl}" style="max-width:100%; max-height:100vh; object-fit:contain; border-radius:8px;" /></div>`;
          }
        } else {
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = fileName || 'Ticket';
          a.click();
        }
      } else {
        window.open(fileDataUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      showNotification('failure', 'Viewer Error', 'Failed to open the attached ticket file.');
    }
  };

  // Columns definition
  const columns: ColumnDef<Ticket>[] = [
    {
      key: 'sno',
      label: 'S.No',
      render: (_, idx) => <span className="font-bold text-slate-400">{idx + 1}</span>,
      sortable: false
    },
    {
      key: 'type',
      label: 'Mode Type',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <IonIcon icon={item.type === 'BUS' ? busOutline : trainOutline} className="text-sm text-slate-500" />
          <span className="font-bold text-slate-700">{item.type}</span>
        </div>
      )
    },
    {
      key: 'pnr',
      label: 'PNR Number',
      render: (item) => {
        if (item.ticketFileUrl) {
          return (
            <button
              onClick={() => openTicketFile(item.ticketFileUrl!, item.ticketFileName)}
              className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-left outline-none border-none bg-transparent p-0 cursor-pointer flex items-center gap-1"
            >
              {item.pnr || 'View'}
              <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </button>
          );
        }
        return <span className="font-semibold text-slate-700">{item.pnr || '-'}</span>;
      }
    },
    {
      key: 'time',
      label: 'Departure Time',
      sortable: true,
      render: (item) => <span>{new Date(item.time).toLocaleString()}</span>
    },
    {
      key: 'fare',
      label: 'Fare (Rs)',
      sortable: true,
      render: (item) => <span className="font-bold text-slate-700">Rs. {item.fare.toFixed(2)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item) => (
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          item.status === 'BOOKED' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            item.status === 'BOOKED' ? 'bg-blue-500' : 'bg-red-500'
          }`} />
          {item.status}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (item) => (
        <div className="flex gap-1">
          <IonButton fill="clear" size="small" onClick={() => viewTicket(item)}>
            <IonIcon icon={eyeOutline} slot="icon-only" />
          </IonButton>
          <IonButton fill="clear" size="small" onClick={() => openEditForm(item)}>
            <IonIcon icon={createOutline} slot="icon-only" />
          </IonButton>
          {item.type === 'TRAIN' && (
            <IonButton fill="clear" size="small" title="Check live status" onClick={() => fetchStatus(item.pnr)}>
              <IonIcon icon={locateOutline} slot="icon-only" />
            </IonButton>
          )}
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
          <IonTitle><span className="app-page-title">Travel Tickets</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell space-y-4">
          
          {/* Sub-tabs row styled like grid selector */}
          <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-bold select-none px-2 mb-2">
            <button
              onClick={() => setActiveTravelTab('ALL')}
              className={`pb-2.5 px-1 relative flex items-center gap-1.5 transition-colors ${
                activeTravelTab === 'ALL' ? 'theme-text font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IonIcon icon={listOutline} className="text-base" />
              All Tickets
              {activeTravelTab === 'ALL' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
            <button
              onClick={() => setActiveTravelTab('TRAIN')}
              className={`pb-2.5 px-1 relative flex items-center gap-1.5 transition-colors ${
                activeTravelTab === 'TRAIN' ? 'theme-text font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IonIcon icon={trainOutline} className="text-base" />
              Train Tickets
              {activeTravelTab === 'TRAIN' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
            <button
              onClick={() => setActiveTravelTab('BUS')}
              className={`pb-2.5 px-1 relative flex items-center gap-1.5 transition-colors ${
                activeTravelTab === 'BUS' ? 'theme-text font-black' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <IonIcon icon={busOutline} className="text-base" />
              Bus Tickets
              {activeTravelTab === 'BUS' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
              )}
            </button>
          </div>

          <PremiumDataGrid
            data={filteredTickets}
            columns={columns}
            searchPlaceholder="Search travel tickets..."
            searchFields={['type', 'pnr', 'coachNumber', 'seatNumber', 'paidBank', 'paymentMode']}
            exportFilename="Travel_Tickets_Report"
            exportTitle="Travel Booking Tickets Statement"
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
        <IonModal isOpen={isFormOpen} onDidDismiss={closeForm} className="ticket-form-modal">
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
                <span className="text-[15px] font-bold text-slate-800 tracking-wide">{editingTicket ? 'Edit Ticket' : 'Add Ticket'}</span>
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
                  placeholder="Say: fare 450 PNR 9876543210 coach B2 seat 12 tomorrow..." 
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
              {/* Drag and Drop File Upload Component */}
              <div className="mb-2 space-y-1.5 select-none">
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
                      accept="image/*,application/pdf" 
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
                      ) : watch('ticketFileName') ? (
                        <span className="text-emerald-600 block">
                          Currently Attached: <strong className="font-extrabold">{watch('ticketFileName')}</strong>
                        </span>
                      ) : (
                        <span>
                          Drag and drop a .PNG or .JPG or .JPEG or .WEBP or .PDF file here or click
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Type *</label>
                  <select 
                    {...register('type', { required: true })} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                  >
                    <option value="BUS">Bus</option>
                    <option value="TRAIN">Train</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">PNR Number</label>
                  <input 
                    type="text" 
                    {...register('pnr')} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                    placeholder="10-digit PNR"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Travel Time *</label>
                  <input 
                    type="datetime-local" 
                    {...register('time', { required: true })} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Coach Number</label>
                  <input 
                    type="text" 
                    {...register('coachNumber')} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                    placeholder="e.g. B1"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Seat Number</label>
                  <input 
                    type="text" 
                    {...register('seatNumber')} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                    placeholder="e.g. 24"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Seat Type</label>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      {...register('seatType')} 
                      className="w-full pl-3 pr-10 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                      placeholder="e.g. Upper Berth"
                    />
                    <button
                      type="button"
                      onClick={() => listenForVoiceInput((text) => setValue('seatType', text), setIsListening)}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      <IonIcon icon={micOutline} className={`text-base ${isListening ? 'text-red-500 animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Fare Amount *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    {...register('fare', { required: true, valueAsNumber: true })} 
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 text-slate-800 bg-white"
                    placeholder="0.00"
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

        {/* View Details bottom sheet modal */}
        <IonModal isOpen={!!viewingTicket} onDidDismiss={() => setViewingTicket(null)} breakpoints={[0, 0.75, 1]} initialBreakpoint={0.75}>
          <IonContent className="ion-padding bg-slate-50">
            {viewingTicket && (
              <div className="p-3 text-xs">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-t-[28px] text-white flex justify-between items-center relative overflow-hidden shadow-lg animate-pulse">
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-full">
                      <IonIcon icon={viewingTicket.type === 'BUS' ? busOutline : trainOutline} className="text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black uppercase tracking-widest">{viewingTicket.type} PASS</h2>
                      <span className="text-[9px] text-indigo-200 font-bold tracking-wider">BOARDING PERMIT</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white text-indigo-700 shadow-sm">
                    {viewingTicket.status}
                  </span>
                </div>

                <div className="bg-white p-5 rounded-b-[28px] border-x border-b border-slate-200/50 space-y-4 shadow-sm relative">
                  <div className="absolute -left-3 top-0 -translate-y-1/2 w-6 h-6 bg-slate-50 border border-slate-200 rounded-full" />
                  <div className="absolute -right-3 top-0 -translate-y-1/2 w-6 h-6 bg-slate-50 border border-slate-200 rounded-full" />

                  <div className="grid grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PNR Number</span>
                      {viewingTicket.ticketFileUrl ? (
                        <p className="mt-0.5">
                          <button
                            onClick={() => openTicketFile(viewingTicket.ticketFileUrl!, viewingTicket.ticketFileName)}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-extrabold text-sm text-left outline-none border-none bg-transparent p-0 cursor-pointer flex items-center gap-1"
                          >
                            {viewingTicket.pnr || 'View'}
                            <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                          </button>
                        </p>
                      ) : (
                        <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingTicket.pnr || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departure Date</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{new Date(viewingTicket.time).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coach / Seat</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingTicket.coachNumber || 'N/A'} / {viewingTicket.seatNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seat Class</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingTicket.seatType || 'Standard'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-dashed border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Mode</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingTicket.paymentMode || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid Bank</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingTicket.paidBank || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Ticket Fare</span>
                      <p className="font-black text-emerald-600 text-xl mt-0.5">Rs. {viewingTicket.fare.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-end opacity-45">
                      <div className="flex gap-0.5">
                        {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1].map((w, i) => (
                          <div key={i} className="bg-slate-900 h-8" style={{ width: `${w}px` }} />
                        ))}
                      </div>
                      <span className="text-[6px] font-mono tracking-widest text-slate-800 mt-1">*{viewingTicket.id.slice(0, 8).toUpperCase()}*</span>
                    </div>
                  </div>
                </div>

                {viewingTicket.status === 'BOOKED' && (
                  <button onClick={() => { setViewingTicket(null); handleCancel(viewingTicket); }} className="w-full mt-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md active:scale-95 transition-all">
                    Cancel & Process Refund
                  </button>
                )}
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default TravelTicketsTab;
