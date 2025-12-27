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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useProducts, Product, ProductInput } from '@/hooks/useProducts';
import { Plus, Search, Edit, Trash2, Download, Package } from 'lucide-react';

const Products = () => {
  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    unit: 'adet',
    purchase_price: 0,
    sale_price: 0,
    min_stock_level: 0,
    category: '',
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await updateProduct.mutateAsync({ id: editingProduct.id, ...formData });
    } else {
      await createProduct.mutateAsync(formData);
    }
    handleCloseDialog();
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
    });
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
    });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ['Ad', 'SKU', 'Miktar', 'Birim', 'Alış Fiyatı', 'Satış Fiyatı', 'Kategori'];
    const rows = products.map((p) => [
      p.name,
      p.sku || '',
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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

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
            {product.sku && <p className="text-xs text-muted-foreground">{product.sku}</p>}
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
      render: (product: Product) => formatCurrency(product.purchase_price),
      className: 'hidden md:table-cell',
    },
    {
      key: 'sale_price',
      header: 'Satış Fiyatı',
      render: (product: Product) => formatCurrency(product.sale_price),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (product: Product) => product.category || '-',
      className: 'hidden lg:table-cell',
    },
    {
      key: 'actions',
      header: '',
      render: (product: Product) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteId(product.id)}
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
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Stok Yönetimi</h1>
            <p className="text-muted-foreground mt-1">Ürünlerinizi yönetin</p>
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
                  <span className="hidden sm:inline">Yeni Ürün</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                      <Label>Kategori</Label>
                      <Input
                        value={formData.category || ''}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Miktar *</Label>
                      <Input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) =>
                          setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                        }
                        required
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
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      İptal
                    </Button>
                    <Button type="submit">
                      {editingProduct ? 'Güncelle' : 'Ekle'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ürün ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <DataTable
            data={filteredProducts}
            columns={columns}
            emptyMessage="Henüz ürün eklenmemiş"
          />
        </div>

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
