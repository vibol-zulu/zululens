-- Create SECURITY DEFINER function for registering tier1 visitors
CREATE OR REPLACE FUNCTION public.register_tier1_visitor(
  _name text,
  _email text,
  _country text DEFAULT 'United States'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _visitor_id uuid;
BEGIN
  -- Validate inputs
  IF _email IS NULL OR _email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;
  
  IF _name IS NULL OR _name = '' THEN
    RAISE EXCEPTION 'Name is required';
  END IF;
  
  -- Check if visitor already exists
  SELECT id INTO _visitor_id
  FROM tier1_visitors
  WHERE email = _email;
  
  IF _visitor_id IS NOT NULL THEN
    -- Update existing visitor
    UPDATE tier1_visitors
    SET last_visit_at = now(),
        total_visits = total_visits + 1
    WHERE id = _visitor_id;
    
    RETURN _visitor_id;
  ELSE
    -- Insert new visitor
    INSERT INTO tier1_visitors (name, email, country)
    VALUES (_name, _email, _country)
    RETURNING id INTO _visitor_id;
    
    RETURN _visitor_id;
  END IF;
END;
$$;

-- Create SECURITY DEFINER function for updating visitor session time
CREATE OR REPLACE FUNCTION public.update_tier1_visitor_time(
  _visitor_id uuid,
  _additional_seconds integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update if visitor exists and additional_seconds is positive
  IF _additional_seconds > 0 THEN
    UPDATE tier1_visitors
    SET total_time_seconds = total_time_seconds + _additional_seconds,
        last_visit_at = now()
    WHERE id = _visitor_id;
  END IF;
END;
$$;

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can create tier1 visitors" ON tier1_visitors;
DROP POLICY IF EXISTS "Update last visit on existing visitor" ON tier1_visitors;

-- The table still has RLS enabled, but now only admins can SELECT
-- and all INSERT/UPDATE must go through the SECURITY DEFINER functions