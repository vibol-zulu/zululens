-- Allow admins to delete position analyses
CREATE POLICY "Admins can delete position analyses" 
ON public.user_position_analyses 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));