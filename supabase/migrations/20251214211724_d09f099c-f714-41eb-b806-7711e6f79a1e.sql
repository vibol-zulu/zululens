-- Create contributor_requests table to store pending requests
CREATE TABLE public.contributor_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.contributor_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (public)
CREATE POLICY "Anyone can submit contributor requests"
ON public.contributor_requests
FOR INSERT
WITH CHECK (true);

-- Only admins can view requests
CREATE POLICY "Admins can view all requests"
ON public.contributor_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update requests (approve/deny)
CREATE POLICY "Admins can update requests"
ON public.contributor_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete requests
CREATE POLICY "Admins can delete requests"
ON public.contributor_requests
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for admins to manage user_roles
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));