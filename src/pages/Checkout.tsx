import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Lock, 
  Check,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(price);
  };

  const generateQRCode = () => {
    return `TIXHUB-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
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
      for (const [eventId, eventItems] of Object.entries(itemsByEvent)) {
        const orderTotal = eventItems.reduce((sum, item) => {
          return sum + (item.ticketType?.price ?? 0) * item.quantity;
        }, 0);

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            event_id: eventId,
            status: 'completed',
            total_amount: orderTotal * 1.05
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create tickets for each item
        for (const item of eventItems) {
          const ticketsToCreate = Array.from({ length: item.quantity }, () => ({
            order_id: order.id,
            ticket_type_id: item.ticket_type_id,
            user_id: user.id,
            qr_code: generateQRCode(),
            status: 'valid'
          }));

          const { error: ticketsError } = await supabase
            .from('tickets')
            .insert(ticketsToCreate);

          if (ticketsError) throw ticketsError;

          // Update ticket type sold count
          await supabase
            .from('ticket_types')
            .update({ 
              sold: (item.ticketType?.price ?? 0) + item.quantity 
            })
            .eq('id', item.ticket_type_id);
        }
      }

      // Clear cart
      await clearCart();

      toast({
        title: "Purchase Complete!",
        description: "Your tickets are ready. Check your email and My Tickets."
      });

      navigate('/my-tickets');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
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

  const serviceFee = totalPrice * 0.05;
  const total = totalPrice + serviceFee;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-2 mb-8">
            <Lock className="h-5 w-5 text-success" />
            <span className="text-sm text-muted-foreground">Secure Checkout</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.ticketType?.event?.title} - {item.ticketType?.name} x{item.quantity}
                  </span>
                  <span>{formatPrice((item.ticketType?.price ?? 0) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Fee (5%)</span>
                <span>{formatPrice(serviceFee)}</span>
              </div>
            </div>

            <div className="border-t border-border my-4" />

            <div className="flex justify-between items-center">
              <span className="font-display font-semibold">Total</span>
              <span className="font-display text-2xl font-bold text-primary">
                {formatPrice(total)}
              </span>
            </div>
          </div>

          {/* Payment - Demo */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </h2>
            
            <div className="p-4 bg-muted/50 rounded-lg border border-border text-center">
              <p className="text-sm text-muted-foreground mb-2">Demo Mode</p>
              <p className="text-xs text-muted-foreground">
                This is a demo checkout. No real payment will be processed.
              </p>
            </div>
          </div>

          {/* Complete Order */}
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full gap-2"
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Complete Purchase - {formatPrice(total)}
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
