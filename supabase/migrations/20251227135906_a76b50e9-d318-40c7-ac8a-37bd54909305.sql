-- Add edit and delete permission columns to data_permissions
ALTER TABLE public.data_permissions
ADD COLUMN IF NOT EXISTS can_edit_products boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_products boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_transactions boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_transactions boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_accounts boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_accounts boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_bank_accounts boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_bank_accounts boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_categories boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS can_delete_categories boolean NOT NULL DEFAULT false;

-- Update the has_data_permission function to support edit and delete permissions
CREATE OR REPLACE FUNCTION public.has_data_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _permission
    -- View permissions
    WHEN 'view_products' THEN COALESCE((SELECT can_view_products FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'view_transactions' THEN COALESCE((SELECT can_view_transactions FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'view_accounts' THEN COALESCE((SELECT can_view_accounts FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'view_bank_accounts' THEN COALESCE((SELECT can_view_bank_accounts FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'view_stock_movements' THEN COALESCE((SELECT can_view_stock_movements FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'view_categories' THEN COALESCE((SELECT can_view_categories FROM public.data_permissions WHERE user_id = _user_id), true)
    -- Edit permissions
    WHEN 'edit_products' THEN COALESCE((SELECT can_edit_products FROM public.data_permissions WHERE user_id = _user_id), false)
    WHEN 'edit_transactions' THEN COALESCE((SELECT can_edit_transactions FROM public.data_permissions WHERE user_id = _user_id), false)
    WHEN 'edit_accounts' THEN COALESCE((SELECT can_edit_accounts FROM public.data_permissions WHERE user_id = _user_id), false)
    WHEN 'edit_bank_accounts' THEN COALESCE((SELECT can_edit_bank_accounts FROM public.data_permissions WHERE user_id = _user_id), false)
    WHEN 'edit_categories' THEN COALESCE((SELECT can_edit_categories FROM public.data_permissions WHERE user_id = _user_id), false)
    -- Delete permissions
    WHEN 'delete_products' THEN COALESCE((SELECT can_delete_products FROM public.data_permissions WHERE user_id = _user_id), false)
    WHEN 'delete_transactions' THEN COALESCE((SELECT can_delete_transactions FROM public.data_permissions WHERE user_id = _user_id), false)
    WHEN 'delete_accounts' THEN COALESCE((SELECT can_delete_accounts FROM public.data_permissions WHERE user_id = _user_id), false)
    WHEN 'delete_bank_accounts' THEN COALESCE((SELECT can_delete_bank_accounts FROM public.data_permissions WHERE user_id = _user_id), false)
    WHEN 'delete_categories' THEN COALESCE((SELECT can_delete_categories FROM public.data_permissions WHERE user_id = _user_id), false)
    -- Legacy support (products -> view_products)
    WHEN 'products' THEN COALESCE((SELECT can_view_products FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'transactions' THEN COALESCE((SELECT can_view_transactions FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'accounts' THEN COALESCE((SELECT can_view_accounts FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'bank_accounts' THEN COALESCE((SELECT can_view_bank_accounts FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'stock_movements' THEN COALESCE((SELECT can_view_stock_movements FROM public.data_permissions WHERE user_id = _user_id), true)
    WHEN 'categories' THEN COALESCE((SELECT can_view_categories FROM public.data_permissions WHERE user_id = _user_id), true)
    ELSE false
  END
$$;

-- Update UPDATE policies for products
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
CREATE POLICY "Users can update products based on permissions"
ON public.products
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'edit_products')
);

-- Update DELETE policies for products
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Users can delete products based on permissions"
ON public.products
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'delete_products')
);

-- Update UPDATE policies for transactions
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update transactions based on permissions"
ON public.transactions
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'edit_transactions')
);

-- Update DELETE policies for transactions
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
CREATE POLICY "Users can delete transactions based on permissions"
ON public.transactions
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'delete_transactions')
);

-- Update UPDATE policies for accounts
DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update accounts based on permissions"
ON public.accounts
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'edit_accounts')
);

-- Update DELETE policies for accounts
DROP POLICY IF EXISTS "Admins can delete accounts" ON public.accounts;
CREATE POLICY "Users can delete accounts based on permissions"
ON public.accounts
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'delete_accounts')
);

-- Update UPDATE policies for bank_accounts
DROP POLICY IF EXISTS "Users can update own bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can update bank accounts based on permissions"
ON public.bank_accounts
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'edit_bank_accounts')
);

-- Update DELETE policies for bank_accounts
DROP POLICY IF EXISTS "Admins can delete bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can delete bank accounts based on permissions"
ON public.bank_accounts
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'delete_bank_accounts')
);

-- Update UPDATE policies for categories
DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
CREATE POLICY "Users can update categories based on permissions"
ON public.categories
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'edit_categories')
);

-- Update DELETE policies for categories
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Users can delete categories based on permissions"
ON public.categories
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_data_permission(auth.uid(), 'delete_categories')
);