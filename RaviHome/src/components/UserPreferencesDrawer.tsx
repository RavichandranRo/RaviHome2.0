import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { arrowBackOutline, checkmark } from 'ionicons/icons';
import { useAppStore } from '../store/useAppStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';

interface UserPreferencesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThemeConfig {
  id: 'indigo' | 'teal' | 'green' | 'blue' | 'orange' | 'purple' | 'pink' | 'amber';
  name: string;
  color: string;
}

const UserPreferencesDrawer: React.FC<UserPreferencesDrawerProps> = ({ isOpen, onClose }) => {
  const store = useAppStore();
  const showNotification = useNotificationStore((state) => state.showNotification);

  // Local Theme State
  const [localTheme, setLocalTheme] = useState<'indigo' | 'teal' | 'green' | 'blue' | 'orange' | 'purple' | 'pink' | 'amber'>(
    store.themeColor as any || 'indigo'
  );

  // Sync with store when opened
  useEffect(() => {
    if (isOpen) {
      setLocalTheme(store.themeColor as any || 'indigo');
    }
  }, [isOpen, store]);

  const themes: ThemeConfig[] = [
    { id: 'indigo', name: 'Aura Indigo', color: '#6366f1' },
    { id: 'teal', name: 'Lara Teal', color: '#14b8a6' },
    { id: 'green', name: 'Lara Green', color: '#10b981' },
    { id: 'blue', name: 'Saga Blue', color: '#2196f3' },
    { id: 'orange', name: 'Vela Orange', color: '#f57c00' },
    { id: 'purple', name: 'Arya Purple', color: '#9c27b0' },
    { id: 'pink', name: 'Lara Pink', color: '#ec4899' },
    { id: 'amber', name: 'Lara Amber', color: '#f59e0b' }
  ];

  const handleSave = () => {
    store.setThemeColor(localTheme);

    // Update document data attribute to trigger CSS theme change
    document.documentElement.setAttribute('data-theme-color', localTheme);

    showNotification('success', 'Theme Updated', `Interface theme set to ${themes.find(t => t.id === localTheme)?.name}.`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[2000]"
          />

          {/* Sliding Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-white border-l border-slate-200 shadow-2xl z-[2001] flex flex-col overflow-hidden text-slate-800"
          >
            {/* Drawer Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <IonIcon icon={arrowBackOutline} className="text-lg" />
              </button>
              <h2 className="text-xl font-bold tracking-tight text-slate-800">User Preferences</h2>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Theme Selector */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Theme Selection</label>
                  <p className="text-xs text-slate-500 mt-1">Select a color scheme below to customize the navigation and interface highlights.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {themes.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setLocalTheme(t.id)}
                      className={`relative cursor-pointer rounded-2xl border-2 p-3 flex flex-col justify-between h-[110px] transition-all bg-slate-50 ${
                        localTheme === t.id ? 'border-indigo-600 bg-indigo-50/5' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Mock Card Preview */}
                      <div className="w-full h-10 bg-white border border-slate-200/60 rounded-lg flex overflow-hidden">
                        <div className="w-1/4 h-full bg-slate-900 border-r border-slate-100" />
                        <div className="flex-1 flex flex-col">
                          <div className="h-2.5 w-full" style={{ backgroundColor: t.color }} />
                          <div className="flex-1 p-1 space-y-1">
                            <div className="h-1 bg-slate-200 rounded w-2/3" />
                            <div className="h-1 bg-slate-100 rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[11px] font-bold text-slate-700">{t.name}</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            localTheme === t.id ? 'text-white' : 'border-slate-300 bg-white'
                          }`}
                          style={{
                            backgroundColor: localTheme === t.id ? t.color : 'white',
                            borderColor: localTheme === t.id ? t.color : '#cbd5e1'
                          }}
                        >
                          {localTheme === t.id && <IonIcon icon={checkmark} className="text-[10px]" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md active:scale-95"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                Save
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserPreferencesDrawer;
