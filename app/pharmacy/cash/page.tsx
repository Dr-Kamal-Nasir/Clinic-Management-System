// app/pharmacy/cash/page.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { CalendarIcon, PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/useAuthStore';

// Define types
type CashRecord = {
  _id: string;
  date: string;
  openingBalance: number;
  closingBalance: number;
  cashSales: number;
  expenses: number;
  discrepancy: number;
  verifiedBy?: { name: string };
};

type CalculatedValues = {
  cashSales: number;
  expenses: number;
};

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CashAtHandPage() {
  const { user } = useAuthStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [notes, setNotes] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  // SWR hooks with types
  const { data: cashRecords, isLoading } = useSWR<CashRecord[]>('/api/pharmacy/cash', fetcher);
  const { data: calculatedValues } = useSWR<CalculatedValues>('/api/pharmacy/cash/calculate', fetcher);

  // Calculate discrepancy for form
  const calculateDiscrepancy = () => {
    const expectedCash = openingBalance + (calculatedValues?.cashSales || 0) - (calculatedValues?.expenses || 0);
    return closingBalance - expectedCash;
  };

  // Calculate current day's discrepancy for display
  const currentDiscrepancy = useMemo(() => {
    if (!cashRecords?.[0] || !calculatedValues) return 0;
    const record = cashRecords[0];
    const expected = record.openingBalance + (calculatedValues.cashSales || 0) - (calculatedValues.expenses || 0);
    return record.closingBalance - expected;
  }, [cashRecords, calculatedValues]);

  const handleSubmit = async () => {
    if (!date) {
      toast('Validation Error', {
        description: 'Please select a date',
      });
      return;
    }

    try {
      const response = await fetch('/api/pharmacy/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          openingBalance,
          closingBalance,
          cashSales: calculatedValues?.cashSales || 0,
          expenses: calculatedValues?.expenses || 0,
          notes
        })
      });

      if (response.ok) {
        toast('Success', {
          description: 'Cash record saved successfully',
        });
        setDialogOpen(false);
        mutate('/api/pharmacy/cash'); // Revalidate cache
       
        // Reset form
        setOpeningBalance(0);
        setClosingBalance(0);
        setNotes('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save cash record');
      }
    } catch (error: unknown) { // Fixed: Replaced 'any' with 'unknown'
      toast('Error', {
        description: error instanceof Error ? error.message : 'Failed to save cash record', // Fixed: Added proper error handling
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cash at Hand Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Daily Cash Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Daily Cash Reconciliation</DialogTitle>
            </DialogHeader>
           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
             
              <div>
                <Label>Opening Balance (AFN ) *</Label>
                <Input
                  type="number"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
             
              <div>
                <Label>Cash Sales (AFN)</Label>
                <Input
                  type="number"
                  value={calculatedValues?.cashSales || 0}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
             
              <div>
                <Label>Expenses (AFN)</Label>
                <Input
                  type="number"
                  value={calculatedValues?.expenses || 0}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
             
              <div>
                <Label>Closing Balance (AFN) *</Label>
                <Input
                  type="number"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
              </div>
             
              <div>
                <Label>Discrepancy (AFN)</Label>
                <Input
                  type="number"
                  value={calculateDiscrepancy()}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
             
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                  placeholder="Enter any notes here" // Fixed: Added placeholder to avoid unescaped single quote
                />
              </div>
            </div>
           
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Save Cash Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Cash Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Opening Balance</h3>
              <p className="text-2xl font-bold">AFN {cashRecords?.[0]?.openingBalance?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Cash Sales</h3>
              <p className="text-2xl font-bold">AFN {calculatedValues?.cashSales?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Expenses</h3>
              <p className="text-2xl font-bold">AFN {calculatedValues?.expenses?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500">Discrepancy</h3>
              <p className={`text-2xl font-bold ${currentDiscrepancy !== 0 ? 'text-red-500' : 'text-green-500'}`}>
                AFN {currentDiscrepancy?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Cash Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Cash Sales</TableHead>
                <TableHead>Expenses</TableHead>
                <TableHead>Closing</TableHead>
                <TableHead>Discrepancy</TableHead>
                <TableHead>Verified By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashRecords?.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>AFN {record.openingBalance.toFixed(2)}</TableCell>
                  <TableCell>AFN {record.cashSales.toFixed(2)}</TableCell>
                  <TableCell>AFN {record.expenses.toFixed(2)}</TableCell>
                  <TableCell>AFN {record.closingBalance.toFixed(2)}</TableCell>
                  <TableCell className={record.discrepancy !== 0 ? 'text-red-500' : 'text-green-500'}>
                    AFN {record.discrepancy.toFixed(2)}
                  </TableCell>
                  <TableCell>{record.verifiedBy?.name || 'System'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
