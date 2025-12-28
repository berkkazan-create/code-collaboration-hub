import { useState, useMemo, useRef } from 'react';
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
import { useCategories } from '@/hooks/useCategories';
import { useAccounts, Account } from '@/hooks/useAccounts';
import { useProductSerials, ProductSerial } from '@/hooks/useProductSerials';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';
import { CurrencyToggle } from '@/components/CurrencyToggle';
import { SalesReceipt } from '@/components/SalesReceipt';
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
  Package,
  Printer,
  RotateCcw,
  XCircle,
  FileText,
  RefreshCw
} from 'lucide-react';
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
  const { categories } = useCategories();
  const { accounts, createAccount } = useAccounts();
  const { inStockSerials, soldSerials, returnedSerials, sellSerial, returnSerial, cancelSale, findBySerial, updateSerial } = useProductSerials();
  const { salesTransactions, createTransaction, deleteTransaction } = useTransactions();
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
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [returnConfirmId, setReturnConfirmId] = useState<string | null>(null);
  const [restockConfirmId, setRestockConfirmId] = useState<string | null>(null);
  const [lastSaleData, setLastSaleData] = useState<{
    receiptNo: string;
    date: Date;
    customer: { name: string; phone?: string; address?: string } | null;
    items: { product_name: string; serial_number?: string; quantity: number; unit_price: number; total: number }[];
    paymentMethod: 'cash' | 'bank';
    total: number;
  } | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

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
    const requiresSerialForProduct = !!categories.find(c => c.name === product.category)?.requires_serial;

    // For IMEI-required products, auto-assign a random available serial if not provided
    let finalSerial = serial;
    if (requiresSerialForProduct && !serial) {
      const availableSerials = inStockSerials.filter(s => s.product_id === product.id);
      if (availableSerials.length === 0) {
        toast.error('Bu ürün için stokta IMEI bulunamadı.');
        return;
      }
      // Pick a random available serial
      finalSerial = availableSerials[Math.floor(Math.random() * availableSerials.length)];
      toast.info(`IMEI otomatik atandı: ${finalSerial.serial_number}`);
    }

    const existingItem = cart.find(item => 
      finalSerial ? item.serial_id === finalSerial.id : item.product_id === product.id && !item.serial_id
    );

    // Don't allow adding the same serial twice
    if (finalSerial && cart.some(item => item.serial_id === finalSerial.id)) {
      toast.error('Bu IMEI zaten sepette.');
      return;
    }

    if (existingItem && !finalSerial) {
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
        serial_number: finalSerial?.serial_number,
        serial_id: finalSerial?.id,
        quantity: 1,
        unit_price: finalSerial?.sale_price || product.sale_price,
        total: finalSerial?.sale_price || product.sale_price,
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

  const updatePrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setCart(cart.map(item =>
      item.id === itemId
        ? { ...item, unit_price: newPrice, total: item.quantity * newPrice }
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

      // Save sale data for receipt
      const receiptNo = `S${Date.now().toString().slice(-8)}`;
      setLastSaleData({
        receiptNo,
        date: new Date(),
        customer: selectedCustomer ? {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone || undefined,
          address: selectedCustomer.address || undefined,
        } : null,
        items: [...cart],
        paymentMethod,
        total: cartTotal,
      });

      toast.success('Satış tamamlandı');
      setCart([]);
      setSelectedCustomer(null);
      setIsAnonymousSale(false);
      setCustomerSearch('');
      setIsReceiptDialogOpen(true);
    } catch (error) {
      toast.error('Satış işlemi sırasında hata oluştu');
    }
  };

  const handlePrintReceipt = () => {
    if (!lastSaleData) {
      toast.error('Fiş verisi bulunamadı');
      return;
    }

    const formatCurrencyPrint = (amount: number) => {
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
      }).format(amount);
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup engelleyici aktif olabilir');
      return;
    }

    const itemsHtml = lastSaleData.items.map(item => `
      <div style="margin-bottom: 8px; font-size: 10px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="flex: 1;">${item.product_name}</span>
          <span style="width: 40px; text-align: center;">${item.quantity}</span>
          <span style="width: 70px; text-align: right;">${formatCurrencyPrint(item.total)}</span>
        </div>
        ${item.serial_number ? `<p style="font-size: 8px; color: #666; padding-left: 8px;">IMEI: ${item.serial_number}</p>` : ''}
      </div>
    `).join('');

    const customerHtml = lastSaleData.customer ? `
      <div style="margin-bottom: 16px; border-top: 1px dashed #ccc; padding-top: 8px; font-size: 10px;">
        <p style="font-weight: 600;">MÜŞTERİ:</p>
        <p>${lastSaleData.customer.name}</p>
        ${lastSaleData.customer.phone ? `<p>Tel: ${lastSaleData.customer.phone}</p>` : ''}
        ${lastSaleData.customer.address ? `<p>${lastSaleData.customer.address}</p>` : ''}
      </div>
    ` : '';

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Satış Fişi</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              padding: 10px;
              background: white;
              color: black;
            }
            .receipt {
              width: 80mm;
              margin: 0 auto;
            }
            @media print {
              body { padding: 0; }
              .receipt { width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div style="text-align: center; margin-bottom: 16px; border-bottom: 1px dashed #ccc; padding-bottom: 16px;">
              <h1 style="font-size: 18px; font-weight: bold;">SERVİSİUM</h1>
              <p style="font-size: 10px; margin-top: 4px;">SATIŞ FİŞİ</p>
            </div>

            <div style="margin-bottom: 16px; font-size: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span>Fiş No:</span>
                <span style="font-weight: 600;">${lastSaleData.receiptNo}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Tarih:</span>
                <span>${lastSaleData.date.toLocaleDateString('tr-TR')} ${lastSaleData.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Ödeme:</span>
                <span>${lastSaleData.paymentMethod === 'cash' ? 'NAKİT' : 'BANKA'}</span>
              </div>
            </div>

            ${customerHtml}

            <div style="border-top: 1px dashed #ccc; padding-top: 8px;">
              <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 8px; font-size: 10px;">
                <span style="flex: 1;">ÜRÜN</span>
                <span style="width: 40px; text-align: center;">AD.</span>
                <span style="width: 70px; text-align: right;">TUTAR</span>
              </div>
              ${itemsHtml}
            </div>

            <div style="border-top: 2px double #ccc; margin-top: 16px; padding-top: 8px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
                <span>TOPLAM:</span>
                <span>${formatCurrencyPrint(lastSaleData.total)}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 24px; border-top: 1px dashed #ccc; padding-top: 16px; font-size: 9px;">
              <p>Bizi tercih ettiğiniz için</p>
              <p style="font-weight: 600;">TEŞEKKÜR EDERİZ</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const formatPrice = (value: number) => formatCurrency(convertToDisplay(value, 'TRY'));

  const handleViewReceipt = async (transaction: Transaction) => {
    // Fetch IMEI info directly from product_serials table for this transaction
    const transactionSerials = [...soldSerials, ...returnedSerials].filter(
      s => s.transaction_id === transaction.id
    );

    const items: { product_name: string; serial_number?: string; quantity: number; unit_price: number; total: number }[] = [];

    if (transactionSerials.length > 0) {
      // Use actual serial data from product_serials
      transactionSerials.forEach(serial => {
        items.push({
          product_name: serial.products?.name || 'Ürün',
          serial_number: serial.serial_number,
          quantity: 1,
          unit_price: serial.sale_price || 0,
          total: serial.sale_price || 0,
        });
      });
    } else {
      // Fallback: parse from description for older transactions or non-serial items
      const description = transaction.description || '';
      
      if (description.startsWith('Satış:')) {
        const itemsText = description.replace('Satış:', '').trim();
        const itemParts = itemsText.split(',').map(s => s.trim());
        
        itemParts.forEach((part) => {
          const imeiMatch = part.match(/\(IMEI:\s*([^)]+)\)/);
          const productName = part.replace(/\s*\(IMEI:\s*[^)]+\)/, '').trim();
          
          items.push({
            product_name: productName || transaction.products?.name || 'Ürün',
            serial_number: imeiMatch ? imeiMatch[1].trim() : undefined,
            quantity: 1,
            unit_price: transaction.amount / (transaction.quantity || 1),
            total: transaction.amount / (transaction.quantity || itemParts.length),
          });
        });
      } else {
        items.push({
          product_name: transaction.products?.name || description || 'Ürün',
          quantity: transaction.quantity || 1,
          unit_price: transaction.amount / (transaction.quantity || 1),
          total: transaction.amount,
        });
      }
    }

    setLastSaleData({
      receiptNo: `S${transaction.id.slice(-8).toUpperCase()}`,
      date: new Date(transaction.date),
      customer: transaction.accounts ? {
        name: transaction.accounts.name,
        phone: transaction.accounts.phone || undefined,
      } : null,
      items,
      paymentMethod: transaction.payment_method as 'cash' | 'bank',
      total: transaction.amount,
    });
    setIsReceiptDialogOpen(true);
  };

  const handleCancelSale = async () => {
    if (cancelConfirmId) {
      await deleteTransaction.mutateAsync(cancelConfirmId);
      setCancelConfirmId(null);
    }
  };

  const handleReturnSerial = async () => {
    if (returnConfirmId) {
      await returnSerial.mutateAsync(returnConfirmId);
      setReturnConfirmId(null);
    }
  };

  const handleRestockSerial = async () => {
    if (restockConfirmId) {
      await updateSerial.mutateAsync({
        id: restockConfirmId,
        status: 'in_stock' as any,
      });
      setRestockConfirmId(null);
      toast.success('Ürün stoğa geri alındı');
    }
  };

  // Sales history columns using transactions
  const salesHistoryColumns = [
    {
      key: 'date',
      header: 'Tarih',
      render: (transaction: Transaction) => format(new Date(transaction.date), 'dd/MM/yyyy', { locale: tr }),
    },
    {
      key: 'description',
      header: 'Açıklama',
      render: (transaction: Transaction) => (
        <div>
          <p className="font-medium">{transaction.products?.name || 'Satış'}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{transaction.description}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Müşteri',
      render: (transaction: Transaction) => transaction.accounts ? (
        <div>
          <p className="font-medium">{transaction.accounts.name}</p>
          {transaction.accounts.phone && (
            <p className="text-xs text-muted-foreground">{transaction.accounts.phone}</p>
          )}
        </div>
      ) : (
        <Badge variant="secondary">Anonim</Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Tutar',
      render: (transaction: Transaction) => (
        <span className="font-semibold text-primary">{formatPrice(transaction.amount)}</span>
      ),
    },
    {
      key: 'payment',
      header: 'Ödeme',
      render: (transaction: Transaction) => (
        <Badge variant="outline">
          {transaction.payment_method === 'cash' ? 'Nakit' : 'Banka'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (transaction: Transaction) => {
        // Check if this transaction has serials that can be returned
        const transactionSerials = soldSerials.filter(s => s.transaction_id === transaction.id);
        
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleViewReceipt(transaction)}
              title="Fişi Görüntüle"
            >
              <FileText className="w-4 h-4" />
            </Button>
            {transactionSerials.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-orange-500 hover:text-orange-600"
                onClick={() => setReturnConfirmId(transactionSerials[0].id)}
                title="İade Al"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setCancelConfirmId(transaction.id)}
              title="Satışı İptal Et"
            >
              <XCircle className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Returned items columns
  const returnedColumns = [
    {
      key: 'date',
      header: 'İade Tarihi',
      render: (serial: ProductSerial) => serial.updated_at 
        ? format(new Date(serial.updated_at), 'dd/MM/yyyy HH:mm', { locale: tr })
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
      key: 'prices',
      header: 'Fiyat Bilgisi',
      render: (serial: ProductSerial) => (
        <div className="text-sm">
          <p>Alış: {formatPrice(serial.purchase_price)}</p>
          <p>Satış: {formatPrice(serial.sale_price)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: () => (
        <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
          İade Edildi
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (serial: ProductSerial) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRestockConfirmId(serial.id)}
          title="Stoğa Geri Al"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Stoğa Al
        </Button>
      ),
    },
  ];

  // Sold serials columns (for IMEI tracking)
  const soldSerialsColumns = [
    {
      key: 'date',
      header: 'Satış Tarihi',
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
        </div>
      ) : (
        <Badge variant="secondary">Anonim</Badge>
      ),
    },
    {
      key: 'price',
      header: 'Satış Fiyatı',
      render: (serial: ProductSerial) => (
        <span className="font-semibold text-primary">{formatPrice(serial.sale_price)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'İşlemler',
      render: (serial: ProductSerial) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-orange-500 hover:text-orange-600"
            onClick={() => setReturnConfirmId(serial.id)}
            title="İade Al"
          >
            <RotateCcw className="w-4 h-4" />
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
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="sale">Satış</TabsTrigger>
            <TabsTrigger value="history">Satış Geçmişi</TabsTrigger>
            <TabsTrigger value="serials">IMEI Takip</TabsTrigger>
            <TabsTrigger value="returns">
              İadeler
              {returnedSerials.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                  {returnedSerials.length}
                </Badge>
              )}
            </TabsTrigger>
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
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">₺</span>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updatePrice(item.id, parseFloat(e.target.value) || 0)}
                                className="w-24 h-8 text-right font-semibold"
                                step="0.01"
                              />
                            </div>
                            <span className="font-semibold min-w-[80px] text-right text-primary">
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
                <CardTitle>Satış Geçmişi</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={salesHistoryColumns}
                  data={salesTransactions.slice(0, 100)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="serials">
            <Card>
              <CardHeader>
                <CardTitle>Satılan IMEI'li Cihazlar</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={soldSerialsColumns}
                  data={soldSerials.slice(0, 100)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  İade Edilen Ürünler
                  {returnedSerials.length > 0 && (
                    <Badge variant="destructive">{returnedSerials.length} ürün</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {returnedSerials.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Henüz iade edilmiş ürün bulunmuyor</p>
                ) : (
                  <DataTable
                    columns={returnedColumns}
                    data={returnedSerials}
                  />
                )}
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

        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Satış Fişi
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto border rounded-lg">
              {lastSaleData && (
                <SalesReceipt
                  ref={receiptRef}
                  data={{
                    receiptNo: lastSaleData.receiptNo,
                    date: lastSaleData.date,
                    customer: lastSaleData.customer,
                    items: lastSaleData.items.map(item => ({
                      product_name: item.product_name,
                      serial_number: item.serial_number,
                      quantity: item.quantity,
                      unit_price: item.unit_price,
                      total: item.total,
                    })),
                    paymentMethod: lastSaleData.paymentMethod,
                    total: lastSaleData.total,
                  }}
                />
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsReceiptDialogOpen(false)}
              >
                Kapat
              </Button>
              <Button className="flex-1" onClick={handlePrintReceipt}>
                <Printer className="w-4 h-4 mr-2" />
                Yazdır
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Sale Confirmation */}
        <AlertDialog open={!!cancelConfirmId} onOpenChange={() => setCancelConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Satışı İptal Et</AlertDialogTitle>
              <AlertDialogDescription>
                Bu satışı iptal etmek istediğinizden emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelSale} className="bg-destructive text-destructive-foreground">
                Satışı İptal Et
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Return Confirmation */}
        <AlertDialog open={!!returnConfirmId} onOpenChange={() => setReturnConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>İade Al</AlertDialogTitle>
              <AlertDialogDescription>
                Bu ürünü iade almak istediğinizden emin misiniz? Ürün iade durumuna alınacak.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={handleReturnSerial} className="bg-orange-500 hover:bg-orange-600">
                İade Al
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Restock Confirmation */}
        <AlertDialog open={!!restockConfirmId} onOpenChange={() => setRestockConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Stoğa Geri Al</AlertDialogTitle>
              <AlertDialogDescription>
                Bu ürünü tekrar stoğa almak istediğinizden emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={handleRestockSerial}>
                Stoğa Al
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Sales;
