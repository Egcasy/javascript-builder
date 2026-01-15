import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentParams {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  description?: string;
}

interface PaymentResult {
  success: boolean;
  checkoutUrl?: string;
  paymentReference?: string;
  error?: string;
}

interface VerifyResult {
  success: boolean;
  status: string;
  amount?: number;
  error?: string;
}

export const useMonnifyPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializePayment = async (params: PaymentParams): Promise<PaymentResult> => {
    setLoading(true);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/payment/callback`;

      const { data, error: invokeError } = await supabase.functions.invoke("monnify-payment", {
        body: {
          action: "initialize",
          orderId: params.orderId,
          amount: params.amount,
          customerEmail: params.customerEmail,
          customerName: params.customerName,
          description: params.description,
          redirectUrl,
        },
      });

      if (invokeError) throw invokeError;

      if (!data.success) {
        throw new Error(data.error || "Payment initialization failed");
      }

      return {
        success: true,
        checkoutUrl: data.checkoutUrl,
        paymentReference: data.paymentReference,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Payment initialization failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentReference: string, orderId: string): Promise<VerifyResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("monnify-payment", {
        body: {
          action: "verify",
          paymentReference,
          orderId,
        },
      });

      if (invokeError) throw invokeError;

      return {
        success: data.success,
        status: data.status,
        amount: data.amount,
      };
    } catch (err: any) {
      const errorMessage = err.message || "Payment verification failed";
      setError(errorMessage);
      return { success: false, status: "FAILED", error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    initializePayment,
    verifyPayment,
    loading,
    error,
  };
};
