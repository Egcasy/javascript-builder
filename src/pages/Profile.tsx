import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Phone, Camera, Save, Ticket, Heart, Star, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
  });

  useEffect(() => {
    setFormData({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
    });
  }, [profile]);

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ["user-stats", user?.uid],
    queryFn: async () => {
      if (!user) return null;

      const [ticketsSnapshot, ordersSnapshot, favoritesSnapshot, reviewsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "tickets"), where("user_id", "==", user.uid))),
        getDocs(query(collection(db, "orders"), where("user_id", "==", user.uid), where("status", "==", "completed"))),
        getDocs(query(collection(db, "favorites"), where("user_id", "==", user.uid))),
        getDocs(query(collection(db, "event_reviews"), where("user_id", "==", user.uid))),
      ]);

      const totalSpent = ordersSnapshot.docs.reduce((sum, docSnap) => sum + Number(docSnap.data().total_amount || 0), 0);

      return {
        ticketsCount: ticketsSnapshot.size,
        totalSpent,
        favoritesCount: favoritesSnapshot.size,
        reviewsCount: reviewsSnapshot.size,
      };
    },
    enabled: !!user,
  });

  // Fetch order history
  const { data: orders } = useQuery({
    queryKey: ["user-orders", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const ordersSnapshot = await getDocs(
        query(collection(db, "orders"), where("user_id", "==", user.uid))
      );
      return ordersSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as any) }));
    },
    enabled: !!user,
  });

  // Fetch favorites
  const { data: favorites } = useQuery({
    queryKey: ["user-favorites", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const favoritesSnapshot = await getDocs(
        query(collection(db, "favorites"), where("user_id", "==", user.uid))
      );
      const favoritesData = await Promise.all(
        favoritesSnapshot.docs.map(async (favoriteDoc) => {
          const favorite = favoriteDoc.data() as { event_id: string; created_at?: string };
          const eventSnap = await getDoc(doc(db, "events", favorite.event_id));
          return {
            id: favoriteDoc.id,
            event_id: favorite.event_id,
            created_at: favorite.created_at,
            event: eventSnap.exists() ? { id: eventSnap.id, ...(eventSnap.data() as any) } : null,
          };
        })
      );
      return favoritesData;
    },
    enabled: !!user,
  });

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await setDoc(
        doc(db, "profiles", user.uid),
        {
        full_name: formData.full_name,
        phone: formData.phone,
        },
        { merge: true }
      );

      toast({ title: "Profile updated successfully!" });
    } catch (error: any) {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(price);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">My Profile</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.ticketsCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Tickets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatPrice(stats?.totalSpent || 0)}</p>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <Heart className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.favoritesCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Favorites</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.reviewsCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="profile">Profile Settings</TabsTrigger>
              <TabsTrigger value="orders">Order History</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your profile details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-10 w-10 text-primary" />
                        </div>
                        <button
                          type="button"
                          className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full"
                        >
                          <Camera className="h-3 w-3" />
                        </button>
                      </div>
                      <div>
                        <p className="font-medium">{profile?.full_name || "User"}</p>
                        <p className="text-sm text-muted-foreground">{profile?.email}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="pl-10"
                            placeholder="Enter your name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="email" value={profile?.email || ""} disabled className="pl-10 bg-muted" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="pl-10"
                            placeholder="+234 XXX XXX XXXX"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="gap-2">
                      <Save className="h-4 w-4" />
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>Your past ticket purchases</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order: any) => (
                        <div key={order.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                          {order.event_cover_image ? (
                            <img
                              src={order.event_cover_image}
                              alt={order.event_title}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-background flex items-center justify-center">
                              <Ticket className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{order.event_title}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.event_date ? new Date(order.event_date).toLocaleDateString() : "Date TBA"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatPrice(order.total_amount)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="favorites">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Saved Events</CardTitle>
                  <CardDescription>Events you've added to favorites</CardDescription>
                </CardHeader>
                <CardContent>
                  {favorites && favorites.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {favorites.map((fav: any) => (
                        <div
                          key={fav.id}
                          onClick={() => fav.event?.id && navigate(`/events/${fav.event?.id}`)}
                          className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          {fav.event?.cover_image ? (
                            <img
                              src={fav.event?.cover_image}
                              alt={fav.event?.title}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-background flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{fav.event?.title || "Event"}</p>
                            <p className="text-sm text-muted-foreground">
                              {fav.event?.venue?.name}, {fav.event?.venue?.city}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No favorites yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}
