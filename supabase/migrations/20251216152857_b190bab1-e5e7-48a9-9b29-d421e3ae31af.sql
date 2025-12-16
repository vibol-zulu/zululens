-- Add target_user_id column for user-specific notifications
ALTER TABLE public.notifications 
ADD COLUMN target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_notifications_target_user_id ON public.notifications(target_user_id);

-- Add RLS policy for users to view notifications targeted at them
CREATE POLICY "Users can view notifications targeted at them" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = target_user_id);