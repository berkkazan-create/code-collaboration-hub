import { useEffect } from 'react';
import { useCategories } from './useCategories';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_MAIN_CATEGORIES = [
  { name: 'Elektronik', color: '#3b82f6', description: 'Elektronik ürünler ve aksesuarlar' },
  { name: 'Yedek Parça', color: '#f59e0b', description: 'Araç ve makine yedek parçaları' },
];

export const useDefaultCategories = () => {
  const { user } = useAuth();
  const { mainCategories, createCategory, isLoading } = useCategories();

  useEffect(() => {
    if (!user || isLoading || mainCategories.length > 0) return;

    // Create default categories if none exist
    const createDefaults = async () => {
      for (const category of DEFAULT_MAIN_CATEGORIES) {
        await createCategory.mutateAsync({
          name: category.name,
          color: category.color,
          description: category.description,
          parent_id: null,
          requires_serial: false,
        });
      }
    };

    createDefaults();
  }, [user, isLoading, mainCategories.length]);

  return { isLoading };
};
