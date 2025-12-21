-- Update the trigger function to include extended profile data for newly approved channels
CREATE OR REPLACE FUNCTION public.create_channel_profile_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when status changes to approved
  IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
    -- Create a profile with basic description
    INSERT INTO public.channel_profiles (
      channel_id,
      description,
      headquarters,
      parent_company
    )
    VALUES (
      NEW.id,
      NEW.name || ' is a ' || NEW.category || ' media outlet focused on ' || NEW.content_type || ' content.',
      CASE WHEN NEW.country = 'United States' THEN 'United States' ELSE NEW.country END,
      CASE WHEN NEW.category = 'corporate' THEN 'Major media conglomerate' ELSE 'Independent' END
    )
    ON CONFLICT (channel_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;