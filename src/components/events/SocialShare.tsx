import { Share2, Link, MessageCircle, Twitter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SocialShareProps {
  eventId: string;
  eventTitle: string;
  variant?: "icon" | "button";
}

export const SocialShare = ({ eventId, eventTitle, variant = "icon" }: SocialShareProps) => {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/events/${eventId}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(eventTitle);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Check out this event: ${eventTitle}`);
    window.open(`https://wa.me/?text=${text}%20${encodedUrl}`, '_blank');
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      '_blank'
    );
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      '_blank'
    );
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `Check out this event: ${eventTitle}`,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "button" ? (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Link className="mr-2 h-4 w-4" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer">
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer">
          <Twitter className="mr-2 h-4 w-4" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Facebook
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Share2 className="mr-2 h-4 w-4" />
            More options...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
