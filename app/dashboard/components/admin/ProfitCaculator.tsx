// app/dashboard/components/admin-ceo/ProfitCalculator.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#10b981', '#f97316'];

export default function ProfitCalculator({ data, loading }: any) {
  if (loading || !data) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-6 w-1/3" />
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/6" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profitData = [
    {
      name: 'Laboratory',
      profit: data.totals.labProfit,
      color: '#10b981'
    },
    {
      name: 'Pharmacy',
      profit: data.totals.pharmaProfit,
      color: '#f97316'
    }
  ];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Profit Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Profit Breakdown</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-semibold">
                  ${data.totals.totalIncome.toLocaleString()}
                </span>
              </div>
              
              <div className="pl-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Laboratory Revenue</span>
                  <span>${data.totals.labIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pharmacy Revenue</span>
                  <span>${data.totals.pharmaIncome.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between border-t pt-2">
                <span>Total Expenses:</span>
                <span className="font-semibold text-red-600">
                  ${data.totals.totalExpenses.toLocaleString()}
                </span>
              </div>
              
              <div className="pl-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Laboratory Expenses</span>
                  <span>${data.totals.labExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pharmacy Expenses</span>
                  <span>${data.totals.pharmaExpenses.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between border-t pt-4 text-lg">
                <span className="font-bold">Net Profit:</span>
                <span className={`font-bold ${
                  data.totals.netProfit > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ${data.totals.netProfit.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span>Profit Margin:</span>
                <span className={`font-semibold ${
                  data.totals.netProfit > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {((data.totals.netProfit / data.totals.totalIncome) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="pt-4">
              <Button>Export Detailed Report</Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Profit Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={profitData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Profit']} />
                  <Bar dataKey="profit">
                    {profitData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.profit > 0 ? entry.color : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-300">Laboratory</h4>
                <p className={`text-xl ${
                  data.totals.labProfit > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ${data.totals.labProfit.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {((data.totals.labProfit / data.totals.netProfit) * 100).toFixed(1)}% of total profit
                </p>
              </div>
              
              <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-700 dark:text-orange-300">Pharmacy</h4>
                <p className={`text-xl ${
                  data.totals.pharmaProfit > 0 
                    ? 'text-orange-600' 
                    : 'text-red-600'
                }`}>
                  ${data.totals.pharmaProfit.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  {((data.totals.pharmaProfit / data.totals.netProfit) * 100).toFixed(1)}% of total profit
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}