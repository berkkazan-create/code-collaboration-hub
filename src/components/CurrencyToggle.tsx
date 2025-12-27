import { Button } from '@/components/ui/button';
import { DollarSign, RefreshCw } from 'lucide-react';
import { DisplayCurrency } from '@/hooks/useCurrencyDisplay';

interface CurrencyToggleProps {
  displayCurrency: DisplayCurrency;
  onToggle: () => void;
  rate?: { usdToTry: number } | null;
  isLoading?: boolean;
  showRate?: boolean;
}

export const CurrencyToggle = ({
  displayCurrency,
  onToggle,
  rate,
  isLoading,
  showRate = true,
}: CurrencyToggleProps) => {
  return (
    <div className="flex items-center gap-2">
      {showRate && rate && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 text-sm">
          <span className="text-muted-foreground">1 $ =</span>
          <span className="font-medium">{rate.usdToTry.toFixed(2)} ₺</span>
          <RefreshCw className={`w-3 h-3 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="gap-2 font-medium"
      >
        {displayCurrency === 'TRY' ? (
          <>
            <span className="text-lg">₺</span>
            <span className="hidden sm:inline">TRY</span>
          </>
        ) : (
          <>
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">USD</span>
          </>
        )}
      </Button>
    </div>
  );
};
