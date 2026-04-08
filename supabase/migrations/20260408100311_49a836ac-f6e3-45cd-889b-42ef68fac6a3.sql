
-- Drop the overly permissive policies
DROP POLICY "Service role can manage roles" ON public.user_roles;
DROP POLICY "Service role can insert profiles" ON public.profiles;

-- user_roles: only allow inserting your own role (trigger uses SECURITY DEFINER so bypasses RLS)
CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- profiles: only allow inserting your own profile (trigger uses SECURITY DEFINER so bypasses RLS)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
