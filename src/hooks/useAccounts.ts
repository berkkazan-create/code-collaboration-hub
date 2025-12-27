import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: 'customer' | 'supplier';
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_number: string | null;
  balance: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountInput = Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const useAccounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: ['accounts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user,
  });

  const createAccount = useMutation({
    mutationFn: async (account: AccountInput) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...account, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Cari hesap başarıyla eklendi');
    },
    onError: () => {
      toast.error('Cari hesap eklenirken bir hata oluştu');
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...account }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(account)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Cari hesap başarıyla güncellendi');
    },
    onError: () => {
      toast.error('Cari hesap güncellenirken bir hata oluştu');
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('accounts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Cari hesap başarıyla silindi');
    },
    onError: () => {
      toast.error('Cari hesap silinirken bir hata oluştu');
    },
  });

  return {
    accounts: accountsQuery.data ?? [],
    isLoading: accountsQuery.isLoading,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};
