// app/pharmacy/dashboard/page.tsx
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { 
  CalendarIcon, 
  PlusIcon, 
  PillIcon, 
  ReceiptIcon, 
  WalletIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Loader2Icon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { useAuthStore } from '@/store/useAuthStore';

// Types
type DashboardStats = {
  totalSales: number;
  cashSales: number;
  cardSales: number;
  insuranceSales: number;
  totalExpenses: number;
  inventoryValue: number;
  lowStockItems: number;
};

type LowStockItem = {
  _id: string;
  name: string;
  batchNumber: string;
  currentQuantity: number;
  originalQuantity: number;
  remainingPercentage: number;
};

type MedicineStock = {
  _id: string;
  name: string;
  batchNumber: string;
  expiryDate: string;
  currentQuantity: number;
  originalQuantity: number;
  unitPrice: number;
  sellingPrice: number;
  supplier: string;
};

type RecentPrescription = {
  _id: string;
  invoiceNumber: string;
  patientName: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  status: string;
};

type RecentExpense = {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
};

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PharmacyDashboard() {
  const { user } = useAuthStore();
  
  // Fetch all dashboard data
  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>('/api/pharmacy/dashboard/stats', fetcher);
  const { data: recentPrescriptions, isLoading: prescriptionsLoading } = useSWR<RecentPrescription[]>('/api/pharmacy/prescriptions/recent', fetcher);
  const { data: lowStockData, isLoading: stockLoading, error: stockError } = useSWR('/api/pharmacy/inventory/low-stock', fetcher);
  const lowStockItems = lowStockData?.data || [];
  const { data: recentExpenses, isLoading: expensesLoading } = useSWR<RecentExpense[]>('/api/pharmacy/expenses/recent', fetcher);

  // Calculate percentage changes (mock data - replace with actual comparison logic)
  const salesChange = 12.5;
  const expensesChange = -4.3;
  const inventoryChange = 2.1;

  // Loading state for the entire dashboard
  const isLoading = statsLoading || prescriptionsLoading || stockLoading || expensesLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
        <div className="flex gap-4">
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(new Date(), 'MMMM d, yyyy')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2Icon className="h-12 w-12 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AFN {stats?.totalSales?.toFixed(2) || '0.00'}</div>
                <div className={`flex items-center text-xs ${salesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {salesChange >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(salesChange)}% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <WalletIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AFN {stats?.totalExpenses?.toFixed(2) || '0.00'}</div>
                <div className={`flex items-center text-xs ${expensesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {expensesChange >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(expensesChange)}% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <PillIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AFN{stats?.inventoryValue?.toFixed(2) || '0.00'}</div>
                <div className={`flex items-center text-xs ${inventoryChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {inventoryChange >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(inventoryChange)}% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.lowStockItems || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Items below 20% stock level
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Recent Prescriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPrescriptions?.map((prescription: RecentPrescription) => (
                          <TableRow key={prescription._id}>
                            <TableCell>{prescription.patientName}</TableCell>
                            <TableCell>AFN {prescription.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {prescription.paymentMethod}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(prescription.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  prescription.status === 'completed' ? 'default' : 
                                  prescription.status === 'pending' ? 'secondary' : 'destructive'
                                }
                              >
                                {prescription.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Low Stock Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stockError ? (
                      <div className="text-red-500 text-center py-4">
                        Failed to load low stock items
                      </div>
                    ) : lowStockItems?.length === 0 ? (
                      <div className="text-muted-foreground text-center py-4">
                        No low stock items
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {lowStockItems.map((item: LowStockItem) => (
                          <div key={item._id} className="flex items-center">
                            <div className="space-y-1 w-full">
                              <p className="text-sm font-medium leading-none">{item.name} - {item.batchNumber}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  {item.currentQuantity} / {item.originalQuantity} remaining
                                </span>
                                <span className="text-sm font-medium">
                                  {item.remainingPercentage.toFixed(0)}%
                                </span>
                              </div>
                              <Progress 
                                value={item.remainingPercentage}
                                className="h-2"
                                style={{
                                  '--progress-indicator-color': item.remainingPercentage < 10 ? '#ef4444' :
                                                              item.remainingPercentage < 20 ? '#eab308' : '#22c55e'
                                } as React.CSSProperties}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventory">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Medicine Inventory</CardTitle>
                </CardHeader>
                <CardContent>
                  <InventoryTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <SalesTable />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="expenses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Expense Records</CardTitle>
                  <Button size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </CardHeader>
                <CardContent>
                  <ExpensesTable expenses={recentExpenses || []} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// Component for Inventory Table
function InventoryTable() {
  const { data: inventory, isLoading } = useSWR('/api/pharmacy/inventory', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Medicine</TableHead>
          <TableHead>Batch No.</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead>Selling Price</TableHead>
          <TableHead>Supplier</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {inventory?.map((item: MedicineStock) => (
          <TableRow key={item._id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.batchNumber}</TableCell>
            <TableCell>{format(new Date(item.expiryDate), 'MMM yyyy')}</TableCell>
            <TableCell>
              <div className="flex items-center">
                <span className="mr-2">{item.currentQuantity}</span>
                <Progress 
                  value={(item.currentQuantity / item.originalQuantity) * 100}
                  className="w-24 h-2"
                  style={{
                    '--progress-indicator-color': 
                      (item.currentQuantity / item.originalQuantity) < 0.1 ? '#ef4444' :
                      (item.currentQuantity / item.originalQuantity) < 0.2 ? '#eab308' : '#22c55e'
                  } as React.CSSProperties}
                />
              </div>
            </TableCell>
            <TableCell>AFN {item.unitPrice.toFixed(2)}</TableCell>
            <TableCell>AFN {item.sellingPrice.toFixed(2)}</TableCell>
            <TableCell>{item.supplier}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Component for Sales Table
function SalesTable() {
  const { data: sales, isLoading } = useSWR('/api/pharmacy/prescriptions', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2Icon className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice No.</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sales?.map((sale: RecentPrescription) => (
          <TableRow key={sale._id}>
            <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
            <TableCell>{sale.patientName}</TableCell>
            <TableCell>AFN {sale.totalAmount.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize">
                {sale.paymentMethod}
              </Badge>
            </TableCell>
            <TableCell>{format(new Date(sale.createdAt), 'MMM d, yyyy')}</TableCell>
            <TableCell>
              <Badge 
                variant={
                  sale.status === 'completed' ? 'default' : 
                  sale.status === 'pending' ? 'secondary' : 'destructive'
                }
              >
                {sale.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Component for Expenses Table
function ExpensesTable({ expenses }: { expenses: RecentExpense[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Amount</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <TableRow key={expense._id}>
            <TableCell className="font-medium">AFN {expense.amount.toFixed(2)}</TableCell>
            <TableCell>{expense.category}</TableCell>
            <TableCell>{expense.description}</TableCell>
            <TableCell>{format(new Date(expense.date), 'MMM d, yyyy')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
