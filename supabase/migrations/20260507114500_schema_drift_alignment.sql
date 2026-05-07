-- Consolidate schema drift so application code can use a single query shape.
-- Safe to run repeatedly.

-- ---------------------------------------------------------------------------
-- businesses: canonical owner identity + workspace config/profile fields
-- ---------------------------------------------------------------------------
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS feature_flags jsonb NOT NULL DEFAULT '{"enabled":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS address text;

UPDATE public.businesses
SET owner_id = COALESCE(owner_id, user_id),
    user_id = COALESCE(user_id, owner_id)
WHERE owner_id IS NULL OR user_id IS NULL OR owner_id <> user_id;

CREATE UNIQUE INDEX IF NOT EXISTS businesses_owner_id_key ON public.businesses (owner_id);

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_owner_user_match;
ALTER TABLE public.businesses
  ADD CONSTRAINT businesses_owner_user_match CHECK (owner_id = user_id);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business" ON public.businesses;
DROP POLICY IF EXISTS "Users can update own business" ON public.businesses;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.businesses;
DROP POLICY IF EXISTS businesses_owner_select ON public.businesses;
DROP POLICY IF EXISTS businesses_owner_insert ON public.businesses;
DROP POLICY IF EXISTS businesses_owner_update ON public.businesses;

CREATE POLICY businesses_owner_select ON public.businesses
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY businesses_owner_insert ON public.businesses
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND user_id = auth.uid());

CREATE POLICY businesses_owner_update ON public.businesses
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- profiles: fields used by owner dashboard/settings/signup flow
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS industry_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS industry_other_note text,
  ADD COLUMN IF NOT EXISTS email_digest_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS trial_end_date timestamptz;

-- ---------------------------------------------------------------------------
-- clients/jobs/invoices/quotes/timesheets columns expected by owner UI
-- ---------------------------------------------------------------------------
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS client_type text NOT NULL DEFAULT 'customer';

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_client_type_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_client_type_check CHECK (client_type IN ('customer', 'supplier', 'lead'));

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS amount numeric,
  ADD COLUMN IF NOT EXISTS gst_amount numeric;

UPDATE public.invoices
SET amount = COALESCE(amount, total, subtotal, 0),
    gst_amount = COALESCE(gst_amount, gst, 0)
WHERE amount IS NULL OR gst_amount IS NULL;

ALTER TABLE public.invoices
  ALTER COLUMN amount SET DEFAULT 0,
  ALTER COLUMN gst_amount SET DEFAULT 0;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS gst_amount numeric,
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

UPDATE public.quotes q
SET client_name = COALESCE(q.client_name, c.full_name),
    gst_amount = COALESCE(q.gst_amount, q.gst, 0)
FROM public.clients c
WHERE q.client_id = c.id
  AND (q.client_name IS NULL OR q.gst_amount IS NULL);

-- ---------------------------------------------------------------------------
-- owner feature tables: purchase orders + owner tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.owner_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.owner_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_tasks_select ON public.owner_tasks;
DROP POLICY IF EXISTS owner_tasks_insert ON public.owner_tasks;
DROP POLICY IF EXISTS owner_tasks_update ON public.owner_tasks;
DROP POLICY IF EXISTS owner_tasks_delete ON public.owner_tasks;
CREATE POLICY owner_tasks_select ON public.owner_tasks FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY owner_tasks_insert ON public.owner_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY owner_tasks_update ON public.owner_tasks FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY owner_tasks_delete ON public.owner_tasks FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  po_number text NOT NULL,
  supplier_client_id uuid REFERENCES public.clients (id) ON DELETE SET NULL,
  job_id uuid REFERENCES public.jobs (id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft',
  total numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, po_number),
  CONSTRAINT purchase_orders_status_check CHECK (status IN ('draft', 'sent', 'received', 'billed'))
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders (id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS po_select ON public.purchase_orders;
DROP POLICY IF EXISTS po_all ON public.purchase_orders;
DROP POLICY IF EXISTS po_owner_select ON public.purchase_orders;
DROP POLICY IF EXISTS po_owner_insert ON public.purchase_orders;
DROP POLICY IF EXISTS po_owner_update ON public.purchase_orders;
DROP POLICY IF EXISTS po_owner_delete ON public.purchase_orders;

CREATE POLICY po_owner_select ON public.purchase_orders
  FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY po_owner_insert ON public.purchase_orders
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY po_owner_update ON public.purchase_orders
  FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY po_owner_delete ON public.purchase_orders
  FOR DELETE TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS poi_all ON public.purchase_order_items;
DROP POLICY IF EXISTS poi_owner_select ON public.purchase_order_items;
DROP POLICY IF EXISTS poi_owner_insert ON public.purchase_order_items;
DROP POLICY IF EXISTS poi_owner_update ON public.purchase_order_items;
DROP POLICY IF EXISTS poi_owner_delete ON public.purchase_order_items;

CREATE POLICY poi_owner_select ON public.purchase_order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders p
      WHERE p.id = purchase_order_items.purchase_order_id
        AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY poi_owner_insert ON public.purchase_order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders p
      WHERE p.id = purchase_order_items.purchase_order_id
        AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY poi_owner_update ON public.purchase_order_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders p
      WHERE p.id = purchase_order_items.purchase_order_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.purchase_orders p
      WHERE p.id = purchase_order_items.purchase_order_id
        AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY poi_owner_delete ON public.purchase_order_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders p
      WHERE p.id = purchase_order_items.purchase_order_id
        AND p.owner_id = auth.uid()
    )
  );

GRANT ALL ON TABLE public.businesses TO service_role;
GRANT ALL ON TABLE public.owner_tasks TO service_role;
GRANT ALL ON TABLE public.purchase_orders TO service_role;
GRANT ALL ON TABLE public.purchase_order_items TO service_role;

NOTIFY pgrst, 'reload schema';
