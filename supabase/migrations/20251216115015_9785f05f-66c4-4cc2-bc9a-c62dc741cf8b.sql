-- Allow authenticated users to view profiles for displaying names in comments
CREATE POLICY "Authenticated users can view profiles for comments"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);