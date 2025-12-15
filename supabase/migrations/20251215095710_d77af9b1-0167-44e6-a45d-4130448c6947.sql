-- Add approval workflow columns to user_channels table
ALTER TABLE public.user_channels 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;

-- Create comments table for Tier 2+ users
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_edited boolean NOT NULL DEFAULT false
);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for comments (Tier 2+ only - must be authenticated)
CREATE POLICY "Authenticated users can view comments"
ON public.comments
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.comments
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can delete any comment"
ON public.comments
FOR DELETE
USING (has_role(auth.uid(), 'moderator'));

-- Update trigger for comments
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS for user_channels to allow moderator approval
CREATE POLICY "Moderators can update channel status"
ON public.user_channels
FOR UPDATE
USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'admin'));