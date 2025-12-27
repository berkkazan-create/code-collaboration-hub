import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useUserRole } from '@/hooks/useUserRole';
import { useDataPermissions } from '@/hooks/useDataPermissions';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Plus,
  Edit,
  Trash2,
  Database,
  RefreshCw,
  AlertTriangle,
  Eye,
  Pencil,
} from 'lucide-react';

interface UserPermissions {
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
}

interface UserWithDetails {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
  createdAt: string;
  lastSignIn?: string;
  permissions: UserPermissions | null;
}

const defaultPermissions: UserPermissions = {
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

const AdminPanel = () => {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { createPermission, updatePermission } = useDataPermissions();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithDetails | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Force refresh the session to get a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session) {
        console.error('Session refresh error:', sessionError);
        toast.error('Oturum yenilenemedi, lütfen tekrar giriş yapın');
        return;
      }

      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'list' },
      });

      if (error) throw error;
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('create');
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'create',
          email: userForm.email,
          password: userForm.password,
          fullName: userForm.fullName,
        },
      });

      if (error) throw error;
      toast.success('Kullanıcı başarıyla oluşturuldu');
      setUserDialogOpen(false);
      setUserForm({ email: '', password: '', fullName: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Kullanıcı oluşturulurken hata oluştu');
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving('update');
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        body: {
          action: 'update',
          userId: editingUser.id,
          email: userForm.email !== editingUser.email ? userForm.email : undefined,
          password: userForm.password || undefined,
          fullName: userForm.fullName,
        },
      });

      if (error) throw error;
      toast.success('Kullanıcı başarıyla güncellendi');
      setUserDialogOpen(false);
      setEditingUser(null);
      setUserForm({ email: '', password: '', fullName: '' });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Kullanıcı güncellenirken hata oluştu');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      const { error } = await supabase.functions.invoke('admin-users', {
        body: { action: 'delete', userId: deleteUserId },
      });

      if (error) throw error;
      toast.success('Kullanıcı başarıyla silindi');
      setDeleteUserId(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Kullanıcı silinirken hata oluştu');
    }
  };

  const handleResetDemoData = async () => {
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-demo-data');

      if (error) throw error;
      toast.success(data.message || 'Demo veriler başarıyla oluşturuldu');
      setResetDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Demo veriler oluşturulurken hata oluştu');
    } finally {
      setIsResetting(false);
    }
  };

  const handlePermissionChange = (
    userId: string,
    field: keyof UserWithDetails['permissions'],
    value: boolean
  ) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? { ...user, permissions: { ...user.permissions!, [field]: value } }
          : user
      )
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, permissions: { ...prev.permissions!, [field]: value } } : null
      );
    }
  };

  const savePermissions = async (user: UserWithDetails) => {
    if (!user.permissions) return;
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openEditUser = (user: UserWithDetails) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      password: '',
      fullName: user.fullName,
    });
    setUserDialogOpen(true);
  };

  const openNewUser = () => {
    setEditingUser(null);
    setUserForm({ email: '', password: '', fullName: '' });
    setUserDialogOpen(true);
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Admin Paneli</h1>
                <p className="text-muted-foreground">Kullanıcıları ve sistemi yönetin</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setResetDialogOpen(true)}>
                <Database className="w-4 h-4 mr-2" />
                Demo Verilerle Başlat
              </Button>
              <Button onClick={openNewUser}>
                <Plus className="w-4 h-4 mr-2" />
                Yeni Kullanıcı
              </Button>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Kullanıcı Listesi</CardTitle>
                  <CardDescription>Tüm kullanıcıları görüntüleyin ve yönetin</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchUsers}>
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="hidden md:table-cell">Son Giriş</TableHead>
                        <TableHead className="hidden md:table-cell">Kayıt Tarihi</TableHead>
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
                                  {user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium">{user.fullName || 'İsimsiz'}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
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
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {formatDate(user.lastSignIn)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!user.isAdmin && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedUser({
                                      ...user,
                                      permissions: user.permissions || defaultPermissions,
                                    });
                                    setPermDialogOpen(true);
                                  }}
                                  title="İzinler"
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditUser(user)}
                                title="Düzenle"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {user.isAdmin ? (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => toggleAdminRole(user.id, false)}
                                  title="Admin Kaldır"
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => toggleAdminRole(user.id, true)}
                                  title="Admin Yap"
                                >
                                  <UserPlus className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeleteUserId(user.id)}
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

        {/* User Create/Edit Dialog */}
        <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Kullanıcı bilgilerini güncelleyin' : 'Yeni bir kullanıcı oluşturun'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <Label>Ad Soyad</Label>
                <Input
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{editingUser ? 'Yeni Şifre (boş bırakılabilir)' : 'Şifre'}</Label>
                <Input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required={!editingUser}
                  minLength={6}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setUserDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={saving !== null}>
                  {saving ? 'Kaydediliyor...' : editingUser ? 'Güncelle' : 'Oluştur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Permissions Dialog */}
        <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kullanıcı İzinleri</DialogTitle>
              <DialogDescription>
                {selectedUser?.fullName || selectedUser?.email} için veri erişim izinlerini düzenleyin
              </DialogDescription>
            </DialogHeader>
            {selectedUser && selectedUser.permissions && (
              <div className="space-y-6">
                <Tabs defaultValue="view" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="view" className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Görüntüleme
                    </TabsTrigger>
                    <TabsTrigger value="edit" className="flex items-center gap-2">
                      <Pencil className="w-4 h-4" />
                      Düzenleme
                    </TabsTrigger>
                    <TabsTrigger value="delete" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Silme
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="view" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">Kullanıcının hangi verileri görebileceğini belirleyin</p>
                    {[
                      { key: 'can_view_products', label: 'Ürünler', icon: Package },
                      { key: 'can_view_transactions', label: 'İşlemler', icon: Wallet },
                      { key: 'can_view_accounts', label: 'Cari Hesaplar', icon: Users },
                      { key: 'can_view_bank_accounts', label: 'Banka Hesapları', icon: Landmark },
                      { key: 'can_view_stock_movements', label: 'Stok Hareketleri', icon: History },
                      { key: 'can_view_categories', label: 'Kategoriler', icon: FolderTree },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{label}</span>
                        </div>
                        <Switch
                          checked={(selectedUser.permissions as any)[key]}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(selectedUser.id, key as any, checked)
                          }
                        />
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="edit" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">Kullanıcının hangi verileri düzenleyebileceğini belirleyin</p>
                    {[
                      { key: 'can_edit_products', label: 'Ürünler', icon: Package },
                      { key: 'can_edit_transactions', label: 'İşlemler', icon: Wallet },
                      { key: 'can_edit_accounts', label: 'Cari Hesaplar', icon: Users },
                      { key: 'can_edit_bank_accounts', label: 'Banka Hesapları', icon: Landmark },
                      { key: 'can_edit_categories', label: 'Kategoriler', icon: FolderTree },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{label}</span>
                        </div>
                        <Switch
                          checked={(selectedUser.permissions as any)[key]}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(selectedUser.id, key as any, checked)
                          }
                        />
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="delete" className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">Kullanıcının hangi verileri silebileceğini belirleyin</p>
                    {[
                      { key: 'can_delete_products', label: 'Ürünler', icon: Package },
                      { key: 'can_delete_transactions', label: 'İşlemler', icon: Wallet },
                      { key: 'can_delete_accounts', label: 'Cari Hesaplar', icon: Users },
                      { key: 'can_delete_bank_accounts', label: 'Banka Hesapları', icon: Landmark },
                      { key: 'can_delete_categories', label: 'Kategoriler', icon: FolderTree },
                    ].map(({ key, label, icon: Icon }) => (
                      <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{label}</span>
                        </div>
                        <Switch
                          checked={(selectedUser.permissions as any)[key]}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(selectedUser.id, key as any, checked)
                          }
                        />
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={() => savePermissions(selectedUser)} disabled={saving === selectedUser.id}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving === selectedUser.id ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reset Demo Data Confirmation */}
        <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Tüm Verileri Sıfırla
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem TÜM mevcut verilerinizi silecek ve demo verileri ile değiştirecektir. 
                Kategoriler, ürünler, hesaplar, banka hesapları, işlemler ve stok hareketleri sıfırlanacak.
                <br /><br />
                <strong className="text-destructive">Bu işlem geri alınamaz!</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleResetDemoData} 
                className="bg-warning text-warning-foreground hover:bg-warning/90"
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Sıfırla ve Demo Başlat
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default AdminPanel;
