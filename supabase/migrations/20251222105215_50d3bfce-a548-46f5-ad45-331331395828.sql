-- Create moderator_requests table
CREATE TABLE public.moderator_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  country text DEFAULT 'United States',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);

-- Enable RLS
ALTER TABLE public.moderator_requests ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit their own moderator requests
CREATE POLICY "Users can insert own moderator requests"
ON public.moderator_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  check_rate_limit(
    auth.uid()::text,
    'moderator_request',
    2,   -- max 2 requests
    1440 -- per 24 hours (in minutes)
  )
);

-- Users can view their own requests
CREATE POLICY "Users can view own moderator requests"
ON public.moderator_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all requests
CREATE POLICY "Admins can view all moderator requests"
ON public.moderator_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests (for approval/rejection)
CREATE POLICY "Admins can update moderator requests"
ON public.moderator_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));