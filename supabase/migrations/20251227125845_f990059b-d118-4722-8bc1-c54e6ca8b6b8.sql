-- Add parent_id to categories for subcategory support
ALTER TABLE public.categories 
ADD COLUMN parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Add index for parent_id
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);

-- Insert main categories for all users (they'll need to create their own)
-- First update existing categories to be subcategories under new main categories