-- Update the "Users can view own notifications" policy to exclude submission_review notifications
-- These should only be visible to the target_user_id (the submission author), not the creator (admin/moderator)

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" 
ON notifications 
FOR SELECT 
USING (auth.uid() = created_by AND type != 'submission_review');