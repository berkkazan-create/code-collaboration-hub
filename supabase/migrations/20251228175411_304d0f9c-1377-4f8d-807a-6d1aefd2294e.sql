-- Create QC check items table (managed by admins)
CREATE TABLE public.qc_check_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'genel',
  check_type TEXT NOT NULL DEFAULT 'entry', -- 'entry', 'exit', 'both'
  is_required BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create QC results table (stores check results for each service record)
CREATE TABLE public.qc_check_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_record_id UUID NOT NULL REFERENCES public.service_records(id) ON DELETE CASCADE,
  qc_check_item_id UUID NOT NULL REFERENCES public.qc_check_items(id) ON DELETE CASCADE,
  check_stage TEXT NOT NULL, -- 'entry' or 'exit'
  passed BOOLEAN,
  notes TEXT,
  checked_by TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(service_record_id, qc_check_item_id, check_stage)
);

-- Enable RLS
ALTER TABLE public.qc_check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_check_results ENABLE ROW LEVEL SECURITY;

-- QC Check Items policies (only admins can manage, all authenticated can view)
CREATE POLICY "Anyone can view active QC check items"
ON public.qc_check_items
FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert QC check items"
ON public.qc_check_items
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update QC check items"
ON public.qc_check_items
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete QC check items"
ON public.qc_check_items
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- QC Check Results policies
CREATE POLICY "Users can view QC results based on permissions"
ON public.qc_check_results
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_data_permission(auth.uid(), 'products'::text));

CREATE POLICY "Users can insert QC results"
ON public.qc_check_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own QC results"
ON public.qc_check_results
FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_qc_check_items_updated_at
  BEFORE UPDATE ON public.qc_check_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default QC check items
INSERT INTO public.qc_check_items (name, description, category, check_type, display_order) VALUES
('Ekran Kontrolü', 'Ekranda kırık, çatlak veya dead pixel var mı?', 'görsel', 'both', 1),
('Dokunmatik Test', 'Dokunmatik ekran tüm alanlarda çalışıyor mu?', 'fonksiyonel', 'both', 2),
('Hoparlör Testi', 'Hoparlör ve mikrofon çalışıyor mu?', 'fonksiyonel', 'both', 3),
('Kamera Testi', 'Ön ve arka kamera çalışıyor mu?', 'fonksiyonel', 'both', 4),
('Şarj Portu', 'Şarj girişi çalışıyor mu?', 'fonksiyonel', 'both', 5),
('Pil Durumu', 'Pil şişmesi veya anormal ısınma var mı?', 'güvenlik', 'both', 6),
('WiFi/Bluetooth', 'Kablosuz bağlantılar çalışıyor mu?', 'fonksiyonel', 'exit', 7),
('Sensör Testi', 'Yakınlık, ışık ve diğer sensörler çalışıyor mu?', 'fonksiyonel', 'exit', 8),
('Tuş Kontrolü', 'Fiziksel tuşlar çalışıyor mu?', 'fonksiyonel', 'both', 9),
('Su Hasarı', 'Su hasar indikatörü tetiklenmiş mi?', 'güvenlik', 'entry', 10);