import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { Download, Package, Users, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const { products } = useProducts();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  // Calculate stats
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.quantity * p.purchase_price,
    0
  );
  const potentialProfit = products.reduce(
    (sum, p) => sum + p.quantity * (p.sale_price - p.purchase_price),
    0
  );

  const income = transactions
    .filter((t) => t.type === 'income' || t.type === 'sale')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalCustomerBalance = accounts
    .filter((a) => a.type === 'customer')
    .reduce((sum, a) => sum + a.balance, 0);
  const totalSupplierBalance = accounts
    .filter((a) => a.type === 'supplier')
    .reduce((sum, a) => sum + a.balance, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

  // Category distribution
  const categoryData = products.reduce((acc: any[], p) => {
    const category = p.category || 'Kategorisiz';
    const existing = acc.find((c) => c.name === category);
    if (existing) {
      existing.value += p.quantity * p.purchase_price;
    } else {
      acc.push({ name: category, value: p.quantity * p.purchase_price });
    }
    return acc;
  }, []);

  const COLORS = ['hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(220, 14%, 46%)', 'hsl(0, 84%, 60%)', 'hsl(270, 70%, 50%)'];

  // Monthly data
  const monthlyData = [
    { name: 'Oca', gelir: 0, gider: 0 },
    { name: 'Şub', gelir: 0, gider: 0 },
    { name: 'Mar', gelir: 0, gider: 0 },
    { name: 'Nis', gelir: 0, gider: 0 },
    { name: 'May', gelir: 0, gider: 0 },
    { name: 'Haz', gelir: 0, gider: 0 },
    { name: 'Tem', gelir: 0, gider: 0 },
    { name: 'Ağu', gelir: 0, gider: 0 },
    { name: 'Eyl', gelir: 0, gider: 0 },
    { name: 'Eki', gelir: 0, gider: 0 },
    { name: 'Kas', gelir: 0, gider: 0 },
    { name: 'Ara', gelir: 0, gider: 0 },
  ];

  transactions.forEach((t) => {
    const month = new Date(t.date).getMonth();
    if (t.type === 'income' || t.type === 'sale') {
      monthlyData[month].gelir += Number(t.amount);
    } else {
      monthlyData[month].gider += Number(t.amount);
    }
  });

  const exportFullReport = () => {
    const reportData = {
      summary: {
        totalProducts: products.length,
        totalStockValue,
        potentialProfit,
        totalIncome: income,
        totalExpense: expense,
        netProfit: income - expense,
        totalCustomers: accounts.filter((a) => a.type === 'customer').length,
        totalSuppliers: accounts.filter((a) => a.type === 'supplier').length,
        customerBalance: totalCustomerBalance,
        supplierBalance: totalSupplierBalance,
      },
      products: products.map((p) => ({
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
        purchasePrice: p.purchase_price,
        salePrice: p.sale_price,
        stockValue: p.quantity * p.purchase_price,
      })),
      accounts: accounts.map((a) => ({
        name: a.name,
        type: a.type === 'customer' ? 'Müşteri' : 'Tedarikçi',
        balance: a.balance,
        phone: a.phone,
        email: a.email,
      })),
      transactions: transactions.map((t: any) => ({
        date: t.date,
        type: t.type,
        amount: t.amount,
        description: t.description,
        account: t.accounts?.name,
        product: t.products?.name,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rapor.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Raporlar</h1>
            <p className="text-muted-foreground mt-1">İşletmenizin detaylı analizi</p>
          </div>
          <Button onClick={exportFullReport}>
            <Download className="w-4 h-4 mr-2" />
            Tam Rapor İndir
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stok Değeri</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totalStockValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potansiyel Kar</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(potentialProfit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Müşteri Bakiyesi</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totalCustomerBalance)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Kar</p>
                  <p className={`text-xl font-bold ${income - expense >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(income - expense)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue */}
          <Card className="glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-lg">Aylık Gelir/Gider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="gelir" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gider" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="glass animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-lg">Kategori Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    Henüz ürün eklenmemiş
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Gelir Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Toplam Gelir</span>
                <span className="font-semibold text-success">{formatCurrency(income)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">İşlem Sayısı</span>
                <span className="font-semibold">
                  {transactions.filter((t) => t.type === 'income' || t.type === 'sale').length}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-destructive" />
                Gider Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">Toplam Gider</span>
                <span className="font-semibold text-destructive">{formatCurrency(expense)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="text-muted-foreground">İşlem Sayısı</span>
                <span className="font-semibold">
                  {transactions.filter((t) => t.type === 'expense' || t.type === 'purchase').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
