// app/pharmacy/inventory/page.tsx
'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { PrinterIcon, SearchIcon, Trash2Icon, PencilIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MedicineStockForm } from './MedicineInventoryForm';
import { Medicine, MedicineStock } from '@/types/medicine';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function InventoryManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Medicine | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: inventory, isLoading, error } = useSWR<MedicineStock[]>('/api/pharmacy/inventory', fetcher);

  const filteredInventory = inventory?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const generateInventoryReport = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('Pharmacy Inventory Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${date}`, 105, 30, { align: 'center' });
    
    autoTable(doc, {
      startY: 40,
      head: [['Medicine', 'Batch', 'Expiry', 'Stock', 'Unit Price', 'Selling Price', 'Supplier']],
      body: filteredInventory.map(item => [
        item.name,
        item.batchNumber,
        formatDate(item.expiryDate),
        `${item.currentQuantity}/${item.originalQuantity} (${Math.round(item.remainingPercentage)}%)`,
        `AFN ${item.unitPrice.toFixed(2)}`,
        `AFN ${item.sellingPrice.toFixed(2)}`,
        item.supplier
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      alternateRowStyles: { fillColor: [241, 245, 249] }
    });

    const totalItems = filteredInventory.length;
    const totalValue = Array.isArray(filteredInventory)
      ? filteredInventory.reduce((sum, item) => {
          if (item && typeof item.currentQuantity === 'number' && typeof item.unitPrice === 'number') {
            return sum + (item.currentQuantity * item.unitPrice);
          }
          return sum;
        }, 0)
      : 0;
    const lowStockItems = Array.isArray(filteredInventory)
      ? filteredInventory.filter(item => item && typeof item.remainingPercentage === 'number' && item.remainingPercentage < 20).length
      : 0;
    const expiredItems = Array.isArray(filteredInventory)
      ? filteredInventory.filter(item => item && item.expiryStatus === 'expired').length
      : 0;

    doc.setFontSize(12);
    doc.text('Inventory Summary', 14, (doc as any).lastAutoTable.finalY + 20);
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 25,
      body: [
        ['Total Items', totalItems],
        ['Total Inventory Value', `AFN ${totalValue.toFixed(2)}`],
        ['Low Stock Items (<20%)', lowStockItems],
        ['Expired Items', expiredItems]
      ],
      styles: { fontSize: 10 },
      columnStyles: { 1: { fontStyle: 'bold' } }
    });

    doc.save(`pharmacy_inventory_report_${date.replace(/\//g, '-')}.pdf`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`/api/pharmacy/inventory/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Item deleted successfully');
        mutate('/api/pharmacy/inventory');
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error) {
      toast.error('Error deleting item');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Medicine Inventory</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medicines..."
                className="pl-9 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={generateInventoryReport}>
              <PrinterIcon className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500 text-center py-8">
              Failed to load inventory data
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inventory items found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Prices</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      <div>{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      )}
                    </TableCell>
                    <TableCell>{item.batchNumber}</TableCell>
                    <TableCell>
                      <div>{formatDate(item.expiryDate)}</div>
                      <Badge 
                        variant={
                          item.expiryStatus === 'expired' ? 'destructive' : 
                          item.expiryStatus === 'expiring-soon' ? 'warning' : 'default'
                        }
                        className="mt-1"
                      >
                        {item.expiryStatus.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.currentQuantity}/{item.originalQuantity}</span>
                        <Progress 
                          value={item.remainingPercentage}
                          className="h-2 w-20"
                          style={{
                            '--progress-indicator-color': item.remainingPercentage < 10 ? '#ef4444' :
                                                          item.remainingPercentage < 20 ? '#eab308' : '#22c55e'
                          } as React.CSSProperties}
                        />
                        <span className="text-xs w-8">{Math.round(item.remainingPercentage)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">Cost: AFN {item.unitPrice.toFixed(2)}</div>
                      <div className="text-sm">Sell: AFN {item.sellingPrice.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>{item.supplier}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setEditItem(item);
                            setIsFormOpen(true);
                          }}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash2Icon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredInventory.length} of {inventory?.length} items
          </div>
          <Button 
            variant="outline" 
            onClick={() => mutate('/api/pharmacy/inventory')}
          >
            Refresh
          </Button>
        </CardFooter>
      </Card>

      <MedicineStockForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editItem}
        onSuccess={() => {
          mutate('/api/pharmacy/inventory');
          setEditItem(null);
          setIsFormOpen(false);
        }}
      />
    </div>
  );
}