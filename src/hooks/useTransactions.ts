import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  product_id: string | null;
  type: 'income' | 'expense' | 'purchase' | 'sale';
  amount: number;
  quantity: number | null;
  description: string | null;
  date: string;
  created_at: string;
}

export type TransactionInput = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;

export const useTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, accounts(name), products(name)')
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: TransactionInput) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...transaction, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('İşlem başarıyla eklendi');
    },
    onError: () => {
      toast.error('İşlem eklenirken bir hata oluştu');
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('İşlem başarıyla silindi');
    },
    onError: () => {
      toast.error('İşlem silinirken bir hata oluştu');
    },
  });

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    createTransaction,
    deleteTransaction,
  };
};
