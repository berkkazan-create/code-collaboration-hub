import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Landmark,
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

const Accounting = () => {
  const { bankAccounts, createBankAccount, isLoading: bankLoading } = useBankAccounts();
  const { transactions, isLoading: transLoading } = useTransactions();
  const { rate, isLoading: rateLoading, convertToTRY } = useExchangeRate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    iban: '',
    balance: 0,
    currency: 'TRY',
    notes: '',
  });

  // Calculate totals
  const totalBankBalance = bankAccounts.reduce((sum, acc) => {
    const balance = Number(acc.balance);
    return sum + (acc.currency === 'USD' ? convertToTRY(balance, 'USD') : balance);
  }, 0);

  const totalIncome = transactions
    .filter((t) => t.type === 'income' || t.type === 'sale')
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + (t.currency === 'USD' ? convertToTRY(amount, 'USD') : amount);
    }, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + (t.currency === 'USD' ? convertToTRY(amount, 'USD') : amount);
    }, 0);

  const formatCurrency = (value: number, currency: string = 'TRY') =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createBankAccount.mutateAsync(formData);
    setIsDialogOpen(false);
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      income: 'Gelir',
      expense: 'Gider',
      sale: 'Satış',
      purchase: 'Alım',
    };
    return labels[type] || type;
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Muhasebe</h1>
            <p className="text-muted-foreground mt-1">Banka hesapları ve finansal işlemler</p>
          </div>
          <div className="flex items-center gap-3">
            {rate && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">1 USD = {rate.usdToTry.toFixed(2)} ₺</span>
                <RefreshCw className={`w-3 h-3 text-muted-foreground ${rateLoading ? 'animate-spin' : ''}`} />
              </div>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Hesap Ekle
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Banka Hesabı</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hesap Adı</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Banka Adı</Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Hesap No</Label>
                      <Input
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>IBAN</Label>
                      <Input
                        value={formData.iban}
                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bakiye</Label>
                      <Input
                        type="number"
                        value={formData.balance}
                        onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Para Birimi</Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRY">TRY (₺)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button type="submit">Ekle</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Toplam Banka</span>
              </div>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(totalBankBalance)}</p>
              <p className="text-sm text-muted-foreground mt-1">{bankAccounts.length} hesap</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border group hover:border-success/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Toplam Gelir</span>
              </div>
              <p className="text-3xl font-bold text-success">{formatCurrency(totalIncome)}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border group hover:border-destructive/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Toplam Gider</span>
              </div>
              <p className="text-3xl font-bold text-destructive">{formatCurrency(totalExpense)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="accounts" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="accounts" className="flex-1 sm:flex-none">
              <Landmark className="w-4 h-4 mr-2" />
              Banka Hesapları
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 sm:flex-none">
              <Wallet className="w-4 h-4 mr-2" />
              İşlem Geçmişi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {bankLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : bankAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Henüz banka hesabı eklenmemiş</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hesap Adı</TableHead>
                          <TableHead>Banka</TableHead>
                          <TableHead>IBAN</TableHead>
                          <TableHead className="text-right">Bakiye</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bankAccounts.map((account) => (
                          <TableRow key={account.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{account.name}</TableCell>
                            <TableCell>{account.bank_name || '-'}</TableCell>
                            <TableCell className="font-mono text-sm">{account.iban || '-'}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(Number(account.balance), account.currency || 'TRY')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {transLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Henüz işlem yok</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tür</TableHead>
                          <TableHead>Açıklama</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead className="text-right">Tutar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((trans) => (
                          <TableRow key={trans.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    trans.type === 'income' || trans.type === 'sale'
                                      ? 'bg-success/10'
                                      : 'bg-destructive/10'
                                  }`}
                                >
                                  {trans.type === 'income' || trans.type === 'sale' ? (
                                    <ArrowUpRight className="w-4 h-4 text-success" />
                                  ) : (
                                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                                  )}
                                </div>
                                <span className="font-medium">{getTypeLabel(trans.type)}</span>
                              </div>
                            </TableCell>
                            <TableCell>{trans.description || '-'}</TableCell>
                            <TableCell>{trans.date}</TableCell>
                            <TableCell
                              className={`text-right font-semibold ${
                                trans.type === 'income' || trans.type === 'sale'
                                  ? 'text-success'
                                  : 'text-destructive'
                              }`}
                            >
                              {trans.type === 'income' || trans.type === 'sale' ? '+' : '-'}
                              {formatCurrency(Number(trans.amount), trans.currency || 'TRY')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Accounting;
