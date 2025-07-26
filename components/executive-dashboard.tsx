
// app/dashboard/components/executive-dashboard.tsx
'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalendarDateRangePicker } from '@/components/calendar-date-range-picker';
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
  LineChart,
  Line
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useFinancialData } from '@/hook/FinancialData';
import { Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ExecutiveDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const { data, loading, error, refresh } = useFinancialData(dateRange);
  const { accessToken } = useAuthStore();

const handleExportReport = async () => {
  try {
    if (!data) return;
    
    const response = await fetch('/api/report/executive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ 
        dateRange,
        data: {
          totals: data.totals,
          combinedData: data.combinedData,
          revenueBreakdown: data.revenueBreakdown
        }
      }),
    });

    if (!response.ok) throw new Error('Failed to generate report');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-report-${new Date().toISOString().slice(0,10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Failed to export report:', error);
    // You might want to add error state handling here
  }
};

// Also add the missing profitMargin calculation
const profitMargin = data?.totals?.netProfit && data?.totals?.totalIncome
  ? (data.totals.netProfit / data.totals.totalIncome) * 100
  : 0;

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* ... other header content ... */}
        <div className="flex flex-col sm:flex-row gap-2">
          <CalendarDateRangePicker 
            dateRange={dateRange} 
            onDateChange={setDateRange} 
          />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={refresh} 
              disabled={loading}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button 
              onClick={handleExportReport} 
              disabled={!data}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total Revenue"
          value={data?.totals?.totalIncome || 0}
          loading={loading}
          isCurrency
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <DashboardCard
          title="Total Expenses"
          value={data?.totals?.totalExpenses || 0}
          loading={loading}
          isCurrency
          icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />}
        />
        <DashboardCard
          title="Net Profit"
          value={data?.totals?.netProfit || 0}
          loading={loading}
          isCurrency
          trend={data?.totals?.netProfit ? data.totals.netProfit >= 0 ? 'up' : 'down' : undefined}
        />
        <DashboardCard
          title="Profit Margin"
          value={profitMargin}
          loading={loading}
          isPercentage
          trend={profitMargin >= 0 ? 'up' : 'down'}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit-trends">Profit Trends</TabsTrigger>
          <TabsTrigger value="department">Department Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue & Expenses</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {loading ? (
                  <Skeleton className="h-[350px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data?.combinedData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalIncome" name="Revenue" fill="#4F46E5" />
                      <Bar dataKey="totalExpenses" name="Expenses" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-[350px]" />
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={data?.revenueBreakdown || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(data?.revenueBreakdown || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profit Trends Tab */}
        <TabsContent value="profit-trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Net Profit Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px]">
              {loading ? (
                <Skeleton className="h-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.combinedData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="netProfit" 
                      name="Net Profit" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Analysis Tab */}
        <TabsContent value="department" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Department Profit Comparison</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <Skeleton className="h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Laboratory',
                          profit: data?.totals?.labProfit || 0,
                          color: '#3B82F6'
                        },
                        {
                          name: 'Pharmacy',
                          profit: data?.totals?.pharmaProfit || 0,
                          color: '#10B981'
                        }
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="profit" name="Profit">
                        {[
                          {
                            name: 'Laboratory',
                            profit: data?.totals?.labProfit || 0,
                            color: '#3B82F6'
                          },
                          {
                            name: 'Pharmacy',
                            profit: data?.totals?.pharmaProfit || 0,
                            color: '#10B981'
                          }
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.profit >= 0 ? entry.color : '#EF4444'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Department Contribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                {loading ? (
                  <Skeleton className="h-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { 
                            name: 'Laboratory', 
                            value: data?.totals?.labProfit || 0,
                            color: '#3B82F6'
                          },
                          { 
                            name: 'Pharmacy', 
                            value: data?.totals?.pharmaProfit || 0,
                            color: '#10B981'
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { 
                            name: 'Laboratory', 
                            value: data?.totals?.labProfit || 0,
                            color: '#3B82F6'
                          },
                          { 
                            name: 'Pharmacy', 
                            value: data?.totals?.pharmaProfit || 0,
                            color: '#10B981'
                          }
                        ].map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.value >= 0 ? entry.color : '#EF4444'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [
                        `${value >= 0 ? '$' : '-$'}${Math.abs(value).toLocaleString()}`,
                        'Profit'
                      ]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  value: number;
  loading: boolean;
  isCurrency?: boolean;
  isPercentage?: boolean;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
}

function DashboardCard({
  title,
  value,
  loading,
  isCurrency = false,
  isPercentage = false,
  icon,
  trend
}: DashboardCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  const trendIcon = trend === 'up' ? (
    <TrendingUp className={`h-4 w-4 ${trendColor}`} />
  ) : (
    <TrendingDown className={`h-4 w-4 ${trendColor}`} />
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon || (trend && trendIcon)}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-full" />
        ) : (
          <div className={`text-2xl font-bold ${trend ? trendColor : ''}`}>
            {isCurrency && '$'}
            {isPercentage ? value.toFixed(1) : Math.abs(value).toLocaleString()}
            {isPercentage && '%'}
            {value < 0 && isCurrency && !isPercentage && ' (Loss)'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
