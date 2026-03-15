import { memo, useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface BookmarkButtonProps {
  messageId: string;
  conceptContent: string;
  sessionId: string;
}

function BookmarkButtonComponent({ messageId, conceptContent, sessionId }: BookmarkButtonProps) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookmarked_concepts")
      .select("id")
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setIsBookmarked(true);
      });
  }, [messageId, user]);

  const toggleBookmark = async () => {
    if (!user || loading) return;
    setLoading(true);

    try {
      if (isBookmarked) {
        await supabase
          .from("bookmarked_concepts")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id);
        setIsBookmarked(false);
        toast({ title: "⭐ বুকমার্ক সরানো হয়েছে" });
      } else {
        await supabase.from("bookmarked_concepts").insert({
          message_id: messageId,
          concept_content: conceptContent.substring(0, 5000),
          session_id: sessionId,
          user_id: user.id,
        });
        setIsBookmarked(true);
        toast({ title: "⭐ বুকমার্ক করা হয়েছে!", description: "কনসেপ্ট সেভ হয়েছে।" });
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className={cn(
        "p-1.5 rounded-lg transition-all hover:scale-110 active:scale-90",
        isBookmarked
          ? "text-yellow-500"
          : "text-muted-foreground hover:text-yellow-500"
      )}
      title={isBookmarked ? "বুকমার্ক সরান" : "বুকমার্ক করুন"}
    >
      <Star className={cn("w-4 h-4", isBookmarked && "fill-current")} />
    </button>
  );
}

export const BookmarkButton = memo(BookmarkButtonComponent);
