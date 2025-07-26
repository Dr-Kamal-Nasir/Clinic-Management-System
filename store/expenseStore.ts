//store/expenseStore.ts

import { create } from 'zustand';
import { LabExpense } from '@/types/laboratory';

interface ExpenseStore {
  expenses: LabExpense[];
  totalExpenses: number;
  setExpenses: (expenses: LabExpense[]) => void;
  addExpense: (expense: LabExpense) => void;
  updateExpense: (id: string, expense: LabExpense) => void;
  deleteExpense: (id: string) => void;
  setTotalExpenses: (total: number) => void;
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: [],
  totalExpenses: 0,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) => set((state) => ({ 
    expenses: [expense, ...state.expenses] 
  })),
  updateExpense: (id, expense) => set((state) => ({
    expenses: state.expenses.map(e => e._id === id ? expense : e)
  })),
  deleteExpense: (id) => set((state) => ({
    expenses: state.expenses.filter(e => e._id !== id)
  })),
  setTotalExpenses: (totalExpenses) => set({ totalExpenses }),
}));
