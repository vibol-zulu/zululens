-- Create a table for user-submitted media channels
CREATE TABLE public.user_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('corporate', 'independent')),
  value_millions DECIMAL(10, 2) NOT NULL,
  start_date TEXT NOT NULL,
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  political_lean TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  year INTEGER NOT NULL DEFAULT 2025,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_channels ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view channels (public data)
CREATE POLICY "Anyone can view user channels" 
ON public.user_channels 
FOR SELECT 
USING (true);

-- Allow anyone to insert channels (public contribution)
CREATE POLICY "Anyone can add user channels" 
ON public.user_channels 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_channels_updated_at
BEFORE UPDATE ON public.user_channels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();