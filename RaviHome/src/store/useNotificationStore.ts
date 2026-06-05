import { create } from 'zustand';

export interface NotificationState {
  type: 'success' | 'failure' | 'validation' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export type AnimationType =
  | 'TRAIN'
  | 'BUS'
  | 'DEPOSIT'
  | 'EB'
  | 'PLANNED_TASK'
  | 'COMPLETED_TASK'
  | 'PAYMENT_CREDIT'
  | 'PAYMENT_DEBIT'
  | 'THEME'
  | 'ARCHIVE'
  | null;

interface NotificationStore {
  notification: NotificationState | null;
  animation: AnimationType;
  isAssistantOpen: boolean;
  aiStatus: 'idle' | 'listening' | 'thinking' | 'success' | 'error';
  showNotification: (
    type: 'success' | 'failure' | 'validation' | 'info',
    title: string,
    message: string,
    duration?: number
  ) => void;
  clearNotification: () => void;
  triggerAnimation: (type: AnimationType) => void;
  clearAnimation: () => void;
  setAssistantOpen: (open: boolean) => void;
  setAIStatus: (status: 'idle' | 'listening' | 'thinking' | 'success' | 'error') => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notification: null,
  animation: null,
  isAssistantOpen: false,
  aiStatus: 'idle',
  showNotification: (type, title, message, duration = 3000) => {
    set({ notification: { type, title, message, duration } });
  },
  clearNotification: () => set({ notification: null }),
  triggerAnimation: (type) => set({ animation: type }),
  clearAnimation: () => set({ animation: null }),
  setAssistantOpen: (open) => set({ isAssistantOpen: open }),
  setAIStatus: (status) => set({ aiStatus: status }),
}));
