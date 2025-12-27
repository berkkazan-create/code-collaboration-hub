import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/ui/stat-card';
import { useProducts } from '@/hooks/useProducts';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { Package, TrendingUp, TrendingDown, Users, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { products } = useProducts();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();

  // Calculate stats
  const totalProducts = products.length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.quantity * p.purchase_price,
    0
  );
  const lowStockProducts = products.filter((p) => p.quantity <= p.min_stock_level);
  const totalCustomers = accounts.filter((a) => a.type === 'customer').length;
  const totalSuppliers = accounts.filter((a) => a.type === 'supplier').length;

  const income = transactions
    .filter((t) => t.type === 'income' || t.type === 'sale')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">İşletmenizin genel durumu</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <StatCard
            title="Toplam Ürün"
            value={totalProducts}
            icon={Package}
          />
          <StatCard
            title="Stok Değeri"
            value={formatCurrency(totalStockValue)}
            icon={TrendingUp}
          />
          <StatCard
            title="Toplam Gelir"
            value={formatCurrency(income)}
            icon={ArrowUpRight}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard
            title="Toplam Gider"
            value={formatCurrency(expense)}
            icon={ArrowDownRight}
            trend={{ value: 5, isPositive: false }}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          <Card className="glass animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Düşük Stok Uyarısı
              </CardTitle>
              <Badge variant="secondary">{lowStockProducts.length} ürün</Badge>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Düşük stoklu ürün bulunmuyor.</p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Minimum: {product.min_stock_level} {product.unit}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {product.quantity} {product.unit}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Card className="glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Cari Hesap Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-accent/50 text-center">
                  <p className="text-3xl font-bold text-accent-foreground">{totalCustomers}</p>
                  <p className="text-sm text-muted-foreground mt-1">Müşteri</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary text-center">
                  <p className="text-3xl font-bold text-secondary-foreground">{totalSuppliers}</p>
                  <p className="text-sm text-muted-foreground mt-1">Tedarikçi</p>
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Net Bakiye</span>
                  <span className="text-lg font-semibold text-foreground">
                    {formatCurrency(income - expense)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="glass lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Son İşlemler
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Henüz işlem bulunmuyor.</p>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            transaction.type === 'income' || transaction.type === 'sale'
                              ? 'bg-success/10'
                              : 'bg-destructive/10'
                          }`}
                        >
                          {transaction.type === 'income' || transaction.type === 'sale' ? (
                            <TrendingUp className="w-5 h-5 text-success" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {transaction.description || 'İşlem'}
                          </p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          transaction.type === 'income' || transaction.type === 'sale'
                            ? 'text-success'
                            : 'text-destructive'
                        }`}
                      >
                        {transaction.type === 'income' || transaction.type === 'sale' ? '+' : '-'}
                        {formatCurrency(Number(transaction.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
