import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag, Plus, Trash2, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_purchase: number;
  expires_at: string | null;
  is_active: boolean;
  event_id: string | null;
  event?: { title: string };
}

interface Event {
  id: string;
  title: string;
}

export default function PromoCodes() {
  const navigate = useNavigate();
  const { user, isSeller } = useAuth();
  const { toast } = useToast();

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);

  const [newCode, setNewCode] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: "",
    min_purchase: "",
    expires_at: "",
    event_id: "all",
  });

  useEffect(() => {
    if (!user || !isSeller) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [user, isSeller]);

  const fetchData = async () => {
    try {
      // Get seller id
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!seller) return;
      setSellerId(seller.id);

      // Fetch promo codes
      const { data: codes } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      // Fetch events for dropdown
      const { data: sellerEvents } = await supabase
        .from("events")
        .select("id, title")
        .eq("seller_id", seller.id)
        .order("date", { ascending: false });

      setPromoCodes(codes || []);
      setEvents(sellerEvents || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  const handleCreate = async () => {
    if (!newCode.code || !sellerId) return;

    setCreating(true);
    try {
      const { error } = await supabase.from("promo_codes").insert({
        seller_id: sellerId,
        code: newCode.code.toUpperCase(),
        discount_type: newCode.discount_type,
        discount_value: newCode.discount_value,
        max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
        min_purchase: newCode.min_purchase ? parseFloat(newCode.min_purchase) : 0,
        expires_at: newCode.expires_at || null,
        event_id: newCode.event_id === "all" ? null : newCode.event_id,
      });

      if (error) throw error;

      toast({ title: "Promo code created!" });
      setDialogOpen(false);
      setNewCode({
        code: "",
        discount_type: "percentage",
        discount_value: 10,
        max_uses: "",
        min_purchase: "",
        expires_at: "",
        event_id: "all",
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Promo code deleted" });
      setPromoCodes(promoCodes.filter((p) => p.id !== id));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied!" });
  };

  const formatDiscount = (code: PromoCode) => {
    if (code.discount_type === "percentage") {
      return `${code.discount_value}%`;
    }
    return `₦${code.discount_value.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Tag className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Promo Codes</h1>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Promo Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="SUMMER20"
                      value={newCode.code}
                      onChange={(e) =>
                        setNewCode({ ...newCode, code: e.target.value.toUpperCase() })
                      }
                    />
                    <Button variant="outline" onClick={generateCode}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Type</Label>
                    <Select
                      value={newCode.discount_type}
                      onValueChange={(v) => setNewCode({ ...newCode, discount_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₦)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={newCode.discount_value}
                      onChange={(e) =>
                        setNewCode({ ...newCode, discount_value: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label>Event (Optional)</Label>
                  <Select
                    value={newCode.event_id}
                    onValueChange={(v) => setNewCode({ ...newCode, event_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Uses</Label>
                    <Input
                      type="number"
                      placeholder="Unlimited"
                      value={newCode.max_uses}
                      onChange={(e) => setNewCode({ ...newCode, max_uses: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Min Purchase (₦)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newCode.min_purchase}
                      onChange={(e) => setNewCode({ ...newCode, min_purchase: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Expires At</Label>
                  <Input
                    type="datetime-local"
                    value={newCode.expires_at}
                    onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                  />
                </div>

                <Button className="w-full" onClick={handleCreate} disabled={creating || !newCode.code}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Promo Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No promo codes yet. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  promoCodes.map((code) => (
                    <TableRow key={code.id}>
                      <TableCell className="font-mono font-bold">{code.code}</TableCell>
                      <TableCell>{formatDiscount(code)}</TableCell>
                      <TableCell>
                        {code.event_id
                          ? events.find((e) => e.id === code.event_id)?.title || "Event"
                          : "All Events"}
                      </TableCell>
                      <TableCell>
                        {code.used_count} / {code.max_uses || "∞"}
                      </TableCell>
                      <TableCell>
                        {code.expires_at
                          ? new Date(code.expires_at).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={code.is_active ? "default" : "secondary"}>
                          {code.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyCode(code.code)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(code.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
