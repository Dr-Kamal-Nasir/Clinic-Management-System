// components/CashAtHand.tsx
'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/useAuthStore';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CashAtHand() {
  const { user } = useAuthStore();
  const { data, error, isLoading } = useSWR(
    user ? '/api/laboratory/cash' : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  if (!user) return null;

  if (error) return (
    <Card className="border-red-500">
      <CardHeader>
        <CardTitle>Cash Position</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-red-500">Failed to load cash position</p>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Position</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600">
                ${data?.totalIncome?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ${data?.totalExpenses?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cash at Hand</p>
              <p className="text-2xl font-bold">
                ${data?.cashAtHand?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}