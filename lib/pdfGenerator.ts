// src/lib/pdfGenerator.ts
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import blobStream from 'blob-stream';

// Type definitions
export type FinancialReportData = {
  dateRange: { start: Date; end: Date };
  totals: {
    totalIncome: number;
    netProfit: number;
    labProfit: number;
    pharmaProfit: number;
  };
  breakdown: Array<{ department: string; amount: number }>;
};

export type PharmacyReportData = {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  topMedicines: { name: string; sales: number }[];
  dailySales: { date: string; sales: number }[];
};

// Unified PDF generator (for server-side use only)
export const generateFinancialReport = (
  data: FinancialReportData | PharmacyReportData,
  reportType: 'financial' | 'pharmacy'
) => {
  return new Promise<Blob>((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = doc.pipe(blobStream());
      
      // Determine dates based on report type
      let startDate: Date, endDate: Date;
      if (reportType === 'financial') {
        const financialData = data as FinancialReportData;
        startDate = financialData.dateRange.start;
        endDate = financialData.dateRange.end;
      } else {
        const pharmacyData = data as PharmacyReportData;
        startDate = pharmacyData.startDate;
        endDate = pharmacyData.endDate;
      }

      // Common header
      doc.fontSize(20).text(
        reportType === 'financial' 
          ? 'Financial Performance Report' 
          : 'Pharmacy Income Report', 
        { align: 'center' }
      );
      doc.moveDown();

      // Date range
      doc.fontSize(12).text(
        `Date Range: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`,
        { align: 'center' }
      );
      doc.moveDown(2);

      if (reportType === 'financial') {
        const financialData = data as FinancialReportData;
        
        // Financial Summary
        doc.fontSize(14).text('Financial Summary:', { underline: true });
        doc.moveDown(0.5);
        
        doc.text(`Total Revenue: $${financialData.totals.totalIncome.toFixed(2)}`);
        doc.text(`Net Profit: $${financialData.totals.netProfit.toFixed(2)}`);
        doc.text(`Laboratory Profit: $${financialData.totals.labProfit.toFixed(2)}`);
        doc.text(`Pharmacy Profit: $${financialData.totals.pharmaProfit.toFixed(2)}`);
        doc.moveDown();
        
        // Department Breakdown
        if (financialData.breakdown?.length > 0) {
          doc.fontSize(14).text('Revenue Breakdown by Department:', { underline: true });
          doc.moveDown(0.5);
          
          financialData.breakdown.forEach(item => {
            doc.text(`${item.department}: $${item.amount.toFixed(2)}`);
          });
          doc.moveDown();
        }
      } else {
        const pharmacyData = data as PharmacyReportData;
        
        // Pharmacy Financial Summary
        doc.fontSize(14).text('Financial Summary:', { underline: true });
        doc.moveDown(0.5);
        
        doc.text(`Total Revenue: $${pharmacyData.totalRevenue.toFixed(2)}`);
        doc.text(`Total Expenses: $${pharmacyData.totalExpenses.toFixed(2)}`);
        doc.text(`Net Profit: $${pharmacyData.netProfit.toFixed(2)}`);
        doc.moveDown();
        
        // Top Medicines
        if (pharmacyData.topMedicines?.length > 0) {
          doc.fontSize(14).text('Top Selling Medicines:', { underline: true });
          doc.moveDown(0.5);
          
          pharmacyData.topMedicines.forEach((medicine, index) => {
            doc.text(`${index + 1}. ${medicine.name}: $${medicine.sales.toFixed(2)}`);
          });
          doc.moveDown();
        }
        
        // Daily Sales
        if (pharmacyData.dailySales?.length > 0) {
          doc.fontSize(14).text('Daily Sales:', { underline: true });
          doc.moveDown(0.5);
          
          doc.text('Date Amount');
          doc.text('---------------------');
          
          pharmacyData.dailySales.forEach(sale => {
            doc.text(
              `${format(new Date(sale.date), 'MMM dd')} $${sale.sales.toFixed(2)}`
            );
          });
        }
      }

      doc.end();

      stream.on('finish', () => {
        const blob = stream.toBlob('application/pdf');
        resolve(blob);
      });
      
    } catch (error) {
      reject(error);
    }
  });
};

// Client-side helper (for browser use only)
export const downloadPdf = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
