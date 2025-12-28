import { useState, useMemo } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useProducts, Product, ProductInput } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useProductSerials } from '@/hooks/useProductSerials';

import { BarcodeScanner } from '@/components/BarcodeScanner';
import { StockMovementHistory } from '@/components/StockMovementHistory';
import { Plus, Search, Edit, Trash2, Download, Package, ScanBarcode, Tag, History, Database, Smartphone, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUserRole } from '@/hooks/useUserRole';
import { useCurrencyDisplay } from '@/hooks/useCurrencyDisplay';
import { CurrencyToggle } from '@/components/CurrencyToggle';
import { Card, CardContent } from '@/components/ui/card';

const Products = () => {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const { categories } = useCategories();
  const { createSerial } = useProductSerials();
  const { isAdmin } = useUserRole();
  const { displayCurrency, toggleCurrency, formatCurrency, convertToDisplay, rate, isLoading: rateLoading } = useCurrencyDisplay();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAddingDummy, setIsAddingDummy] = useState(false);

  // IMEI/Serial number state
  const [serialNumbers, setSerialNumbers] = useState<string[]>([]);
  const [currentSerialInput, setCurrentSerialInput] = useState('');

  const [formData, setFormData] = useState<ProductInput & { barcode?: string }>({
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    unit: 'adet',
    purchase_price: 0,
    sale_price: 0,
    min_stock_level: 0,
    category: '',
    barcode: '',
  });

  // Check if selected category requires serial numbers
  const selectedCategory = useMemo(() => {
    return categories.find(c => c.name === formData.category);
  }, [categories, formData.category]);

  const requiresSerial = selectedCategory?.requires_serial || false;

  // Validate serial count matches quantity
  const serialCountValid = !requiresSerial || serialNumbers.length === formData.quantity;

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p as any).barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddSerial = () => {
    const trimmed = currentSerialInput.trim();
    if (!trimmed) {
      toast.error('IMEI numarası boş olamaz');
      return;
    }
    if (serialNumbers.includes(trimmed)) {
      toast.error('Bu IMEI numarası zaten eklenmiş');
      return;
    }
    if (serialNumbers.length >= formData.quantity) {
      toast.error(`Maksimum ${formData.quantity} adet IMEI girebilirsiniz`);
      return;
    }
    setSerialNumbers([...serialNumbers, trimmed]);
    setCurrentSerialInput('');
  };

  const handleRemoveSerial = (index: number) => {
    setSerialNumbers(serialNumbers.filter((_, i) => i !== index));
  };

  const handleBulkSerialInput = (text: string) => {
    // Parse multiple IMEI numbers (comma, newline, or space separated)
    const imeis = text
      .split(/[,\n\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const uniqueImeis = [...new Set(imeis)];
    const newSerials = uniqueImeis.filter(imei => !serialNumbers.includes(imei));
    
    if (newSerials.length + serialNumbers.length > formData.quantity) {
      toast.error(`Toplam ${formData.quantity} adet IMEI girebilirsiniz`);
      return;
    }
    
    setSerialNumbers([...serialNumbers, ...newSerials]);
    setCurrentSerialInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate serial numbers if required
    if (requiresSerial && serialNumbers.length !== formData.quantity) {
      toast.error(`${formData.quantity} adet IMEI numarası girmeniz gerekiyor (${serialNumbers.length} girildi)`);
      return;
    }

    try {
      let productResult: any;
      
      if (editingProduct) {
        productResult = await updateProduct.mutateAsync({ id: editingProduct.id, ...formData });
      } else {
        productResult = await createProduct.mutateAsync(formData);
      }

      // Create serial numbers if required and product created successfully
      if (requiresSerial && serialNumbers.length > 0 && productResult?.id) {
        for (const serial of serialNumbers) {
          await createSerial.mutateAsync({
            product_id: productResult.id,
            serial_number: serial,
            purchase_price: formData.purchase_price,
            sale_price: formData.sale_price,
          });
        }
        toast.success(`${serialNumbers.length} adet IMEI kaydedildi`);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      quantity: product.quantity,
      unit: product.unit,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      min_stock_level: product.min_stock_level,
      category: product.category || '',
      barcode: (product as any).barcode || '',
    });
    setSerialNumbers([]);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      quantity: 0,
      unit: 'adet',
      purchase_price: 0,
      sale_price: 0,
      min_stock_level: 0,
      category: '',
      barcode: '',
    });
    setSerialNumbers([]);
    setCurrentSerialInput('');
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    const foundProduct = products.find((p) => (p as any).barcode === barcode);
    if (foundProduct) {
      setSearchQuery(barcode);
      toast.success(`Ürün bulundu: ${foundProduct.name}`);
    } else {
      toast.info('Bu barkodla ürün bulunamadı');
      setFormData({ ...formData, barcode });
      setIsDialogOpen(true);
    }
  };

  const addDummyData = async () => {
    setIsAddingDummy(true);
    const dummyProducts: ProductInput[] = [
      { name: 'iPhone 15 Pro', sku: 'IPH15P-256', description: 'Apple iPhone 15 Pro 256GB', quantity: 25, unit: 'adet', purchase_price: 45000, sale_price: 52000, min_stock_level: 5, category: 'Elektronik' },
      { name: 'Samsung Galaxy S24', sku: 'SGS24-128', description: 'Samsung Galaxy S24 128GB', quantity: 30, unit: 'adet', purchase_price: 32000, sale_price: 38000, min_stock_level: 10, category: 'Elektronik' },
      { name: 'MacBook Air M3', sku: 'MBA-M3-256', description: 'Apple MacBook Air M3 256GB', quantity: 12, unit: 'adet', purchase_price: 55000, sale_price: 65000, min_stock_level: 3, category: 'Bilgisayar' },
      { name: 'Dell Monitor 27"', sku: 'DELL-27-4K', description: 'Dell UltraSharp 27" 4K Monitor', quantity: 18, unit: 'adet', purchase_price: 8500, sale_price: 10500, min_stock_level: 5, category: 'Bilgisayar' },
      { name: 'AirPods Pro 2', sku: 'APP2-2023', description: 'Apple AirPods Pro 2. Nesil', quantity: 45, unit: 'adet', purchase_price: 5500, sale_price: 7000, min_stock_level: 10, category: 'Aksesuar' },
      { name: 'Logitech MX Master 3S', sku: 'LOG-MXM3S', description: 'Logitech MX Master 3S Mouse', quantity: 35, unit: 'adet', purchase_price: 2800, sale_price: 3500, min_stock_level: 8, category: 'Aksesuar' },
      { name: 'USB-C Hub 7in1', sku: 'USBC-HUB-7', description: 'USB-C 7-in-1 Multiport Hub', quantity: 60, unit: 'adet', purchase_price: 450, sale_price: 650, min_stock_level: 15, category: 'Aksesuar' },
      { name: 'Ofis Kağıdı A4', sku: 'KAGIT-A4-500', description: 'A4 Fotokopi Kağıdı 500lü', quantity: 200, unit: 'paket', purchase_price: 85, sale_price: 120, min_stock_level: 50, category: 'Kırtasiye' },
      { name: 'Tükenmez Kalem Mavi', sku: 'KALEM-MAVI-12', description: 'Mavi Tükenmez Kalem 12li', quantity: 150, unit: 'kutu', purchase_price: 35, sale_price: 55, min_stock_level: 30, category: 'Kırtasiye' },
      { name: 'Bluetooth Klavye', sku: 'BT-KLAVYE-TR', description: 'Türkçe Q Bluetooth Klavye', quantity: 22, unit: 'adet', purchase_price: 850, sale_price: 1200, min_stock_level: 5, category: 'Aksesuar' },
    ];

    try {
      for (const product of dummyProducts) {
        await createProduct.mutateAsync(product);
      }
      toast.success('Dummy veriler başarıyla eklendi');
    } catch (error) {
      toast.error('Veri eklenirken hata oluştu');
    } finally {
      setIsAddingDummy(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Ad', 'SKU', 'Barkod', 'Miktar', 'Birim', 'Alış Fiyatı', 'Satış Fiyatı', 'Kategori'];
    const rows = products.map((p) => [
      p.name,
      p.sku || '',
      (p as any).barcode || '',
      p.quantity,
      p.unit,
      p.purchase_price,
      p.sale_price,
      p.category || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'urunler.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatPrice = (value: number) => formatCurrency(convertToDisplay(value, 'TRY'));

  const columns = [
    {
      key: 'name',
      header: 'Ürün Adı',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{product.name}</p>
            <div className="flex items-center gap-2">
              {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
              {(product as any).barcode && (
                <Badge variant="outline" className="text-xs">
                  <ScanBarcode className="w-3 h-3 mr-1" />
                  {(product as any).barcode}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Stok',
      render: (product: Product) => (
        <Badge variant={product.quantity <= product.min_stock_level ? 'destructive' : 'secondary'}>
          {product.quantity} {product.unit}
        </Badge>
      ),
    },
    {
      key: 'purchase_price',
      header: 'Alış Fiyatı',
      render: (product: Product) => formatPrice(product.purchase_price),
      className: 'hidden md:table-cell',
    },
    {
      key: 'sale_price',
      header: 'Satış Fiyatı',
      render: (product: Product) => formatPrice(product.sale_price),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (product: Product) => {
        const category = categories.find((c) => c.name === product.category);
        return product.category ? (
          <Badge variant="outline" style={{ borderColor: category?.color, color: category?.color }}>
            {category?.requires_serial && <Smartphone className="w-3 h-3 mr-1" />}
            {product.category}
          </Badge>
        ) : (
          '-'
        );
      },
      className: 'hidden lg:table-cell',
    },
    {
      key: 'actions',
      header: '',
      render: (product: Product) => (
        <div className="flex items-center gap-2 justify-end">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setSelectedProductId(product.id)}>
                <History className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Stok Hareketleri - {product.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <StockMovementHistory productId={product.id} />
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
            <Edit className="w-4 h-4" />
          </Button>
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteId(product.id)}
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Stok Yönetimi</h1>
            <p className="text-muted-foreground mt-1">Ürünlerinizi yönetin</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CurrencyToggle
              displayCurrency={displayCurrency}
              onToggle={toggleCurrency}
              rate={rate}
              isLoading={rateLoading}
            />
            <Button variant="outline" onClick={addDummyData} disabled={isAddingDummy}>
              <Database className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{isAddingDummy ? 'Ekleniyor...' : 'Demo Veri'}</span>
            </Button>
            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
              <ScanBarcode className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Barkod Tara</span>
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Dışa Aktar</span>
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleCloseDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Yeni Ürün</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Ürün Adı *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>SKU</Label>
                      <Input
                        value={formData.sku || ''}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Barkod</Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.barcode || ''}
                          onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                          placeholder="Barkod numarası"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setIsScannerOpen(true)}
                        >
                          <ScanBarcode className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Kategori</Label>
                      <Select
                        value={formData.category || ''}
                        onValueChange={(value) => {
                          setFormData({ ...formData, category: value });
                          setSerialNumbers([]); // Reset serials when category changes
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                                {category.requires_serial && (
                                  <Badge variant="outline" className="ml-1 text-xs">IMEI</Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Miktar *</Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => {
                          const qty = parseInt(e.target.value) || 0;
                          setFormData({ ...formData, quantity: qty });
                          // Trim serial numbers if quantity reduced
                          if (serialNumbers.length > qty) {
                            setSerialNumbers(serialNumbers.slice(0, qty));
                          }
                        }}
                        required
                        min={requiresSerial ? 1 : 0}
                      />
                    </div>
                    <div>
                      <Label>Birim</Label>
                      <Input
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Alış Fiyatı (₺) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.purchase_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchase_price: parseFloat(e.target.value) || 0,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label>Satış Fiyatı (₺) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.sale_price}
                        onChange={(e) =>
                          setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Minimum Stok Seviyesi</Label>
                      <Input
                        type="number"
                        value={formData.min_stock_level}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_stock_level: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Açıklama</Label>
                      <Input
                        value={formData.description || ''}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* IMEI/Serial Number Section */}
                  {requiresSerial && (
                    <Card className="border-primary/50 bg-primary/5">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-5 h-5 text-primary" />
                          <Label className="text-base font-semibold">
                            IMEI Numaraları ({serialNumbers.length}/{formData.quantity})
                          </Label>
                          {formData.quantity > 0 && !serialCountValid && (
                            <Badge variant="destructive" className="ml-auto">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {formData.quantity - serialNumbers.length} eksik
                            </Badge>
                          )}
                        </div>
                        
                        {formData.quantity === 0 ? (
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            IMEI numarası girmek için önce miktar belirleyin.
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Bu kategorideki ürünler için {formData.quantity} adet IMEI numarası girmeniz zorunludur.
                          </p>
                        )}

                        {/* Single IMEI input */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="IMEI numarası girin..."
                            value={currentSerialInput}
                            onChange={(e) => setCurrentSerialInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSerial();
                              }
                            }}
                            disabled={formData.quantity === 0}
                          />
                          <Button
                            type="button"
                            onClick={handleAddSerial}
                            disabled={formData.quantity === 0 || serialNumbers.length >= formData.quantity}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Bulk input */}
                        {formData.quantity > 0 && (
                          <div>
                            <Label className="text-sm">Toplu IMEI Girişi (virgül, boşluk veya satır ile ayırın)</Label>
                            <Textarea
                              placeholder="IMEI1, IMEI2, IMEI3..."
                              className="mt-1"
                              onBlur={(e) => {
                                if (e.target.value.trim()) {
                                  handleBulkSerialInput(e.target.value);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Added serials list */}
                        {serialNumbers.length > 0 && (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {serialNumbers.map((serial, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-background rounded-md border"
                              >
                                <span className="font-mono text-sm">
                                  {index + 1}. {serial}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => handleRemoveSerial(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      İptal
                    </Button>
                    <Button type="submit" disabled={requiresSerial && !serialCountValid}>
                      {editingProduct ? 'Güncelle' : 'Ekle'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>


        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ürün, SKU veya barkod ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <Tag className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Kategori filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <DataTable
            data={filteredProducts}
            columns={columns}
            emptyMessage="Henüz ürün eklenmemiş"
          />
        </div>

        {/* Barcode Scanner */}
        <BarcodeScanner
          open={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleBarcodeScan}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ürünü Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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

export default Products;
