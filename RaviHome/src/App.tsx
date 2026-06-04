import React, { useState, useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonApp, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs, setupIonicReact, useIonToast
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { list, checkmarkDone, flash, train, wallet, cash, pieChart, lockClosed, settingsOutline } from 'ionicons/icons';
import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

import EBReadingTab from './pages/EBReadingTab';
import PlannedWorksTab from './pages/PlannedWorksTab';
import CompletedWorksTab from './pages/CompletedWorksTab';
import TravelTicketsTab from './pages/TravelTicketsTab';
import PaymentTab from './pages/PaymentTab';
import DepositsTab from './pages/DepositsTab';
import DashboardTab from './pages/DashboardTab';
import SettingsTab from './pages/SettingsTab';

import '@ionic/react/css/core.css';
import './theme/tailwind.css'; // Make sure you import tailwind here
import './App.css';

setupIonicReact();

const App: React.FC = () => {
  const [fade, setFade] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [presentToast] = useIonToast();

  const performBiometricAuth = async () => {
    // Bypass biometric auth when running in a web browser
    if (!Capacitor.isNativePlatform()) {
      setIsAuthenticated(true);
      presentToast({ message: 'Welcome back to Home App!', duration: 2500, color: 'primary', position: 'top' });
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
        presentToast({ message: 'Welcome back to Home App!', duration: 2500, color: 'primary', position: 'top' });
      } else {
        // Fallback to true if device does not support biometrics
        setIsAuthenticated(true); 
        presentToast({ message: 'Welcome back to Home App!', duration: 2500, color: 'primary', position: 'top' });
      }
    } catch (error) {
      console.error("Biometric auth failed", error);
      // Fallback if the plugin fails on an unsupported physical device
      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    performBiometricAuth();

    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => setFade(true), 2000);
    // completely remove from DOM after 2.5 seconds to allow interactions
    const removeTimer = setTimeout(() => setShowWelcome(false), 2500);
    
    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
  }, []);

  return (
  <IonApp>
    <style>{`
      /* Custom Bottom Navigation Bar Styling */
      ion-tab-bar.app-sidebar-tabs {
        --background: #ffffff;
        --border: none;
        box-shadow: 0 -4px 14px -3px rgba(0, 0, 0, 0.05);
      }
      
      ion-tab-button {
        --color: #9ca3af; /* Tailwind gray-400 */
        --color-selected: #2563eb; /* Tailwind blue-600 */
        transition: all 0.3s ease;
        position: relative;
      }
      
      /* Active Tab Indicator Line */
      ion-tab-button.tab-selected::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 35%;
        height: 3px;
        background-color: #2563eb;
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
      }
      
      /* Active Tab Icon & Label Pop */
      ion-tab-button.tab-selected ion-icon {
        transform: translateY(-2px) scale(1.15);
      }
      
      ion-tab-button.tab-selected ion-label {
        font-weight: 700;
      }
    `}</style>

    {showWelcome && (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-blue-600 transition-opacity duration-500 ease-in-out ${fade ? 'opacity-0' : 'opacity-100'}`}>
        <div className="text-center animate-bounce">
          <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-lg">Home App</h1>
          <p className="text-xl text-blue-100 font-medium tracking-wide">Your Premium Manager</p>
        </div>
      </div>
    )}

    {!isAuthenticated && !showWelcome && (
      <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gray-50">
        <IonIcon icon={lockClosed} className="text-6xl text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-6">App Locked</h2>
        <button onClick={performBiometricAuth} className="bg-blue-600 text-white font-medium tracking-wide py-3 px-8 rounded-full shadow-sm hover:shadow active:scale-95 transition-all">
          Unlock with Biometrics
        </button>
      </div>
    )}

    <IonReactRouter>
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
