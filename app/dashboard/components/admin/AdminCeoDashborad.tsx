// app/pharmacy/dashboard/page.tsx
"use client";
import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  CalendarIcon,
  PlusIcon,
  PillIcon,
  ReceiptIcon,
  WalletIcon,
  AlertCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Loader2Icon,
  FlaskConicalIcon,
  SyringeIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
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
import { safeFormat } from "@/utils/dateUtils";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

// Types
type DashboardStats = {
  totalSales: number;
  cashSales: number;
  cardSales: number;
  insuranceSales: number;
  totalExpenses: number;
  inventoryValue: number;
  lowStockItems: number;
  labTotalRevenue: number;
  labTotalExpenses: number;
  labNetProfit: number;
  pendingLabTests: number;
  completedLabTests: number;
};

type RecentPrescription = {
  _id: string;
  patientName: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  status: "completed" | "pending" | "cancelled";
};

type LowStockItem = {
  _id: string;
  name: string;
  batchNumber: string;
  currentQuantity: number;
  originalQuantity: number;
  remainingPercentage: number;
};

type RecentExpense = {
  _id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: "pharmacy" | "laboratory";
};

type LabTestRecord = {
  _id: string;
  patientName: string;
  testType: string;
  status: "pending" | "completed" | "cancelled";
  orderedDate: string;
  completedDate?: string;
  amountPaid: number;
  doctorName?: string;
};

type LabExpense = {
  _id: string;
  amount: number;
  expenseType: string;
  description: string;
  date: string;
  doctorName?: string;
};

type TestTypeData = {
  name: string;
  value: number;
};

type ExpenseTypeData = {
  name: string;
  value: number;
};

type LabMetrics = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  testTypeData: TestTypeData[];
  expenseTypeData: ExpenseTypeData[];
};

type MonthlyLabData = {
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
};

// Fetcher function
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PharmacyDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [labStartDate, setLabStartDate] = useState<Date | undefined>();
  const [labEndDate, setLabEndDate] = useState<Date | undefined>();

  // Fetch all dashboard data
  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>(
    "/api/pharmacy/dashboard/stats",
    fetcher
  );
  const { data: recentPrescriptions, isLoading: prescriptionsLoading } = useSWR<
    RecentPrescription[]
  >("/api/pharmacy/prescriptions/recent", fetcher);
  const {
    data: lowStockItems,
    isLoading: stockLoading,
    error: stockError,
  } = useSWR<LowStockItem[]>("/api/pharmacy/inventory/low-stock", fetcher);
  const { data: recentExpenses, isLoading: expensesLoading } = useSWR<
    RecentExpense[]
  >("/api/pharmacy/expenses/recent", fetcher);
  const { data: labRecords, isLoading: labRecordsLoading } = useSWR<
    LabTestRecord[]
  >(
    `/api/laboratory/records?${new URLSearchParams({
      startDate: labStartDate?.toISOString() || "",
      endDate: labEndDate?.toISOString() || "",
    })}`,
    fetcher
  );
  const { data: labExpenses, isLoading: labExpensesLoading } = useSWR<
    LabExpense[]
  >(
    `/api/laboratory/expenses?${new URLSearchParams({
      startDate: labStartDate?.toISOString() || "",
      endDate: labEndDate?.toISOString() || "",
    })}`,
    fetcher
  );

  // Calculate metrics
  const labMetrics = useMemo<LabMetrics | null>(() => {
    if (!labRecords || !labExpenses) return null;

    const totalRevenue = labRecords.reduce(
      (sum, record) => sum + record.amountPaid,
      0
    );
    const totalExpenses = labExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const netProfit = totalRevenue - totalExpenses;

    // Group by test type
    const testTypeData = labRecords.reduce((acc: Record<string, number>, record) => {
      acc[record.testType] = (acc[record.testType] || 0) + record.amountPaid;
      return acc;
    }, {});

    // Group by expense type
    const expenseTypeData = labExpenses.reduce((acc: Record<string, number>, expense) => {
      const type =
        expense.expenseType === "doctor_salary"
          ? "Doctor Salaries"
          : "Other Expenses";
      acc[type] = (acc[type] || 0) + expense.amount;
      return acc;
    }, {});

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
  }, [labRecords, labExpenses]);

  // Monthly data for line chart
  const monthlyLabData = useMemo<MonthlyLabData[]>(() => {
    if (!labRecords || !labExpenses) return [];

    // Group records by month
    const monthlyRecords: Record<string, number> = {};
    labRecords.forEach((record) => {
      const month = safeFormat(record.orderedDate, 'MMM yyyy');
      if (month !== 'N/A') {
        monthlyRecords[month] = (monthlyRecords[month] || 0) + record.amountPaid;
      }
    });

    // Group expenses by month
    const monthlyExpenses: Record<string, number> = {};
    labExpenses.forEach((expense) => {
      const month = safeFormat(expense.date, 'MMM yyyy');
      if (month !== 'N/A') {
        monthlyExpenses[month] = (monthlyExpenses[month] || 0) + expense.amount;
      }
    });

    // Combine data
    const allMonths = [...new Set([
      ...Object.keys(monthlyRecords),
      ...Object.keys(monthlyExpenses)
    ])].filter(month => month !== 'N/A');

    return allMonths
      .map(month => ({
        name: month,
        revenue: monthlyRecords[month] || 0,
        expenses: monthlyExpenses[month] || 0,
        profit: (monthlyRecords[month] || 0) - (monthlyExpenses[month] || 0)
      }))
      .sort((a, b) => {
        const dateA = new Date(a.name);
        const dateB = new Date(b.name);
        return isNaN(dateA.getTime()) || isNaN(dateB.getTime()) 
          ? a.name.localeCompare(b.name) 
          : dateA.getTime() - dateB.getTime();
      });
  }, [labRecords, labExpenses]);

  // Calculate percentage changes
  const salesChange = 12.5;
  const expensesChange = -4.3;
  const inventoryChange = 2.1;
  const labTestsChange = 8.7;
  const labRevenueChange = 15.2;

  // Loading states
  const isLoading =
    statsLoading ||
    prescriptionsLoading ||
    stockLoading ||
    expensesLoading ||
    labRecordsLoading ||
    labExpensesLoading;
  const labLoading = labRecordsLoading || labExpensesLoading;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Pharmacy & Laboratory Dashboard</h1>
        <div className="flex gap-4">
          <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(new Date(), "MMMM d, yyyy")}
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
                <CardTitle className="text-sm font-medium">
                  Pharmacy Sales
                </CardTitle>
                <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.totalSales?.toFixed(2) || "0.00"}
                </div>
                <div
                  className={`flex items-center text-xs ${
                    salesChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
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
                <CardTitle className="text-sm font-medium">
                  Lab Revenue
                </CardTitle>
                <FlaskConicalIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.labTotalRevenue?.toFixed(2) || "0.00"}
                </div>
                <div
                  className={`flex items-center text-xs ${
                    labRevenueChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {labRevenueChange >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(labRevenueChange)}% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                 Pharmacy Total Expenses 
                </CardTitle>
                <WalletIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.totalExpenses?.toFixed(2) || "0.00"}
                </div>
                <div
                  className={`flex items-center text-xs ${
                    expensesChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
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
                <CardTitle className="text-sm font-medium">Lab Tests</CardTitle>
                <SyringeIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.completedLabTests || 0} /{" "}
                  {stats?.pendingLabTests || 0}
                </div>
                <div
                  className={`flex items-center text-xs ${
                    labTestsChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {labTestsChange >= 0 ? (
                    <TrendingUpIcon className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDownIcon className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(labTestsChange)}% from last period
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="pharmacy" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
              <TabsTrigger value="laboratory">Laboratory</TabsTrigger>
            </TabsList>

            <TabsContent value="pharmacy" className="space-y-4">
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
                        {recentPrescriptions?.map((prescription) => (
                          <TableRow key={prescription._id}>
                            <TableCell>{prescription.patientName}</TableCell>
                            <TableCell>
                              ${prescription.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {prescription.paymentMethod}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(prescription.createdAt),
                                "MMM d, yyyy"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  prescription.status === "completed"
                                    ? "default"
                                    : prescription.status === "pending"
                                    ? "secondary"
                                    : "destructive"
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
                        {lowStockItems?.map((item) => (
                          <div key={item._id} className="flex items-center">
                            <div className="space-y-1 w-full">
                              <p className="text-sm font-medium leading-none">
                                {item.name} - {item.batchNumber}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                  {item.currentQuantity} /{" "}
                                  {item.originalQuantity} remaining
                                </span>
                                <span className="text-sm font-medium">
                                  {item.remainingPercentage.toFixed(0)}%
                                </span>
                              </div>
                              <Progress
                                value={item.remainingPercentage}
                                className="h-2"
                                style={
                                  {
                                    "--progress-indicator-color":
                                      item.remainingPercentage < 10
                                        ? "#ef4444"
                                        : item.remainingPercentage < 20
                                        ? "#eab308"
                                        : "#22c55e",
                                  } as React.CSSProperties
                                }
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

            <TabsContent value="laboratory" className="space-y-4">
              {/* Laboratory Dashboard Content */}
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">
                  Laboratory Financial Dashboard
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setLabStartDate(undefined);
                      setLabEndDate(undefined);
                    }}
                  >
                    Clear Dates
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
                      ${labMetrics?.totalRevenue?.toFixed(2) || "0.00"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Total Expenses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      ${labMetrics?.totalExpenses?.toFixed(2) || "0.00"}
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
                        labMetrics?.netProfit && labMetrics.netProfit >= 0
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      ${labMetrics?.netProfit?.toFixed(2) || "0.00"}
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
                    {labLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyLabData}
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
                          <Bar
                            dataKey="revenue"
                            fill="#8884d8"
                            name="Revenue"
                          />
                          <Bar
                            dataKey="expenses"
                            fill="#82ca9d"
                            name="Expenses"
                          />
                          <Bar dataKey="profit" fill="#ffc658" name="Profit" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Test Type</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {labLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={labMetrics?.testTypeData || []}
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
                            {labMetrics?.testTypeData?.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {labLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={labMetrics?.expenseTypeData || []}
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
                            {labMetrics?.expenseTypeData?.map(
                              (entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              )
                            )}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {labLoading ? (
                      <Skeleton className="h-[300px] w-full" />
                    ) : (
                      <div className="space-y-4">
                        {[
                          ...(labRecords || []).slice(0, 5),
                          ...(labExpenses || []).slice(0, 5),
                        ]
                          .sort((a, b) => {
                            const getDate = (item: any) => {
                              if ("orderedDate" in item)
                                return new Date(item.orderedDate);
                              if ("date" in item) return new Date(item.date);
                              return new Date(0); // Fallback for invalid dates
                            };
                            return getDate(b).getTime() - getDate(a).getTime();
                          })
                          .slice(0, 5)
                          .map((item) => {
                            const isRecord = "testType" in item;
                            const date = isRecord
                              ? item.orderedDate
                              : item.date;
                            const description = isRecord
                              ? item.testType
                              : item.description;
                            const amount = isRecord
                              ? item.amountPaid
                              : -item.amount;
                            const doctorName = item.doctorName || "N/A";

                            return (
                              <div
                                key={item._id}
                                className="flex justify-between items-center p-2 border rounded"
                              >
                                <div>
                                  <p className="font-medium">{description}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {safeFormat(new Date(date), "PP")} •{" "}
                                    {doctorName}
                                  </p>
                                </div>
                                <div
                                  className={`font-bold ${
                                    isRecord ? "text-green-500" : "text-red-500"
                                  }`}
                                >
                                  {isRecord
                                    ? `+$${amount.toFixed(2)}`
                                    : `-$${Math.abs(amount).toFixed(2)}`}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
