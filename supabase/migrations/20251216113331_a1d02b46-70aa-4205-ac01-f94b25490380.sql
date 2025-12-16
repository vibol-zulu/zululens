-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view published news" ON public.news_updates;

CREATE POLICY "Anyone can view published news" 
ON public.news_updates 
FOR SELECT 
TO public
USING (is_published = true);