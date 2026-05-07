ALTER TABLE public.businesses ADD CONSTRAINT IF NOT EXISTS businesses_abn_unique UNIQUE (abn);
