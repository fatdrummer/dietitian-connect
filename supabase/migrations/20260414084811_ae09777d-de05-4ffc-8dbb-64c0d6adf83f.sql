
-- Drop unique constraint preventing duplicate start dates per client
ALTER TABLE public.weekly_goals DROP CONSTRAINT IF EXISTS weekly_goals_client_id_week_start_key;

-- Add next_appointment column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_appointment date;

-- Allow dietitians to update their clients' profiles (for next_appointment)
CREATE POLICY "Dietitians can update their clients profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'dietitian'::app_role) AND dietitian_id = auth.uid());
