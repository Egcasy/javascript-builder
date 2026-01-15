import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, X, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PromoCodeInputProps {
  eventId?: string;
  subtotal: number;
  onApply: (discount: { id: string; code: string; amount: number; type: string }) => void;
  onRemove: () => void;
  appliedCode?: { code: string; amount: number } | null;
}

export const PromoCodeInput = ({
  eventId,
  subtotal,
  onApply,
  onRemove,
  appliedCode,
}: PromoCodeInputProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApply = async () => {
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      // Query promo codes - either for this specific event or global (null event_id)
      let query = supabase
        .from("promo_codes")
        .select("*")
        .eq("code", code.trim().toUpperCase())
        .eq("is_active", true);

      const { data: promoCodes, error } = await query;

      if (error) throw error;

      // Find a matching promo code (event-specific takes priority)
      const promoCode = promoCodes?.find(p => 
        p.event_id === eventId || p.event_id === null
      );

      if (!promoCode) {
        toast({
          title: "Invalid code",
          description: "This promo code is not valid for this purchase",
          variant: "destructive",
        });
        return;
      }

      // Check expiration
      if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
        toast({
          title: "Code expired",
          description: "This promo code has expired",
          variant: "destructive",
        });
        return;
      }

      // Check max uses
      if (promoCode.max_uses && promoCode.used_count >= promoCode.max_uses) {
        toast({
          title: "Code exhausted",
          description: "This promo code has reached its usage limit",
          variant: "destructive",
        });
        return;
      }

      // Check minimum purchase
      if (promoCode.min_purchase && subtotal < promoCode.min_purchase) {
        toast({
          title: "Minimum not met",
          description: `Minimum purchase of ₦${promoCode.min_purchase.toLocaleString()} required`,
          variant: "destructive",
        });
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (promoCode.discount_type === "percentage") {
        discountAmount = (subtotal * promoCode.discount_value) / 100;
      } else {
        discountAmount = Math.min(promoCode.discount_value, subtotal);
      }

      onApply({
        id: promoCode.id,
        code: promoCode.code,
        amount: discountAmount,
        type: promoCode.discount_type,
      });

      toast({
        title: "Promo applied!",
        description: `You saved ₦${discountAmount.toLocaleString()}`,
      });

      setCode("");
    } catch (error) {
      console.error("Promo code error:", error);
      toast({
        title: "Error",
        description: "Failed to apply promo code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <span className="font-medium">{appliedCode.code}</span>
          <span className="text-sm text-muted-foreground">
            -₦{appliedCode.amount.toLocaleString()}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="pl-10"
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
      </div>
      <Button onClick={handleApply} disabled={loading || !code.trim()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
      </Button>
    </div>
  );
};
