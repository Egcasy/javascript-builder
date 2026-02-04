import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

interface FavoriteButtonProps {
  eventId: string;
  className?: string;
  variant?: "icon" | "button";
}

export function FavoriteButton({ eventId, className, variant = "icon" }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: isFavorited } = useQuery({
    queryKey: ["favorite", eventId, user?.uid],
    queryFn: async () => {
      if (!user) return false;
      const favoritesSnapshot = await getDocs(
        query(collection(db, "favorites"), where("event_id", "==", eventId), where("user_id", "==", user.uid))
      );
      return !favoritesSnapshot.empty;
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please login to save favorites");

      if (isFavorited) {
        await deleteDoc(doc(db, "favorites", `${user.uid}_${eventId}`));
      } else {
        await setDoc(doc(db, "favorites", `${user.uid}_${eventId}`), {
          event_id: eventId,
          user_id: user.uid,
          created_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", eventId, user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["user-favorites", user?.uid] });
      toast({
        title: isFavorited ? "Removed from favorites" : "Added to favorites",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  if (variant === "button") {
    return (
      <Button
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite.mutate();
        }}
        disabled={toggleFavorite.isPending}
        className={cn("gap-2", className)}
      >
        <Heart className={cn("h-4 w-4", isFavorited && "fill-red-500 text-red-500")} />
        {isFavorited ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite.mutate();
      }}
      disabled={toggleFavorite.isPending}
      className={cn(
        "p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors",
        className
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          isFavorited ? "fill-red-500 text-red-500" : "text-foreground"
        )}
      />
    </button>
  );
}
