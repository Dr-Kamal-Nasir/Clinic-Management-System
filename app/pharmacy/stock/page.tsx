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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when searching
  };
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('management');
  
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const { data, error, isLoading, mutate } = useSWR(
    `/api/pharmacy/stock?search=${search}&page=${page}&limit=${pageSize}`,
    fetcher,
    {
      onErrorRetry: (error) => {
        if (error.status === 404 || error.status === 401) return;
      }
    }
  );

  const medicines = data?.data || [];

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
              onChange={handleSearchChange}
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {data?.data?.length || 0} of {data?.pagination?.total || 0} items
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((medicine: MedicineStock) => {
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
                        <TableRow key={medicine._id}>
                          <TableCell className="font-medium">{medicine.name}</TableCell>
                          <TableCell>{medicine.batchNumber}</TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span>{expiryDate.toLocaleDateString()}</span>
                              <Badge variant={badgeVariant} className="w-fit">
                                {expiryStatus}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>AFN {medicine.sellingPrice.toFixed(2)}</TableCell>
                          <TableCell>
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
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {Math.ceil((data?.pagination?.total || 0) / pageSize)}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data?.pagination?.next || medicines.length === 0}
                  >
                      Next
                    </Button>
                  </div>
                </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="reports">
          <MedicineStockReport data={medicines} />
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
