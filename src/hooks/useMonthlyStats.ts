import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useExchangeRate } from './useExchangeRate';
import { format, startOfMonth, subMonths } from 'date-fns';
import { tr } from 'date-fns/locale';

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

export const useMonthlyStats = (monthsCount: number = 6) => {
  const { transactions, isLoading } = useTransactions();
  const { convertToTRY } = useExchangeRate();

  const monthlyData = useMemo((): MonthlyData[] => {
    const now = new Date();
    const months: MonthlyData[] = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthKey = format(monthStart, 'yyyy-MM');
      const monthLabel = format(monthStart, 'MMM', { locale: tr });

      const monthTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        return format(transDate, 'yyyy-MM') === monthKey;
      });

      const income = monthTransactions
        .filter(t => t.type === 'income' || t.type === 'sale')
        .reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (t.currency === 'USD' ? convertToTRY(amount, 'USD') : amount);
        }, 0);

      const expense = monthTransactions
        .filter(t => t.type === 'expense' || t.type === 'purchase')
        .reduce((sum, t) => {
          const amount = Number(t.amount);
          return sum + (t.currency === 'USD' ? convertToTRY(amount, 'USD') : amount);
        }, 0);

      months.push({
        month: monthLabel,
        income,
        expense,
        profit: income - expense,
      });
    }

    return months;
  }, [transactions, convertToTRY, monthsCount]);

  return {
    monthlyData,
    isLoading,
  };
};
