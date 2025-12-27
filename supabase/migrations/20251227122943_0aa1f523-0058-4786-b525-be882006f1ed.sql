-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add payment_method column to transactions
ALTER TABLE public.transactions 
ADD COLUMN payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank'));

-- Update delete policies to only allow admins
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;
CREATE POLICY "Admins can delete accounts" ON public.accounts
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Admins can delete transactions" ON public.transactions
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Admins can delete products" ON public.products
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
CREATE POLICY "Admins can delete categories" ON public.categories
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Create function to update account balance on transaction
CREATE OR REPLACE FUNCTION public.update_account_balance_on_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if payment_method is 'bank' and account_id is set
  IF NEW.payment_method = 'bank' AND NEW.account_id IS NOT NULL THEN
    IF NEW.type IN ('income', 'sale') THEN
      -- Income/Sale increases bank balance
      UPDATE public.accounts 
      SET balance = balance + NEW.amount 
      WHERE id = NEW.account_id;
    ELSIF NEW.type IN ('expense', 'purchase') THEN
      -- Expense/Purchase decreases bank balance
      UPDATE public.accounts 
      SET balance = balance - NEW.amount 
      WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for balance updates
CREATE TRIGGER update_balance_on_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_account_balance_on_transaction();

-- Trigger to auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();