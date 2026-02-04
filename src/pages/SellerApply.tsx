import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Store, 
  Mail, 
  FileText,
  Loader2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/integrations/firebase/client";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export default function SellerApply() {
  const { user, isSeller } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to apply as a seller",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (!formData.businessName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your business name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await setDoc(doc(db, "sellers", user.uid), {
        user_id: user.uid,
        business_name: formData.businessName.trim(),
        business_email: formData.businessEmail.trim() || null,
        description: formData.description.trim() || null,
        tier: "bronze",
        verified: false,
        created_at: serverTimestamp(),
      });

      toast({
        title: "Welcome aboard!",
        description: "Your seller account has been created",
      });
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Error creating seller account:', error);
      toast({
        title: "Error",
        description: "Failed to create seller account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSeller) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">You're already a seller!</h2>
            <p className="text-muted-foreground mb-6">
              Access your dashboard to manage events and view sales.
            </p>
            <Button variant="hero" size="lg" onClick={() => navigate('/seller/dashboard')} className="gap-2">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-4">
              <Store className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Become a Seller
            </h1>
            <p className="text-muted-foreground">
              Start selling tickets to your events on TixHub
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  placeholder="Your business or brand name"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Business Email
                </Label>
                <Input
                  id="businessEmail"
                  type="email"
                  placeholder="contact@yourbusiness.com"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your business and the events you plan to host..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Seller Account
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">What you get as a seller:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create and manage unlimited events</li>
                <li>• Multiple ticket tiers with custom pricing</li>
                <li>• Real-time sales analytics dashboard</li>
                <li>• QR code ticket scanning</li>
                <li>• Direct payouts to your account</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
