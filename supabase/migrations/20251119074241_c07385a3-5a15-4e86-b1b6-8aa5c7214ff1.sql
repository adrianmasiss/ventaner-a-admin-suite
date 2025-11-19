-- Add billing management columns to visits table
ALTER TABLE public.visits 
ADD COLUMN billing_status text NOT NULL DEFAULT 'pending',
ADD COLUMN billing_date timestamp with time zone,
ADD COLUMN invoice_reference text;

-- Add payment management columns to visit_workers table
ALTER TABLE public.visit_workers
ADD COLUMN amount numeric NOT NULL DEFAULT 20000,
ADD COLUMN payment_status text NOT NULL DEFAULT 'pending',
ADD COLUMN payment_date timestamp with time zone,
ADD COLUMN payment_method text;

-- Create index for better query performance
CREATE INDEX idx_visits_billing_status ON public.visits(billing_status);
CREATE INDEX idx_visit_workers_payment_status ON public.visit_workers(payment_status);

-- Add check constraints for valid status values
ALTER TABLE public.visits
ADD CONSTRAINT valid_billing_status CHECK (billing_status IN ('pending', 'invoiced', 'collected'));

ALTER TABLE public.visit_workers
ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid'));