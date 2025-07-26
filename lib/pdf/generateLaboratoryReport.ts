// lib/pdf/generateLaboratoryReport.ts
import PDFDocument from 'pdfkit';
import fs from 'fs';
import { format } from 'date-fns';

interface LaboratoryRecord {
  patientName: string;
  testType: string;
  amountCharged: number;
  amountPaid: number;
  discount: number;
  paymentStatus: string;
  date: Date;
}

interface ReportSummary {
  totalCharged: number;
  totalPaid: number;
  totalDiscount: number;
  count: number;
}

export async function generateLaboratoryReport(
records: LaboratoryRecord[], outputPath: string, p0: string | undefined, p1: string | undefined, dateRange?: { from: Date; to: Date; },
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });

    // Pipe the PDF to a file
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Add header
    doc
      .fontSize(20)
      .text('Laboratory Records Report', { align: 'center' })
      .moveDown();

    // Add date range if provided
    if (dateRange) {
      doc
        .fontSize(12)
        .text(
          `Date Range: ${format(dateRange.from, 'MMMM dd, yyyy')} - ${format(
            dateRange.to,
            'MMMM dd, yyyy'
          )}`,
          { align: 'center' }
        )
        .moveDown();
    }

    // Calculate summary
    const summary: ReportSummary = records.reduce(
      (acc, record) => ({
        totalCharged: acc.totalCharged + record.amountCharged,
        totalPaid: acc.totalPaid + record.amountPaid,
        totalDiscount: acc.totalDiscount + record.discount,
        count: acc.count + 1,
      }),
      { totalCharged: 0, totalPaid: 0, totalDiscount: 0, count: 0 }
    );

    // Add summary section
    doc
      .fontSize(14)
      .text('Summary', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .text(`Total Records: ${summary.count}`, { continued: true })
      .text(`Total Charged: $${summary.totalCharged.toFixed(2)}`, {
        align: 'right',
      })
      .moveDown(0.5);

    doc
      .text(`Total Discount: $${summary.totalDiscount.toFixed(2)}`, {
        continued: true,
      })
      .text(`Total Paid: $${summary.totalPaid.toFixed(2)}`, { align: 'right' })
      .moveDown(0.5);

    doc
      .text(
        `Net Income: $${(
          summary.totalCharged - summary.totalDiscount
        ).toFixed(2)}`,
        { continued: true }
      )
      .text(
        `Balance: $${(
          summary.totalCharged -
          summary.totalDiscount -
          summary.totalPaid
        ).toFixed(2)}`,
        { align: 'right' }
      )
      .moveDown(2);

    // Add records table
    doc.fontSize(14).text('Records', { underline: true }).moveDown(0.5);

    // Table headers
    const headers = [
      'Patient',
      'Test Type',
      'Charged',
      'Discount',
      'Paid',
      'Balance',
      'Status',
      'Date',
    ];
    const columnWidths = [100, 100, 60, 60, 60, 60, 60, 80];
    const rowHeight = 20;
    const initialY = doc.y;

    // Draw headers
    doc.font('Helvetica-Bold').fontSize(10);
    let x = 50;
    headers.forEach((header, i) => {
      doc.text(header, x, initialY, { width: columnWidths[i], align: 'left' });
      x += columnWidths[i];
    });

    // Draw rows
    doc.font('Helvetica').fontSize(10);
    let y = initialY + rowHeight;

    records.forEach((record) => {
      const balance = record.amountCharged - record.discount - record.amountPaid;
      const status = balance <= 0 ? 'Paid' : record.paymentStatus;

      const rowData = [
        record.patientName,
        record.testType,
        `$${record.amountCharged.toFixed(2)}`,
        `$${record.discount.toFixed(2)}`,
        `$${record.amountPaid.toFixed(2)}`,
        `$${balance.toFixed(2)}`,
        status,
        format(record.date, 'MMM dd, yyyy'),
      ];

      x = 50;
      rowData.forEach((cell, i) => {
        doc.text(cell, x, y, { width: columnWidths[i], align: 'left' });
        x += columnWidths[i];
      });

      y += rowHeight;

      // Add new page if needed
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 50;
      }
    });

    // Finalize the PDF
    doc.end();

    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}
