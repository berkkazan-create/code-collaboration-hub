import { useState } from 'react';
import { useStockMovements, StockMovement } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Plus, History } from 'lucide-react';

interface StockMovementHistoryProps {
  productId?: string;
  showAddButton?: boolean;
}

export const StockMovementHistory = ({ productId, showAddButton = true }: StockMovementHistoryProps) => {
  const { movements, isLoading, createMovement } = useStockMovements(productId);
  const { products } = useProducts();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: productId || '',
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMovement.mutateAsync(formData);
    setIsDialogOpen(false);
    setFormData({
      product_id: productId || '',
      type: 'in',
      quantity: 0,
      reason: '',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowUpCircle className="w-4 h-4 text-emerald-500" />;
      case 'out':
        return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Giriş';
      case 'out':
        return 'Çıkış';
      default:
        return 'Düzeltme';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'in':
        return 'default' as const;
      case 'out':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showAddButton && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="w-5 h-5" />
            Stok Hareketleri
          </h3>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Hareket Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Stok Hareketi Ekle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!productId && (
                  <div>
                    <Label>Ürün</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(value) => setFormData({ ...formData, product_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ürün seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Hareket Tipi</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'in' | 'out' | 'adjustment') =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Stok Girişi</SelectItem>
                      <SelectItem value="out">Stok Çıkışı</SelectItem>
                      <SelectItem value="adjustment">Stok Düzeltme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    {formData.type === 'adjustment' ? 'Yeni Miktar' : 'Miktar'}
                  </Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                    }
                    min={0}
                    required
                  />
                </div>
                <div>
                  <Label>Açıklama</Label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Hareket sebebi..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={createMovement.isPending}>
                    Kaydet
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {movements.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Henüz stok hareketi yok
        </div>
      ) : (
        <div className="space-y-2">
          {movements.map((movement) => (
            <div
              key={movement.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                {getTypeIcon(movement.type)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {movement.product?.name || 'Ürün'}
                    </span>
                    <Badge variant={getTypeBadgeVariant(movement.type)}>
                      {getTypeLabel(movement.type)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {movement.reason || 'Açıklama yok'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {movement.previous_quantity} → {movement.new_quantity}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(movement.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
