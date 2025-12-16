-- Create news_updates table
CREATE TABLE public.news_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'update',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_published boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.news_updates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view published news"
ON public.news_updates
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can view all news"
ON public.news_updates
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert news"
ON public.news_updates
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update news"
ON public.news_updates
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete news"
ON public.news_updates
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_news_updates_updated_at
BEFORE UPDATE ON public.news_updates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();