import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAccounts, Account, AccountInput } from '@/hooks/useAccounts';
import { useUserRole } from '@/hooks/useUserRole';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';
import { CurrencyToggle } from '@/components/CurrencyToggle';
import { Plus, Search, Edit, Trash2, Download, Users, Building2 } from 'lucide-react';

const Accounts = () => {
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const { isAdmin } = useUserRole();
  const { displayCurrency, toggleCurrency, formatCurrency, convertToDisplay, rate, isLoading: rateLoading } = useCurrencyDisplay();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'supplier'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<AccountInput>({
    name: '',
    type: 'customer',
    email: '',
    phone: '',
    address: '',
    tax_number: '',
    balance: 0,
    notes: '',
  });

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.phone?.includes(searchQuery);
    const matchesTab = activeTab === 'all' || a.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      await updateAccount.mutateAsync({ id: editingAccount.id, ...formData });
    } else {
      await createAccount.mutateAsync(formData);
    }
    handleCloseDialog();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      email: account.email || '',
      phone: account.phone || '',
      address: account.address || '',
      tax_number: account.tax_number || '',
      balance: account.balance,
      notes: account.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      type: 'customer',
      email: '',
      phone: '',
      address: '',
      tax_number: '',
      balance: 0,
      notes: '',
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteAccount.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Ad', 'Tip', 'E-posta', 'Telefon', 'Adres', 'Vergi No', 'Bakiye'];
    const rows = accounts.map((a) => [
      a.name,
      a.type === 'customer' ? 'Müşteri' : 'Tedarikçi',
      a.email || '',
      a.phone || '',
      a.address || '',
      a.tax_number || '',
      a.balance,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'cari_hesaplar.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBalance = (value: number, currency: string = 'TRY') => 
    formatCurrency(convertToDisplay(value, currency));

  const columns = [
    {
      key: 'name',
      header: 'Cari Ad',
      render: (account: Account) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              account.type === 'customer' ? 'bg-primary/10' : 'bg-warning/10'
            }`}
          >
            {account.type === 'customer' ? (
              <Users className="w-5 h-5 text-primary" />
            ) : (
              <Building2 className="w-5 h-5 text-warning" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{account.name}</p>
            {account.email && <p className="text-xs text-muted-foreground">{account.email}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      render: (account: Account) => (
        <Badge variant={account.type === 'customer' ? 'default' : 'secondary'}>
          {account.type === 'customer' ? 'Müşteri' : 'Tedarikçi'}
        </Badge>
      ),
    },
    {
      key: 'phone',
      header: 'Telefon',
      render: (account: Account) => account.phone || '-',
      className: 'hidden md:table-cell',
    },
    {
      key: 'balance',
      header: 'Bakiye',
      render: (account: Account) => (
        <span
          className={
            account.balance >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'
          }
        >
          {formatBalance(account.balance, (account as any).currency || 'TRY')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (account: Account) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}>
            <Edit className="w-4 h-4" />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteId(account.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Cari Hesaplar</h1>
            <p className="text-muted-foreground mt-1">Müşteri ve tedarikçilerinizi yönetin</p>
          </div>
          <div className="flex gap-2">
            <CurrencyToggle
              displayCurrency={displayCurrency}
              onToggle={toggleCurrency}
              rate={rate}
              isLoading={rateLoading}
            />
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Dışa Aktar</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCloseDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Yeni Cari</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAccount ? 'Cari Hesabı Düzenle' : 'Yeni Cari Hesap'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Cari Adı *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Tip *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: 'customer' | 'supplier') =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Müşteri</SelectItem>
                          <SelectItem value="supplier">Tedarikçi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>E-posta</Label>
                      <Input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Telefon</Label>
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Vergi No</Label>
                      <Input
                        value={formData.tax_number || ''}
                        onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Bakiye (₺)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) =>
                          setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Adres</Label>
                      <Textarea
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Notlar</Label>
                      <Textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      İptal
                    </Button>
                    <Button type="submit">
                      {editingAccount ? 'Güncelle' : 'Ekle'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="customer">Müşteriler</TabsTrigger>
            <TabsTrigger value="supplier">Tedarikçiler</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative max-w-md animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <DataTable
            data={filteredAccounts}
            columns={columns}
            emptyMessage="Henüz cari hesap eklenmemiş"
          />
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cari Hesabı Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu cari hesabı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Accounts;
