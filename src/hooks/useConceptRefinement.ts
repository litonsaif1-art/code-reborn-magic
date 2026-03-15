import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { shouldShowToast } from "@/utils/toastDedup";

export interface LineFix {
  original: string;
  replacement: string;
  reason: string;
}

export interface ConceptReport {
  conceptNumber: number;
  originalStrengths: string;
  originalWeaknesses: string;
  viralBlockers: string;
  algorithmIssues: string;
  viewerDropPoint: string;
  hookStrength: number;
  selfCritique: string;
  refineFix: string;
  originalScore: number;
  refinementSuccess: boolean;
  attackerLineFixes?: LineFix[];
  defenderLineFixes?: LineFix[];
}

export interface ThemeExtraction {
  fixedTheme: string;
  coreWorkflow: string;
  centralAttraction: string;
}

export interface ThemeVariation {
  id: number;
  title: string;
  description: string;
  blueprintSuggestion: string;
}

export interface Accusation {
  conceptNumber: number;
  weaknesses: string;
  viralBlockers: string;
  algorithmIssues: string;
  viewerDropPoint: string;
  hookStrength: number;
  overallScore: number;
  rawRealismScore: number;
  cgiRisk: string;
  rivalConcept?: string;
  lineFixes?: LineFix[];
}

export interface SelfDefenseItem {
  conceptNumber: number;
  improvements: string;
  hookStrength: string;
  viralFactor: string;
  coreStrength?: string;
  counterAttack?: string;
  lineFixes?: LineFix[];
}

export interface Verdict {
  creationScore: number;
  refineScore: number;
  winner: string;
  reason: string;
  recurringIssues?: string[];
}

export interface RoundHistoryEntry {
  round: number;
  creationScore: number;
  refineScore: number;
  winner: string;
  recurringIssues: string[];
}

export interface RefinementResult {
  totalAnalyzed: number;
  refinedCount: number;
  combinedOutput: string;
  conceptReports: ConceptReport[];
  themeExtraction: ThemeExtraction;
  themeVariations: ThemeVariation[];
  mode: string;
  previousMode: string | null;
  isModeSwitch: boolean;
  accusations: Accusation[];
  selfDefense: SelfDefenseItem[];
  verdict: Verdict;
  themeImprovements: ThemeVariation[];
  accusationContext: string;
}

export function useConceptRefinement() {
  const [isRefining, setIsRefining] = useState(false);
  const [result, setResult] = useState<RefinementResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundHistoryEntry[]>([]);

  const refine = useCallback(async (
    concepts: string[],
    blueprintContent: string,
    logicDirectives: string,
    sessionId: string,
    mode: "creation" | "refine" = "refine",
    previousMode: string | null = null,
    model?: string,
    forceProvider?: "gemini" | "lovable",
    refineSubMode?: string
  ): Promise<RefinementResult | null> => {
    setIsRefining(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("refine-concepts", {
        body: { concepts, blueprintContent, logicDirectives, sessionId, mode, previousMode, roundHistory, model, forceProvider, refineSubMode },
      });

      if (fnError) {
        const msg = fnError.message || "Refinement failed";
        setError(msg);
        if (shouldShowToast("refinement-error")) toast({ title: "❌ রিফাইনমেন্ট ব্যর্থ", description: msg, variant: "destructive" });
        return null;
      }

      if (data?.success) {
        const refinementResult: RefinementResult = {
          totalAnalyzed: data.totalAnalyzed || concepts.length,
          refinedCount: data.refinedCount || 5,
          combinedOutput: data.combinedOutput || "",
          conceptReports: data.conceptReports || [],
          themeExtraction: data.themeExtraction || { fixedTheme: "", coreWorkflow: "", centralAttraction: "" },
          themeVariations: data.themeVariations || [],
          mode: data.mode || mode,
          previousMode: data.previousMode || previousMode,
          isModeSwitch: data.isModeSwitch || false,
          accusations: data.accusations || [],
          selfDefense: data.selfDefense || [],
          verdict: data.verdict || { creationScore: 0, refineScore: 0, winner: "", reason: "", recurringIssues: [] },
          themeImprovements: data.themeImprovements || [],
          accusationContext: data.accusationContext || "",
        };
        setResult(refinementResult);

        // Add to round history for memory tracking
        if (refinementResult.verdict.winner) {
          const newEntry: RoundHistoryEntry = {
            round: roundHistory.length + 1,
            creationScore: refinementResult.verdict.creationScore,
            refineScore: refinementResult.verdict.refineScore,
            winner: refinementResult.verdict.winner,
            recurringIssues: refinementResult.verdict.recurringIssues || [],
          };
          setRoundHistory(prev => [...prev, newEntry]);
        }

        const modeLabel = mode === "creation" ? "Creation Mode" : "Refine Mode";
        toast({
          title: `✅ ${modeLabel} সম্পন্ন`,
          description: refinementResult.isModeSwitch
            ? `প্রতিদ্বন্দ্বিতা সম্পন্ন — বিজয়ী: ${refinementResult.verdict.winner === "creation" ? "Creation" : "Refine"}`
            : "উন্নত কনসেপ্ট তৈরি হয়েছে",
        });
        return refinementResult;
      }

      const errMsg = data?.error || "Unknown error";
      setError(errMsg);
      if (shouldShowToast("refinement-data-error")) toast({ title: "❌ ত্রুটি", description: errMsg, variant: "destructive" });
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      if (shouldShowToast("refinement-catch-error")) toast({ title: "❌ ত্রুটি", description: msg, variant: "destructive" });
      return null;
    } finally {
      setIsRefining(false);
    }
  }, [roundHistory]);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const clearHistory = useCallback(() => {
    setRoundHistory([]);
  }, []);

  return { isRefining, result, error, refine, clearResult, roundHistory, clearHistory };
}
