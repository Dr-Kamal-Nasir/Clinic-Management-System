// // hooks/use-financial-data.ts
// import { useState, useEffect } from 'react';
// import  Prescription  from '@/lib/models/Prescription';
// import { Expense } from '@/lib/models/Expense';
// import { LaboratoryRecord } from '@/lib/models/LaboratoryRecord';
// import { LaboratoryExpense } from '@/lib/models/LaboratoryExpenses';
// import dbConnect from '@/lib/dbConnect';
// import { DateRange } from 'react-day-picker';

// export interface FinancialData {
//   totals: {
//     totalIncome: number;
//     totalExpenses: number;
//     netProfit: number;
//     labIncome: number;
//     labExpenses: number;
//     labProfit: number;
//     pharmaIncome: number;
//     pharmaExpenses: number;
//     pharmaProfit: number;
//   };
//   combinedData: Array<{
//     date: string;
//     labIncome: number;
//     labExpenses: number;
//     labProfit: number;
//     pharmaIncome: number;
//     pharmaExpenses: number;
//     pharmaProfit: number;
//     totalIncome: number;
//     totalExpenses: number;
//     netProfit: number;
//   }>;
//   revenueBreakdown: Array<{ name: string; value: number }>;
//   profitTrend: Array<{ date: string; profit: number }>;
// }

// export const useFinancialData = (dateRange: DateRange | undefined) => {
//   const [data, setData] = useState<FinancialData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<Error | null>(null);

//   const fetchData = async () => {
//     if (!dateRange?.from || !dateRange?.to) return;
    
//     setLoading(true);
//     setError(null);
    
//     try {
//       await dbConnect();

//       // Convert dates to start and end of day
//       const startDate = new Date(dateRange.from);
//       startDate.setHours(0, 0, 0, 0);
      
//       const endDate = new Date(dateRange.to);
//       endDate.setHours(23, 59, 59, 999);

//       // Fetch all data in parallel
//       const [
//         prescriptions,
//         pharmacyExpenses,
//         labRecords,
//         labExpenses
//       ] = await Promise.all([
//         Prescription.find({
//           status: 'completed',
//           createdAt: { $gte: startDate, $lte: endDate }
//         }).lean(),

//         Expense.find({
//           date: { $gte: startDate, $lte: endDate }
//         }).lean(),

//         LaboratoryRecord.find({
//           date: { $gte: startDate, $lte: endDate }
//         }).lean(),

//         LaboratoryExpense.find({
//           date: { $gte: startDate, $lte: endDate }
//         }).lean()
//       ]);

//       // Process pharmacy data
//       const pharmaIncome = prescriptions.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
//       const pharmaExpenses = pharmacyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
//       const pharmaProfit = pharmaIncome - pharmaExpenses;

//       // Process laboratory data
//       const labIncome = labRecords.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
//       const labExpensesTotal = labExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
//       const labProfit = labIncome - labExpensesTotal;

//       // Calculate totals
//       const totalIncome = labIncome + pharmaIncome;
//       const totalExpenses = labExpensesTotal + pharmaExpenses;
//       const netProfit = totalIncome - totalExpenses;

//       // Group data by date for daily trends
//       const dateMap = new Map<string, any>();
//       const currentDate = new Date(startDate);
      
//       // Initialize all dates in range
//       while (currentDate <= endDate) {
//         const dateKey = currentDate.toISOString().split('T')[0];
//         dateMap.set(dateKey, {
//           date: dateKey,
//           labIncome: 0,
//           labExpenses: 0,
//           labProfit: 0,
//           pharmaIncome: 0,
//           pharmaExpenses: 0,
//           pharmaProfit: 0,
//           totalIncome: 0,
//           totalExpenses: 0,
//           netProfit: 0
//         });
//         currentDate.setDate(currentDate.getDate() + 1);
//       }

//       // Process data by date
//       const processData = () => {
//         // Lab records
//         labRecords.forEach(record => {
//           const dateKey = new Date(record.date).toISOString().split('T')[0];
//           const entry = dateMap.get(dateKey) || createEmptyEntry(dateKey);
//           entry.labIncome += record.amountPaid || 0;
//           entry.totalIncome += record.amountPaid || 0;
//           dateMap.set(dateKey, entry);
//         });

//         // Lab expenses
//         labExpenses.forEach(expense => {
//           const dateKey = new Date(expense.date).toISOString().split('T')[0];
//           const entry = dateMap.get(dateKey) || createEmptyEntry(dateKey);
//           entry.labExpenses += expense.amount || 0;
//           entry.totalExpenses += expense.amount || 0;
//           dateMap.set(dateKey, entry);
//         });

//         // Pharmacy prescriptions
//         prescriptions.forEach(prescription => {
//           const dateKey = new Date(prescription.createdAt).toISOString().split('T')[0];
//           const entry = dateMap.get(dateKey) || createEmptyEntry(dateKey);
//           entry.pharmaIncome += prescription.totalAmount || 0;
//           entry.totalIncome += prescription.totalAmount || 0;
//           dateMap.set(dateKey, entry);
//         });

//         // Pharmacy expenses
//         pharmacyExpenses.forEach(expense => {
//           const dateKey = new Date(expense.date).toISOString().split('T')[0];
//           const entry = dateMap.get(dateKey) || createEmptyEntry(dateKey);
//           entry.pharmaExpenses += expense.amount || 0;
//           entry.totalExpenses += expense.amount || 0;
//           dateMap.set(dateKey, entry);
//         });

//         // Calculate profits for each date
//         dateMap.forEach((value, key) => {
//           value.labProfit = value.labIncome - value.labExpenses;
//           value.pharmaProfit = value.pharmaIncome - value.pharmaExpenses;
//           value.netProfit = value.totalIncome - value.totalExpenses;
//         });
//       };

//       const createEmptyEntry = (dateKey: string) => ({
//         date: dateKey,
//         labIncome: 0,
//         labExpenses: 0,
//         labProfit: 0,
//         pharmaIncome: 0,
//         pharmaExpenses: 0,
//         pharmaProfit: 0,
//         totalIncome: 0,
//         totalExpenses: 0,
//         netProfit: 0
//       });

//       processData();

//       // Convert map to sorted array
//       const combinedData = Array.from(dateMap.values()).sort((a, b) => 
//         new Date(a.date).getTime() - new Date(b.date).getTime()
//       );

//       // Create profit trend data (simplified for charting)
//       const profitTrend = combinedData.map(item => ({
//         date: item.date,
//         profit: item.netProfit
//       }));

//       // Create the final processed data object
//       const processedData: FinancialData = {
//         totals: {
//           totalIncome,
//           totalExpenses,
//           netProfit,
//           labIncome,
//           labExpenses: labExpensesTotal,
//           labProfit,
//           pharmaIncome,
//           pharmaExpenses,
//           pharmaProfit
//         },
//         combinedData,
//         revenueBreakdown: [
//           { name: 'Laboratory', value: labIncome },
//           { name: 'Pharmacy', value: pharmaIncome }
//         ],
//         profitTrend
//       };

//       setData(processedData);
//     } catch (err) {
//       setError(err instanceof Error ? err : new Error('Failed to fetch financial data'));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [dateRange]);

//   const refresh = () => {
//     fetchData();
//   };

//   return { data, loading, error, refresh };
// };
