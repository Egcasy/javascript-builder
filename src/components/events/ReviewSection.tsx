import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ReviewSectionProps {
  eventId: string;
}

export function ReviewSection({ eventId }: ReviewSectionProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  // Fetch reviews
  const { data: reviews } = useQuery({
    queryKey: ["event-reviews", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_reviews")
        .select(`*, profiles:user_id(full_name, avatar_url)`)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Check if user already reviewed
  const { data: userReview } = useQuery({
    queryKey: ["user-review", eventId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("event_reviews")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please login to review");
      if (rating === 0) throw new Error("Please select a rating");

      const { error } = await supabase.from("event_reviews").insert({
        event_id: eventId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Review submitted!" });
      setRating(0);
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["event-reviews", eventId] });
      queryClient.invalidateQueries({ queryKey: ["user-review", eventId, user?.id] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const averageRating = reviews?.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
        <div className="text-center">
          <p className="text-4xl font-bold">{averageRating}</p>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(Number(averageRating))
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="border-l border-border pl-4">
          <p className="font-medium">{reviews?.length || 0} reviews</p>
          <p className="text-sm text-muted-foreground">From verified attendees</p>
        </div>
      </div>

      {/* Write Review Form */}
      {user && !userReview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-card rounded-xl border border-border"
        >
          <h4 className="font-semibold mb-4">Write a Review</h4>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-4"
            rows={3}
          />

          <Button
            onClick={() => submitReview.mutate()}
            disabled={submitReview.isPending || rating === 0}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {submitReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </motion.div>
      )}

      {userReview && (
        <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
          <p className="text-sm text-muted-foreground">You've already reviewed this event</p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews?.map((review: any) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-card rounded-xl border border-border"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{review.profiles?.full_name || "Anonymous"}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 ${
                        star <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                {review.comment && <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>}
              </div>
            </div>
          </motion.div>
        ))}

        {reviews?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
}
