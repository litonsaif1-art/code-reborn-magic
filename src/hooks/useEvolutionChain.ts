import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ConceptScore } from "./useConceptScoring";

export interface EvolvedConcept {
  variant: number;
  content: string;
  evolutionType: string;
}

export interface EvolutionChain {
  id: string;
  sessionId: string;
  parentConcept: string;
  generation: number;
  evolvedConcepts: EvolvedConcept[];
  scores: (ConceptScore & { variant: number; hook_power?: number; emotional_depth?: number; uniqueness_index?: number; rewatch_value?: number })[];
  bestVariantIndex: number;
  createdAt: string;
  parentChainId?: string;
  parentVariant?: number;
  qualityTrajectory: number[];
  minQualityFloor: number;
  knowledgeExtracted: boolean;
  audiencePersona: string;
}

export interface FusionResult {
  fusedConcept: string;
  scores: any;
  sourceCount: number;
}

export function useEvolutionChain() {
  const [isEvolving, setIsEvolving] = useState(false);
  const [isFusing, setIsFusing] = useState(false);
  const [chains, setChains] = useState<EvolutionChain[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastFusion, setLastFusion] = useState<FusionResult | null>(null);

  const evolve = useCallback(async (
    parentConcept: string,
    sessionId: string,
    numVariants: number = 5,
    parentChainId?: string,
    parentVariant?: number,
    audiencePersona: string = "global",
    evolutionType: string = "oxygen_core",
    blueprintDna: string = ""
  ): Promise<EvolutionChain | null> => {
    setIsEvolving(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("evolve-concept", {
        body: { parentConcept, sessionId, numVariants, parentChainId, parentVariant, audiencePersona, evolutionType, blueprintDna },
      });

      if (fnError) {
        setError(fnError.message);
        return null;
      }

      if (data?.success) {
        const chain: EvolutionChain = {
          id: data.chainId || `local-${Date.now()}`,
          sessionId,
          parentConcept,
          generation: data.generation || chains.length + 1,
          evolvedConcepts: data.evolvedConcepts || [],
          scores: data.scores || [],
          bestVariantIndex: data.bestVariantIndex ?? 0,
          createdAt: new Date().toISOString(),
          parentChainId,
          parentVariant,
          qualityTrajectory: data.qualityTrajectory || [],
          minQualityFloor: data.qualityFloor || 0,
          knowledgeExtracted: false,
          audiencePersona: data.audiencePersona || "global",
        };
        setChains(prev => [...prev, chain]);
        return chain;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsEvolving(false);
    }
  }, [chains.length]);

  const fuseConcepts = useCallback(async (
    conceptIds: string[],
    sessionId: string
  ): Promise<FusionResult | null> => {
    setIsFusing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("concept-fusion", {
        body: { conceptIds, sessionId },
      });

      if (fnError) {
        setError(fnError.message);
        return null;
      }

      if (data?.success) {
        const result: FusionResult = {
          fusedConcept: data.fusedConcept,
          scores: data.scores,
          sourceCount: data.sourceCount,
        };
        setLastFusion(result);
        return result;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    } finally {
      setIsFusing(false);
    }
  }, []);

  const fetchChainHistory = useCallback(async (sessionId: string, parentConcept?: string): Promise<EvolutionChain[]> => {
    try {
      let query = supabase
        .from("evolution_chains")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (parentConcept) {
        query = query.eq("parent_concept", parentConcept);
      }

      const { data, error: dbError } = await query;
      if (dbError) return [];

      const history = (data || []).map((row: any) => ({
        id: row.id,
        sessionId: row.session_id,
        parentConcept: row.parent_concept,
        generation: row.generation,
        evolvedConcepts: row.evolved_concepts as EvolvedConcept[],
        scores: row.scores as any[],
        bestVariantIndex: row.best_variant_index,
        createdAt: row.created_at,
        parentChainId: row.parent_chain_id || undefined,
        parentVariant: row.parent_variant ?? undefined,
        qualityTrajectory: (row.quality_trajectory as number[]) || [],
        minQualityFloor: row.min_quality_floor || 0,
        knowledgeExtracted: row.knowledge_extracted || false,
        audiencePersona: row.audience_persona || "global",
      }));

      if (history.length > 0) {
        setChains(prev => {
          const all = [...prev, ...history];
          const seen = new Set<string>();
          return all.filter(c => { if (seen.has(c.id)) return false; seen.add(c.id); return true; });
        });
      }
      return history;
    } catch {
      return [];
    }
  }, []);

  const clearAllChains = useCallback(() => {
    setChains([]);
    setError(null);
    setLastFusion(null);
  }, []);

  const currentChain = chains.length > 0 ? chains[chains.length - 1] : null;
  const globalTrajectory = chains.flatMap(c => c.qualityTrajectory).filter(Boolean);
  const currentQualityFloor = chains.reduce((max, c) => Math.max(max, c.minQualityFloor), 0);

  return {
    isEvolving,
    isFusing,
    chains,
    currentChain,
    error,
    evolve,
    fuseConcepts,
    fetchChainHistory,
    clearAllChains,
    globalTrajectory,
    currentQualityFloor,
    lastFusion,
  };
}
