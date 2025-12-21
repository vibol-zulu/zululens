-- Add veracity and bias score columns to channel_profiles table
ALTER TABLE public.channel_profiles
ADD COLUMN veracity_score numeric CHECK (veracity_score >= 0 AND veracity_score <= 100),
ADD COLUMN bias_score numeric CHECK (bias_score >= -100 AND bias_score <= 100),
ADD COLUMN veracity_votes integer DEFAULT 0,
ADD COLUMN bias_votes integer DEFAULT 0,
ADD COLUMN last_scored_at timestamp with time zone;

-- Add comment to explain the columns
COMMENT ON COLUMN public.channel_profiles.veracity_score IS 'Accuracy/truthfulness score from 0-100 (100 = most accurate)';
COMMENT ON COLUMN public.channel_profiles.bias_score IS 'Political bias score from -100 (far left) to 100 (far right), 0 = center';
COMMENT ON COLUMN public.channel_profiles.veracity_votes IS 'Number of community votes contributing to veracity score';
COMMENT ON COLUMN public.channel_profiles.bias_votes IS 'Number of community votes contributing to bias score';
COMMENT ON COLUMN public.channel_profiles.last_scored_at IS 'Timestamp of last score update';