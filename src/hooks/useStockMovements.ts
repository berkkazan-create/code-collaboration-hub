import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StockMovement {
  id: string;
  user_id: string;
  product_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  reference_id: string | null;
  created_at: string;
  product?: {
    name: string;
    sku: string | null;
  };
}

export interface StockMovementInput {
  product_id: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason?: string;
  reference_id?: string;
}

export const useStockMovements = (productId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const movementsQuery = useQuery({
    queryKey: ['stock_movements', user?.id, productId],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(name, sku)
        `)
        .order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!user,
  });

  const createMovement = useMutation({
    mutationFn: async (input: StockMovementInput) => {
      // First get current product quantity
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('quantity')
        .eq('id', input.product_id)
        .single();

      if (productError) throw productError;

      const previousQuantity = product.quantity;
      let newQuantity: number;

      if (input.type === 'in') {
        newQuantity = previousQuantity + input.quantity;
      } else if (input.type === 'out') {
        newQuantity = previousQuantity - input.quantity;
      } else {
        newQuantity = input.quantity; // adjustment sets exact quantity
      }

      // Create movement record
      const { data: movement, error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          user_id: user!.id,
          product_id: input.product_id,
          type: input.type,
          quantity: input.type === 'adjustment' ? Math.abs(input.quantity - previousQuantity) : input.quantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason: input.reason,
          reference_id: input.reference_id,
        })
        .select()
        .single();

      if (movementError) throw movementError;

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', input.product_id);

      if (updateError) throw updateError;

      return movement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stok hareketi kaydedildi');
    },
    onError: () => {
      toast.error('Stok hareketi kaydedilirken bir hata oluştu');
    },
  });

  return {
    movements: movementsQuery.data ?? [],
    isLoading: movementsQuery.isLoading,
    createMovement,
  };
};
