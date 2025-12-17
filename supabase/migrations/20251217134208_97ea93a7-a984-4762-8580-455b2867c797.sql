-- Add source_url and image_url columns to news_updates
ALTER TABLE public.news_updates
ADD COLUMN source_url TEXT,
ADD COLUMN image_url TEXT;