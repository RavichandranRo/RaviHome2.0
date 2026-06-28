import React from 'react';
import { IonPage, IonContent, IonIcon, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { useAppStore } from '../store/useAppStore';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import {
  flash,
  leafOutline,
  refreshOutline,
  downloadOutline,
  printOutline,
  gridOutline,
  pieChart,
  settingsOutline
} from 'ionicons/icons';

const DashboardTab: React.FC = () => {
  const expenses = useAppStore(state => state.expenses);
  const tasks = useAppStore(state => state.tasks);
  const tickets = useAppStore(state => state.tickets);
  const deposits = useAppStore(state => state.deposits);

  // Colors matching the dashboard screenshot aesthetic
  const CHARTS_COLORS = ['#c084fc', '#818cf8', '#34d399', '#fbbf24', '#f87171'];

  // --- DATA COMPUTATIONS ---
  // Donut 1: Expense breakdown (category summary)
  const categoryTotals = expenses.reduce((acc: Record<string, number>, curr) => {
    if (curr.type === 'DEBIT') {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
    }
    return acc;
  }, {});
  
  const expenseData = Object.keys(categoryTotals).map((key, i) => ({
    name: key,
    value: categoryTotals[key],
    color: CHARTS_COLORS[i % CHARTS_COLORS.length]
  }));

  const finalExpenseData = expenseData.length > 0 ? expenseData : [
    { name: 'Bills', value: 6, color: '#c084fc' },
    { name: 'Food', value: 175, color: '#818cf8' },
    { name: 'Travel', value: 150, color: '#34d399' },
    { name: 'Rent', value: 11, color: '#fbbf24' },
    { name: 'Others', value: 36, color: '#f87171' }
  ];

  // Donut 2: Tasks Completion Summary
  const plannedTasks = tasks.filter(t => t.status === 'PLANNED').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const finalTasksData = (plannedTasks > 0 || completedTasks > 0) ? [
    { name: 'Planned', value: plannedTasks, color: '#fbbf24' },
    { name: 'Completed', value: completedTasks, color: '#34d399' }
  ] : [
    { name: 'Planned', value: 6, color: '#fbbf24' },
    { name: 'Completed', value: 174, color: '#34d399' }
  ];

  // Donut 5: Deposits Breakdown
  const fdCount = deposits.filter(d => d.type === 'FD').length;
  const rdCount = deposits.filter(d => d.type === 'RD').length;
  const finalDepositsData = (fdCount > 0 || rdCount > 0) ? [
    { name: 'FD Deposits', value: fdCount, color: '#c084fc' },
    { name: 'RD Deposits', value: rdCount, color: '#34d399' }
  ] : [
    { name: 'FD', value: 75, color: '#c084fc' },
    { name: 'RD', value: 100, color: '#34d399' }
  ];

  // Comparative Metric 3: Monthly Expenses
  const currentMonthExpenses = expenses
    .filter(e => e.type === 'DEBIT' && new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + e.amount, 0) || 1200;
  
  const lastMonthExpenses = expenses
    .filter(e => e.type === 'DEBIT' && new Date(e.date).getMonth() === (new Date().getMonth() - 1 + 12) % 12)
    .reduce((sum, e) => sum + e.amount, 0) || 245400;

  // Comparative Metric 4: Deposits projected growth
  const baseSavings = deposits.reduce((sum, d) => sum + d.amount, 0) || 13500;
  const interestGrowth = deposits.reduce((sum, d) => sum + (d.amount * (1 + (d.roi / 100))), 0) || 6600;

  // Node Status Bar Chart (Total debit amount per category)
  const categoryAmounts = expenses.reduce((acc: Record<string, number>, curr) => {
    if (curr.type === 'DEBIT') {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    }
    return acc;
  }, {});

  const barChartData = Object.keys(categoryAmounts).map(key => ({
    name: key,
    amount: categoryAmounts[key]
  }));

  const finalBarChartData = barChartData.length > 0 ? barChartData : [
    { name: 'Bills', amount: 125 },
    { name: 'Food', amount: 6 },
    { name: 'Travel', amount: 5 },
    { name: 'Rent', amount: 15 },
    { name: 'Health', amount: 13 },
    { name: 'China', amount: 2 },
    { name: 'Solar_Test', amount: 10 }
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Dashboard</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
        <div className="travel-shell space-y-6">
          {/* Row of 5 Donut & Comparative Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* 1. Expense Breakdown Category Summary */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[180px]">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expense Summary</h3>
              <div className="flex items-center gap-4 flex-1 mt-2">
                <div className="w-16 h-16 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={finalExpenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={30}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {finalExpenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 overflow-hidden space-y-0.5">
                  {finalExpenseData.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 truncate">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate">{item.name}</span>
                      <span className="text-slate-400 ml-auto shrink-0">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Tasks Summary */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[180px]">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasks Summary</h3>
              <div className="flex items-center gap-4 flex-1 mt-2">
                <div className="w-16 h-16 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={finalTasksData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={30}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {finalTasksData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 overflow-hidden space-y-0.5">
                  {finalTasksData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                      <span className="text-slate-400 ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Monthly Outflow (Last Month vs Current Month) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[180px]">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Outflow</h3>
              <div className="flex items-center gap-4 flex-1 mt-2">
                <div className="bg-amber-100/60 p-3 rounded-2xl text-amber-600 shrink-0">
                  <IonIcon icon={flash} className="text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400">LAST MONTH</div>
                  <div className="text-xs font-extrabold text-slate-700">Rs. {lastMonthExpenses.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-2">THIS MONTH</div>
                  <div className="text-xs font-extrabold text-slate-700">Rs. {currentMonthExpenses.toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-center justify-center text-emerald-600 font-extrabold text-xs ml-auto shrink-0 bg-emerald-50 px-2 py-1.5 rounded-xl">
                  <span>99%</span>
                </div>
              </div>
            </div>

            {/* 4. Deposits Savings Growths */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[180px]">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deposits growth</h3>
              <div className="flex items-center gap-4 flex-1 mt-2">
                <div className="bg-emerald-100/60 p-3 rounded-2xl text-emerald-600 shrink-0">
                  <IonIcon icon={leafOutline} className="text-2xl" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400">BASE VALUE</div>
                  <div className="text-xs font-extrabold text-slate-700">Rs. {baseSavings.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-slate-400 mt-2">WITH INTEREST</div>
                  <div className="text-xs font-extrabold text-slate-700">Rs. {interestGrowth.toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-center justify-center text-emerald-600 font-extrabold text-xs ml-auto shrink-0 bg-emerald-50 px-2 py-1.5 rounded-xl">
                  <span>51%</span>
                </div>
              </div>
            </div>

            {/* 5. Deposits Breakdown */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-[180px]">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deposits Breakdown</h3>
              <div className="flex items-center gap-4 flex-1 mt-2">
                <div className="w-16 h-16 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={finalDepositsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={30}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {finalDepositsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 overflow-hidden space-y-0.5">
                  {finalDepositsData.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                      <span className="text-slate-400 ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Full-width Bar Chart */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-700 tracking-tight">Expenses Distribution Bar Chart</h3>
              <div className="flex items-center gap-3 text-slate-500 text-lg">
                <button className="p-1 hover:bg-slate-200/60 rounded transition-colors"><IonIcon icon={refreshOutline} /></button>
                <button className="p-1 hover:bg-slate-200/60 rounded transition-colors"><IonIcon icon={downloadOutline} /></button>
                <button className="p-1 hover:bg-slate-200/60 rounded transition-colors"><IonIcon icon={printOutline} /></button>
                <button className="p-1 hover:bg-slate-200/60 rounded transition-colors"><IonIcon icon={gridOutline} /></button>
              </div>
            </div>
            <div className="flex-1 p-6 flex flex-col items-center justify-center">
              <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={finalBarChartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} />
                    <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9/60' }} contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', fontSize: '11px' }} />
                    <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-bold text-slate-500">
                <span className="w-3 h-3 bg-red-500 rounded-sm" />
                <span>Expenses Incurred per Category (Rs.)</span>
              </div>
            </div>
          </div>

          {/* Bottom Split Summaries tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Table 1: Deposits Maturity Summary */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-700 tracking-tight">Maturity Summary - Deposits</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[10px] tracking-wider uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3">Bank</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Maturity Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deposits.length > 0 ? (
                      deposits.slice(0, 4).map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/40">
                          <td className="px-6 py-3 font-bold text-slate-800">{d.bank}</td>
                          <td className="px-6 py-3">{d.type}</td>
                          <td className="px-6 py-3 font-bold">Rs. {d.amount.toLocaleString()}</td>
                          <td className="px-6 py-3 text-slate-400">{d.maturityDate || 'N/A'}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      [
                        { bank: 'SBI Bank', type: 'FD', amount: 50000, date: '2026-12-10' },
                        { bank: 'HDFC Bank', type: 'RD', amount: 15000, date: '2026-10-05' },
                      ].map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50/40">
                          <td className="px-6 py-3 font-bold text-slate-800">{d.bank}</td>
                          <td className="px-6 py-3">{d.type}</td>
                          <td className="px-6 py-3 font-bold">Rs. {d.amount.toLocaleString()}</td>
                          <td className="px-6 py-3 text-slate-400">{d.date}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Travel Tickets Status */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-700 tracking-tight">Travel Transit Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 text-[10px] tracking-wider uppercase font-bold">
                    <tr>
                      <th className="px-6 py-3">PNR</th>
                      <th className="px-6 py-3">Mode</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Fare</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.length > 0 ? (
                      tickets.slice(0, 4).map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/40">
                          <td className="px-6 py-3 font-bold text-slate-800">{t.pnr || 'N/A'}</td>
                          <td className="px-6 py-3 font-bold">{t.type}</td>
                          <td className="px-6 py-3 text-slate-400">{new Date(t.time).toLocaleDateString()}</td>
                          <td className="px-6 py-3 font-bold">Rs. {t.fare}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.status === 'BOOKED' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                t.status === 'BOOKED' ? 'bg-blue-500' : 'bg-red-500'
                              }`} />
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      [
                        { pnr: '4289053123', type: 'TRAIN', date: '2026-06-20', fare: 850, status: 'BOOKED' },
                        { pnr: 'BUSAX45091', type: 'BUS', date: '2026-06-25', fare: 1200, status: 'BOOKED' },
                      ].map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50/40">
                          <td className="px-6 py-3 font-bold text-slate-800">{t.pnr}</td>
                          <td className="px-6 py-3 font-bold">{t.type}</td>
                          <td className="px-6 py-3 text-slate-400">{t.date}</td>
                          <td className="px-6 py-3 font-bold">Rs. {t.fare}</td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default DashboardTab;
