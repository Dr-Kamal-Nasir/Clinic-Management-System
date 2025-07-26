// app/(dashboard)/laboratory/cash/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import CashFlowChart from './components/CashFlowChart';
import { Skeleton } from '@/components/ui/skeleton';

interface DefinedDateRange {
  from: Date;
  to: Date;
}

export default function CashAtHandPage() {
  const { user } = useAuthStore();
  const [cashPosition, setCashPosition] = useState<{
    totalIncome: number;
    totalExpenses: number;
    cashAtHand: number;
    updatedAt: Date;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DefinedDateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });

  const fetchCashPosition = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('startDate', dateRange.from.toISOString());
      params.append('endDate', dateRange.to.toISOString());

      const response = await fetch(`/api/laboratory/cash?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch cash position');
      
      const data = await response.json();
      setCashPosition({
        totalIncome: data.totalIncome,
        totalExpenses: data.totalExpenses,
        cashAtHand: data.cashAtHand,
        updatedAt: new Date(data.updatedAt),
      });
    } catch (error) {
      console.error('Error fetching cash position:', error);
      toast.error('Error', {
        description: 'Failed to load cash position data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashPosition();
  }, [user, dateRange]);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange(range as DefinedDateRange);
    } else {
      setDateRange({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };
 
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Cash at Hand</h1>
        <div className="flex items-center gap-2">
          <DateRangePicker 
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
          <Button onClick={fetchCashPosition} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : cashPosition ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(cashPosition.totalIncome)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(cashPosition.totalExpenses)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cash at Hand</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatCurrency(cashPosition.cashAtHand)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <CashFlowChart dateRange={dateRange} />
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground text-right">
            Last updated: {cashPosition.updatedAt.toLocaleString()}
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Unable to load cash position data.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
