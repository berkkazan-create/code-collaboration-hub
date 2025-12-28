-- Add tracking number column
ALTER TABLE public.service_records ADD COLUMN IF NOT EXISTS tracking_number TEXT UNIQUE;
ALTER TABLE public.service_records ADD COLUMN IF NOT EXISTS screen_password_type TEXT DEFAULT 'none';

-- Create sequence for tracking number
CREATE SEQUENCE IF NOT EXISTS service_tracking_seq START 1;

-- Create function to generate tracking number
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tracking_number := 'SRV-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || LPAD(nextval('service_tracking_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate tracking number on insert
DROP TRIGGER IF EXISTS set_tracking_number ON public.service_records;
CREATE TRIGGER set_tracking_number
  BEFORE INSERT ON public.service_records
  FOR EACH ROW
  EXECUTE FUNCTION generate_tracking_number();