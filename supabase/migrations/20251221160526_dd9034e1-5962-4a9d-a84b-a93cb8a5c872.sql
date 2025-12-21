-- Add logo_url column to channel_profiles table
ALTER TABLE public.channel_profiles
ADD COLUMN logo_url text;