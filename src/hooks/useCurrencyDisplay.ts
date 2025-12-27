import { useState, useCallback, useMemo } from 'react';
import { useExchangeRate } from './useExchangeRate';

export type DisplayCurrency = 'TRY' | 'USD';

export const useCurrencyDisplay = () => {
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('TRY');
  const { rate, convertToTRY, convertToUSD, isLoading } = useExchangeRate();

  const formatCurrency = useCallback(
    (value: number, originalCurrency: string = 'TRY') => {
      let displayValue = value;

      if (displayCurrency === 'USD') {
        displayValue = originalCurrency === 'USD' ? value : convertToUSD(value, 'TRY');
      } else {
        displayValue = originalCurrency === 'TRY' ? value : convertToTRY(value, 'USD');
      }

      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(displayValue);
    },
    [displayCurrency, convertToTRY, convertToUSD]
  );

  const convertToDisplay = useCallback(
    (value: number, originalCurrency: string = 'TRY') => {
      if (displayCurrency === 'USD') {
        return originalCurrency === 'USD' ? value : convertToUSD(value, 'TRY');
      } else {
        return originalCurrency === 'TRY' ? value : convertToTRY(value, 'USD');
      }
    },
    [displayCurrency, convertToTRY, convertToUSD]
  );

  const currencySymbol = useMemo(() => (displayCurrency === 'TRY' ? '₺' : '$'), [displayCurrency]);

  const toggleCurrency = useCallback(() => {
    setDisplayCurrency((prev) => (prev === 'TRY' ? 'USD' : 'TRY'));
  }, []);

  return {
    displayCurrency,
    setDisplayCurrency,
    toggleCurrency,
    formatCurrency,
    convertToDisplay,
    currencySymbol,
    rate,
    isLoading,
  };
};
