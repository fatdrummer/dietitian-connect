
-- Add new meal_type enum values
ALTER TYPE public.meal_type ADD VALUE IF NOT EXISTS 'snack_1';
ALTER TYPE public.meal_type ADD VALUE IF NOT EXISTS 'snack_2';
ALTER TYPE public.meal_type ADD VALUE IF NOT EXISTS 'other';

-- Add meal_date column to meals
ALTER TABLE public.meals ADD COLUMN meal_date date;

-- Rework weekly_goals: rename week_start to start_date, add end_date
ALTER TABLE public.weekly_goals RENAME COLUMN week_start TO start_date;
ALTER TABLE public.weekly_goals ADD COLUMN end_date date;
