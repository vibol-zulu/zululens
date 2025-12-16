-- Create table for tracking contributor engagement metrics
CREATE TABLE public.contributor_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_suggestions INTEGER NOT NULL DEFAULT 0,
  approved_suggestions INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  total_interactions INTEGER NOT NULL DEFAULT 0,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contributor_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for contributor_metrics
CREATE POLICY "Users can view their own metrics"
ON public.contributor_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all metrics"
ON public.contributor_metrics
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can view all metrics"
ON public.contributor_metrics
FOR SELECT
USING (has_role(auth.uid(), 'moderator'));

CREATE POLICY "System can insert metrics"
ON public.contributor_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update own metrics"
ON public.contributor_metrics
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update metrics"
ON public.contributor_metrics
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create function to update contributor metrics
CREATE OR REPLACE FUNCTION public.update_contributor_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _last_date DATE;
  _current_streak INTEGER;
BEGIN
  -- Get current metrics
  SELECT last_activity_date, current_streak INTO _last_date, _current_streak
  FROM contributor_metrics
  WHERE user_id = NEW.author_id;
  
  IF NOT FOUND THEN
    -- Create new metrics record
    INSERT INTO contributor_metrics (user_id, current_streak, last_activity_date, total_suggestions)
    VALUES (NEW.author_id, 1, CURRENT_DATE, 1);
  ELSE
    -- Update existing metrics
    IF _last_date = CURRENT_DATE THEN
      -- Same day, just increment suggestions
      UPDATE contributor_metrics
      SET total_suggestions = total_suggestions + 1,
          engagement_score = engagement_score + 10,
          updated_at = now()
      WHERE user_id = NEW.author_id;
    ELSIF _last_date = CURRENT_DATE - 1 THEN
      -- Consecutive day, increment streak
      UPDATE contributor_metrics
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_activity_date = CURRENT_DATE,
          total_suggestions = total_suggestions + 1,
          engagement_score = engagement_score + 10 + (current_streak * 2),
          updated_at = now()
      WHERE user_id = NEW.author_id;
    ELSE
      -- Streak broken, reset to 1
      UPDATE contributor_metrics
      SET current_streak = 1,
          last_activity_date = CURRENT_DATE,
          total_suggestions = total_suggestions + 1,
          engagement_score = engagement_score + 10,
          updated_at = now()
      WHERE user_id = NEW.author_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for channel suggestions
CREATE TRIGGER on_channel_suggestion
  AFTER INSERT ON public.user_channels
  FOR EACH ROW
  WHEN (NEW.author_id IS NOT NULL)
  EXECUTE FUNCTION public.update_contributor_engagement();

-- Function to update approved count
CREATE OR REPLACE FUNCTION public.update_approved_suggestions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE contributor_metrics
    SET approved_suggestions = approved_suggestions + 1,
        engagement_score = engagement_score + 50,
        updated_at = now()
    WHERE user_id = NEW.author_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for approved channels
CREATE TRIGGER on_channel_approved
  AFTER UPDATE ON public.user_channels
  FOR EACH ROW
  WHEN (NEW.author_id IS NOT NULL)
  EXECUTE FUNCTION public.update_approved_suggestions();

-- Function to track comment engagement
CREATE OR REPLACE FUNCTION public.update_comment_engagement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or create metrics
  INSERT INTO contributor_metrics (user_id, total_comments, engagement_score, current_streak, last_activity_date)
  VALUES (NEW.user_id, 1, 5, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE
  SET total_comments = contributor_metrics.total_comments + 1,
      engagement_score = contributor_metrics.engagement_score + 5,
      current_streak = CASE 
        WHEN contributor_metrics.last_activity_date = CURRENT_DATE THEN contributor_metrics.current_streak
        WHEN contributor_metrics.last_activity_date = CURRENT_DATE - 1 THEN contributor_metrics.current_streak + 1
        ELSE 1
      END,
      longest_streak = GREATEST(
        contributor_metrics.longest_streak,
        CASE 
          WHEN contributor_metrics.last_activity_date = CURRENT_DATE - 1 THEN contributor_metrics.current_streak + 1
          ELSE contributor_metrics.current_streak
        END
      ),
      last_activity_date = CURRENT_DATE,
      updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger for comments
CREATE TRIGGER on_comment_added
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_engagement();

-- Add trigger for updated_at
CREATE TRIGGER update_contributor_metrics_updated_at
  BEFORE UPDATE ON public.contributor_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();