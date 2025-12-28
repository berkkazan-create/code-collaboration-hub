import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface QCCheckItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  check_type: 'entry' | 'exit' | 'both';
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QCCheckResult {
  id: string;
  service_record_id: string;
  qc_check_item_id: string;
  check_stage: 'entry' | 'exit';
  passed?: boolean;
  notes?: string;
  checked_by?: string;
  checked_at?: string;
  user_id: string;
  created_at: string;
  qc_check_item?: QCCheckItem;
}

export interface QCCheckItemInput {
  name: string;
  description?: string;
  category?: string;
  check_type: 'entry' | 'exit' | 'both';
  is_required?: boolean;
  display_order?: number;
  is_active?: boolean;
}

export const categoryLabels: Record<string, string> = {
  'genel': 'Genel',
  'görsel': 'Görsel',
  'fonksiyonel': 'Fonksiyonel',
  'güvenlik': 'Güvenlik',
};

export const checkTypeLabels: Record<string, string> = {
  'entry': 'Giriş KK',
  'exit': 'Çıkış KK',
  'both': 'Her İkisi',
};

export const useQCCheckItems = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all QC check items
  const itemsQuery = useQuery({
    queryKey: ['qc-check-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qc_check_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as QCCheckItem[];
    },
    enabled: !!user,
  });

  // Create QC check item
  const createItem = useMutation({
    mutationFn: async (input: QCCheckItemInput) => {
      const { data, error } = await supabase
        .from('qc_check_items')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-check-items'] });
      toast.success('Kontrol öğesi oluşturuldu');
    },
    onError: (error) => {
      toast.error('Oluşturma başarısız: ' + error.message);
    },
  });

  // Update QC check item
  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QCCheckItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('qc_check_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-check-items'] });
      toast.success('Kontrol öğesi güncellendi');
    },
    onError: (error) => {
      toast.error('Güncelleme başarısız: ' + error.message);
    },
  });

  // Delete QC check item
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('qc_check_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-check-items'] });
      toast.success('Kontrol öğesi silindi');
    },
    onError: (error) => {
      toast.error('Silme başarısız: ' + error.message);
    },
  });

  // Toggle active status
  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('qc_check_items')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-check-items'] });
    },
  });

  // Get items by check type
  const getItemsByType = (type: 'entry' | 'exit') => {
    return itemsQuery.data?.filter(
      item => item.is_active && (item.check_type === type || item.check_type === 'both')
    ) || [];
  };

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    createItem,
    updateItem,
    deleteItem,
    toggleActive,
    getItemsByType,
  };
};

export const useQCCheckResults = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch QC results for a service record
  const fetchResults = async (serviceRecordId: string, stage?: 'entry' | 'exit') => {
    let query = supabase
      .from('qc_check_results')
      .select('*, qc_check_item:qc_check_items(*)')
      .eq('service_record_id', serviceRecordId)
      .order('created_at', { ascending: true });

    if (stage) {
      query = query.eq('check_stage', stage);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as QCCheckResult[];
  };

  // Save QC check result
  const saveResult = useMutation({
    mutationFn: async (input: {
      service_record_id: string;
      qc_check_item_id: string;
      check_stage: 'entry' | 'exit';
      passed?: boolean;
      notes?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Upsert result
      const { data, error } = await supabase
        .from('qc_check_results')
        .upsert({
          ...input,
          user_id: user.id,
          checked_by: user.email,
          checked_at: new Date().toISOString(),
        }, {
          onConflict: 'service_record_id,qc_check_item_id,check_stage',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-check-results'] });
    },
    onError: (error) => {
      toast.error('Kayıt başarısız: ' + error.message);
    },
  });

  // Bulk save results
  const saveAllResults = useMutation({
    mutationFn: async (results: {
      service_record_id: string;
      qc_check_item_id: string;
      check_stage: 'entry' | 'exit';
      passed?: boolean;
      notes?: string;
    }[]) => {
      if (!user) throw new Error('User not authenticated');

      const resultsWithUser = results.map(r => ({
        ...r,
        user_id: user.id,
        checked_by: user.email,
        checked_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('qc_check_results')
        .upsert(resultsWithUser, {
          onConflict: 'service_record_id,qc_check_item_id,check_stage',
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc-check-results'] });
      toast.success('Kalite kontrol sonuçları kaydedildi');
    },
    onError: (error) => {
      toast.error('Kayıt başarısız: ' + error.message);
    },
  });

  return {
    fetchResults,
    saveResult,
    saveAllResults,
  };
};
