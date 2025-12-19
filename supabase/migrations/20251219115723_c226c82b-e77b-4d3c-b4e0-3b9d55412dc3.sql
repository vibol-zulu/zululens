-- Create table to store user political position analyses
CREATE TABLE public.user_position_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_name TEXT,
  visitor_email TEXT,
  country TEXT NOT NULL DEFAULT 'United States',
  position_label TEXT NOT NULL,
  numeric_value NUMERIC NOT NULL,
  diversity_score TEXT NOT NULL,
  diversity_note TEXT,
  selected_channels JSONB NOT NULL DEFAULT '[]',
  suggested_channels JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_position_analyses ENABLE ROW LEVEL SECURITY;

-- Users can view their own analyses
CREATE POLICY "Users can view their own analyses"
ON public.user_position_analyses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert their own analyses"
ON public.user_position_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all analyses
CREATE POLICY "Admins can view all analyses"
ON public.user_position_analyses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_user_position_analyses_user_id ON public.user_position_analyses(user_id);
CREATE INDEX idx_user_position_analyses_created_at ON public.user_position_analyses(created_at DESC);