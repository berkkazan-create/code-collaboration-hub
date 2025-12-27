import { useState } from 'react';
import { useStockMovements, StockMovement } from '@/hooks/useStockMovements';
import { useProducts } from '@/hooks/useProducts';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Plus, History, DollarSign, Coins } from 'lucide-react';

interface StockMovementHistoryProps {
  productId?: string;
  showAddButton?: boolean;
}

export const StockMovementHistory = ({ productId, showAddButton = true }: StockMovementHistoryProps) => {
  const { movements, isLoading, createMovement } = useStockMovements(productId);
  const { products } = useProducts();
  const { accounts } = useAccounts();
  const { createTransaction } = useTransactions();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [affectsCost, setAffectsCost] = useState(false);
  const [formData, setFormData] = useState({
    product_id: productId || '',
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: '',
    cost_amount: 0,
    currency: 'TRY' as 'TRY' | 'USD',
    account_id: '',
  });

  const selectedProduct = products.find(p => p.id === formData.product_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create stock movement
    await createMovement.mutateAsync({
      product_id: formData.product_id,
      type: formData.type,
      quantity: formData.quantity,
      reason: formData.reason,
    });

    // If affects cost, create transaction
    if (affectsCost && formData.cost_amount > 0) {
      const transactionType = formData.type === 'in' ? 'purchase' : 'sale';
      await createTransaction.mutateAsync({
        type: transactionType,
        amount: formData.cost_amount,
        product_id: formData.product_id,
        account_id: formData.account_id || null,
        quantity: formData.quantity,
        description: `Stok ${formData.type === 'in' ? 'girişi' : 'çıkışı'}: ${selectedProduct?.name || 'Ürün'}`,
        date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        currency: formData.currency,
      });
    }

    setIsDialogOpen(false);
    setAffectsCost(false);
    setFormData({
      product_id: productId || '',
      type: 'in',
      quantity: 0,
      reason: '',
      cost_amount: 0,
      currency: 'TRY',
      account_id: '',
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

                {/* Cost Integration Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Maliyet/Cari Etkile</p>
                      <p className="text-xs text-muted-foreground">
                        İşlem cari hesaplara yansısın
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={affectsCost}
                    onCheckedChange={setAffectsCost}
                  />
                </div>

                {affectsCost && (
                  <div className="space-y-4 p-3 rounded-lg border border-border">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Tutar</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.cost_amount}
                          onChange={(e) => setFormData({ ...formData, cost_amount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Para Birimi</Label>
                        <Select
                          value={formData.currency}
                          onValueChange={(value: 'TRY' | 'USD') => setFormData({ ...formData, currency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TRY">
                              <div className="flex items-center gap-2">
                                <span>₺</span> TRY
                              </div>
                            </SelectItem>
                            <SelectItem value="USD">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-3 h-3" /> USD
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Cari Hesap (Opsiyonel)</Label>
                      <Select
                        value={formData.account_id || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, account_id: value === 'none' ? '' : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seçilmedi</SelectItem>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name} ({account.type === 'customer' ? 'Müşteri' : 'Tedarikçi'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

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
