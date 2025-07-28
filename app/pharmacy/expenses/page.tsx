"use client";
import { useState, useEffect, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { PlusIcon, PencilIcon, TrashIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Define types
interface Expense {
  _id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  recordedBy?: {
    name: string;
    _id: string;
  };
}

interface User {
  name: string;
  _id: string;
  // Add other user properties as needed
}

interface AuthStore {
  user: User | null;
  // Add other auth store properties as needed
}

// Predefined categories
const CATEGORIES = [
  "Supplies",
  "Utilities",
  "Salaries",
  "Rent",
  "Maintenance",
  "Insurance",
  "Taxes",
  "Other",
] as const;

type Category = typeof CATEGORIES[number];

// Fetcher function with proper typing
const fetcher = (url: string): Promise<Expense[]> => 
  fetch(url).then((res) => res.json());

export default function PharmacyExpensesPage() {
  const { user } = useAuthStore() as AuthStore;
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<Category>("Supplies");
  const [description, setDescription] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Build query string for filtering
  const queryString = new URLSearchParams();
  if (filterStartDate) queryString.append("startDate", filterStartDate.toISOString());
  if (filterEndDate) queryString.append("endDate", filterEndDate.toISOString());

  const { data: expenses, isLoading, error } = useSWR<Expense[]>(
    `/api/pharmacy/expenses?${queryString.toString()}`,
    fetcher
  );

  // Calculate total expenses
  const totalExpenses = Array.isArray(expenses)
    ? expenses.reduce((sum: number, expense: Expense) => sum + (expense?.amount || 0), 0)
    : 0;

  // Initialize form for new expense
  const initNewExpense = useCallback(() => {
    setDate(new Date());
    setAmount(0);
    setCategory("Supplies");
    setDescription("");
    setEditMode(false);
    setCurrentExpense(null);
  }, []);

  // Open edit dialog with expense data
  const openEditDialog = useCallback((expense: Expense) => {
    setDate(new Date(expense.date));
    setAmount(expense.amount);
    setCategory(expense.category as Category);
    setDescription(expense.description);
    setCurrentExpense(expense);
    setEditMode(true);
    setDialogOpen(true);
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    if (!date || !category || !description || amount <= 0) {
      toast.error("Please fill all required fields and ensure amount is positive.");
      return;
    }

    try {
      const method = editMode ? "PUT" : "POST";
      const url = editMode 
        ? `/api/pharmacy/expenses?id=${currentExpense?._id}`
        : '/api/pharmacy/expenses';
      
      const body = {
        date,
        amount,
        category,
        description,
        ...(editMode && { _id: currentExpense?._id })
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save expense");
      }

      toast.success(
        editMode ? "Expense updated successfully" : "Expense recorded successfully"
      );
      setDialogOpen(false);
      mutate(`/api/pharmacy/expenses?${queryString.toString()}`);
      initNewExpense();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to save expense"
      );
    }
  };

  // Handle expense deletion
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pharmacy/expenses?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }

      toast.success("Expense deleted successfully");
      mutate(`/api/pharmacy/expenses?${queryString.toString()}`);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : "Failed to delete expense"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset date filter
  const resetDateFilter = () => {
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header and Add Expense Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pharmacy Expenses</h1>
        <Button onClick={() => { setDialogOpen(true); initNewExpense(); }}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Date Filter Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !filterStartDate && "text-muted-foreground"
                    )}
                  >
                    {filterStartDate ? format(filterStartDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterStartDate}
                    onSelect={setFilterStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !filterEndDate && "text-muted-foreground"
                    )}
                  >
                    {filterEndDate ? format(filterEndDate, "PPP") : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterEndDate}
                    onSelect={setFilterEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-end">
              <Button variant="secondary" className="w-full" onClick={resetDateFilter}>
                Clear Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Total Expenses</h3>
            <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Expense Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!open) {
          setDialogOpen(false);
          initNewExpense();
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editMode ? "Edit Expense" : "Record New Expense"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Date Picker */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "col-span-3 text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
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

            {/* Amount Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount ($) *
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="col-span-3"
              />
            </div>

            {/* Category Select */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category *
              </Label>
              <Select value={category} onValueChange={(value: Category) => setCategory(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description *
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editMode ? "Update Expense" : "Record Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <p className="text-red-500">Failed to load expenses</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => mutate(`/api/pharmacy/expenses?${queryString.toString()}`)}
              >
                Retry
              </Button>
            </div>
          ) : expenses && expenses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                    <TableCell>{expense.recordedBy?.name || "System"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(expense)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(expense._id)}
                          disabled={isDeleting}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <p>No expenses found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
