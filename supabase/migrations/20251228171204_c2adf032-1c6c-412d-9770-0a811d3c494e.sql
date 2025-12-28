-- Create service status enum
CREATE TYPE public.service_status AS ENUM (
  'pending_qc_entry',      -- Giriş kalite kontrolü bekliyor
  'qc_entry_approved',     -- Giriş kalite kontrolü onaylandı
  'assigned_technician',   -- Teknisyene atandı
  'waiting_price_approval', -- Fiyat onayı bekleniyor
  'repair_in_progress',    -- Tamir devam ediyor
  'pending_qc_exit',       -- Çıkış kalite kontrolü bekliyor
  'qc_exit_approved',      -- Çıkış kalite kontrolü onaylandı
  'completed',             -- Tamamlandı
  'delivered',             -- Teslim edildi
  'cancelled'              -- İptal edildi
);

-- Create warranty status enum
CREATE TYPE public.warranty_type AS ENUM (
  'none',                  -- Garanti yok
  'labor',                 -- İşçilik garantisi
  'parts',                 -- Parça garantisi
  'full'                   -- Tam garanti
);

-- Create service_records table
CREATE TABLE public.service_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Device info
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  device_serial TEXT,
  device_imei TEXT,
  device_color TEXT,
  
  -- Condition on entry
  screen_password TEXT,
  has_scratches BOOLEAN DEFAULT false,
  scratch_locations TEXT,
  physical_condition TEXT,
  accessories_received TEXT,
  entry_notes TEXT,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  
  -- Issue & repair
  reported_issue TEXT NOT NULL,
  diagnosis TEXT,
  repair_description TEXT,
  parts_used TEXT,
  
  -- Pricing
  estimated_cost NUMERIC DEFAULT 0,
  final_cost NUMERIC DEFAULT 0,
  price_approved BOOLEAN DEFAULT false,
  price_approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Status & workflow
  status service_status DEFAULT 'pending_qc_entry',
  assigned_technician_id UUID,
  assigned_technician_name TEXT,
  qc_entry_by TEXT,
  qc_entry_notes TEXT,
  qc_entry_at TIMESTAMP WITH TIME ZONE,
  qc_exit_by TEXT,
  qc_exit_notes TEXT,
  qc_exit_at TIMESTAMP WITH TIME ZONE,
  
  -- Warranty
  has_warranty BOOLEAN DEFAULT false,
  warranty_type warranty_type DEFAULT 'none',
  warranty_duration_days INTEGER DEFAULT 0,
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_terms TEXT,
  warranty_parts TEXT,
  
  -- Timestamps
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_attachments table for photos/videos
CREATE TABLE public.service_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_record_id UUID NOT NULL REFERENCES public.service_records(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image' or 'video'
  file_size INTEGER,
  description TEXT,
  attachment_stage TEXT DEFAULT 'entry', -- 'entry', 'repair', 'exit'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_history table for status change logs
CREATE TABLE public.service_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_record_id UUID NOT NULL REFERENCES public.service_records(id) ON DELETE CASCADE,
  previous_status service_status,
  new_status service_status NOT NULL,
  changed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_records
CREATE POLICY "Users can insert own service records" 
ON public.service_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view service records based on permissions" 
ON public.service_records FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'products'::text));

CREATE POLICY "Users can update service records based on permissions" 
ON public.service_records FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'edit_products'::text));

CREATE POLICY "Users can delete service records based on permissions" 
ON public.service_records FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'delete_products'::text));

-- RLS Policies for service_attachments
CREATE POLICY "Users can insert own attachments" 
ON public.service_attachments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view attachments based on permissions" 
ON public.service_attachments FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'products'::text));

CREATE POLICY "Users can delete own attachments" 
ON public.service_attachments FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for service_history
CREATE POLICY "Users can insert own history" 
ON public.service_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view history based on permissions" 
ON public.service_history FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'products'::text));

-- Create trigger for updated_at
CREATE TRIGGER update_service_records_updated_at
BEFORE UPDATE ON public.service_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for service attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('service-attachments', 'service-attachments', true, 52428800);

-- Storage policies
CREATE POLICY "Users can upload service attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'service-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-attachments');

CREATE POLICY "Users can delete own service attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'service-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);