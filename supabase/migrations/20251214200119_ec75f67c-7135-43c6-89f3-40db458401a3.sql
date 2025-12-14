-- Allow anyone to update and delete channels (for admin functionality)
CREATE POLICY "Anyone can update user channels" 
ON public.user_channels 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete user channels" 
ON public.user_channels 
FOR DELETE 
USING (true);