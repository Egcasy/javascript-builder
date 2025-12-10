import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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
    queryKey: ["favorite", eventId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please login to save favorites");

      if (isFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ event_id: eventId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", eventId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-favorites", user?.id] });
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
