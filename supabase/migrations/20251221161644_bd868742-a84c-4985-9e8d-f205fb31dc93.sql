-- Update the trigger function to also call the edge function to populate profile data
CREATE OR REPLACE FUNCTION public.create_channel_profile_on_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only trigger when status changes to approved
  IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
    -- Create a profile if one doesn't exist with a basic description
    INSERT INTO public.channel_profiles (
      channel_id,
      description,
      website_url
    )
    VALUES (
      NEW.id,
      NEW.name || ' is a ' || NEW.category || ' media outlet focused on ' || NEW.content_type || ' content.',
      NULL
    )
    ON CONFLICT (channel_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;