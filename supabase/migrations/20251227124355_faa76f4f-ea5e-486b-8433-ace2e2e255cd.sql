-- Add currency column to transactions
ALTER TABLE public.transactions 
ADD COLUMN currency text DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD'));

-- Add currency column to accounts
ALTER TABLE public.accounts 
ADD COLUMN currency text DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD'));

-- Add cost_amount column to stock_movements for cost tracking
ALTER TABLE public.stock_movements 
ADD COLUMN cost_amount numeric DEFAULT 0,
ADD COLUMN currency text DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD')),
ADD COLUMN affects_cost boolean DEFAULT false,
ADD COLUMN account_id uuid REFERENCES public.accounts(id);