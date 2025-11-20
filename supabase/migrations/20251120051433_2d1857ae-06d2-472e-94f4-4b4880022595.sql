-- Add UPDATE policy for visit_workers table
CREATE POLICY "Admin users can update visit_workers"
ON public.visit_workers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));