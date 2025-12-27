import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'admin' | 'user';

export const useUserRole = () => {
  const { user } = useAuth();

  const roleQuery = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      return (data?.role as AppRole) || 'user';
    },
    enabled: !!user,
  });

  return {
    role: roleQuery.data ?? 'user',
    isAdmin: roleQuery.data === 'admin',
    isLoading: roleQuery.isLoading,
  };
};
