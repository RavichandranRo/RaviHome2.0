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
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  useIonAlert,
  useIonLoading,
  useIonToast,
} from '@ionic/react';
import {
  addOutline,
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
} from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import { parseAICommand } from '../utils/aiCommandParser';
import { LocalNotifications } from '@capacitor/local-notifications';
import ExportMenu from '../components/ExportMenu';
import { useAppStore, Ticket } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { listenForVoiceInput } from '../utils/voiceInput';

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

  // Data Grid States
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const processedData = useMemo(() => {
    let data = [...tickets];
    if (searchTerm) {
      data = data.filter(d => d.pnr?.toLowerCase().includes(searchTerm.toLowerCase()) || d.type.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (sortConfig) {
      data.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [tickets, searchTerm, sortConfig]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

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

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Travel Tickets</span></IonTitle>
          <div slot="end" className="export-actions">
            <ExportMenu data={tickets} filename="Tickets" title="Travel Tickets Report" />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell">
          <div className="section-heading">
            <h2>Trips</h2>
          </div>

          <IonSearchbar
            value={searchTerm}
            onIonInput={(e) => { setSearchTerm(e.detail.value!); setCurrentPage(1); }}
            placeholder="Search PNR or Type..."
            className="mb-4 px-0"
          />

          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-100">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-blue-500 text-white border-b-2 border-blue-600">
                <tr>
                  <th className="p-3 font-semibold text-sm border border-blue-600">S.No</th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('type')}>
                    Type {sortConfig?.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">PNR</th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('time')}>
                    Time {sortConfig?.key === 'time' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm cursor-pointer hover:bg-blue-600 transition-colors border border-blue-600" onClick={() => requestSort('fare')}>
                    Fare {sortConfig?.key === 'fare' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 font-semibold text-sm border border-blue-600">Status</th>
                  <th className="p-3 font-semibold text-sm text-center border border-blue-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">No travel tickets added yet.</td>
                  </tr>
                ) : (
                  paginatedData.map((ticket, index) => (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm text-gray-600">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="p-3 font-medium text-gray-800 text-sm">
                        <div className="flex items-center gap-2">
                          <IonIcon icon={ticket.type === 'BUS' ? busOutline : trainOutline} />
                          {ticket.type}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">{ticket.pnr || '-'}</td>
                      <td className="p-3 text-sm text-gray-600">{new Date(ticket.time).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-green-600 text-sm">Rs. {ticket.fare.toFixed(2)}</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex justify-center gap-1">
                          <IonButton fill="clear" size="small" onClick={() => viewTicket(ticket)}><IonIcon icon={eyeOutline} slot="icon-only" /></IonButton>
                          <IonButton fill="clear" size="small" onClick={() => openEditForm(ticket)}><IonIcon icon={createOutline} slot="icon-only" /></IonButton>
                          {ticket.type === 'TRAIN' && (
                            <IonButton fill="clear" size="small" title="Check status" onClick={() => fetchStatus(ticket.pnr)}><IonIcon icon={locateOutline} slot="icon-only" /></IonButton>
                          )}
                          <IonButton fill="clear" color="danger" size="small" onClick={() => confirmDelete(ticket)}><IonIcon icon={trashOutline} slot="icon-only" /></IonButton>
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
          <IonFabButton onClick={openAddForm} title="Add ticket">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={isFormOpen} onDidDismiss={closeForm} className="ticket-form-modal">
          <IonHeader className="ion-no-border">
            <IonToolbar className="bg-slate-50">
              <IonTitle>{editingTicket ? 'Edit Ticket' : 'Add Ticket'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowFormAI(!showFormAI)} title="AI Auto-Fill" color="secondary">
                <IonIcon icon={sparklesOutline} slot="icon-only" className="animate-pulse text-indigo-600" />
              </IonButton>
              <IonButton slot="end" fill="clear" onClick={closeForm} title="Close">
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </IonToolbar>
            {showFormAI && (
              <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex gap-2 items-center">
                <IonInput 
                  placeholder="Say: fare 450 PNR 9876543210 coach B2 seat 12 tomorrow..." 
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
            <form onSubmit={handleSubmit(onSubmit, onError)} className="ticket-form modal-form-panel">
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
              <div className="form-actions">
                <IonButton fill="outline" type="button" onClick={closeForm}>
                  Cancel
                </IonButton>
                <IonButton type="submit">
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  Submit
                </IonButton>
              </div>
            </form>
          </IonContent>
        </IonModal>

        {/* View Ticket Bottom Sheet Modal */}
        <IonModal isOpen={!!viewingTicket} onDidDismiss={() => setViewingTicket(null)} breakpoints={[0, 0.75, 1]} initialBreakpoint={0.75}>
          <IonContent className="ion-padding bg-slate-50">
            {viewingTicket && (
              <div className="p-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-t-[28px] text-white flex justify-between items-center relative overflow-hidden shadow-lg">
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
                  <IonButton expand="block" color="warning" className="mt-6 rounded-2xl font-bold shadow-md" onClick={() => { setViewingTicket(null); handleCancel(viewingTicket); }}>
                    Cancel & Process Refund
                  </IonButton>
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
