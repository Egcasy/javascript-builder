-- Fix sellers RLS policy to only expose verified sellers and hide sensitive data
DROP POLICY IF EXISTS "Anyone can view verified sellers" ON public.sellers;

-- Create a view for public seller data (hiding sensitive fields)
CREATE OR REPLACE VIEW public.public_sellers AS
SELECT 
  id,
  business_name,
  description,
  logo_url,
  verified,
  tier,
  created_at
FROM public.sellers
WHERE verified = true;

-- New policy: Anyone can view only verified sellers
CREATE POLICY "Anyone can view verified sellers" 
ON public.sellers 
FOR SELECT 
USING (verified = true);

-- Add INSERT policy for venues so sellers can create new venues
CREATE POLICY "Authenticated users can create venues"
ON public.venues 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Add UPDATE policy for orders so status can be updated
CREATE POLICY "Users can update their own orders"
ON public.orders 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);