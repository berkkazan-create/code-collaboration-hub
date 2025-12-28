import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';
import { CurrencyToggle } from '@/components/CurrencyToggle';
import { useCashRegister } from '@/hooks/useCashRegister';
import { useMonthlyStats } from '@/hooks/useMonthlyStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Banknote,
  BarChart3,
  Calendar,
  FileText,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, isWithinInterval, format } from 'date-fns';
import { tr } from 'date-fns/locale';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'all';

const Accounting = () => {
  const { bankAccounts, createBankAccount, isLoading: bankLoading } = useBankAccounts();
  const { transactions, isLoading: transLoading } = useTransactions();
  const { displayCurrency, toggleCurrency, formatCurrency, convertToDisplay, rate, isLoading: rateLoading } = useCurrencyDisplay();
  const { cashBalance, cashIncome, cashExpense, cashTransactions } = useCashRegister();
  const { monthlyData } = useMonthlyStats(6);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('all');
  const [formData, setFormData] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    iban: '',
    balance: 0,
    currency: 'TRY',
    notes: '',
  });

  // Filter transactions by period
  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    switch (period) {
      case 'daily':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'weekly':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'monthly':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return null;
    }
  };

  const filteredTransactions = useMemo(() => {
    const range = getDateRange(reportPeriod);
    if (!range) return transactions;
    
    return transactions.filter(t => {
      const transDate = new Date(t.date);
      return isWithinInterval(transDate, { start: range.start, end: range.end });
    });
  }, [transactions, reportPeriod]);

  const filteredCashTransactions = useMemo(() => {
    const range = getDateRange(reportPeriod);
    if (!range) return cashTransactions;
    
    return cashTransactions.filter(t => {
      const transDate = new Date(t.date);
      return isWithinInterval(transDate, { start: range.start, end: range.end });
    });
  }, [cashTransactions, reportPeriod]);

  // Report period label
  const getPeriodLabel = () => {
    const now = new Date();
    switch (reportPeriod) {
      case 'daily':
        return format(now, 'dd MMMM yyyy', { locale: tr });
      case 'weekly':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        return `${format(weekStart, 'dd MMM', { locale: tr })} - ${format(weekEnd, 'dd MMM yyyy', { locale: tr })}`;
      case 'monthly':
        return format(now, 'MMMM yyyy', { locale: tr });
      default:
        return 'Tüm Zamanlar';
    }
  };

  // Calculate totals based on filtered transactions
  const totalBankBalance = bankAccounts.reduce((sum, acc) => {
    const balance = Number(acc.balance);
    return sum + convertToDisplay(balance, acc.currency || 'TRY');
  }, 0);

  const periodIncome = filteredTransactions
    .filter((t) => t.type === 'income' || t.type === 'sale')
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + convertToDisplay(amount, t.currency || 'TRY');
    }, 0);

  const periodExpense = filteredTransactions
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + convertToDisplay(amount, t.currency || 'TRY');
    }, 0);

  const periodCashIncome = filteredCashTransactions
    .filter((t) => t.type === 'income' || t.type === 'sale')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const periodCashExpense = filteredCashTransactions
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const periodNet = periodIncome - periodExpense;

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
            <p className="text-muted-foreground mt-1">Banka hesapları, nakit kasa ve finansal işlemler</p>
          </div>
          <div className="flex items-center gap-3">
            <CurrencyToggle
              displayCurrency={displayCurrency}
              onToggle={toggleCurrency}
              rate={rate}
              isLoading={rateLoading}
            />
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

        {/* Report Period Selector */}
        <Card className="animate-slide-up">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rapor Dönemi</p>
                  <p className="text-lg font-semibold">{getPeriodLabel()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={reportPeriod === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportPeriod('daily')}
                >
                  Günlük
                </Button>
                <Button
                  variant={reportPeriod === 'weekly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportPeriod('weekly')}
                >
                  Haftalık
                </Button>
                <Button
                  variant={reportPeriod === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportPeriod('monthly')}
                >
                  Aylık
                </Button>
                <Button
                  variant={reportPeriod === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReportPeriod('all')}
                >
                  Tümü
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Period Report Summary */}
        {reportPeriod !== 'all' && (
          <Card className="animate-slide-up border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">
                  {reportPeriod === 'daily' ? 'Günlük' : reportPeriod === 'weekly' ? 'Haftalık' : 'Aylık'} Rapor Özeti
                </CardTitle>
                <Badge variant="secondary">{getPeriodLabel()}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-card border">
                  <p className="text-xs text-muted-foreground mb-1">Toplam İşlem</p>
                  <p className="text-2xl font-bold">{filteredTransactions.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-xs text-muted-foreground mb-1">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(periodIncome)}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-muted-foreground mb-1">Toplam Gider</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(periodExpense)}</p>
                </div>
                <div className={`p-4 rounded-lg border ${periodNet >= 0 ? 'bg-success/10 border-success/20' : 'bg-destructive/10 border-destructive/20'}`}>
                  <p className="text-xs text-muted-foreground mb-1">Net Kar/Zarar</p>
                  <p className={`text-2xl font-bold ${periodNet >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {periodNet >= 0 ? '+' : ''}{formatCurrency(periodNet)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Nakit Gelir</p>
                  <p className="text-lg font-semibold text-success">+{formatCurrency(convertToDisplay(periodCashIncome, 'TRY'))}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Nakit Gider</p>
                  <p className="text-lg font-semibold text-destructive">-{formatCurrency(convertToDisplay(periodCashExpense, 'TRY'))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Toplam Banka</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBankBalance)}</p>
              <p className="text-sm text-muted-foreground mt-1">{bankAccounts.length} hesap</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-transparent border-warning/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-warning/20 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-warning" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Nakit Kasa</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(convertToDisplay(cashBalance, 'TRY'))}</p>
              <p className="text-sm text-muted-foreground mt-1">{cashTransactions.length} işlem</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border group hover:border-success/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {reportPeriod === 'all' ? 'Toplam' : reportPeriod === 'daily' ? 'Günlük' : reportPeriod === 'weekly' ? 'Haftalık' : 'Aylık'} Gelir
                </span>
              </div>
              <p className="text-2xl font-bold text-success">{formatCurrency(periodIncome)}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border group hover:border-destructive/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {reportPeriod === 'all' ? 'Toplam' : reportPeriod === 'daily' ? 'Günlük' : reportPeriod === 'weekly' ? 'Haftalık' : 'Aylık'} Gider
                </span>
              </div>
              <p className="text-2xl font-bold text-destructive">{formatCurrency(periodExpense)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Aylık Gelir/Gider Karşılaştırması</CardTitle>
                <p className="text-sm text-muted-foreground">Son 6 ay</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                  <YAxis
                    tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}k`}
                    className="text-xs fill-muted-foreground"
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelClassName="font-medium"
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="income"
                    name="Gelir"
                    fill="hsl(var(--success))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Gider"
                    fill="hsl(var(--destructive))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="accounts" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="accounts" className="flex-1 sm:flex-none">
              <Landmark className="w-4 h-4 mr-2" />
              Banka Hesapları
            </TabsTrigger>
            <TabsTrigger value="cash" className="flex-1 sm:flex-none">
              <Banknote className="w-4 h-4 mr-2" />
              Nakit Kasa
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex-1 sm:flex-none">
              <Wallet className="w-4 h-4 mr-2" />
              Tüm İşlemler
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

          <TabsContent value="cash" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Nakit Bakiye</span>
                    <Banknote className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-xl font-bold mt-2">{formatCurrency(convertToDisplay(cashBalance, 'TRY'))}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {reportPeriod === 'all' ? 'Nakit Gelir' : `${reportPeriod === 'daily' ? 'Günlük' : reportPeriod === 'weekly' ? 'Haftalık' : 'Aylık'} Nakit Gelir`}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-xl font-bold mt-2 text-success">{formatCurrency(convertToDisplay(periodCashIncome, 'TRY'))}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {reportPeriod === 'all' ? 'Nakit Gider' : `${reportPeriod === 'daily' ? 'Günlük' : reportPeriod === 'weekly' ? 'Haftalık' : 'Aylık'} Nakit Gider`}
                    </span>
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  </div>
                  <p className="text-xl font-bold mt-2 text-destructive">{formatCurrency(convertToDisplay(periodCashExpense, 'TRY'))}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Nakit İşlemleri</span>
                  {reportPeriod !== 'all' && (
                    <Badge variant="outline">{filteredCashTransactions.length} işlem</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {filteredCashTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {reportPeriod === 'all' ? 'Henüz nakit işlem yok' : 'Bu dönemde nakit işlem yok'}
                    </p>
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
                        {filteredCashTransactions.map((trans) => (
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

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Tüm İşlemler</span>
                  {reportPeriod !== 'all' && (
                    <Badge variant="outline">{filteredTransactions.length} işlem</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {transLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {reportPeriod === 'all' ? 'Henüz işlem yok' : 'Bu dönemde işlem yok'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tür</TableHead>
                          <TableHead>Açıklama</TableHead>
                          <TableHead>Ödeme Yöntemi</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead className="text-right">Tutar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((trans) => (
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
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                trans.payment_method === 'cash' 
                                  ? 'bg-warning/10 text-warning' 
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {trans.payment_method === 'cash' ? (
                                  <>
                                    <Banknote className="w-3 h-3" />
                                    Nakit
                                  </>
                                ) : (
                                  <>
                                    <Landmark className="w-3 h-3" />
                                    Banka
                                  </>
                                )}
                              </span>
                            </TableCell>
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
