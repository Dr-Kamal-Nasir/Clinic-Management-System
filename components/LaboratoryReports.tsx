// components/LaboratoryReports.tsx
'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import PDFDocument from 'pdfkit';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';

interface LaboratoryRecord {
  _id: string;
  patientName: string;
  testType: string;
  phoneNumber: string;
  amountCharged: number;
  amountPaid: number;
  discount: number;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  date: string;
  createdBy: { name: string };
  updatedBy?: { name: string };
}

interface LaboratoryReportsProps {
  records: LaboratoryRecord[];
  dateRange: { from: Date; to: Date };
}

export function LaboratoryReports({ records, dateRange }: LaboratoryReportsProps) {
  const summary = useMemo(() => {
    return records.reduce(
      (acc, record) => {
        acc.totalCharged += record.amountCharged;
        acc.totalDiscount += record.discount;
        acc.totalPaid += record.amountPaid;
        acc.totalBalance += record.amountCharged - record.amountPaid - record.discount;
        return acc;
      },
      { totalCharged: 0, totalDiscount: 0, totalPaid: 0, totalBalance: 0 }
    );
  }, [records]);

  const generatePDF = () => {
    const doc = new PDFDocument();
    const chunks: Uint8Array[] = [];
    
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      const blob = new Blob(chunks, { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      saveAs(url, `laboratory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });

    // Add title
    doc.fontSize(20).text('Laboratory Records Report', { align: 'center' });
    doc.moveDown();
    
    // Add date range
    doc.fontSize(12).text(
      `From ${format(dateRange.from, 'MMM dd, yyyy')} to ${format(dateRange.to, 'MMM dd, yyyy')}`,
      { align: 'center' }
    );
    doc.moveDown(2);
    
    // Add summary
    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown();
    doc.text(`Total Charged: $${summary.totalCharged.toFixed(2)}`);
    doc.text(`Total Discount: $${summary.totalDiscount.toFixed(2)}`);
    doc.text(`Total Paid: $${summary.totalPaid.toFixed(2)}`);
    doc.text(`Total Balance: $${summary.totalBalance.toFixed(2)}`);
    doc.moveDown(2);
    
    // Add records table
    doc.fontSize(14).text('Detailed Records', { underline: true });
    doc.moveDown();
    
    // Table headers
    const headers = ['Date', 'Patient', 'Test', 'Charged', 'Discount', 'Paid', 'Status'];
    const columnWidths = [80, 120, 120, 60, 60, 60, 80];
    let xPosition = 50;
    
    // Draw headers
    headers.forEach((header, i) => {
      doc.font('Helvetica-Bold').text(header, xPosition, doc.y, {
        width: columnWidths[i],
        align: 'left',
      });
      xPosition += columnWidths[i] + 10;
    });
    doc.moveDown();
    
    // Draw rows
    records.forEach(record => {
      xPosition = 50;
      const row = [
        format(new Date(record.date), 'MM/dd/yyyy'),
        record.patientName,
        record.testType,
        `$${record.amountCharged.toFixed(2)}`,
        `$${record.discount.toFixed(2)}`,
        `$${record.amountPaid.toFixed(2)}`,
        record.paymentStatus,
      ];
      
      row.forEach((cell, i) => {
        doc.font('Helvetica').text(cell, xPosition, doc.y, {
          width: columnWidths[i],
          align: 'left',
        });
        xPosition += columnWidths[i] + 10;
      });
      doc.moveDown();
    });
    
    doc.end();
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Report Summary</span>
          <Button onClick={generatePDF}>Generate PDF Report</Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Charged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalCharged.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalDiscount.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalPaid.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${summary.totalBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Charged</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record._id}>
                <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell>{record.patientName}</TableCell>
                <TableCell>{record.testType}</TableCell>
                <TableCell>${record.amountCharged.toFixed(2)}</TableCell>
                <TableCell>${record.discount.toFixed(2)}</TableCell>
                <TableCell>${record.amountPaid.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs',
                    record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                    record.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  )}>
                    {record.paymentStatus.charAt(0).toUpperCase() + record.paymentStatus.slice(1)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
