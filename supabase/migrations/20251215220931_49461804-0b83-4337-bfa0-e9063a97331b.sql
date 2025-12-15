-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can update user channels" ON public.user_channels;
DROP POLICY IF EXISTS "Anyone can delete user channels" ON public.user_channels;

-- Add proper role-based UPDATE policy (moderators and admins can update)
CREATE POLICY "Moderators and admins can update channels"
ON public.user_channels
FOR UPDATE
USING (
  has_role(auth.uid(), 'moderator'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add proper role-based DELETE policy (only admins can delete)
CREATE POLICY "Admins can delete channels"
ON public.user_channels
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow authors to update their own pending channels
CREATE POLICY "Authors can update own pending channels"
ON public.user_channels
FOR UPDATE
USING (auth.uid() = author_id AND status = 'pending');