import { Layout } from '@/components/layout/Layout';
import { CategoryManager } from '@/components/CategoryManager';
import { useUserRole } from '@/hooks/useUserRole';
import { useDataPermissions } from '@/hooks/useDataPermissions';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

const Categories = () => {
  const { isAdmin } = useUserRole();
  const { myPermissions, isLoading } = useDataPermissions();
  const canViewCategories = isAdmin || myPermissions?.can_view_categories !== false;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!canViewCategories) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-lg font-semibold mb-2">Erişim Engellendi</h2>
              <p className="text-muted-foreground">
                Kategorileri görüntüleme yetkiniz bulunmamaktadır.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Kategoriler</h1>
          <p className="text-muted-foreground">Ürün kategorilerini yönetin</p>
        </div>
        
        <div className="max-w-2xl">
          <CategoryManager />
        </div>
      </div>
    </Layout>
  );
};

export default Categories;
