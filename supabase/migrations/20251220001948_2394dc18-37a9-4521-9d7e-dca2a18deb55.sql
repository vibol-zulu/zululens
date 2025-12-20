-- Create table to store questionnaire responses
CREATE TABLE public.questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_name TEXT,
  visitor_email TEXT,
  country TEXT NOT NULL DEFAULT 'United States',
  questions JSONB NOT NULL DEFAULT '[]',
  answers JSONB NOT NULL DEFAULT '{}',
  original_score NUMERIC NOT NULL,
  refined_score NUMERIC NOT NULL,
  position_label TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view their own responses"
ON public.questionnaire_responses
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert their own responses"
ON public.questionnaire_responses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Visitors can insert responses (no auth required for anonymous users)
CREATE POLICY "Visitors can insert responses"
ON public.questionnaire_responses
FOR INSERT
WITH CHECK (user_id IS NULL AND visitor_email IS NOT NULL);

-- Admins can view all responses
CREATE POLICY "Admins can view all responses"
ON public.questionnaire_responses
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete responses
CREATE POLICY "Admins can delete responses"
ON public.questionnaire_responses
FOR DELETE
USING (has_role(auth.uid(), 'admin'));