import { memo, useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAIMemory } from "@/hooks/useAIMemory";
import { toast } from "@/hooks/use-toast";

interface FeedbackButtonsProps {
  conceptContent: string;
  sessionId: string;
  onFeedbackGiven?: (type: 'positive' | 'negative') => void;
}

function FeedbackButtonsComponent({ conceptContent, sessionId, onFeedbackGiven }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const { saveMemory } = useAIMemory();

  // কনসেপ্ট থেকে মূল বৈশিষ্ট্য বের করা
  const extractKeyFeatures = (content: string) => {
    const features: Record<string, string> = {};
    
    // Setting থেকে
    const settingMatch = content.match(/Setting:\s*([\s\S]*?)(?=Characters:|$)/i);
    if (settingMatch) {
      const settingText = settingMatch[1].substring(0, 200);
      features["setting_style"] = settingText;
    }

    // Camera distance
    const cameraMatch = content.match(/Camera Distance:\s*([^\n]+)/i);
    if (cameraMatch) {
      features["camera_preference"] = cameraMatch[1].trim();
    }

    // Mood/emotion
    const emotionMatch = content.match(/(mood|emotion|tone|atmosphere):\s*([^\n,]+)/i);
    if (emotionMatch) {
      features["mood_preference"] = emotionMatch[2].trim();
    }

    return features;
  };

  const handlePositiveFeedback = async () => {
    if (feedback === 'positive') {
      setFeedback(null);
      return;
    }
    const features = extractKeyFeatures(conceptContent);
    
    try {
      await saveMemory({
        memory_type: 'feedback',
        key: `positive_${Date.now()}`,
        value: `Liked this type of concept: ${conceptContent.substring(0, 300)}...`,
        weight: 0.8,
        context: sessionId,
      });

      if (features.setting_style) {
        await saveMemory({
          memory_type: 'style',
          key: 'preferred_setting',
          value: features.setting_style,
          weight: 0.7,
        });
      }

      toast({
        title: "👍 Feedback saved",
        description: "This preference has been added to memory.",
      });

      setFeedback('positive');
      onFeedbackGiven?.('positive');
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleNegativeFeedback = async () => {
    if (feedback === 'negative') {
      setFeedback(null);
      return;
    }
    const features = extractKeyFeatures(conceptContent);
    
    try {
      await saveMemory({
        memory_type: 'feedback',
        key: `negative_${Date.now()}`,
        value: `Disliked this type of concept: ${conceptContent.substring(0, 300)}...`,
        weight: 0.6,
        context: sessionId,
      });

      if (features.setting_style) {
        await saveMemory({
          memory_type: 'pattern',
          key: 'avoid_setting',
          value: `এই ধরনের setting এড়িয়ে চলুন: ${features.setting_style.substring(0, 100)}`,
          weight: 0.5,
        });
      }

      toast({
        title: "👎 Feedback saved",
        description: "This dislike has been added to memory.",
      });

      setFeedback('negative');
      onFeedbackGiven?.('negative');
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePositiveFeedback}
        className={cn(
          "h-8 px-3 gap-1.5 transition-all",
          feedback === 'positive'
            ? "bg-emerald-500/20 text-emerald-600"
            : "hover:bg-emerald-500/10 hover:text-emerald-500"
        )}
      >
        <ThumbsUp className={cn("w-4 h-4", feedback === 'positive' && "fill-current")} />
        <span className="text-xs">Like</span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNegativeFeedback}
        className={cn(
          "h-8 px-3 gap-1.5 transition-all",
          feedback === 'negative'
            ? "bg-red-500/20 text-red-600"
            : "hover:bg-red-500/10 hover:text-red-500"
        )}
      >
        <ThumbsDown className={cn("w-4 h-4", feedback === 'negative' && "fill-current")} />
        <span className="text-xs">Dislike</span>
      </Button>
    </div>
  );
}

export const FeedbackButtons = memo(FeedbackButtonsComponent);
