import { Layout } from '@/components/layout/Layout';
import { useProducts } from '@/hooks/useProducts';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';
import { CurrencyToggle } from '@/components/CurrencyToggle';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Dashboard = () => {
  const { products } = useProducts();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { displayCurrency, toggleCurrency, formatCurrency, convertToDisplay, rate, isLoading: rateLoading } = useCurrencyDisplay();

  // Calculate stats
  const totalProducts = products.length;
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.quantity * p.purchase_price,
    0
  );
  const lowStockProducts = products.filter((p) => p.quantity <= p.min_stock_level);
  const totalCustomers = accounts.filter((a) => a.type === 'customer').length;
  const totalSuppliers = accounts.filter((a) => a.type === 'supplier').length;

  // Calculate income/expense with currency conversion
  const income = transactions
    .filter((t) => t.type === 'income' || t.type === 'sale')
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + convertToDisplay(amount, t.currency || 'TRY');
    }, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense' || t.type === 'purchase')
    .reduce((sum, t) => {
      const amount = Number(t.amount);
      return sum + convertToDisplay(amount, t.currency || 'TRY');
    }, 0);

  const netBalance = income - expense;

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('tr-TR').format(value);

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                Hoş Geldiniz
              </h1>
              <p className="text-muted-foreground mt-1">
                İşletmenizin güncel durumu
              </p>
            </div>
            <CurrencyToggle
              displayCurrency={displayCurrency}
              onToggle={toggleCurrency}
              rate={rate}
              isLoading={rateLoading}
            />
          </div>
        </div>

        {/* Main Stats - Hero Style */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Net Balance - Featured */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 overflow-hidden relative">
            <CardContent className="p-8">
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Net Bakiye</span>
                  </div>
                  <div>
                    <p className={`text-4xl lg:text-5xl font-bold tracking-tight ${netBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                      {formatCurrency(netBalance)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tüm gelir ve giderlerinizin toplamı
                    </p>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${netBalance >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {netBalance >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-success" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-destructive" />
                  )}
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -right-20 -bottom-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
            </CardContent>
          </Card>

          {/* Stock Value */}
          <Card className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center">
                  <Package className="w-5 h-5 text-accent-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Stok Değeri</span>
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-foreground">
                {formatCurrency(convertToDisplay(totalStockValue, 'TRY'))}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {totalProducts} üründe toplam stok
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* Income */}
          <Card className="bg-card border-border group hover:border-success/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">
                {formatCurrency(income)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Toplam Gelir</p>
            </CardContent>
          </Card>

          {/* Expense */}
          <Card className="bg-card border-border group hover:border-destructive/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ArrowDownRight className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">
                {formatCurrency(expense)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Toplam Gider</p>
            </CardContent>
          </Card>

          {/* Customers */}
          <Card className="bg-card border-border group hover:border-primary/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">
                {formatNumber(totalCustomers)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Müşteri</p>
            </CardContent>
          </Card>

          {/* Suppliers */}
          <Card className="bg-card border-border group hover:border-secondary-foreground/30 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4 text-secondary-foreground" />
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground">
                {formatNumber(totalSuppliers)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Tedarikçi</p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {/* Low Stock Alert */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-warning/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Düşük Stok</h3>
                    <p className="text-xs text-muted-foreground">{lowStockProducts.length} ürün</p>
                  </div>
                </div>
              </div>
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">Tüm stoklar yeterli seviyede</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.slice(0, 4).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Min: {product.min_stock_level} {product.unit}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                        {product.quantity} {product.unit}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Son İşlemler</h3>
                    <p className="text-xs text-muted-foreground">En son {Math.min(4, transactions.length)} işlem</p>
                  </div>
                </div>
              </div>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Henüz işlem yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 4).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            transaction.type === 'income' || transaction.type === 'sale'
                              ? 'bg-success/10'
                              : 'bg-destructive/10'
                          }`}
                        >
                          {transaction.type === 'income' || transaction.type === 'sale' ? (
                            <ArrowUpRight className="w-4 h-4 text-success" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {transaction.description || 'İşlem'}
                          </p>
                          <p className="text-xs text-muted-foreground">{transaction.date}</p>
                        </div>
                      </div>
                        <span
                          className={`font-semibold text-sm ${
                            transaction.type === 'income' || transaction.type === 'sale'
                              ? 'text-success'
                              : 'text-destructive'
                          }`}
                        >
                          {transaction.type === 'income' || transaction.type === 'sale' ? '+' : '-'}
                          {formatCurrency(convertToDisplay(Number(transaction.amount), transaction.currency || 'TRY'))}
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
