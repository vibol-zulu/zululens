-- Deny anonymous/public SELECT access to profiles table
CREATE POLICY "deny_public_access" ON public.profiles 
FOR SELECT 
TO anon 
USING (false);