import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ExportService = {
  exportToCSV: (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  },

  exportToExcel: (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  },

  exportToPDF: (data: any[], filename: string, title: string) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55); // Tailwind gray-800
    doc.text(title, 14, 22);
    
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => Object.values(obj).map(val => String(val)));

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 30,
      theme: 'striped',
      styles: { 
        fontSize: 10, 
        cellPadding: 5,
        font: 'helvetica',
        textColor: [55, 65, 81], // Tailwind gray-700
      },
      headStyles: { 
        fillColor: [59, 130, 246], // Tailwind blue-500
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Tailwind gray-50
      },
      margin: { top: 25, right: 14, bottom: 20, left: 14 },
    });

    doc.save(`${filename}.pdf`);
  }
};
