-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create workers table
CREATE TABLE public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  payment_rate DECIMAL(10,2) NOT NULL, -- Daily or hourly rate
  payment_type TEXT NOT NULL CHECK (payment_type IN ('daily', 'hourly')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for workers
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workers (admin only)
CREATE POLICY "Authenticated users can view workers"
  ON public.workers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert workers"
  ON public.workers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update workers"
  ON public.workers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete workers"
  ON public.workers FOR DELETE
  TO authenticated
  USING (true);

-- Create visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  description TEXT,
  num_workers INTEGER NOT NULL CHECK (num_workers >= 2),
  total_hours DECIMAL(10,2) NOT NULL,
  num_visits DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_time CHECK (end_time > start_time)
);

-- Enable RLS for visits
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visits
CREATE POLICY "Authenticated users can view visits"
  ON public.visits FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert visits"
  ON public.visits FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update visits"
  ON public.visits FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete visits"
  ON public.visits FOR DELETE
  TO authenticated
  USING (true);

-- Create visit_workers junction table (to track which workers were on each visit)
CREATE TABLE public.visit_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(visit_id, worker_id)
);

-- Enable RLS for visit_workers
ALTER TABLE public.visit_workers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visit_workers
CREATE POLICY "Authenticated users can view visit_workers"
  ON public.visit_workers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert visit_workers"
  ON public.visit_workers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete visit_workers"
  ON public.visit_workers FOR DELETE
  TO authenticated
  USING (true);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_workers_updated_at
  BEFORE UPDATE ON public.workers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();