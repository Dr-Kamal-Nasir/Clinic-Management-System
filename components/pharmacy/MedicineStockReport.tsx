// components/pharmacy/MedicineStockReport.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PDFGenerator from '@/components/pharmacy/PDFGenerator';

interface MedicineStock {
  _id: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  supplier: string;
  expiryStatus: 'valid' | 'expiring-soon' | 'expired';
}

type ReportType = 'all' | 'expiring' | 'expired' | 'low';

interface MedicineStockReportProps {
  data: MedicineStock[];
}

export default function MedicineStockReport({ data }: MedicineStockReportProps) {
  const [reportType, setReportType] = useState<ReportType>('all');
  
  // Filter data based on report type
  const filteredData = data.filter(item => {
    if (reportType === 'expiring') return item.expiryStatus === 'expiring-soon';
    if (reportType === 'expired') return item.expiryStatus === 'expired';
    if (reportType === 'low') return item.quantity < 50;
    return true;
  });

  const getReportTitle = (): string => {
    switch (reportType) {
      case 'expiring': return 'Expiring Soon Medicines';
      case 'expired': return 'Expired Medicines';
      case 'low': return 'Low Stock Medicines';
      default: return 'All Medicines Stock Report';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button 
            variant={reportType === 'all' ? 'default' : 'outline'}
            onClick={() => setReportType('all')}
          >
            All Medicines
          </Button>
          <Button 
            variant={reportType === 'expiring' ? 'default' : 'outline'}
            onClick={() => setReportType('expiring')}
          >
            Expiring Soon
          </Button>
          <Button 
            variant={reportType === 'expired' ? 'default' : 'outline'}
            onClick={() => setReportType('expired')}
          >
            Expired
          </Button>
          <Button 
            variant={reportType === 'low' ? 'default' : 'outline'}
            onClick={() => setReportType('low')}
          >
            Low Stock
          </Button>
        </div>
        
        <PDFGenerator data={filteredData} title={getReportTitle()} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{getReportTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.batchNumber}</TableCell>
                    <TableCell>{new Date(item.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>${item.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell>{item.supplier}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No medicines found for this report
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}