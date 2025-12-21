-- Create table for channel profile suggestions
CREATE TABLE public.channel_profile_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.user_channels(id) ON DELETE CASCADE,
  suggested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  field_name text NOT NULL,
  suggested_value text NOT NULL,
  current_value text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_field_name CHECK (field_name IN ('description', 'website_url', 'logo_url', 'parent_company', 'headquarters', 'founding_year', 'key_people', 'notable_events')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS
ALTER TABLE public.channel_profile_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can create suggestions"
ON public.channel_profile_suggestions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Users can view their own suggestions"
ON public.channel_profile_suggestions
FOR SELECT
TO authenticated
USING (auth.uid() = suggested_by);

CREATE POLICY "Admins can view all suggestions"
ON public.channel_profile_suggestions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can view all suggestions"
ON public.channel_profile_suggestions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can update suggestions"
ON public.channel_profile_suggestions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Moderators can update suggestions"
ON public.channel_profile_suggestions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete suggestions"
ON public.channel_profile_suggestions
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_profile_suggestions_channel ON public.channel_profile_suggestions(channel_id);
CREATE INDEX idx_profile_suggestions_status ON public.channel_profile_suggestions(status);

-- Add trigger for updated_at
CREATE TRIGGER update_channel_profile_suggestions_updated_at
BEFORE UPDATE ON public.channel_profile_suggestions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();