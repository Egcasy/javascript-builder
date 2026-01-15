import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useMonnifyPayment } from "@/hooks/useMonnifyPayment";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";

export default function PaymentCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPayment, loading } = useMonnifyPayment();
  const { clearCart } = useCart();

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const paymentReference = searchParams.get("paymentReference");
    const orderId = localStorage.getItem("pendingOrderId");

    if (paymentReference && orderId) {
      handleVerification(paymentReference, orderId);
    } else {
      setStatus("failed");
      setMessage("Payment information not found");
    }
  }, [searchParams]);

  const handleVerification = async (paymentReference: string, orderId: string) => {
    const result = await verifyPayment(paymentReference, orderId);

    if (result.success && result.status === "PAID") {
      setStatus("success");
      setMessage(`Payment of ₦${result.amount?.toLocaleString()} received`);
      clearCart();
      localStorage.removeItem("pendingOrderId");
    } else {
      setStatus("failed");
      setMessage(result.error || `Payment ${result.status.toLowerCase()}`);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              {status === "loading" && (
                <>
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
                  <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
                </>
              )}

              {status === "success" && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
                  <p className="text-muted-foreground mb-6">{message}</p>
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => navigate("/my-tickets")}>
                      View My Tickets
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate("/events")}>
                      Browse More Events
                    </Button>
                  </div>
                </>
              )}

              {status === "failed" && (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  </motion.div>
                  <h2 className="text-xl font-semibold mb-2">Payment Failed</h2>
                  <p className="text-muted-foreground mb-6">{message}</p>
                  <div className="space-y-2">
                    <Button className="w-full" onClick={() => navigate("/checkout")}>
                      Try Again
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => navigate("/cart")}>
                      Back to Cart
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
