-- Allow users to update notifications targeted at them
CREATE POLICY "Users can update own targeted notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = target_user_id);

-- Allow users to delete notifications targeted at them
CREATE POLICY "Users can delete own targeted notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = target_user_id);

-- Allow users to update notifications they created
CREATE POLICY "Users can update notifications they created"
ON public.notifications
FOR UPDATE
USING (auth.uid() = created_by);

-- Allow users to delete notifications they created
CREATE POLICY "Users can delete notifications they created"
ON public.notifications
FOR DELETE
USING (auth.uid() = created_by);