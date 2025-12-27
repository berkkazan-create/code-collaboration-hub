import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExchangeRate {
  usdToTry: number;
  tryToUsd: number;
  timestamp: number;
  lastUpdate: string;
}

export const useExchangeRate = () => {
  const query = useQuery({
    queryKey: ['exchange-rate'],
    queryFn: async (): Promise<ExchangeRate> => {
      const { data, error } = await supabase.functions.invoke('get-exchange-rate');
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
    retry: 2,
  });

  const convertToTRY = (amount: number, fromCurrency: string = 'USD') => {
    if (!query.data) return amount;
    if (fromCurrency === 'TRY') return amount;
    return amount * query.data.usdToTry;
  };

  const convertToUSD = (amount: number, fromCurrency: string = 'TRY') => {
    if (!query.data) return amount;
    if (fromCurrency === 'USD') return amount;
    return amount * query.data.tryToUsd;
  };

  return {
    rate: query.data,
    isLoading: query.isLoading,
    error: query.error,
    convertToTRY,
    convertToUSD,
  };
};
