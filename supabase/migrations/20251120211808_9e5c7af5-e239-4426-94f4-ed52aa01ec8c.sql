-- MIGRACIÓN COMPLETA DEL SISTEMA
-- PASO 1: Eliminar políticas y funciones dependientes
DROP POLICY IF EXISTS "Admin users can view workers" ON public.workers;
DROP POLICY IF EXISTS "Admin users can insert workers" ON public.workers;
DROP POLICY IF EXISTS "Admin users can update workers" ON public.workers;
DROP POLICY IF EXISTS "Admin users can delete workers" ON public.workers;
DROP POLICY IF EXISTS "Admin users can view visits" ON public.visits;
DROP POLICY IF EXISTS "Admin users can insert visits" ON public.visits;
DROP POLICY IF EXISTS "Admin users can update visits" ON public.visits;
DROP POLICY IF EXISTS "Admin users can delete visits" ON public.visits;
DROP POLICY IF EXISTS "Admin users can view visit_workers" ON public.visit_workers;
DROP POLICY IF EXISTS "Admin users can insert visit_workers" ON public.visit_workers;
DROP POLICY IF EXISTS "Admin users can update visit_workers" ON public.visit_workers;
DROP POLICY IF EXISTS "Admin users can delete visit_workers" ON public.visit_workers;
DROP POLICY IF EXISTS "Admin users can view user_roles" ON public.user_roles;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- PASO 2: Limpiar datos existentes
DELETE FROM public.visit_workers;
DELETE FROM public.visits;

-- PASO 3: Actualizar enum de roles
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'worker');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING 
  CASE 
    WHEN role::text = 'viewer' THEN 'worker'::public.app_role
    ELSE role::text::public.app_role
  END;
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'worker'::public.app_role;
DROP TYPE public.app_role_old;

-- PASO 4: Recrear función has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- PASO 5: Agregar campos de gastos adicionales
ALTER TABLE public.visits 
ADD COLUMN IF NOT EXISTS additional_expenses NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS additional_expenses_description TEXT;

-- PASO 6: Reestructurar visit_workers
ALTER TABLE public.visit_workers DROP CONSTRAINT IF EXISTS visit_workers_worker_id_fkey;
DROP TABLE IF EXISTS public.workers CASCADE;
ALTER TABLE public.visit_workers 
ADD CONSTRAINT visit_workers_worker_id_fkey 
FOREIGN KEY (worker_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- PASO 7: Crear políticas RLS
CREATE POLICY "Admins can manage all visits" ON public.visits
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can view their own visits" ON public.visits
FOR SELECT USING (
  public.has_role(auth.uid(), 'worker') AND
  EXISTS (
    SELECT 1 FROM public.visit_workers 
    WHERE visit_id = visits.id AND worker_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all visit_workers" ON public.visit_workers
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Workers can view their own visit_workers" ON public.visit_workers
FOR SELECT USING (
  public.has_role(auth.uid(), 'worker') AND worker_id = auth.uid()
);

CREATE POLICY "Admins can view user_roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- PASO 8: Función para calcular pagos diarios
CREATE OR REPLACE FUNCTION public.calculate_worker_daily_payment(
  _worker_id UUID,
  _start_date DATE,
  _end_date DATE
)
RETURNS TABLE (
  work_date DATE,
  daily_payment NUMERIC,
  visit_count INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(v.start_time) as work_date,
    20000 as daily_payment,
    COUNT(DISTINCT v.id)::INTEGER as visit_count
  FROM public.visits v
  INNER JOIN public.visit_workers vw ON v.id = vw.visit_id
  WHERE vw.worker_id = _worker_id
    AND DATE(v.start_time) BETWEEN _start_date AND _end_date
  GROUP BY DATE(v.start_time)
  ORDER BY work_date DESC
$$;

-- PASO 9: Actualizar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.assign_admin_to_first_user() CASCADE;

CREATE OR REPLACE FUNCTION public.assign_admin_to_first_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'worker');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_to_first_user();