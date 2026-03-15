import { memo } from "react";
import { cn } from "@/lib/utils";

interface AgentVisualizerProps {
  activeAgents: string[];
  isStreaming: boolean;
}

const AGENTS = [
  { id: "A0", name: "Base Analyzer", batch: 1 },
  { id: "A1", name: "Creative Divergence", batch: 1 },
  { id: "A2", name: "Logic Validator", batch: 1 },
  { id: "A3", name: "Viral Probability", batch: 1 },
  { id: "A4", name: "Physics Engine", batch: 1 },
  { id: "A5", name: "Emotion Mapper", batch: 1 },
  { id: "A6", name: "Probability Matrix", batch: 2 },
  { id: "A7", name: "Coincidence Engine", batch: 2 },
  { id: "A8", name: "Timing Controller", batch: 2 },
  { id: "A9", name: "Environment Render", batch: 2 },
  { id: "A10", name: "Behavior Predictor", batch: 2 },
  { id: "A11", name: "Instinct Mapper", batch: 2 },
  { id: "A12", name: "Future Projector", batch: 2 },
  { id: "A13", name: "Anomaly Detector", batch: 3 },
  { id: "A14", name: "Safety Filter", batch: 3 },
  { id: "A15", name: "Genre Controller", batch: 3 },
  { id: "A16", name: "Atmosphere Engine", batch: 3 },
  { id: "A17", name: "Temporal Engine", batch: 3 },
  { id: "A18", name: "Dread Calculator", batch: 3 },
  { id: "A19", name: "Micro-Detail AI", batch: 3 },
];

function AgentVisualizerComponent({ activeAgents, isStreaming }: AgentVisualizerProps) {
  if (!isStreaming && activeAgents.length === 0) return null;

  const activeBatch = AGENTS.find(a => activeAgents.includes(a.id))?.batch || 0;
  const activeCount = activeAgents.length;

  return (
    <div className="glass-subtle border-b border-border/30 px-5 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full agent-pulse" />
            <span className="text-[9px] text-primary uppercase tracking-[0.2em] font-bold">
              ধারা ১৪.১ — Swarm Activity
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground font-mono">
            {activeCount > 0 ? `Batch ${activeBatch} — ${activeCount} entities active` : "Initializing..."}
          </span>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-10 gap-1.5">
          {AGENTS.map((agent) => {
            const isActive = activeAgents.includes(agent.id);
            return (
              <div
                key={agent.id}
                className={cn(
                  "relative flex flex-col items-center justify-center py-1.5 rounded-lg transition-all duration-300 group",
                  isActive
                    ? "bg-primary/10 border border-primary/25 shadow-sm"
                    : "bg-secondary/50 border border-transparent"
                )}
                title={`${agent.id}: ${agent.name}`}
              >
                <span className={cn(
                  "text-[9px] font-mono font-bold transition-all",
                  isActive ? "text-primary" : "text-muted-foreground/40"
                )}>
                  {agent.id}
                </span>
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full agent-pulse" />
                )}
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="px-2 py-1 rounded-lg bg-card border border-border text-[9px] text-foreground whitespace-nowrap shadow-lg">
                    {agent.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export const AgentVisualizer = memo(AgentVisualizerComponent);
