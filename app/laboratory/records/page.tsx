//app/laboraotry/records/page.tsx

"use client";

import { useState, useCallback, memo, useMemo } from "react";
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

interface TestTypeOption {
  value: string;
  label: string;
}

interface LaboratoryRecord {
  _id: string;
  date: string;
  patientName: string;
  invoiceNumber: string;
  testType: string;
  phoneNumber?: string;
  amountCharged: number;
  amountPaid: number;
  recordedBy?: {
    name: string;
    _id: string;
  };
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  optional?: boolean;
}

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

interface DateFilterProps {
  label: string;
  date?: Date;
  setDate: (date?: Date) => void;
}

interface SummaryCardProps {
  title: string;
  value: number;
}

const TEST_TYPES: TestTypeOption[] = [
  { value: "Blood Test", label: "Blood Test" },
  { value: "Stool Test", label: "Stool Test" },
  { value: "Urin Test", label: "Urin Test" },
  { value: "MRI", label: "MRI" },
  { value: "CT Scan", label: "CT Scan" },
  { value: "Ultrasound", label: "Ultrasound" },
  { value: "ECG", label: "ECG" },
  { value: "Other", label: "Other" },
];

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const FormField = memo(({ 
  label, 
  value, 
  onChange, 
  optional = false 
}: FormFieldProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
      <Label htmlFor={label.toLowerCase()} className="text-left sm:text-right text-sm font-medium">
        {label}{!optional && '*'}
      </Label>
      <Input
        id={label.toLowerCase()}
        value={value}
        onChange={onChange}
        className="col-span-1 sm:col-span-3"
      />
    </div>
  );
});
FormField.displayName = 'FormField';

const NumberField = memo(({ 
  label, 
  value, 
  onChange 
}: NumberFieldProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
      <Label className="text-left sm:text-right text-sm font-medium">{label}</Label>
      <Input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="col-span-1 sm:col-span-3"
      />
    </div>
  );
});
NumberField.displayName = 'NumberField';

const DateFilter = memo(({ 
  label, 
  date, 
  setDate 
}: DateFilterProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal text-xs sm:text-sm",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
});
DateFilter.displayName = 'DateFilter';

const SummaryCard = memo(({ title, value }: SummaryCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-sm sm:text-lg font-medium text-muted-foreground">{title}</h3>
          <p className="text-lg sm:text-2xl font-bold">${value.toFixed(2)}</p>
        </div>
      </CardContent>
    </Card>
  );
});
SummaryCard.displayName = 'SummaryCard';

export default function LaboratoryRecords() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [patientName, setPatientName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [testType, setTestType] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amountCharged, setAmountCharged] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<LaboratoryRecord | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();

  const handlePatientNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
    {
    setPatientName(e.target.value);
  }, []);

  const handleInvoiceNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInvoiceNumber(e.target.value);
  }, []);

  const handlePhoneNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  }, []);

  const handleAmountChargedChange = useCallback((value: number) => {
    setAmountCharged(value);
  }, []);

  const handleAmountPaidChange = useCallback((value: number) => {
    setAmountPaid(value);
  }, []);

  const queryString = new URLSearchParams();
  if (filterStartDate) queryString.append("startDate", filterStartDate.toISOString());
  if (filterEndDate) queryString.append("endDate", filterEndDate.toISOString());

  const { data: records, isLoading } = useSWR<LaboratoryRecord[]>(
    `/api/laboratory/records?${queryString.toString()}`,
    fetcher
  );

  const totalCharged = useMemo(() =>
    Array.isArray(records)
      ? records.reduce((sum, r) => sum + (r?.amountCharged || 0), 0)
      : 0,
    [records]
  );

  const totalPaid = useMemo(() =>
    Array.isArray(records)
      ? records.reduce((sum, r) => sum + (r?.amountPaid || 0), 0)
      : 0,
    [records]
  );

  const totalBalance = useMemo(() => 
    totalCharged - totalPaid, 
    [totalCharged, totalPaid]
  );

  const resetForm = useCallback(() => {
    setDate(new Date());
    setPatientName("");
    setInvoiceNumber("");
    setTestType("");
    setPhoneNumber("");
    setAmountCharged(0);
    setAmountPaid(0);
    setEditMode(false);
    setCurrentRecord(null);
  }, []);

  const handleEdit = useCallback((record: LaboratoryRecord) => {
    setDate(new Date(record.date));
    setPatientName(record.patientName);
    setInvoiceNumber(record.invoiceNumber);
    setTestType(record.testType);
    setPhoneNumber(record.phoneNumber || "");
    setAmountCharged(record.amountCharged);
    setAmountPaid(record.amountPaid);
    setCurrentRecord(record);
    setEditMode(true);
    setDialogOpen(true);
  }, []);

  const handleSubmit = async () => {
    if (!date || !patientName || !invoiceNumber || !testType || amountCharged <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const recordData = {
        date,
        patientName,
        invoiceNumber,
        testType,
        phoneNumber: phoneNumber || undefined,
        amountCharged,
        amountPaid,
      };

      const url = editMode 
        ? `/api/laboratory/records?id=${currentRecord?._id}` 
        : '/api/laboratory/records';
      
      const method = editMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Request failed');
      }

      toast.success(`Record ${editMode ? 'updated' : 'created'} successfully`);
      setDialogOpen(false);
      mutate(`/api/laboratory/records?${queryString.toString()}`);
      resetForm();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'An error occurred while saving the record'
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(`/api/laboratory/records?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      toast.success("Record deleted successfully");
      mutate(`/api/laboratory/records?${queryString.toString()}`);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to delete record'
      );
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Laboratory Records</h1>
        <Button 
          onClick={() => { setDialogOpen(true); resetForm(); }}
          className="w-full sm:w-auto text-xs sm:text-sm"
        >
          <PlusIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
          Add Record
        </Button>
      </div>

      {/* Filter Card - Responsive */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-sm sm:text-base">Filter Records</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <DateFilter 
              label="Start Date"
              date={filterStartDate}
              setDate={setFilterStartDate}
            />
            <DateFilter 
              label="End Date"
              date={filterEndDate}
              setDate={setFilterEndDate}
            />
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full text-xs sm:text-sm"
                onClick={() => {
                  setFilterStartDate(undefined);
                  setFilterEndDate(undefined);
                }}
              >
                Clear Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
        <SummaryCard title="Total Charged" value={totalCharged} />
        <SummaryCard title="Total Paid" value={totalPaid} />
        <SummaryCard title="Balance" value={totalBalance} />
      </div>

      {/* Table - Responsive with horizontal scroll */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Date</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Patient</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">Invoice</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Test Type</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Charged</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Paid</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Recorded By</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    <Skeleton className="h-8 sm:h-10 w-full" />
                  </TableCell>
                </TableRow>
              ) : records?.length ? (
                records.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                      {format(new Date(record.date), 'MMM d, yy')}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="max-w-[120px] sm:max-w-none truncate">
                        {record.patientName}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">
                      {record.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="max-w-[100px] sm:max-w-none truncate">
                        {record.testType}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap font-medium">
                      ${record.amountCharged.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">
                      ${record.amountPaid.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                      <div className="max-w-[120px] truncate">
                        {record.recordedBy?.name || 'System'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => handleEdit(record)}
                        >
                          <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 sm:h-8 sm:w-8"
                          onClick={() => handleDelete(record._id)}
                        >
                          <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog - Responsive */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {editMode ? 'Edit Record' : 'Add New Record'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Date Field - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="date" className="text-left sm:text-right text-sm font-medium">
                Date*
              </Label>
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
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <FormField
              label="Patient Name*"
              value={patientName}
              onChange={handlePatientNameChange}
            />
            <FormField
              label="Invoice Number*"
              value={invoiceNumber}
              onChange={handleInvoiceNumberChange}
            />
            
            {/* Test Type Select - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
              <Label htmlFor="testType" className="text-left sm:text-right text-sm font-medium">
                Test Type*
              </Label>
              <Select
                value={testType}
                onValueChange={setTestType}
              >
                <SelectTrigger className="col-span-1 sm:col-span-3 text-xs sm:text-sm">
                  <SelectValue placeholder="Select test type" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs sm:text-sm">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              label="Phone Number"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              optional
            />
            <NumberField
              label="Amount Charged*"
              value={amountCharged}
              onChange={handleAmountChargedChange}
            />
            <NumberField
              label="Amount Paid"
              value={amountPaid}
              onChange={handleAmountPaidChange}
            />
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
              type="button" 
              className="w-full sm:w-auto text-xs sm:text-sm"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {editMode ? 'Update' : 'Create'} Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};