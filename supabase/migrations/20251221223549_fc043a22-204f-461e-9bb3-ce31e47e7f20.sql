-- Fix the find_similar_channels function to handle ORDER BY correctly
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
  -- Use a subquery to handle ORDER BY before aggregation
  SELECT COALESCE(jsonb_agg(similar_data), '[]'::jsonb) INTO _result
  FROM (
    SELECT 
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
      ) as similar_data
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
    LIMIT 5
  ) AS ordered_matches;
  
  RETURN _result;
END;
$$;