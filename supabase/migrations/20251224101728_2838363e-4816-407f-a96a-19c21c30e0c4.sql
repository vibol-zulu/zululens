-- Create table to store channel submission analysis reports
CREATE TABLE public.channel_analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL,
  channel_name TEXT NOT NULL,
  country TEXT NOT NULL,
  analyzed_by UUID NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Input data
  submitted_category TEXT,
  submitted_platform TEXT,
  submitted_content_type TEXT,
  
  -- AI Analysis results
  cross_platform_audience NUMERIC,
  deduplicated_audience NUMERIC,
  political_lean TEXT,
  political_lean_justification TEXT,
  suggested_start_date TEXT,
  
  -- Validation results
  input_validation JSONB DEFAULT '{}'::jsonb,
  
  -- Comparable channels data
  comparable_channels JSONB DEFAULT '[]'::jsonb,
  
  -- Platform breakdowns
  platform_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- Full raw response for reference
  raw_analysis JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  was_applied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channel_analysis_reports ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view all analysis reports"
ON public.channel_analysis_reports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can view all analysis reports"
ON public.channel_analysis_reports
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can insert analysis reports"
ON public.channel_analysis_reports
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can insert analysis reports"
ON public.channel_analysis_reports
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Admins can update analysis reports"
ON public.channel_analysis_reports
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can update analysis reports"
ON public.channel_analysis_reports
FOR UPDATE
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Index for faster lookups
CREATE INDEX idx_channel_analysis_reports_channel_id ON public.channel_analysis_reports(channel_id);
CREATE INDEX idx_channel_analysis_reports_analyzed_at ON public.channel_analysis_reports(analyzed_at DESC);