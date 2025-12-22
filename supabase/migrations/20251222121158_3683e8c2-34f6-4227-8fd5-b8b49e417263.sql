-- Drop the existing rate limit policy
DROP POLICY IF EXISTS "Rate limited channel insertion" ON public.user_channels;

-- Create new policy that bypasses rate limit for admins and moderators
CREATE POLICY "Rate limited channel insertion" 
ON public.user_channels 
FOR INSERT 
WITH CHECK (
  -- Admins and moderators bypass rate limiting
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'moderator'::app_role)
  -- Regular users are rate limited to 5 per 10 minutes
  OR check_rate_limit(COALESCE((auth.uid())::text, 'anonymous'::text), 'channel_insert'::text, 5, 10)
);