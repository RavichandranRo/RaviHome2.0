import React, { useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/react';
import { barChartOutline, flashOutline, statsChartOutline } from 'ionicons/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SUB_TABS = [
  'Asset Health Summary',
  'Lamp Burn Hours',
  'Lamp Burn Summary',
  'Energy Savings',
  'Assets Life Span',
  'Cabinet Health Summary',
  'Cabinet Statistics',
  'Cabinet Energy Consumption'
];

const LEGEND_ITEMS = [
  { name: 'Total Assets', color: '#3b82f6' },
  { name: 'Maintenance', color: '#1e3a8a' },
  { name: 'Power Failure', color: '#22c55e' },
  { name: 'Power Suspect', color: '#eab308' },
  { name: 'Not Communicating', color: '#06b6d4' },
  { name: 'Night Outage', color: '#f59e0b' },
  { name: 'Voltage Fluctuation', color: '#f97316' },
  { name: 'Day Burner', color: '#86efac' },
  { name: 'Invalid GPS', color: '#ef4444' },
  { name: 'Communicating', color: '#0f766e' },
  { name: 'No Schedule', color: '#a855f7' },
  { name: 'Healthy', color: '#ec4899' }
];

// Generate visual matching line data from May 29 to Jun 26
const CHART_DATA = [
  { date: 'May 29', 'Total Assets': 310, 'Healthy': 298, 'No Schedule': 215, 'Invalid GPS': 155, 'Communicating': 45, 'Maintenance': 28, 'Power Failure': 18 },
  { date: 'May 31', 'Total Assets': 312, 'Healthy': 300, 'No Schedule': 214, 'Invalid GPS': 157, 'Communicating': 44, 'Maintenance': 27, 'Power Failure': 19 },
  { date: 'Jun 2', 'Total Assets': 311, 'Healthy': 299, 'No Schedule': 215, 'Invalid GPS': 156, 'Communicating': 46, 'Maintenance': 29, 'Power Failure': 17 },
  { date: 'Jun 4', 'Total Assets': 310, 'Healthy': 298, 'No Schedule': 216, 'Invalid GPS': 155, 'Communicating': 45, 'Maintenance': 28, 'Power Failure': 18 },
  { date: 'Jun 6', 'Total Assets': 311, 'Healthy': 299, 'No Schedule': 215, 'Invalid GPS': 156, 'Communicating': 46, 'Maintenance': 29, 'Power Failure': 17 },
  { date: 'Jun 8', 'Total Assets': 308, 'Healthy': 295, 'No Schedule': 213, 'Invalid GPS': 155, 'Communicating': 48, 'Maintenance': 28, 'Power Failure': 20 },
  { date: 'Jun 10', 'Total Assets': 310, 'Healthy': 298, 'No Schedule': 215, 'Invalid GPS': 156, 'Communicating': 45, 'Maintenance': 27, 'Power Failure': 18 },
  { date: 'Jun 12', 'Total Assets': 307, 'Healthy': 294, 'No Schedule': 214, 'Invalid GPS': 154, 'Communicating': 47, 'Maintenance': 29, 'Power Failure': 19 },
  { date: 'Jun 14', 'Total Assets': 309, 'Healthy': 296, 'No Schedule': 215, 'Invalid GPS': 155, 'Communicating': 46, 'Maintenance': 28, 'Power Failure': 18 },
  { date: 'Jun 16', 'Total Assets': 309, 'Healthy': 297, 'No Schedule': 214, 'Invalid GPS': 156, 'Communicating': 45, 'Maintenance': 27, 'Power Failure': 17 },
  { date: 'Jun 18', 'Total Assets': 310, 'Healthy': 298, 'No Schedule': 215, 'Invalid GPS': 156, 'Communicating': 46, 'Maintenance': 28, 'Power Failure': 18 },
  { date: 'Jun 20', 'Total Assets': 309, 'Healthy': 297, 'No Schedule': 214, 'Invalid GPS': 155, 'Communicating': 47, 'Maintenance': 29, 'Power Failure': 19 },
  { date: 'Jun 22', 'Total Assets': 310, 'Healthy': 298, 'No Schedule': 215, 'Invalid GPS': 156, 'Communicating': 45, 'Maintenance': 28, 'Power Failure': 18 },
  { date: 'Jun 24', 'Total Assets': 311, 'Healthy': 299, 'No Schedule': 216, 'Invalid GPS': 155, 'Communicating': 46, 'Maintenance': 27, 'Power Failure': 17 },
  { date: 'Jun 26', 'Total Assets': 310, 'Healthy': 298, 'No Schedule': 215, 'Invalid GPS': 156, 'Communicating': 45, 'Maintenance': 28, 'Power Failure': 18 }
];

const StatisticsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState(0);
  const [timeInterval, setTimeInterval] = useState('Last 1 Month');

  return (
    <IonPage>
      <IonHeader className="ion-no-border select-none">
        <IonToolbar className="bg-slate-50">
          <IonTitle>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statistics</span>
              <span className="text-[10px] font-bold text-slate-400">&gt;</span>
              <span className="app-page-title text-[15px] font-extrabold text-slate-800 border-b-0 pb-0">{SUB_TABS[activeSubTab]}</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-slate-50">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-6">
          
          {/* Top horizontal sub-tabs list matching Image 3 layout */}
          <div className="overflow-x-auto select-none border-b border-slate-200">
            <div className="flex gap-6 pb-2.5 min-w-max px-1">
              {SUB_TABS.map((tab, idx) => {
                const isActive = activeSubTab === idx;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(idx)}
                    className={`text-xs font-bold transition-all relative pb-2 px-0.5 outline-none border-none bg-transparent cursor-pointer flex items-center gap-1.5 ${
                      isActive ? 'text-slate-800 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <IonIcon icon={idx === 0 || idx === 5 ? statsChartOutline : barChartOutline} className="text-sm" />
                    <span>{tab}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Interval Selector */}
          <div className="flex flex-col gap-1.5 select-none w-full max-w-[200px]">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Interval</label>
            <div className="relative">
              <select
                value={timeInterval}
                onChange={(e) => setTimeInterval(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 cursor-pointer appearance-none"
              >
                <option value="Last 1 Month">Last 1 Month</option>
                <option value="Last 3 Months">Last 3 Months</option>
                <option value="Last 6 Months">Last 6 Months</option>
                <option value="Last 1 Year">Last 1 Year</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="relative w-full h-[320px] bg-slate-50/50 rounded-xl p-3 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 400]} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 'bold' }} />
                {LEGEND_ITEMS.map((item) => (
                  <Line
                    key={item.name}
                    type="monotone"
                    dataKey={item.name}
                    stroke={item.color}
                    strokeWidth={2}
                    dot={{ r: 2.5, strokeWidth: 1 }}
                    activeDot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom legend grid matching Image 3 */}
          <div className="select-none grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3.5 pt-4 border-t border-slate-100">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.name} className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default StatisticsTab;
