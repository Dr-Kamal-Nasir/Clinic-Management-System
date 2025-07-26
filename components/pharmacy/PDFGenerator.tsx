// components/pharmacy/PDFGenerator.tsx
'use client';
import { Button } from '@/components/ui/button';
import { DownloadIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PDFGenerator = ({ data, title }: { data: any[]; title: string }) => {
  const generatePDF = () => {
    if (data.length === 0) return;
    
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    
    // Subtitle
    doc.setFontSize(10);
    doc.text(`Report generated on: ${date}`, 14, 22);
    
    // Prepare data for table
    const tableData = data.map(item => [
      item.name,
      item.batchNumber,
      new Date(item.expiryDate).toLocaleDateString(),
      item.quantity,
      `$${item.unitPrice.toFixed(2)}`,
      `$${item.sellingPrice.toFixed(2)}`,
      item.supplier
    ]);
    
    // Create table
    autoTable(doc, {
      head: [
        ['Medicine', 'Batch', 'Expiry Date', 'Quantity', 'Unit Price', 'Selling Price', 'Supplier']
      ],
      body: tableData,
      startY: 30,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] } // blue-500
    });
    
    // Save the PDF
    doc.save(`pharmacy-stock-report-${date.replace(/\//g, '-')}.pdf`);
  };

  return (
    <Button onClick={generatePDF}>
      <DownloadIcon className="mr-2 h-4 w-4" />
      Export to PDF
    </Button>
  );
};

export default PDFGenerator;
