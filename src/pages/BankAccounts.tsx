import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useBankAccounts, BankAccount, BankAccountInput } from '@/hooks/useBankAccounts';
import { useUserRole } from '@/hooks/useUserRole';
import { Plus, Search, Edit, Trash2, Download, Landmark, CreditCard } from 'lucide-react';

const BankAccounts = () => {
  const { bankAccounts, isLoading, createBankAccount, updateBankAccount, deleteBankAccount } = useBankAccounts();
  const { isAdmin } = useUserRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BankAccountInput>({
    name: '',
    bank_name: '',
    account_number: '',
    iban: '',
    balance: 0,
    currency: 'TRY',
    notes: '',
  });

  const filteredAccounts = bankAccounts.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.bank_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.iban?.includes(searchQuery)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      await updateBankAccount.mutateAsync({ id: editingAccount.id, ...formData });
    } else {
      await createBankAccount.mutateAsync(formData);
    }
    handleCloseDialog();
  };

  const handleEdit = (account: BankAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      bank_name: account.bank_name || '',
      account_number: account.account_number || '',
      iban: account.iban || '',
      balance: account.balance,
      currency: account.currency,
      notes: account.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAccount(null);
    setFormData({
      name: '',
      bank_name: '',
      account_number: '',
      iban: '',
      balance: 0,
      currency: 'TRY',
      notes: '',
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteBankAccount.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Hesap Adı', 'Banka', 'Hesap No', 'IBAN', 'Bakiye', 'Para Birimi'];
    const rows = bankAccounts.map((a) => [
      a.name,
      a.bank_name || '',
      a.account_number || '',
      a.iban || '',
      a.balance,
      a.currency,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'banka_hesaplari.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number, currency: string = 'TRY') =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value);

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const columns = [
    {
      key: 'name',
      header: 'Hesap Adı',
      render: (account: BankAccount) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{account.name}</p>
            {account.bank_name && (
              <p className="text-xs text-muted-foreground">{account.bank_name}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'iban',
      header: 'IBAN',
      render: (account: BankAccount) => (
        <span className="text-sm text-muted-foreground font-mono">
          {account.iban || '-'}
        </span>
      ),
      className: 'hidden md:table-cell',
    },
    {
      key: 'account_number',
      header: 'Hesap No',
      render: (account: BankAccount) => (
        <span className="text-sm text-muted-foreground">
          {account.account_number || '-'}
        </span>
      ),
      className: 'hidden lg:table-cell',
    },
    {
      key: 'balance',
      header: 'Bakiye',
      render: (account: BankAccount) => (
        <span
          className={
            Number(account.balance) >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'
          }
        >
          {formatCurrency(Number(account.balance), account.currency)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (account: BankAccount) => (
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Banka Hesapları</h1>
            <p className="text-muted-foreground mt-1">Banka hesaplarınızı ve bakiyelerinizi yönetin</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Dışa Aktar</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCloseDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Yeni Hesap</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAccount ? 'Banka Hesabını Düzenle' : 'Yeni Banka Hesabı'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Hesap Adı *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Örn: İş Bankası Vadesiz"
                        required
                      />
                    </div>
                    <div>
                      <Label>Banka Adı</Label>
                      <Input
                        value={formData.bank_name || ''}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="Örn: Türkiye İş Bankası"
                      />
                    </div>
                    <div>
                      <Label>Hesap Numarası</Label>
                      <Input
                        value={formData.account_number || ''}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>IBAN</Label>
                      <Input
                        value={formData.iban || ''}
                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                      />
                    </div>
                    <div>
                      <Label>Bakiye</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.balance}
                        onChange={(e) =>
                          setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label>Para Birimi</Label>
                      <Input
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        placeholder="TRY"
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

        {/* Summary Card */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Banka Bakiyesi</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Hesap ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <DataTable
            data={filteredAccounts}
            columns={columns}
            emptyMessage="Henüz banka hesabı eklenmemiş"
          />
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Banka Hesabını Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu banka hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

export default BankAccounts;
