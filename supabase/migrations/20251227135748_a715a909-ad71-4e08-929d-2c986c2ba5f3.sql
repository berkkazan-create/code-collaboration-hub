-- Create a security definer function to check data permissions
CREATE OR REPLACE FUNCTION public.has_data_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _permission
    WHEN 'products' THEN COALESCE((SELECT can_view_products FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'transactions' THEN COALESCE((SELECT can_view_transactions FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'accounts' THEN COALESCE((SELECT can_view_accounts FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'bank_accounts' THEN COALESCE((SELECT can_view_bank_accounts FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'stock_movements' THEN COALESCE((SELECT can_view_stock_movements FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'categories' THEN COALESCE((SELECT can_view_categories FROM public.data_permissions WHERE user_id = _user_id), true)
    ELSE false
  END
$$;

-- Drop existing SELECT policies and create new ones that check permissions

-- Products: Admins see all, users with permission see all
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view products based on permissions"
ON public.products
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'products')
);

-- Transactions: Admins see all, users with permission see all
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view transactions based on permissions"
ON public.transactions
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'transactions')
);

-- Accounts: Admins see all, users with permission see all
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
CREATE POLICY "Users can view accounts based on permissions"
ON public.accounts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'accounts')
);

-- Bank Accounts: Admins see all, users with permission see all
DROP POLICY IF EXISTS "Users can view own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can view bank accounts based on permissions"
ON public.bank_accounts
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'bank_accounts')
);

-- Stock Movements: Admins see all, users with permission see all
DROP POLICY IF EXISTS "Users can view own stock movements" ON public.stock_movements;
CREATE POLICY "Users can view stock movements based on permissions"
ON public.stock_movements
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'stock_movements')
);

-- Categories: Admins see all, users with permission see all
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
CREATE POLICY "Users can view categories based on permissions"
ON public.categories
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'categories')
);