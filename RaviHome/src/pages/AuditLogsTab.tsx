import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, useIonAlert } from '@ionic/react';
import { AuditLog, useAppStore } from '../store/useAppStore';
import PremiumDataGrid, { ColumnDef } from '../components/PremiumDataGrid';

interface EnrichedAuditLog {
  id: string;
  date: string;
  status: 'SUCCESS' | 'FAILURE';
  actionType: string;
  description: string;
  userName: string;
  tenantName: string;
  assetName: string;
}

const AuditLogsTab: React.FC = () => {
  const auditLogs = useAppStore((state) => state.auditLogs);
  const [presentAlert] = useIonAlert();

  // Enrich simple logs to match details from Image 4
  const enrichedLogs: EnrichedAuditLog[] = auditLogs.map((item) => {
    const status: 'SUCCESS' | 'FAILURE' = 'SUCCESS';
    
    let actionType = 'Configuration';
    if (item.action.toLowerCase().includes('theme')) actionType = 'Theme Change';
    else if (item.action.toLowerCase().includes('added') || item.action.toLowerCase().includes('saved')) actionType = 'Configuration';
    else if (item.action.toLowerCase().includes('deleted') || item.action.toLowerCase().includes('removed')) actionType = 'Configuration';
    else if (item.action.toLowerCase().includes('ticket') || item.action.toLowerCase().includes('travel')) actionType = 'Configuration';
    else if (item.action.toLowerCase().includes('login') || item.action.toLowerCase().includes('auth') || item.action.toLowerCase().includes('vault')) actionType = 'Security';
    else if (item.action.toLowerCase().includes('preferences')) actionType = 'Configuration';
    else if (item.action.toLowerCase().includes('logged')) actionType = 'Security';
    else if (item.action.toLowerCase().includes('sync')) actionType = 'Configuration';
    else if (item.action.toLowerCase().includes('authentication') || item.action.toLowerCase().includes('two-factor')) actionType = 'Security';

    const userName = 'ravichandran.c@dhyan.com';
    const tenantName = 'Dhyan Lab';
    const assetName = item.action.toLowerCase().includes('lamp') ? 'Smart Lamp' : 'Smart Cabinet';

    // Format date string to: Jun-28-2026 10:52:33
    let formattedDate = item.date;
    try {
      const d = new Date(item.date);
      if (!isNaN(d.getTime())) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const day = String(d.getDate()).padStart(2, '0');
        const year = d.getFullYear();
        const time = d.toTimeString().split(' ')[0];
        formattedDate = `${month}-${day}-${year} ${time}`;
      }
    } catch (e) {}

    return {
      id: item.id,
      date: formattedDate,
      status,
      actionType,
      description: item.action,
      userName,
      tenantName,
      assetName
    };
  });

  const showLogDetails = (item: EnrichedAuditLog) => {
    presentAlert({
      header: 'Audit Log Details',
      subHeader: `Action Type: ${item.actionType}`,
      message: `${item.description}\n\nUser: ${item.userName}\nTenant: ${item.tenantName}\nAsset: ${item.assetName}\nTimestamp: ${item.date}`,
      buttons: ['Dismiss']
    });
  };

  const columns: ColumnDef<EnrichedAuditLog>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (item) => (
        <button
          onClick={() => showLogDetails(item)}
          className="text-blue-600 hover:text-blue-800 hover:underline font-bold text-left outline-none border-none bg-transparent p-0 cursor-pointer text-xs"
        >
          {item.date}
        </button>
      )
    },
    {
      key: 'status',
      label: 'Operational Status',
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-200/40 select-none">
          SUCCESS
        </span>
      )
    },
    {
      key: 'actionType',
      label: 'Action Type',
      sortable: true
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (item) => (
        <span className="font-semibold text-slate-700 whitespace-normal leading-relaxed text-xs block max-w-sm truncate" title={item.description}>
          {item.description}
        </span>
      )
    },
    {
      key: 'userName',
      label: 'User Name',
      sortable: true
    },
    {
      key: 'tenantName',
      label: 'Tenant Name',
      sortable: true
    },
    {
      key: 'assetName',
      label: 'Asset Name',
      sortable: true
    }
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border select-none">
        <IonToolbar className="bg-slate-50">
          <IonTitle><span className="app-page-title text-[15px] font-extrabold text-slate-800 border-b-0 pb-0">Audit Trail</span></IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding bg-slate-50">
        <div className="travel-shell bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          
          {/* Top category sub-tabs block matching Image 4 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3.5 mb-4 select-none">
            {/* Active page title underline visual */}
            <div className="relative">
              <h1 className="text-[14px] font-black text-slate-800 tracking-wide uppercase">System Activity</h1>
              <div className="absolute -bottom-[16px] left-0 w-16 h-0.5 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }} />
            </div>

            {/* Action buttons list on right */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button 
                type="button"
                className="px-3.5 py-1.5 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer border-0 outline-none" 
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                All
              </button>
              <button 
                type="button"
                className="px-3.5 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition-all cursor-pointer border-0 outline-none"
              >
                System Audit
              </button>
              <button 
                type="button"
                className="px-3.5 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-bold hover:bg-slate-200 transition-all cursor-pointer border-0 outline-none flex items-center gap-1"
              >
                More
                <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              <button 
                type="button"
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer outline-none ml-1" 
                title="Filters"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
              </button>
            </div>
          </div>

          <PremiumDataGrid
            data={enrichedLogs}
            columns={columns}
            searchPlaceholder="Search audit logs..."
            searchFields={['description', 'date', 'actionType', 'userName']}
            exportFilename="Audit_Trail_Report"
            exportTitle="Audit Trail Logs Statement"
            showSelection={true}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AuditLogsTab;