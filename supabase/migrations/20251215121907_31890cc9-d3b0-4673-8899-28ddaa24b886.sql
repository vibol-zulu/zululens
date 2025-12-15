-- Create table to store Tier 1 visitors (signup gate submissions)
CREATE TABLE public.tier1_visitors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  country text NOT NULL DEFAULT 'United States',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_visit_at timestamp with time zone NOT NULL DEFAULT now(),
  total_visits integer NOT NULL DEFAULT 1,
  total_time_seconds integer NOT NULL DEFAULT 0
);

-- Create table to store user analytics events
CREATE TABLE public.user_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id uuid REFERENCES public.tier1_visitors(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  event_type text NOT NULL, -- 'page_view', 'channel_select', 'view_mode_change', 'year_toggle', 'country_change'
  event_data jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_or_visitor CHECK (visitor_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Create table for session summaries
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id uuid REFERENCES public.tier1_visitors(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer DEFAULT 0,
  page_views integer DEFAULT 0,
  interactions integer DEFAULT 0,
  country text NOT NULL DEFAULT 'United States',
  CONSTRAINT session_user_or_visitor CHECK (visitor_id IS NOT NULL OR user_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.tier1_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Tier 1 visitors: anyone can insert (signup gate), admins can view
CREATE POLICY "Anyone can create tier1 visitors"
ON public.tier1_visitors FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view tier1 visitors"
ON public.tier1_visitors FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Update last visit on existing visitor"
ON public.tier1_visitors FOR UPDATE
USING (true);

-- User analytics: anyone can insert events, admins can view
CREATE POLICY "Anyone can insert analytics"
ON public.user_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view analytics"
ON public.user_analytics FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- User sessions: anyone can insert/update, admins can view
CREATE POLICY "Anyone can create sessions"
ON public.user_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
ON public.user_sessions FOR UPDATE
USING (true);

CREATE POLICY "Admins can view sessions"
ON public.user_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_user_analytics_visitor ON public.user_analytics(visitor_id);
CREATE INDEX idx_user_analytics_user ON public.user_analytics(user_id);
CREATE INDEX idx_user_analytics_session ON public.user_analytics(session_id);
CREATE INDEX idx_user_analytics_event_type ON public.user_analytics(event_type);
CREATE INDEX idx_user_sessions_visitor ON public.user_sessions(visitor_id);
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);