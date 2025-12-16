-- Allow moderators to update news
CREATE POLICY "Moderators can update news" 
ON public.news_updates 
FOR UPDATE 
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Allow moderators to delete news
CREATE POLICY "Moderators can delete news" 
ON public.news_updates 
FOR DELETE 
USING (has_role(auth.uid(), 'moderator'::app_role));