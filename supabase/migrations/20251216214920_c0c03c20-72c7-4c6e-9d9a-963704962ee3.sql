-- Drop the overly permissive policy that exposes all profile data including emails
DROP POLICY IF EXISTS "Authenticated users can view profiles for comments" ON public.profiles;

-- Create a security definer function to get only public profile info (name, not email)
CREATE OR REPLACE FUNCTION public.get_profile_display_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(full_name, 'Anonymous')
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Create a function to get multiple profile names at once (for batch loading comments)
CREATE OR REPLACE FUNCTION public.get_profiles_by_ids(_user_ids uuid[])
RETURNS TABLE(id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, COALESCE(p.full_name, 'Anonymous') as full_name
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids)
$$;