-- Create channel_profiles table for extended channel information
CREATE TABLE public.channel_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL UNIQUE REFERENCES public.user_channels(id) ON DELETE CASCADE,
  description text,
  website_url text,
  parent_company text,
  key_people text[],
  notable_events text[],
  founding_year integer,
  headquarters text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channel_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view channel profiles (public data)
CREATE POLICY "Anyone can view channel profiles"
ON public.channel_profiles
FOR SELECT
USING (true);

-- Admins can manage channel profiles
CREATE POLICY "Admins can insert channel profiles"
ON public.channel_profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update channel profiles"
ON public.channel_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete channel profiles"
ON public.channel_profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Moderators can also manage channel profiles
CREATE POLICY "Moderators can insert channel profiles"
ON public.channel_profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'moderator'::app_role));

CREATE POLICY "Moderators can update channel profiles"
ON public.channel_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'moderator'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_channel_profiles_updated_at
BEFORE UPDATE ON public.channel_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile when channel is approved
CREATE OR REPLACE FUNCTION public.create_channel_profile_on_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only trigger when status changes to approved
  IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
    -- Create a profile if one doesn't exist
    INSERT INTO public.channel_profiles (channel_id)
    VALUES (NEW.id)
    ON CONFLICT (channel_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating profiles
CREATE TRIGGER create_profile_on_channel_approval
AFTER UPDATE ON public.user_channels
FOR EACH ROW
EXECUTE FUNCTION public.create_channel_profile_on_approval();