import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useUserRole } from '@/hooks/useUserRole';
import { useDataPermissions } from '@/hooks/useDataPermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Shield, Users, Save, Package, Wallet, Landmark, FolderTree, History, UserCog } from 'lucide-react';

interface UserWithPermissions {
  id: string;
  email: string;
  isAdmin: boolean;
  permissions: {
    id?: string;
    // View
    can_view_products: boolean;
    can_view_transactions: boolean;
    can_view_accounts: boolean;
    can_view_bank_accounts: boolean;
    can_view_stock_movements: boolean;
    can_view_categories: boolean;
    // Edit
    can_edit_products: boolean;
    can_edit_transactions: boolean;
    can_edit_accounts: boolean;
    can_edit_bank_accounts: boolean;
    can_edit_categories: boolean;
    // Delete
    can_delete_products: boolean;
    can_delete_transactions: boolean;
    can_delete_accounts: boolean;
    can_delete_bank_accounts: boolean;
    can_delete_categories: boolean;
  };
}

const defaultPermissions = {
  can_view_products: true,
  can_view_transactions: true,
  can_view_accounts: true,
  can_view_bank_accounts: true,
  can_view_stock_movements: true,
  can_view_categories: true,
  can_edit_products: false,
  can_edit_transactions: false,
  can_edit_accounts: false,
  can_edit_bank_accounts: false,
  can_edit_categories: false,
  can_delete_products: false,
  can_delete_transactions: false,
  can_delete_accounts: false,
  can_delete_bank_accounts: false,
  can_delete_categories: false,
};

const UserPermissions = () => {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { permissions, createPermission, updatePermission } = useDataPermissions();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name');

        if (profilesError) throw profilesError;

        // Get all user roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        // Get all permissions
        const { data: perms, error: permsError } = await supabase
          .from('data_permissions')
          .select('*');

        if (permsError) throw permsError;

        // Combine data
        const usersWithPermissions: UserWithPermissions[] = profiles.map((profile) => {
          const userRole = roles.find((r) => r.user_id === profile.user_id);
          const userPerm = perms?.find((p) => p.user_id === profile.user_id);

          return {
            id: profile.user_id,
            email: profile.full_name || profile.user_id.slice(0, 8) + '...',
            isAdmin: userRole?.role === 'admin',
            permissions: userPerm || defaultPermissions,
          };
        });

        setUsers(usersWithPermissions.filter((u) => !u.isAdmin));
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Kullanıcılar yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, permissions]);

  const handlePermissionChange = (
    userId: string,
    field: keyof UserWithPermissions['permissions'],
    value: boolean
  ) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, permissions: { ...user.permissions, [field]: value } }
          : user
      )
    );
  };

  const savePermissions = async (user: UserWithPermissions) => {
    setSaving(user.id);
    try {
      const permData = {
        user_id: user.id,
        // View
        can_view_products: user.permissions.can_view_products,
        can_view_transactions: user.permissions.can_view_transactions,
        can_view_accounts: user.permissions.can_view_accounts,
        can_view_bank_accounts: user.permissions.can_view_bank_accounts,
        can_view_stock_movements: user.permissions.can_view_stock_movements,
        can_view_categories: user.permissions.can_view_categories,
        // Edit
        can_edit_products: user.permissions.can_edit_products,
        can_edit_transactions: user.permissions.can_edit_transactions,
        can_edit_accounts: user.permissions.can_edit_accounts,
        can_edit_bank_accounts: user.permissions.can_edit_bank_accounts,
        can_edit_categories: user.permissions.can_edit_categories,
        // Delete
        can_delete_products: user.permissions.can_delete_products,
        can_delete_transactions: user.permissions.can_delete_transactions,
        can_delete_accounts: user.permissions.can_delete_accounts,
        can_delete_bank_accounts: user.permissions.can_delete_bank_accounts,
        can_delete_categories: user.permissions.can_delete_categories,
      };

      if (user.permissions.id) {
        await updatePermission.mutateAsync({ id: user.permissions.id, ...permData });
      } else {
        await createPermission.mutateAsync(permData);
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(null);
    }
  };

  if (roleLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="text-center py-24">
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Erişim Reddedildi</h2>
          <p className="text-muted-foreground">Bu sayfayı görüntülemek için admin yetkisi gereklidir.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Kullanıcı İzinleri</h1>
          <p className="text-muted-foreground mt-1">
            Admin olmayan kullanıcıların hangi verileri görebileceğini yönetin
          </p>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Veri Erişim İzinleri</CardTitle>
                <CardDescription>
                  Her kullanıcı için hangi modüllerin görüntülenebileceğini seçin
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12">
                <UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Henüz admin olmayan kullanıcı yok</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Kullanıcı</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="w-4 h-4" />
                          <span className="hidden sm:inline">Ürünler</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Wallet className="w-4 h-4" />
                          <span className="hidden sm:inline">İşlemler</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4" />
                          <span className="hidden sm:inline">Hesaplar</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Landmark className="w-4 h-4" />
                          <span className="hidden sm:inline">Banka</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <History className="w-4 h-4" />
                          <span className="hidden sm:inline">Stok Hareketleri</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <FolderTree className="w-4 h-4" />
                          <span className="hidden sm:inline">Kategoriler</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={user.permissions.can_view_products}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(user.id, 'can_view_products', checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={user.permissions.can_view_transactions}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(user.id, 'can_view_transactions', checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={user.permissions.can_view_accounts}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(user.id, 'can_view_accounts', checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={user.permissions.can_view_bank_accounts}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(user.id, 'can_view_bank_accounts', checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={user.permissions.can_view_stock_movements}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(user.id, 'can_view_stock_movements', checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={user.permissions.can_view_categories}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(user.id, 'can_view_categories', checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => savePermissions(user)}
                            disabled={saving === user.id}
                          >
                            {saving === user.id ? (
                              <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                Kaydet
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default UserPermissions;
