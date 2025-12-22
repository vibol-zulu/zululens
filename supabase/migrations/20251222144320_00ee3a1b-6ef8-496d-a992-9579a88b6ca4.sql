-- Create channel_discoveries staging table
CREATE TABLE public.channel_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'corporate',
  content_type TEXT,
  platform TEXT,
  political_lean TEXT,
  country TEXT NOT NULL,
  website_url TEXT,
  parent_company TEXT,
  headquarters TEXT,
  founding_year INTEGER,
  source_url TEXT,
  discovery_method TEXT NOT NULL DEFAULT 'firecrawl',
  raw_data JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discovered_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channel_discoveries ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX idx_channel_discoveries_status ON public.channel_discoveries(status);
CREATE INDEX idx_channel_discoveries_country ON public.channel_discoveries(country);

-- RLS Policies

-- Contributors, Moderators, and Admins can view all discoveries
CREATE POLICY "Contributors can view discoveries"
ON public.channel_discoveries
FOR SELECT
USING (
  has_role(auth.uid(), 'contributor') OR 
  has_role(auth.uid(), 'moderator') OR 
  has_role(auth.uid(), 'admin')
);

-- Only Moderators and Admins can trigger discoveries (insert)
CREATE POLICY "Moderators and Admins can insert discoveries"
ON public.channel_discoveries
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'moderator') OR 
  has_role(auth.uid(), 'admin')
);

-- Contributors, Moderators, and Admins can update (approve/reject)
CREATE POLICY "Contributors Moderators and Admins can update discoveries"
ON public.channel_discoveries
FOR UPDATE
USING (
  has_role(auth.uid(), 'contributor') OR 
  has_role(auth.uid(), 'moderator') OR 
  has_role(auth.uid(), 'admin')
);

-- Only Admins can delete discoveries
CREATE POLICY "Admins can delete discoveries"
ON public.channel_discoveries
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_channel_discoveries_updated_at
BEFORE UPDATE ON public.channel_discoveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();