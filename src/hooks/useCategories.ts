import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  parent_id: string | null;
  created_at: string;
}

export interface CategoryWithChildren extends Category {
  children?: Category[];
}

export type CategoryInput = Omit<Category, 'id' | 'user_id' | 'created_at'>;

export const useCategories = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });

  // Get hierarchical structure
  const getHierarchicalCategories = (): CategoryWithChildren[] => {
    const categories = categoriesQuery.data ?? [];
    const mainCategories = categories.filter(c => !c.parent_id);
    
    return mainCategories.map(main => ({
      ...main,
      children: categories.filter(c => c.parent_id === main.id)
    }));
  };

  // Get main categories only
  const getMainCategories = (): Category[] => {
    return (categoriesQuery.data ?? []).filter(c => !c.parent_id);
  };

  // Get subcategories for a main category
  const getSubcategories = (parentId: string): Category[] => {
    return (categoriesQuery.data ?? []).filter(c => c.parent_id === parentId);
  };

  const createCategory = useMutation({
    mutationFn: async (category: CategoryInput) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...category, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori başarıyla eklendi');
    },
    onError: () => {
      toast.error('Kategori eklenirken bir hata oluştu');
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...category }: Partial<Category> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori başarıyla güncellendi');
    },
    onError: () => {
      toast.error('Kategori güncellenirken bir hata oluştu');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Kategori başarıyla silindi');
    },
    onError: () => {
      toast.error('Kategori silinirken bir hata oluştu');
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    hierarchicalCategories: getHierarchicalCategories(),
    mainCategories: getMainCategories(),
    getSubcategories,
    isLoading: categoriesQuery.isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
