// utils/generatePharmacyReceipt.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PrescriptionItem {
  medicine: {
    name: string;
    batchNumber: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface Prescription {
  patientName: string;
  patientPhone: string;
  invoiceNumber: string;
  items: PrescriptionItem[];
  totalAmount: number;
  amountPaid: number;
  paymentMethod: string;
  createdAt: string;
  issuedBy?: {
    name: string;
  };
}

export const generatePharmacyReceipt = (prescription: Prescription) => {
  const doc = new jsPDF();
  const date = new Date(prescription.createdAt).toLocaleDateString();
  const time = new Date(prescription.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Clinic Information
  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTHCARE PHARMACY', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Medical Street, Cityville', 105, 26, { align: 'center' });
  doc.text('Phone: (123) 456-7890 | Tax ID: 123456789', 105, 32, { align: 'center' });
  
  // Receipt Header
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PHARMACY RECEIPT', 105, 42, { align: 'center' });
  
  // Invoice Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${prescription.invoiceNumber}`, 14, 52);
  doc.text(`Date: ${date}`, 14, 58);
  doc.text(`Time: ${time}`, 14, 64);
  doc.text(`Cashier: ${prescription.issuedBy?.name || 'System'}`, 14, 70);
  
  // Patient Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Information', 14, 82);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${prescription.patientName}`, 14, 90);
  doc.text(`Phone: ${prescription.patientPhone}`, 14, 96);
  
  // Items Table
  autoTable(doc, {
    startY: 106,
    head: [['No.', 'Medicine', 'Batch', 'Qty', 'Unit Price', 'Disc%', 'Total']],
    body: prescription.items.map((item, index) => [
      index + 1,
      item.medicine.name,
      item.medicine.batchNumber,
      item.quantity,
      `$${item.unitPrice.toFixed(2)}`,
      `${item.discount}%`,
      `$${(item.quantity * item.unitPrice * (1 - item.discount / 100)).toFixed(2)}`
    ]),
    styles: { 
      fontSize: 9,
      cellPadding: 3,
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 50 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 15 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'right', cellWidth: 25 }
    },
    headStyles: { 
      fillColor: [59, 130, 246], 
      textColor: 255, 
      fontStyle: 'bold',
      fontSize: 9 
    },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    margin: { left: 14, right: 14 }
  });
  
  // Payment Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Summary', 14, finalY);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: $${prescription.totalAmount.toFixed(2)}`, 150, finalY, { align: 'right' });
  doc.text(`Payment Method: ${prescription.paymentMethod.toUpperCase()}`, 14, finalY + 8);
  doc.text(`Amount Paid: $${prescription.amountPaid.toFixed(2)}`, 150, finalY + 8, { align: 'right' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Thank you for your purchase!', 105, 280, { align: 'center' });
  doc.text('Please retain this receipt for your records', 105, 284, { align: 'center' });
  doc.text('Returns/exchanges within 7 days with original receipt', 105, 288, { align: 'center' });
  
  // Save the PDF
  doc.save(`Pharmacy_Receipt_${prescription.invoiceNumber}.pdf`);
};
