import React, { useState, useEffect } from 'react';
import { Redirect, Route, useLocation } from 'react-router-dom';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  list, checkmarkDone, flash, train, wallet, cash, pieChart, lockClosed, settingsOutline,
  documentTextOutline, sparklesOutline, searchOutline, barChartOutline
} from 'ionicons/icons';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';
import { motion, AnimatePresence } from 'framer-motion';

import EBReadingTab from './pages/EBReadingTab';
import PlannedWorksTab from './pages/PlannedWorksTab';
import CompletedWorksTab from './pages/CompletedWorksTab';
import AuditLogsTab from './pages/AuditLogsTab';
import TravelTicketsTab from './pages/TravelTicketsTab';
import PaymentTab from './pages/PaymentTab';
import DepositsTab from './pages/DepositsTab';
import DashboardTab from './pages/DashboardTab';
import StatisticsTab from './pages/StatisticsTab';
import SettingsTab from './pages/SettingsTab';
import { useAppStore } from './store/useAppStore';
import { useNotificationStore } from './store/useNotificationStore';

import AIPopupOverlay from './components/AIPopupOverlay';
import AIAssistant from './components/AIAssistant';

import '@ionic/react/css/core.css';
import './theme/tailwind.css';
import './App.css';

setupIonicReact();

const HeaderBar: React.FC<{ timeString: string }> = ({ timeString }) => {
  const location = useLocation();
  const setAssistantOpen = useNotificationStore(state => state.setAssistantOpen);

  const getTabName = (path: string) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/planned': return 'Planned';
      case '/completed': return 'Completed';
      case '/eb': return 'EB';
      case '/travel': return 'Travel';
      case '/payments': return 'Payments';
      case '/deposits': return 'Deposits';
      case '/statistics': return 'Statistics';
      case '/logs': return 'Logs';
      case '/settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const tabName = getTabName(location.pathname);

  return (
    <div className="top-header-bar flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800">
      {/* Logo & Region Info */}
      <div className="flex items-center">
        {/* 4-Color diamond logo */}
        <svg width="28" height="28" viewBox="0 0 24 24" className="transform rotate-45 select-none mr-3">
          <rect x="2" y="2" width="9" height="9" fill="#ef4444" rx="1.5" />
          <rect x="13" y="2" width="9" height="9" fill="#22c55e" rx="1.5" />
          <rect x="2" y="13" width="9" height="9" fill="#3b82f6" rx="1.5" />
          <rect x="13" y="13" width="9" height="9" fill="#eab308" rx="1.5" />
        </svg>
        <div className="flex flex-col select-none">
          <span className="text-sm font-black tracking-wider text-white">Home App</span>
          <div className="flex items-center gap-1 text-[10px] text-slate-300 font-bold mt-0.5">
            <span>Selected Tab : {tabName}</span>
          </div>
        </div>
      </div>

      {/* Clock & Welcome Details */}
      <div className="hidden md:flex items-center">
        <div className="flex flex-col text-right text-xs opacity-90 select-none mr-6">
          <span className="font-semibold text-slate-300">Welcome ravi user</span>
          <span className="font-bold text-white mt-0.5">{timeString}</span>
        </div>
      </div>

      {/* Search bar, AI Assistant trigger button */}
      <div className="flex items-center gap-4">
        {/* Search Input */}
        <div className="relative hidden sm:block">
          <IonIcon icon={searchOutline} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
          <input
            type="text"
            placeholder="Search..."
            className="w-48 sm:w-64 bg-white/10 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 focus:border-white/30 transition-all font-medium"
          />
        </div>

        {/* AI Assistant Sparks Trigger Button */}
        <button
          onClick={() => setAssistantOpen(true)}
          className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 border border-white/20 flex items-center justify-center text-white shadow-md hover:scale-105 active:scale-95 transition-all relative overflow-hidden"
          title="AI Assistant"
        >
          <IonIcon icon={sparklesOutline} className="text-base animate-pulse" />
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeProgress, setWelcomeProgress] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [timeString, setTimeString] = useState('');

  const processAutoRenewals = useAppStore(state => state.processAutoRenewals);
  const showNotification = useNotificationStore(state => state.showNotification);
  const themeColor = useAppStore(state => state.themeColor);

  const performBiometricAuth = async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsAuthenticated(true);
      showNotification('success', 'Logged In', 'Welcome back to Home App!');
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      if (result.isAvailable) {
        await NativeBiometric.verifyIdentity({
          reason: 'Authenticate to access your secure data',
          title: 'App Lock',
        });
        setIsAuthenticated(true);
        showNotification('success', 'Authenticated', 'Welcome back to Home App!');
      } else {
        setIsAuthenticated(true); 
        showNotification('success', 'Logged In', 'Welcome back to Home App!');
      }
    } catch (error) {
      console.error("Biometric auth failed", error);
      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    // Set theme on mount/update
    document.documentElement.setAttribute('data-theme-color', themeColor);
  }, [themeColor]);

  useEffect(() => {
    // Digital clock timer
    const updateTime = () => {
      const now = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[now.getMonth()];
      const day = now.getDate();
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setTimeString(`${month} ${day}, ${year}, ${hours}:${minutes}`);
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    // Startup welcome bar
    const interval = setInterval(() => {
      setWelcomeProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowWelcome(false);
            performBiometricAuth();
          }, 3500);
          return 100;
        }
        return prev + 4;
      });
    }, 85);

    processAutoRenewals();

    return () => {
      clearInterval(clockInterval);
      clearInterval(interval);
    };
  }, []);

  return (
    <IonApp>
      {/* Dynamic Overlay Components */}
      <AIPopupOverlay />
      {!showWelcome && isAuthenticated && <AIAssistant />}

      {/* Custom Launching Welcome Screen */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-8 text-white text-center"
          >
            <div />

            {/* Glowing Logo & Title */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                transition={{ duration: 1, type: 'spring' }}
                className="w-24 h-24 rounded-full bg-indigo-600/30 border border-indigo-400/40 shadow-[0_0_50px_rgba(99,102,241,0.5)] flex items-center justify-center mb-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                >
                  <IonIcon icon={sparklesOutline} className="text-5xl text-indigo-300" />
                </motion.div>
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-black tracking-wider bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent drop-shadow-md"
              >
                Home App
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm tracking-widest text-indigo-300/80 font-bold uppercase mt-2"
              >
                Automated Premium Manager
              </motion.p>
            </div>

            {/* Bottom Progress Bar */}
            <div className="w-full max-w-xs space-y-3 pb-8">
              <div className="flex justify-between items-center text-xs text-indigo-300/70 font-semibold px-1">
                <span>SYSTEM LOADING...</span>
                <span>{welcomeProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                  style={{ width: `${welcomeProgress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Screen */}
      {!isAuthenticated && !showWelcome && (
        <div className="fixed inset-0 z-[9000] flex flex-col items-center justify-center bg-gradient-to-tr from-slate-50 via-slate-100 to-indigo-50/30">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center p-8 bg-white/80 border border-slate-200/50 rounded-[32px] shadow-2xl backdrop-blur-md max-w-sm w-full mx-4"
          >
            <IonIcon icon={lockClosed} className="text-5xl text-indigo-600 mb-4" />
            <h2 className="text-2xl font-black text-slate-800 mb-2">Workspace Secured</h2>
            <p className="text-sm text-slate-500 mb-6 font-medium">Verify your biometrics or click unlock to access secure database storage.</p>
            <button
              onClick={performBiometricAuth}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold tracking-wide py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
            >
              Unlock Vault
            </button>
          </motion.div>
        </div>
      )}

      {/* App Routes & Tabs */}
      <IonReactRouter>
        {!showWelcome && isAuthenticated && <HeaderBar timeString={timeString} />}
        <IonTabs className="app-vertical-tabs">
          <IonRouterOutlet>
            <Route exact path="/eb">
              <EBReadingTab />
            </Route>
            <Route exact path="/planned">
              <PlannedWorksTab />
            </Route>
            <Route exact path="/completed">
              <CompletedWorksTab />
            </Route>
            <Route exact path="/travel">
              <TravelTicketsTab />
            </Route>
            <Route exact path="/payments">
              <PaymentTab />
            </Route>
            <Route exact path="/deposits">
              <DepositsTab />
            </Route>
            <Route exact path="/dashboard">
              <DashboardTab />
            </Route>
            <Route exact path="/logs">
              <AuditLogsTab />
            </Route>
            <Route exact path="/statistics">
              <StatisticsTab />
            </Route>
            <Route exact path="/settings">
              <SettingsTab />
            </Route>
            <Route exact path="/">
              <Redirect to="/dashboard" />
            </Route>
          </IonRouterOutlet>

          <IonTabBar slot="bottom" className="app-sidebar-tabs">
            <IonTabButton tab="dashboard" href="/dashboard">
              <IonIcon icon={pieChart} />
              <IonLabel>Dashboard</IonLabel>
            </IonTabButton>
            <IonTabButton tab="planned" href="/planned">
              <IonIcon icon={list} />
              <IonLabel>Planned</IonLabel>
            </IonTabButton>
            <IonTabButton tab="completed" href="/completed">
              <IonIcon icon={checkmarkDone} />
              <IonLabel>Completed</IonLabel>
            </IonTabButton>
            <IonTabButton tab="eb" href="/eb">
              <IonIcon icon={flash} />
              <IonLabel>EB</IonLabel>
            </IonTabButton>
            <IonTabButton tab="travel" href="/travel">
              <IonIcon icon={train} />
              <IonLabel>Travel</IonLabel>
            </IonTabButton>
            <IonTabButton tab="payments" href="/payments">
              <IonIcon icon={wallet} />
              <IonLabel>Payments</IonLabel>
            </IonTabButton>
            <IonTabButton tab="deposits" href="/deposits">
              <IonIcon icon={cash} />
              <IonLabel>Deposits</IonLabel>
            </IonTabButton>
            <IonTabButton tab="statistics" href="/statistics">
              <IonIcon icon={barChartOutline} />
              <IonLabel>Statistics</IonLabel>
            </IonTabButton>
            <IonTabButton tab="logs" href="/logs">
              <IonIcon icon={documentTextOutline} />
              <IonLabel>Logs</IonLabel>
            </IonTabButton>
            <IonTabButton tab="settings" href="/settings">
              <IonIcon icon={settingsOutline} />
              <IonLabel>Settings</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
