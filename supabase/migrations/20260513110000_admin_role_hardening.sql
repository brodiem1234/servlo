-- Admin dashboard access requires profiles.role = 'admin'.
-- Adding that enum value must be paired with write protection: authenticated
-- users can update their own profiles via RLS, so role changes stay service-role only.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    WHERE e.enumtypid = 'public.user_role'::regtype
      AND e.enumlabel = 'admin'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'admin';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_promotion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' THEN
    IF TG_OP = 'INSERT' AND NEW.role <> 'employee' THEN
      RAISE EXCEPTION 'profile role can only be assigned by the service role'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'profile role can only be changed by the service role'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_self_promotion ON public.profiles;

CREATE TRIGGER prevent_profile_role_self_promotion
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_role_self_promotion();
