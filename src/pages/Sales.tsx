import { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProducts } from '@/hooks/useProducts';
import { useAccounts, Account } from '@/hooks/useAccounts';
import { useProductSerials, ProductSerial } from '@/hooks/useProductSerials';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';
import { CurrencyToggle } from '@/components/CurrencyToggle';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  User, 
  UserPlus,
  Phone,
  CreditCard,
  Banknote,
  ScanBarcode,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  serial_number?: string;
  serial_id?: string;
  quantity: number;
  unit_price: number;
  total: number;
}

const Sales = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const { accounts, createAccount } = useAccounts();
  const { inStockSerials, soldSerials, sellSerial, findBySerial } = useProductSerials();
  const { createTransaction } = useTransactions();
  const { bankAccounts } = useBankAccounts();
  const { displayCurrency, toggleCurrency, formatCurrency, convertToDisplay, rate, isLoading: rateLoading } = useCurrencyDisplay();

  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Account | null>(null);
  const [isAnonymousSale, setIsAnonymousSale] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [activeTab, setActiveTab] = useState('sale');

  // Customer search by phone
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return accounts.filter(a => 
      a.type === 'customer' && (
        a.phone?.includes(customerSearch) ||
        a.name.toLowerCase().includes(customerSearch.toLowerCase())
      )
    ).slice(0, 5);
  }, [accounts, customerSearch]);

  // Product/Serial search
  const searchResults = useMemo((): { serials: ProductSerial[]; products: typeof products } => {
    if (!searchQuery) return { serials: [], products: [] };
    const query = searchQuery.toLowerCase();
    
    // First check serials (IMEI)
    const matchingSerials = inStockSerials.filter(s => 
      s.serial_number.toLowerCase().includes(query) ||
      s.products?.name.toLowerCase().includes(query)
    );

    // Then check products
    const matchingProducts = products.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p as any).barcode?.toLowerCase().includes(query) ||
      p.sku?.toLowerCase().includes(query)
    );

    return { serials: matchingSerials.slice(0, 5), products: matchingProducts.slice(0, 5) };
  }, [searchQuery, inStockSerials, products]);

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const addToCart = (product: any, serial?: ProductSerial) => {
    const existingItem = cart.find(item => 
      serial ? item.serial_id === serial.id : item.product_id === product.id && !item.serial_id
    );

    if (existingItem && !serial) {
      // Increase quantity for non-serial products
      setCart(cart.map(item => 
        item.id === existingItem.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      // Add new item
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        serial_number: serial?.serial_number,
        serial_id: serial?.id,
        quantity: 1,
        unit_price: serial?.sale_price || product.sale_price,
        total: serial?.sale_price || product.sale_price,
      };
      setCart([...cart, newItem]);
    }
    setSearchQuery('');
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, quantity, total: quantity * item.unit_price }
        : item
    ));
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.phone) {
      toast.error('İsim ve telefon zorunludur');
      return;
    }

    try {
      const result = await createAccount.mutateAsync({
        name: newCustomerData.name,
        phone: newCustomerData.phone,
        email: newCustomerData.email || null,
        address: newCustomerData.address || null,
        type: 'customer',
        balance: 0,
        tax_number: null,
        notes: null,
      });
      
      setSelectedCustomer(result as Account);
      setIsNewCustomerDialogOpen(false);
      setNewCustomerData({ name: '', phone: '', email: '', address: '' });
      toast.success('Müşteri oluşturuldu');
    } catch (error) {
      toast.error('Müşteri oluşturulurken hata oluştu');
    }
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast.error('Sepet boş');
      return;
    }

    if (!isAnonymousSale && !selectedCustomer) {
      toast.error('Müşteri seçin veya anonim satış yapın');
      return;
    }

    if (paymentMethod === 'bank' && !selectedBankAccount) {
      toast.error('Banka hesabı seçin');
      return;
    }

    try {
      // Create transaction
      const transactionResult = await createTransaction.mutateAsync({
        type: 'sale',
        amount: cartTotal,
        payment_method: paymentMethod,
        bank_account_id: paymentMethod === 'bank' ? selectedBankAccount : null,
        account_id: selectedCustomer?.id || null,
        product_id: cart.length === 1 ? cart[0].product_id : null,
        quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        description: `Satış: ${cart.map(item => item.serial_number ? `${item.product_name} (IMEI: ${item.serial_number})` : item.product_name).join(', ')}`,
        date: new Date().toISOString().split('T')[0],
        currency: 'TRY',
      });

      // Update serial statuses
      for (const item of cart) {
        if (item.serial_id) {
          await sellSerial.mutateAsync({
            id: item.serial_id,
            sale_price: item.unit_price,
            sold_to_account_id: selectedCustomer?.id || null,
            transaction_id: (transactionResult as any)?.id || null,
          });
        }
      }

      toast.success('Satış tamamlandı');
      setCart([]);
      setSelectedCustomer(null);
      setIsAnonymousSale(false);
      setCustomerSearch('');
    } catch (error) {
      toast.error('Satış işlemi sırasında hata oluştu');
    }
  };

  const formatPrice = (value: number) => formatCurrency(convertToDisplay(value, 'TRY'));

  const salesHistoryColumns = [
    {
      key: 'date',
      header: 'Tarih',
      render: (serial: ProductSerial) => serial.sold_at 
        ? format(new Date(serial.sold_at), 'dd/MM/yyyy HH:mm', { locale: tr })
        : '-',
    },
    {
      key: 'product',
      header: 'Ürün',
      render: (serial: ProductSerial) => (
        <div>
          <p className="font-medium">{serial.products?.name}</p>
          <p className="text-xs text-muted-foreground">IMEI: {serial.serial_number}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Müşteri',
      render: (serial: ProductSerial) => serial.accounts ? (
        <div>
          <p className="font-medium">{serial.accounts.name}</p>
          {serial.accounts.phone && (
            <p className="text-xs text-muted-foreground">{serial.accounts.phone}</p>
          )}
        </div>
      ) : (
        <Badge variant="secondary">Anonim</Badge>
      ),
    },
    {
      key: 'price',
      header: 'Fiyat',
      render: (serial: ProductSerial) => formatPrice(serial.sale_price),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Satış Ekranı</h1>
            <p className="text-muted-foreground mt-1">Hızlı satış işlemleri</p>
          </div>
          <CurrencyToggle
            displayCurrency={displayCurrency}
            onToggle={toggleCurrency}
            rate={rate}
            isLoading={rateLoading}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="sale">Satış</TabsTrigger>
            <TabsTrigger value="history">Satış Geçmişi</TabsTrigger>
          </TabsList>

          <TabsContent value="sale" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Product Search & Cart */}
              <div className="lg:col-span-2 space-y-4">
                {/* Product Search */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ScanBarcode className="w-5 h-5" />
                      Ürün / IMEI Ara
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Barkod, IMEI veya ürün adı..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Search Results */}
                    {searchQuery && (searchResults.serials?.length > 0 || searchResults.products?.length > 0) && (
                      <div className="mt-4 space-y-2">
                        {searchResults.serials?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Seri Numaralı Cihazlar</p>
                            {searchResults.serials?.map(serial => (
                              <Button
                                key={serial.id}
                                variant="outline"
                                className="w-full justify-start h-auto py-3 mb-2"
                                onClick={() => {
                                  const product = products.find(p => p.id === serial.product_id);
                                  if (product) addToCart(product, serial);
                                }}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <Package className="w-5 h-5 text-primary" />
                                  <div className="text-left flex-1">
                                    <p className="font-medium">{serial.products?.name}</p>
                                    <p className="text-xs text-muted-foreground">IMEI: {serial.serial_number}</p>
                                  </div>
                                  <span className="font-semibold text-primary">{formatPrice(serial.sale_price)}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}

                        {searchResults.products?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Ürünler</p>
                            {searchResults.products?.map(product => (
                              <Button
                                key={product.id}
                                variant="outline"
                                className="w-full justify-start h-auto py-3 mb-2"
                                onClick={() => addToCart(product)}
                              >
                                <div className="flex items-center gap-3 w-full">
                                  <Package className="w-5 h-5 text-primary" />
                                  <div className="text-left flex-1">
                                    <p className="font-medium">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">Stok: {product.quantity}</p>
                                  </div>
                                  <span className="font-semibold text-primary">{formatPrice(product.sale_price)}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cart */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Sepet
                      {cart.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{cart.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Sepet boş</p>
                    ) : (
                      <div className="space-y-3">
                        {cart.map(item => (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">{item.product_name}</p>
                              {item.serial_number && (
                                <p className="text-xs text-muted-foreground">IMEI: {item.serial_number}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!item.serial_id && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </>
                              )}
                            </div>
                            <span className="font-semibold min-w-[80px] text-right">
                              {formatPrice(item.total)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}

                        <div className="border-t pt-4 mt-4">
                          <div className="flex justify-between items-center text-xl font-bold">
                            <span>Toplam</span>
                            <span className="text-primary">{formatPrice(cartTotal)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Customer & Payment */}
              <div className="space-y-4">
                {/* Customer Selection */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Müşteri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isAnonymousSale && !selectedCustomer && (
                      <>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Telefon ile ara..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        {filteredCustomers.length > 0 && (
                          <div className="space-y-2">
                            {filteredCustomers.map(customer => (
                              <Button
                                key={customer.id}
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setCustomerSearch('');
                                }}
                              >
                                <User className="w-4 h-4 mr-2" />
                                <div className="text-left">
                                  <p className="font-medium">{customer.name}</p>
                                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                                </div>
                              </Button>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsNewCustomerDialogOpen(true)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Yeni Müşteri
                          </Button>
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setIsAnonymousSale(true)}
                          >
                            Anonim Satış
                          </Button>
                        </div>
                      </>
                    )}

                    {selectedCustomer && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{selectedCustomer.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCustomer(null)}
                          >
                            Değiştir
                          </Button>
                        </div>
                      </div>
                    )}

                    {isAnonymousSale && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">Anonim Satış</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAnonymousSale(false)}
                          >
                            İptal
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Ödeme Yöntemi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => setPaymentMethod('cash')}
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        Nakit
                      </Button>
                      <Button
                        variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => setPaymentMethod('bank')}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Banka
                      </Button>
                    </div>

                    {paymentMethod === 'bank' && (
                      <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                        <SelectTrigger>
                          <SelectValue placeholder="Banka hesabı seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {bankAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      className="w-full h-14 text-lg"
                      disabled={cart.length === 0 || (!isAnonymousSale && !selectedCustomer)}
                      onClick={handleCompleteSale}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Satışı Tamamla
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Son Satışlar</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={salesHistoryColumns}
                  data={soldSerials.slice(0, 50)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* New Customer Dialog */}
        <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Müşteri</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>İsim *</Label>
                <Input
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  placeholder="Müşteri adı"
                />
              </div>
              <div>
                <Label>Telefon *</Label>
                <Input
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                  placeholder="0532 xxx xx xx"
                />
              </div>
              <div>
                <Label>E-posta</Label>
                <Input
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Adres</Label>
                <Input
                  value={newCustomerData.address}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
                  placeholder="Adres"
                />
              </div>
              <Button className="w-full" onClick={handleCreateCustomer}>
                <UserPlus className="w-4 h-4 mr-2" />
                Müşteri Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Sales;
