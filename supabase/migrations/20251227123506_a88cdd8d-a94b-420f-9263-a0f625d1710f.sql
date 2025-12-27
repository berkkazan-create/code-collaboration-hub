-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    bank_name text,
    account_number text,
    iban text,
    balance numeric NOT NULL DEFAULT 0,
    currency text DEFAULT 'TRY',
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON public.bank_accounts
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON public.bank_accounts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete bank accounts" ON public.bank_accounts
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Update trigger
CREATE TRIGGER update_bank_accounts_updated_at
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update transactions table to reference bank_accounts
ALTER TABLE public.transactions 
ADD COLUMN bank_account_id uuid REFERENCES public.bank_accounts(id);

-- Update the balance trigger to use bank_accounts instead
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update bank account balance if payment_method is 'bank' and bank_account_id is set
  IF NEW.payment_method = 'bank' AND NEW.bank_account_id IS NOT NULL THEN
    IF NEW.type IN ('income', 'sale') THEN
      UPDATE public.bank_accounts 
      SET balance = balance + NEW.amount 
      WHERE id = NEW.bank_account_id;
    ELSIF NEW.type IN ('expense', 'purchase') THEN
      UPDATE public.bank_accounts 
      SET balance = balance - NEW.amount 
      WHERE id = NEW.bank_account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create function to reverse balance on transaction delete
CREATE OR REPLACE FUNCTION public.reverse_balance_on_transaction_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.payment_method = 'bank' AND OLD.bank_account_id IS NOT NULL THEN
    IF OLD.type IN ('income', 'sale') THEN
      UPDATE public.bank_accounts 
      SET balance = balance - OLD.amount 
      WHERE id = OLD.bank_account_id;
    ELSIF OLD.type IN ('expense', 'purchase') THEN
      UPDATE public.bank_accounts 
      SET balance = balance + OLD.amount 
      WHERE id = OLD.bank_account_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER reverse_balance_on_delete
BEFORE DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.reverse_balance_on_transaction_delete();