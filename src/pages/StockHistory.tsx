import { Layout } from '@/components/layout/Layout';
import { StockMovementHistory } from '@/components/StockMovementHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';

const StockHistory = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="animate-fade-in">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Stok Hareketleri</h1>
          <p className="text-muted-foreground mt-1">Tüm stok giriş, çıkış ve düzeltmelerini görüntüleyin</p>
        </div>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Hareket Geçmişi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StockMovementHistory />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default StockHistory;
