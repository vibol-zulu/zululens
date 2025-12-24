-- Create comment_likes table
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can view likes"
ON public.comment_likes
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can like comments"
ON public.comment_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
ON public.comment_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.comment_likes(user_id);