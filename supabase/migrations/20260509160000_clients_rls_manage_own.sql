-- Single policy so owners can SELECT/INSERT/UPDATE/DELETE only their rows (demo + real).
-- Run in dashboard SQL Editor if migrating manually; NOTIFY refreshes PostgREST cache.

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own clients" ON public.clients;
DROP POLICY IF EXISTS "clients_select_own" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_own" ON public.clients;
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_own" ON public.clients;

CREATE POLICY "Users can manage own clients" ON public.clients
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

GRANT ALL ON TABLE public.clients TO service_role;

NOTIFY pgrst, 'reload schema';
