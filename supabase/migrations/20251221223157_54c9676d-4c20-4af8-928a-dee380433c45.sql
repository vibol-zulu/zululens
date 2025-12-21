-- Enable the pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add similarity tracking fields to user_channels
ALTER TABLE public.user_channels
ADD COLUMN IF NOT EXISTS similar_channels jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_similarity_flag boolean DEFAULT false;

-- Create a function to find similar channel names
CREATE OR REPLACE FUNCTION public.find_similar_channels(
  _channel_name text,
  _country text,
  _category text,
  _exclude_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb := '[]'::jsonb;
  _normalized_name text;
BEGIN
  -- Normalize the input name (lowercase, trim)
  _normalized_name := lower(trim(_channel_name));
  
  -- Find channels with similar names using trigram similarity
  -- Also check for partial matches and common abbreviations
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', uc.id,
      'name', uc.name,
      'similarity', round((similarity(lower(uc.name), _normalized_name) * 100)::numeric, 1),
      'match_type', CASE
        WHEN lower(uc.name) = _normalized_name THEN 'exact'
        WHEN lower(uc.name) LIKE '%' || _normalized_name || '%' OR _normalized_name LIKE '%' || lower(uc.name) || '%' THEN 'contains'
        WHEN similarity(lower(uc.name), _normalized_name) >= 0.4 THEN 'similar'
        ELSE 'partial'
      END,
      'country', uc.country,
      'category', uc.category,
      'status', uc.status
    )
  ) INTO _result
  FROM public.user_channels uc
  WHERE 
    -- Exclude the channel being checked (for updates)
    (_exclude_id IS NULL OR uc.id != _exclude_id)
    -- Match channels in the same country or similar category
    AND (uc.country = _country OR uc.category = _category)
    -- Use trigram similarity or partial matching
    AND (
      similarity(lower(uc.name), _normalized_name) >= 0.3
      OR lower(uc.name) LIKE '%' || _normalized_name || '%'
      OR _normalized_name LIKE '%' || lower(uc.name) || '%'
      -- Also check for word overlap (handles "The Daily Show" vs "Daily Show")
      OR EXISTS (
        SELECT 1 
        FROM unnest(string_to_array(regexp_replace(lower(uc.name), '[^a-z0-9 ]', '', 'g'), ' ')) AS word
        WHERE length(word) > 3 
        AND _normalized_name LIKE '%' || word || '%'
      )
    )
  ORDER BY similarity(lower(uc.name), _normalized_name) DESC
  LIMIT 5;
  
  RETURN COALESCE(_result, '[]'::jsonb);
END;
$$;

-- Create an index to speed up similarity searches
CREATE INDEX IF NOT EXISTS idx_user_channels_name_trgm 
ON public.user_channels 
USING gin (name gin_trgm_ops);

-- Add a comment explaining the similarity fields
COMMENT ON COLUMN public.user_channels.similar_channels IS 'JSON array of potentially similar channels detected during submission';
COMMENT ON COLUMN public.user_channels.has_similarity_flag IS 'Flag indicating potential duplicate/similar channel detected';