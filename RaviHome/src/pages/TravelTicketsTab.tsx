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
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
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
};

const TravelTicketsTab: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [showFormAI, setShowFormAI] = useState(false);
  const [formAIPrompt, setFormAIPrompt] = useState('');
  
  // Custom Tabs State for Travel Tickets
  const [activeTravelTab, setActiveTravelTab] = useState<'ALL' | 'TRAIN' | 'BUS'>('ALL');

  const { register, handleSubmit, reset, setValue } = useForm<TicketFormValues>({ defaultValues: emptyTicket });
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
      render: (item) => <span>{item.pnr || '-'}</span>
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
                activeTravelTab === 'ALL' ? 'text-slate-800 font-black' : 'text-slate-400 hover:text-slate-600'
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
                activeTravelTab === 'TRAIN' ? 'text-slate-800 font-black' : 'text-slate-400 hover:text-slate-600'
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
                activeTravelTab === 'BUS' ? 'text-slate-800 font-black' : 'text-slate-400 hover:text-slate-600'
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
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>{editingTicket ? 'Edit Ticket' : 'Add Ticket'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowFormAI(!showFormAI)} title="AI Auto-Fill">
                <IonIcon icon={sparklesOutline} slot="icon-only" className="animate-pulse text-indigo-600" style={{ color: 'var(--theme-primary)' }} />
              </IonButton>
              <IonButton slot="end" fill="clear" onClick={closeForm}><IonIcon icon={closeOutline} slot="icon-only" /></IonButton>
            </IonToolbar>
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
            <form onSubmit={handleSubmit(onSubmit, onError)} className="ticket-form modal-form-panel p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
              <div className="space-y-4">
                <IonSelect fill="outline" label="Type" labelPlacement="floating" {...register('type', { required: true })}>
                  <IonSelectOption value="BUS">Bus</IonSelectOption>
                  <IonSelectOption value="TRAIN">Train</IonSelectOption>
                </IonSelect>
                <IonInput fill="outline" label="PNR Number" labelPlacement="floating" {...register('pnr')} />
                <IonInput fill="outline" label="Travel Time" labelPlacement="floating" type="datetime-local" {...register('time', { required: true })} />
                <IonInput fill="outline" label="Coach Number" labelPlacement="floating" {...register('coachNumber')} />
                <IonInput fill="outline" label="Seat Number" labelPlacement="floating" {...register('seatNumber')} />
                <IonInput fill="outline" label="Seat Type" labelPlacement="floating" {...register('seatType')} />
                <IonInput fill="outline" label="Fare Amount" labelPlacement="floating" type="number" step="0.01" {...register('fare', { required: true, valueAsNumber: true })}>
                  <IonButton
                    slot="end"
                    fill="clear"
                    type="button"
                    color={isListening ? 'danger' : 'primary'}
                    onClick={() => listenForVoiceInput((text) => setValue('seatType', text), setIsListening)}
                  >
                    <IonIcon icon={micOutline} className={isListening ? 'animate-pulse' : ''} />
                  </IonButton>
                </IonInput>
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
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{viewingTicket.pnr || 'N/A'}</p>
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
