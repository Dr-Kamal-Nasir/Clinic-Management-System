//app/laboratory/expenses/page.tsx

"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuthStore } from "@/store/useAuthStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ExpenseType {
  value: 'normal' | 'doctor_salary';
  label: string;
}

interface Expense {
  _id: string;
  date: string;
  description: string;
  amount: number;
  expenseType: 'normal' | 'doctor_salary';
  doctorName?: string;
  fromDate?: string;
  toDate?: string;
  percentage?: number;
  calculatedFromRecords?: number;
}

interface Record {
  _id: string;
  amountPaid: number;
}

const EXPENSE_TYPES: ExpenseType[] = [
  { value: 'normal', label: 'Normal Expense' },
  { value: 'doctor_salary', label: 'Doctor Salary' }
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LaboratoryExpenses() {
  const { user } = useAuthStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [expenseType, setExpenseType] = useState<'normal' | 'doctor_salary'>('normal');
  const [doctorName, setDoctorName] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [percentage, setPercentage] = useState<number>(100);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const { data: expenses, isLoading } = useSWR<Expense[]>(
    `/api/laboratory/expenses?${new URLSearchParams({
      startDate: filterStartDate?.toISOString() || '',
      endDate: filterEndDate?.toISOString() || ''
    }).toString()}`,
    fetcher
  );

  const filteredExpenses = useMemo<Expense[]>(() => {
    if (!expenses) return [];
    
    const searchTermLower = searchTerm.toLowerCase();
    
    return expenses.filter((expense) => {
      const descriptionMatch = expense.description.toLowerCase().includes(searchTermLower);
      const doctorNameMatch = expense.doctorName && 
        expense.doctorName.toLowerCase().includes(searchTermLower);
      
      return descriptionMatch || doctorNameMatch;
    });
  }, [expenses, searchTerm]);

  const totalExpenses = useMemo<number>(() =>
    Array.isArray(filteredExpenses)
      ? filteredExpenses.reduce((sum: number, expense: Expense) => sum + (expense?.amount || 0), 0)
      : 0,
    [filteredExpenses]
  );

  const calculateDoctorSalary = useCallback(async (): Promise<void> => {
    if (!fromDate || !toDate) return;
    
    try {
      const response = await fetch(`/api/laboratory/records?${new URLSearchParams({
        startDate: fromDate.toISOString(),
        endDate: toDate.toISOString()
      })}`);
      
      if (!response.ok) throw new Error('Failed to fetch records');
      
      const records: Record[] = await response.json();
      const total = Array.isArray(records)
        ? records.reduce((sum: number, record: Record) => sum + (record?.amountPaid || 0), 0)
        : 0;
      setCalculatedAmount(total);
      setAmount(total * (percentage / 100));
      toast.success(`Calculated $${total.toFixed(2)} from records`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to calculate salary');
      console.error(error);
    }
  }, [fromDate, toDate, percentage]);

  const resetForm = (): void => {
    setDate(new Date());
    setDescription("");
    setAmount(0);
    setExpenseType('normal');
    setDoctorName("");
    setFromDate(undefined);
    setToDate(undefined);
    setPercentage(100);
    setCalculatedAmount(0);
    setCurrentExpense(null);
  };

  const handleEditClick = (expense: Expense): void => {
    setCurrentExpense(expense);
    setDate(new Date(expense.date));
    setDescription(expense.description);
    setAmount(expense.amount);
    setExpenseType(expense.expenseType);
    setDoctorName(expense.doctorName || "");
    setFromDate(expense.fromDate ? new Date(expense.fromDate) : undefined);
    setToDate(expense.toDate ? new Date(expense.toDate) : undefined);
    setPercentage(expense.percentage || 100);
    setCalculatedAmount(expense.calculatedFromRecords || 0);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/laboratory/expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      toast.success("Expense deleted successfully");
      mutate('/api/laboratory/expenses');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!date || !description || amount <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    if (expenseType === 'doctor_salary' && (!fromDate || !toDate || !doctorName)) {
      toast.error("Please select date range and doctor name");
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        date,
        description,
        amount,
        expenseType,
        doctorName: expenseType === 'doctor_salary' ? doctorName : undefined,
        fromDate: expenseType === 'doctor_salary' ? fromDate : undefined,
        toDate: expenseType === 'doctor_salary' ? toDate : undefined,
        percentage: expenseType === 'doctor_salary' ? percentage : undefined,
        calculatedFromRecords: expenseType === 'doctor_salary' ? calculatedAmount : undefined
      };

      const url = currentExpense 
        ? `/api/laboratory/expenses?id=${currentExpense._id}`
        : '/api/laboratory/expenses';
      
      const method = currentExpense ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });

      if (!response.ok) {
        throw new Error(currentExpense ? 'Failed to update expense' : 'Failed to create expense');
      }

      toast.success(`Expense ${currentExpense ? 'updated' : 'created'} successfully`);
      setDialogOpen(false);
      mutate('/api/laboratory/expenses');
      resetForm();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Laboratory Expenses</h1>
        <Button 
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="w-full sm:w-auto text-xs sm:text-sm"
        >
          <PlusIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
          Add Expense
        </Button>
      </div>

      {/* Filter Card - Responsive */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-sm sm:text-base">Filter Expenses</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input - Responsive */}
            <div className="relative">
              <Label className="text-sm font-medium mb-2 block">Search</Label>
              <SearchIcon className="absolute left-3 top-8 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-9 text-xs sm:text-sm"
              />
            </div>
            
            {/* Start Date Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs sm:text-sm",
                      !filterStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {filterStartDate ? format(filterStartDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterStartDate}
                    onSelect={setFilterStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* End Date Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs sm:text-sm",
                      !filterEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {filterEndDate ? format(filterEndDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filterEndDate}
                    onSelect={setFilterEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full text-xs sm:text-sm"
                onClick={() => {
                  setFilterStartDate(undefined);
                  setFilterEndDate(undefined);
                  setSearchTerm("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses Card - Responsive */}
      <Card className="mb-4 sm:mb-6 hover:shadow-md transition-shadow">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-sm sm:text-lg font-medium text-muted-foreground">Total Expenses</h3>
            <p className="text-lg sm:text-2xl font-bold">AFN {totalExpenses.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Table - Responsive with horizontal scroll */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Description</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Doctor</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Amount</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Details</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    <Skeleton className="h-8 sm:h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length ? (
                filteredExpenses.map((expense: Expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {format(new Date(expense.date), 'MMM d, yy')}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="max-w-[120px] sm:max-w-[200px] truncate">
                        {expense.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                      <div className="max-w-[100px] truncate">
                        {expense.expenseType === 'doctor_salary' ? 'Doctor Salary' : 'Normal'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                      <div className="max-w-[100px] truncate">
                        {expense.doctorName || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap font-medium">
                      AFN {expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                      <div className="max-w-[150px] truncate">
                        {expense.expenseType === 'doctor_salary' && expense.percentage && expense.calculatedFromRecords && (
                          <span>
                            {expense.percentage}% of AFN {expense.calculatedFromRecords.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => handleEditClick(expense)}
                        >
                          <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => handleDeleteClick(expense._id)}
                          disabled={isDeleting}
                        >
                          <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                    No expenses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog - Responsive */}
      <Dialog open={dialogOpen} onOpenChange={(open: boolean) => {
        if (!open) {
          resetForm();
        }
        setDialogOpen(open);
      }}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {currentExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Date Field - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label className="text-left sm:text-right text-sm font-medium">Date*</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "col-span-1 sm:col-span-3 justify-start text-left font-normal text-xs sm:text-sm",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Expense Type - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label className="text-left sm:text-right text-sm font-medium">Expense Type*</Label>
              <Select
                value={expenseType}
                onValueChange={(value: 'normal' | 'doctor_salary') => setExpenseType(value)}
              >
                <SelectTrigger className="col-span-1 sm:col-span-3 text-xs sm:text-sm">
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs sm:text-sm">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Doctor Salary Fields - Responsive */}
            {expenseType === 'doctor_salary' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label className="text-left sm:text-right text-sm font-medium">Doctor Name*</Label>
                  <Input
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="col-span-1 sm:col-span-3 text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label className="text-left sm:text-right text-sm font-medium">From Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "col-span-1 sm:col-span-3 justify-start text-left font-normal text-xs sm:text-sm",
                          !fromDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {fromDate ? format(fromDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label className="text-left sm:text-right text-sm font-medium">To Date*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "col-span-1 sm:col-span-3 justify-start text-left font-normal text-xs sm:text-sm",
                          !toDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {toDate ? format(toDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar 
                        mode="single" 
                        selected={toDate} 
                        onSelect={setToDate} 
                        initialFocus 
                        disabled={(date) => fromDate ? date < fromDate : false}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                  <Label className="text-left sm:text-right text-sm font-medium">Calculate Salary</Label>
                  <Button 
                    onClick={calculateDoctorSalary}
                    className="col-span-1 sm:col-span-3 text-xs sm:text-sm"
                    disabled={!fromDate || !toDate}
                  >
                    Calculate from Records
                  </Button>
                </div>

                {calculatedAmount > 0 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                      <Label className="text-left sm:text-right text-sm font-medium">Total Collected</Label>
                      <div className="col-span-1 sm:col-span-3 p-2 border rounded text-xs sm:text-sm">
                        AFN {calculatedAmount.toFixed(2)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
                      <Label className="text-left sm:text-right text-sm font-medium">Doctor Percentage</Label>
                      <div className="col-span-1 sm:col-span-3 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={percentage}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              const clampedValue = Math.min(100, Math.max(0, value));
                              setPercentage(clampedValue);
                              setAmount(calculatedAmount * (clampedValue / 100));
                            }}
                            className="w-16 sm:w-20 text-xs sm:text-sm"
                          />
                          <span className="text-xs sm:text-sm">%</span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          (AFN {(calculatedAmount * (percentage / 100)).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Description Field - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label className="text-left sm:text-right text-sm font-medium">Description*</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-1 sm:col-span-3 text-xs sm:text-sm"
              />
            </div>

            {/* Amount Field - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label className="text-left sm:text-right text-sm font-medium">Amount*</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="col-span-1 sm:col-span-3 text-xs sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full sm:w-auto text-xs sm:text-sm"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto text-xs sm:text-sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : currentExpense ? "Update Expense" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}