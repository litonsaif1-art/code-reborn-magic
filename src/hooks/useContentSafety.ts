import { useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { shouldShowToast } from "@/utils/toastDedup";

export type SafetySeverity = "safe" | "low" | "medium" | "high";
export type SafetyCategory = "violence_gore" | "adult_sexual" | "hate_discrimination" | "misinformation_scams";

export interface FlaggedCategory {
  category: SafetyCategory;
  severity: "low" | "medium" | "high";
  reason: string;
}

export interface SafetyResult {
  safe: boolean;
  flaggedCategories: FlaggedCategory[];
  overallSeverity: SafetySeverity;
  summary: string;
}

interface ContentSafetyState {
  isChecking: boolean;
  lastResult: SafetyResult | null;
  pendingContent: string | null;
  showWarning: boolean;
}

const SAFETY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-safety`;

export function useContentSafety() {
  const [state, setState] = useState<ContentSafetyState>({
    isChecking: false,
    lastResult: null,
    pendingContent: null,
    showWarning: false,
  });

  const checkContent = useCallback(async (content: string): Promise<SafetyResult | null> => {
    setState(prev => ({ ...prev, isChecking: true, pendingContent: content }));

    try {
      const response = await fetch(SAFETY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Safety check failed" }));
        
        if (response.status === 429) {
          if (shouldShowToast("safety-rate-limit")) toast({
            title: "⚠️ Rate Limit",
            description: "Safety check rate limit exceeded. Content will be shown without safety check.",
            variant: "destructive",
          });
          return null;
        }
        
        if (response.status === 402) {
          if (shouldShowToast("safety-credits")) toast({
            title: "⚠️ Credits Exhausted",
            description: "AI credits exhausted for safety checks.",
            variant: "destructive",
          });
          return null;
        }

        throw new Error(err.error || "Safety check failed");
      }

      const result: SafetyResult = await response.json();
      
      setState(prev => ({
        ...prev,
        lastResult: result,
        showWarning: !result.safe,
      }));

      return result;
    } catch (error) {
      console.error("Content safety check error:", error);
      // Fail open - don't block content if safety check fails
      return null;
    } finally {
      setState(prev => ({ ...prev, isChecking: false }));
    }
  }, []);

  const dismissWarning = useCallback(() => {
    setState(prev => ({ ...prev, showWarning: false, pendingContent: null }));
  }, []);

  const acknowledgeAndProceed = useCallback(() => {
    setState(prev => ({ ...prev, showWarning: false }));
    // Return the pending content to allow it through
    return state.pendingContent;
  }, [state.pendingContent]);

  const clearState = useCallback(() => {
    setState({
      isChecking: false,
      lastResult: null,
      pendingContent: null,
      showWarning: false,
    });
  }, []);

  return {
    ...state,
    checkContent,
    dismissWarning,
    acknowledgeAndProceed,
    clearState,
  };
}

// Category display helpers
export const CATEGORY_LABELS: Record<SafetyCategory, { label: string; labelBn: string; icon: string }> = {
  violence_gore: { label: "Violence & Gore", labelBn: "সহিংসতা ও রক্তপাত", icon: "⚔️" },
  adult_sexual: { label: "Adult/Sexual", labelBn: "প্রাপ্তবয়স্ক/যৌন", icon: "🔞" },
  hate_discrimination: { label: "Hate & Discrimination", labelBn: "ঘৃণা ও বৈষম্য", icon: "🚫" },
  misinformation_scams: { label: "Misinformation", labelBn: "ভুল তথ্য ও প্রতারণা", icon: "⚠️" },
};

export const SEVERITY_COLORS: Record<SafetySeverity, string> = {
  safe: "text-green-500",
  low: "text-yellow-500",
  medium: "text-orange-500",
  high: "text-red-500",
};

export const SEVERITY_BG: Record<SafetySeverity, string> = {
  safe: "bg-green-500/10 border-green-500/30",
  low: "bg-yellow-500/10 border-yellow-500/30",
  medium: "bg-orange-500/10 border-orange-500/30",
  high: "bg-red-500/10 border-red-500/30",
};
