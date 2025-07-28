// app/pharmacy/stock/page.tsx
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { PlusIcon, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MedicineStockForm from '@/components/pharmacy/MedicineStockForm';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/useAuthStore';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MedicineStockReport from '@/components/pharmacy/MedicineStockReport';
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface MedicineStock {
  _id: string;
  name: string;
  batchNumber: string;
  currentQuantity: number;
  originalQuantity: number;
  expiryDate: string;
  supplier: string;
  sellingPrice: number;
  unitPrice: number;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

const calculateStockPercentage = (current: number, original: number) => {
  if (original === 0) return 0;
  return Math.round((current / original) * 100);
};

export default function PharmacyStockPage() {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<string | null>(null);
  const [selectedStock, setSelectedStock] = useState<MedicineStock | null>(null);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('management');
  
  const { data, error, isLoading, mutate } = useSWR(
    `/api/pharmacy/stock?search=${search}`,
    fetcher
  );

  const handleEdit = (stock: MedicineStock) => {
    setSelectedStock(stock);
    setOpen(true);
  };

  const handleFormSuccess = () => {
    mutate();
    setOpen(false);
    setSelectedStock(null);
  };

  const confirmDelete = (id: string) => {
    setMedicineToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!medicineToDelete) return;
    
    try {
      const response = await fetch(`/api/pharmacy/stock/${medicineToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success('Medicine deleted successfully');
        mutate();
      } else {
        throw new Error('Failed to delete medicine');
      }
    } catch (error) {
      toast.error('Error deleting medicine');
      console.error('Delete error:', error);
    } finally {
      setDeleteDialogOpen(false);
      setMedicineToDelete(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pharmacy Stock Management</h1>
        
        <div className="flex gap-4">
          <Input
            placeholder="Search medicines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          
          {(user?.role === 'pharmacy' || user?.role === 'admin') && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add New Medicine
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <MedicineStockForm
                  initialData={selectedStock ? {
                    ...selectedStock,
                    expiryDate: new Date(selectedStock.expiryDate)
                  } : undefined}
                  onSuccess={handleFormSuccess}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="management">Stock Management</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="management">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500">Error loading medicine stock</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.data?.map((medicine: MedicineStock) => {
                    const expiryDate = new Date(medicine.expiryDate);
                    const isExpired = expiryDate < new Date();
                    const daysToExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    
                    let expiryStatus = '';
                    let badgeVariant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
                    
                    if (isExpired) {
                      expiryStatus = 'Expired';
                      badgeVariant = 'destructive';
                    } else if (daysToExpiry <= 30) {
                      expiryStatus = `Expires in ${daysToExpiry} days`;
                      badgeVariant = 'destructive';
                    } else if (daysToExpiry <= 90) {
                      expiryStatus = `Expires in ${daysToExpiry} days`;
                      badgeVariant = 'outline';
                    } else {
                      expiryStatus = 'Valid';
                      badgeVariant = 'default';
                    }

                    return (
                      <tr key={medicine._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{medicine.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {medicine.batchNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div className="min-w-[100px]">
                              <Progress 
                                value={calculateStockPercentage(medicine.currentQuantity, medicine.originalQuantity)}
                                className="h-2"
                              />
                              <div className="text-xs text-muted-foreground text-right">
                                {medicine.currentQuantity}/{medicine.originalQuantity} (
                                {calculateStockPercentage(medicine.currentQuantity, medicine.originalQuantity)}%)
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span>{expiryDate.toLocaleDateString()}</span>
                            <Badge variant={badgeVariant} className="w-fit">
                              {expiryStatus}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          ${medicine.sellingPrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {(user?.role === 'pharmacy' || user?.role === 'admin') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEdit(medicine)}
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                  onClick={() => confirmDelete(medicine._id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="reports">
          <MedicineStockReport data={data?.data || []} />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the medicine record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}