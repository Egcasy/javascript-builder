import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CreditCard, Lock, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMonnifyPayment } from "@/hooks/useMonnifyPayment";
import { PromoCodeInput } from "@/components/checkout/PromoCodeInput";

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { initializePayment, loading: paymentLoading } = useMonnifyPayment();
  
  const [loading, setLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ id: string; code: string; amount: number } | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const generateQRCode = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return `TIXHUB-${Array.from(array, b => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  };

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;

    setLoading(true);
    try {
      // Group items by event
      const itemsByEvent = items.reduce((acc, item) => {
        const eventId = item.ticketType?.event_id;
        if (eventId) {
          if (!acc[eventId]) acc[eventId] = [];
          acc[eventId].push(item);
        }
        return acc;
      }, {} as Record<string, typeof items>);

      // Create orders and tickets for each event
      let firstOrderId = "";
      for (const [eventId, eventItems] of Object.entries(itemsByEvent)) {
        const orderSubtotal = eventItems.reduce((sum, item) => {
          return sum + (item.ticketType?.price ?? 0) * item.quantity;
        }, 0);

        const discountAmount = appliedPromo ? appliedPromo.amount : 0;
        const orderTotal = (orderSubtotal - discountAmount) * 1.05;

        // Create order with pending status
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            event_id: eventId,
            status: 'pending',
            total_amount: orderTotal,
            promo_code_id: appliedPromo?.id || null,
            discount_amount: discountAmount
          })
          .select()
          .single();

        if (orderError) throw orderError;
        if (!firstOrderId) firstOrderId = order.id;

        // Create tickets
        for (const item of eventItems) {
          const ticketsToCreate = Array.from({ length: item.quantity }, () => ({
            order_id: order.id,
            ticket_type_id: item.ticket_type_id,
            user_id: user.id,
            qr_code: generateQRCode(),
            status: 'pending'
          }));

          const { error: ticketsError } = await supabase.from('tickets').insert(ticketsToCreate);
          if (ticketsError) throw ticketsError;
        }
      }

      // Update promo code usage
      if (appliedPromo) {
        await supabase
          .from('promo_codes')
          .update({ used_count: 1 })
          .eq('id', appliedPromo.id);
      }

      // Store order ID for callback
      localStorage.setItem("pendingOrderId", firstOrderId);

      // Initialize Monnify payment
      const result = await initializePayment({
        orderId: firstOrderId,
        amount: total,
        customerEmail: profile?.email || user.email || "",
        customerName: profile?.full_name || "Customer",
        description: `TixHub Tickets - ${items.length} item(s)`
      });

      if (result.success && result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error(result.error || "Payment initialization failed");
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const discount = appliedPromo?.amount || 0;
  const subtotalAfterDiscount = totalPrice - discount;
  const serviceFee = subtotalAfterDiscount * 0.05;
  const total = subtotalAfterDiscount + serviceFee;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-2 mb-8">
            <Lock className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Secure Checkout</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.ticketType?.event?.title} - {item.ticketType?.name} x{item.quantity}</span>
                  <span>{formatPrice((item.ticketType?.price ?? 0) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border my-4" />

            {/* Promo Code */}
            <div className="mb-4">
              <PromoCodeInput
                eventId={items[0]?.ticketType?.event_id}
                subtotal={totalPrice}
                appliedCode={appliedPromo}
                onApply={(promo) => setAppliedPromo(promo)}
                onRemove={() => setAppliedPromo(null)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedPromo?.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee (5%)</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
            </div>

            <div className="border-t border-border my-4" />

            <div className="flex justify-between items-center">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-primary">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </h2>
            
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm font-medium mb-1">Pay with Monnify</p>
              <p className="text-xs text-muted-foreground">
                Card, Bank Transfer, USSD - You'll be redirected to complete payment
              </p>
            </div>
          </div>

          <Button 
            variant="hero" 
            size="lg" 
            className="w-full gap-2"
            onClick={handleCheckout}
            disabled={loading || paymentLoading}
          >
            {loading || paymentLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ExternalLink className="h-5 w-5" />
                Pay {formatPrice(total)}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
