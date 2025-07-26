"use client";
import { useState, useEffect } from "react";
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
type Expense = {
  _id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  recordedBy?: { name: string };
};

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
];

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PharmacyExpensesPage() {
  const { user } = useAuthStore();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);

  // Build query string for filtering
  const queryString = new URLSearchParams();
  if (filterStartDate)
    queryString.append("startDate", filterStartDate.toISOString());
  if (filterEndDate) queryString.append("endDate", filterEndDate.toISOString());

  const {
    data: expenses,
    isLoading,
    error,
  } = useSWR<Expense[]>(
    `/api/pharmacy/expenses?${queryString.toString()}`,
    fetcher
  );

  // Calculate total expenses
  const totalExpenses = 
  expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;


  // Initialize form for new expense
  const initNewExpense = () => {
    setDate(new Date());
    setAmount(0);
    setCategory("");
    setDescription("");
    setEditMode(false);
    setCurrentExpense(null);
  };

  // Open edit dialog with expense data
  const openEditDialog = (expense: Expense) => {
    setDate(new Date(expense.date));
    setAmount(expense.amount);
    setCategory(expense.category);
    setDescription(expense.description);
    setCurrentExpense(expense);
    setEditMode(true);
    setDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!date || !category || !description || amount <= 0) {
      toast("Validation Error", {
        description:
          "Please fill all required fields and ensure amount is positive.",
      });
      return;
    }

    try {
      const method = editMode ? "PUT" : "POST";
      const url = "/api/pharmacy/expenses";
      const body = editMode
        ? { ...currentExpense, date, amount, category, description }
        : { date, amount, category, description };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast("Success", {
          description: editMode
            ? "Expense updated successfully"
            : "Expense recorded successfully",
        });
        setDialogOpen(false);
        mutate(`/api/pharmacy/expenses?${queryString.toString()}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save expense");
      }
    } catch (error: any) {
      toast("Error", {
        description: error.message || "Failed to save expense",
      });
    }
  };

  // Handle expense deletion
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pharmacy/expenses?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast("Success", {
          description: "Expense deleted successfully",
        });
        mutate(`/api/pharmacy/expenses?${queryString.toString()}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete expense");
      }
    } catch (error: any) {
      toast("Error", {
        description: error.message || "Failed to delete expense",
      });
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pharmacy Expenses</h1>
        <Button
          onClick={() => {
            setDialogOpen(true);
            initNewExpense();
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Date Filter */}
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
                    {filterStartDate ? (
                      format(filterStartDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
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
                    {filterEndDate ? (
                      format(filterEndDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
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
              <Button
                variant="secondary"
                className="w-full"
                onClick={resetDateFilter}
              >
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
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            initNewExpense();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editMode ? "Edit Expense" : "Record New Expense"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category *
              </Label>
              <Select value={category} onValueChange={setCategory}>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                initNewExpense();
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
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
                onClick={() =>
                  mutate(`/api/pharmacy/expenses?${queryString.toString()}`)
                }
              >
                Retry
              </Button>
            </div>
          ) : (
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
                {expenses && expenses.length > 0 ? (
                  expenses.map((expense) => (
                    <TableRow key={expense._id}>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell className="text-right">
                        {/* Safe amount display */}$
                        {(expense.amount ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {expense.recordedBy?.name || "System"}
                      </TableCell>
                      <TableCell>
                        {" "}
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      No expenses recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
