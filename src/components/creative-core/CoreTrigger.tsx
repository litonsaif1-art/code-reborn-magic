import { useState, useEffect, memo } from "react";
import { cn } from "@/lib/utils";

interface CoreTriggerProps {
  onTrigger: () => void;
  isStreaming: boolean;
  blueprintApproved: boolean;
}

const LAYERS = [
  { id: "viral", label: "Viral Hook", desc: "ভাইরাল হুক বিশ্লেষণ", color: "hsl(340 85% 60%)", glow: "hsl(340 85% 60% / 0.4)" },
  { id: "weakspot", label: "Weak-Spot", desc: "দুর্বল পয়েন্ট শনাক্তকরণ", color: "hsl(45 90% 55%)", glow: "hsl(45 90% 55% / 0.4)" },
  { id: "apex", label: "Apex Fidelity", desc: "শীর্ষ বিশ্বস্ততা যাচাই", color: "hsl(160 70% 45%)", glow: "hsl(160 70% 45% / 0.4)" },
  { id: "mutation", label: "80/20 Mutation", desc: "হাইপার-মিউটেশন প্রয়োগ", color: "hsl(270 80% 65%)", glow: "hsl(270 80% 65% / 0.4)" },
];

function CoreTriggerComponent({ onTrigger, isStreaming, blueprintApproved }: CoreTriggerProps) {
  const [activeLayer, setActiveLayer] = useState(-1);

  useEffect(() => {
    if (!isStreaming) {
      setActiveLayer(-1);
      return;
    }
    let idx = 0;
    const interval = setInterval(() => {
      setActiveLayer(idx % LAYERS.length);
      idx++;
    }, 1200);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const disabled = !blueprintApproved || isStreaming;
  const activeColor = isStreaming && activeLayer >= 0 ? LAYERS[activeLayer].color : undefined;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The Power Button */}
      <div className="relative">
        {/* Outer glow rings during processing */}
        {isStreaming && (
          <>
            <span
              className="absolute -inset-3 rounded-full animate-ping"
              style={{
                background: `radial-gradient(circle, ${activeColor || "hsl(var(--primary))"} 0%, transparent 70%)`,
                opacity: 0.15,
              }}
            />
            <span
              className="absolute -inset-2 rounded-full"
              style={{
                background: `conic-gradient(from 0deg, hsl(340 85% 60%), hsl(45 90% 55%), hsl(160 70% 45%), hsl(270 80% 65%), hsl(340 85% 60%))`,
                opacity: 0.3,
                animation: "spin 3s linear infinite",
              }}
            />
            <span
              className="absolute -inset-1.5 rounded-full"
              style={{ background: "hsl(var(--background))" }}
            />
          </>
        )}
        <button
          onClick={onTrigger}
          disabled={disabled}
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
            "font-mono text-2xl font-black",
            disabled && !isStreaming
              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-40"
              : !isStreaming
              ? "bg-gradient-to-br from-primary to-accent text-primary-foreground hover:scale-105 active:scale-95 shadow-lg shadow-primary/25 cursor-pointer hover-glow"
              : ""
          )}
          style={isStreaming ? {
            background: `conic-gradient(from 0deg, hsl(340 85% 60%), hsl(45 90% 55%), hsl(160 70% 45%), hsl(270 80% 65%), hsl(340 85% 60%))`,
            color: "white",
            boxShadow: `0 0 30px -5px ${activeColor || "hsl(270 80% 65% / 0.5)"}, 0 0 60px -10px ${activeColor || "hsl(340 85% 60% / 0.3)"}`,
            animation: "spin 4s linear infinite reverse",
          } : undefined}
        >
          {/* Inner spinning ring */}
          {isStreaming && (
            <span 
              className="absolute inset-1 rounded-full"
              style={{ background: "hsl(var(--background) / 0.85)", backdropFilter: "blur(4px)" }}
            />
          )}
          <span className="relative z-10" style={isStreaming ? { 
            background: `linear-gradient(135deg, hsl(340 85% 60%), hsl(270 80% 65%))`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 8px hsl(270 80% 65% / 0.5))",
          } : undefined}>0</span>
        </button>
      </div>

      <span 
        className="text-[9px] uppercase tracking-[0.2em] font-bold text-center transition-all duration-500"
        style={isStreaming ? {
          background: `linear-gradient(90deg, hsl(340 85% 60%), hsl(45 90% 55%), hsl(160 70% 45%), hsl(270 80% 65%))`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s linear infinite",
        } : { color: "hsl(var(--muted-foreground))" }}
      >
        {isStreaming ? "PROCESSING" : blueprintApproved ? "CORE TRIGGER" : "BLUEPRINT REQUIRED"}
      </span>

      {/* Internal Reasoning Visualizer — 4 Layers with premium colors */}
      {isStreaming && (
        <div className="w-full max-w-xs space-y-2">
          {LAYERS.map((layer, idx) => {
            const isActive = activeLayer === idx;
            const isDone = activeLayer > idx;
            return (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] transition-all duration-500",
                  isActive && "scale-[1.02]",
                )}
                style={{
                  borderColor: isActive ? layer.color : isDone ? `${layer.color}50` : "hsl(var(--border))",
                  background: isActive 
                    ? `linear-gradient(135deg, ${layer.color}15, ${layer.color}08)` 
                    : isDone 
                    ? `linear-gradient(135deg, ${layer.color}08, transparent)`
                    : "hsl(var(--card))",
                  boxShadow: isActive ? `0 0 20px -6px ${layer.glow}, inset 0 1px 0 ${layer.color}20` : "none",
                  color: isActive ? layer.color : isDone ? layer.color : "hsl(var(--muted-foreground) / 0.5)",
                }}
              >
                <span 
                  className={cn(
                    "w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-500",
                    isActive && "agent-pulse"
                  )}
                  style={{
                    background: isActive || isDone ? layer.color : "hsl(var(--muted))",
                    boxShadow: isActive ? `0 0 10px ${layer.glow}` : "none",
                  }}
                />
                <span className="font-bold uppercase tracking-wider">{layer.label}</span>
                <span className="text-[9px] ml-auto" style={{ opacity: isActive ? 0.8 : 0.5 }}>{layer.desc}</span>
                {isDone && (
                  <span className="text-[8px] font-bold" style={{ color: layer.color }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const CoreTrigger = memo(CoreTriggerComponent);
