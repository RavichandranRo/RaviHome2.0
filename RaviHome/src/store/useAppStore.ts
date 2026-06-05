import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import { sqliteStorage } from '../utils/sqliteStorage';
import { zipSync, strToU8 } from 'fflate';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  type: 'CREDIT' | 'DEBIT';
  paymentMode?: string;
  paidBank?: string;
}

export interface Task {
  id: string;
  title: string;
  date: string;
  status: 'PLANNED' | 'COMPLETED';
}

export interface Ticket {
  id: string;
  type: 'BUS' | 'TRAIN';
  time: string;
  seat?: string;
  seatType: string;
  seatNumber: string;
  coachNumber: string;
  fare: number;
  status: 'BOOKED' | 'CANCELLED';
  pnr: string;
  paymentMode?: string;
  paidBank?: string;
}

export interface Deposit {
  id: string;
  type: 'FD' | 'RD';
  bank: string;
  amount: number;
  durationDays: number;
  roi: number;
  autoRenewal?: boolean;
  startDate?: string;
  maturityDate?: string;
  lastRenewedDate?: string;
}
export interface EBReading {
  id: string;
  date: string;
  previousReading: number;
  currentReading: number;
  units: number;
  amount: number;
}
export interface AuditLog {
  id: string;
  action: string;
  date: string;
}

interface AppState {
  expenses: Expense[];
  tasks: Task[];
  tickets: Ticket[];
  deposits: Deposit[];
  ebReadings: EBReading[];
  auditLogs: AuditLog[];
  theme: 'light' | 'dark';
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  updateTask: (id: string, task: Omit<Task, 'id' | 'status'>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: 'PLANNED' | 'COMPLETED') => void;
  addEBReading: (reading: Omit<EBReading, 'id' | 'date'>) => void;
  updateEBReading: (id: string, reading: Omit<EBReading, 'id' | 'date'>) => void;
  deleteEBReading: (id: string) => void;
  addTicket: (ticket: Omit<Ticket, 'id' | 'status'>) => void;
  updateTicket: (id: string, ticket: Omit<Ticket, 'id' | 'status'>) => void;
  updateTicketStatus: (id: string, status: 'BOOKED' | 'CANCELLED') => void;
  deleteTicket: (id: string) => void;
  addDeposit: (deposit: Omit<Deposit, 'id'>) => void;
  updateDeposit: (id: string, deposit: Omit<Deposit, 'id'>) => void;
  deleteDeposit: (id: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addAuditLog: (action: string) => void;
  archiveAndPurgeAuditLogs: (daysToKeep?: number) => Promise<string | void>;
  processAutoRenewals: () => void;
}

export const useAppStore = create<AppState>()(
  persist((set, get) => ({
    expenses: [],
    tasks: [],
    tickets: [],
    deposits: [],
    ebReadings: [],
    auditLogs: [],
    theme: 'light',
    addAuditLog: (action) =>
      set((state) => ({
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    addExpense: (expense) =>
      set((state) => ({
        expenses: [
          { ...expense, id: Math.random().toString(36).substr(2, 9) },
          ...state.expenses,
        ],
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Added ${expense.type} entry: Rs. ${expense.amount} for ${expense.category}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    updateExpense: (id, expense) =>
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? { ...expense, id } : e)),
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Updated entry for ${expense.category}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    deleteExpense: (id) =>
      set((state) => {
        const target = state.expenses.find((e) => e.id === id);
        return {
          expenses: state.expenses.filter((e) => e.id !== id),
          auditLogs: [
            { id: Math.random().toString(36).substr(2, 9), action: `Deleted ${target?.type || ''} entry: ${target?.category || 'Unknown'}`, date: new Date().toLocaleString() },
            ...state.auditLogs,
          ],
        };
      }),
    addTask: (task) =>
      set((state) => ({
        tasks: [{ ...task, id: Math.random().toString(36).substr(2, 9), status: 'PLANNED' }, ...state.tasks],
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Added task: ${task.title}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    updateTask: (id, task) =>
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...task } : t)),
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Updated task: ${task.title}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    deleteTask: (id) =>
      set((state) => {
        const target = state.tasks.find((t) => t.id === id);
        return {
          tasks: state.tasks.filter((t) => t.id !== id),
          auditLogs: [
            { id: Math.random().toString(36).substr(2, 9), action: `Deleted task: ${target?.title || 'Unknown'}`, date: new Date().toLocaleString() },
            ...state.auditLogs,
          ],
        };
      }),
    updateTaskStatus: (id, status) =>
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Task marked ${status.toLowerCase()}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    addTicket: (ticket) =>
      set((state) => ({
        tickets: [{ ...ticket, id: Math.random().toString(36).substr(2, 9), status: 'BOOKED' }, ...state.tickets],
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `${ticket.type} ticket added`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    updateTicket: (id, ticket) =>
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? { ...t, ...ticket } : t)),
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `${ticket.type} ticket updated`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    updateTicketStatus: (id, status) =>
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Ticket marked ${status.toLowerCase()}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    deleteTicket: (id) =>
      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: 'Ticket deleted', date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    addDeposit: (deposit) =>
      set((state) => ({
        deposits: [{ ...deposit, id: Math.random().toString(36).substr(2, 9) }, ...state.deposits],
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Added ${deposit.type} deposit at ${deposit.bank}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    updateDeposit: (id, deposit) =>
      set((state) => ({
        deposits: state.deposits.map((d) => (d.id === id ? { ...deposit, id } : d)),
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Updated ${deposit.type} deposit at ${deposit.bank}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    deleteDeposit: (id) =>
      set((state) => {
        const target = state.deposits.find((d) => d.id === id);
        return {
          deposits: state.deposits.filter((d) => d.id !== id),
          auditLogs: [
            { id: Math.random().toString(36).substr(2, 9), action: `Deleted deposit: ${target?.bank || 'Unknown'}`, date: new Date().toLocaleString() },
            ...state.auditLogs,
          ],
        };
      }),
    addEBReading: (reading) =>
      set((state) => ({
        ebReadings: [{ ...reading, id: Math.random().toString(36).substr(2, 9), date: new Date().toLocaleDateString() }, ...state.ebReadings],
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Added EB reading for ${reading.units} units`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    updateEBReading: (id, reading) =>
      set((state) => ({
        ebReadings: state.ebReadings.map((entry) => (entry.id === id ? { ...entry, ...reading } : entry)),
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Updated EB reading for ${reading.units} units`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    deleteEBReading: (id) =>
      set((state) => {
        const target = state.ebReadings.find((entry) => entry.id === id);
        return {
          ebReadings: state.ebReadings.filter((entry) => entry.id !== id),
          auditLogs: [
            { id: Math.random().toString(36).substr(2, 9), action: `Deleted EB reading: ${target?.date || 'Unknown'}`, date: new Date().toLocaleString() },
            ...state.auditLogs,
          ],
        };
      }),
    setTheme: (theme) =>
      set((state) => ({
        theme,
        auditLogs: [
          { id: Math.random().toString(36).substr(2, 9), action: `Theme changed to ${theme}`, date: new Date().toLocaleString() },
          ...state.auditLogs,
        ],
      })),
    processAutoRenewals: () =>
      set((state) => {
        let hasChanges = false;
        const now = new Date().getTime();

        const updatedDeposits = state.deposits.map((deposit) => {
          if (deposit.autoRenewal && deposit.maturityDate) {
            let maturityTime = new Date(deposit.maturityDate).getTime();
            if (now >= maturityTime) {
              hasChanges = true;
              let newStartDate = new Date(deposit.maturityDate);
              let newMaturityDate = new Date(newStartDate.getTime() + deposit.durationDays * 24 * 60 * 60 * 1000);
              
              // Handle cases where multiple renewal periods have passed while the app was closed
              while (now >= newMaturityDate.getTime()) {
                newStartDate = newMaturityDate;
                newMaturityDate = new Date(newStartDate.getTime() + deposit.durationDays * 24 * 60 * 60 * 1000);
              }

              return {
                ...deposit,
                startDate: newStartDate.toISOString().split('T')[0],
                maturityDate: newMaturityDate.toISOString().split('T')[0],
                lastRenewedDate: new Date().toISOString().split('T')[0],
              };
            }
          }
          return deposit;
        });

        if (hasChanges) {
          return {
            deposits: updatedDeposits,
            auditLogs: [
              { id: Math.random().toString(36).substr(2, 9), action: 'Auto-renewed eligible deposits', date: new Date().toLocaleString() },
              ...state.auditLogs,
            ],
          };
        }
        return state;
      }),
    archiveAndPurgeAuditLogs: async (daysToKeep = 30) => {
      const state = get();
      const cutoffTime = new Date().getTime() - daysToKeep * 24 * 60 * 60 * 1000;

      const toKeep: AuditLog[] = [];
      const toArchive: AuditLog[] = [];

      state.auditLogs.forEach((log) => {
        const logTime = new Date(log.date).getTime();
        // Include invalid dates in archive to clean up corrupt data
        if (isNaN(logTime) || logTime < cutoffTime) {
          toArchive.push(log);
        } else {
          toKeep.push(log);
        }
      });

      if (toArchive.length === 0) return;

      try {
        const logsJson = JSON.stringify(toArchive, null, 2);
        const zipped = zipSync({ 'audit_logs.json': strToU8(logsJson) });

        // Safe conversion of potentially large Uint8Array to base64
        const CHUNK_SIZE = 0x8000; // 32768
        let result = '';
        for (let i = 0; i < zipped.length; i += CHUNK_SIZE) {
          const slice = zipped.subarray(i, Math.min(i + CHUNK_SIZE, zipped.length));
          result += String.fromCharCode.apply(null, Array.from(slice));
        }
        const base64Data = btoa(result);

        const fileName = `audit_logs_archive_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });

        set({ auditLogs: toKeep });

        // Log the archiving action itself
        get().addAuditLog(`Archived and purged ${toArchive.length} logs to Documents folder`);

        return writeResult.uri;
      } catch (e) {
        console.error('Failed to archive logs', e);
        throw e;
      }
    },
  }),
    {
      name: 'home-app-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sqliteStorage),
    })
);
