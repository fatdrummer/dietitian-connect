
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('dietitian', 'client');

-- Create meal type enum
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles"
  ON public.user_roles FOR ALL
  USING (true)
  WITH CHECK (true);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  date_of_birth DATE,
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  height_cm NUMERIC,
  weight_kg NUMERIC,
  goal TEXT,
  start_date DATE,
  notes TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  dietitian_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Dietitians can view their clients profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'dietitian') AND dietitian_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- If role metadata is set, create role entry
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, created_by)
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can manage their tags"
  ON public.tags FOR ALL
  USING (public.has_role(auth.uid(), 'dietitian') AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'dietitian') AND created_by = auth.uid());

-- Client tags junction
CREATE TABLE public.client_tags (
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (client_id, tag_id)
);
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dietitians can manage client tags"
  ON public.client_tags FOR ALL
  USING (
    public.has_role(auth.uid(), 'dietitian')
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = client_id AND dietitian_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'dietitian')
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = client_id AND dietitian_id = auth.uid()
    )
  );

-- Weekly goals
CREATE TABLE public.weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  goals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, week_start)
);
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own goals"
  ON public.weekly_goals FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can update their own goals"
  ON public.weekly_goals FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Dietitians can manage their clients goals"
  ON public.weekly_goals FOR ALL
  USING (
    public.has_role(auth.uid(), 'dietitian')
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = client_id AND dietitian_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'dietitian')
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = client_id AND dietitian_id = auth.uid()
    )
  );

-- Meals
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  photo_url TEXT,
  meal_type meal_type NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their own meals"
  ON public.meals FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Dietitians can view their clients meals"
  ON public.meals FOR SELECT
  USING (
    public.has_role(auth.uid(), 'dietitian')
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = client_id AND dietitian_id = auth.uid()
    )
  );

-- Meal comments
CREATE TABLE public.meal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors and related users can view comments"
  ON public.meal_comments FOR SELECT
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.meals m WHERE m.id = meal_id AND m.client_id = auth.uid()
    )
    OR (
      public.has_role(auth.uid(), 'dietitian')
      AND EXISTS (
        SELECT 1 FROM public.meals m
        JOIN public.profiles p ON p.id = m.client_id
        WHERE m.id = meal_id AND p.dietitian_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can create comments"
  ON public.meal_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Reflections
CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  meal_id UUID REFERENCES public.meals(id) ON DELETE SET NULL,
  hunger_rating INTEGER NOT NULL CHECK (hunger_rating BETWEEN 1 AND 5),
  cravings_rating INTEGER NOT NULL CHECK (cravings_rating BETWEEN 1 AND 5),
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can manage their own reflections"
  ON public.reflections FOR ALL
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Dietitians can view their clients reflections"
  ON public.reflections FOR SELECT
  USING (
    public.has_role(auth.uid(), 'dietitian')
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = client_id AND dietitian_id = auth.uid()
    )
  );

-- Reflection replies
CREATE TABLE public.reflection_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id UUID REFERENCES public.reflections(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reflection_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors and related users can view replies"
  ON public.reflection_replies FOR SELECT
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM public.reflections r WHERE r.id = reflection_id AND r.client_id = auth.uid()
    )
    OR (
      public.has_role(auth.uid(), 'dietitian')
      AND EXISTS (
        SELECT 1 FROM public.reflections r
        JOIN public.profiles p ON p.id = r.client_id
        WHERE r.id = reflection_id AND p.dietitian_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can create replies"
  ON public.reflection_replies FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_goals_updated_at
  BEFORE UPDATE ON public.weekly_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Meal photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);

CREATE POLICY "Anyone can view meal photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meal-photos');

CREATE POLICY "Authenticated users can upload meal photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meal-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own meal photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own meal photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
