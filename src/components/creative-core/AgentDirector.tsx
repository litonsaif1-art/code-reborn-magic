import { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { 
  Brain, ChevronDown, ChevronUp, Cpu, Eye, EyeOff, 
  CheckCircle2, Loader2, Circle, Zap, Settings2, 
  Gauge, Bot
} from "lucide-react";
import type { AgentStep, AgentThought, ModelDecision, AutonomyMode, AgentScoreResult } from "@/hooks/useAgentOrchestrator";

interface AgentDirectorProps {
  isRunning: boolean;
  steps: AgentStep[];
  thoughts: AgentThought[];
  modelDecisions: ModelDecision[];
  currentStep: string | null;
  scoreResult: AgentScoreResult | null;
  qualityGatePassed: boolean | null;
  autonomyMode: AutonomyMode;
  onAutonomyChange: (mode: AutonomyMode) => void;
}

const AUTONOMY_LABELS: Record<AutonomyMode, { label: string; labelBn: string; icon: typeof Zap }> = {
  full_auto: { label: "Full Auto", labelBn: "সম্পূর্ণ স্বয়ংক্রিয়", icon: Zap },
  semi_auto: { label: "Semi Auto", labelBn: "আংশিক স্বয়ংক্রিয়", icon: Settings2 },
  step_by_step: { label: "Step-by-Step", labelBn: "ধাপে ধাপে", icon: Gauge },
};

function StepIcon({ status }: { status: AgentStep["status"] }) {
  switch (status) {
    case "done": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
    case "running": return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
    case "skipped": return <Circle className="w-3.5 h-3.5 text-muted-foreground/30" />;
    default: return <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />;
  }
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[9px] font-mono font-bold text-foreground w-6 text-right">{value}</span>
    </div>
  );
}

function AgentDirectorComponent({
  isRunning, steps, thoughts, modelDecisions, currentStep,
  scoreResult, qualityGatePassed, autonomyMode, onAutonomyChange,
}: AgentDirectorProps) {
  const [expanded, setExpanded] = useState(true);
  const [showThoughts, setShowThoughts] = useState(true);
  const thoughtsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    thoughtsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thoughts.length]);

  // Auto-expand when running
  useEffect(() => {
    if (isRunning) setExpanded(true);
  }, [isRunning]);

  const hasActivity = isRunning || steps.length > 0 || thoughts.length > 0;
  if (!hasActivity) {
    // Show compact mode selector
    return (
      <div className="glass-subtle border-b border-border/30 px-5 py-2.5 backdrop-blur-md bg-background/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Creative Director</span>
          </div>
          <div className="flex items-center gap-1">
            {(Object.keys(AUTONOMY_LABELS) as AutonomyMode[]).map((mode) => {
              const { label, icon: Icon } = AUTONOMY_LABELS[mode];
              return (
                <button
                  key={mode}
                  onClick={() => onAutonomyChange(mode)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all",
                    autonomyMode === mode
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-subtle border-b border-border/30 backdrop-blur-md bg-background/90 shadow-lg">
      {/* Header */}
      <div className="px-5 py-2.5 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <Brain className={cn("w-4 h-4", isRunning ? "text-primary animate-pulse" : "text-primary")} />
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
            AI Creative Director
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="w-1.5 h-1.5 bg-primary rounded-full agent-pulse" />
              <span className="text-[9px] text-primary font-medium">কাজ করছে...</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Autonomy Mode Badge */}
          <span className="text-[9px] text-muted-foreground px-2 py-0.5 rounded bg-secondary">
            {AUTONOMY_LABELS[autonomyMode].labelBn}
          </span>
          {/* Steps progress */}
          {steps.length > 0 && (
            <span className="text-[9px] text-muted-foreground font-mono">
              {steps.filter(s => s.status === "done").length}/{steps.length}
            </span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-3 max-w-4xl mx-auto">
          {/* Steps Progress */}
          {steps.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {steps.map((step) => (
                <div key={step.id} className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] border transition-all",
                  step.status === "running" ? "bg-primary/10 border-primary/30 text-primary font-medium" :
                  step.status === "done" ? "bg-green-500/5 border-green-500/20 text-green-600" :
                  "bg-secondary/50 border-border/30 text-muted-foreground"
                )}>
                  <StepIcon status={step.status} />
                  <span>{step.nameBn}</span>
                </div>
              ))}
            </div>
          )}

          {/* Thoughts Stream */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Agent Thinking</span>
            <button onClick={(e) => { e.stopPropagation(); setShowThoughts(!showThoughts); }} className="text-muted-foreground hover:text-foreground">
              {showThoughts ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
          </div>

          {showThoughts && thoughts.length > 0 && (
            <div className="max-h-40 overflow-y-auto scrollbar-thin bg-card/50 rounded-lg border border-border/30 p-2 mb-3 space-y-1">
              {thoughts.map((t) => (
                <div key={t.id} className={cn(
                  "text-[10px] leading-relaxed py-0.5",
                  t.type === "model_decision" ? "text-accent font-medium" :
                  t.type === "score" ? "text-primary font-bold" :
                  "text-muted-foreground"
                )}>
                  {t.text}
                </div>
              ))}
              <div ref={thoughtsEndRef} />
            </div>
          )}

          {/* Model Decisions */}
          {modelDecisions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {modelDecisions.map((d, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/5 border border-accent/20 text-[9px]">
                  <Cpu className="w-3 h-3 text-accent" />
                  <span className="text-accent font-medium">{d.task.replace(/_/g, " ")}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-foreground font-mono">{d.model.split("/")[1]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Score Result */}
          {scoreResult && (
            <div className="bg-card/50 rounded-lg border border-border/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">7D Score</span>
                <div className="flex items-center gap-1">
                  {qualityGatePassed !== null && (
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full",
                      qualityGatePassed ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                    )}>
                      {qualityGatePassed ? "✅ PASS" : "⚠️ WARNING"}
                    </span>
                  )}
                  <span className="text-sm font-black text-primary">{scoreResult.overall_score}</span>
                  <span className="text-[9px] text-muted-foreground">/100</span>
                </div>
              </div>
              <ScoreBar label="Hook" value={scoreResult.hook_power} color="bg-red-500" />
              <ScoreBar label="Viral" value={scoreResult.virality_score} color="bg-orange-500" />
              <ScoreBar label="Creative" value={scoreResult.creativity_score} color="bg-purple-500" />
              <ScoreBar label="Emotion" value={scoreResult.emotional_depth} color="bg-pink-500" />
              <ScoreBar label="Unique" value={scoreResult.uniqueness_index} color="bg-blue-500" />
              <ScoreBar label="Rewatch" value={scoreResult.rewatch_value} color="bg-green-500" />
              <ScoreBar label="Coherent" value={scoreResult.coherence_score} color="bg-teal-500" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const AgentDirector = memo(AgentDirectorComponent);
