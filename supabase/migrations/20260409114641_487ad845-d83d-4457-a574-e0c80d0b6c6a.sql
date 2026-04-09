
-- Add new columns
ALTER TABLE public.profiles ADD COLUMN first_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN last_name text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN soma_id text;

-- Migrate existing data
UPDATE public.profiles SET 
  first_name = split_part(full_name, ' ', 1),
  last_name = CASE WHEN position(' ' in full_name) > 0 THEN substring(full_name from position(' ' in full_name) + 1) ELSE '' END;

-- Drop removed columns
ALTER TABLE public.profiles DROP COLUMN full_name;
ALTER TABLE public.profiles DROP COLUMN phone;
ALTER TABLE public.profiles DROP COLUMN date_of_birth;
ALTER TABLE public.profiles DROP COLUMN height_cm;
ALTER TABLE public.profiles DROP COLUMN weight_kg;
ALTER TABLE public.profiles DROP COLUMN goal;
ALTER TABLE public.profiles DROP COLUMN start_date;
