-- Create notifications table for channel flags and other notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'channel_flag',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel_id UUID REFERENCES public.user_channels(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'admin',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_by UUID,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Moderators can view notifications targeted to them
CREATE POLICY "Moderators can view moderator notifications"
ON public.notifications
FOR SELECT
USING (has_role(auth.uid(), 'moderator'::app_role) AND target_role = 'moderator');

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = created_by);

-- Authenticated users can create notifications (for flagging)
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.notifications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));