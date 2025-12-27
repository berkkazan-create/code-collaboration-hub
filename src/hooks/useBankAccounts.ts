import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  bank_name: string | null;
  account_number: string | null;
  iban: string | null;
  balance: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BankAccountInput = Omit<BankAccount, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const useBankAccounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const bankAccountsQuery = useQuery({
    queryKey: ['bank-accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!user,
  });

  const createBankAccount = useMutation({
    mutationFn: async (account: BankAccountInput) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({ ...account, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Banka hesabı başarıyla eklendi');
    },
    onError: () => {
      toast.error('Banka hesabı eklenirken bir hata oluştu');
    },
  });

  const updateBankAccount = useMutation({
    mutationFn: async ({ id, ...account }: Partial<BankAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(account)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Banka hesabı başarıyla güncellendi');
    },
    onError: () => {
      toast.error('Banka hesabı güncellenirken bir hata oluştu');
    },
  });

  const deleteBankAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Banka hesabı başarıyla silindi');
    },
    onError: () => {
      toast.error('Banka hesabı silinirken bir hata oluştu');
    },
  });

  return {
    bankAccounts: bankAccountsQuery.data ?? [],
    isLoading: bankAccountsQuery.isLoading,
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
  };
};
