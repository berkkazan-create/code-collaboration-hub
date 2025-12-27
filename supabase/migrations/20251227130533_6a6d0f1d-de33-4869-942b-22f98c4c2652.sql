-- Create data permissions table for controlling which data non-admin users can see
CREATE TABLE public.data_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  can_view_products boolean NOT NULL DEFAULT true,
  can_view_transactions boolean NOT NULL DEFAULT true,
  can_view_accounts boolean NOT NULL DEFAULT true,
  can_view_bank_accounts boolean NOT NULL DEFAULT true,
  can_view_stock_movements boolean NOT NULL DEFAULT true,
  can_view_categories boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.data_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own permissions"
ON public.data_permissions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions"
ON public.data_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_data_permissions_updated_at
BEFORE UPDATE ON public.data_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default Elektronik and Yedek Parça categories for all existing users
-- Note: These will be inserted when a user first accesses the categories