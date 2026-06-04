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
} from 'ionicons/icons';
import { useForm } from 'react-hook-form';
import { LocalNotifications } from '@capacitor/local-notifications';
import ExportMenu from '../components/ExportMenu';
import { useAppStore, Ticket } from '../store/useAppStore';
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
};

const TravelTicketsTab: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<TicketFormValues>({ defaultValues: emptyTicket });
  const tickets = useAppStore((state) => state.tickets);
  const addTicket = useAppStore((state) => state.addTicket);
  const updateTicket = useAppStore((state) => state.updateTicket);
  const deleteTicket = useAppStore((state) => state.deleteTicket);
  const updateTicketStatus = useAppStore((state) => state.updateTicketStatus);
  const addExpense = useAppStore((state) => state.addExpense);
  const [presentAlert] = useIonAlert();
  const [presentLoading, dismissLoading] = useIonLoading();
  const [presentToast] = useIonToast();

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
      presentToast({ message: 'Ticket updated successfully.', duration: 2000, color: 'success', position: 'top' });
    } else {
      addTicket(data);
      addExpense({
        category: 'Travel',
        amount: data.fare,
        date: new Date().toLocaleDateString(),
        description: `${data.type} Ticket Booking - Coach: ${data.coachNumber || 'N/A'}, Seat: ${data.seatNumber || 'N/A'}, Type: ${data.seatType || 'N/A'}`,
        type: 'DEBIT',
      });
      await scheduleReminder(data);
      presentToast({ message: 'Ticket saved successfully.', duration: 2000, color: 'success', position: 'top' });
    }

    closeForm();
  };

  const onError = () => {
    presentToast({ message: 'Please enter all required ticket fields.', duration: 2500, color: 'danger', position: 'top' });
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
            });
            presentToast({ message: 'Ticket cancelled and refunded.', duration: 2000, color: 'warning', position: 'top' });
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
            presentToast({ message: 'Ticket deleted.', duration: 1800, color: 'danger', position: 'top' });
          },
        },
      ],
    });
  };

  const viewTicket = (ticket: Ticket) => {
    presentAlert({
      header: `${ticket.type} Ticket`,
      message: `PNR: ${ticket.pnr || 'N/A'}\nTime: ${ticket.time}\nCoach: ${ticket.coachNumber || 'N/A'}\nSeat Number: ${ticket.seatNumber || ticket.seat || 'N/A'}\nSeat Type: ${ticket.seatType || 'N/A'}\nFare: Rs. ${ticket.fare}\nStatus: ${ticket.status}`,
      buttons: [
        'OK',
        {
          text: 'Mark Refund',
          handler: () => handleCancel(ticket),
        },
      ],
    });
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

          {tickets.length === 0 && <p className="empty-state">No travel tickets added yet.</p>}

          <div className="ticket-grid">
            {tickets.map((ticket) => (
              <IonCard key={ticket.id} className="ticket-card">
                <IonCardContent>
                  <div className="ticket-card-header">
                    <div className="ticket-type">
                      <IonIcon icon={ticket.type === 'BUS' ? busOutline : trainOutline} />
                      <div>
                        <p className="font-bold text-gray-800">{ticket.type}</p>
                        <p className="text-xs text-gray-500">PNR: {ticket.pnr || 'N/A'}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${ticket.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">Time: {ticket.time}</p>
                  <p className="text-sm text-gray-600">Coach: {ticket.coachNumber || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Seat No: {ticket.seatNumber || ticket.seat || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Seat Type: {ticket.seatType || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Fare: Rs. {ticket.fare}</p>

                  <div className="ticket-actions">
                    <IonButton className="icon-button" fill="clear" title="View" onClick={() => viewTicket(ticket)}>
                      <IonIcon icon={eyeOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton className="icon-button" fill="clear" title="Edit" onClick={() => openEditForm(ticket)}>
                      <IonIcon icon={createOutline} slot="icon-only" />
                    </IonButton>
                    {ticket.type === 'TRAIN' && (
                      <IonButton className="icon-button" fill="clear" title="Check status" onClick={() => fetchStatus(ticket.pnr)}>
                        <IonIcon icon={locateOutline} slot="icon-only" />
                      </IonButton>
                    )}
                    {ticket.status === 'BOOKED' && (
                      <IonButton className="icon-button" fill="clear" color="warning" title="Cancel ticket" onClick={() => handleCancel(ticket)}>
                        <IonIcon icon={closeOutline} slot="icon-only" />
                      </IonButton>
                    )}
                    <IonButton className="icon-button" fill="clear" color="danger" title="Delete" onClick={() => confirmDelete(ticket)}>
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        </div>

        <IonFab slot="fixed" vertical="bottom" horizontal="end" className="add-ticket-fab">
          <IonFabButton onClick={openAddForm} title="Add ticket">
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={isFormOpen} onDidDismiss={closeForm} className="ticket-form-modal">
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>{editingTicket ? 'Edit Ticket' : 'Add Ticket'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={closeForm} title="Close">
                <IonIcon icon={closeOutline} slot="icon-only" />
              </IonButton>
            </IonToolbar>
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
              <IonInput fill="outline" label="Fare Amount" labelPlacement="floating" type="number" {...register('fare', { required: true, valueAsNumber: true })}>
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
      </IonContent>
    </IonPage>
  );
};

export default TravelTicketsTab;
