-- Create a function to send notifications on submission status change
CREATE OR REPLACE FUNCTION public.notify_submission_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to approved or rejected
  IF (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected')) THEN
    -- Only send notification if there's an author
    IF NEW.author_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        title,
        message,
        type,
        target_user_id,
        target_role,
        channel_id,
        created_by
      ) VALUES (
        CASE WHEN NEW.status = 'approved' 
          THEN 'Submission Approved!' 
          ELSE 'Submission Rejected' 
        END,
        CASE WHEN NEW.status = 'approved'
          THEN 'Your channel suggestion "' || NEW.name || '" has been approved and is now live.'
          ELSE 'Your channel suggestion "' || NEW.name || '" was not approved.'
        END,
        'submission_review',
        NEW.author_id,
        'member',
        NEW.id,
        COALESCE(NEW.approved_by, auth.uid())
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_submission_status_change ON public.user_channels;
CREATE TRIGGER on_submission_status_change
  AFTER UPDATE ON public.user_channels
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_submission_status_change();