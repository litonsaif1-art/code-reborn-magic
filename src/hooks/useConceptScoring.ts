import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { shouldShowToast } from "@/utils/toastDedup";

export interface ConceptScore {
  id?: string;
  session_id: string;
  concept_text: string;
  creativity_score: number;
  coherence_score: number;
  virality_score: number;
  overall_score: number;
  ai_feedback: string;
  hook_power?: number;
  emotional_depth?: number;
  uniqueness_index?: number;
  rewatch_value?: number;
  hook_analysis?: string;
  dna_elements?: { element: string; strength: number; category: string }[];
  created_at?: string;
}

export function useConceptScoring() {
  const [isScoring, setIsScoring] = useState(false);
  const [currentScore, setCurrentScore] = useState<ConceptScore | null>(null);

  const scoreConceptText = useCallback(async (
    conceptText: string,
    sessionId: string
  ): Promise<ConceptScore | null> => {
    if (!conceptText.includes("Setting:") || !conceptText.includes("Characters:")) {
      return null;
    }

    setIsScoring(true);
    try {
      const { data, error } = await supabase.functions.invoke("concept-scorer", {
        body: { concept_text: conceptText, session_id: sessionId },
      });

      if (error) throw error;

      if (data.scores) {
        const score: ConceptScore = {
          id: data.saved_id,
          session_id: sessionId,
          concept_text: conceptText,
          creativity_score: data.scores.creativity_score,
          coherence_score: data.scores.coherence_score,
          virality_score: data.scores.virality_score,
          overall_score: data.scores.overall_score,
          ai_feedback: data.scores.ai_feedback,
          hook_power: data.scores.hook_power,
          emotional_depth: data.scores.emotional_depth,
          uniqueness_index: data.scores.uniqueness_index,
          rewatch_value: data.scores.rewatch_value,
          hook_analysis: data.scores.hook_analysis,
          dna_elements: data.scores.dna_elements,
        };
        setCurrentScore(score);
        return score;
      }
      return null;
    } catch (err) {
      console.error("Scoring error:", err);
      if (shouldShowToast("scoring-error")) toast({
        title: "⚠️ স্কোরিং ব্যর্থ",
        description: "কনসেপ্ট স্কোর করতে সমস্যা হয়েছে।",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsScoring(false);
    }
  }, []);

  const fetchSessionScores = useCallback(async (sessionId: string): Promise<ConceptScore[]> => {
    try {
      const { data, error } = await supabase
        .from("concept_scores")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Fetch scores error:", err);
      return [];
    }
  }, []);

  const clearScore = useCallback(() => {
    setCurrentScore(null);
  }, []);

  return {
    isScoring,
    currentScore,
    scoreConceptText,
    fetchSessionScores,
    clearScore,
  };
}
