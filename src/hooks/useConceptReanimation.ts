import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { shouldShowToast } from "@/utils/toastDedup";

export interface ReanimationResult {
  original: string;
  reanimated: string;
  changes: string[];
}

export interface ReanimationResponse {
  totalProcessed: number;
  totalReanimated: number;
  reanimatedConcepts: ReanimationResult[];
  combinedOutput: string;
  mode: string;
}

export function useConceptReanimation() {
  const [isReanimating, setIsReanimating] = useState(false);
  const [result, setResult] = useState<ReanimationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reanimate = useCallback(async (
    concepts: string[],
    sessionId: string,
    mode: "full" | "diagnose_only" = "full"
  ): Promise<ReanimationResponse | null> => {
    setIsReanimating(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("concept-reanimation", {
        body: { concepts, sessionId, mode },
      });

      if (fnError) {
        const msg = fnError.message || "Reanimation failed";
        setError(msg);
        if (shouldShowToast("reanimation-error")) toast({ title: "❌ Reanimation ব্যর্থ", description: msg, variant: "destructive" });
        return null;
      }

      if (data?.success) {
        const res: ReanimationResponse = {
          totalProcessed: data.totalProcessed,
          totalReanimated: data.totalReanimated,
          reanimatedConcepts: data.reanimatedConcepts || [],
          combinedOutput: data.combinedOutput || "",
          mode: data.mode || mode,
        };
        setResult(res);
        toast({
          title: `🧬 Reanimation সম্পন্ন`,
          description: `${res.totalReanimated}/${res.totalProcessed} কনসেপ্ট পুনর্জীবিত হয়েছে`,
        });
        return res;
      }

      const errMsg = data?.error || "Unknown error";
      setError(errMsg);
      if (shouldShowToast("reanimation-data-error")) toast({ title: "❌ ত্রুটি", description: errMsg, variant: "destructive" });
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      if (shouldShowToast("reanimation-catch-error")) toast({ title: "❌ ত্রুটি", description: msg, variant: "destructive" });
      return null;
    } finally {
      setIsReanimating(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { isReanimating, result, error, reanimate, clearResult };
}
