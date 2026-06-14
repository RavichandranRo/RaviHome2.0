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
      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 flex items-center justify-center transition-colors"
      title="Download/Export"
    >
      <IonIcon icon={downloadOutline} className="text-sm" />
    </button>
  );
};

export default ExportMenu;
