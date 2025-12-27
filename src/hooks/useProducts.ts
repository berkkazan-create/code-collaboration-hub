import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  unit: string;
  purchase_price: number;
  sale_price: number;
  min_stock_level: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductInput = Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export const useProducts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });

  const createProduct = useMutation({
    mutationFn: async (product: ProductInput) => {
      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Ürün başarıyla eklendi');
    },
    onError: () => {
      toast.error('Ürün eklenirken bir hata oluştu');
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Ürün başarıyla güncellendi');
    },
    onError: () => {
      toast.error('Ürün güncellenirken bir hata oluştu');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Ürün başarıyla silindi');
    },
    onError: () => {
      toast.error('Ürün silinirken bir hata oluştu');
    },
  });

  return {
    products: productsQuery.data ?? [],
    isLoading: productsQuery.isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};
