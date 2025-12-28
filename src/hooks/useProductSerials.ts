import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProductSerial {
  id: string;
  user_id: string;
  product_id: string;
  serial_number: string;
  status: 'in_stock' | 'sold' | 'returned';
  purchase_price: number;
  sale_price: number;
  sold_at: string | null;
  sold_to_account_id: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
    category: string | null;
  };
  accounts?: {
    name: string;
    phone: string | null;
  } | null;
}

export type ProductSerialInput = {
  product_id: string;
  serial_number: string;
  purchase_price?: number;
  sale_price?: number;
  notes?: string;
};

export const useProductSerials = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const serialsQuery = useQuery({
    queryKey: ['product-serials', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_serials')
        .select('*, products(name, category), accounts(name, phone)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ProductSerial[];
    },
    enabled: !!user,
  });

  const inStockSerials = serialsQuery.data?.filter(s => s.status === 'in_stock') ?? [];
  const soldSerials = serialsQuery.data?.filter(s => s.status === 'sold') ?? [];

  const createSerial = useMutation({
    mutationFn: async (serial: ProductSerialInput) => {
      const { data, error } = await supabase
        .from('product_serials')
        .insert({ ...serial, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-serials'] });
      toast.success('Seri numarası başarıyla eklendi');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Bu seri numarası zaten kayıtlı');
      } else {
        toast.error('Seri numarası eklenirken bir hata oluştu');
      }
    },
  });

  const updateSerial = useMutation({
    mutationFn: async ({ id, ...serial }: Partial<ProductSerial> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_serials')
        .update(serial)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-serials'] });
    },
    onError: () => {
      toast.error('Seri numarası güncellenirken bir hata oluştu');
    },
  });

  const sellSerial = useMutation({
    mutationFn: async ({ 
      id, 
      sale_price, 
      sold_to_account_id, 
      transaction_id 
    }: { 
      id: string; 
      sale_price: number; 
      sold_to_account_id?: string | null; 
      transaction_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('product_serials')
        .update({ 
          status: 'sold', 
          sale_price,
          sold_at: new Date().toISOString(),
          sold_to_account_id,
          transaction_id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-serials'] });
      toast.success('Cihaz satıldı');
    },
    onError: () => {
      toast.error('Satış işlemi sırasında bir hata oluştu');
    },
  });

  const deleteSerial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_serials').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-serials'] });
      toast.success('Seri numarası silindi');
    },
    onError: () => {
      toast.error('Seri numarası silinirken bir hata oluştu');
    },
  });

  const findBySerial = (serialNumber: string) => {
    return serialsQuery.data?.find(s => s.serial_number === serialNumber);
  };

  return {
    serials: serialsQuery.data ?? [],
    inStockSerials,
    soldSerials,
    isLoading: serialsQuery.isLoading,
    createSerial,
    updateSerial,
    sellSerial,
    deleteSerial,
    findBySerial,
  };
};
