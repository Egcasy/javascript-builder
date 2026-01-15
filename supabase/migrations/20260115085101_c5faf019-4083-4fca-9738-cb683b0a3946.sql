-- Promo codes table for sellers to create discounts
CREATE TABLE public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  max_uses integer,
  used_count integer DEFAULT 0,
  min_purchase numeric DEFAULT 0,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(code, seller_id)
);

-- User preferences for AI recommendations
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  favorite_categories text[] DEFAULT '{}',
  favorite_cities text[] DEFAULT '{}',
  price_range_min numeric DEFAULT 0,
  price_range_max numeric DEFAULT 1000000,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Promo codes policies
CREATE POLICY "Sellers can manage their promo codes"
ON public.promo_codes
FOR ALL
USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view active promo codes"
ON public.promo_codes
FOR SELECT
USING (is_active = true);

-- User preferences policies
CREATE POLICY "Users can manage their preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id);

-- Add payment reference to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_reference text,
ADD COLUMN IF NOT EXISTS promo_code_id uuid REFERENCES public.promo_codes(id),
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Allow sellers to update tickets for check-in
CREATE POLICY "Sellers can update tickets for check-in"
ON public.tickets
FOR UPDATE
USING (
  ticket_type_id IN (
    SELECT tt.id FROM ticket_types tt
    JOIN events e ON tt.event_id = e.id
    JOIN sellers s ON e.seller_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- Trigger for updated_at on new tables
CREATE TRIGGER update_promo_codes_updated_at
BEFORE UPDATE ON public.promo_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();