import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransactions, TransactionInput } from '@/hooks/useTransactions';
import { useAccounts } from '@/hooks/useAccounts';
import { useProducts } from '@/hooks/useProducts';
import { Plus, Search, Trash2, Download, TrendingUp, TrendingDown } from 'lucide-react';

const Transactions = () => {
  const { transactions, isLoading, createTransaction, deleteTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const { products } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<TransactionInput>({
    account_id: null,
    product_id: null,
    type: 'income',
    amount: 0,
    quantity: null,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const isIncome = t.type === 'income' || t.type === 'sale';
    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'income' && isIncome) ||
      (activeTab === 'expense' && !isIncome);
    return matchesSearch && matchesTab;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTransaction.mutateAsync(formData);
    handleCloseDialog();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      account_id: null,
      product_id: null,
      type: 'income',
      amount: 0,
      quantity: null,
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransaction.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Tarih', 'Tip', 'Açıklama', 'Tutar', 'Cari', 'Ürün'];
    const rows = transactions.map((t: any) => [
      t.date,
      t.type === 'income' || t.type === 'sale' ? 'Gelir' : 'Gider',
      t.description || '',
      t.amount,
      t.accounts?.name || '',
      t.products?.name || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'islemler.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

  const typeLabels: Record<string, string> = {
    income: 'Gelir',
    expense: 'Gider',
    purchase: 'Satın Alma',
    sale: 'Satış',
  };

  const columns = [
    {
      key: 'date',
      header: 'Tarih',
      render: (transaction: any) => (
        <span className="text-muted-foreground">{transaction.date}</span>
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      render: (transaction: any) => {
        const isIncome = transaction.type === 'income' || transaction.type === 'sale';
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isIncome ? 'bg-success/10' : 'bg-destructive/10'
              }`}
            >
              {isIncome ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <Badge variant={isIncome ? 'default' : 'destructive'}>
              {typeLabels[transaction.type]}
            </Badge>
          </div>
        );
      },
    },
    {
      key: 'description',
      header: 'Açıklama',
      render: (transaction: any) => (
        <div>
          <p className="font-medium text-foreground">{transaction.description || '-'}</p>
          {transaction.accounts && (
            <p className="text-xs text-muted-foreground">{transaction.accounts.name}</p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Tutar',
      render: (transaction: any) => {
        const isIncome = transaction.type === 'income' || transaction.type === 'sale';
        return (
          <span className={isIncome ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
            {isIncome ? '+' : '-'}
            {formatCurrency(Number(transaction.amount))}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      render: (transaction: any) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteId(transaction.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Maliyet Takibi</h1>
            <p className="text-muted-foreground mt-1">Gelir ve giderlerinizi takip edin</p>
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
                  <span className="hidden sm:inline">Yeni İşlem</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Yeni İşlem Ekle</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>İşlem Tipi *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Gelir</SelectItem>
                          <SelectItem value="expense">Gider</SelectItem>
                          <SelectItem value="sale">Satış</SelectItem>
                          <SelectItem value="purchase">Satın Alma</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tutar (₺) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Tarih *</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Cari Hesap</Label>
                      <Select
                        value={formData.account_id || 'none'}
                        onValueChange={(value) =>
                          setFormData({ ...formData, account_id: value === 'none' ? null : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seçilmedi</SelectItem>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Ürün</Label>
                      <Select
                        value={formData.product_id || 'none'}
                        onValueChange={(value) =>
                          setFormData({ ...formData, product_id: value === 'none' ? null : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seçilmedi</SelectItem>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Açıklama</Label>
                      <Input
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="İşlem açıklaması"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      İptal
                    </Button>
                    <Button type="submit">Ekle</Button>
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
            <TabsTrigger value="income">Gelirler</TabsTrigger>
            <TabsTrigger value="expense">Giderler</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <div className="relative max-w-md animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="İşlem ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <DataTable
            data={filteredTransactions}
            columns={columns}
            emptyMessage="Henüz işlem eklenmemiş"
          />
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>İşlemi Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

export default Transactions;
