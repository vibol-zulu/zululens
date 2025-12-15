-- Fix 1: Update has_role function to prevent role enumeration
-- Users can only check their own roles unless they are admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow RLS policy checks (when auth.uid() is NULL during policy evaluation)
  -- or when user is checking their own role
  IF auth.uid() IS NULL OR auth.uid() = _user_id THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    );
  END IF;
  
  -- Allow admins to check any user's role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    );
  END IF;
  
  -- Non-admins cannot check other users' roles
  RETURN false;
END;
$$;

-- Fix 2: Create rate limiting infrastructure
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT date_trunc('minute', now()),
  count integer NOT NULL DEFAULT 1,
  UNIQUE(identifier, action, window_start)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only internal function access (SECURITY DEFINER functions)
CREATE POLICY "No direct access to rate_limits"
ON public.rate_limits
FOR ALL
USING (false);

-- Create rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action text,
  _max_requests integer,
  _window_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count integer;
  _window_start timestamptz;
BEGIN
  _window_start := date_trunc('minute', now());
  
  -- Clean old entries (older than 1 hour)
  DELETE FROM rate_limits 
  WHERE window_start < now() - interval '1 hour';
  
  -- Get current count for this window
  SELECT COALESCE(SUM(count), 0) INTO _current_count
  FROM rate_limits
  WHERE identifier = _identifier
    AND action = _action
    AND window_start > now() - make_interval(mins => _window_minutes);
  
  -- Check if rate limit exceeded
  IF _current_count >= _max_requests THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  INSERT INTO rate_limits (identifier, action, window_start, count)
  VALUES (_identifier, _action, _window_start, 1)
  ON CONFLICT (identifier, action, window_start)
  DO UPDATE SET count = rate_limits.count + 1;
  
  RETURN true;
END;
$$;

-- Update RLS policies for rate limiting

-- Comments: Drop old INSERT policy and create new one with rate limiting
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Rate limited comment insertion"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  check_rate_limit(
    auth.uid()::text,
    'comment_insert',
    10,  -- max 10 comments
    5    -- per 5 minutes
  )
);

-- Contributor requests: Drop old INSERT policy and create new one with rate limiting
DROP POLICY IF EXISTS "Anyone can submit contributor requests" ON public.contributor_requests;
CREATE POLICY "Rate limited contributor request insertion"
ON public.contributor_requests
FOR INSERT
WITH CHECK (
  check_rate_limit(
    COALESCE(email, 'anonymous'),
    'contributor_request',
    3,   -- max 3 requests
    60   -- per 60 minutes
  )
);

-- User channels: Drop old INSERT policy and create new one with rate limiting
DROP POLICY IF EXISTS "Anyone can add user channels" ON public.user_channels;
CREATE POLICY "Rate limited channel insertion"
ON public.user_channels
FOR INSERT
WITH CHECK (
  check_rate_limit(
    COALESCE(auth.uid()::text, 'anonymous'),
    'channel_insert',
    5,   -- max 5 channels
    10   -- per 10 minutes
  )
);

-- User analytics: Drop old INSERT policy and create new one with rate limiting
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.user_analytics;
CREATE POLICY "Rate limited analytics insertion"
ON public.user_analytics
FOR INSERT
WITH CHECK (
  check_rate_limit(
    session_id,
    'analytics_insert',
    100,  -- max 100 events
    1     -- per 1 minute
  )
);