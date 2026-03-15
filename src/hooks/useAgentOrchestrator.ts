import { useState, useCallback, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { shouldShowToast } from "@/utils/toastDedup";
import { loadPowerFeatures } from "@/components/creative-core/PowerFeaturesPanel";

export type AutonomyMode = "full_auto" | "semi_auto" | "step_by_step";

export interface AgentStep {
  id: string;
  name: string;
  nameBn: string;
  status: "pending" | "running" | "done" | "skipped";
}

export interface AgentThought {
  id: string;
  text: string;
  timestamp: number;
  type: "thinking" | "model_decision" | "score" | "quality" | "plan";
}

export interface ModelDecision {
  task: string;
  model: string;
  reason: string;
}

export interface AgentScoreResult {
  overall_score: number;
  hook_power: number;
  virality_score: number;
  creativity_score: number;
  emotional_depth: number;
  uniqueness_index: number;
  rewatch_value: number;
  coherence_score: number;
  ai_feedback?: string;
}

export interface AgentState {
  isRunning: boolean;
  steps: AgentStep[];
  thoughts: AgentThought[];
  modelDecisions: ModelDecision[];
  currentStep: string | null;
  conceptContent: string;
  scoreResult: AgentScoreResult | null;
  qualityGatePassed: boolean | null;
  autonomyMode: AutonomyMode;
}

const ORCHESTRATOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-orchestrator`;

export function useAgentOrchestrator() {
  const [state, setState] = useState<AgentState>({
    isRunning: false,
    steps: [],
    thoughts: [],
    modelDecisions: [],
    currentStep: null,
    conceptContent: "",
    scoreResult: null,
    qualityGatePassed: null,
    autonomyMode: "full_auto",
  });

  const abortRef = useRef<AbortController | null>(null);

  const addThought = useCallback((text: string, type: AgentThought["type"] = "thinking") => {
    setState(prev => ({
      ...prev,
      thoughts: [...prev.thoughts, { id: Date.now().toString(36), text, timestamp: Date.now(), type }],
    }));
  }, []);

  const setAutonomyMode = useCallback((mode: AutonomyMode) => {
    setState(prev => ({ ...prev, autonomyMode: mode }));
  }, []);

  const runAgent = useCallback(async (
    input: string,
    sessionId: string,
    blueprintContent: string,
    blueprintLocked: boolean,
    conversationHistory: { role: string; content: string }[],
    onConceptDelta?: (content: string) => void,
    onConceptFinal?: (content: string) => void,
    onBlueprintOutput?: (content: string) => void,
  ) => {
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({
      ...prev,
      isRunning: true,
      steps: [],
      thoughts: [],
      modelDecisions: [],
      currentStep: null,
      conceptContent: "",
      scoreResult: null,
      qualityGatePassed: null,
    }));

    try {
      const resp = await fetch(ORCHESTRATOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          input,
          sessionId,
          blueprintContent,
          blueprintLocked,
          autonomyMode: state.autonomyMode,
          conversationHistory: conversationHistory.slice(-15),
          powerFeatures: loadPowerFeatures(),
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        if (resp.status === 429) {
          if (shouldShowToast("agent-rate-limit")) toast({ title: "⏳ Rate Limit", description: "অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।", variant: "destructive" });
        } else if (resp.status === 402) {
          if (shouldShowToast("agent-credits")) toast({ title: "💳 Credits", description: "ক্রেডিট শেষ, টপ আপ করুন।", variant: "destructive" });
        }
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nlIdx);
          textBuffer = textBuffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const event = JSON.parse(jsonStr);
            handleSSEEvent(event, onConceptDelta, onConceptFinal, onBlueprintOutput);
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("[agent-orchestrator] Error:", err);
        setState(prev => ({ ...prev, isRunning: false }));
        if (shouldShowToast("agent-error")) toast({ title: "❌ Agent Error", description: err.message, variant: "destructive" });
      }
    }
  }, [state.autonomyMode]);

  const handleSSEEvent = useCallback((event: any,
    onConceptDelta?: (content: string) => void,
    onConceptFinal?: (content: string) => void,
    onBlueprintOutput?: (content: string) => void,
  ) => {
    switch (event.type) {
      case "thinking":
        setState(prev => ({
          ...prev,
          thoughts: [...prev.thoughts, { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 4), text: event.text, timestamp: Date.now(), type: "thinking" }],
        }));
        break;

      case "step_start":
        setState(prev => ({
          ...prev,
          currentStep: event.stepId,
          steps: prev.steps.map(s => s.id === event.stepId ? { ...s, status: "running" as const } : s),
        }));
        break;

      case "step_complete":
        setState(prev => ({
          ...prev,
          steps: prev.steps.map(s => s.id === event.stepId ? { ...s, status: "done" as const } : s),
        }));
        break;

      case "plan":
        setState(prev => ({
          ...prev,
          steps: event.steps.map((s: any) => ({ ...s, status: "pending" as const })),
        }));
        break;

      case "model_decision":
        setState(prev => ({
          ...prev,
          modelDecisions: [...prev.modelDecisions, { task: event.task, model: event.model, reason: event.reason }],
          thoughts: [...prev.thoughts, { id: Date.now().toString(36) + "m", text: `🤖 ${event.task}: ${event.model} — ${event.reason}`, timestamp: Date.now(), type: "model_decision" as const }],
        }));
        break;

      case "concept_delta":
        setState(prev => ({ ...prev, conceptContent: event.fullContent }));
        onConceptDelta?.(event.content);
        break;

      case "concept_final":
        setState(prev => ({ ...prev, conceptContent: event.content }));
        onConceptFinal?.(event.content);
        break;

      case "blueprint_output":
        onBlueprintOutput?.(event.content);
        break;

      case "score_result":
        setState(prev => ({
          ...prev,
          scoreResult: event.scores,
          thoughts: [...prev.thoughts, { id: Date.now().toString(36) + "s", text: `📊 Overall: ${event.scores.overall_score}/100`, timestamp: Date.now(), type: "score" as const }],
        }));
        break;

      case "quality_gate":
        setState(prev => ({
          ...prev,
          qualityGatePassed: event.passed,
        }));
        break;

      case "agent_done":
        setState(prev => ({ ...prev, isRunning: false }));
        break;

      case "error":
        setState(prev => ({ ...prev, isRunning: false }));
        if (shouldShowToast("agent-sse-error")) toast({ title: "❌ Agent Error", description: event.message, variant: "destructive" });
        break;
    }
  }, []);

  const stopAgent = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const clearState = useCallback(() => {
    setState(prev => ({
      ...prev,
      steps: [],
      thoughts: [],
      modelDecisions: [],
      currentStep: null,
      conceptContent: "",
      scoreResult: null,
      qualityGatePassed: null,
    }));
  }, []);

  return {
    ...state,
    setAutonomyMode,
    runAgent,
    stopAgent,
    clearState,
  };
}
