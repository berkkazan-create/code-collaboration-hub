import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DataPermission {
  id: string;
  user_id: string;
  can_view_products: boolean;
  can_view_transactions: boolean;
  can_view_accounts: boolean;
  can_view_bank_accounts: boolean;
  can_view_stock_movements: boolean;
  can_view_categories: boolean;
  created_at: string;
  updated_at: string;
}

export type DataPermissionInput = Omit<DataPermission, 'id' | 'created_at' | 'updated_at'>;

export const useDataPermissions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const permissionsQuery = useQuery({
    queryKey: ['data-permissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_permissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DataPermission[];
    },
    enabled: !!user,
  });

  const myPermissionsQuery = useQuery({
    queryKey: ['my-permissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_permissions')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return data as DataPermission | null;
    },
    enabled: !!user,
  });

  const createPermission = useMutation({
    mutationFn: async (permission: DataPermissionInput) => {
      const { data, error } = await supabase
        .from('data_permissions')
        .insert(permission)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-permissions'] });
      toast.success('İzinler başarıyla oluşturuldu');
    },
    onError: () => {
      toast.error('İzinler oluşturulurken bir hata oluştu');
    },
  });

  const updatePermission = useMutation({
    mutationFn: async ({ id, ...permission }: Partial<DataPermission> & { id: string }) => {
      const { data, error } = await supabase
        .from('data_permissions')
        .update(permission)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['my-permissions'] });
      toast.success('İzinler başarıyla güncellendi');
    },
    onError: () => {
      toast.error('İzinler güncellenirken bir hata oluştu');
    },
  });

  return {
    permissions: permissionsQuery.data ?? [],
    myPermissions: myPermissionsQuery.data,
    isLoading: permissionsQuery.isLoading,
    createPermission,
    updatePermission,
  };
};
