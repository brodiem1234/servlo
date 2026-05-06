-- Client segmentation (Customers / Suppliers / Leads)
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS client_type text NOT NULL DEFAULT 'customer';

ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_client_type_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_client_type_check
  CHECK (client_type IN ('customer', 'supplier', 'lead'));

-- Owner sidebar todos / quick tasks
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
CREATE POLICY owner_tasks_select ON public.owner_tasks FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS owner_tasks_insert ON public.owner_tasks;
CREATE POLICY owner_tasks_insert ON public.owner_tasks FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS owner_tasks_update ON public.owner_tasks;
CREATE POLICY owner_tasks_update ON public.owner_tasks FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS owner_tasks_delete ON public.owner_tasks;
CREATE POLICY owner_tasks_delete ON public.owner_tasks FOR DELETE USING (auth.uid() = owner_id);

-- Daily digest preference (profiles row exists per user)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_digest_enabled boolean NOT NULL DEFAULT true;

-- Simple weekly timesheet grid entries (employee-linked)
CREATE TABLE IF NOT EXISTS public.timesheet_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees (id) ON DELETE CASCADE,
  work_date date NOT NULL,
  hours numeric NOT NULL DEFAULT 0 CHECK (hours >= 0 AND hours <= 24),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, work_date)
);

ALTER TABLE public.timesheet_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS timesheet_select_owner ON public.timesheet_entries;
DROP POLICY IF EXISTS timesheet_all_owner ON public.timesheet_entries;
DROP POLICY IF EXISTS timesheet_select_employee ON public.timesheet_entries;

CREATE POLICY timesheet_all_owner ON public.timesheet_entries FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY timesheet_select_employee ON public.timesheet_entries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = employee_id
      AND lower(trim(coalesce(e.email, ''))) = lower(trim(coalesce((auth.jwt() ->> 'email')::text, '')))
  )
);

-- Purchase orders
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
  CONSTRAINT purchase_orders_status_check CHECK (
    status IN ('draft', 'sent', 'received', 'billed')
  )
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
CREATE POLICY po_select ON public.purchase_orders FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS po_all ON public.purchase_orders;
CREATE POLICY po_all ON public.purchase_orders FOR ALL USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS poi_all ON public.purchase_order_items;
CREATE POLICY poi_all ON public.purchase_order_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.purchase_orders p
    WHERE p.id = purchase_order_id AND p.owner_id = auth.uid()
  )
);
