INSERT INTO public.app_settings (key, value) VALUES ('signup_gate_enabled','false') ON CONFLICT (key) DO UPDATE SET value='false';
CREATE POLICY "Moderators can update signup gate" ON public.app_settings FOR UPDATE TO authenticated
USING (key='signup_gate_enabled' AND (public.has_role(auth.uid(),'moderator') OR public.has_role(auth.uid(),'admin')))
WITH CHECK (key='signup_gate_enabled');