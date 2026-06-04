import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent } from '@ionic/react';
import { useAppStore } from '../store/useAppStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardTab: React.FC = () => {
  const expenses = useAppStore(state => state.expenses);
  const tasks = useAppStore(state => state.tasks);

  // Prepare data for chart
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-gray-50">
          <IonTitle><span className="app-page-title">Dashboard</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-gray-50">
       <div className="max-w-xl mx-auto w-full">
        <IonCard className="shadow-sm border border-gray-100 rounded-3xl mb-6 bg-white">
          <IonCardContent>
            <h2 className="text-lg font-bold mb-4 text-gray-800">Expenses by Category</h2>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%" minWidth={220} minHeight={220}>
                <BarChart data={expenseData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard className="shadow-sm border border-gray-100 rounded-3xl mb-6 bg-white">
          <IonCardContent>
            <h2 className="text-lg font-bold mb-4 text-gray-800">Task Overview</h2>
            <div className="w-full h-64 flex justify-center items-center">
              <PieChart width={300} height={250}>
                <Pie data={taskData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                  {taskData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </IonCardContent>
        </IonCard>
       </div>
      </IonContent>
    </IonPage>
  );
};
export default DashboardTab;
