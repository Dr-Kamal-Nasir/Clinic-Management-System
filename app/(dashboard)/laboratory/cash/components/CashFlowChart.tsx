// app/(dashboard)/laboratory/cash/components/CashFlowChart.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DateRange } from 'react-day-picker';
import { useAuthStore } from '@/store/useAuthStore';
import { Skeleton } from '@/components/ui/skeleton';

interface CashFlowData {
  date: string;
  income: number;
  expenses: number;
}

interface DefinedDateRange {
  from: Date;
  to: Date;
}

interface CashFlowChartProps {
  dateRange: DefinedDateRange;
}

export default function CashFlowChart({ dateRange }: CashFlowChartProps) {
  const { user } = useAuthStore();
  const [data, setData] = useState<CashFlowData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    const fetchCashFlowData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('startDate', dateRange.from.toISOString());
        params.append('endDate', dateRange.to.toISOString());

        const response = await fetch(`/api/laboratory/cash/flow?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch cash flow data');
        
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Error fetching cash flow data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCashFlowData();
  }, [user, dateRange]);

  if (loading) {
    return (
      <div className="h-[350px] w-full">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[350px] flex items-center justify-center">
        <p className="text-muted-foreground">No data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            formatter={(value) => [`$${value}`, value === 'income' ? 'Income' : 'Expenses']}
            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#22c55e"
            strokeWidth={2}
            activeDot={{ r: 8 }}
            name="Income"
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#ef4444"
            strokeWidth={2}
            name="Expenses"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
