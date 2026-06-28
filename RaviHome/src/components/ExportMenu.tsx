import React from 'react';
import { IonButton, IonIcon, useIonActionSheet } from '@ionic/react';
import { documentTextOutline, downloadOutline, gridOutline, readerOutline } from 'ionicons/icons';
import { ExportService } from '../services/ExportService';

interface ExportMenuProps {
  data: any[];
  filename: string;
  title: string;
}

const ExportMenu: React.FC<ExportMenuProps> = ({ data, filename, title }) => {
  const [presentActionSheet] = useIonActionSheet();

  const openExportMenu = () => {
    presentActionSheet({
      header: 'Export data',
      subHeader: title,
      cssClass: 'export-action-sheet',
      buttons: [
        { text: 'Download Excel', icon: gridOutline, handler: () => ExportService.exportToExcel(data, filename) },
        { text: 'Download CSV', icon: documentTextOutline, handler: () => ExportService.exportToCSV(data, filename) },
        { text: 'Download PDF', icon: readerOutline, handler: () => ExportService.exportToPDF(data, filename, title) },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
  };

  return (
    <button
      type="button"
      onClick={openExportMenu}
      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer outline-none"
      title="Download/Export"
    >
      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    </button>
  );
};

export default ExportMenu;
