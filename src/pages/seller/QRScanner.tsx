import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Search,
  Ticket,
  User,
  Calendar,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface TicketInfo {
  id: string;
  qr_code: string;
  status: string;
  checked_in_at: string | null;
  ticket_type: {
    name: string;
    event: {
      title: string;
      date: string;
    };
  };
  user: {
    full_name: string;
    email: string;
  };
}

export default function QRScanner() {
  const navigate = useNavigate();
  const { user, isSeller } = useAuth();
  const { toast } = useToast();
  
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [scanResult, setScanResult] = useState<"success" | "error" | null>(null);
  const [scanMessage, setScanMessage] = useState("");
  const [recentScans, setRecentScans] = useState<TicketInfo[]>([]);

  useEffect(() => {
    if (!user || !isSeller) {
      navigate("/login");
    }
  }, [user, isSeller, navigate]);

  const lookupTicket = async (qrCode: string) => {
    setLoading(true);
    setTicketInfo(null);
    setScanResult(null);

    try {
      const ticketSnapshot = await getDocs(
        query(collection(db, "tickets"), where("qr_code", "==", qrCode))
      );

      const ticketDoc = ticketSnapshot.docs[0];
      if (!ticketDoc) {
        setScanResult("error");
        setScanMessage("Ticket not found");
        return;
      }

      const ticket = ticketDoc.data() as {
        qr_code: string;
        status: string;
        checked_in_at: string | null;
        ticket_type_id: string;
        user_id: string;
        event_id: string;
      };

      const eventSnap = await getDoc(doc(db, "events", ticket.event_id));
      const event = eventSnap.exists() ? (eventSnap.data() as { title?: string; date?: string; seller_id?: string; ticket_types?: Array<{ id?: string; name?: string }> }) : null;

      const sellerSnap = await getDoc(doc(db, "sellers", user?.uid || ""));
      const seller = sellerSnap.exists() ? { id: sellerSnap.id } : null;

      if (event?.seller_id !== seller?.id) {
        setScanResult("error");
        setScanMessage("You don't have access to this event");
        return;
      }

      const profileSnap = await getDoc(doc(db, "profiles", ticket.user_id));
      const profile = profileSnap.exists() ? (profileSnap.data() as { full_name?: string; email?: string }) : null;

      const ticketType = event?.ticket_types?.find((type) => type.id === ticket.ticket_type_id);

      const fullTicketInfo: TicketInfo = {
        id: ticketDoc.id,
        qr_code: ticket.qr_code,
        status: ticket.status || "valid",
        checked_in_at: ticket.checked_in_at,
        ticket_type: {
          name: ticketType?.name || "Unknown",
          event: {
            title: event?.title || "Unknown Event",
            date: event?.date || "",
          },
        },
        user: {
          full_name: profile?.full_name || "Unknown",
          email: profile?.email || "",
        },
      };

      setTicketInfo(fullTicketInfo);

      if (ticket.status === "used") {
        setScanResult("error");
        setScanMessage(`Already checked in at ${new Date(ticket.checked_in_at!).toLocaleString()}`);
      } else if (ticket.status !== "valid") {
        setScanResult("error");
        setScanMessage(`Ticket status: ${ticket.status}`);
      } else {
        setScanResult("success");
        setScanMessage("Valid ticket - Ready to check in");
      }
    } catch (error) {
      console.error("Lookup error:", error);
      setScanResult("error");
      setScanMessage("Failed to lookup ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!ticketInfo) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "tickets", ticketInfo.id), {
        status: "used",
        checked_in_at: new Date().toISOString(),
      });

      toast({
        title: "Check-in successful!",
        description: `${ticketInfo.user.full_name} has been checked in`,
      });

      setRecentScans(prev => [
        { ...ticketInfo, status: "used", checked_in_at: new Date().toISOString() },
        ...prev.slice(0, 9),
      ]);

      setTicketInfo(null);
      setScanResult(null);
      setManualCode("");
    } catch (error) {
      console.error("Check-in error:", error);
      toast({
        title: "Check-in failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = () => {
    if (manualCode.trim()) {
      lookupTicket(manualCode.trim());
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <QrCode className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Ticket Check-in</h1>
        </div>

        {/* Manual Entry */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Ticket Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter QR code or ticket ID"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
              />
              <Button onClick={handleManualLookup} disabled={loading || !manualCode.trim()}>
                {loading ? "Searching..." : "Lookup"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Scan Result */}
        <AnimatePresence>
          {(ticketInfo || scanResult) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className={`mb-6 border-2 ${
                scanResult === "success" ? "border-green-500" : 
                scanResult === "error" ? "border-red-500" : ""
              }`}>
                <CardContent className="pt-6">
                  {/* Status Banner */}
                  <div className={`flex items-center gap-2 p-4 rounded-lg mb-4 ${
                    scanResult === "success" ? "bg-green-500/10 text-green-600" :
                    "bg-red-500/10 text-red-600"
                  }`}>
                    {scanResult === "success" ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <XCircle className="h-6 w-6" />
                    )}
                    <span className="font-semibold">{scanMessage}</span>
                  </div>

                  {ticketInfo && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Ticket className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Event</p>
                            <p className="font-medium">{ticketInfo.ticket_type.event.title}</p>
                            <p className="text-sm">{ticketInfo.ticket_type.name}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Attendee</p>
                            <p className="font-medium">{ticketInfo.user.full_name}</p>
                            <p className="text-sm">{ticketInfo.user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Event Date</p>
                            <p className="font-medium">
                              {new Date(ticketInfo.ticket_type.event.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={ticketInfo.status === "valid" ? "default" : "destructive"}>
                              {ticketInfo.status.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {scanResult === "success" && (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleCheckIn}
                          disabled={loading}
                        >
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Confirm Check-in
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Scans */}
        {recentScans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentScans.map((scan, index) => (
                  <div 
                    key={scan.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{scan.user.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {scan.ticket_type.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">Checked In</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(scan.checked_in_at!).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
