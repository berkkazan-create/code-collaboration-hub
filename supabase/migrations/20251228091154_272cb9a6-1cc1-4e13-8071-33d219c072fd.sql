-- IMEI/Seri numarası takibi için tablo
CREATE TABLE public.product_serials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  serial_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_stock', -- in_stock, sold, returned
  purchase_price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_to_account_id UUID REFERENCES public.accounts(id),
  transaction_id UUID REFERENCES public.transactions(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_serials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own serials"
ON public.product_serials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view serials based on permissions"
ON public.product_serials
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'products'::text));

CREATE POLICY "Users can update serials based on permissions"
ON public.product_serials
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'edit_products'::text));

CREATE POLICY "Users can delete serials based on permissions"
ON public.product_serials
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'delete_products'::text));

-- Updated at trigger
CREATE TRIGGER update_product_serials_updated_at
BEFORE UPDATE ON public.product_serials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Unique constraint for serial numbers per user
CREATE UNIQUE INDEX idx_product_serials_unique ON public.product_serials(user_id, serial_number);

-- Categories tablosuna IMEI zorunluluğu için alan ekle
ALTER TABLE public.categories ADD COLUMN requires_serial BOOLEAN DEFAULT false;