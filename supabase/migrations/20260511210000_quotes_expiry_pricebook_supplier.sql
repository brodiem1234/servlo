-- Add expiry_date to quotes (UI already has this field)
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add supplier to pricebook_items (for margin tracking by supplier)
ALTER TABLE public.pricebook_items
  ADD COLUMN IF NOT EXISTS supplier TEXT;
