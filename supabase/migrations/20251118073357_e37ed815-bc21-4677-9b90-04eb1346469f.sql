-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Drop existing policies and create new admin-only policies for workers
DROP POLICY IF EXISTS "Authenticated users can view workers" ON public.workers;
DROP POLICY IF EXISTS "Authenticated users can insert workers" ON public.workers;
DROP POLICY IF EXISTS "Authenticated users can update workers" ON public.workers;
DROP POLICY IF EXISTS "Authenticated users can delete workers" ON public.workers;

CREATE POLICY "Admin users can view workers" ON public.workers
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can insert workers" ON public.workers
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can update workers" ON public.workers
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can delete workers" ON public.workers
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing policies and create new admin-only policies for visits
DROP POLICY IF EXISTS "Authenticated users can view visits" ON public.visits;
DROP POLICY IF EXISTS "Authenticated users can insert visits" ON public.visits;
DROP POLICY IF EXISTS "Authenticated users can update visits" ON public.visits;
DROP POLICY IF EXISTS "Authenticated users can delete visits" ON public.visits;

CREATE POLICY "Admin users can view visits" ON public.visits
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can insert visits" ON public.visits
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can update visits" ON public.visits
FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can delete visits" ON public.visits
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Drop existing policies and create new admin-only policies for visit_workers
DROP POLICY IF EXISTS "Authenticated users can view visit_workers" ON public.visit_workers;
DROP POLICY IF EXISTS "Authenticated users can insert visit_workers" ON public.visit_workers;
DROP POLICY IF EXISTS "Authenticated users can delete visit_workers" ON public.visit_workers;

CREATE POLICY "Admin users can view visit_workers" ON public.visit_workers
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can insert visit_workers" ON public.visit_workers
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin users can delete visit_workers" ON public.visit_workers
FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view user roles
CREATE POLICY "Admin users can view user_roles" ON public.user_roles
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Function to assign admin role to the first user
CREATE OR REPLACE FUNCTION public.assign_admin_to_first_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  -- Count existing users in user_roles
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- If this is the first user, make them admin, otherwise viewer
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign roles on user creation
CREATE TRIGGER assign_admin_role_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_admin_to_first_user();