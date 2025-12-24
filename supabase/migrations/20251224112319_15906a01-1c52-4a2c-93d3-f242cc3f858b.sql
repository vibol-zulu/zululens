-- Add delete policies for channel_analysis_reports table
CREATE POLICY "Admins can delete analysis reports"
ON public.channel_analysis_reports
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators can delete analysis reports"
ON public.channel_analysis_reports
FOR DELETE
USING (has_role(auth.uid(), 'moderator'::app_role));