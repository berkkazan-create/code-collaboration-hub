import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useExchangeRate } from './useExchangeRate';

export const useCashRegister = () => {
  const { transactions, isLoading } = useTransactions();
  const { convertToTRY } = useExchangeRate();

  const cashTransactions = useMemo(() => {
    return transactions.filter(t => t.payment_method === 'cash');
  }, [transactions]);

  const cashBalance = useMemo(() => {
    return cashTransactions.reduce((sum, t) => {
      const amount = Number(t.amount);
      const convertedAmount = t.currency === 'USD' ? convertToTRY(amount, 'USD') : amount;
      
      if (t.type === 'income' || t.type === 'sale') {
        return sum + convertedAmount;
      } else {
        return sum - convertedAmount;
      }
    }, 0);
  }, [cashTransactions, convertToTRY]);

  const cashIncome = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'income' || t.type === 'sale')
      .reduce((sum, t) => {
        const amount = Number(t.amount);
        return sum + (t.currency === 'USD' ? convertToTRY(amount, 'USD') : amount);
      }, 0);
  }, [cashTransactions, convertToTRY]);

  const cashExpense = useMemo(() => {
    return cashTransactions
      .filter(t => t.type === 'expense' || t.type === 'purchase')
      .reduce((sum, t) => {
        const amount = Number(t.amount);
        return sum + (t.currency === 'USD' ? convertToTRY(amount, 'USD') : amount);
      }, 0);
  }, [cashTransactions, convertToTRY]);

  return {
    cashTransactions,
    cashBalance,
    cashIncome,
    cashExpense,
    isLoading,
  };
};
