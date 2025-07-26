//app/laboratory/dashboard/page.tsx

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

interface LabRecord {
  _id: string;
  amountPaid: number;
  testType: string;
  date: string;
  description?: string;
  doctorName?: string;
}

interface Expense {
  _id: string;
  amount: number;
  expenseType: string;
  date: string;
  description?: string;
}

interface TestTypeData {
  name: string;
  value: number;
}

interface ExpenseTypeData {
  name: string;
  value: number;
}

interface MonthlyData {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface Metrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  testTypeData: TestTypeData[];
  expenseTypeData: ExpenseTypeData[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  // Fetch data
  const { data: records, isLoading: recordsLoading } = useSWR<LabRecord[]>(
    `/api/laboratory/records?${new URLSearchParams({
      startDate: startDate?.toISOString() || "",
      endDate: endDate?.toISOString() || "",
    })}`,
    fetcher
  );

  const { data: expenses, isLoading: expensesLoading } = useSWR<Expense[]>(
    `/api/laboratory/expenses?${new URLSearchParams({
      startDate: startDate?.toISOString() || "",
      endDate: endDate?.toISOString() || "",
    })}`,
    fetcher
  );

  // Calculate metrics
  const metrics = useMemo<Metrics | null>(() => {
    if (!records || !expenses) return null;

    const totalRevenue = records.reduce(
      (sum: number, record: LabRecord) => sum + record.amountPaid,
      0
    );
    const totalExpenses = expenses.reduce(
      (sum: number, expense: Expense) => sum + expense.amount,
      0
    );
    const netProfit = totalRevenue - totalExpenses;

    // Group by test type - using Record<string, number> properly
    const testTypeData = records.reduce(
      (acc: Record<string, number>, record: LabRecord) => {
        acc[record.testType] = (acc[record.testType] || 0) + record.amountPaid;
        return acc;
      },
      {} as Record<string, number>
    ); // Initialize as empty Record

    // Group by expense type - using Record<string, number> properly
    const expenseTypeData = expenses.reduce(
      (acc: Record<string, number>, expense: Expense) => {
        const type =
          expense.expenseType === "doctor_salary"
            ? "Doctor Salaries"
            : "Other Expenses";
        acc[type] = (acc[type] || 0) + expense.amount;
        return acc;
      },
      {} as Record<string, number>
    ); // Initialize as empty Record

    function isLabRecord(item: LabRecord | Expense): item is LabRecord {
      return "testType" in item;
    }

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      testTypeData: Object.entries(testTypeData).map(([name, value]) => ({
        name,
        value,
      })),
      expenseTypeData: Object.entries(expenseTypeData).map(([name, value]) => ({
        name,
        value,
      })),
    };
  }, [records, expenses]);

  // Monthly data for line chart
  const monthlyData = useMemo<MonthlyData[]>(() => {
    if (!records || !expenses) return [];

    // Group records by month - using Record<string, number> properly
    const monthlyRecords: Record<string, number> = {};
    records.forEach((record: LabRecord) => {
      const month = format(new Date(record.date), "MMM yyyy");
      monthlyRecords[month] = (monthlyRecords[month] || 0) + record.amountPaid;
    });

    // Group expenses by month - using Record<string, number> properly
    const monthlyExpenses: Record<string, number> = {};
    expenses.forEach((expense: Expense) => {
      const month = format(new Date(expense.date), "MMM yyyy");
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + expense.amount;
    });

    // Combine data
    const allMonths = new Set([
      ...Object.keys(monthlyRecords),
      ...Object.keys(monthlyExpenses),
    ]);

    return Array.from(allMonths)
      .map((month) => ({
        name: month,
        revenue: monthlyRecords[month] || 0,
        expenses: monthlyExpenses[month] || 0,
        profit: (monthlyRecords[month] || 0) - (monthlyExpenses[month] || 0),
      }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
  }, [records, expenses]);

  if (recordsLoading || expensesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Laboratory Financial Dashboard</h1>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Start Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>End Date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                disabled={(date) => (startDate ? date < startDate : false)}
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="secondary"
            onClick={() => {
              setStartDate(undefined);
              setEndDate(undefined);
            }}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${metrics?.totalRevenue?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${metrics?.totalExpenses?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${
                metrics?.netProfit && metrics.netProfit >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ${metrics?.netProfit?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                <Bar dataKey="profit" fill="#ffc658" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Test Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.testTypeData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {metrics?.testTypeData?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.expenseTypeData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {metrics?.expenseTypeData?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...(records || []).slice(0, 5), ...(expenses || []).slice(0, 5)]
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .slice(0, 5)
                .map((item) => {
                  const isRecord = "testType" in item;
                  return (
                    <div
                      key={item._id}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {isRecord
                            ? item.testType
                            : item.description || "Expense"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(item.date), "PP")} •{" "}
                          {"doctorName" in item ? item.doctorName : "N/A"}
                        </p>
                      </div>
                      <div
                        className={`font-bold ${
                          isRecord ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {isRecord
                          ? `+$${item.amountPaid.toFixed(2)}`
                          : `-$${item.amount.toFixed(2)}`}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
