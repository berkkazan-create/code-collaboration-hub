import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useUserRole } from '@/hooks/useUserRole';
import { useDataPermissions } from '@/hooks/useDataPermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  Save,
  Package,
  Wallet,
  Landmark,
  FolderTree,
  History,
  UserCog,
  Crown,
  UserMinus,
  UserPlus,
  Settings,
  Activity,
} from 'lucide-react';

interface UserWithDetails {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  createdAt: string;
  permissions: {
    id?: string;
    can_view_products: boolean;
    can_view_transactions: boolean;
    can_view_accounts: boolean;
    can_view_bank_accounts: boolean;
    can_view_stock_movements: boolean;
    can_view_categories: boolean;
  };
}

const AdminPanel = () => {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { createPermission, updatePermission } = useDataPermissions();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [permDialogOpen, setPermDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, created_at');

        if (profilesError) throw profilesError;

        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        const { data: perms, error: permsError } = await supabase
          .from('data_permissions')
          .select('*');

        if (permsError) throw permsError;

        const usersWithDetails: UserWithDetails[] = profiles.map((profile) => {
          const userRole = roles.find((r) => r.user_id === profile.user_id);
          const userPerm = perms?.find((p) => p.user_id === profile.user_id);

          return {
            id: profile.user_id,
            email: profile.full_name || 'Kullanıcı',
            fullName: profile.full_name || 'İsimsiz Kullanıcı',
            isAdmin: userRole?.role === 'admin',
            createdAt: profile.created_at,
            permissions: userPerm
              ? {
                  id: userPerm.id,
                  can_view_products: userPerm.can_view_products,
                  can_view_transactions: userPerm.can_view_transactions,
                  can_view_accounts: userPerm.can_view_accounts,
                  can_view_bank_accounts: userPerm.can_view_bank_accounts,
                  can_view_stock_movements: userPerm.can_view_stock_movements,
                  can_view_categories: userPerm.can_view_categories,
                }
              : {
                  can_view_products: true,
                  can_view_transactions: true,
                  can_view_accounts: true,
                  can_view_bank_accounts: true,
                  can_view_stock_movements: true,
                  can_view_categories: true,
                },
          };
        });

        setUsers(usersWithDetails);
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
  }, [isAdmin]);

  const handlePermissionChange = (
    userId: string,
    field: keyof UserWithDetails['permissions'],
    value: boolean
  ) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, permissions: { ...user.permissions, [field]: value } }
          : user
      )
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, permissions: { ...prev.permissions, [field]: value } } : null
      );
    }
  };

  const savePermissions = async (user: UserWithDetails) => {
    setSaving(user.id);
    try {
      const permData = {
        user_id: user.id,
        can_view_products: user.permissions.can_view_products,
        can_view_transactions: user.permissions.can_view_transactions,
        can_view_accounts: user.permissions.can_view_accounts,
        can_view_bank_accounts: user.permissions.can_view_bank_accounts,
        can_view_stock_movements: user.permissions.can_view_stock_movements,
        can_view_categories: user.permissions.can_view_categories,
      };

      if (user.permissions.id) {
        await updatePermission.mutateAsync({ id: user.permissions.id, ...permData });
      } else {
        await createPermission.mutateAsync(permData);
      }
      setPermDialogOpen(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setSaving(null);
    }
  };

  const toggleAdminRole = async (userId: string, makeAdmin: boolean) => {
    try {
      if (makeAdmin) {
        await supabase.from('user_roles').upsert({ user_id: userId, role: 'admin' });
        toast.success('Kullanıcı admin yapıldı');
      } else {
        await supabase.from('user_roles').update({ role: 'user' }).eq('user_id', userId);
        toast.success('Admin yetkisi kaldırıldı');
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: makeAdmin } : u))
      );
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast.error('İşlem sırasında hata oluştu');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
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

  const adminCount = users.filter((u) => u.isAdmin).length;
  const regularCount = users.filter((u) => !u.isAdmin).length;

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto">
        <div className="animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Paneli</h1>
              <p className="text-muted-foreground">Kullanıcıları ve izinleri yönetin</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Toplam Kullanıcı</span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold mt-2">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Adminler</span>
                <Crown className="w-4 h-4 text-warning" />
              </div>
              <p className="text-2xl font-bold mt-2">{adminCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Standart Kullanıcılar</span>
                <UserCog className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{regularCount}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Activity className="w-4 h-4 mr-2" />
              Sistem Bilgisi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcı Listesi</CardTitle>
                <CardDescription>Tüm kullanıcıları görüntüleyin ve yönetin</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Kayıt Tarihi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary">
                                  {user.fullName[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground">{user.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge className="bg-warning/10 text-warning border-warning/20">
                                <Crown className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Kullanıcı</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {!user.isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setPermDialogOpen(true);
                                  }}
                                >
                                  <Settings className="w-4 h-4 mr-1" />
                                  İzinler
                                </Button>
                              )}
                              {user.isAdmin ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => toggleAdminRole(user.id, false)}
                                >
                                  <UserMinus className="w-4 h-4 mr-1" />
                                  Admin Kaldır
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => toggleAdminRole(user.id, true)}
                                >
                                  <UserPlus className="w-4 h-4 mr-1" />
                                  Admin Yap
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sistem Bilgisi</CardTitle>
                <CardDescription>Uygulama durumu ve ayarlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Veritabanı</p>
                    <p className="text-lg font-semibold text-success">Bağlı</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Kimlik Doğrulama</p>
                    <p className="text-lg font-semibold text-success">Aktif</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Permissions Dialog */}
        <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Kullanıcı İzinleri</DialogTitle>
              <DialogDescription>
                {selectedUser?.fullName} için veri erişim izinlerini düzenleyin
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span>Ürünler</span>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.can_view_products}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(selectedUser.id, 'can_view_products', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <span>İşlemler</span>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.can_view_transactions}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(selectedUser.id, 'can_view_transactions', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Hesaplar</span>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.can_view_accounts}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(selectedUser.id, 'can_view_accounts', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-muted-foreground" />
                    <span>Banka Hesapları</span>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.can_view_bank_accounts}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(selectedUser.id, 'can_view_bank_accounts', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <span>Stok Hareketleri</span>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.can_view_stock_movements}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(selectedUser.id, 'can_view_stock_movements', checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-muted-foreground" />
                    <span>Kategoriler</span>
                  </div>
                  <Switch
                    checked={selectedUser.permissions.can_view_categories}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(selectedUser.id, 'can_view_categories', checked)
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setPermDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button
                    onClick={() => savePermissions(selectedUser)}
                    disabled={saving === selectedUser.id}
                  >
                    {saving === selectedUser.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Kaydet
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminPanel;
