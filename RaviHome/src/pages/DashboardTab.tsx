import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonIcon } from '@ionic/react';
import { useAppStore } from '../store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import {
  sparklesOutline,
  walletOutline,
  cashOutline,
  trainOutline,
  checkmarkCircleOutline,
  trendingUpOutline,
  trendingDownOutline,
  flashOutline,
} from 'ionicons/icons';

const DashboardTab: React.FC = () => {
  const expenses = useAppStore(state => state.expenses);
  const tasks = useAppStore(state => state.tasks);
  const tickets = useAppStore(state => state.tickets);
  const deposits = useAppStore(state => state.deposits);
  const ebReadings = useAppStore(state => state.ebReadings);

  // 1. KPI Calculations
  const totalIncome = expenses.filter(e => e.type === 'CREDIT').reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenses.filter(e => e.type === 'DEBIT').reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const totalFD = deposits.filter(d => d.type === 'FD').reduce((sum, d) => sum + d.amount, 0);
  const totalRD = deposits.filter(d => d.type === 'RD').reduce((sum, d) => sum + d.amount, 0);
  const totalSavings = totalFD + totalRD;

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const upcomingTickets = tickets.filter(t => t.status === 'BOOKED' && new Date(t.time).getTime() > Date.now());

  // 2. Prepare dynamic AI insights
  const generateAIInsights = () => {
    const insights = [];

    // Savings insights
    if (totalSavings === 0) {
      insights.push({
        id: 'savings',
        text: 'No active deposits found. SBI offers up to 7.00% FD rates. Open a Fixed Deposit to grow savings.',
        icon: cashOutline,
        color: 'text-amber-500 bg-amber-50',
      });
    } else if (totalSavings < 50000) {
      insights.push({
        id: 'savings-low',
        text: `You have active deposits worth Rs. ${totalSavings}. Consider auto-renewals to maximize interest growth.`,
        icon: cashOutline,
        color: 'text-indigo-600 bg-indigo-50',
      });
    }

    // Travel insights
    if (upcomingTickets.length > 0) {
      const nextTrip = upcomingTickets[0];
      const tripDate = new Date(nextTrip.time).toLocaleDateString();
      insights.push({
        id: 'travel',
        text: `Upcoming ${nextTrip.type.toLowerCase()} trip scheduled for ${tripDate}. Check live PNR status in Travel tab.`,
        icon: trainOutline,
        color: 'text-blue-600 bg-blue-50',
      });
    }

    // Task completion insights
    if (totalTasks > 0 && taskCompletionRate < 50) {
      insights.push({
        id: 'tasks-low',
        text: `Your task completion rate is ${taskCompletionRate}%. You have ${totalTasks - completedTasks} planned items pending.`,
        icon: checkmarkCircleOutline,
        color: 'text-rose-500 bg-rose-50',
      });
    } else if (totalTasks > 0 && taskCompletionRate >= 70) {
      insights.push({
        id: 'tasks-high',
        text: `Outstanding efficiency! Completed ${completedTasks} of ${totalTasks} tasks (${taskCompletionRate}% rate). Keep it up!`,
        icon: checkmarkCircleOutline,
        color: 'text-emerald-600 bg-emerald-50',
      });
    }

    // EB Readings insights
    if (ebReadings.length > 0) {
      const latestEB = ebReadings[0];
      if (latestEB.units > 250) {
        insights.push({
          id: 'eb-high',
          text: `High power bill logged: ${latestEB.units} units (Rs. ${latestEB.amount.toFixed(2)}). Consider optimization to lower bills.`,
          icon: flashOutline,
          color: 'text-amber-600 bg-amber-50',
        });
      }
    }

    // Balance insights
    if (netBalance < 0) {
      insights.push({
        id: 'balance-neg',
        text: `Expenditure exceeded earnings by Rs. ${Math.abs(netBalance)}. Consider reviewing payments log.`,
        icon: walletOutline,
        color: 'text-rose-600 bg-rose-50',
      });
    }

    // Default insight if empty
    if (insights.length === 0) {
      insights.push({
        id: 'default',
        text: 'All account systems active. Say "Plan task call plumber" or "Spent 500 for shopping on UPI" to automate entries.',
        icon: sparklesOutline,
        color: 'text-indigo-600 bg-indigo-50',
      });
    }

    return insights;
  };

  const aiInsights = generateAIInsights();

  // Prepare chart data
  const expenseData = expenses.filter(e => e.type === 'DEBIT').reduce((acc: any, curr) => {
    const existing = acc.find((item: any) => item.name === curr.category);
    if (existing) existing.value += curr.amount;
    else acc.push({ name: curr.category, value: curr.amount });
    return acc;
  }, []);

  const taskData = [
    { name: 'Planned', value: tasks.filter(t => t.status === 'PLANNED').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'COMPLETED').length }
  ];

  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#c084fc'];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-slate-50">
          <IonTitle><span className="app-page-title">Executive Dashboard</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-slate-50">
        <div className="max-w-xl mx-auto w-full space-y-6">

          {/* 1. KPI STATS GRID CARDS */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-2 -bottom-2 opacity-15">
                <IonIcon icon={walletOutline} className="text-8xl" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Net Balance</p>
              <h2 className="text-2xl font-black mt-2">Rs. {netBalance.toFixed(2)}</h2>
              <div className="flex items-center gap-1.5 mt-3 text-xs text-indigo-100 font-medium">
                <IonIcon icon={netBalance >= 0 ? trendingUpOutline : trendingDownOutline} />
                <span>Inflows/Outflows active</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Deposits</p>
                <h2 className="text-2xl font-black text-slate-800 mt-2">Rs. {totalSavings}</h2>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-3 self-start">
                FD + RD Savings
              </span>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Trips Booked</p>
                <h2 className="text-2xl font-black text-slate-800 mt-2">{upcomingTickets.length}</h2>
              </div>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full mt-3 self-start">
                Upcoming Tickets
              </span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task Completion</p>
                <h2 className="text-2xl font-black text-slate-800 mt-2">{taskCompletionRate}%</h2>
              </div>
              <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full mt-3 self-start">
                {completedTasks}/{totalTasks} Checked
              </span>
            </motion.div>
          </div>

          {/* 2. AI AUTOMATION INSIGHTS CONTAINER */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white border border-slate-200/70 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2 bg-gradient-to-r from-indigo-50/20 to-transparent">
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <IonIcon icon={sparklesOutline} className="text-lg" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">AI Copilot Insights</h3>
                <span className="text-[9px] text-indigo-500 uppercase tracking-widest font-bold">Automated Recommendations</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {aiInsights.map((insight) => (
                <div key={insight.id} className="flex gap-3 items-start border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                  <div className={`p-2.5 rounded-2xl ${insight.color} mt-0.5`}>
                    <IonIcon icon={insight.icon} className="text-base" />
                  </div>
                  <p className="text-xs font-semibold leading-relaxed text-slate-600">{insight.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3. CHARTS SECTIONS */}
          <div className="space-y-6">
            <IonCard className="shadow-sm border border-slate-200/60 rounded-3xl m-0 bg-white">
              <IonCardContent className="p-5">
                <h2 className="text-sm font-extrabold mb-4 text-slate-800 uppercase tracking-wider">Debit Expense Portfolio</h2>
                <div className="chart-box h-60">
                  {expenseData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold">No expenses logged yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip cursor={{ fill: '#f1f5f9/60' }} contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="shadow-sm border border-slate-200/60 rounded-3xl m-0 bg-white">
              <IonCardContent className="p-5">
                <h2 className="text-sm font-extrabold mb-4 text-slate-800 uppercase tracking-wider">Planned vs Completed Tasks</h2>
                <div className="w-full h-64 flex justify-center items-center">
                  {totalTasks === 0 ? (
                    <div className="text-xs text-slate-400 font-bold">No tasks planned.</div>
                  ) : (
                    <PieChart width={300} height={250}>
                      <Pie data={taskData} cx="50%" cy="50%" outerRadius={70} fill="#8884d8" dataKey="value" labelLine={false} label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}>
                        {taskData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', fontSize: '12px' }} />
                      <Legend />
                    </PieChart>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

// Simulated Recharts Legend to render below Pie chart
const Legend: React.FC = () => {
  return (
    <div className="flex justify-center gap-6 text-xs text-slate-600 font-bold mt-2">
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-indigo-400" />
        <span>Planned Tasks</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded bg-emerald-400" />
        <span>Completed Tasks</span>
      </div>
    </div>
  );
};

export default DashboardTab;
